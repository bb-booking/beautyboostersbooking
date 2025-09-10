import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-shopify-hmac-sha256, x-shopify-topic, x-shopify-shop-domain",
};

// Shopify webhook signature verification
async function verifyShopifyWebhook(body: string, signature: string, secret: string): Promise<boolean> {
  if (!signature || !secret) return false;
  
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  
  const expectedSignature = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
  const expectedBase64 = btoa(String.fromCharCode(...new Uint8Array(expectedSignature)));
  
  return signature === expectedBase64;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get Shopify headers
    const shopifySignature = req.headers.get("x-shopify-hmac-sha256");
    const shopifyTopic = req.headers.get("x-shopify-topic");
    const shopifyDomain = req.headers.get("x-shopify-shop-domain");
    
    console.log("Shopify webhook received:", {
      topic: shopifyTopic,
      domain: shopifyDomain,
      hasSignature: !!shopifySignature
    });

    // Get webhook secret from environment
    const webhookSecret = Deno.env.get("SHOPIFY_WEBHOOK_SECRET");
    
    // Read body
    const body = await req.text();
    
    // Verify webhook signature (skip in development)
    if (webhookSecret && shopifySignature) {
      const isValid = await verifyShopifyWebhook(body, shopifySignature, webhookSecret);
      if (!isValid) {
        console.error("Invalid Shopify webhook signature");
        return new Response("Unauthorized", { status: 401, headers: corsHeaders });
      }
    }

    // Parse order data
    const orderData = JSON.parse(body);
    console.log("Processing Shopify order:", orderData.id, orderData.name);

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Process based on webhook topic
    if (shopifyTopic === "orders/create") {
      await processOrderCreated(supabase, orderData);
    } else if (shopifyTopic === "orders/updated") {
      await processOrderUpdated(supabase, orderData);
    } else if (shopifyTopic === "orders/cancelled") {
      await processOrderCancelled(supabase, orderData);
    } else {
      console.log("Unhandled webhook topic:", shopifyTopic);
    }

    return new Response(
      JSON.stringify({ success: true, processed: shopifyTopic }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Shopify webhook error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});

async function processOrderCreated(supabase: any, orderData: any) {
  console.log("Processing order created:", orderData.id);
  
  try {
    // Extract relevant data from Shopify order
    const {
      id: shopify_order_id,
      name: order_number,
      email,
      phone,
      billing_address,
      shipping_address,
      line_items,
      total_price,
      financial_status,
      fulfillment_status,
      created_at,
      note
    } = orderData;

    // Parse customer information
    const customerName = billing_address ? 
      `${billing_address.first_name || ''} ${billing_address.last_name || ''}`.trim() :
      `${orderData.customer?.first_name || ''} ${orderData.customer?.last_name || ''}`.trim();

    // Find beauty service in line items
    const beautyService = line_items.find((item: any) => 
      item.product_type?.toLowerCase().includes('beauty') ||
      item.title?.toLowerCase().includes('makeup') ||
      item.title?.toLowerCase().includes('hair') ||
      item.title?.toLowerCase().includes('styling')
    );

    if (!beautyService) {
      console.log("No beauty service found in order, skipping");
      return;
    }

    // Create booking record
    const bookingData = {
      shopify_order_id: shopify_order_id.toString(),
      order_number,
      customer_name: customerName,
      customer_email: email,
      customer_phone: phone,
      service_name: beautyService.title,
      service_variant: beautyService.variant_title,
      quantity: beautyService.quantity,
      price: parseFloat(beautyService.price),
      total_amount: parseFloat(total_price),
      status: 'pending_booking', // Custom status for Shopify orders
      location: shipping_address ? 
        `${shipping_address.address1 || ''} ${shipping_address.address2 || ''}, ${shipping_address.zip || ''} ${shipping_address.city || ''}`.trim() :
        null,
      special_requests: note,
      financial_status,
      fulfillment_status,
      created_at: new Date(created_at).toISOString(),
      source: 'shopify'
    };

    // Insert booking
    const { data: booking, error: bookingError } = await supabase
      .from('shopify_bookings')
      .insert(bookingData)
      .select()
      .single();

    if (bookingError) {
      console.error("Error creating booking:", bookingError);
      throw bookingError;
    }

    console.log("Booking created successfully:", booking.id);

    // Log the webhook for tracking
    await supabase
      .from('shopify_webhook_logs')
      .insert({
        webhook_id: `shopify_${shopify_order_id}_${Date.now()}`,
        topic: 'orders/create',
        shopify_order_id: shopify_order_id.toString(),
        booking_id: booking.id,
        processed_at: new Date().toISOString(),
        data: orderData
      });

  } catch (error) {
    console.error("Error in processOrderCreated:", error);
    throw error;
  }
}

async function processOrderUpdated(supabase: any, orderData: any) {
  console.log("Processing order updated:", orderData.id);
  
  try {
    const { id: shopify_order_id, financial_status, fulfillment_status } = orderData;

    // Update existing booking
    const { error } = await supabase
      .from('shopify_bookings')
      .update({
        financial_status,
        fulfillment_status,
        updated_at: new Date().toISOString()
      })
      .eq('shopify_order_id', shopify_order_id.toString());

    if (error) {
      console.error("Error updating booking:", error);
      throw error;
    }

    console.log("Booking updated successfully");
  } catch (error) {
    console.error("Error in processOrderUpdated:", error);
    throw error;
  }
}

async function processOrderCancelled(supabase: any, orderData: any) {
  console.log("Processing order cancelled:", orderData.id);
  
  try {
    const { id: shopify_order_id } = orderData;

    // Update booking status to cancelled
    const { error } = await supabase
      .from('shopify_bookings')
      .update({
        status: 'cancelled',
        financial_status: 'refunded',
        cancelled_at: new Date().toISOString()
      })
      .eq('shopify_order_id', shopify_order_id.toString());

    if (error) {
      console.error("Error cancelling booking:", error);
      throw error;
    }

    console.log("Booking cancelled successfully");
  } catch (error) {
    console.error("Error in processOrderCancelled:", error);
    throw error;
  }
}