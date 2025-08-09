import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Store } from "lucide-react";
import { Link } from "react-router-dom";

const ForSalons = () => {
  const canonical = typeof window !== "undefined" ? `${window.location.origin}/for-salons` : "https://example.com/for-salons";

  const jsonLdApp = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "BeautyBoosters for Saloner",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "DKK",
      description: "Gratis kernefunktioner. Pro fra 199 DKK/md."
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      reviewCount: "48"
    }
  };

  const jsonLdFAQ = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Hvad koster det?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Gratis kerne. Pro 199 DKK/md, Pro+ 299 DKK/md. 10% kun på første marketplace-lead."
        }
      },
      {
        "@type": "Question",
        name: "Er betaling og MobilePay understøttet?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Ja, online betaling inkl. MobilePay via Stripe. Fakturaer til e-conomic/Dinero."
        }
      },
      {
        "@type": "Question",
        name: "Kan vi selv eje kundedata?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Ja. I ejer jeres kundedata. Provision opkræves kun ved første marketplace-lead."
        }
      }
    ]
  };

  return (
    <>
      <Helmet>
        <title>For saloner – booking, betaling og vækst | BeautyBoosters</title>
        <meta name="description" content="Gratis bookingsystem for saloner. Pro fra 199 DKK/md. 10% kun på første marketplace-lead. MobilePay, SMS, e-conomic." />
        <link rel="canonical" href={canonical} />
      </Helmet>

      <main>
        <header className="bg-background">
          <section className="container mx-auto px-4 py-12 md:py-20" aria-labelledby="for-salons-hero">
            <h1 id="for-salons-hero" className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
              For saloner – booking, betaling og vækst
            </h1>
            <p className="text-muted-foreground max-w-2xl mb-6">
              Et let og moderne system til danske saloner. Få gratis kalender og widget – opgradér til Pro når det giver mening. 10% provision kun på første marketplace-lead.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="#priser">
                <Button size="lg">
                  Se priser
                </Button>
              </Link>
              <Link to="/inquiry">
                <Button size="lg" variant="secondary">
                  Book en demo
                </Button>
              </Link>
            </div>
          </section>
        </header>

        <section id="priser" className="container mx-auto px-4 py-12" aria-labelledby="pricing-heading">
          <h2 id="pricing-heading" className="sr-only">Priser</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Core – Gratis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="text-muted-foreground">Perfekt til små teams og test</p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4" /> Kalender & aftaler</li>
                  <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4" /> Booking-widget til hjemmeside</li>
                  <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4" /> Basis kundekartotek</li>
                </ul>
              </CardContent>
              <CardFooter>
                <Link to="/for-salons#kom-i-gang">
                  <Button variant="secondary">Kom i gang</Button>
                </Link>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pro – 199 DKK/md</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="text-muted-foreground">Betaling, SMS & rapporter</p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4" /> Online betaling inkl. MobilePay</li>
                  <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4" /> SMS/e-mail påmindelser</li>
                  <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4" /> Avancerede rapporter</li>
                </ul>
              </CardContent>
              <CardFooter>
                <Link to="/for-salons#kom-i-gang">
                  <Button>Start Pro</Button>
                </Link>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pro+ – 299 DKK/md</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="text-muted-foreground">Teams & drift i skala</p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4" /> Lager, abonnementer & rabatter</li>
                  <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4" /> Vagtplan & udbetaling</li>
                  <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4" /> Segmenter & kampagner</li>
                </ul>
              </CardContent>
              <CardFooter>
                <Link to="/for-salons#kom-i-gang">
                  <Button>Start Pro+</Button>
                </Link>
              </CardFooter>
            </Card>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Provision: 10% kun ved første booking via markedspladsen. Ingen binding.
          </p>
        </section>

        <section className="container mx-auto px-4 py-12 grid md:grid-cols-3 gap-8" aria-labelledby="feature-heading">
          <h2 id="feature-heading" className="sr-only">Funktioner</h2>
          <article>
            <h3 className="text-lg font-semibold mb-2">Betaling</h3>
            <p className="text-sm text-muted-foreground">Stripe m. MobilePay, udbetalinger, delbetaling, gavekort. Fakturaer til e-conomic/Dinero.</p>
          </article>
          <article>
            <h3 className="text-lg font-semibold mb-2">Marketing</h3>
            <p className="text-sm text-muted-foreground">Autom. påmindelser, kampagner, simple CRM-segmenter og rating-flow.</p>
          </article>
          <article>
            <h3 className="text-lg font-semibold mb-2">Drift</h3>
            <p className="text-sm text-muted-foreground">Vagtplan, ressourcerum, lager, rapporter – bygget til danske saloner.</p>
          </article>
        </section>

        <section id="kom-i-gang" className="container mx-auto px-4 py-12" aria-labelledby="cta-heading">
          <div className="rounded-lg border p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h2 id="cta-heading" className="text-2xl font-bold">Klar til at starte?</h2>
              <p className="text-muted-foreground">Opret jeres salon på få minutter – I kan altid opgradere senere.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link to="/inquiry">
                <Button size="lg">
                  <Store className="h-4 w-4 mr-2" /> Opret salon gratis
                </Button>
              </Link>
              <Link to="/inquiry">
                <Button size="lg" variant="secondary">Tal med os</Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Structured data */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdApp) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdFAQ) }} />
    </>
  );
};

export default ForSalons;
