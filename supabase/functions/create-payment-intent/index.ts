import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { amount, bookingData, customerEmail } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Validate discount code limits and validity before creating intent
    if (bookingData?.discountCode) {
      const { data: code, error: codeErr } = await supabase
        .from('discount_codes')
        .select('*')
        .ilike('code', bookingData.discountCode)
        .eq('active', true)
        .maybeSingle();
      if (codeErr) throw codeErr;
      if (!code) {
        return new Response(JSON.stringify({ error: 'Ugyldig rabatkode' }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 });
      }
      if (code.valid_to && new Date(code.valid_to) < new Date()) {
        return new Response(JSON.stringify({ error: 'Rabatkoden er udløbet' }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 });
      }
      if ((code.min_amount ?? 0) > (bookingData?.amountBeforeDiscount || amount + (bookingData?.discountAmount || 0))) {
        return new Response(JSON.stringify({ error: 'Ordren opfylder ikke minimumsbeløbet' }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 });
      }
      if (code.max_redemptions) {
        const { count } = await supabase
          .from('bookings')
          .select('id', { count: 'exact', head: true })
          .eq('discount_code', code.code)
          .not('payment_captured_at', 'is', null);
        if ((count || 0) >= code.max_redemptions) {
          return new Response(JSON.stringify({ error: 'Rabatkoden er brugt op' }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 });
        }
      }
      if (code.per_user_limit) {
        const { count } = await supabase
          .from('bookings')
          .select('id', { count: 'exact', head: true })
          .eq('discount_code', code.code)
          .eq('customer_email', customerEmail)
          .not('payment_captured_at', 'is', null);
        if ((count || 0) >= code.per_user_limit) {
          return new Response(JSON.stringify({ error: 'Du har allerede brugt denne rabatkode' }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 });
        }
      }
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Create or get customer
    let customer;
    const existingCustomers = await stripe.customers.list({ 
      email: customerEmail, 
      limit: 1 
    });

    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];
    } else {
      customer = await stripe.customers.create({
        email: customerEmail,
        name: bookingData.customerName || 'Kunde',
      });
    }

    // Create PaymentIntent with authorization only (capture_method: 'manual')
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to øre
      currency: 'dkk',
      customer: customer.id,
      capture_method: 'manual', // This authorizes but doesn't capture immediately
      payment_method_types: ['card', 'mobilepay'],
      metadata: {
        booking_id: bookingData.bookingId || '',
        service_name: bookingData.serviceName || '',
        booster_name: bookingData.boosterName || '',
        booking_date: bookingData.date || '',
        booking_time: bookingData.time || '',
      },
      description: `BeautyBoosters - ${bookingData.serviceName} ${bookingData.discountCode ? `(rabat: ${bookingData.discountCode})` : ''} med ${bookingData.boosterName}`,
    });

    // Store booking in Supabase with payment intent ID
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { error: insertError } = await supabase
      .from('bookings')
      .insert({
        customer_email: customerEmail,
        customer_name: bookingData.customerName,
        service_name: bookingData.serviceName,
        booster_id: bookingData.boosterId,
        booster_name: bookingData.boosterName,
        booking_date: bookingData.date,
        booking_time: bookingData.time,
        amount: amount,
        payment_intent_id: paymentIntent.id,
        status: 'pending_payment',
        location: bookingData.location,
        discount_code: bookingData.discountCode,
        discount_amount: bookingData.discountAmount
      });

    if (insertError) {
      console.error('Error inserting booking:', insertError);
    }

    return new Response(
      JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});