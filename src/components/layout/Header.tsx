import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, User, LogOut, Search, Menu } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import AuthModal from "@/components/auth/AuthModal";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const Header = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/services?search=${encodeURIComponent(searchTerm.trim())}`);
      setSearchTerm("");
    }
  };

  return (
    <header className="border-b bg-primary backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center">
          <img 
            src="/lovable-uploads/1f1ad539-af97-40fc-9cac-5993cda97139.png" 
            alt="BeautyBoosters Logo" 
            className="h-12 w-auto mix-blend-multiply"
          />
        </Link>
        
        {/* Search bar in center */}
        <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Søg efter services..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-background/90 border-background/20 focus:bg-background"
            />
          </div>
        </form>
        
        <nav className="hidden md:flex items-center space-x-6">
          <Link to="/services" className="text-primary-foreground hover:text-background transition-colors whitespace-nowrap">
            Se alle services
          </Link>
          <Link to="/stylists" className="text-primary-foreground hover:text-background transition-colors whitespace-nowrap">
            Vores Boosters
          </Link>
        </nav>

        {/* Mobile menu */}
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-primary-foreground">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Åbn menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <div className="space-y-6 mt-6">
                <form onSubmit={handleSearch} className="block">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Søg efter services..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </form>

                <nav className="grid gap-3">
                  <Link to="/services" className="text-foreground hover:underline">Se alle services</Link>
                  <Link to="/stylists" className="text-foreground hover:underline">Vores Boosters</Link>
                </nav>

                <div>
                  <AuthModal 
                    trigger={
                      <Button className="w-full">Log Ind</Button>
                    }
                  />
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Desktop actions */}
        <div className="hidden md:flex items-center space-x-4">
          <AuthModal 
            trigger={
              <Button variant="ghost" size="sm" className="text-primary-foreground hover:text-primary hover:bg-background">
                <User className="h-4 w-4 mr-2" />
                Log Ind
              </Button>
            }
          />
        </div>
      </div>
    </header>
  );
};

export default Header;