# BeautyBoosters – Overdragelsesdokument

> Genereret: 2026-02-16

---

## 1. Projekt-overblik

| Element | Værdi |
|---|---|
| **App-navn** | BeautyBoosters |
| **Lovable projekt-ID** | `fc5712fa-87cd-44b6-b469-11038720dc9a` |
| **Lovable URL** | https://lovable.dev/projects/fc5712fa-87cd-44b6-b469-11038720dc9a |
| **Publiceret URL** | https://beautyboostersbooking.lovable.app |
| **Tech stack** | React, Vite, TypeScript, Tailwind CSS, shadcn/ui |

---

## 2. Supabase

| Element | Værdi |
|---|---|
| **Projekt-ID** | `ffmahgphhprqphukcand` |
| **Dashboard** | https://supabase.com/dashboard/project/ffmahgphhprqphukcand |
| **API URL** | `https://ffmahgphhprqphukcand.supabase.co` |
| **Anon Key** | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmbWFoZ3BoaHBycXBodWtjYW5kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1Njc3OTMsImV4cCI6MjA3MDE0Mzc5M30.ENuTgX8WNjgTBszJApnB-9JSp3hUDRPfQUirmQSzxUY` |

### 2.1 Secrets (Edge Functions)

Følgende secrets er konfigureret i Supabase og skal overdrages/genskabes:

| Secret | Beskrivelse | Hvor det hentes |
|---|---|---|
| `STRIPE_SECRET_KEY` | Stripe privat API-nøgle | https://dashboard.stripe.com/apikeys |
| `RESEND_API_KEY` | Email-afsendelse via Resend | https://resend.com/api-keys |
| `MICROSOFT_CLIENT_ID` | Azure App Registration (Outlook sync) | Azure Portal → App Registrations |
| `MICROSOFT_CLIENT_SECRET` | Azure App Registration secret | Azure Portal → App Registrations |
| `SHOPIFY_STORE_DOMAIN` | Shopify butikkens domæne | Shopify Admin |
| `SHOPIFY_ACCESS_TOKEN` | Shopify API adgangstoken | Shopify Admin → Apps → Custom apps |
| `SHOPIFY_WEBHOOK_SECRET` | Shopify webhook verifikation | Shopify Admin → Notifications → Webhooks |
| `LOVABLE_API_KEY` | Lovable AI integration | Lovable dashboard |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase admin-adgang (auto) | Supabase → Settings → API |
| `SUPABASE_ANON_KEY` | Supabase public key (auto) | Supabase → Settings → API |
| `SUPABASE_URL` | Supabase URL (auto) | Supabase → Settings → API |
| `SUPABASE_DB_URL` | Database connection string | Supabase → Settings → Database |
| `SEND_EMAIL_HOOK_SECRET` | Email hook verifikation | Internt genereret |

### 2.2 Edge Functions

| Funktion | JWT | Beskrivelse |
|---|---|---|
| `ai-assistant` | Nej | AI chat-assistent |
| `approve-booster-application` | Ja | Godkend booster-ansøgning |
| `capture-payment` | Ja | Capture Stripe betaling |
| `create-giftcard-payment` | Nej | Gavekort betaling |
| `create-giftcard` | Nej | Opret gavekort |
| `create-payment-intent` | Nej | Stripe PaymentIntent |
| `create-shopify-product` | Nej | Opret Shopify produkt |
| `create-test-job` | Nej | Test job oprettelse |
| `create-user-admin` | Nej | Opret admin bruger |
| `economic-invoice` | Ja | E-conomic fakturering |
| `generate-job-title` | Nej | AI-genereret job-titel |
| `get-admin-users` | – | Hent admin-brugere |
| `handle-booking-response` | Nej | Håndter booster booking-svar |
| `outlook-calendar-auth` | Nej | OAuth flow start |
| `outlook-calendar-callback` | Nej | OAuth callback |
| `sync-outlook-calendar` | Nej | To-vejs Outlook sync |
| `push-to-outlook` | Nej | Push jobs til Outlook |
| `process-job-application` | Nej | Behandl job-ansøgning |
| `release-job` | Ja | Frigiv job |
| `send-booking-confirmation` | Nej | Booking bekræftelses-email |
| `send-booster-notification` | Nej | Push-notifikation til booster |
| `send-chat-email` | Nej | Chat email-notifikation |
| `send-email` | Nej | Generel email |
| `send-giftcard` | Nej | Send gavekort via email |
| `send-inquiry-email` | Nej | Forespørgsels-email |
| `send-invoice-reminder` | Nej | Faktura-påmindelse |
| `setup-first-user` | Nej | Initialiser første admin |
| `shopify-order-webhook` | Nej | Shopify ordre-webhook |
| `shopify-product-webhook` | Nej | Shopify produkt-webhook |
| `stripe-public-key` | Nej | Returnerer Stripe publishable key |
| `verify-cvr` | Nej | CVR-opslag |

### 2.3 Storage Buckets

| Bucket | Public | Beskrivelse |
|---|---|---|
| `chat-images` | Ja | Billeder fra chat |
| `booster-avatars` | Ja | Booster profilbilleder |
| `booking-images` | Ja | Booking inspirationsbilleder |
| `booster-portfolio` | Ja | Portfolio-billeder |

### 2.4 Database-tabeller

Primære tabeller: `bookings`, `booster_profiles`, `booster_availability`, `booster_applications`, `booster_booking_requests`, `jobs`, `job_services`, `job_booster_assignments`, `job_applications`, `job_communications`, `job_competence_tags`, `competence_tags`, `invoices`, `conversations`, `conversation_messages`, `notifications`, `booking_reviews`, `booking_images`, `booking_reminders`, `discount_codes`, `customer_addresses`, `customer_favorites`, `user_roles`, `admin_settings`, `push_subscriptions`, `inquiries`, `salon_profiles`, `salon_employees`, `salon_services`, `salon_employee_services`, `salon_bookings`, `shopify_products`, `shopify_bookings`, `shopify_webhook_logs`, `address_cache`, `booster_portfolio_images`.

### 2.5 Brugerroller

Systemet bruger `user_roles`-tabellen med enum `app_role`: `admin`, `booster`, `salon`.

---

## 3. Tredjepartstjenester

### 3.1 Stripe
- **Dashboard**: https://dashboard.stripe.com
- **Bruges til**: Betalinger, PaymentIntents, MobilePay (kræver aktivering)
- **Overdrag**: Tilføj ny ejer som teammedlem eller overfør Stripe-konto

### 3.2 Resend (Email)
- **Dashboard**: https://resend.com
- **Bruges til**: Alle transaktionelle emails (booking-bekræftelser, notifikationer, gavekorte)
- **Overdrag**: Tilføj ny ejer til Resend-teamet eller overfør konto

### 3.3 Microsoft Azure (Outlook Kalender)
- **Portal**: https://portal.azure.com
- **App Registration**: Skal have redirect URI: `https://ffmahgphhprqphukcand.supabase.co/functions/v1/outlook-calendar-callback`
- **Scopes**: `Calendars.ReadWrite`, `offline_access`, `User.Read`
- **Overdrag**: Tilføj ny ejer som Owner på Azure App Registration

