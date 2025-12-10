import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY") as string);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BoosterNotificationRequest {
  boosterId: string;
  boosterEmail?: string;
  boosterName: string;
  customerName: string;
  serviceName: string;
  bookingDate: string;
  bookingTime: string;
  location: string;
  amount: number;
  specialRequests?: string;
  bookingId: string;
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
  return timeStr.substring(0, 5);
};

// Calculate booster earnings (60% of total)
const calculateBoosterEarnings = (amount: number): number => {
  return Math.round(amount * 0.6);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const data: BoosterNotificationRequest = await req.json();
    
    console.log("Sending booster notification for booking:", data.bookingId);
    console.log("Booster:", data.boosterName, "ID:", data.boosterId);

    // If no email provided, try to get it from auth.users via booster_profiles
    let boosterEmail = data.boosterEmail;
    
    if (!boosterEmail) {
      // Try to get email from auth user linked to booster profile
      const { data: userData, error: userError } = await supabase.auth.admin.getUserById(data.boosterId);
      
      if (!userError && userData?.user?.email) {
        boosterEmail = userData.user.email;
        console.log("Found booster email from auth:", boosterEmail);
      } else {
        console.log("Could not find booster email, skipping email notification");
        return new Response(
          JSON.stringify({ success: true, message: "No email available for booster, notification skipped" }),
          {
            status: 200,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }
    }

    const formattedDate = formatDate(data.bookingDate);
    const formattedTime = formatTime(data.bookingTime);
    const boosterEarnings = calculateBoosterEarnings(data.amount);

    const boosterHtml = `
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
            <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">Booster Portal</p>
          </div>
          
          <div style="background: #ffffff; padding: 32px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 24px;">
              <div style="display: inline-block; background: #E3F2FD; padding: 12px 24px; border-radius: 50px;">
                <span style="color: #1565C0; font-weight: 600; font-size: 16px;">🎉 Ny booking!</span>
              </div>
            </div>
            
            <p style="margin: 0 0 24px; font-size: 16px;">Hej ${data.boosterName},</p>
            
            <p style="margin: 0 0 24px; font-size: 16px;">Du har modtaget en ny booking! Her er detaljerne:</p>
            
            <div style="background: #FAF7F5; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #666; font-size: 14px;">Service</td>
                  <td style="padding: 8px 0; text-align: right; font-weight: 600; font-size: 14px;">${data.serviceName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666; font-size: 14px;">Kunde</td>
                  <td style="padding: 8px 0; text-align: right; font-weight: 600; font-size: 14px;">${data.customerName}</td>
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
                  <td style="padding: 16px 0 8px; color: #1a1a1a; font-size: 16px; font-weight: 600;">Din indtjening</td>
                  <td style="padding: 16px 0 8px; text-align: right; font-weight: 700; font-size: 18px; color: #2E7D32;">${boosterEarnings} DKK</td>
                </tr>
              </table>
            </div>
            
            <div style="text-align: center; margin-bottom: 24px;">
              <a href="https://beautyboosters.dk/booster/dashboard" style="display: inline-block; background: #D4A574; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                Se i din kalender
              </a>
            </div>
            
            <div style="background: #FFF8E1; border-radius: 8px; padding: 16px; margin-bottom: 24px; border-left: 4px solid #FFC107;">
              <p style="margin: 0; font-size: 14px; color: #5D4E37;">
                <strong>Husk:</strong> Kontakt kunden via chatten i appen hvis du har spørgsmål. Kundens telefonnummer er tilgængeligt for admin ved behov.
              </p>
            </div>
            
            <p style="margin: 24px 0 0; font-size: 14px;">
              God arbejdslyst!<br>
              <strong>BeautyBoosters teamet</strong>
            </p>
          </div>
          
          <div style="text-align: center; padding: 24px; color: #999; font-size: 12px;">
            <p style="margin: 0;">© ${new Date().getFullYear()} BeautyBoosters ApS</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const { error: boosterEmailError } = await resend.emails.send({
      from: "BeautyBoosters <onboarding@resend.dev>",
      to: [boosterEmail],
      subject: `Ny booking: ${data.serviceName} - ${formattedDate}`,
      html: boosterHtml,
    });

    if (boosterEmailError) {
      console.error("Error sending booster email:", boosterEmailError);
      throw boosterEmailError;
    }

    console.log("Booster notification email sent successfully to:", boosterEmail);

    return new Response(
      JSON.stringify({ success: true, message: "Booster notification email sent" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-booster-notification:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to send email" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
