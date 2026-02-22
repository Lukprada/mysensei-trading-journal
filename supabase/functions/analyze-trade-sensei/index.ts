import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function buildSystemPrompt(accountType: string): string {
  let accountContext = "";
  switch (accountType) {
    case "live":
      accountContext =
        "This is a LIVE account with real money on the line. Prioritize capital preservation, real-world stress management, and strict risk control. Be extra firm about position sizing and emotional discipline.";
      break;
    case "funded":
      accountContext =
        "This is a FUNDED account (e.g., FTMO/prop firm). Prioritize strict rule adherence, avoiding drawdown limits, and consistency over home runs. Warn about any behavior that could blow the challenge.";
      break;
    case "demo":
      accountContext =
        "This is a DEMO account. Focus on habit-building, process over profits, and developing consistency. Encourage treating it like real money but celebrate experimentation.";
      break;
    default:
      accountContext = "Adapt your advice to general trading best practices.";
  }

  return `You are Sensei — a world-class Trading Psychologist and Risk Manager. You use a "tough love" approach: you celebrate discipline and ruthlessly call out emotional trading (FOMO, revenge trading, over-leveraging). You're witty, sharp, and deeply knowledgeable. You use trading terminology naturally (RR, liquidity, drawdown, edge, confluences).

${accountContext}

Analyze the trade data provided. Follow this structure:
1) Identify if the user followed their stated plan based on their notes.
2) Cross-reference the mood/mental state against the outcome — flag any emotional patterns.
3) Give one "⭐ Gold Star" for a good habit or disciplined behavior.
4) Give one "⬆️ Level Up" for a mistake or area of improvement.

Keep the response under 150 words. Be supportive but firm. Never sugarcoat. Use short, punchy sentences.`;
}

function buildUserContent(tradeDetails: any, userNotes: string, userMood: string, screenshotUrl: string | null, accountType: string): any[] {
  const content: any[] = [
    {
      type: "text",
      text: `Trade Details:
- Asset: ${tradeDetails.asset}
- Direction: ${tradeDetails.direction}
- Entry: ${tradeDetails.entry_price} → Exit: ${tradeDetails.exit_price}
- Pips: ${tradeDetails.pips > 0 ? "+" : ""}${tradeDetails.pips}
- P&L: ${tradeDetails.pnl >= 0 ? "+$" : "-$"}${Math.abs(tradeDetails.pnl).toFixed(2)}
- Position Size: ${tradeDetails.position_size} lots
- Account Type: ${accountType}

Mental State: ${userMood}
Trader's Notes: ${userNotes || "No notes provided."}`,
    },
  ];

  if (screenshotUrl) {
    content.push({
      type: "image_url",
      image_url: { url: screenshotUrl },
    });
  }

  return content;
}

async function callGeminiDirect(apiKey: string, systemPrompt: string, userContent: any[]): Promise<Response> {
  // Use Gemini REST API directly with the user's key
  const textParts = userContent.filter((c: any) => c.type === "text").map((c: any) => ({ text: c.text }));
  const imageParts = userContent.filter((c: any) => c.type === "image_url").map((c: any) => ({
    inline_data: { mime_type: "image/jpeg", data: "" }, // URL-based not supported, pass as text hint
  }));

  // For vision, we'll include the screenshot URL as text since direct URL isn't supported in all Gemini endpoints
  const allText = userContent.map((c: any) => {
    if (c.type === "text") return c.text;
    if (c.type === "image_url") return `[Chart Screenshot: ${c.image_url.url}]`;
    return "";
  }).join("\n\n");

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:streamGenerateContent?alt=sse&key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: "user", parts: [{ text: allText }] }],
        generationConfig: { maxOutputTokens: 500, temperature: 0.8 },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`);
  }

  // Transform Gemini SSE to OpenAI-compatible SSE format
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      let buffer = "";
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
          break;
        }
        
        buffer += decoder.decode(value, { stream: true });
        let newlineIdx: number;
        while ((newlineIdx = buffer.indexOf("\n")) !== -1) {
          const line = buffer.slice(0, newlineIdx).trim();
          buffer = buffer.slice(newlineIdx + 1);
          
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6);
          if (!jsonStr) continue;
          
          try {
            const parsed = JSON.parse(jsonStr);
            const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              const openAiChunk = {
                choices: [{ delta: { content: text }, index: 0 }],
              };
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(openAiChunk)}\n\n`));
            }
          } catch {
            // skip
          }
        }
      }
    },
  });

  return new Response(stream, {
    headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
  });
}

async function callLovableAI(apiKey: string, systemPrompt: string, userContent: any[]): Promise<Response> {
  const response = await fetch(
    "https://ai.gateway.lovable.dev/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
        stream: true,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Lovable AI error: ${response.status}`);
  }

  return new Response(response.body, {
    headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { trade_details, user_notes, user_mood, screenshot_url, account_type } =
      await req.json();

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    const systemPrompt = buildSystemPrompt(account_type);
    const userContent = buildUserContent(trade_details, user_notes, user_mood, screenshot_url, account_type);

    // Try Gemini first (user's own key), fall back to Lovable AI
    if (GEMINI_API_KEY) {
      try {
        console.log("Using user's Gemini API key");
        return await callGeminiDirect(GEMINI_API_KEY, systemPrompt, userContent);
      } catch (e) {
        console.error("Gemini API failed, falling back to Lovable AI:", e);
      }
    }

    if (LOVABLE_API_KEY) {
      console.log("Using Lovable AI fallback");
      const resp = await callLovableAI(LOVABLE_API_KEY, systemPrompt, userContent);
      
      if (!resp.ok) {
        if (resp.status === 429) {
          return new Response(
            JSON.stringify({ error: "Rate limit exceeded. Try again in a moment." }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        if (resp.status === 402) {
          return new Response(
            JSON.stringify({ error: "AI credits exhausted. Please top up your workspace." }),
            { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        throw new Error(`Lovable AI error: ${resp.status}`);
      }
      
      return resp;
    }

    throw new Error("No AI provider configured. Add GEMINI_API_KEY or LOVABLE_API_KEY.");
  } catch (e) {
    console.error("analyze-trade-sensei error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
