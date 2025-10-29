import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BookingResponse {
  bookingId: string;
  action: 'accept' | 'reject';
  boosterId: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { bookingId, action, boosterId }: BookingResponse = await req.json();

    console.log(`Processing ${action} for booking ${bookingId} by booster ${boosterId}`);

    if (action === 'accept') {
      // Accept the booking
      const { data: booking, error: updateError } = await supabaseClient
        .from('bookings')
        .update({ 
          booster_status: 'accepted',
          status: 'confirmed'
        })
        .eq('id', bookingId)
        .eq('booster_id', boosterId)
        .select()
        .single();

      if (updateError) throw updateError;

      // Create calendar entry in booster_availability
      const { error: availError } = await supabaseClient
        .from('booster_availability')
        .insert({
          booster_id: boosterId,
          date: booking.booking_date,
          start_time: booking.booking_time,
          end_time: calculateEndTime(booking.booking_time, booking.duration_hours),
          status: 'busy',
          notes: `Booking: ${booking.service_name} - ${booking.customer_name}`
        });

      if (availError) {
        console.error('Error creating availability:', availError);
        // Don't fail the request, just log the error
      }

      console.log(`Booking ${bookingId} accepted successfully`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Booking accepteret',
          booking 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );

    } else if (action === 'reject') {
      // Mark as rejected
      const { data: booking, error: updateError } = await supabaseClient
        .from('bookings')
        .update({ 
          booster_status: 'rejected',
          assignment_attempts: supabaseClient.sql`assignment_attempts + 1`,
          last_assignment_attempt: new Date().toISOString()
        })
        .eq('id', bookingId)
        .eq('booster_id', boosterId)
        .select()
        .single();

      if (updateError) throw updateError;

      console.log(`Booking ${bookingId} rejected, finding alternative booster`);

      // Find alternative booster
      const { data: alternativeBooster, error: findError } = await supabaseClient
        .from('booster_profiles')
        .select('id, name, location, specialties')
        .eq('location', booking.location || 'København')
        .eq('is_available', true)
        .neq('id', boosterId)
        .limit(1)
        .single();

      if (findError || !alternativeBooster) {
        console.log('No alternative booster found, marking booking as pending reassignment');
        
        // Update booking to show it needs manual reassignment
        await supabaseClient
          .from('bookings')
          .update({ 
            booster_id: null,
            booster_status: 'pending',
            status: 'pending_assignment'
          })
          .eq('id', bookingId);

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Booking afvist. Ingen alternativ booster fundet.',
            needsManualAssignment: true
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        );
      }

      // Assign to alternative booster
      const { error: reassignError } = await supabaseClient
        .from('bookings')
        .update({ 
          booster_id: alternativeBooster.id,
          booster_name: alternativeBooster.name,
          booster_status: 'pending'
        })
        .eq('id', bookingId);

      if (reassignError) throw reassignError;

      console.log(`Booking ${bookingId} reassigned to ${alternativeBooster.name}`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Booking afvist og sendt til alternativ booster',
          alternativeBooster: alternativeBooster.name
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    throw new Error('Invalid action');

  } catch (error: any) {
    console.error('Error handling booking response:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});

function calculateEndTime(startTime: string, durationHours: number): string {
  const [hours, minutes] = startTime.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + (durationHours * 60);
  const endHours = Math.floor(totalMinutes / 60) % 24;
  const endMinutes = totalMinutes % 60;
  return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}:00`;
}