import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Simple in-memory rate limiter
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX_REQUESTS = 10; // Max 10 requests per hour per IP

function checkRateLimit(clientIP: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = rateLimitMap.get(clientIP);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(clientIP, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1 };
  }
  
  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, remaining: 0 };
  }
  
  record.count++;
  return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - record.count };
}

function validateGiftCardInput(data: any): { valid: boolean; error?: string } {
  if (!data.amount || typeof data.amount !== 'number' || data.amount < 100 || data.amount > 100000) {
    return { valid: false, error: 'Ugyldigt beløb (min. 100 DKK, max. 100.000 DKK)' };
  }
  
  if (!data.toName || data.toName.trim().length === 0 || data.toName.length > 100) {
    return { valid: false, error: 'Ugyldigt modtager navn' };
  }
  
  if (!data.fromName || data.fromName.trim().length === 0 || data.fromName.length > 100) {
    return { valid: false, error: 'Ugyldigt afsender navn' };
  }
  
  return { valid: true };
}

function generateCode(len = 10) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < len; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return `BB-${code}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get client IP for rate limiting
    const clientIP = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
                     req.headers.get("cf-connecting-ip") || 
                     "unknown";
    
    // Check rate limit
    const rateLimit = checkRateLimit(clientIP);
    if (!rateLimit.allowed) {
      console.log(`Rate limit exceeded for IP: ${clientIP}`);
      return new Response(
        JSON.stringify({ error: 'For mange anmodninger. Prøv igen senere.' }),
        {
          headers: { 
            ...corsHeaders, 
            "Content-Type": "application/json",
            "X-RateLimit-Remaining": "0",
            "Retry-After": "3600"
          },
          status: 429,
        }
      );
    }

    const requestData = await req.json();
    
    // Log request for monitoring (without sensitive data)
    console.log(`Giftcard payment request from IP: ${clientIP}`);
    
    const validation = validateGiftCardInput(requestData);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ error: validation.error }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { amount, toName, fromName, message, mode, serviceName, servicePrice, validTo } = requestData;

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to øre
      currency: "dkk",
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        type: 'giftcard',
        toName,
        fromName,
        mode,
        ...(serviceName && { serviceName }),
      },
    });

    // Generate unique code
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

    const validToDate = validTo 
      ? new Date(validTo) 
      : new Date(new Date().setFullYear(new Date().getFullYear() + 2));

    // Create discount code (inactive until payment confirmed)
    const { error: insertErr } = await supabase.from('discount_codes').insert({
      code,
      type: 'fixed',
      amount,
      currency: 'DKK',
      active: false, // Will be activated after payment
      valid_to: validToDate.toISOString(),
      min_amount: 0,
      max_redemptions: 1,
      per_user_limit: 1,
    });

    if (insertErr) {
      console.error('Insert giftcard error', insertErr);
      return new Response(
        JSON.stringify({ error: 'Kunne ikke oprette gavekort-kode' }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    // Store gift card data for later activation
    await supabase.from('bookings').insert({
      customer_email: 'giftcard@beautyboosters.dk',
      customer_name: `Gavekort: ${toName}`,
      service_name: mode === 'service' ? serviceName : `Gavekort ${amount} DKK`,
      booking_date: new Date().toISOString().split('T')[0],
      booking_time: '00:00:00',
      amount,
      payment_intent_id: paymentIntent.id,
      status: 'pending_payment',
      special_requests: JSON.stringify({
        type: 'giftcard',
        code,
        toName,
        fromName,
        message,
        mode,
        serviceName,
        servicePrice,
        validTo: validToDate.toISOString(),
      }),
    });

    return new Response(
      JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        code,
      }),
      {
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json",
          "X-RateLimit-Remaining": String(rateLimit.remaining)
        },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error creating payment intent:", error);
    return new Response(
      JSON.stringify({ error: 'Der opstod en fejl. Prøv igen senere.' }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
