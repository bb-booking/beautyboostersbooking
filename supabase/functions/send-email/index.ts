import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY") as string);
const hookSecret = Deno.env.get("SEND_EMAIL_HOOK_SECRET") as string;

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("not allowed", { status: 400 });
  }

  try {
    const payload = await req.text();
    const headers = Object.fromEntries(req.headers);

    const wh = new Webhook(hookSecret);
    const {
      user,
      email_data: { token, token_hash, redirect_to, email_action_type },
    } = wh.verify(payload, headers) as {
      user: { email: string };
      email_data: {
        token: string;
        token_hash: string;
        redirect_to: string;
        email_action_type: string;
        site_url?: string;
      };
    };

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";

    const subjectMap: Record<string, string> = {
      magiclink: "Log ind med dit magiske link",
      signup: "Bekræft din email",
      recovery: "Nulstil din adgangskode",
      email_change: "Bekræft din nye email",
      invite: "Du er inviteret",
    };

    const subject = subjectMap[email_action_type] || "Din kode til BeautyBoosters";

    const verifyUrl = `${supabaseUrl}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${encodeURIComponent(
      redirect_to
    )}`;

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'; line-height: 1.6; color: #111;">
        <h1 style="margin: 0 0 16px; font-size: 22px;">${subject}</h1>
        <p style="margin: 0 0 12px;">Klik på linket herunder for at fortsætte:</p>
        <p style="margin: 0 0 16px;"><a href="${verifyUrl}" target="_blank" style="color:#2754C5;">Åbn dit sikre link</a></p>
        <p style="margin: 0 0 12px;">Eller brug denne midlertidige kode:</p>
        <code style="display:inline-block;padding:12px 16px;background:#f4f4f4;border:1px solid #e5e5e5;border-radius:6px;">${token}</code>
        <p style="margin: 16px 0 0; color:#666; font-size: 12px;">Hvis du ikke forsøgte at logge ind, kan du ignorere denne email.</p>
        <p style="margin: 8px 0 0; color:#666; font-size: 12px;">Med venlig hilsen<br/>BeautyBoosters</p>
      </div>
    `;

    const { error } = await resend.emails.send({
      from: "BeautyBoosters <onboarding@resend.dev>",
      to: [user.email],
      subject: subject,
      html,
    });

    if (error) throw error;

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("send-email error:", error);
    return new Response(
      JSON.stringify({ error: (error as any)?.message || "Unknown error" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }
});
