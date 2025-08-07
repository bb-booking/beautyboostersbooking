import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import Header from "@/components/layout/Header";
import Index from "./pages/Index";
import Services from "./pages/Services";
import Address from "./pages/Address";
import InquiryForm from "./pages/InquiryForm";
import Stylists from "./pages/Stylists";
import StylistDetail from "./pages/StylistDetail";
import Booking from "./pages/Booking";
import BookingConfirmation from "./pages/BookingConfirmation";
import Bookings from "./pages/Bookings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <CartProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="min-h-screen bg-background">
            <Header />
            <main>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/services" element={<Services />} />
                <Route path="/address" element={<Address />} />
                <Route path="/inquiry" element={<InquiryForm />} />
                <Route path="/stylists" element={<Stylists />} />
                <Route path="/stylist/:id" element={<StylistDetail />} />
                <Route path="/book/:id" element={<Booking />} />
                <Route path="/booking" element={<Booking />} />
                <Route path="/booking-confirmation" element={<BookingConfirmation />} />
                <Route path="/bookings" element={<Bookings />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </CartProvider>
  </QueryClientProvider>
);

export default App;
