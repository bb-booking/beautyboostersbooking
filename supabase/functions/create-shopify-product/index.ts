import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProductData {
  title: string;
  body_html: string;
  vendor: string;
  product_type: string;
  tags: string;
  price: string;
  image_src?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { productData }: { productData: ProductData } = await req.json();
    
    const shopifyDomain = Deno.env.get('SHOPIFY_STORE_DOMAIN');
    const shopifyAccessToken = Deno.env.get('SHOPIFY_ACCESS_TOKEN');

    if (!shopifyDomain || !shopifyAccessToken) {
      throw new Error('Shopify credentials not configured');
    }

    console.log('Creating Shopify product:', productData.title);

    // Create product payload
    const product = {
      product: {
        title: productData.title,
        body_html: productData.body_html,
        vendor: productData.vendor || 'BeautyBoosters',
        product_type: productData.product_type || 'Beauty Service',
        tags: productData.tags || 'beauty-service,booking',
        template_suffix: 'booking', // Use our custom booking template
        variants: [
          {
            price: productData.price,
            inventory_management: null,
            inventory_policy: 'continue', // Allow out-of-stock purchases
            fulfillment_service: 'manual',
            inventory_quantity: 999,
            requires_shipping: false, // Service doesn't require shipping
            taxable: true,
            weight: 0,
            weight_unit: 'kg'
          }
        ],
        images: productData.image_src ? [
          {
            src: productData.image_src,
            alt: productData.title
          }
        ] : []
      }
    };

    // Make request to Shopify Admin API
    const shopifyUrl = `https://${shopifyDomain}/admin/api/2023-10/products.json`;
    
    const response = await fetch(shopifyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': shopifyAccessToken,
      },
      body: JSON.stringify(product),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Shopify API error:', response.status, errorText);
      throw new Error(`Shopify API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    
    console.log('Product created successfully:', result.product.id);

    return new Response(JSON.stringify({
      success: true,
      product: result.product,
      shopify_url: `https://${shopifyDomain}/admin/products/${result.product.id}`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error creating Shopify product:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});