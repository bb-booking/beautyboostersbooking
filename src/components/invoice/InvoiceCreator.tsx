import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Receipt, 
  Send,
  Calendar,
  DollarSign,
  Building,
  CheckCircle,
  Clock,
  AlertTriangle,
  Check,
  Loader2
} from "lucide-react";

interface InvoiceCreatorProps {
  job: {
    id: string;
    title: string;
    client_name?: string;
    client_email?: string;
    client_type: 'privat' | 'virksomhed';
    hourly_rate: number;
    service_type: string;
    location: string;
    invoice_sent?: boolean;
    invoice_id?: string;
  };
  onInvoiceSent?: () => void;
}

const InvoiceCreator = ({ job, onInvoiceSent }: InvoiceCreatorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifyingCVR, setVerifyingCVR] = useState(false);
  const [cvrVerified, setCvrVerified] = useState(false);
  const [invoiceData, setInvoiceData] = useState({
    customerName: job.client_name || "",
    customerEmail: job.client_email || "",
    cvr: "",
    amount: job.hourly_rate,
    description: `Beauty service: ${job.service_type} - ${job.location}`,
    paymentTerms: 'net14', // Default to 14 days
    invoiceDate: new Date().toISOString().split('T')[0] // Today
  });

  const createInvoice = async () => {
    if (!invoiceData.customerName || !invoiceData.amount || !invoiceData.cvr) {
      toast.error('Udfyld venligst alle påkrævede felter');
      return;
    }

    if (!cvrVerified) {
      toast.error('CVR-nummer skal verificeres før faktura kan sendes');
      return;
    }

    setLoading(true);
    try {
      console.log('Sending invoice request for job:', job.id);
      
      // Calculate due date based on payment terms
      const daysToAdd = invoiceData.paymentTerms === 'net8' ? 8 : invoiceData.paymentTerms === 'net14' ? 14 : 30;
      const dueDate = new Date(Date.now() + daysToAdd * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const { data, error } = await supabase.functions.invoke('economic-invoice', {
        body: {
          jobId: job.id,
          customerName: invoiceData.customerName,
          customerEmail: invoiceData.customerEmail,
          amount: invoiceData.amount,
          description: invoiceData.description,
          dueDate: dueDate
        }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(error.message || 'Fejl ved kald til invoice service');
      }

      if (data?.error) {
        console.error('Invoice creation error:', data.error);
        throw new Error(data.error);
      }

      console.log('Invoice created successfully:', data);
      
      toast.success(`Faktura ${data.invoice.invoice_number} er sendt til e-conomic!`);
      setIsOpen(false);
      onInvoiceSent?.();
      
    } catch (error: any) {
      console.error('Error creating invoice:', error);
      toast.error(`Fejl ved oprettelse af faktura: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const calculateVAT = (netAmount: number) => {
    return Math.round(netAmount * 0.25 * 100) / 100; // 25% VAT
  };

  const calculateGross = (netAmount: number) => {
    return Math.round(netAmount * 1.25 * 100) / 100; // Net + 25% VAT
  };

  const verifyCVR = async () => {
    const cvr = invoiceData.cvr.trim();
    
    if (!cvr || cvr.length !== 8 || !/^\d{8}$/.test(cvr)) {
      toast.error('CVR-nummer skal være 8 cifre');
      return;
    }

    setVerifyingCVR(true);
    setCvrVerified(false);

    try {
      const { data, error } = await supabase.functions.invoke('verify-cvr', {
        body: { cvr }
      });

      if (error) {
        console.error('CVR verification error:', error);
        throw new Error(error.message || 'Kunne ikke verificere CVR-nummer');
      }

      if (data.error) {
        throw new Error(data.error);
      }

      console.log('CVR data:', data);
      
      // Update customer name with verified company name
      setInvoiceData(prev => ({
        ...prev,
        customerName: data.name
      }));
      
      setCvrVerified(true);
      toast.success(`✓ Verificeret: ${data.name}`);
      
    } catch (error: any) {
      console.error('Error verifying CVR:', error);
      toast.error(error.message || 'Kunne ikke verificere CVR-nummer');
      setCvrVerified(false);
    } finally {
      setVerifyingCVR(false);
    }
  };

  if (job.client_type !== 'virksomhed') {
    return null; // Only show for business clients
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant={job.invoice_sent ? "outline" : "default"}
          size="sm"
          disabled={job.invoice_sent}
        >
          <Receipt className="h-4 w-4 mr-2" />
          {job.invoice_sent ? 'Faktura sendt' : 'Send faktura'}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Opret faktura til virksomhedskunde
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Job Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Job detaljer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Service:</span>
                  <div className="font-medium">{job.service_type}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Lokation:</span>
                  <div className="font-medium">{job.location}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Klient type:</span>
                  <Badge variant="outline" className="ml-2">
                    <Building className="h-3 w-3 mr-1" />
                    Virksomhed
                  </Badge>
                </div>
                <div>
                  <span className="text-muted-foreground">Status:</span>
                  <Badge className={job.invoice_sent ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                    {job.invoice_sent ? 'Faktureret' : 'Afventer faktura'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Invoice Form */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customerName">Kundenavn *</Label>
                <Input
                  id="customerName"
                  value={invoiceData.customerName}
                  onChange={(e) => setInvoiceData(prev => ({ ...prev, customerName: e.target.value }))}
                  placeholder="Virksomhedsnavn"
                />
              </div>
              <div>
                <Label htmlFor="cvr">CVR nummer *</Label>
                <div className="flex gap-2">
                  <Input
                    id="cvr"
                    value={invoiceData.cvr}
                    onChange={(e) => {
                      setInvoiceData(prev => ({ ...prev, cvr: e.target.value }));
                      setCvrVerified(false);
                    }}
                    placeholder="12345678"
                    maxLength={8}
                    className={cvrVerified ? "border-green-500" : ""}
                  />
                  <Button
                    type="button"
                    variant={cvrVerified ? "outline" : "default"}
                    onClick={verifyCVR}
                    disabled={verifyingCVR || !invoiceData.cvr || invoiceData.cvr.length !== 8}
                    className="shrink-0"
                  >
                    {verifyingCVR ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : cvrVerified ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      'Verificer'
                    )}
                  </Button>
                </div>
                {cvrVerified && (
                  <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                    <Check className="h-3 w-3" />
                    CVR verificeret
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customerEmail">Kunde email</Label>
                <Input
                  id="customerEmail"
                  type="email"
                  value={invoiceData.customerEmail}
                  onChange={(e) => setInvoiceData(prev => ({ ...prev, customerEmail: e.target.value }))}
                  placeholder="faktura@firma.dk"
                />
              </div>
              <div>
                <Label htmlFor="invoiceDate">Faktura dato</Label>
                <Input
                  id="invoiceDate"
                  type="date"
                  value={invoiceData.invoiceDate}
                  onChange={(e) => setInvoiceData(prev => ({ ...prev, invoiceDate: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="amount">Beløb (eks. moms) *</Label>
                <div className="relative">
                  <Input
                    id="amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={invoiceData.amount}
                    onChange={(e) => setInvoiceData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                    className="pr-12"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                    DKK
                  </span>
                </div>
              </div>
              <div>
                <Label htmlFor="paymentTerms">Forfaldsdato</Label>
                <Select 
                  value={invoiceData.paymentTerms} 
                  onValueChange={(value) => setInvoiceData(prev => ({ ...prev, paymentTerms: value }))}
                >
                  <SelectTrigger id="paymentTerms">
                    <SelectValue placeholder="Vælg betalingsbetingelser" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="net8">Netto 8 dage</SelectItem>
                    <SelectItem value="net14">Netto 14 dage</SelectItem>
                    <SelectItem value="net30">Netto 30 dage</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Beskrivelse</Label>
              <Textarea
                id="description"
                value={invoiceData.description}
                onChange={(e) => setInvoiceData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Beskrivelse af ydelsen..."
                rows={3}
              />
            </div>

            {/* Price Breakdown */}
            {invoiceData.amount > 0 && (
              <Card className="bg-muted/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Prisberegning
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Beløb eks. moms:</span>
                    <span className="font-medium">{invoiceData.amount.toFixed(2)} DKK</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Moms (25%):</span>
                    <span className="font-medium">{calculateVAT(invoiceData.amount).toFixed(2)} DKK</span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between font-medium">
                      <span>Total (inkl. moms):</span>
                      <span>{calculateGross(invoiceData.amount).toFixed(2)} DKK</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Warning about e-conomic */}
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-orange-800">e-conomic Integration</p>
                    <p className="text-xs text-orange-700">
                      Fakturaen vil blive oprettet direkte i dit e-conomic regnskabssystem. 
                      Sørg for at kunde og produktinformationer er korrekte før afsendelse.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Annuller
            </Button>
            <Button 
              onClick={createInvoice} 
              disabled={loading || !invoiceData.customerName || !invoiceData.amount || !invoiceData.cvr || !cvrVerified}
            >
              {loading ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Opretter...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send til e-conomic
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InvoiceCreator;