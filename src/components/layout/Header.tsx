import { Button } from "@/components/ui/button";
import { Calendar, User, LogOut } from "lucide-react";
import { Link } from "react-router-dom";

const Header = () => {
  return (
    <header className="border-b bg-background/95 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-3">
          <span className="text-3xl font-bold text-foreground tracking-wider">BEAUTY</span>
          <span className="text-3xl font-bold text-primary tracking-wider">BOOSTERS</span>
        </Link>
        
        <nav className="hidden md:flex items-center space-x-6">
          <Link to="/services" className="text-muted-foreground hover:text-foreground transition-colors">
            Services
          </Link>
          <Link to="/stylists" className="text-muted-foreground hover:text-foreground transition-colors">
            Stylister
          </Link>
          <Link to="/bookings" className="text-muted-foreground hover:text-foreground transition-colors">
            Mine Bookinger
          </Link>
        </nav>

        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm">
            <User className="h-4 w-4 mr-2" />
            Log Ind
          </Button>
          <Button variant="default" size="sm">
            Tilmeld Dig
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;