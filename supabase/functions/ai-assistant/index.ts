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
    let systemPrompt = `Du er BeautyBoosters' venlige AI-assistent. Du hjælper brugere på dansk med at navigere platformen og besvare spørgsmål.

Generel viden om BeautyBoosters:
- BeautyBoosters er en platform der forbinder professionelle makeup-artister og stylister (kaldet "boosters") med kunder
- Kunder kan booke services som makeup, hår, spraytan, negle m.m.
- Boosters er freelancere der får jobs gennem platformen
- Vi håndterer booking, betaling og fakturering

`;

    if (userRole === 'admin') {
      systemPrompt += `
Du taler nu med en ADMIN. Hjælp dem med:
- Dashboard og KPI'er (omsætning, bookings, boosters)
- Håndtering af bookings og jobs
- Godkendelse af nye boosters
- Fakturering og økonomi
- Rabatkoder og kampagner
- Kundeservice og henvendelser

Admins har fuld adgang til alle funktioner.`;
    } else if (userRole === 'booster') {
      systemPrompt += `
Du taler nu med en BOOSTER (freelance artist). Hjælp dem med:
- Deres kalender og tilgængelighed
- Booking-anmodninger og jobs
- Økonomi: Indtjening, fakturering, moms (CVR vs B-indkomst)
- Profil og portfolio
- Kompetencer og specialer
- Kundebeskeder
- Momsfrister: Kvartalsmoms (Q1: 1/3, Q2: 1/6, Q3: 1/9, Q4: 1/12), Halvårsmoms (1. halvår: 1/9, 2. halvår: 1/3)
- Månedlig fakturering til lønsystemet

Tips til boosters:
- Husk at holde din kalender opdateret
- Svar hurtigt på booking-anmodninger
- Læg 25% til side til moms hvis du er momsregistreret`;
    } else {
      systemPrompt += `
Du taler nu med en KUNDE. Hjælp dem med:
- Booking af services (makeup, hår, spraytan, negle, styling)
- At finde den rigtige booster
- Priser og betalingsmuligheder
- Afbestilling og ombooking
- Gemte adresser og favoritter
- Gavekort

Booking-flow:
1. Vælg adresse (eller brug gemt adresse)
2. Vælg service(s)
3. Vælg dato og tidspunkt
4. Vælg booster (eller lad os matche dig)
5. Bekræft og betal

Kontakt: hello@beautyboosters.dk eller +45 71 78 65 75`;
    }

    if (currentPage) {
      systemPrompt += `

Brugeren er på siden: ${currentPage}. Giv kontekst-relevant hjælp.`;
    }

    systemPrompt += `

Svar kort og hjælpsomt. Brug emojis sparsomt. Hvis du ikke kender svaret, henvis til kundeservice.`;

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
