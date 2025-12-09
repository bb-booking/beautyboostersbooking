import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { 
  User, 
  CreditCard, 
  Bell, 
  Shield, 
  LogOut,
  ChevronRight,
  Phone,
  Mail,
  ArrowLeft
} from "lucide-react";

// Mock saved payment methods
const mockPaymentMethods = [
  {
    id: '1',
    type: 'visa',
    last4: '4242',
    expiry: '12/26',
    isDefault: true,
  },
  {
    id: '2',
    type: 'mastercard',
    last4: '8888',
    expiry: '03/25',
    isDefault: false,
  },
  {
    id: '3',
    type: 'mobilepay',
    phone: '+45 12 34 56 78',
    isDefault: false,
  }
];

const CustomerSettings = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/auth');
        return;
      }

      setUser(session.user);
    } catch (error) {
      console.error('Auth error:', error);
      navigate('/auth');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const getCardIcon = (type: string) => {
    switch (type) {
      case 'visa':
        return '💳 Visa';
      case 'mastercard':
        return '💳 Mastercard';
      case 'mobilepay':
        return '📱 MobilePay';
      default:
        return '💳 Kort';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" onClick={() => navigate('/customer/dashboard')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Indstillinger</h1>
          <p className="text-muted-foreground">Administrer din profil og præferencer</p>
        </div>
      </div>

      {/* Profile Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="h-5 w-5" />
            Profil
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-medium">{user?.email?.split('@')[0]}</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>
            <Button variant="outline" size="sm">Rediger</Button>
          </div>
          
          <Separator />
          
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Email</span>
              </div>
              <span className="text-sm text-muted-foreground">{user?.email}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Telefon</span>
              </div>
              <span className="text-sm text-muted-foreground">Ikke tilføjet</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Methods Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CreditCard className="h-5 w-5" />
            Betalingsmetoder
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {mockPaymentMethods.map((method) => (
            <div 
              key={method.id} 
              className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{getCardIcon(method.type)}</span>
                <div>
                  {method.type === 'mobilepay' ? (
                    <p className="font-medium">{method.phone}</p>
                  ) : (
                    <p className="font-medium">•••• {method.last4}</p>
                  )}
                  {method.expiry && (
                    <p className="text-xs text-muted-foreground">Udløber {method.expiry}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {method.isDefault && (
                  <Badge variant="secondary" className="text-xs">Standard</Badge>
                )}
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          ))}
          
          <Button variant="outline" className="w-full mt-4">
            <CreditCard className="h-4 w-4 mr-2" />
            Tilføj betalingsmetode
          </Button>
        </CardContent>
      </Card>

      {/* Notifications Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bell className="h-5 w-5" />
            Notifikationer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Email-påmindelser</p>
                <p className="text-xs text-muted-foreground">Modtag påmindelser om kommende bookinger</p>
              </div>
              <Badge variant="outline">Aktiveret</Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">SMS-notifikationer</p>
                <p className="text-xs text-muted-foreground">Modtag SMS om vigtige opdateringer</p>
              </div>
              <Badge variant="outline">Deaktiveret</Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Tilbud og nyheder</p>
                <p className="text-xs text-muted-foreground">Modtag eksklusive tilbud via email</p>
              </div>
              <Badge variant="outline">Aktiveret</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Privacy & Security */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5" />
            Privatliv & sikkerhed
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="ghost" className="w-full justify-between">
            <span>Skift adgangskode</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" className="w-full justify-between">
            <span>Privatlivsindstillinger</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" className="w-full justify-between text-destructive hover:text-destructive">
            <span>Slet konto</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>

      {/* Logout */}
      <Button 
        variant="outline" 
        className="w-full" 
        onClick={handleLogout}
      >
        <LogOut className="h-4 w-4 mr-2" />
        Log ud
      </Button>
    </div>
  );
};

export default CustomerSettings;
