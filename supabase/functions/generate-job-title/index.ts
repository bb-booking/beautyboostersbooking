import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { services, location, clientType } = await req.json();
    
    console.log("Generating job title for:", { services, location, clientType });

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const serviceNames = services.map((s: any) => s.service_name).join(", ");
    
    const systemPrompt = `Du er en assistent der laver korte, professionelle job titler på dansk til beauty bookings.

Regler:
- Max 50 tegn
- Inkluder primær service + lokation
- Gør det beskrivende og professionelt
- Brug dansk
- Ingen "Job:" eller lignende prefix`;

    const userPrompt = `Services: ${serviceNames}
Lokation: ${location}
Klient type: ${clientType === "privat" ? "Privat" : "Virksomhed"}

Lav en kort job titel.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "For mange anmodninger. Prøv igen om lidt." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Betalingsproblem. Kontakt support." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const generatedTitle = data.choices?.[0]?.message?.content?.trim() || "";
    
    console.log("Generated title:", generatedTitle);

    return new Response(
      JSON.stringify({ title: generatedTitle }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in generate-job-title:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Ukendt fejl" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
