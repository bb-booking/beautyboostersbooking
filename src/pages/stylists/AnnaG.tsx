import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";

const profileImg = "/lovable-uploads/0af9a841-777c-4b12-b3af-7203257907e4.png";
const collageImg = "/lovable-uploads/4c3ba182-2244-4915-9847-fa861cb7f917.png";

const AnnaG = () => {
  useEffect(() => {
    // SEO basics
    document.title = "Booster Anna G – Makeup Artist og Hårstylist";

    const desc =
      "Booster Anna G – professionel makeup artist og hårstylist i København. Book til bryllup, events og fotoshoots.";

    const setMeta = (name: string, content: string) => {
      let tag = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
      if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute("name", name);
        document.head.appendChild(tag);
      }
      tag.setAttribute("content", content);
    };

    setMeta("description", desc);

    // Canonical
    const existingCanonical = document.querySelector('link[rel="canonical"]');
    if (!existingCanonical) {
      const link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      link.setAttribute("href", `${window.location.origin}/stylist/anna-g`);
      document.head.appendChild(link);
    }

    // Structured data (Person)
    const ld = {
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: 'Anna G',
      jobTitle: 'Makeup Artist og Hårstylist',
      image: `${window.location.origin}${profileImg}`,
      url: `${window.location.origin}/stylist/anna-g`,
      worksFor: {
        '@type': 'Organization',
        name: 'BeautyBoosters'
      }
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(ld);
    document.head.appendChild(script);

    return () => {
      // Optional cleanup if navigating away frequently
      script.remove();
    };
  }, []);

  return (
    <main>
      <section className="container mx-auto px-4 py-10">
        <header className="mb-8">
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight">Booster Anna G – Makeup Artist og Hårstylist</h1>
          <p className="mt-3 text-muted-foreground max-w-2xl">
            Professionel HMUA baseret i København. Specialiseret i skræddersyede looks til bryllupper, events og fotoshoots.
          </p>
        </header>

        {/* Intro grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className="order-2 lg:order-1">
            <Card className="bg-card/80 backdrop-blur">
              <CardContent className="p-6">
                <article className="prose prose-neutral dark:prose-invert max-w-none">
                  <h2 className="text-xl font-semibold mb-2">Om Anna</h2>
                  <p>
                    Anna er en alsidig og passioneret HMUA (Hair and Makeup Artist) baseret i København. Uddannet fra Nicci Welsh Academy
                    og med erfaring fra projekter på tværs af bryllup, events og foto. Med skarpt øje for detaljer og forståelse for farveteori,
                    tekstur og teknik, skaber Anna looks, der fremhæver den naturlige skønhed og matcher lejligheden.
                  </p>
                  <p>
                    Hun arbejder tæt sammen med kunden for at sikre den helt rigtige stil – fra naturlige, glødende udtryk til mere dramatiske looks.
                  </p>
                </article>
                <div className="mt-6 flex gap-3">
                  <Link to="/booking?booster=anna-g" className="flex-1">
                    <Button className="w-full" size="lg">Book Booster</Button>
                  </Link>
                  <a href="https://www.beautyboosters.dk/pages/anna-g" target="_blank" rel="noopener noreferrer" className="flex-1">
                    <Button variant="outline" className="w-full" size="lg">Se ekstern profil</Button>
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="order-1 lg:order-2">
            <img
              src={profileImg}
              alt="Booster Anna G – profilbillede, makeup artist og hårstylist"
              className="w-full h-[480px] object-cover object-right rounded-lg shadow"
              loading="eager"
              onError={(e) => { e.currentTarget.src = '/placeholder.svg'; }}
            />
          </div>
        </div>

        {/* Portfolio */}
        <section className="mt-12" aria-labelledby="portfolio-heading">
          <h2 id="portfolio-heading" className="text-2xl font-bold mb-4">Portfolio</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <img
              src={collageImg}
              alt="Anna G portfolio collage – beauty looks"
              className="w-full h-full object-cover rounded-lg"
              loading="lazy"
              onError={(e) => { e.currentTarget.src = '/placeholder.svg'; }}
            />
          </div>
        </section>
      </section>
    </main>
  );
};

export default AnnaG;
