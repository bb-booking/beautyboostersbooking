import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InquiryEmailRequest {
  navn: string;
  email: string;
  telefon?: string;
  virksomhed?: string;
  service_navn?: string;
  projekt_type?: string;
  budget?: string;
  beskrivelse: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const inquiryData: InquiryEmailRequest = await req.json();

    // Send confirmation email to customer
    const customerEmailResponse = await resend.emails.send({
      from: "Onboarding <onboarding@resend.dev>",
      to: [inquiryData.email],
      subject: "Tak for din henvendelse!",
      html: `
        <h1>Tak for din henvendelse, ${inquiryData.navn}!</h1>
        <p>Vi har modtaget din forespørgsel og vender tilbage hurtigst muligt.</p>
        
        <h2>Dine oplysninger:</h2>
        <ul>
          <li><strong>Navn:</strong> ${inquiryData.navn}</li>
          <li><strong>Email:</strong> ${inquiryData.email}</li>
          ${inquiryData.telefon ? `<li><strong>Telefon:</strong> ${inquiryData.telefon}</li>` : ''}
          ${inquiryData.virksomhed ? `<li><strong>Virksomhed:</strong> ${inquiryData.virksomhed}</li>` : ''}
          ${inquiryData.service_navn ? `<li><strong>Service:</strong> ${inquiryData.service_navn}</li>` : ''}
          ${inquiryData.projekt_type ? `<li><strong>Projekt type:</strong> ${inquiryData.projekt_type}</li>` : ''}
          ${inquiryData.budget ? `<li><strong>Budget:</strong> ${inquiryData.budget}</li>` : ''}
        </ul>
        
        <h2>Din besked:</h2>
        <p>${inquiryData.beskrivelse}</p>
        
        <p>Vi behandler din henvendelse hurtigst muligt og kontakter dig inden for 24 timer.</p>
        
        <p>Med venlig hilsen,<br>Dit team</p>
      `,
    });

    // Send notification email to admin
    const adminEmailResponse = await resend.emails.send({
      from: "Onboarding <onboarding@resend.dev>",
      to: ["admin@yourcompany.com"], // Replace with actual admin email
      subject: `Ny henvendelse fra ${inquiryData.navn}`,
      html: `
        <h1>Ny henvendelse modtaget</h1>
        
        <h2>Kontaktoplysninger:</h2>
        <ul>
          <li><strong>Navn:</strong> ${inquiryData.navn}</li>
          <li><strong>Email:</strong> ${inquiryData.email}</li>
          ${inquiryData.telefon ? `<li><strong>Telefon:</strong> ${inquiryData.telefon}</li>` : ''}
          ${inquiryData.virksomhed ? `<li><strong>Virksomhed:</strong> ${inquiryData.virksomhed}</li>` : ''}
        </ul>
        
        <h2>Projektdetaljer:</h2>
        <ul>
          ${inquiryData.service_navn ? `<li><strong>Service:</strong> ${inquiryData.service_navn}</li>` : ''}
          ${inquiryData.projekt_type ? `<li><strong>Projekt type:</strong> ${inquiryData.projekt_type}</li>` : ''}
          ${inquiryData.budget ? `<li><strong>Budget:</strong> ${inquiryData.budget}</li>` : ''}
        </ul>
        
        <h2>Besked:</h2>
        <p>${inquiryData.beskrivelse}</p>
        
        <p>Log ind på admin panelet for at behandle henvendelsen.</p>
      `,
    });

    console.log("Emails sent successfully:", { customerEmailResponse, adminEmailResponse });

    return new Response(JSON.stringify({ 
      success: true, 
      customerEmailResponse, 
      adminEmailResponse 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-inquiry-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);