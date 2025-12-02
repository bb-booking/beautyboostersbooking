import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { CartProvider } from "@/contexts/CartContext";
import Header from "@/components/layout/Header";
import ChatWidget from "@/components/chat/ChatWidget";
import SiteFooter from "@/components/layout/SiteFooter";
import Index from "./pages/Index";
import BookingLanding from "./pages/BookingLanding";
import Services from "./pages/Services";
import Address from "./pages/Address";
import InquiryForm from "./pages/InquiryForm";
import Stylists from "./pages/Stylists";
import Contact from "./pages/Contact";
import StylistDetail from "./pages/StylistDetail";
import AnnaG from "./pages/stylists/AnnaG";
import Angelica from "./pages/stylists/Angelica";
import Booking from "./pages/Booking";
import Checkout from "./pages/Checkout";
import Confirmation from "./pages/Confirmation";
import BookingConfirmation from "./pages/BookingConfirmation";
import Bookings from "./pages/Bookings";
import NotFound from "./pages/NotFound";
import BoosterSignup from "./pages/BoosterSignup";

import { AdminLayout } from "@/components/layout/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminInquiries from "./pages/admin/AdminInquiries";
import AdminBookers from "./pages/admin/AdminBookers";
import AdminBookings from "./pages/admin/AdminBookings";
import AdminJobs from "./pages/admin/AdminJobs";
import AdminCalendar from "./pages/admin/AdminCalendar";
import AdminFinance from "./pages/admin/AdminFinance";
import AdminBoosters from "./pages/admin/AdminBoosters";
import AdminBoosterApplications from "./pages/admin/AdminBoosterApplications";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminMessages from "./pages/admin/AdminMessages";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDiscountCodes from "./pages/admin/AdminDiscountCodes";
import { BoosterLayout } from "@/components/layout/BoosterLayout";
import BoosterDashboard from "./pages/booster/BoosterDashboard";
import BoosterCalendar from "./pages/booster/BoosterCalendar";
import BoosterJobs from "./pages/booster/BoosterJobs";
import BoosterPortfolio from "./pages/booster/BoosterPortfolio";
import BoosterSkills from "./pages/booster/BoosterSkills";
import BoosterProfile from "./pages/booster/BoosterProfile";
import BoosterFinance from "./pages/booster/BoosterFinance";
import BoosterMessages from "./pages/booster/BoosterMessages";
import BoosterSettings from "./pages/booster/BoosterSettings";
import BoosterReviews from "./pages/booster/BoosterReviews";
import BoosterBookingRequests from "./pages/booster/BoosterBookingRequests";
import Auth from "./pages/Auth";
import BoosterLogin from "./pages/booster/BoosterLogin";
import GiftCards from "./pages/GiftCards";
import InstallApp from "./pages/InstallApp";
import AdminResetPassword from "./pages/admin/AdminResetPassword";
import CustomerDashboard from "./pages/customer/CustomerDashboard";

const queryClient = new QueryClient();
 
const App = () => {
  const location = window.location.pathname;
  const isAdminRoute = location.startsWith('/admin');
  const isBoosterRoute = location.startsWith('/booster');
  const showPublicHeader = !isAdminRoute && !isBoosterRoute;

  return (
    <QueryClientProvider client={queryClient}>
      <CartProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <HelmetProvider>
            <BrowserRouter>
              <div className="min-h-screen bg-background break-words">
                {showPublicHeader && <Header />}
                <main>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/book" element={<BookingLanding />} />
                    <Route path="/services" element={<Services />} />
                    <Route path="/address" element={<Address />} />
                    <Route path="/inquiry" element={<InquiryForm />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/stylists" element={<Stylists />} />
                    <Route path="/stylist/anna-g" element={<AnnaG />} />
                    <Route path="/stylist/angelica" element={<Angelica />} />
                    <Route path="/stylist/:id" element={<StylistDetail />} />
                    <Route path="/book/:boosterId" element={<Booking />} />
                    <Route path="/booking" element={<Booking />} />
                    <Route path="/checkout" element={<Checkout />} />
                    <Route path="/confirmation" element={<Confirmation />} />
                    <Route path="/booking-confirmation" element={<BookingConfirmation />} />
                    <Route path="/bookings" element={<Bookings />} />
                    <Route path="/booster-signup" element={<BoosterSignup />} />
                    
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/giftcards" element={<GiftCards />} />
                  <Route path="/install" element={<InstallApp />} />
                  
                  {/* Customer routes */}
                  <Route path="/customer/dashboard" element={<CustomerDashboard />} />
                  
                  <Route path="/booster/login" element={<BoosterLogin />} />
                    {/* Admin routes */}
                    <Route path="/admin/login" element={<AdminLogin />} />
                    <Route path="/admin/reset-password" element={<AdminResetPassword />} />
                    <Route path="/admin" element={<AdminLayout />}>
                      <Route index element={<AdminDashboard />} />
                      <Route path="dashboard" element={<AdminDashboard />} />
                      <Route path="inquiries" element={<AdminInquiries />} />
                      <Route path="jobs" element={<AdminJobs />} />
                      <Route path="calendar" element={<AdminCalendar />} />
                      <Route path="bookings" element={<AdminBookings />} />
                      <Route path="finance" element={<AdminFinance />} />
                      <Route path="boosters" element={<AdminBoosters />} />
                      <Route path="booster-applications" element={<AdminBoosterApplications />} />
                      <Route path="messages" element={<AdminMessages />} />
                      <Route path="discount-codes" element={<AdminDiscountCodes />} />
                      <Route path="settings" element={<AdminSettings />} />
                    </Route>
                    {/* Booster routes */}
                    <Route path="/booster" element={<BoosterLayout />}>
                      <Route index element={<BoosterCalendar />} />
                      <Route path="dashboard" element={<BoosterDashboard />} />
                      <Route path="requests" element={<BoosterBookingRequests />} />
                      <Route path="jobs" element={<BoosterJobs />} />
                      <Route path="calendar" element={<BoosterCalendar />} />
                      <Route path="portfolio" element={<BoosterPortfolio />} />
                      <Route path="skills" element={<BoosterSkills />} />
                      <Route path="profile" element={<BoosterProfile />} />
                      <Route path="finance" element={<BoosterFinance />} />
                      <Route path="messages" element={<BoosterMessages />} />
                      <Route path="settings" element={<BoosterSettings />} />
                      <Route path="reviews" element={<BoosterReviews />} />
                    </Route>
                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </main>
                {showPublicHeader && <SiteFooter />}
                {showPublicHeader && <ChatWidget />}
              </div>
            </BrowserRouter>
          </HelmetProvider>
        </TooltipProvider>
      </CartProvider>
    </QueryClientProvider>
  );
};
 
export default App;
