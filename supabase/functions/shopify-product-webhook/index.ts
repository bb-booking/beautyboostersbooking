import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-shopify-topic, x-shopify-hmac-sha256',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const webhookTopic = req.headers.get('x-shopify-topic');
    const rawBody = await req.text();
    const webhookData = JSON.parse(rawBody);

    console.log(`Received Shopify webhook: ${webhookTopic}`, {
      productId: webhookData.id,
      title: webhookData.title,
    });

    // Extract product data
    const productId = webhookData.id;
    const title = webhookData.title;
    const description = webhookData.body_html || webhookData.description;
    const productType = webhookData.product_type;
    const vendor = webhookData.vendor;
    const handle = webhookData.handle;
    const tags = webhookData.tags?.split(',').map((t: string) => t.trim()) || [];

    // Extract price from first variant
    const variants = webhookData.variants || [];
    const firstVariant = variants[0];
    const price = firstVariant?.price || 0;
    const compareAtPrice = firstVariant?.compare_at_price || null;

    // Extract images with full URLs
    const images = (webhookData.images || []).map((img: any) => ({
      id: img.id,
      src: img.src,
      alt: img.alt,
      position: img.position,
      width: img.width,
      height: img.height,
    }));

    const shopifyUrl = `https://${Deno.env.get('SHOPIFY_STORE_DOMAIN')}/products/${handle}`;

    // Handle different webhook topics
    if (webhookTopic === 'products/create' || webhookTopic === 'products/update') {
      const { error: upsertError } = await supabase
        .from('shopify_products')
        .upsert({
          shopify_product_id: productId,
          title,
          description,
          product_type: productType,
          vendor,
          price,
          compare_at_price: compareAtPrice,
          images,
          variants,
          tags,
          status: webhookData.status || 'active',
          shopify_handle: handle,
          shopify_url: shopifyUrl,
          sync_status: 'synced',
          last_synced_at: new Date().toISOString(),
        }, {
          onConflict: 'shopify_product_id'
        });

      if (upsertError) {
        console.error('Error upserting product:', upsertError);
        throw upsertError;
      }

      console.log(`Product ${webhookTopic === 'products/create' ? 'created' : 'updated'} successfully:`, title);

    } else if (webhookTopic === 'products/delete') {
      const { error: deleteError } = await supabase
        .from('shopify_products')
        .update({ 
          status: 'deleted',
          sync_status: 'synced',
          last_synced_at: new Date().toISOString(),
        })
        .eq('shopify_product_id', productId);

      if (deleteError) {
        console.error('Error deleting product:', deleteError);
        throw deleteError;
      }

      console.log('Product marked as deleted:', title);
    }

    // Log webhook
    await supabase.from('shopify_webhook_logs').insert({
      webhook_topic: webhookTopic || 'unknown',
      shopify_order_id: productId,
      webhook_data: webhookData,
      processed_successfully: true,
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Product ${webhookTopic} processed successfully`,
        productId,
        title,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error processing Shopify product webhook:', error);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    await supabase.from('shopify_webhook_logs').insert({
      webhook_topic: req.headers.get('x-shopify-topic') || 'unknown',
      webhook_data: {},
      processed_successfully: false,
      error_message: error.message,
    });

    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
