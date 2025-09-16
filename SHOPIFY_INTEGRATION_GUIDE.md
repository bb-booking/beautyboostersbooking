# BeautyBoosters Shopify Integration - Development Guide

## Tema Integration Workflow

### 1. Forberedelse
- Opret kopi af aktivt tema i Shopify admin
- Download tema files til lokal development
- Backup eksisterende integration files

### 2. Integration Files til Upload

#### A. Templates
Opret disse template filer i dit tema:

**templates/product-booking.liquid**
```liquid
<!-- Booking template - upload fra shopify-integration/templates/ -->
```

#### B. Assets
Upload disse filer til assets/ mappen:

**assets/booking-widget.js**
- Skal opdateres med dine Supabase credentials:
```javascript
this.supabaseUrl = 'https://ffmahgphhprqphukcand.supabase.co';
this.supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmbWFoZ3BoaHBycXBodWtjYW5kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1Njc3OTMsImV4cCI6MjA3MDE0Mzc5M30.ENuTgX8WNjgTBszJApnB-9JSp3hUDRPfQUirmQSzxUY';
```

**assets/booking-widget.css**
- Styling der matcher dit tema

#### C. Snippets
**snippets/booking-product-form.liquid**
**snippets/beautyboosters-booking.liquid**

#### D. Sections
**sections/beauty-booking.liquid**

### 3. Eksisterende Produkt Integration

Modificer dine eksisterende produktsider:

**templates/product.liquid** - tilføj:
```liquid
{% if product.tags contains 'beauty-service' %}
  {% include 'booking-product-form' %}
{% endif %}
```

### 4. Test Procedure

1. **Upload integration files** til test tema
2. **Opret test produkter** med 'beauty-service' tag
3. **Test booking flow** grundigt
4. **Verificer Supabase integration** virker
5. **Test på mobile/desktop**

### 5. Go-Live Strategi

Når alt fungerer i test:
1. **Publish test tema** som nyt aktivt tema
2. **Eller** kopier ændringer til eksisterende aktivt tema
3. **Opdater webhook endpoints** hvis nødvendigt
4. **Monitor** for fejl første time efter launch

### 6. Webhook Integration

Sikr dig at din eksisterende webhook håndterer booking metadata:

```javascript
// I shopify-order-webhook edge function
const orderProperties = order.line_items[0].properties;
if (orderProperties && orderProperties['Booking ID']) {
  const bookingId = orderProperties['Booking ID'];
  // Link med eksisterende booking i Supabase
}
```

## Development Tips

### Lokalt Theme Development
```bash
# Install Shopify CLI
npm install -g @shopify/cli

# Download dit tema
shopify theme pull

# Development server med hot reload
shopify theme dev
```

### Integration Testing
1. Test på preview URL før go-live
2. Brug test produkter med lavere priser
3. Verificer alle booking steps virker
4. Test fejlhåndtering (f.eks. ingen boosters tilgængelige)

### Rollback Plan
- Gem backup af originalt tema
- Test rollback procedure
- Forbered hurtig rollback hvis problemer opstår

## Environment Variabler

**Production:**
- Supabase URL: `https://ffmahgphhprqphukcand.supabase.co`
- Anon Key: `eyJh...`

**Webhook URL:**
- `https://ffmahgphhprqphukcand.supabase.co/functions/v1/shopify-order-webhook`

## Support Files

De eksisterende integration files i projektet er klar til upload:
- `shopify-integration/templates/`
- `shopify-integration/assets/`
- `shopify-integration/snippets/`
- `shopify-integration/sections/`