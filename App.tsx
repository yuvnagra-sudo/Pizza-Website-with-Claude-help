import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { HelmetProvider } from "react-helmet-async";
import Navigation from "./components/Navigation";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Menu from "./pages/Menu";
import Wings from "./pages/Wings";
import GlutenFree from "./pages/GlutenFree";
import Reviews from "./pages/Reviews";
import FAQ from "./pages/FAQ";
import Contact from "./pages/Contact";
import Catering from "./pages/Catering";
import Specials from "./pages/Specials";
import Checkout from "./pages/Checkout";
import Orders from "./pages/Orders";
import OrderDetail from "./pages/OrderDetail";
import TrackOrder from "./pages/TrackOrder";
import Kitchen from "./pages/Kitchen";
import Analytics from "./pages/Analytics";
import ManageCoupons from "./pages/ManageCoupons";
import ManageTextSpecials from "./pages/ManageTextSpecials";
import ManageDealTemplates from "./pages/ManageDealTemplates";
import WalkinSpecial from "./pages/WalkinSpecial";
import ClassicCombo from "./pages/ClassicCombo";
import AIOrderAssistant from "./pages/AIOrderAssistant";
import Login from "./pages/Login";
import Cart from "./components/Cart";
import AdminLayout from "./components/AdminLayout";
import FloatingAIChatButton from "./components/FloatingAIChatButton";
function AdminRouter() {
  const [location, navigate] = useLocation();
  
  // Redirect /admin to /admin/kitchen
  if (location === "/admin") {
    navigate("/admin/kitchen", { replace: true });
    return null;
  }
  
  return (
    <AdminLayout>
      <Switch>
        <Route path="/admin/kitchen" component={Kitchen} />
        <Route path="/admin/analytics" component={Analytics} />
        <Route path="/admin/coupons" component={ManageCoupons} />
        <Route path="/admin/text-specials" component={ManageTextSpecials} />
        <Route path="/admin/deal-templates" component={ManageDealTemplates} />
        <Route component={NotFound} />
      </Switch>
    </AdminLayout>
  );
}

function CustomerRouter() {
  return (
    <>
      <Navigation />
      {/* Add padding for fixed mobile header (52px) + fixed nav (~100px) */}
      <div className="md:pt-0 pt-[152px]">
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/menu" component={Menu} />
        <Route path="/wings-and-sides" component={Wings} />
        <Route path="/gluten-free" component={GlutenFree} />
        <Route path="/reviews" component={Reviews} />
        <Route path="/faq" component={FAQ} />
        <Route path="/contact" component={Contact} />
        <Route path="/catering" component={Catering} />
        <Route path="/specials" component={Specials} />
        <Route path="/specials/walkin-special" component={WalkinSpecial} />
        <Route path="/specials/classic-combo" component={ClassicCombo} />
        <Route path="/login" component={Login} />
        <Route path="/ai-order" component={AIOrderAssistant} />
        <Route path="/checkout" component={Checkout} />
        <Route path="/orders" component={Orders} />
        <Route path="/order-confirmation/:id" component={OrderDetail} />
        <Route path="/track-order/:id" component={TrackOrder} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
      </div>
      <Footer />
      <FloatingAIChatButton />
    </>
  );
}

function Router() {
  // Check if current path is an admin route
  const isAdminRoute = window.location.pathname.startsWith('/admin');
  
  return isAdminRoute ? <AdminRouter /> : <CustomerRouter />;
}

function App() {
  return (
    <ErrorBoundary>
      <HelmetProvider>
        <ThemeProvider defaultTheme="light">
          <TooltipProvider>
            <Toaster />
            <Cart />
            <Router />
          </TooltipProvider>
        </ThemeProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
}

export default App;
