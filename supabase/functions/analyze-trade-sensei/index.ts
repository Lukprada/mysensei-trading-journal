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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { trade_details, user_notes, user_mood, screenshot_url, account_type } =
      await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const userContent: any[] = [
      {
        type: "text",
        text: `Trade Details:
- Asset: ${trade_details.asset}
- Direction: ${trade_details.direction}
- Entry: ${trade_details.entry_price} → Exit: ${trade_details.exit_price}
- Pips: ${trade_details.pips > 0 ? "+" : ""}${trade_details.pips}
- P&L: ${trade_details.pnl >= 0 ? "+$" : "-$"}${Math.abs(trade_details.pnl).toFixed(2)}
- Position Size: ${trade_details.position_size} lots
- Account Type: ${account_type}

Mental State: ${user_mood}
Trader's Notes: ${user_notes || "No notes provided."}`,
      },
    ];

    // If screenshot URL provided, include it for vision analysis
    if (screenshot_url) {
      userContent.push({
        type: "image_url",
        image_url: { url: screenshot_url },
      });
    }

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: buildSystemPrompt(account_type) },
            { role: "user", content: userContent },
          ],
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please top up your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      return new Response(
        JSON.stringify({ error: "AI analysis failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("analyze-trade-sensei error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
