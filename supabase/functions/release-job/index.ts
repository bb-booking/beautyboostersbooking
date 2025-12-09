import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { bookingId, boosterId, reason } = await req.json();

    console.log('Releasing job:', { bookingId, boosterId, reason });

    if (!bookingId || !boosterId) {
      return new Response(
        JSON.stringify({ error: 'Missing bookingId or boosterId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the booking details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      console.error('Booking not found:', bookingError);
      return new Response(
        JSON.stringify({ error: 'Booking not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the releasing booster's info
    const { data: releasingBooster } = await supabase
      .from('booster_profiles')
      .select('name, location, specialties')
      .eq('id', boosterId)
      .single();

    // Update booking to remove booster assignment
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        booster_id: null,
        booster_name: null,
        booster_status: 'pending',
        status: 'pending_assignment',
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId);

    if (updateError) {
      console.error('Error updating booking:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to release booking' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Remove booster availability entry for this booking
    await supabase
      .from('booster_availability')
      .delete()
      .eq('booster_id', boosterId)
      .eq('job_id', bookingId);

    // Find other boosters in the same location with matching skills
    const { data: matchingBoosters } = await supabase
      .from('booster_profiles')
      .select('id, name, location, specialties')
      .eq('is_available', true)
      .neq('id', boosterId);

    const locationFilter = releasingBooster?.location || booking.location?.split(',')[0]?.trim();
    
    const eligibleBoosters = matchingBoosters?.filter(booster => {
      // Match by location (city)
      const boosterCity = booster.location?.toLowerCase();
      const bookingCity = locationFilter?.toLowerCase();
      return boosterCity && bookingCity && boosterCity.includes(bookingCity);
    }) || [];

    console.log(`Found ${eligibleBoosters.length} eligible boosters for released job`);

    // Send notifications to eligible boosters
    for (const booster of eligibleBoosters) {
      await supabase
        .from('notifications')
        .insert({
          recipient_id: booster.id,
          title: 'Ledigt job tilgængeligt',
          message: `Et job for ${booking.service_name} den ${booking.booking_date} kl. ${booking.booking_time} i ${booking.location || 'ukendt lokation'} er blevet frigivet og er nu ledigt. Pris: ${booking.amount} DKK.`,
          type: 'job_released'
        });
    }

    // Create booking request entries for eligible boosters
    for (const booster of eligibleBoosters.slice(0, 5)) { // Limit to first 5 boosters
      await supabase
        .from('booster_booking_requests')
        .insert({
          booking_id: bookingId,
          booster_id: booster.id,
          status: 'pending',
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
        });
    }

    // Notify all admins
    const { data: adminUsers } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin');

    // Get admin booster profiles (admins might have entries in booster_profiles for notifications)
    for (const admin of adminUsers || []) {
      // Check if admin has a booster_profile for notifications
      const { data: adminProfile } = await supabase
        .from('booster_profiles')
        .select('id')
        .eq('id', admin.user_id)
        .single();

      if (adminProfile) {
        await supabase
          .from('notifications')
          .insert({
            recipient_id: adminProfile.id,
            title: 'Job frigivet',
            message: `${releasingBooster?.name || 'En booster'} har frigivet jobbet "${booking.service_name}" den ${booking.booking_date}. ${reason ? `Årsag: ${reason}` : ''} Jobbet er nu ledigt og afventer ny tildeling.`,
            type: 'job_released_admin'
          });
      }
    }

    // Also create a job entry if one doesn't exist
    const { data: existingJob } = await supabase
      .from('jobs')
      .select('id')
      .eq('title', `Booking: ${booking.service_name}`)
      .eq('date_needed', booking.booking_date)
      .single();

    if (!existingJob) {
      await supabase
        .from('jobs')
        .insert({
          title: `Booking: ${booking.service_name}`,
          service_type: booking.service_name,
          location: booking.location || 'Ukendt',
          date_needed: booking.booking_date,
          time_needed: booking.booking_time,
          duration_hours: booking.duration_hours || 2,
          hourly_rate: Math.round((booking.amount || 0) / (booking.duration_hours || 2)),
          description: `Frigivet booking. Kunde: ${booking.customer_name}. ${reason ? `Frigivet af tidligere booster med årsag: ${reason}` : ''}`,
          status: 'open',
          client_name: booking.customer_name,
          client_email: booking.customer_email,
          client_phone: booking.customer_phone,
          boosters_needed: 1
        });
    } else {
      // Update existing job to open status
      await supabase
        .from('jobs')
        .update({ status: 'open', assigned_booster_id: null })
        .eq('id', existingJob.id);
    }

    console.log('Job released successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        notifiedBoosters: eligibleBoosters.length,
        message: 'Job frigivet og sendt til andre boosters'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in release-job function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
