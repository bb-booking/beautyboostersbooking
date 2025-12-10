import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY") as string);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BookingConfirmationRequest {
  bookingId: string;
  customerEmail: string;
  customerName: string;
  serviceName: string;
  boosterName: string;
  bookingDate: string;
  bookingTime: string;
  location: string;
  amount: number;
  specialRequests?: string;
  isBusinessBooking?: boolean;
}

const formatDate = (dateStr: string): string => {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('da-DK', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  } catch {
    return dateStr;
  }
};

const formatTime = (timeStr: string): string => {
  if (!timeStr) return '';
  return timeStr.substring(0, 5); // HH:MM format
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: BookingConfirmationRequest = await req.json();
    
    console.log("Sending booking confirmation email to:", data.customerEmail);
    console.log("Booking details:", {
      serviceName: data.serviceName,
      boosterName: data.boosterName,
      bookingDate: data.bookingDate,
      bookingTime: data.bookingTime
    });

    const formattedDate = formatDate(data.bookingDate);
    const formattedTime = formatTime(data.bookingTime);

    // Customer confirmation email
    const customerHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1a1a1a; margin: 0; padding: 0; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #D4A574 0%, #C4956A 100%); padding: 32px; border-radius: 16px 16px 0 0; text-align: center;">
            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">BEAUTYBOOSTERS</h1>
            <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">Professionelle artister direkte til døren</p>
          </div>
          
          <div style="background: #ffffff; padding: 32px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 24px;">
              <div style="display: inline-block; background: #E8F5E9; padding: 12px 24px; border-radius: 50px;">
                <span style="color: #2E7D32; font-weight: 600; font-size: 16px;">✓ Booking bekræftet</span>
              </div>
            </div>
            
            <p style="margin: 0 0 24px; font-size: 16px;">Hej ${data.customerName || 'kunde'},</p>
            
            <p style="margin: 0 0 24px; font-size: 16px;">Tak for din booking! Her er dine booking-detaljer:</p>
            
            <div style="background: #FAF7F5; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #666; font-size: 14px;">Service</td>
                  <td style="padding: 8px 0; text-align: right; font-weight: 600; font-size: 14px;">${data.serviceName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666; font-size: 14px;">Booster</td>
                  <td style="padding: 8px 0; text-align: right; font-weight: 600; font-size: 14px;">${data.boosterName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666; font-size: 14px;">Dato</td>
                  <td style="padding: 8px 0; text-align: right; font-weight: 600; font-size: 14px;">${formattedDate}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666; font-size: 14px;">Tidspunkt</td>
                  <td style="padding: 8px 0; text-align: right; font-weight: 600; font-size: 14px;">kl. ${formattedTime}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666; font-size: 14px;">Adresse</td>
                  <td style="padding: 8px 0; text-align: right; font-weight: 600; font-size: 14px;">${data.location || 'Ikke angivet'}</td>
                </tr>
                ${data.specialRequests ? `
                <tr>
                  <td style="padding: 8px 0; color: #666; font-size: 14px;">Særlige ønsker</td>
                  <td style="padding: 8px 0; text-align: right; font-size: 14px;">${data.specialRequests}</td>
                </tr>
                ` : ''}
                <tr style="border-top: 1px solid #E5E5E5;">
                  <td style="padding: 16px 0 8px; color: #1a1a1a; font-size: 16px; font-weight: 600;">Total</td>
                  <td style="padding: 16px 0 8px; text-align: right; font-weight: 700; font-size: 18px; color: #D4A574;">${data.amount} DKK</td>
                </tr>
              </table>
            </div>
            
            ${data.isBusinessBooking ? `
            <div style="background: #FFF8E1; border-radius: 8px; padding: 16px; margin-bottom: 24px; border-left: 4px solid #FFC107;">
              <p style="margin: 0; font-size: 14px; color: #5D4E37;">
                <strong>Fakturering:</strong> Du modtager en faktura på behandlingsdagen efter servicen er udført.
              </p>
            </div>
            ` : ''}
            
            <div style="background: #F5F5F5; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
              <p style="margin: 0 0 8px; font-size: 14px; font-weight: 600;">Afbestillingspolitik</p>
              <p style="margin: 0; font-size: 13px; color: #666;">
                Gratis afbestilling op til 24 timer før. Ved afbestilling 12-24 timer før: 25% gebyr. 
                Ved afbestilling 6-12 timer før: 50% gebyr. Under 6 timer før eller udeblivelse: 100% gebyr.
              </p>
            </div>
            
            <p style="margin: 0 0 16px; font-size: 14px; color: #666;">
              Har du spørgsmål? Kontakt os på <a href="mailto:hello@beautyboosters.dk" style="color: #D4A574;">hello@beautyboosters.dk</a> 
              eller ring på <a href="tel:+4571786575" style="color: #D4A574;">+45 71 78 65 75</a>
            </p>
            
            <p style="margin: 24px 0 0; font-size: 14px;">
              Kærlig hilsen,<br>
              <strong>BeautyBoosters teamet</strong>
            </p>
          </div>
          
          <div style="text-align: center; padding: 24px; color: #999; font-size: 12px;">
            <p style="margin: 0;">© ${new Date().getFullYear()} BeautyBoosters ApS</p>
            <p style="margin: 4px 0 0;">Nybrogade 24A, 1203 København K</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const { error: customerEmailError } = await resend.emails.send({
      from: "BeautyBoosters <onboarding@resend.dev>",
      to: [data.customerEmail],
      subject: `Booking bekræftet: ${data.serviceName} - ${formattedDate}`,
      html: customerHtml,
    });

    if (customerEmailError) {
      console.error("Error sending customer email:", customerEmailError);
      throw customerEmailError;
    }

    console.log("Customer confirmation email sent successfully");

    return new Response(
      JSON.stringify({ success: true, message: "Booking confirmation email sent" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-booking-confirmation:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to send email" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
