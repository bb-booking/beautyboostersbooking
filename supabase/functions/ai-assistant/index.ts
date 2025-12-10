import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, currentPage } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Determine user role server-side instead of trusting client
    let userRole = 'customer'; // Default to customer (most restricted)
    
    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      try {
        // Verify JWT and get user
        const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
          global: { headers: { Authorization: authHeader } }
        });
        
        const { data: { user } } = await supabaseAuth.auth.getUser();
        
        if (user) {
          // Use service role to check user's actual role from database
          const supabase = createClient(supabaseUrl, supabaseServiceKey);
          
          // Check admin role first
          const { data: adminRole } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id)
            .eq('role', 'admin')
            .single();
          
          if (adminRole) {
            userRole = 'admin';
          } else {
            // Check booster role
            const { data: boosterRole } = await supabase
              .from('user_roles')
              .select('role')
              .eq('user_id', user.id)
              .eq('role', 'booster')
              .single();
            
            if (boosterRole) {
              userRole = 'booster';
            }
            // Otherwise stays as 'customer'
          }
        }
      } catch (authError) {
        console.log('Auth check failed, defaulting to customer role:', authError);
        // Continue with customer role on auth failure
      }
    }

    // Build context-aware system prompt based on verified user role
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
