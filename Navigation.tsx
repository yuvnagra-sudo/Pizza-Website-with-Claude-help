import { Link, useLocation } from "wouter";
import { BUSINESS_INFO } from "@/../../shared/const";
import { Phone, Menu, X, ShoppingCart } from "lucide-react";
import { useState, useEffect } from "react";

import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/_core/hooks/useAuth";

export default function Navigation() {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { openCart, cartCount } = useCart();
  const { isAuthenticated, user } = useAuth();
  const isAdmin = user?.role === 'admin';

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
    window.scrollTo(0, 0); // Scroll to top on navigation
  }, [location]);

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/menu", label: "Pizza Menu" },
    { href: "/wings-and-sides", label: "Wings & Sides" },
    { href: "/gluten-free", label: "Gluten-Free" },
    { href: "/specials", label: "Specials" },
    { href: "/catering", label: "Catering" },
    { href: "/reviews", label: "Reviews" },
    { href: "/faq", label: "FAQ" },
    { href: "/contact", label: "Contact" },
  ];

  return (
    <>
      {/* Top Bar - Phone Number (Mobile Fixed) */}
      <div className="bg-[var(--brand-yellow)] text-black py-3 px-4 text-center font-bold md:hidden fixed top-0 left-0 right-0 z-30 border-b-4 border-black">
        <a href={BUSINESS_INFO.phoneLink} className="flex items-center justify-center gap-2 snap-grow">
          <Phone className="w-5 h-5" />
          <span className="font-['Bebas_Neue'] text-xl tracking-wide">CALL NOW: {BUSINESS_INFO.phone}</span>
        </a>
      </div>

      {/* Main Navigation */}
      <nav className="bg-white text-black border-b-8 border-black md:sticky md:top-0 fixed top-[52px] left-0 right-0 z-20">
        <div className="container mx-auto">
          <div className="flex items-center justify-between py-4">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 snap-grow">
              <img 
                src="/images/logo.png" 
                alt="Johnny's Pizza & Wings Logo" 
                className="h-16 md:h-20 w-auto"
              />
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`font-['Bebas_Neue'] text-xl tracking-wide transition-all duration-150 pb-1 ${
                    location === link.href
                      ? "text-[var(--brand-blue)] border-b-4 border-[var(--brand-blue)]"
                      : "text-black hover:text-[var(--brand-blue)] border-b-4 border-transparent hover:border-[var(--brand-blue)]"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              {isAuthenticated && (
                <button
                  onClick={openCart}
                  className="relative bg-white text-[var(--brand-blue)] px-4 py-3 border-4 border-black brutal-shadow-sm snap-grow flex items-center gap-2"
                >
                  <ShoppingCart className="w-5 h-5" />
                  {cartCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-[var(--brand-yellow)] text-black w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold border-2 border-black">
                      {cartCount}
                    </span>
                  )}
                </button>
              )}
              <a
                href={BUSINESS_INFO.phoneLink}
                className="bg-[var(--brand-yellow)] text-black px-6 py-3 font-['Bebas_Neue'] text-xl tracking-wide border-4 border-black brutal-shadow-sm snap-grow flex items-center gap-2"
              >
                <Phone className="w-5 h-5" />
                {BUSINESS_INFO.phone}
              </a>
            </div>

            {/* Mobile Cart & Menu Buttons */}
            <div className="md:hidden flex items-center gap-2">
              {isAuthenticated && (
                <button
                  onClick={openCart}
                  className="relative bg-white text-[var(--brand-blue)] p-3 border-4 border-black brutal-shadow-sm snap-grow"
                  aria-label="Open cart"
                >
                  <ShoppingCart className="w-6 h-6" />
                  {cartCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-[var(--brand-yellow)] text-black w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold border-2 border-black">
                      {cartCount}
                    </span>
                  )}
                </button>
              )}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="bg-[var(--brand-yellow)] text-black p-3 border-4 border-black snap-grow"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-[var(--brand-blue)] z-40 md:hidden overflow-y-auto">
          {/* Close Button */}
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="absolute top-4 right-4 bg-[var(--brand-yellow)] text-black p-3 border-4 border-black snap-grow"
            aria-label="Close menu"
          >
            <X className="w-6 h-6" />
          </button>
          
          <div className="flex flex-col gap-4 pb-8 pt-20 px-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`font-['Bebas_Neue'] text-3xl tracking-wide py-4 border-b-4 transition-all duration-150 ${
                  location === link.href
                    ? "text-[var(--brand-yellow)] border-[var(--brand-yellow)]"
                    : "text-white border-white/20 hover:text-[var(--brand-yellow)] hover:border-[var(--brand-yellow)]"
                }`}
              >
                {link.label}
              </Link>
            ))}
            {isAuthenticated && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  openCart();
                }}
                className="font-['Bebas_Neue'] text-3xl tracking-wide py-4 border-b-4 text-white border-white/20 hover:text-[var(--brand-yellow)] hover:border-[var(--brand-yellow)] transition-all duration-150 flex items-center gap-3"
              >
                <ShoppingCart className="w-8 h-8" />
                View Cart
                {cartCount > 0 && (
                  <span className="bg-[var(--brand-yellow)] text-black px-3 py-1 rounded-full text-xl font-bold border-2 border-black">
                    {cartCount}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
