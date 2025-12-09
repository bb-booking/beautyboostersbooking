import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Home, MapPin, Plus, Trash2, Star, ArrowLeft } from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface SavedAddress {
  id: string;
  label: string;
  address: string;
  postal_code: string;
  city: string;
  is_default: boolean;
}

// Mock addresses for demo
const mockAddresses: SavedAddress[] = [
  {
    id: 'mock-addr-1',
    label: 'Privat',
    address: 'Vesterbrogade 123',
    postal_code: '1620',
    city: 'København V',
    is_default: true
  },
  {
    id: 'mock-addr-2',
    label: 'Kontor',
    address: 'Bredgade 45, 3. sal',
    postal_code: '1260',
    city: 'København K',
    is_default: false
  },
  {
    id: 'mock-addr-3',
    label: 'Hotel',
    address: 'Hotel D\'Angleterre, Kongens Nytorv 34',
    postal_code: '1050',
    city: 'København K',
    is_default: false
  }
];

const CustomerAddresses = () => {
  const navigate = useNavigate();
  const [addresses, setAddresses] = useState<SavedAddress[]>(mockAddresses);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    label: "",
    address: "",
    postal_code: "",
    city: "",
    is_default: false
  });

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }

      const { data, error } = await supabase
        .from('customer_addresses')
        .select('*')
        .eq('user_id', session.user.id)
        .order('is_default', { ascending: false });

      if (error) throw error;
      // Use real data if available, otherwise show mock data
      if (data && data.length > 0) {
        setAddresses(data);
      } else {
        setAddresses(mockAddresses);
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
      setAddresses(mockAddresses);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAddress = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // If setting as default, unset other defaults first
      if (formData.is_default) {
        await supabase
          .from('customer_addresses')
          .update({ is_default: false })
          .eq('user_id', session.user.id);
      }

      const { error } = await supabase
        .from('customer_addresses')
        .insert([{
          ...formData,
          user_id: session.user.id
        }]);

      if (error) throw error;

      toast.success('Adresse gemt');
      setIsDialogOpen(false);
      setFormData({ label: "", address: "", postal_code: "", city: "", is_default: false });
      fetchAddresses();
    } catch (error) {
      console.error('Error saving address:', error);
      toast.error('Kunne ikke gemme adresse');
    }
  };

  const handleDeleteAddress = async (id: string) => {
    try {
      const { error } = await supabase
        .from('customer_addresses')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Adresse slettet');
      fetchAddresses();
    } catch (error) {
      console.error('Error deleting address:', error);
      toast.error('Kunne ikke slette adresse');
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Unset all defaults
      await supabase
        .from('customer_addresses')
        .update({ is_default: false })
        .eq('user_id', session.user.id);

      // Set new default
      const { error } = await supabase
        .from('customer_addresses')
        .update({ is_default: true })
        .eq('id', id);

      if (error) throw error;
      toast.success('Standard adresse opdateret');
      fetchAddresses();
    } catch (error) {
      console.error('Error setting default:', error);
      toast.error('Kunne ikke opdatere standard adresse');
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
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/customer/dashboard')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Mine adresser</h1>
            <p className="text-muted-foreground mt-1">Gem dine foretrukne adresser til hurtigere booking</p>
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Tilføj adresse
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tilføj ny adresse</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="label">Mærkat (fx "Hjem", "Arbejde")</Label>
                <Input
                  id="label"
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  placeholder="Hjem"
                />
              </div>
              <div>
                <Label htmlFor="address">Adresse</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Eksempelvej 123"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="postal_code">Postnummer</Label>
                  <Input
                    id="postal_code"
                    value={formData.postal_code}
                    onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                    placeholder="2100"
                  />
                </div>
                <div>
                  <Label htmlFor="city">By</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="København Ø"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_default"
                  checked={formData.is_default}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_default: checked })}
                />
                <Label htmlFor="is_default">Sæt som standard adresse</Label>
              </div>
              <Button onClick={handleSaveAddress} className="w-full">
                Gem adresse
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {addresses.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Home className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">Ingen gemte adresser</h3>
            <p className="text-muted-foreground mb-4">
              Tilføj en adresse for at gøre fremtidige bookinger hurtigere
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {addresses.map((address) => (
            <Card key={address.id} className={address.is_default ? "border-primary" : ""}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg">{address.label}</h3>
                      {address.is_default && (
                        <Star className="h-4 w-4 fill-primary text-primary" />
                      )}
                    </div>
                    <div className="flex items-start gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4 mt-1 flex-shrink-0" />
                      <div>
                        <p>{address.address}</p>
                        <p>{address.postal_code} {address.city}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {!address.is_default && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetDefault(address.id)}
                      >
                        Sæt som standard
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteAddress(address.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomerAddresses;
