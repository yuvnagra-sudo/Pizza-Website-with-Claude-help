import { useState, useEffect } from "react";
import { BUSINESS_INFO } from "@/../../shared/const";
import { Phone, Search } from "lucide-react";
import { Link } from "wouter";
import { Helmet } from "react-helmet-async";
import { trpc } from "@/lib/trpc";
import AddToCartDialog from "@/components/AddToCartDialog";
import { WingFlavorDialog } from "@/components/WingFlavorDialog";
import { useCart } from "@/contexts/CartContext";

interface Pizza {
  id?: number;
  name: string;
  description: string;
  small: number;
  large: number;
}

interface WingSize {
  count: number;
  price: number;
}

interface DippingSauce {
  name: string;
  price: number;
}

interface GlutenFreeData {
  pizzas: Pizza[];
  wings: {
    sizes: WingSize[];
    flavours: string[];
    dipping_sauces: DippingSauce[];
  };
}

export default function GlutenFree() {
  const [data, setData] = useState<GlutenFreeData | null>(null);
  const [selectedItem, setSelectedItem] = useState<{id: number; name: string; prices: {size: string; price: string}[]} | null>(null);
  const [wingDialogOpen, setWingDialogOpen] = useState(false);
  const [selectedWing, setSelectedWing] = useState<{id: number; name: string; options: {size: string; price: string; pieces: number}[]} | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { data: menuItems } = trpc.menu.list.useQuery({ category: "pizza" }); // Gluten-free pizzas are in pizza category
  const { data: wingsMenuItems } = trpc.menu.list.useQuery({ category: "wings" });
  const { data: sidesMenuItems } = trpc.menu.list.useQuery({ category: "sides" });
  const { refetchCart } = useCart();
  const addToCartMutation = trpc.cart.add.useMutation({
    onSuccess: () => {
      refetchCart();
    },
  });

  useEffect(() => {
    fetch('/gluten_free_data.json')
      .then(res => res.json())
      .then(setData)
      .catch(console.error);
  }, []);

  const findMenuItem = (name: string) => {
    // For gluten-free pizzas, look for "(Gluten-Free)" pattern
    return menuItems?.find(item => {
      const itemName = item?.name?.toLowerCase() || '';
      const searchName = name.toLowerCase();
      // Match items that contain both the pizza name and "gluten-free" or "gluten free"
      return (itemName.includes('gluten-free') || itemName.includes('gluten free')) && 
             itemName.includes(searchName);
    });
  };

  // Generate MenuItem schema for gluten-free menu
  const generateGlutenFreeSchema = () => {
    if (!data) return null;
    
    const menuItems: any[] = [];
    
    // Add gluten-free pizzas
    data.pizzas.forEach(pizza => {
      menuItems.push({
        "@type": "MenuItem",
        "name": `${pizza.name} (Gluten-Free)`,
        "description": pizza.description,
        "suitableForDiet": "https://schema.org/GlutenFreeDiet",
        "offers": [
          {
            "@type": "Offer",
            "price": pizza.small.toFixed(2),
            "priceCurrency": "CAD",
            "name": "Small (9\")"
          },
          {
            "@type": "Offer",
            "price": pizza.large.toFixed(2),
            "priceCurrency": "CAD",
            "name": "Large (11\")"
          }
        ]
      });
    });
    
    // Add gluten-free wings
    data.wings.sizes.forEach(size => {
      menuItems.push({
        "@type": "MenuItem",
        "name": `Gluten-Free Wings (${size.count} pieces)`,
        "description": `Gluten-free chicken wings prepared in dedicated fryer. Choose from ${data.wings.flavours.length} flavours.`,
        "suitableForDiet": "https://schema.org/GlutenFreeDiet",
        "offers": {
          "@type": "Offer",
          "price": size.price.toFixed(2),
          "priceCurrency": "CAD"
        }
      });
    });
    
    return {
      "@context": "https://schema.org",
      "@type": "Restaurant",
      "name": "Johnny's Pizza & Wings",
      "hasMenu": {
        "@type": "Menu",
        "name": "Gluten-Free Menu",
        "description": "Complete gluten-free menu with pizzas and wings",
        "hasMenuSection": {
          "@type": "MenuSection",
          "name": "Gluten-Free Options",
          "hasMenuItem": menuItems
        }
      }
    };
  };

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl font-['Bebas_Neue']">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Gluten-Free Menu - Johnny's Pizza & Wings | Airdrie AB</title>
        <meta name="description" content="Complete gluten-free menu with 24 pizza options and wings. Prepared in dedicated fryer for your safety. 9 inch and 11 inch sizes available. Delivery and pickup in Airdrie. Call 403-948-2020." />
        <link rel="canonical" href="https://johnnyspizza-wings.com/gluten-free" />
        {data && (
          <script type="application/ld+json">
            {JSON.stringify(generateGlutenFreeSchema())}
          </script>
        )}
      </Helmet>
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-[var(--brand-blue)] text-white py-12 md:py-16 border-b-8 border-black">
        <div className="container mx-auto">
          <h1 className="font-['Bebas_Neue'] text-center mb-4">Gluten-Free Menu</h1>
          <p className="text-xl md:text-2xl font-bold text-center max-w-3xl mx-auto mb-8">
            All the flavor. None of the gluten. Made with care on dedicated gluten-free crusts.
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <a
              href={BUSINESS_INFO.phoneLink}
              className="bg-[var(--brand-yellow)] text-black px-8 py-4 font-['Bebas_Neue'] text-2xl tracking-wide border-4 border-black brutal-shadow snap-grow flex items-center gap-2"
            >
              <Phone className="w-6 h-6" />
              CALL {BUSINESS_INFO.phone}
            </a>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto">
          {/* Pizzas Section */}
          <div className="mb-16">
            <h2 className="font-['Bebas_Neue'] text-[var(--brand-blue)] mb-8">Gluten-Free Pizzas</h2>
            <p className="text-lg mb-8 font-bold">
              Available in 9" and 11" sizes on our dedicated gluten-free crust.
            </p>

            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search gluten-free pizzas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-4 border-black text-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.pizzas.filter(pizza => {
                if (!searchQuery.trim()) return true;
                const query = searchQuery.toLowerCase();
                return pizza.name.toLowerCase().includes(query) ||
                       pizza.description.toLowerCase().includes(query);
              }).map((pizza, idx) => {
                const menuItem = findMenuItem(pizza.name);
                return (
                  <div key={idx} className="bg-white border-6 border-black p-6 brutal-shadow">
                    <h3 className="font-['Bebas_Neue'] text-2xl text-[var(--brand-blue)] mb-3">
                      {pizza.name}
                    </h3>
                    <p className="text-sm mb-4 min-h-[60px]">{pizza.description}</p>
                    <div className="border-t-2 border-gray-200 pt-4">
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="text-center">
                          <div className="text-xs font-bold text-gray-600 mb-1">9"</div>
                          <div className="font-['Bebas_Neue'] text-2xl text-[var(--brand-blue)]">
                            ${pizza.small.toFixed(2)}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs font-bold text-gray-600 mb-1">11"</div>
                          <div className="font-['Bebas_Neue'] text-2xl text-[var(--brand-blue)]">
                            ${pizza.large.toFixed(2)}
                          </div>
                        </div>
                      </div>
                      {menuItem && (
                        <button
                          onClick={() => setSelectedItem({
                            id: menuItem.id,
                            name: menuItem.name,
                            prices: menuItem.prices?.map(p => ({size: p.size || '', price: p.price})) || []
                          })}
                          className="w-full bg-[var(--brand-yellow)] text-black font-['Bebas_Neue'] text-xl py-3 border-4 border-black brutal-shadow snap-grow"
                        >
                          Add to Cart
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Wings Section */}
          <div className="mb-16">
            <h2 className="font-['Bebas_Neue'] text-[var(--brand-blue)] mb-8">Gluten-Free Wings</h2>
            <p className="text-lg mb-8 font-bold">
              Crispy, delicious, and 100% gluten-free. Prepared in a dedicated fryer for your peace of mind.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Wing Sizes Card */}
              <div className="bg-white border-6 border-black p-8 brutal-shadow">
                <h3 className="font-['Bebas_Neue'] text-3xl text-[var(--brand-blue)] mb-6 text-center">Wing Sizes</h3>
                <div className="space-y-4">
                  {data.wings.sizes.map((size, idx) => {
                    const gfWingsItem = wingsMenuItems?.find(item => item?.name?.toLowerCase().includes('gluten-free wings'));
                    return (
                      <div key={idx} className="flex justify-between items-center pb-3 border-b-2 border-gray-200">
                        <span className="font-bold text-lg">{size.count} Wings</span>
                        <span className="font-['Bebas_Neue'] text-2xl text-[var(--brand-blue)] mr-4">
                          ${size.price.toFixed(2)}
                        </span>
                        <button
                          onClick={() => {
                            setSelectedWing({
                              id: gfWingsItem?.id || 0,
                              name: `Gluten-Free Wings (${size.count} pieces)`,
                              options: [{
                                size: `${size.count} pieces`,
                                price: size.price.toFixed(2),
                                pieces: size.count
                              }]
                            });
                            setWingDialogOpen(true);
                          }}
                          className="bg-[var(--brand-yellow)] text-black font-bold px-4 py-2 border-2 border-black brutal-shadow snap-grow text-sm"
                        >
                          Add
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Wing Flavours Card */}
              <div className="bg-white border-6 border-black p-8 brutal-shadow">
                <h3 className="font-['Bebas_Neue'] text-3xl text-[var(--brand-blue)] mb-6 text-center">Wing Flavours</h3>
                <div className="space-y-3">
                  {data.wings.flavours.map((flavour, idx) => (
                    <div key={idx} className="bg-[var(--brand-yellow)] border-2 border-black p-3">
                      <span className="font-bold">{flavour.split('(')[0].trim()}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs mt-4 text-gray-600 text-center">
                  Hot wings available in Mild 🔥, Extra Hot 🔥🔥, or Super Hot 🔥🔥🔥
                </p>
              </div>

              {/* Dipping Sauces Card */}
              <div className="bg-white border-6 border-black p-8 brutal-shadow">
                <h3 className="font-['Bebas_Neue'] text-3xl text-[var(--brand-blue)] mb-6 text-center">Dipping Sauces</h3>
                <div className="space-y-4">
                  {data.wings.dipping_sauces.map((sauce, idx) => {
                    const sauceItem = sidesMenuItems?.find(item => item?.name?.toLowerCase().includes(sauce.name.toLowerCase()) && item?.name?.toLowerCase().includes('gf'));
                    return (
                      <div key={idx} className="flex justify-between items-center pb-3 border-b-2 border-gray-200">
                        <div>
                          <span className="font-bold">{sauce.name}</span>
                          <span className="text-sm text-gray-600 ml-2">(44mL)</span>
                        </div>
                        <span className="font-['Bebas_Neue'] text-xl text-[var(--brand-blue)] mr-4">
                          ${sauce.price.toFixed(2)}
                        </span>
                        {sauceItem && (
                          <button
                            onClick={() => setSelectedItem({
                              id: sauceItem.id,
                              name: sauceItem.name,
                              prices: sauceItem.prices?.map(p => ({size: p.size || '', price: p.price})) || []
                            })}
                            className="bg-[var(--brand-yellow)] text-black font-bold px-4 py-2 border-2 border-black brutal-shadow snap-grow text-sm"
                          >
                            Add
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="mt-16 bg-[var(--brand-blue)] text-white p-8 md:p-12 border-8 border-black brutal-shadow">
            <h3 className="font-['Bebas_Neue'] text-4xl md:text-5xl text-center mb-4">
              Order Your Gluten-Free Favorites
            </h3>
            <p className="text-xl font-bold text-center mb-6">
              Call us now to place your order!
            </p>
            <div className="flex justify-center gap-4 flex-wrap">
              <a
                href={BUSINESS_INFO.phoneLink}
                className="bg-[var(--brand-yellow)] text-black px-8 py-4 font-['Bebas_Neue'] text-2xl tracking-wide border-4 border-black snap-grow flex items-center gap-2"
              >
                <Phone className="w-6 h-6" />
                {BUSINESS_INFO.phone}
              </a>
              <Link
                href="/menu"
                className="bg-white text-[var(--brand-blue)] px-8 py-4 font-['Bebas_Neue'] text-2xl tracking-wide border-4 border-black snap-grow"
              >
                See Regular Menu
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>

    {/* Add to Cart Dialog */}
    {selectedItem && (
      <AddToCartDialog
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        itemName={selectedItem.name}
        itemId={selectedItem.id}
        prices={selectedItem.prices}
        category="pizza"
      />
    )}
    
    {/* Wing Flavor Dialog */}
    {selectedWing && data && (
      <WingFlavorDialog
        open={wingDialogOpen}
        onClose={() => {
          setWingDialogOpen(false);
          setSelectedWing(null);
        }}
        itemName={selectedWing.name}
        itemId={selectedWing.id}
        options={selectedWing.options}
        flavors={data.wings.flavours}
        onAddToCart={(itemId, size, price, quantity, specialInstructions, selectedFlavors) => {
          const flavorText = selectedFlavors
            ? selectedFlavors.map(f => `${f.pieces} pcs ${f.flavor}`).join(', ')
            : specialInstructions;
          
          addToCartMutation.mutate({
            menuItemId: itemId,
            price,
            size,
            quantity,
            notes: flavorText,
            itemType: "wings",
          });
          setWingDialogOpen(false);
          setSelectedWing(null);
        }}
      />
    )}
    </>
  );
}
