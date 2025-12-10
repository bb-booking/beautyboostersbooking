import { useState, useEffect } from "react";
import { X, MapPin, Clock, DollarSign, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface JobNotification {
  id: string;
  title: string;
  location: string;
  time: string;
  date: string;
  earnings: string;
  serviceType: string;
  distance: string;
}

interface PushNotificationMockupProps {
  isVisible: boolean;
  onClose: () => void;
  onAccept?: () => void;
  onReject?: () => void;
  job?: JobNotification;
}

const defaultJob: JobNotification = {
  id: "demo-1",
  title: "Bryllups Makeup",
  location: "Østerbro, København",
  time: "10:00",
  date: "I morgen",
  earnings: "1.110 kr", // 60% of 1.850 kr (booster cut)
  serviceType: "Makeup & Hår",
  distance: "2,3 km væk"
};

export function PushNotificationMockup({ 
  isVisible, 
  onClose, 
  onAccept, 
  onReject,
  job = defaultJob 
}: PushNotificationMockupProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
      setCountdown(30);
      setAccepted(false);
    }
  }, [isVisible]);

  useEffect(() => {
    if (isVisible && countdown > 0 && !accepted) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && !accepted) {
      handleReject();
    }
  }, [isVisible, countdown, accepted]);

  const handleAccept = () => {
    setAccepted(true);
    toast.success("Job accepteret! 🎉", {
      description: `Du har accepteret ${job.title} - ${job.date} kl. ${job.time}`
    });
    onAccept?.();
    setTimeout(() => {
      setIsAnimating(false);
      onClose();
    }, 1500);
  };

  const handleReject = () => {
    toast.info("Job afvist", {
      description: "Jobbet sendes videre til næste ledige booster"
    });
    onReject?.();
    setIsAnimating(false);
    onClose();
  };

  if (!isVisible && !isAnimating) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-4 px-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Notification Card - Phone style */}
      <div 
        className={`
          relative w-full max-w-sm bg-card border border-border rounded-3xl shadow-2xl
          transform transition-all duration-500 ease-out
          ${isAnimating ? 'translate-y-0 opacity-100 scale-100' : '-translate-y-full opacity-0 scale-95'}
        `}
      >
        {/* Progress bar countdown */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-muted rounded-t-3xl overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-1000 ease-linear"
            style={{ width: `${(countdown / 30) * 100}%` }}
          />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between p-4 pb-2">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-lg">💄</span>
            </div>
            <div>
              <p className="font-semibold text-sm text-black">BeautyBoosters</p>
              <p className="text-xs text-black/60">Nyt job tilgængeligt</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-black/60">{countdown}s</span>
            <button 
              onClick={onClose}
              className="p-1 rounded-full hover:bg-muted transition-colors"
            >
              <X className="w-4 h-4 text-black/40" />
            </button>
          </div>
        </div>

        {/* Job Details */}
        <div className="px-4 py-3 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xl font-bold text-black">{job.title}</h3>
              <span className="inline-block mt-1 px-2 py-0.5 bg-black/5 text-black/70 text-xs font-medium rounded-full">
                {job.serviceType}
              </span>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-black">{job.earnings}</p>
              <p className="text-xs text-black/60">din indtjening</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 text-sm text-black/70">
              <MapPin className="w-4 h-4 text-black/50" />
              <span>{job.location}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-black/70">
              <Clock className="w-4 h-4 text-black/50" />
              <span>{job.date} kl. {job.time}</span>
            </div>
          </div>

          <div className="flex items-center gap-1 text-xs text-black/60">
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-muted rounded-full">
              📍 {job.distance}
            </span>
          </div>
        </div>

        {/* Action Buttons - Wolt/Uber style */}
        {!accepted ? (
          <div className="p-4 pt-2 grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              size="lg"
              onClick={handleReject}
              className="h-14 rounded-2xl border-2 hover:bg-destructive/10 hover:border-destructive hover:text-destructive transition-all"
            >
              <XCircle className="w-5 h-5 mr-2" />
              Afvis
            </Button>
            <Button
              size="lg"
              onClick={handleAccept}
              className="h-14 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold transition-all hover:scale-[1.02]"
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              Acceptér
            </Button>
          </div>
        ) : (
          <div className="p-4 pt-2">
            <div className="h-14 rounded-2xl bg-green-500/20 border-2 border-green-500 flex items-center justify-center gap-2 text-green-600 font-semibold">
              <CheckCircle className="w-5 h-5" />
              Job accepteret!
            </div>
          </div>
        )}

        {/* Swipe hint */}
        <div className="pb-4 flex justify-center">
          <div className="w-12 h-1 bg-muted-foreground/30 rounded-full" />
        </div>
      </div>
    </div>
  );
}

// Demo trigger component for testing
export function PushNotificationDemo() {
  const [showNotification, setShowNotification] = useState(false);

  return (
    <div className="p-4">
      <Button 
        onClick={() => setShowNotification(true)}
        className="gap-2"
      >
        🔔 Simuler Push Notifikation
      </Button>
      
      <PushNotificationMockup
        isVisible={showNotification}
        onClose={() => setShowNotification(false)}
        onAccept={() => console.log("Job accepted")}
        onReject={() => console.log("Job rejected")}
      />
    </div>
  );
}
