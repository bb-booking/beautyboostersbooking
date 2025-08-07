import { Button } from "@/components/ui/button";
import { Calendar, Zap, Users } from "lucide-react";
import { Link } from "react-router-dom";

const Hero = () => {
  return (
    <section className="relative py-20 px-4">
      <div className="container mx-auto text-center">
        <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
          BookingBooster
        </h1>
        <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
          Den ultimative platform til at finde og booke dygtige boosters til dine gaming sessioner
        </p>
        
        <div className="flex flex-col md:flex-row gap-4 justify-center items-center mb-12">
          <Button size="lg" className="text-lg px-8 py-3" asChild>
            <Link to="/services">
              <Calendar className="mr-2 h-5 w-5" />
              Book Nu
            </Link>
          </Button>
          <Button variant="outline" size="lg" className="text-lg px-8 py-3" asChild>
            <Link to="/boosters">
              <Users className="mr-2 h-5 w-5" />
              Bliv Booster
            </Link>
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Zap className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Hurtig Booking</h3>
            <p className="text-muted-foreground">Book din booster på få minutter</p>
          </div>
          
          <div className="text-center">
            <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Professionelle Boosters</h3>
            <p className="text-muted-foreground">Verificerede og erfarne spillere</p>
          </div>
          
          <div className="text-center">
            <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Fleksible Tider</h3>
            <p className="text-muted-foreground">Find boosters der passer din tidsplan</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;