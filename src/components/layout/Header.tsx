import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, User, LogOut, Search, Menu, Download, Info, Users, Gift } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import AuthModal from "@/components/auth/AuthModal";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
const Header = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const serviceCategories = [
    { value: "all", label: "Alle services" },
    { value: "Makeup & Hår", label: "Makeup & Hår" },
    { value: "Spraytan", label: "Spraytan" },
    { value: "Konfirmation", label: "Konfirmation" },
    { value: "Bryllup - Brudestyling", label: "Bryllup - Brudestyling" },
    { value: "Makeup Kurser", label: "Makeup Kurser" },
    { value: "Event", label: "Event" },
    { value: "Børn", label: "Børn" }
  ];

  const serviceQuickLinks = [
    { label: "Makeup Styling", search: "Makeup Styling" },
    { label: "Spraytan", category: "Spraytan" },
    { label: "Hårstyling / håropsætning", search: "Hårstyling" },
    { label: "Brudestyling", category: "Bryllup - Brudestyling" },
    { label: "Makeup Kursus", category: "Makeup Kurser" },
    { label: "Event makeup", category: "Event" }
  ];

  const [loggedIn, setLoggedIn] = useState(false);
  // Track auth state to toggle Login/Logout
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setLoggedIn(!!session);
    });
    supabase.auth.getSession().then(({ data: { session } }) => setLoggedIn(!!session));
    return () => subscription.unsubscribe();
  }, []);

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
              onFocus={() => setShowSuggestions(true)}
              onClick={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 120)}
              className="pl-10 bg-background/90 border-background/20 focus:bg-background"
            />
            {showSuggestions && (
              <div className="absolute mt-1 left-0 right-0 bg-background border rounded-md shadow z-50 max-h-80 overflow-auto">
                <div className="p-3 border-b">
                  <div className="flex flex-wrap gap-2">
                    {serviceCategories.filter((c) => c.value !== "all").map((cat) => (
                      <Button
                        key={cat.value}
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="rounded-full"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            try {
                              sessionStorage.setItem("selectedCategory", cat.value);
                            } catch {}
                            setShowSuggestions(false);
                            navigate(`/services?category=${encodeURIComponent(cat.value)}`);
                          }}
                      >
                        {cat.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {searchTerm.trim().length > 0 && (
                  <div className="py-2">
                    {serviceQuickLinks
                      .filter((s) => s.label.toLowerCase().includes(searchTerm.toLowerCase()))
                      .slice(0, 5)
                      .map((s) => (
                        <div
                          key={s.label}
                          className="px-3 py-2 hover:bg-accent cursor-pointer"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            if ((s as any).category) {
                              try { sessionStorage.setItem("selectedCategory", (s as any).category); } catch {}
                              navigate(`/services?category=${encodeURIComponent((s as any).category)}`);
                            } else if ((s as any).search) {
                              navigate(`/services?search=${encodeURIComponent((s as any).search)}`);
                            }
                            setShowSuggestions(false);
                          }}
                        >
                          {s.label}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </form>
        
        <nav className="hidden md:flex items-center space-x-6">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="text-primary-foreground hover:text-background">
                <Menu className="h-4 w-4 mr-2" /> Menu
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="z-50">
              <DropdownMenuLabel>Navigation</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <Link to="/address"><DropdownMenuItem><Calendar className="mr-2 h-4 w-4" /> Book nu</DropdownMenuItem></Link>
              <Link to="/services"><DropdownMenuItem><Search className="mr-2 h-4 w-4" /> Se services</DropdownMenuItem></Link>
              <Link to="/stylists"><DropdownMenuItem><Users className="mr-2 h-4 w-4" /> Vores Boosters</DropdownMenuItem></Link>
              <Link to="/giftcards"><DropdownMenuItem><Gift className="mr-2 h-4 w-4" /> Køb gavekort</DropdownMenuItem></Link>
              <Link to="/booster-signup"><DropdownMenuItem><Users className="mr-2 h-4 w-4" /> Bliv Booster</DropdownMenuItem></Link>
              
              <DropdownMenuSeparator />
              
              <Link to="/contact"><DropdownMenuItem><Info className="mr-2 h-4 w-4" /> Kontakt</DropdownMenuItem></Link>
              <Link to="/#download-app"><DropdownMenuItem><Download className="mr-2 h-4 w-4" /> Download app</DropdownMenuItem></Link>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Sprog</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => { localStorage.setItem('lang','da'); window.location.reload(); }}>Dansk</DropdownMenuItem>
              <DropdownMenuItem onClick={() => { localStorage.setItem('lang','en'); window.location.reload(); }}>English</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
                  <Link to="/address" className="text-foreground hover:underline font-medium">Book nu</Link>
                  <Link to="/services" className="text-foreground hover:underline">Se alle services</Link>
                  <Link to="/stylists" className="text-foreground hover:underline">Vores Boosters</Link>
                  <Link to="/giftcards" className="text-foreground hover:underline">Køb gavekort</Link>
                  
                  <Link to="/contact" className="text-foreground hover:underline">Kontakt</Link>
                  <Link to="/#download-app" className="text-foreground hover:underline">Download app</Link>
                  <div className="pt-2">
                    <div className="text-xs text-muted-foreground">Sprog</div>
                    <div className="flex gap-3 mt-1">
                      <button onClick={() => { localStorage.setItem('lang','da'); window.location.reload(); }} className="underline underline-offset-4">Dansk</button>
                      <button onClick={() => { localStorage.setItem('lang','en'); window.location.reload(); }} className="underline underline-offset-4">English</button>
                    </div>
                  </div>
                </nav>

                <div className="grid gap-3">
                  <Link to="/booster-signup">
                    <Button className="w-full" variant="secondary">Bliv Booster</Button>
                  </Link>
                </div>

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
          {loggedIn ? (
            <Button
              variant="ghost"
              size="sm"
              className="text-primary-foreground hover:text-background hover:bg-background/10"
              onClick={async () => {
                await supabase.auth.signOut();
                navigate("/");
              }}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Log ud
            </Button>
          ) : (
            <AuthModal 
              trigger={
                <Button variant="ghost" size="sm" className="text-primary-foreground hover:text-primary hover:bg-background">
                  <User className="h-4 w-4 mr-2" />
                  Log Ind
                </Button>
              }
            />
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;