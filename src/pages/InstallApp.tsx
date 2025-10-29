import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Smartphone, Check } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { toast } from "sonner";

const InstallApp = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // Show manual instructions for iOS
      toast.info(
        'For at installere på iPhone:\n' +
        '1. Tryk på Del-knappen (⎋) nederst i Safari\n' +
        '2. Scroll ned og vælg "Føj til hjemmeskærm"\n' +
        '3. Tryk på "Tilføj"',
        { duration: 8000 }
      );
      return;
    }

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      toast.success('App installeret! Du finder den på din hjemmeskærm.');
      setIsInstalled(true);
    }

    // Clear the deferredPrompt
    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/10 to-background py-12 px-4">
      <Helmet>
        <title>Installér BeautyBoosters App</title>
        <meta name="description" content="Installér BeautyBoosters appen på din telefon og få hurtig adgang til bookings og notifikationer" />
      </Helmet>

      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold">Installér BeautyBoosters</h1>
          <p className="text-muted-foreground text-lg">
            Få appen direkte på din hjemmeskærm
          </p>
        </div>

        {isInstalled ? (
          <Card className="border-primary bg-primary/5">
            <CardContent className="p-8 text-center">
              <Check className="h-16 w-16 mx-auto mb-4 text-primary" />
              <h2 className="text-2xl font-bold mb-2">App installeret! 🎉</h2>
              <p className="text-muted-foreground">
                Du kan nu finde BeautyBoosters på din hjemmeskærm
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-6 w-6" />
                  Installer nu
                </CardTitle>
                <CardDescription>
                  Få den bedste oplevelse med vores app
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={handleInstallClick}
                  className="w-full"
                  size="lg"
                >
                  <Download className="h-5 w-5 mr-2" />
                  Installér App
                </Button>

                <div className="space-y-3 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">Hvad får du?</p>
                  <ul className="space-y-2 ml-4">
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                      <span>Hurtig adgang direkte fra hjemmeskærmen</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                      <span>Notifikationer om nye bookings (Android)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                      <span>Fungerer offline efter første besøg</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                      <span>Hurtigere og mere responsivt</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                      <span>Ingen download fra app stores</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Manuel installation</CardTitle>
                <CardDescription>
                  Hvis knappen ikke virker, følg disse trin
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Smartphone className="h-5 w-5" />
                    På iPhone (Safari)
                  </h3>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground ml-4">
                    <li>Tryk på Del-knappen (⎋) nederst i browseren</li>
                    <li>Scroll ned og vælg "Føj til hjemmeskærm"</li>
                    <li>Tryk på "Tilføj" øverst til højre</li>
                    <li>Find appen på din hjemmeskærm</li>
                  </ol>
                </div>

                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Smartphone className="h-5 w-5" />
                    På Android (Chrome)
                  </h3>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground ml-4">
                    <li>Tryk på menu-knappen (⋮) øverst til højre</li>
                    <li>Vælg "Installer app" eller "Føj til startskærm"</li>
                    <li>Bekræft installationen</li>
                    <li>Find appen på din hjemmeskærm</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default InstallApp;