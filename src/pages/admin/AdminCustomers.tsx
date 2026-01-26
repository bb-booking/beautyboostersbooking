import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  Mail,
  Phone,
  MapPin,
  Calendar,
  User,
  ShoppingBag,
  ExternalLink,
  Users,
  Upload,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { format } from "date-fns";
import { da } from "date-fns/locale";
import { toast } from "sonner";

interface ImportedCustomer {
  name: string;
  email: string;
  phone: string;
}

interface Customer {
  email: string;
  name: string | null;
  phone: string | null;
  totalBookings: number;
  totalSpent: number;
  lastBooking: string | null;
  firstBooking: string | null;
}

interface CustomerBooking {
  id: string;
  service_name: string;
  booking_date: string;
  booking_time: string;
  amount: number;
  status: string;
  location: string | null;
  booster_name: string | null;
}

interface CustomerAddress {
  id: string;
  label: string;
  address: string;
  postal_code: string;
  city: string;
  is_default: boolean;
}

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerBookings, setCustomerBookings] = useState<CustomerBooking[]>([]);
  const [customerAddresses, setCustomerAddresses] = useState<CustomerAddress[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Import state
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importedData, setImportedData] = useState<ImportedCustomer[]>([]);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const { data: bookings, error } = await supabase
        .from("bookings")
        .select("customer_email, customer_name, customer_phone, amount, booking_date, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Aggregate customer data from bookings
      const customerMap = new Map<string, Customer>();

      bookings?.forEach((booking) => {
        const email = booking.customer_email;
        if (!email) return;

        const existing = customerMap.get(email);
        if (existing) {
          existing.totalBookings += 1;
          existing.totalSpent += Number(booking.amount) || 0;
          if (!existing.name && booking.customer_name) {
            existing.name = booking.customer_name;
          }
          if (!existing.phone && booking.customer_phone) {
            existing.phone = booking.customer_phone;
          }
          if (booking.booking_date && (!existing.lastBooking || booking.booking_date > existing.lastBooking)) {
            existing.lastBooking = booking.booking_date;
          }
          if (booking.booking_date && (!existing.firstBooking || booking.booking_date < existing.firstBooking)) {
            existing.firstBooking = booking.booking_date;
          }
        } else {
          customerMap.set(email, {
            email,
            name: booking.customer_name,
            phone: booking.customer_phone,
            totalBookings: 1,
            totalSpent: Number(booking.amount) || 0,
            lastBooking: booking.booking_date,
            firstBooking: booking.booking_date,
          });
        }
      });

      setCustomers(Array.from(customerMap.values()).sort((a, b) => b.totalBookings - a.totalBookings));
    } catch (error) {
      console.error("Error fetching customers:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerDetails = async (customer: Customer) => {
    setSelectedCustomer(customer);
    setDialogOpen(true);

    // Fetch bookings for this customer
    const { data: bookings } = await supabase
      .from("bookings")
      .select("id, service_name, booking_date, booking_time, amount, status, location, booster_name")
      .eq("customer_email", customer.email)
      .order("booking_date", { ascending: false });

    setCustomerBookings(bookings || []);

    // Try to find user_id from auth to get addresses
    // We'll search customer_addresses by checking if any match this email
    // Since customer_addresses uses user_id, we need to find the user
    const { data: addresses } = await supabase
      .from("customer_addresses")
      .select("*");

    // For now, we can't directly link addresses without user_id mapping
    // We'll show addresses if we can identify the user
    setCustomerAddresses([]);
  };

  // CSV/Numbers import functions
  const parseCSV = (text: string): ImportedCustomer[] => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];
    
    // Parse header to find columns
    const header = lines[0].split(/[,;\t]/).map(h => h.trim().toLowerCase().replace(/"/g, ''));
    
    const nameIdx = header.findIndex(h => 
      h.includes('navn') || h.includes('name') || h.includes('fornavn') || h === 'kunde'
    );
    const emailIdx = header.findIndex(h => 
      h.includes('email') || h.includes('e-mail') || h.includes('mail')
    );
    const phoneIdx = header.findIndex(h => 
      h.includes('telefon') || h.includes('phone') || h.includes('tlf') || h.includes('mobil')
    );
    
    if (emailIdx === -1) {
      setImportError('Kunne ikke finde en email-kolonne i filen. Sørg for at have en kolonne med "Email" eller "E-mail".');
      return [];
    }
    
    const customers: ImportedCustomer[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(/[,;\t]/).map(v => v.trim().replace(/"/g, ''));
      
      const email = values[emailIdx]?.trim();
      if (!email || !email.includes('@')) continue;
      
      customers.push({
        name: nameIdx >= 0 ? values[nameIdx]?.trim() || '' : '',
        email: email,
        phone: phoneIdx >= 0 ? values[phoneIdx]?.trim() || '' : '',
      });
    }
    
    return customers;
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setImportError(null);
    setImportedData([]);
    
    // Check file type
    const validTypes = ['text/csv', 'text/plain', 'application/vnd.ms-excel'];
    const isCSV = file.name.endsWith('.csv') || file.name.endsWith('.txt') || validTypes.includes(file.type);
    
    if (!isCSV) {
      setImportError('Filen skal være i CSV-format. Eksporter din Numbers-fil som CSV først (Arkiv → Eksporter til → CSV).');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const parsed = parseCSV(text);
      
      if (parsed.length === 0 && !importError) {
        setImportError('Ingen gyldige kunderækker fundet i filen.');
      } else {
        setImportedData(parsed);
      }
    };
    reader.onerror = () => {
      setImportError('Kunne ikke læse filen. Prøv igen.');
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (importedData.length === 0) return;
    
    setImporting(true);
    
    try {
      // Create placeholder bookings to add customers to the system
      // Since customers are derived from bookings, we create minimal records
      const today = format(new Date(), 'yyyy-MM-dd');
      
      const bookingsToInsert = importedData.map(customer => ({
        customer_email: customer.email,
        customer_name: customer.name || null,
        customer_phone: customer.phone || null,
        service_name: 'Importeret kunde',
        booking_date: today,
        booking_time: '00:00:00',
        amount: 0,
        status: 'imported',
      }));
      
      const { error } = await supabase
        .from('bookings')
        .insert(bookingsToInsert);
      
      if (error) throw error;
      
      toast.success(`${importedData.length} kunder importeret`);
      setImportDialogOpen(false);
      setImportedData([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
      fetchCustomers();
    } catch (error: any) {
      console.error('Import error:', error);
      toast.error('Kunne ikke importere kunder: ' + (error.message || 'Ukendt fejl'));
    } finally {
      setImporting(false);
    }
  };

  const filteredCustomers = customers.filter((customer) => {
    const search = searchTerm.toLowerCase();
    return (
      customer.email.toLowerCase().includes(search) ||
      (customer.name?.toLowerCase() || "").includes(search) ||
      (customer.phone || "").includes(search)
    );
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("da-DK", {
      style: "currency",
      currency: "DKK",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      confirmed: { label: "Bekræftet", variant: "default" },
      pending: { label: "Afventer", variant: "secondary" },
      pending_payment: { label: "Afventer betaling", variant: "secondary" },
      completed: { label: "Gennemført", variant: "default" },
      cancelled: { label: "Annulleret", variant: "destructive" },
    };
    const config = statusMap[status] || { label: status, variant: "outline" as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return email.slice(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Kunder</h1>
          <p className="text-muted-foreground">Oversigt over alle kunder og deres bookinghistorik</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => setImportDialogOpen(true)}
          >
            <Upload className="h-4 w-4 mr-2" />
            Importer
          </Button>
          <Badge variant="outline" className="text-foreground">
            <Users className="h-4 w-4 mr-1" />
            {customers.length} kunder
          </Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Søg på navn, email eller telefon..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? "Ingen kunder matcher din søgning" : "Ingen kunder endnu"}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kunde</TableHead>
                    <TableHead>Kontakt</TableHead>
                    <TableHead className="text-center">Bookings</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Seneste booking</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customer) => (
                    <TableRow key={customer.email} className="cursor-pointer hover:bg-muted/50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {getInitials(customer.name, customer.email)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-foreground">
                              {customer.name || "Ukendt navn"}
                            </p>
                            <p className="text-sm text-muted-foreground">{customer.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm text-foreground">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            <a href={`mailto:${customer.email}`} className="hover:underline">
                              {customer.email}
                            </a>
                          </div>
                          {customer.phone && (
                            <div className="flex items-center gap-1 text-sm text-foreground">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              <a href={`tel:${customer.phone}`} className="hover:underline">
                                {customer.phone}
                              </a>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="text-foreground">
                          {customer.totalBookings}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium text-foreground">
                        {formatCurrency(customer.totalSpent)}
                      </TableCell>
                      <TableCell className="text-foreground">
                        {customer.lastBooking
                          ? format(new Date(customer.lastBooking), "d. MMM yyyy", { locale: da })
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => fetchCustomerDetails(customer)}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Customer Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-primary/10 text-primary text-lg">
                  {selectedCustomer && getInitials(selectedCustomer.name, selectedCustomer.email)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-foreground">{selectedCustomer?.name || "Ukendt navn"}</p>
                <p className="text-sm font-normal text-muted-foreground">
                  {selectedCustomer?.email}
                </p>
              </div>
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-6 pr-4">
              {/* Contact Info */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2 text-foreground">
                  <User className="h-4 w-4" />
                  Kontaktoplysninger
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={`mailto:${selectedCustomer?.email}`}
                      className="text-foreground hover:underline"
                    >
                      {selectedCustomer?.email}
                    </a>
                  </div>
                  {selectedCustomer?.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a
                        href={`tel:${selectedCustomer.phone}`}
                        className="text-foreground hover:underline"
                      >
                        {selectedCustomer.phone}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-foreground">
                      {selectedCustomer?.totalBookings}
                    </p>
                    <p className="text-xs text-muted-foreground">Bookings i alt</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-foreground">
                      {selectedCustomer && formatCurrency(selectedCustomer.totalSpent)}
                    </p>
                    <p className="text-xs text-muted-foreground">Brugt i alt</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-foreground">
                      {selectedCustomer?.firstBooking
                        ? format(new Date(selectedCustomer.firstBooking), "MMM yyyy", { locale: da })
                        : "-"}
                    </p>
                    <p className="text-xs text-muted-foreground">Kunde siden</p>
                  </CardContent>
                </Card>
              </div>

              <Separator />

              {/* Booking History */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2 text-foreground">
                  <ShoppingBag className="h-4 w-4" />
                  Bookinghistorik
                </h3>
                {customerBookings.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Ingen bookings fundet</p>
                ) : (
                  <div className="space-y-3">
                    {customerBookings.map((booking) => (
                      <Card key={booking.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <p className="font-medium text-foreground">{booking.service_name}</p>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(booking.booking_date), "d. MMMM yyyy", {
                                  locale: da,
                                })}{" "}
                                kl. {booking.booking_time?.slice(0, 5)}
                              </div>
                              {booking.location && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <MapPin className="h-3 w-3" />
                                  {booking.location}
                                </div>
                              )}
                              {booking.booster_name && (
                                <p className="text-sm text-muted-foreground">
                                  Booster: {booking.booster_name}
                                </p>
                              )}
                            </div>
                            <div className="text-right space-y-1">
                              <p className="font-medium text-foreground">
                                {formatCurrency(Number(booking.amount))}
                              </p>
                              {getStatusBadge(booking.status)}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={(open) => {
        setImportDialogOpen(open);
        if (!open) {
          setImportedData([]);
          setImportError(null);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Importer kundeliste
            </DialogTitle>
            <DialogDescription>
              Upload en CSV-fil med kundedata. Hvis du bruger Numbers, eksporter først til CSV (Arkiv → Eksporter til → CSV).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt"
                onChange={handleFileUpload}
                className="hidden"
                id="csv-upload"
              />
              <label htmlFor="csv-upload" className="cursor-pointer">
                <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm font-medium">Klik for at vælge fil</p>
                <p className="text-xs text-muted-foreground mt-1">CSV-format (.csv)</p>
              </label>
            </div>

            {importError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{importError}</AlertDescription>
              </Alert>
            )}

            {importedData.length > 0 && (
              <div className="space-y-3">
                <Alert>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription>
                    {importedData.length} kunder fundet og klar til import
                  </AlertDescription>
                </Alert>
                
                <ScrollArea className="h-48 border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Navn</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Telefon</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {importedData.slice(0, 10).map((customer, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="text-foreground">{customer.name || '-'}</TableCell>
                          <TableCell className="text-foreground">{customer.email}</TableCell>
                          <TableCell className="text-foreground">{customer.phone || '-'}</TableCell>
                        </TableRow>
                      ))}
                      {importedData.length > 10 && (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-muted-foreground">
                            ... og {importedData.length - 10} flere
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>
            )}

            <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground">
              <p className="font-medium mb-1">Forventet kolonneformat:</p>
              <p>• <strong>Email</strong> (påkrævet): email, e-mail, mail</p>
              <p>• <strong>Navn</strong> (valgfrit): navn, name, fornavn, kunde</p>
              <p>• <strong>Telefon</strong> (valgfrit): telefon, phone, tlf, mobil</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
              Annuller
            </Button>
            <Button 
              onClick={handleImport} 
              disabled={importedData.length === 0 || importing}
            >
              {importing ? 'Importerer...' : `Importer ${importedData.length} kunder`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
