import { BUSINESS_INFO } from "@/../../shared/const";
import { Coffee, Pizza, Sparkles } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { useLocation } from "wouter";

/**
 * Design Philosophy: Bold Value Brutalism
 * - Aggressive royal blue and electric yellow
 * - Oversized Bebas Neue typography
 * - Heavy black borders with brutal shadows
 * - Clear value propositions for different customer segments
 */

export default function Specials() {
  const [, navigate] = useLocation();

  const handleWalkinSpecial = () => {
    // Navigate to Walk-in Special ordering flow
    navigate("/specials/walkin-special");
  };

  const handleClassicCombo = () => {
    // Navigate to Classic Combo ordering flow
    navigate("/specials/classic-combo");
  };

  return (
    <>
      <Helmet>
        <title>Specials & Deals - Johnny's Pizza & Wings | Airdrie AB</title>
        <meta name="description" content="Great deals on pizza and wings in Airdrie. Beginner Offer, Walk-in Special, and Classic Combo. Call 403-948-2020 or order online." />
        <link rel="canonical" href="https://johnnyspizza-wings.com/specials" />
      </Helmet>

      <div className="min-h-screen">
        {/* Hero Section */}
        <section className="bg-[var(--brand-blue)] text-white py-12 md:py-16 border-b-8 border-black">
          <div className="container mx-auto">
            <h1 className="font-['Bebas_Neue'] text-center mb-4">Specials & Deals</h1>
            <p className="text-xl md:text-2xl font-bold text-center max-w-3xl mx-auto">
              Unbeatable deals on pizza and wings. Save big on your favorites!
            </p>
          </div>
        </section>

        {/* Deals Grid */}
        <section className="py-16 md:py-24 bg-white">
          <div className="container mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              
              {/* Deal 1: Beginner Offer (Text Only - Walk-in) */}
              <div className="bg-[var(--brand-yellow)] p-8 border-8 border-black brutal-shadow">
                <div className="w-20 h-20 bg-[var(--brand-blue)] text-white rounded-full flex items-center justify-center mb-6 border-6 border-black">
                  <Coffee className="w-10 h-10" />
                </div>
                <h2 className="font-['Bebas_Neue'] text-4xl mb-2">Beginner Offer</h2>
                <p className="text-lg font-bold mb-4 opacity-80">Lunchtime Special</p>
                <div className="mb-6">
                  <p className="text-3xl font-['Bebas_Neue'] text-[var(--brand-blue)] mb-2">$4.69</p>
                  <p className="text-lg leading-relaxed">
                    2 slices and a can of pop
                  </p>
                </div>
                <div className="bg-white border-4 border-black p-4 mb-6">
                  <p className="text-sm font-bold text-[var(--brand-blue)]">
                    ⚠️ WALK-IN ONLY
                  </p>
                  <p className="text-sm mt-2">
                    This lunchtime special is available for walk-in customers only. Visit us during lunch hours to enjoy this deal!
                  </p>
                </div>
                <a
                  href={BUSINESS_INFO.phoneLink}
                  className="inline-block w-full text-center px-6 py-3 font-['Bebas_Neue'] text-xl border-4 border-black brutal-shadow bg-[var(--brand-blue)] text-white hover:opacity-90 transition-opacity"
                >
                  Call for Details
                </a>
              </div>

              {/* Deal 2: Walk-in Special (Orderable) */}
              <div className="bg-white border-8 border-[var(--brand-blue)] p-8 brutal-shadow">
                <div className="w-20 h-20 bg-[var(--brand-yellow)] text-black rounded-full flex items-center justify-center mb-6 border-6 border-black">
                  <Pizza className="w-10 h-10" />
                </div>
                <h2 className="font-['Bebas_Neue'] text-4xl mb-2 text-[var(--brand-blue)]">Walk-in Special</h2>
                <p className="text-lg font-bold mb-4 opacity-80">One-Topping Pizza</p>
                <div className="mb-6">
                  <p className="text-lg leading-relaxed mb-3">
                    Choose any one topping for free!
                  </p>
                  <div className="space-y-2">
                    <p className="text-xl font-bold">10" - $8.99</p>
                    <p className="text-xl font-bold">12" - $11.99</p>
                    <p className="text-xl font-bold">14" - $13.99</p>
                  </div>
                </div>
                <div className="bg-[var(--brand-yellow)] border-4 border-black p-4 mb-6">
                  <p className="text-sm font-bold">
                    ✓ Choose any ONE topping
                  </p>
                  <p className="text-sm mt-2">
                    Not available for gluten-free pizzas. Regular menu only.
                  </p>
                </div>
                <button
                  onClick={handleWalkinSpecial}
                  className="w-full px-6 py-3 font-['Bebas_Neue'] text-xl border-4 border-black brutal-shadow bg-[var(--brand-blue)] text-white hover:opacity-90 transition-opacity"
                >
                  Order Now
                </button>
              </div>

              {/* Deal 3: Classic Combo (Orderable) */}
              <div className="bg-[var(--brand-blue)] text-white p-8 border-8 border-black brutal-shadow">
                <div className="w-20 h-20 bg-[var(--brand-yellow)] text-black rounded-full flex items-center justify-center mb-6 border-6 border-black">
                  <Sparkles className="w-10 h-10" />
                </div>
                <h2 className="font-['Bebas_Neue'] text-4xl mb-2">The Classic Combo</h2>
                <p className="text-lg font-bold mb-4 opacity-90">Best Value Deal</p>
                <div className="mb-6">
                  <p className="text-lg leading-relaxed mb-4">
                    Choose your combo:
                  </p>
                  <div className="space-y-3">
                    <div className="bg-white/10 border-2 border-white/30 p-3 rounded">
                      <p className="font-bold">Option 1: 2 Pizzas</p>
                      <p className="text-sm opacity-90">Same size, any toppings</p>
                    </div>
                    <div className="bg-white/10 border-2 border-white/30 p-3 rounded">
                      <p className="font-bold">Option 2: 1 Pizza + Wings</p>
                      <p className="text-sm opacity-90">Free wings included!</p>
                    </div>
                  </div>
                </div>
                <div className="bg-[var(--brand-yellow)] text-black border-4 border-black p-4 mb-6">
                  <p className="text-sm font-bold">
                    💰 Special Combo Pricing
                  </p>
                  <p className="text-sm mt-2">
                    Prices start at $18.99 for 10" pizzas
                  </p>
                </div>
                <button
                  onClick={handleClassicCombo}
                  className="w-full px-6 py-3 font-['Bebas_Neue'] text-xl border-4 border-black brutal-shadow bg-[var(--brand-yellow)] text-black hover:opacity-90 transition-opacity"
                >
                  Order Now
                </button>
              </div>

            </div>

            {/* Value Message */}
            <div className="bg-[var(--brand-yellow)] p-8 md:p-12 border-8 border-black brutal-shadow text-center">
              <h2 className="font-['Bebas_Neue'] text-4xl md:text-5xl mb-4">
                Save Big on Your Favorites
              </h2>
              <p className="text-xl max-w-3xl mx-auto mb-6">
                Our specials are designed to give you maximum value. Whether you're grabbing a quick lunch or feeding the whole family, we've got a deal for you.
              </p>
              <p className="text-lg font-bold">
                Questions? Call <a href={BUSINESS_INFO.phoneLink} className="text-[var(--brand-blue)] hover:underline">{BUSINESS_INFO.phone}</a>
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 md:py-24 bg-[var(--brand-blue)] text-white text-center border-t-8 border-black">
          <div className="container mx-auto">
            <h2 className="font-['Bebas_Neue'] mb-6">
              Ready To Save?
            </h2>
            <p className="text-2xl font-bold mb-8 max-w-2xl mx-auto">
              Order online or call us to take advantage of these amazing deals!
            </p>
            <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
              <button
                onClick={() => navigate("/pizza-menu")}
                className="bg-[var(--brand-yellow)] text-black px-8 py-4 font-['Bebas_Neue'] text-2xl tracking-wide border-4 border-black brutal-shadow hover:bg-yellow-400 transition-colors"
              >
                Browse Full Menu
              </button>
              <a
                href={BUSINESS_INFO.phoneLink}
                className="bg-white text-[var(--brand-blue)] px-8 py-4 font-['Bebas_Neue'] text-2xl tracking-wide border-4 border-black brutal-shadow hover:bg-gray-100 transition-colors"
              >
                Call {BUSINESS_INFO.phone}
              </a>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
