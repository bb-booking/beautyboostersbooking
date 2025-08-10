import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import makeupHairHero from "@/assets/makeup-hair-hero.jpg";
import bryllupHero from "@/assets/bryllup-hero.jpg";
import sfxHero from "@/assets/sfx-hero.jpg";
import eventsHero from "@/assets/events-hero.jpg";
import shootReklameHero from "@/assets/shoot-reklame-hero.jpg";

interface ServiceCategory {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  link: string;
  clientType?: 'privat' | 'virksomhed';
  category?: string;
}

const PopularServices = () => {
  const categories: ServiceCategory[] = [
    {
      id: 'makeup-hair',
      title: 'Makeup & Hår',
      subtitle: 'Professionel styling til enhver lejlighed',
      image: makeupHairHero,
      link: '/services?client=privat&category=Makeup & Hår',
      clientType: 'privat',
      category: 'Makeup & Hår'
    },
    {
      id: 'bryllup',
      title: 'Bryllup',
      subtitle: 'Din store dag fortjener perfekt styling',
      image: bryllupHero,
      link: '/services?client=privat&category=Bryllup - Brudestyling',
      clientType: 'privat',
      category: 'Bryllup - Brudestyling'
    },
    {
      id: 'events',
      title: 'Events',
      subtitle: 'Glamourøs styling til dit næste event',
      image: eventsHero,
      link: '/services?client=privat&category=Event',
      clientType: 'privat',
      category: 'Event'
    },
    {
      id: 'shoot-reklame',
      title: 'Shoot/Reklame',
      subtitle: 'Professionel styling til producktion',
      image: shootReklameHero,
      link: '/services?client=virksomhed&category=Shoot/reklame',
      clientType: 'virksomhed',
      category: 'Shoot/reklame'
    },
    {
      id: 'sfx',
      title: 'SFX',
      subtitle: 'Special effects og kreativ makeup',
      image: sfxHero,
      link: '/services?client=virksomhed&category=Specialister til projekt',
      clientType: 'virksomhed',
      category: 'Specialister til projekt'
    }
  ];

  const handleCategoryClick = (category: ServiceCategory) => {
    // Set the filters in sessionStorage so the services page can pick them up
    if (category.clientType) {
      sessionStorage.setItem('selectedClientType', category.clientType);
    }
    if (category.category) {
      sessionStorage.setItem('selectedCategory', category.category);
    }
  };

  return (
    <section className="py-16 px-4 bg-background">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
            Mest populære services
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Vælg mellem vores mest bookede kategorier og find den perfekte styling til din anledning
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Main featured category - spans 2 columns on larger screens */}
          <Link 
            to={categories[0].link}
            onClick={() => handleCategoryClick(categories[0])}
            className="lg:col-span-2 group"
          >
            <Card className="overflow-hidden h-80 lg:h-96 relative group-hover:shadow-xl transition-all duration-300 group-hover:scale-[1.02]">
              <div className="absolute inset-0">
                <img
                  src={categories[0].image}
                  alt={categories[0].title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              </div>
              <CardContent className="relative h-full flex flex-col justify-end p-6 text-white">
                <div className="mb-4">
                  <h3 className="text-2xl lg:text-3xl font-bold mb-2">{categories[0].title}</h3>
                  <p className="text-lg opacity-90">{categories[0].subtitle}</p>
                </div>
                <Button 
                  variant="secondary" 
                  className="self-start group-hover:bg-white group-hover:text-primary transition-colors"
                >
                  Se services
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </Link>

          {/* Secondary categories */}
          <div className="lg:col-span-1 grid grid-cols-1 gap-6">
            {categories.slice(1, 3).map((category) => (
              <Link 
                key={category.id}
                to={category.link}
                onClick={() => handleCategoryClick(category)}
                className="group"
              >
                <Card className="overflow-hidden h-36 relative group-hover:shadow-lg transition-all duration-300 group-hover:scale-[1.02]">
                  <div className="absolute inset-0">
                    <img
                      src={category.image}
                      alt={category.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  </div>
                  <CardContent className="relative h-full flex flex-col justify-end p-4 text-white">
                    <h3 className="text-lg font-bold mb-1">{category.title}</h3>
                    <p className="text-sm opacity-90 mb-2">{category.subtitle}</p>
                    <Button 
                      size="sm" 
                      variant="secondary" 
                      className="self-start text-xs group-hover:bg-white group-hover:text-primary transition-colors"
                    >
                      Se services
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Bottom row for remaining categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {categories.slice(3).map((category) => (
            <Link 
              key={category.id}
              to={category.link}
              onClick={() => handleCategoryClick(category)}
              className="group"
            >
              <Card className="overflow-hidden h-48 relative group-hover:shadow-lg transition-all duration-300 group-hover:scale-[1.02]">
                <div className="absolute inset-0">
                  <img
                    src={category.image}
                    alt={category.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                </div>
                <CardContent className="relative h-full flex flex-col justify-end p-6 text-white">
                  <div className="mb-3">
                    <h3 className="text-xl font-bold mb-2">{category.title}</h3>
                    <p className="opacity-90">{category.subtitle}</p>
                  </div>
                  <Button 
                    variant="secondary" 
                    className="self-start group-hover:bg-white group-hover:text-primary transition-colors"
                  >
                    Se services
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Call to action */}
        <div className="text-center mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button size="lg" asChild variant="outline">
            <Link to="/services">
              Se alle services
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <Button size="lg" asChild variant="secondary">
            <Link to="/giftcards">
              Køb gavekort
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default PopularServices;