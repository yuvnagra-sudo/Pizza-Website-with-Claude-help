import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  UtensilsCrossed, 
  BarChart3, 
  Tag, 
  FileText, 
  Gift,
  LogOut,
  Menu as MenuIcon,
  X
} from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { isAuthenticated, loading, user } = useAuth();
  const [location, navigate] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const utils = trpc.useUtils();

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      utils.auth.me.invalidate();
      toast.success("Logged out successfully");
      window.location.href = "/";
    },
  });

  // Redirect to login if not authenticated
  if (!loading && !isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }

  // Check if user is admin
  if (!loading && user && user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-xl mb-6">You don't have permission to access the admin panel.</p>
          <Button onClick={() => navigate("/")} className="bg-[var(--brand-blue)] text-white">
            Return to Home
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl font-bold">Loading...</p>
      </div>
    );
  }

  const navItems = [
    { path: "/admin/kitchen", label: "Kitchen", icon: UtensilsCrossed },
    { path: "/admin/analytics", label: "Analytics", icon: BarChart3 },
    { path: "/admin/coupons", label: "Coupons", icon: Tag },
    { path: "/admin/text-specials", label: "Text Specials", icon: FileText },
    { path: "/admin/deal-templates", label: "Deal Templates", icon: Gift },
  ];

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <header className="bg-[var(--brand-blue)] text-white shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <LayoutDashboard className="w-8 h-8" />
              <div>
                <h1 className="font-['Bebas_Neue'] text-2xl md:text-3xl">Johnny's Admin</h1>
                <p className="text-xs text-gray-200 hidden md:block">Restaurant Management</p>
              </div>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location === item.path;
                return (
                  <Link key={item.path} href={item.path}>
                    <a
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "text-gray-200 hover:bg-white/10 hover:text-white"
                      }`}
                      onClick={() => window.scrollTo(0, 0)}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </a>
                  </Link>
                );
              })}
              <Button
                onClick={handleLogout}
                variant="ghost"
                className="text-gray-200 hover:bg-white/10 hover:text-white"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 hover:bg-white/10 rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <nav className="md:hidden mt-4 pb-2 space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location === item.path;
                return (
                  <Link key={item.path} href={item.path}>
                    <a
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "text-gray-200 hover:bg-white/10 hover:text-white"
                      }`}
                      onClick={() => {
                        setMobileMenuOpen(false);
                        window.scrollTo(0, 0);
                      }}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </a>
                  </Link>
                );
              })}
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-200 hover:bg-white/10 hover:text-white transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Logout</span>
              </button>
            </nav>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>

      {/* Admin Footer */}
      <footer className="bg-gray-800 text-gray-300 py-6 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm">
            Johnny's Pizza & Wings Admin Panel &copy; {new Date().getFullYear()}
          </p>
          <p className="text-xs mt-2 text-gray-400">
            Logged in as: {user?.name || user?.email}
          </p>
        </div>
      </footer>
    </div>
  );
}
