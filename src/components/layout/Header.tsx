import { Button } from "@/components/ui/button";
import { Calendar, User, LogOut } from "lucide-react";
import { Link } from "react-router-dom";

const Header = () => {
  return (
    <header className="border-b bg-primary backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center">
          <img 
            src="/lovable-uploads/1f1ad539-af97-40fc-9cac-5993cda97139.png" 
            alt="BeautyBoosters Logo" 
            className="h-12 w-auto mix-blend-multiply"
          />
        </Link>
        
        <nav className="hidden md:flex items-center space-x-6">
          <Link to="/services" className="text-primary-foreground hover:text-background transition-colors">
            Services
          </Link>
          <Link to="/stylists" className="text-primary-foreground hover:text-background transition-colors">
            Boosters
          </Link>
          <Link to="/bookings" className="text-primary-foreground hover:text-background transition-colors">
            Mine Bookinger
          </Link>
        </nav>

        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" className="text-primary-foreground hover:text-primary hover:bg-background">
            <User className="h-4 w-4 mr-2" />
            Log Ind
          </Button>
          <Button variant="secondary" size="sm">
            Tilmeld Dig
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;