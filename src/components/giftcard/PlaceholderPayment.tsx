import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard, Lock } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface PlaceholderPaymentProps {
  amount: number;
  onSuccess: (code: string) => void;
  giftCardCode: string;
}

export function PlaceholderPayment({ amount, onSuccess, giftCardCode }: PlaceholderPaymentProps) {
  const [processing, setProcessing] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<string>('card');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');

  const paymentMethods = [
    { id: 'card', label: 'Kort', icon: '💳' },
    { id: 'mobilepay', label: 'MobilePay', icon: null, img: 'https://cdn.mobilepay.dk/website-images/logos/logo-blue.svg' },
    { id: 'applepay', label: 'Apple Pay', icon: '' },
    { id: 'googlepay', label: 'Google Pay', icon: null },
    { id: 'paypal', label: 'PayPal', icon: null },
  ];

  const cardTypes = [
    { name: 'Visa', color: '#1A1F71' },
    { name: 'Mastercard', color: '#EB001B' },
    { name: 'Maestro', color: '#0066A1' },
    { name: 'Dankort', color: '#ED1C24' },
  ];

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(' ') : value;
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + ' / ' + v.substring(2, 4);
    }
    return v;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    toast.success('Betaling gennemført!');
    onSuccess(giftCardCode);
    setProcessing(false);
  };

  return (
    <div className="space-y-6">
      {/* Payment Method Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-4">
        {paymentMethods.map((method) => (
          <button
            key={method.id}
            type="button"
            onClick={() => setSelectedMethod(method.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              selectedMethod === method.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted hover:bg-muted/80 text-foreground'
            }`}
          >
            {method.icon && <span>{method.icon}</span>}
            {method.label}
          </button>
        ))}
      </div>

      {/* Card Payment Form */}
      {selectedMethod === 'card' && (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Accepted Cards */}
          <div className="flex items-center gap-3 mb-4">
            <span className="text-sm text-muted-foreground">Vi accepterer:</span>
            <div className="flex gap-2">
              {cardTypes.map((card) => (
                <div
                  key={card.name}
                  className="px-2 py-1 bg-card border border-border rounded text-xs font-semibold"
                  style={{ color: card.color }}
                >
                  {card.name}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cardNumber">Kortnummer</Label>
            <div className="relative">
              <Input
                id="cardNumber"
                placeholder="1234 5678 9012 3456"
                value={cardNumber}
                onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                maxLength={19}
                className="pl-10"
              />
              <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expiry">Udløbsdato</Label>
              <Input
                id="expiry"
                placeholder="MM / ÅÅ"
                value={expiry}
                onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                maxLength={7}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cvc">CVC</Label>
              <Input
                id="cvc"
                placeholder="123"
                value={cvc}
                onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                maxLength={4}
              />
            </div>
          </div>

          <Button type="submit" size="lg" className="w-full" disabled={processing}>
            {processing ? 'Behandler betaling...' : `Betal ${amount} DKK`}
          </Button>
        </form>
      )}

      {/* MobilePay */}
      {selectedMethod === 'mobilepay' && (
        <div className="text-center py-8 space-y-4">
          <div className="w-16 h-16 mx-auto bg-[#5A78FF] rounded-2xl flex items-center justify-center text-white text-2xl font-bold">
            MP
          </div>
          <p className="text-muted-foreground">Klik for at betale med MobilePay</p>
          <Button size="lg" className="bg-[#5A78FF] hover:bg-[#4A68EF]" onClick={handleSubmit} disabled={processing}>
            {processing ? 'Behandler...' : `Betal ${amount} DKK med MobilePay`}
          </Button>
        </div>
      )}

      {/* Apple Pay */}
      {selectedMethod === 'applepay' && (
        <div className="text-center py-8 space-y-4">
          <div className="w-16 h-16 mx-auto bg-black rounded-2xl flex items-center justify-center text-white text-2xl">
            
          </div>
          <p className="text-muted-foreground">Klik for at betale med Apple Pay</p>
          <Button size="lg" className="bg-black hover:bg-gray-800" onClick={handleSubmit} disabled={processing}>
            {processing ? 'Behandler...' : `Betal med  Pay`}
          </Button>
        </div>
      )}

      {/* Google Pay */}
      {selectedMethod === 'googlepay' && (
        <div className="text-center py-8 space-y-4">
          <div className="w-16 h-16 mx-auto bg-white border border-border rounded-2xl flex items-center justify-center text-2xl font-semibold">
            G
          </div>
          <p className="text-muted-foreground">Klik for at betale med Google Pay</p>
          <Button size="lg" variant="outline" className="border-2" onClick={handleSubmit} disabled={processing}>
            {processing ? 'Behandler...' : `Betal ${amount} DKK med Google Pay`}
          </Button>
        </div>
      )}

      {/* PayPal */}
      {selectedMethod === 'paypal' && (
        <div className="text-center py-8 space-y-4">
          <div className="w-16 h-16 mx-auto bg-[#003087] rounded-2xl flex items-center justify-center text-white text-xl font-bold italic">
            PP
          </div>
          <p className="text-muted-foreground">Klik for at betale med PayPal</p>
          <Button size="lg" className="bg-[#0070BA] hover:bg-[#005EA6]" onClick={handleSubmit} disabled={processing}>
            {processing ? 'Behandler...' : `Betal ${amount} DKK med PayPal`}
          </Button>
        </div>
      )}

      {/* Security Badge */}
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-4 border-t border-border">
        <Lock className="h-3 w-3" />
        <span>Sikker betaling med SSL-kryptering</span>
      </div>
    </div>
  );
}
