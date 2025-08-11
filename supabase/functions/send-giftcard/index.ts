import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GiftcardPayload {
  toName: string;
  toEmail: string;
  fromName: string;
  message?: string;
  mode: 'amount' | 'service';
  amount?: number; // in DKK
  serviceName?: string;
  servicePrice?: number; // optional, used if mode === 'service'
  validTo?: string; // ISO date string
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

    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Validate input
    if (!payload.toEmail || !payload.toName || !payload.fromName) {
      return new Response(JSON.stringify({ error: 'Manglende felter' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 });
    }

    const mode = payload.mode === 'service' ? 'service' : 'amount';
    const amount = mode === 'service'
      ? (payload.servicePrice || 0)
      : (payload.amount || 0);

    if (amount <= 0) {
      return new Response(JSON.stringify({ error: 'Beløb skal være større end 0' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 });
    }

    const validTo = payload.validTo ? new Date(payload.validTo) : new Date(new Date().setFullYear(new Date().getFullYear() + 2));

    // Create unique discount code acting as gift card (one-time use)
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
      return new Response(JSON.stringify({ error: 'Kunne ikke oprette gavekort-kode' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 });
    }

    const title = 'BeautyBoosters Gavekort';
    const prettyValidTo = validTo.toLocaleDateString('da-DK');

    const html = `
      <div style="font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; background:#f7f7f8; padding:24px;">
        <div style="max-width:640px; margin:0 auto; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 10px 30px rgba(0,0,0,0.06);">
          <div style="background:linear-gradient(135deg,#111827,#4b5563); color:#fff; padding:24px 28px;">
            <h1 style="margin:0;font-size:22px;">${title}</h1>
            <div style="opacity:.85; font-size:14px; margin-top:4px;">Til ${payload.toName} • Fra ${payload.fromName}</div>
          </div>
          <div style="padding:28px; color:#111827;">
            ${payload.message ? `<p style="margin:0 0 16px 0; line-height:1.6;">${payload.message}</p>` : ''}
            <div style="display:flex; gap:16px; flex-wrap:wrap; margin:20px 0;">
              <div style="flex:1; min-width:220px; background:#f3f4f6; border-radius:12px; padding:16px;">
                <div style="font-size:12px; color:#6b7280;">Gavekortkode</div>
                <div style="font-size:20px; font-weight:700; letter-spacing:1px; margin-top:4px;">${code}</div>
              </div>
              <div style="flex:1; min-width:220px; background:#f3f4f6; border-radius:12px; padding:16px;">
                <div style="font-size:12px; color:#6b7280;">Gyldig til</div>
                <div style="font-size:20px; font-weight:700; margin-top:4px;">${prettyValidTo}</div>
              </div>
            </div>
            <div style="background:#fafafa; border:1px solid #f0f0f0; border-radius:12px; padding:16px; margin-top:4px;">
              ${mode === 'service' ? `
                <div style="font-size:14px; color:#374151;">Gælder til service:</div>
                <div style="font-size:18px; font-weight:700; margin-top:4px;">${payload.serviceName || 'Valgfri service'}</div>
                ${payload.servicePrice ? `<div style=\"font-size:14px;color:#6b7280;margin-top:2px;\">Værdi: ${payload.servicePrice} DKK</div>` : ''}
              ` : `
                <div style="font-size:14px; color:#374151;">Gavekort beløb:</div>
                <div style="font-size:28px; font-weight:800; margin-top:4px;">${amount} DKK</div>
              `}
            </div>
            <div style="margin-top:20px; font-size:13px; color:#6b7280; line-height:1.6;">
              Sådan indløses gavekortet: Indtast koden i feltet "Rabatkode" ved checkout på beautyboosters.dk
            </div>
          </div>
          <div style="padding:16px 28px; background:#ffffff; border-top:1px solid #f3f4f6; color:#6b7280; font-size:12px;">
            BeautyBoosters • Gavekortet er gyldigt til og med ${prettyValidTo}. Ikke-refunderbart. 
          </div>
        </div>
      </div>
    `;

    const primaryFrom = Deno.env.get('RESEND_FROM') || 'BeautyBoosters <noreply@beautyboosters.dk>';
    let { error: emailErr } = await resend.emails.send({
      from: primaryFrom,
      to: [payload.toEmail],
      subject: `${title} fra ${payload.fromName}`,
      html,
    });

    if (emailErr) {
      console.error('Resend error', emailErr);
      const msg = String((emailErr as any)?.error || (emailErr as any)?.message || emailErr);
      if (msg.includes('domain is not verified') || (emailErr as any)?.statusCode === 403) {
        // Retry with Resend's onboarding domain as a fallback (dev-safe)
        const fallbackFrom = 'BeautyBoosters <onboarding@resend.dev>';
        const { error: retryErr } = await resend.emails.send({
          from: fallbackFrom,
          to: [payload.toEmail],
          subject: `${title} fra ${payload.fromName}`,
          html,
        });
        if (retryErr) {
          console.error('Resend retry error', retryErr);
          return new Response(JSON.stringify({ error: 'Kunne ikke sende email' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 });
        }
      } else {
        return new Response(JSON.stringify({ error: 'Kunne ikke sende email' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 });
      }
    }

    return new Response(JSON.stringify({ ok: true, code }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
  } catch (e: any) {
    console.error('Giftcard send error', e);
    return new Response(JSON.stringify({ error: e.message || 'Uventet fejl' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 });
  }
});
