import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Eye, RefreshCw, ExternalLink, Calendar, MapPin, User, Database } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

interface ShopifyOrder {
  id: string;
  shopify_order_id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  service_name: string;
  service_variant?: string;
  quantity: number;
  price: number;
  total_amount: number;
  status: string;
  location?: string;
  special_requests?: string;
  financial_status: string;
  fulfillment_status?: string;
  created_at: string;
  source: string;
}

export default function AdminShopifyOrders() {
  const [orders, setOrders] = useState<ShopifyOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<ShopifyOrder | null>(null);
  const [showSetup, setShowSetup] = useState(false);

  useEffect(() => {
    checkTablesAndFetchOrders();
  }, []);

  const checkTablesAndFetchOrders = async () => {
    try {
      setLoading(true);
      // For now, show demo data directly
      await fetchShopifyOrders();
    } catch (error: any) {
      setShowSetup(true);
      setLoading(false);
    }
  };

  const fetchShopifyOrders = async () => {
    try {
      // For now, we'll use mock data since the tables aren't created yet
      const mockOrders: ShopifyOrder[] = [
        {
          id: '1',
          shopify_order_id: '5678901234',
          order_number: '#1001',
          customer_name: 'Anna Hansen',
          customer_email: 'anna@example.com',
          customer_phone: '12345678',
          service_name: 'Brudestyling - Hår & Makeup',
          service_variant: 'Inkl. prøvestyling',
          quantity: 1,
          price: 6499,
          total_amount: 6499,
          status: 'pending_booking',
          location: 'Østerbrogade 123, 2100 København Ø',
          special_requests: 'Ønsker naturligt look til bryllup d. 15. juni',
          financial_status: 'paid',
          fulfillment_status: 'unfulfilled',
          created_at: new Date().toISOString(),
          source: 'shopify'
        },
        {
          id: '2',
          shopify_order_id: '5678901235',
          order_number: '#1002',
          customer_name: 'Maria Petersen',
          customer_email: 'maria@example.com',
          customer_phone: '87654321',
          service_name: 'Makeup Styling',
          quantity: 1,
          price: 1999,
          total_amount: 1999,
          status: 'booster_assigned',
          location: 'Vesterbrogade 456, 1620 København V',
          financial_status: 'paid',
          fulfillment_status: 'partial',
          created_at: new Date(Date.now() - 86400000).toISOString(),
          source: 'shopify'
        }
      ];
      
      setOrders(mockOrders);
    } catch (error: any) {
      toast.error('Kunne ikke hente Shopify ordrer');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending_booking': return 'bg-yellow-100 text-yellow-800';
      case 'booster_assigned': return 'bg-blue-100 text-blue-800';
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getFinancialStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'refunded': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const assignBooster = async (orderId: string) => {
    toast.info('Booster tildeling kommer snart');
  };

  const convertToRegularBooking = async (shopifyOrder: ShopifyOrder) => {
    try {
      // Create a regular booking from Shopify order
      const { error } = await supabase
        .from('bookings')
        .insert({
          customer_name: shopifyOrder.customer_name,
          customer_email: shopifyOrder.customer_email,
          customer_phone: shopifyOrder.customer_phone,
          service_name: shopifyOrder.service_name,
          amount: shopifyOrder.total_amount,
          status: 'confirmed',
          location: shopifyOrder.location,
          special_requests: shopifyOrder.special_requests,
          booking_date: new Date().toISOString().split('T')[0],
          booking_time: '10:00'
        });

      if (error) throw error;

      toast.success('Konverteret til almindelig booking');
      fetchShopifyOrders();
    } catch (error: any) {
      toast.error('Kunne ikke konvertere booking');
    }
  };

  const setupShopifyIntegration = () => {
    toast.info('Shopify integration setup starter...');
    // This would trigger the setup process
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Shopify Ordrer</h1>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (showSetup) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Shopify Integration</h1>
            <p className="text-muted-foreground">
              Opsæt webhook forbindelse til Shopify
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Shopify Webhook Setup
            </CardTitle>
            <CardDescription>
              For at modtage ordrer fra Shopify skal du oprette webhooks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-2">Webhook URL:</h4>
              <code className="text-sm bg-background px-2 py-1 rounded">
                {window.location.origin}/functions/v1/shopify-order-webhook
              </code>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">Shopify webhook events:</h4>
              <ul className="text-sm space-y-1 ml-4">
                <li>• orders/create</li>
                <li>• orders/updated</li>
                <li>• orders/cancelled</li>
              </ul>
            </div>

            <Button onClick={setupShopifyIntegration}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Start Shopify Setup
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Shopify Ordrer</h1>
          <p className="text-muted-foreground">
            Ordrer modtaget fra Shopify via webhooks
          </p>
        </div>
        <Button onClick={fetchShopifyOrders} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Opdater
        </Button>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <h3 className="text-lg font-semibold mb-2">Ingen Shopify ordrer endnu</h3>
            <p className="text-muted-foreground mb-4">
              Når kunder bestiller beauty services gennem Shopify, vil de vises her
            </p>
            <Badge variant="outline">Demo data vises - webhook integration klar</Badge>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{order.order_number}</h3>
                      <Badge className={getStatusColor(order.status)}>
                        {order.status}
                      </Badge>
                      <Badge className={getFinancialStatusColor(order.financial_status)}>
                        {order.financial_status}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {order.customer_name}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(order.created_at).toLocaleDateString('da-DK')}
                      </div>
                      {order.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {order.location.slice(0, 30)}...
                        </div>
                      )}
                    </div>

                    <div className="text-sm">
                      <strong>{order.service_name}</strong>
                      {order.service_variant && <span> - {order.service_variant}</span>}
                      <span className="ml-2 font-semibold">{order.total_amount} kr</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedOrder(order)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Shopify Ordre: {order.order_number}</DialogTitle>
                          <DialogDescription>
                            Ordre detaljer fra Shopify
                          </DialogDescription>
                        </DialogHeader>
                        
                        {selectedOrder && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <h4 className="font-semibold mb-2">Kunde Information</h4>
                                <div className="space-y-1 text-sm">
                                  <p><strong>Navn:</strong> {selectedOrder.customer_name}</p>
                                  <p><strong>Email:</strong> {selectedOrder.customer_email}</p>
                                  <p><strong>Telefon:</strong> {selectedOrder.customer_phone}</p>
                                </div>
                              </div>
                              
                              <div>
                                <h4 className="font-semibold mb-2">Service</h4>
                                <div className="space-y-1 text-sm">
                                  <p><strong>Service:</strong> {selectedOrder.service_name}</p>
                                  {selectedOrder.service_variant && (
                                    <p><strong>Variant:</strong> {selectedOrder.service_variant}</p>
                                  )}
                                  <p><strong>Antal:</strong> {selectedOrder.quantity}</p>
                                  <p><strong>Pris:</strong> {selectedOrder.total_amount} kr</p>
                                </div>
                              </div>
                            </div>

                            <Separator />

                            <div>
                              <h4 className="font-semibold mb-2">Lokation</h4>
                              <p className="text-sm">{selectedOrder.location || 'Ikke angivet'}</p>
                            </div>

                            {selectedOrder.special_requests && (
                              <>
                                <Separator />
                                <div>
                                  <h4 className="font-semibold mb-2">Særlige ønsker</h4>
                                  <p className="text-sm">{selectedOrder.special_requests}</p>
                                </div>
                              </>
                            )}

                            <Separator />

                            <div className="flex gap-2">
                              {selectedOrder.status === 'pending_booking' && (
                                <>
                                  <Button 
                                    onClick={() => assignBooster(selectedOrder.id)}
                                    className="flex-1"
                                  >
                                    Tildel Booster
                                  </Button>
                                  <Button 
                                    variant="outline"
                                    onClick={() => convertToRegularBooking(selectedOrder)}
                                    className="flex-1"
                                  >
                                    Konverter til Booking
                                  </Button>
                                </>
                              )}
                              
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => window.open(`https://admin.shopify.com/orders/${selectedOrder.shopify_order_id}`, '_blank')}
                              >
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Åbn i Shopify
                              </Button>
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}