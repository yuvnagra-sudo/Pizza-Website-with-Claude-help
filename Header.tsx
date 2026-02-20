import { Link, useLocation } from "wouter";
import { ShoppingCart, User, Pizza, Menu as MenuIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export default function Header() {
  const [location] = useLocation();
  const { user, isAuthenticated, loading } = useAuth();
  const logoutMutation = trpc.auth.logout.useMutation();
  const { data: cartData } = trpc.cart.get.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const cartItemCount = cartData?.items.length || 0;

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    window.location.href = "/";
  };

  const isActive = (path: string) => location === path;

  const NavLinks = () => (
    <>
      <Link href="/">
        <a className={`text-sm font-medium transition-colors hover:text-primary ${isActive("/") ? "text-primary" : "text-foreground/80"}`}>
          Home
        </a>
      </Link>
      <Link href="/menu">
        <a className={`text-sm font-medium transition-colors hover:text-primary ${isActive("/menu") ? "text-primary" : "text-foreground/80"}`}>
          Menu
        </a>
      </Link>
      {isAuthenticated && (
        <Link href="/orders">
          <a className={`text-sm font-medium transition-colors hover:text-primary ${isActive("/orders") ? "text-primary" : "text-foreground/80"}`}>
            My Orders
          </a>
        </Link>
      )}
      {user?.role === "admin" && (
        <Link href="/admin">
          <a className={`text-sm font-medium transition-colors hover:text-primary ${isActive("/admin") ? "text-primary" : "text-foreground/80"}`}>
            Admin
          </a>
        </Link>
      )}
    </>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/">
            <a className="flex items-center gap-2">
              <Pizza className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>
                Johnny's Pizza
              </span>
            </a>
          </Link>
          
          <nav className="hidden md:flex items-center gap-6">
            <NavLinks />
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {isAuthenticated && (
            <Link href="/cart">
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="h-5 w-5" />
                {cartItemCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                    {cartItemCount}
                  </Badge>
                )}
              </Button>
            </Link>
          )}

          {loading ? (
            <div className="h-9 w-9 rounded-full bg-muted animate-pulse" />
          ) : isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <div className="px-2 py-1.5 text-sm font-medium">
                  {user?.name || user?.email}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/orders">
                    <a className="w-full">My Orders</a>
                  </Link>
                </DropdownMenuItem>
                {user?.role === "admin" && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin">
                      <a className="w-full">Admin Dashboard</a>
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild size="sm">
              <a href={getLoginUrl()}>Sign In</a>
            </Button>
          )}

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <MenuIcon className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <nav className="flex flex-col gap-4 mt-8">
                <NavLinks />
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
