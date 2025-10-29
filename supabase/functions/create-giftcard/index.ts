import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GiftcardPayload {
  toName: string;
  fromName: string;
  message?: string;
  mode: 'amount' | 'service';
  amount?: number;
  serviceName?: string;
  servicePrice?: number;
  validTo?: string;
}

function generateCode(len = 10) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < len; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return `BB-${code}`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: GiftcardPayload = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (!payload.toName || !payload.fromName) {
      return new Response(JSON.stringify({ error: 'Manglende felter' }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 400 
      });
    }

    const mode = payload.mode === 'service' ? 'service' : 'amount';
    const amount = mode === 'service'
      ? (payload.servicePrice || 0)
      : (payload.amount || 0);

    if (amount <= 0) {
      return new Response(JSON.stringify({ error: 'Beløb skal være større end 0' }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 400 
      });
    }

    const validTo = payload.validTo 
      ? new Date(payload.validTo) 
      : new Date(new Date().setFullYear(new Date().getFullYear() + 2));

    // Create unique discount code
    let code = '';
    for (let tries = 0; tries < 5; tries++) {
      const attempt = generateCode(10);
      const { data: exists, error: existsErr } = await supabase
        .from('discount_codes')
        .select('id')
        .ilike('code', attempt)
        .maybeSingle();
      if (existsErr) break;
      if (!exists) { code = attempt; break; }
    }
    if (!code) code = generateCode(12);

    const { error: insertErr } = await supabase.from('discount_codes').insert({
      code,
      type: 'fixed',
      amount,
      currency: 'DKK',
      active: true,
      valid_to: validTo.toISOString(),
      min_amount: 0,
      max_redemptions: 1,
      per_user_limit: 1,
    });

    if (insertErr) {
      console.error('Insert giftcard error', insertErr);
      return new Response(JSON.stringify({ error: 'Kunne ikke oprette gavekort-kode' }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 500 
      });
    }

    return new Response(JSON.stringify({ ok: true, code }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
      status: 200 
    });
  } catch (e: any) {
    console.error('Giftcard create error', e);
    return new Response(JSON.stringify({ error: e.message || 'Uventet fejl' }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
      status: 500 
    });
  }
});
