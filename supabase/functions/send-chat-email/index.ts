import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type RequestBody = {
  conversationId: string;
  name?: string;
  email?: string;
  message: string;
};

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { conversationId, name, email, message } = (await req.json()) as RequestBody;

    if (!message || !conversationId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const subject = `Ny chatbesked fra ${name?.trim() || "kunde"}`;
    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Ny chatbesked</h2>
        <p><strong>Navn:</strong> ${name || "(ikke angivet)"}</p>
        <p><strong>Email:</strong> ${email || "(ikke angivet)"}</p>
        <p><strong>Samtale ID:</strong> ${conversationId}</p>
        <hr />
        <p style="white-space: pre-line;">${message}</p>
      </div>
    `;

    const toAddress = "hello@beautyboosters.dk";

    const emailResp = await resend.emails.send({
      from: "BeautyBoosters Chat <no-reply@resend.dev>",
      to: [toAddress],
      subject,
      html,
    });

    console.log("send-chat-email: Email sent", emailResp);

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("send-chat-email error", error);
    return new Response(
      JSON.stringify({ error: error?.message || "Unknown error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
