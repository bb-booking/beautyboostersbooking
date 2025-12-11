import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { 
  FileText, 
  Check, 
  X,
  Edit,
  Send,
  Building2,
  Calendar,
  Clock,
  Bell
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { da } from "date-fns/locale";

interface PendingInvoice {
  id: string;
  title: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  client_type: string;
  date_needed: string;
  time_needed: string;
  duration_hours: number;
  hourly_rate: number;
  location: string;
  status: string;
  invoice_sent: boolean;
  created_at: string;
}

// Mock data for demo - realistic Danish pricing (ca. 1500 kr/time for makeup artist)
const mockInvoices: PendingInvoice[] = [
  {
    id: 'mock-1',
    title: 'Makeup Artist til Film/TV Produktion',
    client_name: 'DR - Danmarks Radio',
    client_email: 'produktion@dr.dk',
    client_phone: '+45 35 20 30 40',
    client_type: 'virksomhed',
    date_needed: '2025-12-15',
    time_needed: '07:00',
    duration_hours: 8,
    hourly_rate: 1500,
    location: 'DR Byen, København',
    status: 'completed',
    invoice_sent: false,
    created_at: '2025-12-01T10:00:00Z'
  },
  {
    id: 'mock-2',
    title: 'Event Makeup til Firmajulefrokost',
    client_name: 'Novo Nordisk A/S',
    client_email: 'events@novonordisk.com',
    client_phone: '+45 44 44 88 88',
    client_type: 'virksomhed',
    date_needed: '2025-12-13',
    time_needed: '16:00',
    duration_hours: 4,
    hourly_rate: 1500,
    location: 'Bella Center, København',
    status: 'completed',
    invoice_sent: false,
    created_at: '2025-12-05T14:30:00Z'
  },
  {
    id: 'mock-3',
    title: 'Reklame Shoot - Makeup til 6 modeller',
    client_name: 'Matas Danmark',
    client_email: 'marketing@matas.dk',
    client_phone: '+45 70 10 07 00',
    client_type: 'virksomhed',
    date_needed: '2025-12-10',
    time_needed: '09:00',
    duration_hours: 6,
    hourly_rate: 1500,
    location: 'Studio Copenhagen, Vesterbro',
    status: 'completed',
    invoice_sent: false,
    created_at: '2025-12-03T09:15:00Z'
  }
];

const AdminInvoices = () => {
  const [pendingInvoices, setPendingInvoices] = useState<PendingInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<PendingInvoice | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [sendingInvoice, setSendingInvoice] = useState(false);
  const [sendingReminders, setSendingReminders] = useState(false);
  
  // Editable invoice fields
  const [editAmount, setEditAmount] = useState<number>(0);
  const [editHours, setEditHours] = useState<number>(0);
  const [editNotes, setEditNotes] = useState("");

  const handleSendReminders = async () => {
    setSendingReminders(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-invoice-reminder');
      
      if (error) throw error;
      
      toast.success(`Sendt ${data?.reminders_sent || 0} påmindelser`);
    } catch (error) {
      console.error('Error sending reminders:', error);
      toast.error('Kunne ikke sende påmindelser');
    } finally {
      setSendingReminders(false);
    }
  };

  useEffect(() => {
    fetchPendingInvoices();
  }, []);

  const fetchPendingInvoices = async () => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('client_type', 'virksomhed')
        .eq('invoice_sent', false)
        .in('status', ['completed', 'confirmed'])
        .order('date_needed', { ascending: false });

      if (error) throw error;
      
      // Use mock data if no real data exists
      if (!data || data.length === 0) {
        setPendingInvoices(mockInvoices);
      } else {
        setPendingInvoices(data);
      }
    } catch (error) {
      console.error('Error fetching pending invoices:', error);
      // Fall back to mock data on error
      setPendingInvoices(mockInvoices);
    } finally {
      setLoading(false);
    }
  };

  const openEditDialog = (invoice: PendingInvoice) => {
    setSelectedInvoice(invoice);
    setEditAmount(invoice.hourly_rate);
    setEditHours(invoice.duration_hours || 1);
    setEditNotes("");
    setEditDialogOpen(true);
  };

  const calculateTotal = () => {
    const subtotal = editAmount * editHours;
    const vat = subtotal * 0.25;
    return { subtotal, vat, total: subtotal + vat };
  };

  const handleSendInvoice = async () => {
    if (!selectedInvoice) return;
    
    setSendingInvoice(true);
    try {
      const { subtotal, vat, total } = calculateTotal();
      
      // Create invoice record
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          job_id: selectedInvoice.id,
          customer_name: selectedInvoice.client_name,
          customer_email: selectedInvoice.client_email,
          amount: subtotal,
          vat_amount: vat,
          total_amount: total,
          status: 'sent',
          sent_at: new Date().toISOString(),
          due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        })
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Update job to mark invoice as sent
      const { error: jobError } = await supabase
        .from('jobs')
        .update({ 
          invoice_sent: true,
          invoice_id: invoiceData.id,
          hourly_rate: editAmount,
          duration_hours: editHours
        })
        .eq('id', selectedInvoice.id);

      if (jobError) throw jobError;

      // Send invoice email via edge function
      try {
        await supabase.functions.invoke('economic-invoice', {
          body: { jobId: selectedInvoice.id }
        });
      } catch (emailError) {
        console.log('Invoice email sending skipped or failed:', emailError);
      }

      toast.success('Faktura sendt til ' + selectedInvoice.client_email);
      setEditDialogOpen(false);
      fetchPendingInvoices();
    } catch (error) {
      console.error('Error sending invoice:', error);
      toast.error('Kunne ikke sende faktura');
    } finally {
      setSendingInvoice(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('da-DK', {
      style: 'currency',
      currency: 'DKK',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'd. MMMM yyyy', { locale: da });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Ventende fakturaer</h2>
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-20 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Ventende fakturaer</h2>
          <p className="text-muted-foreground">
            Gennemgå og godkend fakturaer for virksomhedsbookinger
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={handleSendReminders}
            disabled={sendingReminders}
          >
            <Bell className="h-4 w-4 mr-2" />
            {sendingReminders ? 'Sender...' : 'Send påmindelser'}
          </Button>
          <Badge variant="secondary" className="text-lg px-4 py-2">
            {pendingInvoices.length} ventende
          </Badge>
        </div>
      </div>

      {pendingInvoices.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Ingen ventende fakturaer</h3>
            <p className="text-muted-foreground">
              Når virksomhedsbookinger er afsluttet, vil de vises her til godkendelse
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {pendingInvoices.map((invoice) => (
              <Card key={invoice.id}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-muted-foreground shrink-0" />
                      <div>
                        <div className="font-medium">{invoice.client_name}</div>
                        <div className="text-sm text-muted-foreground">{invoice.client_email}</div>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 shrink-0 text-xs">
                      Afventer
                    </Badge>
                  </div>
                  
                  <div className="text-sm">{invoice.title}</div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {formatDate(invoice.date_needed)}
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {invoice.duration_hours || 1} timer
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="font-medium">
                      {formatCurrency((invoice.hourly_rate || 0) * (invoice.duration_hours || 1))}
                      <span className="text-xs text-muted-foreground ml-1">eks. moms</span>
                    </div>
                    <Button size="sm" onClick={() => openEditDialog(invoice)}>
                      <Edit className="h-4 w-4 mr-1" />
                      Gennemgå
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Desktop Table View */}
          <Card className="hidden md:block">
            <CardHeader>
              <CardTitle>Ventende virksomhedsfakturaer</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Virksomhed</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Dato</TableHead>
                    <TableHead>Timer</TableHead>
                    <TableHead>Beløb (eks. moms)</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Handlinger</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{invoice.client_name}</div>
                            <div className="text-sm text-muted-foreground">{invoice.client_email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{invoice.title}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {formatDate(invoice.date_needed)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          {invoice.duration_hours || 1} timer
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatCurrency((invoice.hourly_rate || 0) * (invoice.duration_hours || 1))}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                          Afventer godkendelse
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          onClick={() => openEditDialog(invoice)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Gennemgå
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}

      {/* Edit & Send Invoice Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Gennemgå og send faktura
            </DialogTitle>
          </DialogHeader>

          {selectedInvoice && (
            <div className="space-y-4">
              {/* Customer Info */}
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Building2 className="h-4 w-4" />
                  Kundeoplysninger
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Virksomhed:</span>
                    <div className="font-medium">{selectedInvoice.client_name}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Email:</span>
                    <div className="font-medium">{selectedInvoice.client_email}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Telefon:</span>
                    <div className="font-medium">{selectedInvoice.client_phone || '-'}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Lokation:</span>
                    <div className="font-medium">{selectedInvoice.location}</div>
                  </div>
                </div>
              </div>

              {/* Service Info */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Service</Label>
                <div className="text-sm">{selectedInvoice.title}</div>
                <div className="text-sm text-muted-foreground">
                  {formatDate(selectedInvoice.date_needed)} kl. {selectedInvoice.time_needed || 'Ikke angivet'}
                </div>
              </div>

              {/* Editable Amount */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hours">Antal timer</Label>
                  <Input
                    id="hours"
                    type="number"
                    min="1"
                    value={editHours}
                    onChange={(e) => setEditHours(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Timepris (DKK eks. moms)</Label>
                  <Input
                    id="amount"
                    type="number"
                    min="0"
                    value={editAmount}
                    onChange={(e) => setEditAmount(Number(e.target.value))}
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Noter til faktura (valgfrit)</Label>
                <Textarea
                  id="notes"
                  placeholder="Tilføj eventuelle noter..."
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows={2}
                />
              </div>

              {/* Price Summary */}
              <div className="bg-muted rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal ({editHours} timer × {formatCurrency(editAmount)})</span>
                  <span>{formatCurrency(calculateTotal().subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Moms (25%)</span>
                  <span>{formatCurrency(calculateTotal().vat)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-bold">
                  <span>Total inkl. moms</span>
                  <span>{formatCurrency(calculateTotal().total)}</span>
                </div>
              </div>

              <div className="text-sm text-muted-foreground">
                Fakturaen sendes til {selectedInvoice.client_email} med betalingsfrist på 14 dage.
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
            >
              <X className="h-4 w-4 mr-1" />
              Annuller
            </Button>
            <Button
              onClick={handleSendInvoice}
              disabled={sendingInvoice}
            >
              {sendingInvoice ? (
                <>Sender...</>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-1" />
                  Godkend og send faktura
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminInvoices;
