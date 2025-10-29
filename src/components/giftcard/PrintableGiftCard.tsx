import { Button } from "@/components/ui/button";
import { X, Printer } from "lucide-react";
import { useRef } from "react";

interface PrintableGiftCardProps {
  code: string;
  toName: string;
  fromName: string;
  message?: string;
  mode: 'amount' | 'service';
  amount?: number;
  serviceName?: string;
  servicePrice?: number;
  validTo: string;
  onClose: () => void;
}

export function PrintableGiftCard({
  code,
  toName,
  fromName,
  message,
  mode,
  amount,
  serviceName,
  servicePrice,
  validTo,
  onClose,
}: PrintableGiftCardProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const validToDate = new Date(validTo).toLocaleDateString('da-DK', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="relative">
      <div className="no-print flex justify-end gap-2 mb-4">
        <Button variant="outline" size="sm" onClick={handlePrint}>
          <Printer className="h-4 w-4 mr-2" />
          Print
        </Button>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div ref={printRef} className="print-content bg-background p-8 rounded-lg">
        <div className="max-w-2xl mx-auto bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-12 rounded-2xl border-2 border-primary/20 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              BEAUTYBOOSTERS
            </h1>
            <div className="text-2xl font-semibold text-foreground">Gavekort</div>
          </div>

          {/* Recipient Info */}
          <div className="bg-card/50 backdrop-blur-sm rounded-xl p-6 mb-6 border border-border">
            <div className="text-sm text-muted-foreground mb-1">Til</div>
            <div className="text-2xl font-bold text-foreground">{toName}</div>
            <div className="text-sm text-muted-foreground mt-3 mb-1">Fra</div>
            <div className="text-lg text-foreground">{fromName}</div>
          </div>

          {/* Message */}
          {message && (
            <div className="bg-card/30 rounded-xl p-6 mb-6 border border-border/50">
              <div className="text-sm italic text-foreground/80 leading-relaxed">"{message}"</div>
            </div>
          )}

          {/* Gift Card Value */}
          <div className="bg-gradient-to-r from-primary to-secondary p-8 rounded-xl mb-6 text-center shadow-lg">
            {mode === 'amount' ? (
              <>
                <div className="text-white/90 text-sm font-medium mb-2">Gavekort værdi</div>
                <div className="text-white text-5xl font-bold">{amount} DKK</div>
              </>
            ) : (
              <>
                <div className="text-white/90 text-sm font-medium mb-2">Service</div>
                <div className="text-white text-3xl font-bold mb-1">{serviceName}</div>
                {servicePrice && (
                  <div className="text-white/90 text-lg">Værdi: {servicePrice} DKK</div>
                )}
              </>
            )}
          </div>

          {/* Code and Expiry */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-card/50 backdrop-blur-sm rounded-xl p-4 border border-border">
              <div className="text-xs text-muted-foreground mb-2">Rabatkode</div>
              <div className="text-xl font-mono font-bold text-foreground tracking-wider break-all">
                {code}
              </div>
            </div>
            <div className="bg-card/50 backdrop-blur-sm rounded-xl p-4 border border-border">
              <div className="text-xs text-muted-foreground mb-2">Gyldig til</div>
              <div className="text-lg font-semibold text-foreground">{validToDate}</div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-muted/30 rounded-lg p-4 mb-6">
            <div className="text-xs text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Sådan indløses gavekortet:</strong><br />
              Indtast koden i feltet "Rabatkode" ved checkout på beautyboosters.dk
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-xs text-muted-foreground pt-6 border-t border-border/50">
            BeautyBoosters • beautyboosters.dk<br />
            Gavekortet er gyldigt til og med {validToDate} • Ikke-refunderbart
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-content, .print-content * {
            visibility: visible;
          }
          .print-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
