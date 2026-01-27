import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { booster_id } = await req.json();
    
    if (!booster_id) {
      return new Response(
        JSON.stringify({ error: 'booster_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Create test job
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .insert({
        title: 'Test Outlook Sync - Makeup session',
        service_type: 'Makeup',
        date_needed: '2026-01-29',
        time_needed: '10:00',
        location: 'Testvej 123, 2100 København Ø',
        client_name: 'Test Kunde',
        client_email: 'test@test.dk',
        client_phone: '12345678',
        hourly_rate: 450,
        duration_hours: 2,
        status: 'assigned',
        assigned_booster_id: booster_id,
      })
      .select()
      .single();
    
    if (jobError) {
      console.error('Error creating job:', jobError);
      return new Response(
        JSON.stringify({ error: jobError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Create assignment
    const { error: assignmentError } = await supabase
      .from('job_booster_assignments')
      .insert({
        job_id: job.id,
        booster_id: booster_id,
        assigned_by: 'System (Outlook sync test)',
      });
    
    if (assignmentError) {
      console.error('Error creating assignment:', assignmentError);
    }
    
    return new Response(
      JSON.stringify({ success: true, job }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
