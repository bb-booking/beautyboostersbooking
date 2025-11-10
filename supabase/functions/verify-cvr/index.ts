import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { cvr } = await req.json();
    
    console.log('Verifying CVR:', cvr);

    if (!cvr || cvr.length !== 8 || !/^\d{8}$/.test(cvr)) {
      return new Response(
        JSON.stringify({ error: 'CVR-nummer skal være 8 cifre' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Call Virk's CVR API (public API, no authentication required)
    const response = await fetch(
      `https://cvrapi.dk/api?vat=${cvr}&country=dk`,
      {
        headers: {
          'User-Agent': 'BeautyBoosters/1.0'
        }
      }
    );

    if (!response.ok) {
      console.error('CVR API error:', response.status, response.statusText);
      return new Response(
        JSON.stringify({ error: 'Kunne ikke verificere CVR-nummer' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const data = await response.json();
    
    console.log('CVR API response:', data);

    if (data.error) {
      return new Response(
        JSON.stringify({ error: 'CVR-nummer ikke fundet' }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Extract relevant company information
    const companyInfo = {
      cvr: data.vat,
      name: data.name,
      address: data.address,
      city: data.city,
      zipcode: data.zipcode,
      phone: data.phone,
      email: data.email,
      startdate: data.startdate,
      employees: data.employees,
      industryDescription: data.industrydesc
    };

    return new Response(
      JSON.stringify(companyInfo),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in verify-cvr function:', error);
    return new Response(
      JSON.stringify({ error: 'Intern fejl ved CVR verificering' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
