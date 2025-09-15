# BeautyBoosters Shopify Integration

Integration af BeautyBoosters booking system i dit eksisterende Shopify tema.

## Installation

### 1. Upload filer til dit tema

Upload følgende filer til dit Shopify tema:

#### Templates:
- `templates/product-booking.liquid` → Dit tema's templates mappe

#### Assets:
- `assets/booking-widget.js` → Dit tema's assets mappe  
- `assets/booking-widget.css` → Dit tema's assets mappe

#### Snippets:
- `snippets/booking-product-form.liquid` → Dit tema's snippets mappe

#### Sections:
- `sections/beauty-booking.liquid` → Dit tema's sections mappe

### 2. Konfiguration

#### Opdater Supabase credentials i `booking-widget.js`:
```javascript
this.supabaseUrl = 'DIN_SUPABASE_URL';
this.supabaseKey = 'DIN_ANON_KEY';
```

#### Tilføj til produktsider:
I din `templates/product.liquid`, tilføj:
```liquid
{% if product.tags contains 'beauty-service' %}
  {% include 'booking-product-form' %}
{% endif %}
```

#### Opret booking produkter:
- Tag dine beauty service produkter med 'beauty-service'
- Alternativt opret nye produkter med `product-booking` template

#### Tilføj booking sektion:
I tema customizer kan du nu tilføje "BeautyBoosters Booking" sektion til enhver side.

### 3. Webhook integration

Opdater din eksisterende webhook til at håndtere booking metadata:

```javascript
// I din shopify-order-webhook funktion
const orderProperties = order.line_items[0].properties;
if (orderProperties && orderProperties['Booking ID']) {
  // Link Shopify ordre med eksisterende booking
  const bookingId = orderProperties['Booking ID'];
  // Opdater booking status i Supabase
}
```

## Funktioner

✅ **Sømløs integration** i dit eksisterende tema
✅ **Responsive design** der passer til din visuelle identitet  
✅ **Real-time booster availability** via Supabase
✅ **Dansk adresse autocomplete** via DAWA API
✅ **Intelligent booking flow** med step-by-step guide
✅ **Automatisk Shopify cart integration**
✅ **Inquiry system** for specielle forespørgsler
✅ **Mobile optimized** booking experience

## Booking flow

1. **Service valg** - Vises på produktsider
2. **Dato & tid** - Interaktiv kalender
3. **Lokation** - Adresse autocomplete
4. **Booster valg** - Real-time availability
5. **Checkout** - Standard Shopify flow med booking data

## Styling

Alle styling variabler kan tilpasses i `booking-widget.css` for at matche dit tema.

## Support

Booking systemet integrerer med dit eksisterende Supabase setup og bruger de samme APIs som din hovedapplikation.