import { useState, useEffect, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { BUSINESS_INFO } from "@/../../shared/const";
import { Phone, Flame, Leaf, Star, TrendingUp, Search } from "lucide-react";
import { Link } from "wouter";
import AddToCartDialog from "@/components/AddToCartDialog";
import { trpc } from "@/lib/trpc";

interface Pizza {
  id: number;
  name: string;
  description: string;
  small: number | null;
  medium: number | null;
  large: number | null;
  allergens: string;
  vegetarian: boolean;
  spicy: boolean;
  best_seller: boolean;
}

type FilterType = "all" | "sweet" | "spicy" | "vegetarian" | "chicken" | "favorites";

export default function Menu() {
  const [pizzas, setPizzas] = useState<Pizza[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const { data: menuItems, isLoading: loading } = trpc.menu.list.useQuery({ category: "pizza" });

  // Generate MenuItem schema for each pizza with accurate pricing (memoized)
  const generateMenuSchema = useMemo(() => {
    const validPizzas = pizzas.filter(p => !['Pizza Name', 'Recommended Size Guide'].includes(p.name));
    
    return {
      "@context": "https://schema.org",
      "@type": "Restaurant",
      "name": "Johnny's Pizza & Wings",
      "hasMenu": {
        "@type": "Menu",
        "name": "Pizza Menu",
        "description": "Fresh pizzas with quality ingredients in 10\", 12\", and 14\" sizes",
        "hasMenuSection": {
          "@type": "MenuSection",
          "name": "Pizzas",
          "hasMenuItem": validPizzas.map(pizza => ({
            "@type": "MenuItem",
            "name": pizza.name,
            "description": pizza.description,
            "offers": [
              pizza.small && {
                "@type": "Offer",
                "price": pizza.small.toFixed(2),
                "priceCurrency": "CAD",
                "name": "Small (10\")"
              },
              pizza.medium && {
                "@type": "Offer",
                "price": pizza.medium.toFixed(2),
                "priceCurrency": "CAD",
                "name": "Medium (12\")"
              },
              pizza.large && {
                "@type": "Offer",
                "price": pizza.large.toFixed(2),
                "priceCurrency": "CAD",
                "name": "Large (14\")"
              }
            ].filter(Boolean),
            "suitableForDiet": pizza.vegetarian ? "https://schema.org/VegetarianDiet" : undefined
          }))
        }
      }
    };
  }, [pizzas]);

  useEffect(() => {
    if (menuItems) {
      // Convert database menu items to Pizza format, excluding gluten-free items
      const formattedPizzas: Pizza[] = menuItems
        .filter(item => {
          const name = item?.name?.toLowerCase() || '';
          // Exclude gluten-free items, add-on toppings, and Walk-in Special from main menu
          return !name.includes('gluten-free') && 
                 !name.includes('gluten free') && 
                 !name.includes('add-on topping') &&
                 !name.includes('addon topping') &&
                 !name.includes('walk-in special');
        })
        .map(item => {
        const prices = item?.prices || [];
        const smallPrice = prices.find(p => p.size?.includes('Small') || p.size?.includes('10'));
        const mediumPrice = prices.find(p => p.size?.includes('Medium') || p.size?.includes('12'));
        const largePrice = prices.find(p => p.size?.includes('Large') || p.size?.includes('14'));
        
        const pizzaName = item?.name || '';
        const lowerName = pizzaName.toLowerCase();
        
        // Determine if pizza belongs to each category
        const isFavorite = ['hawaiian', 'super loaded', 'meat supreme', "johnny's special", 'vegetarian', 'royal deluxe', 'donair'].some(name => lowerName.includes(name));
        const isSpicy = ['butter chicken', 'hot & spicy chicken', 'buffalo chicken', 'spice lovers'].some(name => lowerName.includes(name));
        const isVegetarian = ['cheese', "johnny's special", 'vegetarian', 'greek style', 'dill pickle'].some(name => lowerName.includes(name)) && !lowerName.includes('meat') && !lowerName.includes('chicken') && !lowerName.includes('pepperoni') && !lowerName.includes('bacon') && !lowerName.includes('ham') && !lowerName.includes('salami');
        
        return {
          id: item?.id || 0,
          name: pizzaName,
          description: item?.description || '',
          small: smallPrice?.price ? parseFloat(smallPrice.price) : null,
          medium: mediumPrice?.price ? parseFloat(mediumPrice.price) : null,
          large: largePrice?.price ? parseFloat(largePrice.price) : null,
          allergens: '',
          vegetarian: isVegetarian,
          spicy: isSpicy,
          best_seller: isFavorite,
        };
      });
      setPizzas(formattedPizzas);
    }
  }, [menuItems]);

  const filterPizzas = (filter: FilterType) => {
    let filtered = pizzas.filter(p => !['Pizza Name', 'Recommended Size Guide'].includes(p.name));
    
    // Define pizza categories (ORIGINAL FILTERS)
    const favorites = ['Hawaiian', 'Super Loaded', 'Meat Supreme', "Johnny's Special", 'Vegetarian', 'Royal Deluxe', 'Donair'];
    const sweet = ['Hawaiian', 'Donair'];
    const spicy = ['Butter Chicken', 'Hot & Spicy Chicken', 'Buffalo Chicken', 'Spice Lovers'];
    const vegetarian = ['Cheese', "Johnny's Special", 'Vegetarian', 'Greek Style', 'Dill Pickle'];
    const chicken = ['BBQ Chicken', 'BBQ Chicken with Bacon', 'Chicken Deluxe', 'Butter Chicken', 'Hot & Spicy Chicken', 'Buffalo Chicken', 'Chipotle Chicken', 'Teriyaki Chicken'];
    
    // Apply category filter
    switch(filter) {
      case "sweet":
        filtered = filtered.filter(p => sweet.includes(p.name));
        break;
      case "spicy":
        filtered = filtered.filter(p => spicy.includes(p.name));
        break;
      case "vegetarian":
        filtered = filtered.filter(p => vegetarian.includes(p.name));
        break;
      case "chicken":
        filtered = filtered.filter(p => chicken.includes(p.name));
        break;
      case "favorites":
        filtered = filtered.filter(p => favorites.includes(p.name));
        break;
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(query) ||
        (p.description && p.description.toLowerCase().includes(query))
      );
    }
    
    return filtered;
  };

  const filteredPizzas = useMemo(() => filterPizzas(activeFilter), [pizzas, activeFilter, searchQuery]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white py-16">
        <div className="container mx-auto text-center">
          <p className="text-2xl font-bold">Loading menu...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Pizza Menu - Johnny's Pizza & Wings | Airdrie AB</title>
        <meta name="description" content="Browse our full pizza menu with 25+ specialty pizzas. Fresh ingredients, bold flavors, made to order. Multiple sizes available. Delivery & pickup in Airdrie. Call 403-948-2020." />
        <link rel="canonical" href="https://johnnyspizza-wings.com/menu" />
        {!loading && pizzas.length > 0 && (
          <script type="application/ld+json">
            {JSON.stringify(generateMenuSchema)}
          </script>
        )}
      </Helmet>
      <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-[var(--brand-blue)] text-white py-12 md:py-16 border-b-8 border-black">
        <div className="container mx-auto">
          <h1 className="font-['Bebas_Neue'] text-center mb-4">Pizza Menu</h1>
          <p className="text-xl md:text-2xl font-bold text-center max-w-3xl mx-auto mb-8">
            Fresh ingredients. Bold flavors. Made to order.
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <a
              href={BUSINESS_INFO.phoneLink}
              className="bg-[var(--brand-yellow)] text-black px-8 py-4 font-['Bebas_Neue'] text-2xl tracking-wide border-6 border-black brutal-shadow snap-grow inline-flex items-center gap-2"
            >
              <Phone className="w-6 h-6" />
              Order Now: {BUSINESS_INFO.phone}
            </a>
            <Link href="/wings-and-sides">
              <button className="bg-white text-[var(--brand-blue)] px-8 py-4 font-['Bebas_Neue'] text-2xl tracking-wide border-6 border-black brutal-shadow snap-grow">
                View Wings & Sides
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Gluten-Free Callout - Internal Link for SEO */}
      <section className="bg-gray-100 py-8 border-b-4 border-black">
        <div className="container mx-auto text-center">
          <p className="text-xl font-bold text-gray-800 mb-4">
            🌾 Looking for gluten-free options?
          </p>
          <p className="text-2xl md:text-3xl font-['Bebas_Neue'] text-black mb-6 border-4 border-black bg-white p-4 brutal-shadow">
            24 gluten-free pizzas + wings prepared in a dedicated fryer
          </p>
          <Link href="/gluten-free">
            <button className="bg-[var(--brand-blue)] text-white px-8 py-4 font-['Bebas_Neue'] text-2xl tracking-wide border-4 border-black brutal-shadow hover:bg-blue-900 transition-colors">
              View Our Gluten-Free Menu →
            </button>
          </Link>
        </div>
      </section>

      {/* Size Guide */}
      <section className="bg-[var(--brand-yellow)] py-8 border-b-4 border-black">
        <div className="container mx-auto">
          <h2 className="font-['Bebas_Neue'] text-3xl text-center mb-6">Pizza Size Guide</h2>
          <div className="max-w-4xl mx-auto overflow-x-auto">
            <table className="w-full border-4 border-black bg-white">
              <thead>
                <tr className="bg-[var(--brand-blue)] text-white">
                  <th className="border-2 border-black p-3 text-left font-['Bebas_Neue'] text-xl">Size</th>
                  <th className="border-2 border-black p-3 text-left font-['Bebas_Neue'] text-xl">Diameter</th>
                  <th className="border-2 border-black p-3 text-left font-['Bebas_Neue'] text-xl">Slices</th>
                  <th className="border-2 border-black p-3 text-left font-['Bebas_Neue'] text-xl">Serves</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border-2 border-black p-3 font-bold">Small</td>
                  <td className="border-2 border-black p-3">10 inches</td>
                  <td className="border-2 border-black p-3">6 slices</td>
                  <td className="border-2 border-black p-3">1-2 people</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="border-2 border-black p-3 font-bold">Medium</td>
                  <td className="border-2 border-black p-3">12 inches</td>
                  <td className="border-2 border-black p-3">8 slices</td>
                  <td className="border-2 border-black p-3">2-3 people</td>
                </tr>
                <tr>
                  <td className="border-2 border-black p-3 font-bold">Large</td>
                  <td className="border-2 border-black p-3">14 inches</td>
                  <td className="border-2 border-black p-3">10 slices</td>
                  <td className="border-2 border-black p-3">3-4 people</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Search & Filters - sticky below fixed nav so filters stay visible while scrolling */}
      <section className="py-8 border-b-4 border-black bg-white sticky top-[152px] md:top-[120px] z-10">
        <div className="container mx-auto">
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search pizzas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-4 border-black font-['Bebas_Neue'] text-lg tracking-wide focus:outline-none focus:ring-4 focus:ring-[var(--brand-blue)]"
              />
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap justify-center gap-6 text-sm md:text-base font-bold mb-6">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 fill-[var(--brand-blue)] text-[var(--brand-blue)]" />
              <span>Best Seller</span>
            </div>
            <div className="flex items-center gap-2">
              <Leaf className="w-5 h-5 text-green-700" />
              <span>Vegetarian</span>
            </div>
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-red-600" />
              <span>Spicy</span>
            </div>
          </div>

          {/* Filter Buttons */}
          <div className="flex flex-wrap justify-center gap-3">
            <button
              onClick={() => setActiveFilter("all")}
              className={`px-6 py-3 font-['Bebas_Neue'] text-lg tracking-wide border-4 border-black transition-all ${
                activeFilter === "all"
                  ? "bg-[var(--brand-blue)] text-white brutal-shadow"
                  : "bg-white text-black hover:bg-gray-100"
              }`}
            >
              All Pizzas
            </button>
            <button
              onClick={() => setActiveFilter("favorites")}
              className={`px-6 py-3 font-['Bebas_Neue'] text-lg tracking-wide border-4 border-black transition-all ${
                activeFilter === "favorites"
                  ? "bg-[var(--brand-blue)] text-white brutal-shadow"
                  : "bg-white text-black hover:bg-gray-100"
              }`}
            >
              Favorites
            </button>
            <button
              onClick={() => setActiveFilter("sweet")}
              className={`px-6 py-3 font-['Bebas_Neue'] text-lg tracking-wide border-4 border-black transition-all ${
                activeFilter === "sweet"
                  ? "bg-[var(--brand-blue)] text-white brutal-shadow"
                  : "bg-white text-black hover:bg-gray-100"
              }`}
            >
              Sweet
            </button>
            <button
              onClick={() => setActiveFilter("spicy")}
              className={`px-6 py-3 font-['Bebas_Neue'] text-lg tracking-wide border-4 border-black transition-all ${
                activeFilter === "spicy"
                  ? "bg-[var(--brand-blue)] text-white brutal-shadow"
                  : "bg-white text-black hover:bg-gray-100"
              }`}
            >
              Spicy
            </button>
            <button
              onClick={() => setActiveFilter("vegetarian")}
              className={`px-6 py-3 font-['Bebas_Neue'] text-lg tracking-wide border-4 border-black transition-all ${
                activeFilter === "vegetarian"
                  ? "bg-[var(--brand-blue)] text-white brutal-shadow"
                  : "bg-white text-black hover:bg-gray-100"
              }`}
            >
              Vegetarian
            </button>
            <button
              onClick={() => setActiveFilter("chicken")}
              className={`px-6 py-3 font-['Bebas_Neue'] text-lg tracking-wide border-4 border-black transition-all ${
                activeFilter === "chicken"
                  ? "bg-[var(--brand-blue)] text-white brutal-shadow"
                  : "bg-white text-black hover:bg-gray-100"
              }`}
            >
              Chicken
            </button>
          </div>
        </div>
      </section>

      {/* Menu Items */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPizzas.map((pizza, idx) => (
              <PizzaCard key={idx} pizza={pizza} />
            ))}
          </div>

          {filteredPizzas.length === 0 && (
            <div className="text-center py-12">
              <p className="text-xl font-bold text-gray-600">No pizzas match this filter. Try another category!</p>
            </div>
          )}

          {/* Upsell Section */}
          <div className="mt-16 bg-[var(--brand-yellow)] p-8 md:p-12 pb-12 md:pb-16 border-8 border-black brutal-shadow">
            <h3 className="font-['Bebas_Neue'] text-4xl md:text-5xl text-center mb-4">Make It A Meal</h3>
            <p className="text-xl font-bold text-center mb-6">
              Add wings, sides, or drinks to complete your order!
            </p>
            <div className="flex justify-center gap-4 flex-wrap">
              <Link href="/wings-and-sides">
                <button className="bg-[var(--brand-blue)] text-white px-8 py-4 font-['Bebas_Neue'] text-2xl tracking-wide border-6 border-black brutal-shadow snap-grow">
                  Add Wings
                </button>
              </Link>
              <a
                href={BUSINESS_INFO.phoneLink}
                className="bg-black text-white px-8 py-4 font-['Bebas_Neue'] text-2xl tracking-wide border-6 border-black brutal-shadow snap-grow inline-flex items-center gap-2"
              >
                <Phone className="w-6 h-6" />
                Call To Order
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Gluten-Free CTA */}
      <section className="bg-[var(--brand-blue)] text-white py-12 md:py-16 border-t-8 border-black">
        <div className="container mx-auto text-center">
          <h2 className="font-['Bebas_Neue'] mb-4">Need Gluten-Free?</h2>
          <p className="text-xl font-bold mb-6">
            We have a full gluten-free menu available.
          </p>
          <Link href="/gluten-free">
            <button className="bg-[var(--brand-yellow)] text-black px-8 py-4 font-['Bebas_Neue'] text-2xl tracking-wide border-6 border-black brutal-shadow snap-grow">
              View Gluten-Free Menu
            </button>
          </Link>
        </div>
      </section>
      </div>
    </>
  );
}

