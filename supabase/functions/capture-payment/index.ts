import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("Missing authorization header");
      return new Response(
        JSON.stringify({ error: "Authorization required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    // Initialize Supabase client with the user's JWT
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get the authenticated user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      console.error("User authentication failed:", userError);
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    // Initialize service role client for role checking
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Check if user is admin
    const { data: roleData } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    const isAdmin = !!roleData;

    const { paymentIntentId, captureAmount } = await req.json();

    if (!paymentIntentId) {
      return new Response(
        JSON.stringify({ error: "paymentIntentId is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Verify the booking exists and user has permission
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .select('id, customer_email, payment_intent_id')
      .eq('payment_intent_id', paymentIntentId)
      .single();

    if (bookingError || !booking) {
      console.error("Booking not found for payment intent:", paymentIntentId);
      return new Response(
        JSON.stringify({ error: "Booking not found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    // Authorization check: user must be admin OR booking must belong to them
    const isOwner = booking.customer_email === user.email;
    if (!isAdmin && !isOwner) {
      console.error("Unauthorized capture attempt by user:", user.id, "for booking:", booking.id);
      return new Response(
        JSON.stringify({ error: "Not authorized to capture this payment" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
      );
    }

    console.log("Payment capture authorized for user:", user.id, "isAdmin:", isAdmin, "isOwner:", isOwner);

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Capture the payment (when service is completed)
    const paymentIntent = await stripe.paymentIntents.capture(paymentIntentId, {
      amount_to_capture: captureAmount ? Math.round(captureAmount * 100) : undefined,
    });

    // Update booking status in Supabase
    const { error: updateError } = await supabaseAdmin
      .from('bookings')
      .update({ 
        status: 'completed',
        payment_captured_at: new Date().toISOString()
      })
      .eq('payment_intent_id', paymentIntentId);

    if (updateError) {
      console.error('Error updating booking:', updateError);
    }

    console.log("Payment captured successfully for booking:", booking.id);

    return new Response(
      JSON.stringify({ success: true, paymentIntent }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error capturing payment:', error);
    return new Response(
      JSON.stringify({ error: "An error occurred while capturing payment" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
