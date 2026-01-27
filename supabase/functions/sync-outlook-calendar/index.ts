import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MICROSOFT_CLIENT_ID = Deno.env.get('MICROSOFT_CLIENT_ID')!;
const MICROSOFT_CLIENT_SECRET = Deno.env.get('MICROSOFT_CLIENT_SECRET')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const MICROSOFT_TOKEN_URL = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
const GRAPH_API_URL = 'https://graph.microsoft.com/v1.0';

interface TokenData {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  email: string;
  last_sync: string | null;
  synced_event_ids?: Record<string, string>; // bookingId -> outlookEventId
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Get all boosters with Outlook calendar connected
    const { data: boosters, error } = await supabase
      .from('booster_profiles')
      .select('id, user_id, calendar_sync_token, name')
      .eq('calendar_provider', 'outlook')
      .not('calendar_sync_token', 'is', null);
    
    if (error) {
      console.error('Error fetching boosters:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch boosters' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const results = [];
    
    for (const booster of boosters || []) {
      try {
        const tokenData: TokenData = JSON.parse(booster.calendar_sync_token);
        
        // Check if token is expired and refresh if needed
        let accessToken = tokenData.access_token;
        
        if (tokenData.expires_at && Date.now() > tokenData.expires_at - 300000) {
          // Token expired or expiring soon, refresh it
          const refreshResponse = await fetch(MICROSOFT_TOKEN_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              client_id: MICROSOFT_CLIENT_ID,
              client_secret: MICROSOFT_CLIENT_SECRET,
              refresh_token: tokenData.refresh_token,
              grant_type: 'refresh_token',
            }),
          });
          
          if (refreshResponse.ok) {
            const newTokens = await refreshResponse.json();
            accessToken = newTokens.access_token;
            
            // Update stored tokens
            tokenData.access_token = newTokens.access_token;
            tokenData.refresh_token = newTokens.refresh_token || tokenData.refresh_token;
            tokenData.expires_at = Date.now() + (newTokens.expires_in * 1000);
          } else {
            console.error(`Failed to refresh token for booster ${booster.id}`);
            results.push({ boosterId: booster.id, success: false, error: 'Token refresh failed' });
            continue;
          }
        }
        
        // ===== PART 1: Sync Outlook events TO Lovable (mark as busy) =====
        const outlookEventsResult = await syncOutlookToLovable(supabase, booster.id, accessToken);
        
        // ===== PART 2: Sync Lovable bookings TO Outlook =====
        const lovableEventsResult = await syncLovableToOutlook(supabase, booster.id, booster.name, accessToken, tokenData);
        
        // Update last sync time and synced event IDs
        tokenData.last_sync = new Date().toISOString();
        tokenData.synced_event_ids = lovableEventsResult.syncedEventIds;
        
        await supabase
          .from('booster_profiles')
          .update({ calendar_sync_token: JSON.stringify(tokenData) })
          .eq('id', booster.id);
        
        results.push({ 
          boosterId: booster.id, 
          success: true, 
          outlookToLovable: outlookEventsResult,
          lovableToOutlook: lovableEventsResult
        });
        
      } catch (err) {
        console.error(`Error syncing booster ${booster.id}:`, err);
        results.push({ boosterId: booster.id, success: false, error: String(err) });
      }
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        syncedBoosters: results.filter(r => r.success).length,
        failedBoosters: results.filter(r => !r.success).length,
        results 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error in sync-outlook-calendar:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// ===== Sync Outlook events to Lovable (create busy blocks) =====
async function syncOutlookToLovable(
  supabase: ReturnType<typeof createClient>,
  boosterId: string,
  accessToken: string
): Promise<{ eventsProcessed: number; blocksCreated: number }> {
  // Fetch calendar events for the next 30 days
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  
  const calendarResponse = await fetch(
    `${GRAPH_API_URL}/me/calendar/calendarView?startDateTime=${now.toISOString()}&endDateTime=${thirtyDaysFromNow.toISOString()}&$select=id,subject,start,end,showAs&$top=100`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    }
  );
  
  if (!calendarResponse.ok) {
    console.error(`Failed to fetch calendar for booster ${boosterId}`);
    throw new Error('Calendar fetch failed');
  }
  
  const calendarData = await calendarResponse.json();
  const events = calendarData.value || [];
  
  // Delete existing synced availability entries (not booked ones from Lovable)
  await supabase
    .from('booster_availability')
    .delete()
    .eq('booster_id', boosterId)
    .eq('status', 'synced');
  
  // Insert new availability blocks from calendar events (only private Outlook events)
  // Filter out events that we created ourselves (they have "BeautyBoosters" in subject)
  const availabilityEntries = events
    .filter((event: any) => 
      (event.showAs === 'busy' || event.showAs === 'tentative') &&
      !event.subject?.includes('BeautyBoosters:')
    )
    .map((event: any) => {
      const startDate = new Date(event.start.dateTime + 'Z');
      const endDate = new Date(event.end.dateTime + 'Z');
      
      return {
        booster_id: boosterId,
        date: startDate.toISOString().split('T')[0],
        start_time: startDate.toTimeString().slice(0, 5),
        end_time: endDate.toTimeString().slice(0, 5),
        status: 'synced',
        notes: `Outlook: ${event.subject || 'Optaget'}`,
      };
    });
  