### 3.4 Shopify
- **Admin**: Shopify butikkens admin-panel
- **Bruges til**: Produkt-sync, ordre-webhooks, booking-widget
- **Webhook URL**: `https://ffmahgphhprqphukcand.supabase.co/functions/v1/shopify-order-webhook`
- **Overdrag**: Tilføj ny ejer som Staff i Shopify

---

## 4. Overdragelses-checkliste

- [ ] **Lovable**: Overfør projekt via Project Settings → Transfer
- [ ] **Supabase**: Inviter ny ejer med Owner-rolle i Organisation Settings
- [ ] **GitHub**: Overfør repo via Settings → Danger Zone → Transfer ownership
- [ ] **Stripe**: Tilføj ny ejer / overfør konto
- [ ] **Resend**: Tilføj ny ejer / overfør konto
- [ ] **Azure**: Tilføj ny ejer på App Registration
- [ ] **Shopify**: Tilføj ny ejer som Staff / overfør butik
- [ ] **Domæne/DNS**: Overfør domæneadgang (hvis custom domain bruges)
- [ ] **Secrets**: Bekræft at ny ejer har adgang til alle API-nøgler
- [ ] **E-conomic**: Overfør adgang hvis fakturering bruges

---

## 5. Kontaktinfo

| Rolle | Navn | Email |
|---|---|---|
| Nuværende ejer | _[INDSÆT]_ | _[INDSÆT]_ |
| Ny ejer | _[INDSÆT]_ | _[INDSÆT]_ |

---

*Dette dokument bør opdateres med navne og kontaktoplysninger før overdragelse.*
