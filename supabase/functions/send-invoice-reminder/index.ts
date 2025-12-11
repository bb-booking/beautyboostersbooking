import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Invoice {
  id: string;
  invoice_number: string;
  customer_name: string;
  customer_email: string;
  total_amount: number;
  due_date: string;
  status: string;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('da-DK', {
    style: 'currency',
    currency: 'DKK',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

const handler = async (req: Request): Promise<Response> => {
  console.log("Invoice reminder function called");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get invoices that are due soon (within 7 days) or overdue
    const today = new Date();
    const sevenDaysFromNow = new Date(today);
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    console.log("Checking for invoices due before:", sevenDaysFromNow.toISOString());

    const { data: invoices, error: fetchError } = await supabase
      .from("invoices")
      .select("*")
      .in("status", ["sent", "overdue"])
      .lte("due_date", sevenDaysFromNow.toISOString().split("T")[0]);

    if (fetchError) {
      console.error("Error fetching invoices:", fetchError);
      throw fetchError;
    }

    console.log(`Found ${invoices?.length || 0} invoices to process`);

    const reminders: Array<{ invoice_id: string; status: string; email: string }> = [];

    for (const invoice of invoices || []) {
      if (!invoice.customer_email) {
        console.log(`Skipping invoice ${invoice.id} - no customer email`);
        continue;
      }

      const dueDate = new Date(invoice.due_date);
      const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      let subject = "";
      let urgency = "";
      
      if (daysUntilDue < 0) {
        subject = `Påmindelse: Faktura ${invoice.invoice_number} er overskredet`;
        urgency = `Fakturaen er ${Math.abs(daysUntilDue)} dage over forfaldsdato.`;
      } else if (daysUntilDue === 0) {
        subject = `Påmindelse: Faktura ${invoice.invoice_number} forfalder i dag`;
        urgency = "Fakturaen forfalder i dag.";
      } else if (daysUntilDue <= 3) {
        subject = `Påmindelse: Faktura ${invoice.invoice_number} forfalder snart`;
        urgency = `Fakturaen forfalder om ${daysUntilDue} dag${daysUntilDue > 1 ? 'e' : ''}.`;
      } else {
        subject = `Påmindelse: Faktura ${invoice.invoice_number} forfalder om ${daysUntilDue} dage`;
        urgency = `Fakturaen forfalder den ${new Date(invoice.due_date).toLocaleDateString('da-DK')}.`;
      }

      console.log(`Sending reminder to ${invoice.customer_email} for invoice ${invoice.invoice_number}`);

      const emailResponse = await resend.emails.send({
        from: "Beauty Boosters <onboarding@resend.dev>",
        to: [invoice.customer_email],
        subject: subject,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #f8f4f0; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
              .content { background: #fff; padding: 20px; border: 1px solid #e5e5e5; border-top: none; }
              .amount { font-size: 24px; font-weight: bold; color: #000; }
              .urgency { background: ${daysUntilDue < 0 ? '#fee2e2' : daysUntilDue <= 3 ? '#fef3c7' : '#f0fdf4'}; 
                         color: ${daysUntilDue < 0 ? '#dc2626' : daysUntilDue <= 3 ? '#d97706' : '#16a34a'}; 
                         padding: 10px 15px; border-radius: 6px; margin: 15px 0; }
              .details { background: #f9fafb; padding: 15px; border-radius: 6px; margin: 15px 0; }
              .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
              .btn { display: inline-block; background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0; color: #000;">Beauty Boosters</h1>
                <p style="margin: 5px 0 0; color: #666;">Fakturapåmindelse</p>
              </div>
              <div class="content">
                <p>Kære ${invoice.customer_name},</p>
                
                <div class="urgency">
                  <strong>${urgency}</strong>
                </div>
                
                <div class="details">
                  <p style="margin: 0;"><strong>Fakturanummer:</strong> ${invoice.invoice_number}</p>
                  <p style="margin: 5px 0 0;"><strong>Forfaldsdato:</strong> ${new Date(invoice.due_date).toLocaleDateString('da-DK')}</p>
                  <p style="margin: 10px 0 0;"><strong>Beløb:</strong></p>
                  <p class="amount" style="margin: 5px 0 0;">${formatCurrency(invoice.total_amount)}</p>
                </div>
                
                <p>Vi beder dig venligst om at foretage betaling hurtigst muligt.</p>
                
                <p>Har du allerede betalt, bedes du se bort fra denne påmindelse.</p>
                
                <p>Med venlig hilsen,<br>Beauty Boosters</p>
              </div>
              <div class="footer">
                <p>Beauty Boosters ApS • CVR: 12345678<br>
                hello@beautyboosters.dk • +45 71 78 65 75</p>
              </div>
            </div>
          </body>
          </html>
        `,
      });

      console.log("Email sent:", emailResponse);

      // Log the reminder
      await supabase.from("booking_reminders").insert({
        email: invoice.customer_email,
        type: "invoice_reminder",
        scheduled_at: new Date().toISOString(),
        sent_at: new Date().toISOString(),
        payload: { 
          invoice_id: invoice.id, 
          invoice_number: invoice.invoice_number,
          amount: invoice.total_amount,
          days_until_due: daysUntilDue
        }
      });

      // Update invoice status to overdue if past due date
      if (daysUntilDue < 0 && invoice.status !== 'overdue') {
        await supabase
          .from("invoices")
          .update({ status: 'overdue' })
          .eq("id", invoice.id);
      }

      reminders.push({
        invoice_id: invoice.id,
        status: "sent",
        email: invoice.customer_email
      });
    }

    console.log(`Successfully sent ${reminders.length} reminders`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        reminders_sent: reminders.length,
        details: reminders 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-invoice-reminder function:", error);
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
