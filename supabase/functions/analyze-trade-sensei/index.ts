import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function buildSystemPrompt(accountType: string, conversational: boolean): string {
  let accountContext = "";
  switch (accountType) {
    case "live":
      accountContext = "This is a LIVE account with real money. Prioritize capital preservation, stress management, and strict risk control.";
      break;
    case "funded":
      accountContext = "This is a FUNDED account (prop firm). Prioritize rule adherence, avoiding drawdown limits, and consistency.";
      break;
    case "demo":
      accountContext = "This is a DEMO account. Focus on habit-building, process over profits, and developing consistency.";
      break;
    default:
      accountContext = "Adapt your advice to general trading best practices.";
  }

  const base = `You are Sensei — a world-class Trading Psychologist and Risk Manager. You use a "tough love" approach: you celebrate discipline and ruthlessly call out emotional trading (FOMO, revenge trading, over-leveraging). You're witty, sharp, and deeply knowledgeable. You use trading terminology naturally (RR, liquidity, drawdown, edge, confluences).

${accountContext}`;

  if (conversational) {
    return `${base}

You are in a conversation with a trader. Answer their questions directly and concisely. Reference the trade context provided. Stay in character as Sensei — firm but supportive. Keep responses under 150 words unless the question requires more detail.`;
  }

  return `${base}

Analyze the trade data provided. Follow this structure:
1) Identify if the user followed their stated plan based on their notes.
2) Cross-reference the mood/mental state against the outcome — flag any emotional patterns.
3) Give one "⭐ Gold Star" for a good habit or disciplined behavior.
4) Give one "⬆️ Level Up" for a mistake or area of improvement.

Keep the response under 150 words. Be supportive but firm. Never sugarcoat. Use short, punchy sentences.`;
}

function buildTradeContext(tradeDetails: any, userNotes: string, userMood: string, screenshotUrl: string | null, accountType: string): string {
  let text = `Trade Details:
- Asset: ${tradeDetails.asset}
- Direction: ${tradeDetails.direction}
- Entry: ${tradeDetails.entry_price} → Exit: ${tradeDetails.exit_price}
- Pips: ${tradeDetails.pips > 0 ? "+" : ""}${tradeDetails.pips}
- P&L: ${tradeDetails.pnl >= 0 ? "+$" : "-$"}${Math.abs(tradeDetails.pnl).toFixed(2)}
- Position Size: ${tradeDetails.position_size} lots
- Account Type: ${accountType}

Mental State: ${userMood}
Trader's Notes: ${userNotes || "No notes provided."}`;

  if (screenshotUrl) {
    text += `\n[Chart Screenshot: ${screenshotUrl}]`;
  }
  return text;
}

async function callGeminiDirect(apiKey: string, systemPrompt: string, contents: any[]): Promise<Response> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:streamGenerateContent?alt=sse&key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents,
        generationConfig: { maxOutputTokens: 500, temperature: 0.8 },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`);
  }

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
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ choices: [{ delta: { content: text }, index: 0 }] })}\n\n`));
            }
          } catch { /* skip */ }
        }
      }
    },
  });

  return new Response(stream, {
    headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
  });
}

async function callLovableAI(apiKey: string, messages: any[]): Promise<Response> {
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages,
      stream: true,
    }),
  });

  if (!response.ok) {
    if (response.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again in a moment." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (response.status === 402) {
      return new Response(JSON.stringify({ error: "AI credits exhausted. Please top up." }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
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
    const body = await req.json();
    const { trade_details, user_notes, user_mood, screenshot_url, account_type, messages: chatMessages } = body;

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    const isConversation = Array.isArray(chatMessages) && chatMessages.length > 0;
    const effectiveAccountType = account_type || "unknown";
    const systemPrompt = buildSystemPrompt(effectiveAccountType, isConversation);

    // Build trade context string if trade details provided
    const tradeContext = trade_details
      ? buildTradeContext(trade_details, user_notes || "", user_mood || "", screenshot_url || null, effectiveAccountType)
      : null;

    if (GEMINI_API_KEY) {
      try {
        console.log("Using Gemini API key");
        let geminiContents: any[];

        if (isConversation) {
          // Multi-turn: inject trade context as first user message, then map chat history
          geminiContents = [];
          if (tradeContext) {
            geminiContents.push({ role: "user", parts: [{ text: `[Trade Context]\n${tradeContext}` }] });
            geminiContents.push({ role: "model", parts: [{ text: "Got it. I've reviewed the trade details. What would you like to discuss?" }] });
          }
          for (const msg of chatMessages) {
            geminiContents.push({
              role: msg.role === "assistant" ? "model" : "user",
              parts: [{ text: msg.content }],
            });
          }
        } else {
          // Single-shot critique
          const allText = tradeContext || "No trade details provided.";
          geminiContents = [{ role: "user", parts: [{ text: allText }] }];
        }

        return await callGeminiDirect(GEMINI_API_KEY, systemPrompt, geminiContents);
      } catch (e) {
        console.error("Gemini failed, falling back:", e);
      }
    }

    if (LOVABLE_API_KEY) {
      console.log("Using Lovable AI");
      let openaiMessages: any[];

      if (isConversation) {
        openaiMessages = [{ role: "system", content: systemPrompt }];
        if (tradeContext) {
          openaiMessages.push({ role: "user", content: `[Trade Context]\n${tradeContext}` });
          openaiMessages.push({ role: "assistant", content: "Got it. I've reviewed the trade details. What would you like to discuss?" });
        }
        openaiMessages.push(...chatMessages);
      } else {
        openaiMessages = [
          { role: "system", content: systemPrompt },
          { role: "user", content: tradeContext || "No trade details provided." },
        ];
      }

      return await callLovableAI(LOVABLE_API_KEY, openaiMessages);
    }

    throw new Error("No AI provider configured.");
  } catch (e) {
    console.error("analyze-trade-sensei error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
