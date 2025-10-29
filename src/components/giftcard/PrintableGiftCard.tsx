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
        <div className="max-w-2xl mx-auto bg-card p-12 rounded-xl border border-border shadow-sm">
          {/* Header */}
          <div className="text-center mb-10 pb-6 border-b border-border/50">
            <h1 className="text-3xl font-light tracking-wider mb-2 text-foreground">
              BEAUTYBOOSTERS
            </h1>
            <div className="text-lg font-light text-muted-foreground tracking-wide">Gavekort</div>
          </div>

          {/* Recipient Info */}
          <div className="mb-8">
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Til</div>
            <div className="text-2xl font-light text-foreground mb-6">{toName}</div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Fra</div>
            <div className="text-lg font-light text-foreground">{fromName}</div>
          </div>

          {/* Message */}
          {message && (
            <div className="mb-8 py-6 px-4 border-l-2 border-border">
              <div className="text-sm italic text-muted-foreground leading-relaxed">"{message}"</div>
            </div>
          )}

          {/* Gift Card Value */}
          <div className="bg-muted/20 p-8 rounded-lg mb-8 text-center border border-border/50">
            {mode === 'amount' ? (
              <>
                <div className="text-muted-foreground text-xs uppercase tracking-wider mb-3">Værdi</div>
                <div className="text-foreground text-5xl font-light tracking-tight">{amount}</div>
                <div className="text-muted-foreground text-sm mt-1">DKK</div>
              </>
            ) : (
              <>
                <div className="text-muted-foreground text-xs uppercase tracking-wider mb-3">Service</div>
                <div className="text-foreground text-2xl font-light mb-2">{serviceName}</div>
                {servicePrice && (
                  <div className="text-muted-foreground text-sm">{servicePrice} DKK</div>
                )}
              </>
            )}
          </div>

          {/* Code and Expiry */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="text-center">
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Rabatkode</div>
              <div className="text-lg font-mono font-medium text-foreground tracking-wide break-all px-2">
                {code}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Gyldig til</div>
              <div className="text-base font-light text-foreground">{validToDate}</div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-muted/10 rounded p-4 mb-8 border border-border/30">
            <div className="text-xs text-muted-foreground leading-relaxed">
              Indtast koden ved checkout på <span className="font-medium text-foreground">beautyboosters.dk</span>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-xs text-muted-foreground pt-6 border-t border-border/30">
            <div className="mb-1 font-light tracking-wide">BeautyBoosters</div>
            <div className="text-[10px]">Gavekortet er gyldigt til og med {validToDate} • Ikke-refunderbart</div>
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
