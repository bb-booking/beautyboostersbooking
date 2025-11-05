import Hero from "@/components/home/Hero";
import AppDownloadQR from "@/components/home/AppDownloadQR";
import PopularServices from "@/components/home/PopularServices";
import { Button } from "@/components/ui/button";
import { Users, Phone, Zap, Calendar as CalendarIcon } from "lucide-react";
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
      <div className="container mx-auto px-4 md:px-8 lg:px-12 py-8 md:py-12">
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

        {/* Feature highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 mt-8 md:mt-10 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="bg-primary/10 rounded-full w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <Zap className="h-6 w-6 sm:h-8 sm:w-8 text-foreground" />
            </div>
            <h3 className="text-base sm:text-lg font-normal mb-2">Hurtig Booking</h3>
            <p className="text-sm sm:text-base text-muted-foreground">Book din beauty‑specialist på få minutter</p>
          </div>
          <div className="text-center">
            <div className="bg-primary/10 rounded-full w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <Users className="h-6 w-6 sm:h-8 sm:w-8 text-foreground" />
            </div>
            <h3 className="text-base sm:text-lg font-normal mb-2">Professionelle Artister</h3>
            <p className="text-sm sm:text-base text-muted-foreground">Certificerede og erfarne beauty‑specialister</p>
          </div>
          <div className="text-center">
            <div className="bg-primary/10 rounded-full w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <CalendarIcon className="h-6 w-6 sm:h-8 sm:w-8 text-foreground" />
            </div>
            <h3 className="text-base sm:text-lg font-normal mb-2">Fleksible Tider</h3>
            <p className="text-sm sm:text-base text-muted-foreground">Find artister der passer din tidsplan</p>
          </div>
        </div>
      </div>

      {/* Popular Services */}
      <div className="container mx-auto px-4">
        <PopularServices />
      </div>

      <AppDownloadQR />
    </div>
  );
};

export default Index;
