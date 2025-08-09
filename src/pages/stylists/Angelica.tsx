import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";

const profileImg = "/lovable-uploads/9d4d8a1b-6699-4473-850c-11d43e2547c4.png";
const collageImg = "/lovable-uploads/angelica-collage.png";

const Angelica = () => {
  useEffect(() => {
    // SEO basics
    document.title = "Booster Angelika – Makeup Artist";

    const desc =
      "Booster Angelika – professionel makeup artist med 6+ års erfaring. Brude- og festmakeup samt fotoshoots i København.";

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
      link.setAttribute("href", `${window.location.origin}/stylist/angelica`);
      document.head.appendChild(link);
    }

    // Structured data (Person)
    const ld = {
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: 'Angelika',
      jobTitle: 'Makeup Artist',
      image: `${window.location.origin}${profileImg}`,
      url: `${window.location.origin}/stylist/angelica`,
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
      script.remove();
    };
  }, []);

  // Slice collage image into 3x3 tiles at runtime
  const [tiles, setTiles] = useState<string[]>([]);
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const cols = 3, rows = 3;
      const tileW = Math.floor(img.naturalWidth / cols);
      const tileH = Math.floor(img.naturalHeight / rows);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      canvas.width = tileW; canvas.height = tileH;
      const urls: string[] = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          ctx.clearRect(0, 0, tileW, tileH);
          ctx.drawImage(img, c * tileW, r * tileH, tileW, tileH, 0, 0, tileW, tileH);
          urls.push(canvas.toDataURL('image/jpeg', 0.9));
        }
      }
      setTiles(urls);
    };
    img.src = collageImg; // same-origin asset -> canvas-safe
  }, []);

  return (
    <main>
      <section className="container mx-auto px-4 py-10">
        <header className="mb-8">
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight">Booster Angelika – Makeup Artist</h1>
          <p className="mt-3 text-muted-foreground max-w-2xl">
            Professionel makeup artist med over seks års erfaring. Uddannet fra Pro Academy og løbende efteruddannet. Speciale i brude- og festmakeup samt makeup til fotoshoots.
          </p>
        </header>

        {/* Intro grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className="order-2 lg:order-1">
            <Card className="bg-card/80 backdrop-blur">
              <CardContent className="p-6">
                <article className="prose prose-neutral dark:prose-invert max-w-none">
                  <h2 className="text-xl font-semibold mb-2">Om Angelika</h2>
                  <p>
                    Angelika er professionel makeup artist med over seks års erfaring. Hun er uddannet fra den anerkendte Pro Academy makeupskole og har gennemført adskillige kurser for løbende at forbedre sine færdigheder indenfor makeup styling.
                  </p>
                  <p>
                    Hun specialiserer sig i brude- og festmakeup og har også erfaring med makeup til fotoshoots. Angelikas passion for skønhed og sans for detaljer sikrer, at hver kunde føler sig selvsikker og strålende.
                  </p>
                </article>
                <div className="mt-6 flex gap-3">
                  <Link to="/booking?booster=angelica" className="flex-1">
                    <Button className="w-full" size="lg">Book Booster</Button>
                  </Link>
                  <a href="https://www.beautyboosters.dk/pages/angelica" target="_blank" rel="noopener noreferrer" className="flex-1">
                    <Button variant="outline" className="w-full" size="lg">Se ekstern profil</Button>
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="order-1 lg:order-2">
            <img
              src={profileImg}
              alt="Booster Angelika – profilbillede, makeup artist"
              className="w-full h-[480px] object-cover object-center rounded-lg shadow"
              loading="eager"
              onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/placeholder.svg'; }}
            />
          </div>
        </div>

        {/* Portfolio */}
        <section className="mt-12" aria-labelledby="portfolio-heading">
          <h2 id="portfolio-heading" className="text-2xl font-bold mb-4">Portfolio</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tiles.length === 9 ? (
              tiles.map((src, idx) => (
                <img
                  key={idx}
                  src={src}
                  alt={`Angelika portfolio ${idx + 1}`}
                  className="w-full h-full rounded-lg object-cover"
                  loading="lazy"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/placeholder.svg'; }}
                />
              ))
            ) : (
              <img
                src={collageImg}
                alt="Angelika portfolio collage – beauty looks"
                className="w-full h-full object-cover rounded-lg"
                loading="lazy"
                onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/placeholder.svg'; }}
              />
            )}
          </div>
        </section>
      </section>
    </main>
  );
};

export default Angelica;
