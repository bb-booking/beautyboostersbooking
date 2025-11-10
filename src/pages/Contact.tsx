import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Phone, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";

const Contact = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <Helmet>
        <title>Kontakt os | BeautyBoosters</title>
        <meta name="description" content="Kontakt BeautyBoosters - Send en mail, opret en forespørgsel eller ring til os direkte." />
      </Helmet>
      
      <div className="container mx-auto px-4 py-12 md:py-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Kontakt os</h1>
            <p className="text-lg text-muted-foreground">
              Vælg den måde du foretrækker at komme i kontakt med os
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Send Mail */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Mail className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-center">Send Mail</CardTitle>
                <CardDescription className="text-center">
                  Skriv til os direkte
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full" 
                  asChild
                >
                  <a href="mailto:hello@beautyboosters.dk">
                    Send mail til os
                  </a>
                </Button>
                <p className="text-sm text-muted-foreground text-center mt-4">
                  hello@beautyboosters.dk
                </p>
              </CardContent>
            </Card>

            {/* Opret Forespørgsel */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-center">Opret Forespørgsel</CardTitle>
                <CardDescription className="text-center">
                  Udfyld en formular
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full" 
                  asChild
                >
                  <Link to="/inquiry">
                    Opret forespørgsel
                  </Link>
                </Button>
                <p className="text-sm text-muted-foreground text-center mt-4">
                  Få svar inden 24 timer
                </p>
              </CardContent>
            </Card>

            {/* Ring til os */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Phone className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-center">Ring til os</CardTitle>
                <CardDescription className="text-center">
                  Tal med os direkte
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full" 
                  asChild
                >
                  <a href="tel:+4571786575">
                    Ring nu
                  </a>
                </Button>
                <p className="text-sm text-muted-foreground text-center mt-4">
                  +45 71 78 65 75
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Additional Contact Info */}
          <div className="mt-12 text-center">
            <Card>
              <CardHeader>
                <CardTitle>Åbningstider (telefonisk)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between max-w-md mx-auto">
                  <span className="font-medium">Mandag:</span>
                  <span className="text-muted-foreground">09:00 - 17:00</span>
                </div>
                <div className="flex justify-between max-w-md mx-auto">
                  <span className="font-medium">Tirsdag:</span>
                  <span className="text-muted-foreground">09:00 - 17:00</span>
                </div>
                <div className="flex justify-between max-w-md mx-auto">
                  <span className="font-medium">Onsdag:</span>
                  <span className="text-muted-foreground">09:00 - 17:00</span>
                </div>
                <div className="flex justify-between max-w-md mx-auto">
                  <span className="font-medium">Torsdag:</span>
                  <span className="text-muted-foreground">09:00 - 17:00</span>
                </div>
                <div className="flex justify-between max-w-md mx-auto">
                  <span className="font-medium">Fredag:</span>
                  <span className="text-muted-foreground">09:00 - 17:00</span>
                </div>
                <div className="flex justify-between max-w-md mx-auto">
                  <span className="font-medium">Lørdag:</span>
                  <span className="text-muted-foreground">09:00 - 16:00</span>
                </div>
                <div className="flex justify-between max-w-md mx-auto">
                  <span className="font-medium">Søndag:</span>
                  <span className="text-muted-foreground">09:00 - 16:00</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
