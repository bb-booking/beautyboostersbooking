import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

export default function Handover() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Print button - hidden when printing */}
      <div className="no-print fixed top-4 right-4 z-50">
        <Button onClick={() => window.print()} variant="outline" size="sm">
          <Printer className="h-4 w-4 mr-2" />
          Print / Gem som PDF
        </Button>
      </div>

      <div className="print-content max-w-4xl mx-auto px-8 py-12">
        <h1 className="text-3xl font-bold mb-1 text-gray-900">BeautyBoosters – Overdragelsesdokument</h1>
        <p className="text-sm text-gray-500 mb-2">Genereret: 2026-02-16</p>
        <p className="text-sm text-gray-500 mb-8">Sidst opdateret: 2026-02-16</p>

        <hr className="my-6 border-gray-300" />

        {/* 1. Projekt-overblik */}
        <h2 className="text-xl font-semibold mt-8 mb-4 text-gray-900">1. Projekt-overblik</h2>
        <table className="w-full text-sm border-collapse mb-6">
          <tbody>
            {[
              ["App-navn", "BeautyBoosters"],
              ["Lovable projekt-ID", "fc5712fa-87cd-44b6-b469-11038720dc9a"],
              ["Lovable URL", "https://lovable.dev/projects/fc5712fa-87cd-44b6-b469-11038720dc9a"],
              ["Publiceret URL", "https://beautyboostersbooking.lovable.app"],
              ["Tech stack", "React, Vite, TypeScript, Tailwind CSS, shadcn/ui"],
            ].map(([key, val]) => (
              <tr key={key} className="border-b border-gray-200">
                <td className="py-2 pr-4 font-medium w-48">{key}</td>
                <td className="py-2 break-all">{val}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <hr className="my-6 border-gray-300" />

        {/* 2. Supabase */}
        <h2 className="text-xl font-semibold mt-8 mb-4 text-gray-900">2. Supabase</h2>
        <table className="w-full text-sm border-collapse mb-6">
          <tbody>
            {[
              ["Projekt-ID", "ffmahgphhprqphukcand"],
              ["Dashboard", "https://supabase.com/dashboard/project/ffmahgphhprqphukcand"],
              ["API URL", "https://ffmahgphhprqphukcand.supabase.co"],
            ].map(([key, val]) => (
              <tr key={key} className="border-b border-gray-200">
                <td className="py-2 pr-4 font-medium w-48">{key}</td>
                <td className="py-2 break-all">{val}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* 2.1 Secrets */}
        <h3 className="text-lg font-semibold mt-6 mb-3 text-gray-900">2.1 Secrets (Edge Functions)</h3>
        <table className="w-full text-sm border-collapse mb-6">
          <thead>
            <tr className="border-b-2 border-gray-300 text-left">
              <th className="py-2 pr-4">Secret</th>
              <th className="py-2 pr-4">Beskrivelse</th>
              <th className="py-2">Hvor det hentes</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["STRIPE_SECRET_KEY", "Stripe privat API-nøgle", "dashboard.stripe.com/apikeys"],
              ["RESEND_API_KEY", "Email via Resend", "resend.com/api-keys"],
              ["MICROSOFT_CLIENT_ID", "Azure App Registration", "Azure Portal → App Registrations"],
              ["MICROSOFT_CLIENT_SECRET", "Azure App Registration secret", "Azure Portal → App Registrations"],
              ["SHOPIFY_STORE_DOMAIN", "Shopify butikkens domæne", "Shopify Admin"],
              ["SHOPIFY_ACCESS_TOKEN", "Shopify API adgangstoken", "Shopify Admin → Apps → Custom apps"],
              ["SHOPIFY_WEBHOOK_SECRET", "Shopify webhook verifikation", "Shopify Admin → Webhooks"],
              ["LOVABLE_API_KEY", "Lovable AI integration", "Lovable dashboard"],
              ["SUPABASE_SERVICE_ROLE_KEY", "Supabase admin-adgang", "Supabase → Settings → API"],
              ["SUPABASE_DB_URL", "Database connection string", "Supabase → Settings → Database"],
              ["SEND_EMAIL_HOOK_SECRET", "Email hook verifikation", "Internt genereret"],
            ].map(([s, d, w]) => (
              <tr key={s} className="border-b border-gray-200">
                <td className="py-2 pr-4 font-mono text-xs">{s}</td>
                <td className="py-2 pr-4">{d}</td>
                <td className="py-2">{w}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* 2.2 Edge Functions */}
        <h3 className="text-lg font-semibold mt-6 mb-3 text-gray-900">2.2 Edge Functions</h3>
        <table className="w-full text-sm border-collapse mb-6">
          <thead>
            <tr className="border-b-2 border-gray-300 text-left">
              <th className="py-2 pr-4">Funktion</th>
              <th className="py-2 pr-4">JWT</th>
              <th className="py-2">Beskrivelse</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["ai-assistant", "Nej", "AI chat-assistent"],
              ["approve-booster-application", "Ja", "Godkend booster-ansøgning"],
              ["capture-payment", "Ja", "Capture Stripe betaling"],
              ["create-giftcard-payment", "Nej", "Gavekort betaling"],
              ["create-giftcard", "Nej", "Opret gavekort"],
              ["create-payment-intent", "Nej", "Stripe PaymentIntent"],
              ["create-shopify-product", "Nej", "Opret Shopify produkt"],
              ["create-test-job", "Nej", "Test job oprettelse"],
              ["create-user-admin", "Nej", "Opret admin bruger"],
              ["economic-invoice", "Ja", "E-conomic fakturering"],
              ["generate-job-title", "Nej", "AI-genereret job-titel"],
              ["get-admin-users", "–", "Hent admin-brugere"],
              ["handle-booking-response", "Nej", "Håndter booster booking-svar"],
              ["outlook-calendar-auth", "Nej", "OAuth flow start"],
              ["outlook-calendar-callback", "Nej", "OAuth callback"],
              ["sync-outlook-calendar", "Nej", "To-vejs Outlook sync"],
              ["push-to-outlook", "Nej", "Push jobs til Outlook"],
              ["process-job-application", "Nej", "Behandl job-ansøgning"],
              ["release-job", "Ja", "Frigiv job"],
              ["send-booking-confirmation", "Nej", "Booking bekræftelses-email"],
              ["send-booster-notification", "Nej", "Push-notifikation til booster"],
              ["send-chat-email", "Nej", "Chat email-notifikation"],
              ["send-email", "Nej", "Generel email"],
              ["send-giftcard", "Nej", "Send gavekort via email"],
              ["send-inquiry-email", "Nej", "Forespørgsels-email"],
              ["send-invoice-reminder", "Nej", "Faktura-påmindelse"],
              ["setup-first-user", "Nej", "Initialiser første admin"],
              ["shopify-order-webhook", "Nej", "Shopify ordre-webhook"],
              ["shopify-product-webhook", "Nej", "Shopify produkt-webhook"],
              ["stripe-public-key", "Nej", "Returnerer Stripe publishable key"],
              ["verify-cvr", "Nej", "CVR-opslag"],
            ].map(([f, j, d]) => (
              <tr key={f} className="border-b border-gray-200">
                <td className="py-1.5 pr-4 font-mono text-xs">{f}</td>
                <td className="py-1.5 pr-4">{j}</td>
                <td className="py-1.5">{d}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* 2.3 Storage */}
        <h3 className="text-lg font-semibold mt-6 mb-3 text-gray-900">2.3 Storage Buckets</h3>
        <table className="w-full text-sm border-collapse mb-6">
          <thead>
            <tr className="border-b-2 border-gray-300 text-left">
              <th className="py-2 pr-4">Bucket</th>
              <th className="py-2 pr-4">Public</th>
              <th className="py-2">Beskrivelse</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["chat-images", "Ja", "Billeder fra chat"],
              ["booster-avatars", "Ja", "Booster profilbilleder"],
              ["booking-images", "Ja", "Booking inspirationsbilleder"],
              ["booster-portfolio", "Ja", "Portfolio-billeder"],
            ].map(([b, p, d]) => (
              <tr key={b} className="border-b border-gray-200">
                <td className="py-2 pr-4 font-mono text-xs">{b}</td>
                <td className="py-2 pr-4">{p}</td>
                <td className="py-2">{d}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* 2.4 Database tables */}
        <h3 className="text-lg font-semibold mt-6 mb-3 text-gray-900">2.4 Database-tabeller</h3>
        <p className="text-sm mb-6 leading-relaxed">
          <code className="text-xs">bookings</code>, <code className="text-xs">booster_profiles</code>, <code className="text-xs">booster_availability</code>, <code className="text-xs">booster_applications</code>, <code className="text-xs">booster_booking_requests</code>, <code className="text-xs">jobs</code>, <code className="text-xs">job_services</code>, <code className="text-xs">job_booster_assignments</code>, <code className="text-xs">job_applications</code>, <code className="text-xs">job_communications</code>, <code className="text-xs">job_competence_tags</code>, <code className="text-xs">competence_tags</code>, <code className="text-xs">invoices</code>, <code className="text-xs">conversations</code>, <code className="text-xs">conversation_messages</code>, <code className="text-xs">notifications</code>, <code className="text-xs">booking_reviews</code>, <code className="text-xs">booking_images</code>, <code className="text-xs">booking_reminders</code>, <code className="text-xs">discount_codes</code>, <code className="text-xs">customer_addresses</code>, <code className="text-xs">customer_favorites</code>, <code className="text-xs">user_roles</code>, <code className="text-xs">admin_settings</code>, <code className="text-xs">push_subscriptions</code>, <code className="text-xs">inquiries</code>, <code className="text-xs">salon_profiles</code>, <code className="text-xs">salon_employees</code>, <code className="text-xs">salon_services</code>, <code className="text-xs">salon_employee_services</code>, <code className="text-xs">salon_bookings</code>, <code className="text-xs">shopify_products</code>, <code className="text-xs">shopify_bookings</code>, <code className="text-xs">shopify_webhook_logs</code>, <code className="text-xs">address_cache</code>, <code className="text-xs">booster_portfolio_images</code>
        </p>

        {/* 2.5 Roles */}
        <h3 className="text-lg font-semibold mt-6 mb-3 text-gray-900">2.5 Brugerroller</h3>
        <p className="text-sm mb-6">Enum <code className="text-xs">app_role</code>: <code className="text-xs">admin</code>, <code className="text-xs">booster</code>, <code className="text-xs">salon</code> via <code className="text-xs">user_roles</code>-tabellen.</p>

        <hr className="my-6 border-gray-300" />

        {/* 3. Tredjepartstjenester */}
        <h2 className="text-xl font-semibold mt-8 mb-4 text-gray-900">3. Tredjepartstjenester</h2>

        {[
          {
            title: "3.1 Stripe",
            items: [
              ["Dashboard", "https://dashboard.stripe.com"],
              ["Bruges til", "Betalinger, PaymentIntents, MobilePay"],
              ["Overdrag", "Tilføj ny ejer som teammedlem eller overfør konto"],
            ],
          },
          {
            title: "3.2 Resend (Email)",
            items: [
              ["Dashboard", "https://resend.com"],
              ["Bruges til", "Alle transaktionelle emails"],
              ["Overdrag", "Tilføj ny ejer til teamet"],
            ],
          },
          {
            title: "3.3 Microsoft Azure (Outlook Kalender)",
            items: [
              ["Portal", "https://portal.azure.com"],
              ["Redirect URI", "https://ffmahgphhprqphukcand.supabase.co/functions/v1/outlook-calendar-callback"],
              ["Scopes", "Calendars.ReadWrite, offline_access, User.Read"],
              ["Overdrag", "Tilføj ny ejer som Owner på App Registration"],
            ],
          },
          {
            title: "3.4 Shopify",
            items: [
              ["Webhook URL", "https://ffmahgphhprqphukcand.supabase.co/functions/v1/shopify-order-webhook"],
              ["Overdrag", "Tilføj ny ejer som Staff / overfør butik"],
            ],
          },
        ].map((section) => (
          <div key={section.title} className="mb-6">
            <h3 className="text-lg font-semibold mb-2 text-gray-900">{section.title}</h3>
            <table className="w-full text-sm border-collapse">
              <tbody>
                {section.items.map(([key, val]) => (
                  <tr key={key} className="border-b border-gray-200">
                    <td className="py-2 pr-4 font-medium w-40">{key}</td>
                    <td className="py-2 break-all">{val}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}

        <hr className="my-6 border-gray-300" />

        {/* 4. Checkliste */}
        <h2 className="text-xl font-semibold mt-8 mb-4 text-gray-900">4. Overdragelses-checkliste</h2>
        <ul className="text-sm space-y-2 mb-6">
          {[
            { text: "Lovable: Overfør projekt via Project Settings → Transfer", done: true, note: "hello@beautyboosters.dk har fået eget login og ejerskab" },
            { text: "Supabase: Inviter ny ejer med Owner-rolle", done: true, note: "hello@beautyboosters.dk er gjort til Owner" },
            { text: "GitHub: Overfør repo via Settings → Transfer ownership", done: true, note: "Ny GitHub-konto oprettet til hello@beautyboosters.dk – ejerskab overføres" },
            { text: "Stripe: Tilføj ny ejer / overfør konto", done: true, note: "Kun placeholder-funktioner – ikke aktivt i brug endnu" },
            { text: "Resend: Tilføj ny ejer / overfør konto", done: true, note: "hello@beautyboosters.dk har eget login" },
            { text: "Azure: Tilføj ny ejer på App Registration", done: true, note: "Adgang via IT-admin Søren (Outlook)" },
            { text: "Shopify: Tilføj ny ejer som Staff / overfør butik", done: true, note: "Har allerede adgang" },
            { text: "Domæne/DNS: Overfør domæneadgang", done: true, note: "Adgang overdraget sammen med app-ejerskab" },
            { text: "Secrets: Bekræft adgang til alle API-nøgler", done: true, note: "Alle secrets ligger i Supabase – ny ejer har Owner-adgang" },
            { text: "E-conomic: Overfør adgang til fakturering", done: true, note: "Har adgang" },
          ].map((item) => (
            <li key={item.text} className="flex items-start gap-2">
              {item.done ? (
                <span className="inline-block w-4 h-4 bg-green-500 text-white rounded-sm mt-0.5 flex-shrink-0 text-center text-xs leading-4">✓</span>
              ) : (
                <span className="inline-block w-4 h-4 border border-gray-400 rounded-sm mt-0.5 flex-shrink-0" />
              )}
              <span>
                {item.text}
                {item.note && <span className="text-green-600 ml-1 text-xs">— {item.note}</span>}
              </span>
            </li>
          ))}
        </ul>

        <hr className="my-6 border-gray-300" />

        {/* 5. Kontaktinfo */}
        <h2 className="text-xl font-semibold mt-8 mb-4 text-gray-900">5. Kontaktinfo</h2>
        <table className="w-full text-sm border-collapse mb-8">
          <thead>
            <tr className="border-b-2 border-gray-300 text-left">
              <th className="py-2 pr-4">Rolle</th>
              <th className="py-2 pr-4">Navn</th>
              <th className="py-2">Email</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-200">
              <td className="py-2 pr-4">Nuværende ejer</td>
              <td className="py-2 pr-4 italic text-gray-400">[INDSÆT]</td>
              <td className="py-2 italic text-gray-400">[INDSÆT]</td>
            </tr>
            <tr className="border-b border-gray-200">
              <td className="py-2 pr-4">Ny ejer</td>
              <td className="py-2 pr-4">BeautyBoosters Admin</td>
              <td className="py-2">hello@beautyboosters.dk</td>
            </tr>
          </tbody>
        </table>

        <p className="text-xs text-gray-500 italic">Udfyld kontaktinfo før overdragelse.</p>

        <hr className="my-6 border-gray-300" />

        {/* 6. Tilbud: Videreudvikling */}
        <h2 className="text-xl font-semibold mt-8 mb-4 text-gray-900">6. Tilbud: Videreudvikling af appen</h2>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6 text-sm">
          <p className="font-semibold mb-2">Stfalcon LLC – Teknisk audit & videreudvikling</p>
          <p className="mb-3 text-gray-600">Kontaktperson: <strong>Alina Moturnak</strong>, Client & Partner Manager</p>
          
          <h3 className="font-semibold mt-4 mb-2">Foreslået fremgangsmåde:</h3>
          <ol className="list-decimal list-inside space-y-2 text-gray-700 mb-4">
            <li>Del en fuld liste over teknologier, integrationer og tredjepartsbiblioteker i projektet</li>
            <li>En senior-udvikler udfører en fokuseret teknisk audit (op til 8 timer) – gennemgang af kodebase, kvalitet, stabilitet og anbefalinger</li>
            <li>Baseret på audit-resultater udarbejdes næste skridt, estimater og evt. løbende udvikling og support</li>
          </ol>

          <div className="bg-white border border-gray-200 rounded p-4 mb-4">
            <p className="font-semibold text-gray-900">Pris for teknisk audit: <span className="text-green-700">$300</span></p>
            <p className="text-xs text-gray-500 mt-1">Op til 8 timers gennemgang af senior-udvikler</p>
          </div>

          <h3 className="font-semibold mt-4 mb-2">Kontaktinfo:</h3>
          <table className="w-full text-sm border-collapse">
            <tbody>
              {[
                ["E-mail", "alina.moturnak@stfalcon.com"],
                ["LinkedIn", "Alina Moturnak"],
                ["Kalender (book møde)", "calendly.com/alina-moturnak-stfalcon"],
                ["WhatsApp / Telefon", "+380 96 784 6030"],
              ].map(([key, val]) => (
                <tr key={key} className="border-b border-gray-200">
                  <td className="py-1.5 pr-4 font-medium w-48">{key}</td>
                  <td className="py-1.5">{val}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <details className="mt-6">
            <summary className="cursor-pointer font-semibold text-gray-700 hover:text-gray-900">📧 Original e-mail fra Alina (klik for at læse)</summary>
            <div className="mt-3 bg-white border border-gray-200 rounded p-4 text-sm text-gray-700 whitespace-pre-line leading-relaxed">
              <p>Hello Louise,</p>
              <p className="mt-2">Thank you for reaching out - we appreciate the opportunity to review your request. My name is Alina, and I am a Client & Partner Manager. I will be your primary point of contact and will support you throughout the entire communication and discovery process.</p>
              <p className="mt-2">Based on your description, your request aligns closely with the types of projects we regularly support - especially when it comes to reviewing products, validating code quality, identifying risks, and planning further improvements.</p>
              <p className="mt-2">To provide you with a more accurate estimate and a clear, structured view of the next steps for improving your product, we would suggest the following approach:</p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-2">
                <li>You share with us a full list of technologies, integrations, and third-party libraries currently used in the project</li>
                <li>We involve a senior-level developer for a focused technical audit (up to 8 hours) to review the existing codebase, assess overall quality and stability, and provide initial feedback and improvement recommendations.</li>
                <li>The cost of this audit is $300.</li>
                <li>Based on the audit results, we outline the next steps, prepare estimates for your tasks, and proceed with ongoing development and support if everything aligns.</li>
              </ul>
              <p className="mt-2">If this approach sounds reasonable, I'd be happy to jump on a short call to discuss it in more detail and answer any questions you might have. You can book a convenient time directly via my calendar here: <a href="https://calendly.com/alina-moturnak-stfalcon" className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">calendly.com/alina-moturnak-stfalcon</a></p>
              <p className="mt-2">Looking forward to your thoughts.</p>
              <p className="mt-4 text-gray-500 text-xs">Alina Moturnak | Client Manager at Stfalcon LLC</p>
            </div>
          </details>
        </div>
      </div>

      <style>{`
        @media print {
          body { background: white !important; }
          .no-print { display: none !important; }
          .print-content { padding: 0 !important; max-width: 100% !important; }
        }
      `}</style>
    </div>
  );
}
