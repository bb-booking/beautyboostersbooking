import Hero from "@/components/home/Hero";
import AppDownloadQR from "@/components/home/AppDownloadQR";
import PopularServices from "@/components/home/PopularServices";
import { Button } from "@/components/ui/button";
import { Users, Phone, Mail, Send } from "lucide-react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Helmet>
        <title>Professionelle beauty services til døren | BeautyBoosters</title>
        <meta name="description" content="Book udkørende artister i København, Nordsjælland, Aarhus, Aalborg og Odense. Professionelle artister direkte til døren." />
        <link rel="canonical" href="/" />
      </Helmet>
      <Hero />
      
      {/* Content after hero */}
      <div className="container mx-auto px-4 md:px-8 lg:px-12 py-4 md:py-12 relative z-10">
        {/* Secondary CTA */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 max-w-2xl mx-auto justify-center">
          <Button variant="outline" size="lg" className="h-12 text-base px-6 py-3" asChild>
            <Link to="/booster-signup">
              <Users className="mr-2 h-4 w-4" />
              Bliv Booster
            </Link>
          </Button>
          <Button variant="outline" size="lg" className="h-12 text-base px-6 py-3" asChild>
            <a href="tel:+4571786575">
              <Phone className="mr-2 h-4 w-4" />
              Ring til os
            </a>
          </Button>
        </div>
      </div>

      {/* Popular Services */}
      <div className="container mx-auto px-4">
        <PopularServices />
      </div>

      <AppDownloadQR />

      {/* Contact Section */}
      <div id="kontakt" className="bg-secondary/20 py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Kontakt os</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Vi er altid klar til at hjælpe dig. Vælg den måde du foretrækker at komme i kontakt.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <Button variant="outline" size="lg" asChild>
                <a href="mailto:hello@beautyboosters.dk">
                  <Mail className="mr-2 h-5 w-5" />
                  Send Mail
                </a>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/inquiry">
                  <Send className="mr-2 h-5 w-5" />
                  Opret Forespørgsel
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <a href="tel:+4571786575">
                  <Phone className="mr-2 h-5 w-5" />
                  Ring til os
                </a>
              </Button>
            </div>

            <div className="space-y-2 text-muted-foreground">
              <p><strong>Email:</strong> hello@beautyboosters.dk</p>
              <p><strong>Telefon:</strong> +45 71 78 65 75</p>
            </div>

            <Button className="mt-6" asChild>
              <Link to="/contact">Se alle kontaktmuligheder</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