function PizzaCard({ pizza }: { pizza: Pizza }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Build prices array for the dialog
  const prices = [
    pizza.small && { size: "Small (10\")", price: pizza.small.toFixed(2) },
    pizza.medium && { size: "Medium (12\")", price: pizza.medium.toFixed(2) },
    pizza.large && { size: "Large (14\")", price: pizza.large.toFixed(2) },
  ].filter(Boolean) as { size: string; price: string }[];

  return (
    <div className="bg-white border-6 border-black p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-['Bebas_Neue'] text-2xl text-[var(--brand-blue)] flex-1">
          {pizza.name}
        </h3>
        <div className="flex gap-2 ml-2">
          {pizza.best_seller && <Star className="w-5 h-5 fill-[var(--brand-blue)] text-[var(--brand-blue)]" aria-label="Best Seller" />}
          {pizza.vegetarian && <Leaf className="w-5 h-5 text-green-700" aria-label="Vegetarian" />}
          {pizza.spicy && <Flame className="w-5 h-5 text-red-600" aria-label="Spicy" />}
        </div>
      </div>

      {/* Description */}
      <p className="text-base font-medium mb-4 text-gray-700">{pizza.description}</p>

      {/* Pricing */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {pizza.small && (
          <div className="text-center">
            <div className="text-xs font-bold text-gray-600">Small</div>
            <div className="font-['Bebas_Neue'] text-xl text-[var(--brand-blue)]">${pizza.small.toFixed(2)}</div>
          </div>
        )}
        {pizza.medium && (
          <div className="text-center">
            <div className="text-xs font-bold text-gray-600">Medium</div>
            <div className="font-['Bebas_Neue'] text-xl text-[var(--brand-blue)]">${pizza.medium.toFixed(2)}</div>
          </div>
        )}
        {pizza.large && (
          <div className="text-center">
            <div className="text-xs font-bold text-gray-600">Large</div>
            <div className="font-['Bebas_Neue'] text-xl text-[var(--brand-blue)]">${pizza.large.toFixed(2)}</div>
          </div>
        )}
      </div>

      {/* Allergens */}
      {pizza.allergens && (
        <p className="text-xs text-gray-600 mt-2">
          <span className="font-bold">Allergens:</span> {pizza.allergens}
        </p>
      )}

      {/* Add to Cart Button */}
      <button
        onClick={() => setIsDialogOpen(true)}
        className="w-full mt-4 bg-[var(--brand-yellow)] text-black font-['Bebas_Neue'] text-xl py-3 border-4 border-black brutal-shadow snap-grow hover:bg-yellow-400 transition-colors"
      >
        Add to Cart
      </button>

      {/* Add to Cart Dialog */}
      <AddToCartDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        itemName={pizza.name}
        itemId={pizza.id}
        prices={prices}
        category="pizza"
      />
    </div>
  );
}
