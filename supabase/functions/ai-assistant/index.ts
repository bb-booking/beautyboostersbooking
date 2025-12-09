import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, userRole, currentPage } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Build context-aware system prompt based on user role
    let systemPrompt = `Du er Betty, BeautyBoosters' AI-assistent.

REGLER - FØLG STRENGT:
1. MAX 1-2 korte sætninger
2. INGEN hilsner, emojis, "Hej igen", "Dejligt at høre"
3. Gå DIREKTE til svaret
4. Nævn nøgleord så knapper vises: ansøg, bliv booster, kalender, økonomi, booking, profil, jobs, kontakt, adresse, service

EKSEMPLER:
- "Vil gerne være booster" → "Du kan ansøge direkte via Bliv Booster."
- "Gemme adresse?" → "Gå til Mine adresser eller gem automatisk ved booking."
- "Momsfrist?" → "Næste frist: 1. marts. Se økonomi for detaljer."
- "Tale med nogen?" → "Ring +45 71 78 65 75 eller mail hello@beautyboosters.dk."
- "Book tid?" → "Vælg service og find en ledig booster."

KONTAKT: +45 71 78 65 75 / hello@beautyboosters.dk

`;

    if (userRole === 'admin') {
      systemPrompt += `ROLLE: Admin.`;
    } else if (userRole === 'booster') {
      systemPrompt += `ROLLE: Booster. MOMS: Q1:1/3, Q2:1/6, Q3:1/9, Q4:1/12.`;
    } else {
      systemPrompt += `ROLLE: Kunde.`;
    }

    if (currentPage) {
      systemPrompt += ` Side: ${currentPage}.`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "For mange anmodninger. Prøv igen om lidt." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI-kreditter opbrugt." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI-fejl. Prøv igen." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("AI assistant error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Ukendt fejl" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
