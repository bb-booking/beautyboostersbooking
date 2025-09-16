import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ExternalLink } from "lucide-react";

const AdminShopifyProducts = () => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    body_html: "",
    price: "",
    image_src: "",
    tags: "beauty-service,booking"
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const createProduct = async () => {
    if (!formData.title || !formData.price) {
      toast.error("Titel og pris er påkrævet");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-shopify-product', {
        body: {
          productData: {
            title: formData.title,
            body_html: formData.body_html,
            price: formData.price,
            image_src: formData.image_src,
            tags: formData.tags,
            vendor: "BeautyBoosters",
            product_type: "Beauty Service"
          }
        }
      });

      if (error) {
        console.error('Error:', error);
        toast.error("Fejl ved oprettelse af produkt");
        return;
      }

      if (data.success) {
        toast.success("Produkt oprettet i Shopify!", {
          action: {
            label: "Se i Shopify",
            onClick: () => window.open(data.shopify_url, '_blank')
          }
        });
        
        // Reset form
        setFormData({
          title: "",
          body_html: "",
          price: "",
          image_src: "",
          tags: "beauty-service,booking"
        });
      } else {
        toast.error(data.error || "Fejl ved oprettelse af produkt");
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error("Fejl ved oprettelse af produkt");
    } finally {
      setLoading(false);
    }
  };

  const predefinedServices = [
    {
      title: "Makeup - Base",
      body_html: "<p>Professionel base makeup til private events, bryllupper og særlige lejligheder.</p><p>Inkluderer konsultation og anvendelse af makeup der holder hele dagen.</p>",
      price: "800",
      tags: "beauty-service,booking,makeup,base"
    },
    {
      title: "Hår styling - Opsætning",
      body_html: "<p>Elegant hår opsætning til bryllupper, fester og særlige events.</p><p>Inkluderer konsultation og styling der holder hele dagen.</p>",
      price: "600",
      tags: "beauty-service,booking,hair,styling"
    },
    {
      title: "SFX Makeup",
      body_html: "<p>Special effects makeup til film, teater, Halloween og kreative projekter.</p><p>Professionelle produkter og teknikker.</p>",
      price: "1200",
      tags: "beauty-service,booking,sfx,makeup,special-effects"
    },
    {
      title: "Bryllups pakke - Makeup & Hår",
      body_html: "<p>Komplet bryllups pakke inkluderende både makeup og hår styling.</p><p>Prøvesession, bryllupsdag styling og touch-ups.</p>",
      price: "2500",
      tags: "beauty-service,booking,wedding,bryllup,makeup,hair"
    }
  ];

  const useTemplate = (service: typeof predefinedServices[0]) => {
    setFormData({
      ...formData,
      title: service.title,
      body_html: service.body_html,
      price: service.price,
      tags: service.tags
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Shopify Produkter</h1>
            <p className="text-muted-foreground">
              Opret booking produkter direkte i din Shopify butik
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Opret nyt produkt</CardTitle>
              <CardDescription>
                Udfyld formularen for at oprette et nyt booking produkt i Shopify
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Titel *</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="F.eks. Makeup - Base"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="body_html">Beskrivelse</Label>
                <Textarea
                  id="body_html"
                  name="body_html"
                  value={formData.body_html}
                  onChange={handleInputChange}
                  placeholder="Beskriv produktet og hvad det inkluderer..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Pris (DKK) *</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  value={formData.price}
                  onChange={handleInputChange}
                  placeholder="800"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="image_src">Billede URL</Label>
                <Input
                  id="image_src"
                  name="image_src"
                  value={formData.image_src}
                  onChange={handleInputChange}
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags</Label>
                <Input
                  id="tags"
                  name="tags"
                  value={formData.tags}
                  onChange={handleInputChange}
                  placeholder="beauty-service,booking,makeup"
                />
              </div>

              <Button 
                onClick={createProduct} 
                disabled={loading}
                className="w-full"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Opret produkt i Shopify
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Foruddefinerede services</CardTitle>
              <CardDescription>
                Klik på en service for hurtigt at udfylde formularen
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {predefinedServices.map((service, index) => (
                <div
                  key={index}
                  className="p-3 border rounded-lg cursor-pointer hover:bg-muted transition-colors"
                  onClick={() => useTemplate(service)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{service.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {service.price} DKK
                      </p>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminShopifyProducts;