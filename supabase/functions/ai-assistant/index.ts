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

KOMMUNIKATIONSSTIL - MEGET VIGTIGT:
- Svar KORT og DIREKTE - max 1-2 sætninger
- INGEN sniksnak, hilsner eller "Det er dejligt at høre fra dig"
- Gå DIREKTE til løsningen
- Nævn relevante nøgleord så systemet kan vise handlingsknapper (kalender, økonomi, booking, profil, jobs, kontakt osv.)
- Brug IKKE emojis

EKSEMPLER PÅ GODE SVAR:
- Spørgsmål: "Hvordan gemmer jeg en adresse?" → Svar: "Du kan gemme adresser under Mine adresser i din profil, eller automatisk når du booker."
- Spørgsmål: "Hvornår er momsfrist?" → Svar: "Næste momsfrist er 1. marts (Q4). Se din økonomi for detaljer."
- Spørgsmål: "Kan jeg tale med en medarbejder?" → Svar: "Ring +45 71 78 65 75 eller mail hello@beautyboosters.dk."

KONTAKTINFO (brug når relevant):
- Email: hello@beautyboosters.dk
- Telefon: +45 71 78 65 75
- Åbningstider: Man-fre 09-17, lør-søn 09-16

`;

    if (userRole === 'admin') {
      systemPrompt += `BRUGER: Admin. Kan hjælpe med: dashboard, bookings, jobs, boosters, økonomi, fakturering, rabatkoder.`;
    } else if (userRole === 'booster') {
      systemPrompt += `BRUGER: Booster (freelancer). Kan hjælpe med: kalender, jobs, økonomi, moms, profil, portfolio, beskeder.
MOMSFRISTER: Kvartals (Q1: 1/3, Q2: 1/6, Q3: 1/9, Q4: 1/12). Halvår (1H: 1/9, 2H: 1/3).`;
    } else {
      systemPrompt += `BRUGER: Kunde. Kan hjælpe med: booking, services, boosters, adresser, favoritter, gavekort, betaling.`;
    }

    if (currentPage) {
      systemPrompt += ` Nuværende side: ${currentPage}.`;
    }

    systemPrompt += ` Hvis du ikke ved svaret, henvis til kontakt.`;

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