  if (availabilityEntries.length > 0) {
    await supabase
      .from('booster_availability')
      .insert(availabilityEntries);
  }
  
  return {
    eventsProcessed: events.length,
    blocksCreated: availabilityEntries.length
  };
}

// ===== Sync Lovable bookings to Outlook (create calendar events) =====
async function syncLovableToOutlook(
  supabase: ReturnType<typeof createClient>,
  boosterId: string,
  boosterName: string,
  accessToken: string,
  tokenData: TokenData
): Promise<{ bookingsProcessed: number; eventsCreated: number; eventsUpdated: number; syncedEventIds: Record<string, string> }> {
  
  const existingSyncedEventIds = tokenData.synced_event_ids || {};
  const newSyncedEventIds: Record<string, string> = {};
  
  // Get all confirmed bookings for this booster in the next 60 days
  const now = new Date();
  const sixtyDaysFromNow = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
  
  const { data: bookings, error: bookingsError } = await supabase
    .from('bookings')
    .select('*')
    .eq('booster_id', boosterId)
    .in('status', ['confirmed', 'pending'])
    .gte('booking_date', now.toISOString().split('T')[0])
    .lte('booking_date', sixtyDaysFromNow.toISOString().split('T')[0]);
  
  if (bookingsError) {
    console.error('Error fetching bookings:', bookingsError);
    return { bookingsProcessed: 0, eventsCreated: 0, eventsUpdated: 0, syncedEventIds: existingSyncedEventIds };
  }
  
  let eventsCreated = 0;
  let eventsUpdated = 0;
  
  for (const booking of bookings || []) {
    try {
      // Build event data
      const startDateTime = `${booking.booking_date}T${booking.booking_time}`;
      const durationHours = booking.duration_hours || 2;
      const endDate = new Date(`${startDateTime}:00`);
      endDate.setHours(endDate.getHours() + durationHours);
      const endDateTime = endDate.toISOString().slice(0, 16);
      
      const eventData = {
        subject: `BeautyBoosters: ${booking.service_name}`,
        body: {
          contentType: 'HTML',
          content: `
            <p><strong>Booking fra BeautyBoosters</strong></p>
            <p><strong>Kunde:</strong> ${booking.customer_name || 'Ikke angivet'}</p>
            <p><strong>Email:</strong> ${booking.customer_email}</p>
            <p><strong>Telefon:</strong> ${booking.customer_phone || 'Ikke angivet'}</p>
            <p><strong>Service:</strong> ${booking.service_name}</p>
            <p><strong>Beløb:</strong> ${booking.amount} DKK</p>
            ${booking.special_requests ? `<p><strong>Særlige ønsker:</strong> ${booking.special_requests}</p>` : ''}
          `
        },
        start: {
          dateTime: startDateTime,
          timeZone: 'Europe/Copenhagen'
        },
        end: {
          dateTime: endDateTime,
          timeZone: 'Europe/Copenhagen'
        },
        location: {
          displayName: booking.location || 'Kundens adresse'
        },
        showAs: 'busy',
        reminderMinuteBeforeStart: 60
      };
      
      const existingEventId = existingSyncedEventIds[booking.id];
      
      if (existingEventId) {
        // Update existing event
        const updateResponse = await fetch(
          `${GRAPH_API_URL}/me/events/${existingEventId}`,
          {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(eventData),
          }
        );
        
        if (updateResponse.ok) {
          newSyncedEventIds[booking.id] = existingEventId;
          eventsUpdated++;
        } else if (updateResponse.status === 404) {
          // Event was deleted in Outlook, recreate it
          const createResult = await createOutlookEvent(accessToken, eventData);
          if (createResult.id) {
            newSyncedEventIds[booking.id] = createResult.id;
            eventsCreated++;
          }
        }
      } else {
        // Create new event
        const createResult = await createOutlookEvent(accessToken, eventData);
        if (createResult.id) {
          newSyncedEventIds[booking.id] = createResult.id;
          eventsCreated++;
        }
      }
    } catch (err) {
      console.error(`Error syncing booking ${booking.id} to Outlook:`, err);
    }
  }
  
  // Optionally: delete Outlook events for cancelled/completed bookings
  // (events that exist in syncedEventIds but not in current bookings)
  const currentBookingIds = new Set((bookings || []).map(b => b.id));
  for (const [bookingId, eventId] of Object.entries(existingSyncedEventIds)) {
    if (!currentBookingIds.has(bookingId)) {
      // Booking no longer active, delete the Outlook event
      try {
        await fetch(`${GRAPH_API_URL}/me/events/${eventId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });
        console.log(`Deleted Outlook event ${eventId} for removed booking ${bookingId}`);
      } catch (err) {
        console.error(`Error deleting Outlook event ${eventId}:`, err);
      }
    }
  }
  
  return {
    bookingsProcessed: bookings?.length || 0,
    eventsCreated,
    eventsUpdated,
    syncedEventIds: newSyncedEventIds
  };
}

async function createOutlookEvent(accessToken: string, eventData: any): Promise<{ id?: string }> {
  const createResponse = await fetch(
    `${GRAPH_API_URL}/me/events`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventData),
    }
  );
  
  if (createResponse.ok) {
    const createdEvent = await createResponse.json();
    return { id: createdEvent.id };
  } else {
    const errorText = await createResponse.text();
    console.error('Failed to create Outlook event:', errorText);
    return {};
  }
}
