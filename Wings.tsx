import { useState, useEffect } from "react";
import { BUSINESS_INFO } from "@/../../shared/const";
import { Phone, Flame } from "lucide-react";
import { Link } from "wouter";
import { Helmet } from "react-helmet-async";
import { trpc } from "@/lib/trpc";
import AddToCartDialog from "@/components/AddToCartDialog";
import { WingFlavorDialog } from "@/components/WingFlavorDialog";
import { DrinkSelectionDialog } from "@/components/DrinkSelectionDialog";
import { useCart } from "@/contexts/CartContext";

interface WingOption {
  count: number;
  price: number;
}

interface SidesData {
  salads: Array<{name: string; price: number; description: string}>;
  appetizers: Array<{name: string; price: number; description: string}>;
  fries_and_rings: Array<{name: string; small: number; large: number}>;
  dipping_sauces: Array<{name: string; price: number}>;
  drinks: {
    sizes: Array<{name: string; price: number}>;
    flavors: string[];
  };
}

interface WingsData {
  bone_in_wings: WingOption[];
  boneless_wings: WingOption[];
  flavours: string[];
  sides: SidesData;
}

export default function Wings() {
  const [wingsData, setWingsData] = useState<WingsData | null>(null);
  const [selectedItem, setSelectedItem] = useState<{id: number; name: string; prices: {size: string; price: string}[]} | null>(null);
  const [wingDialogOpen, setWingDialogOpen] = useState(false);
  const [selectedWing, setSelectedWing] = useState<{id: number; name: string; options: {size: string; price: string; pieces: number}[]} | null>(null);
  const [drinkDialogOpen, setDrinkDialogOpen] = useState(false);
  const { refetchCart } = useCart();
  const addToCartMutation = trpc.cart.add.useMutation({
    onSuccess: () => {
      refetchCart();
    },
  });
  // Query all categories needed for this page
  const { data: wingsItems } = trpc.menu.list.useQuery({ category: "wings" });
  const { data: sidesItems } = trpc.menu.list.useQuery({ category: "sides" });
  const { data: drinksItems } = trpc.menu.list.useQuery({ category: "drinks" });
  
  // Combine all menu items for findMenuItem
  const menuItems = [...(wingsItems || []), ...(sidesItems || []), ...(drinksItems || [])];

  useEffect(() => {
    // Load JSON data for display structure
    fetch('/menu_data.json')
      .then(res => res.json())
      .then(data => {
        setWingsData(data.wings_sides);
      })
      .catch(err => {
        console.error('Error loading wings menu:', err);
      });
  }, []);

  const findMenuItem = (name: string) => {
    return menuItems?.find(item => item?.name?.toLowerCase().includes(name.toLowerCase()));
  };

  // Generate MenuItem schema for wings and sides
  const generateWingsSchema = () => {
    if (!wingsData) return null;
    
    const menuItems: any[] = [];
    
    // Add bone-in wings
    wingsData.bone_in_wings.forEach(option => {
      menuItems.push({
        "@type": "MenuItem",
        "name": `Bone-In Wings (${option.count} pieces)`,
        "description": `Crispy bone-in chicken wings. Choose from ${wingsData.flavours.length} flavours.`,
        "offers": {
          "@type": "Offer",
          "price": option.price.toFixed(2),
          "priceCurrency": "CAD"
        }
      });
    });
    
    // Add boneless wings
    wingsData.boneless_wings.forEach(option => {
      menuItems.push({
        "@type": "MenuItem",
        "name": `Boneless Wings (${option.count} pieces)`,
        "description": `Tender boneless chicken wings. Choose from ${wingsData.flavours.length} flavours.`,
        "offers": {
          "@type": "Offer",
          "price": option.price.toFixed(2),
          "priceCurrency": "CAD"
        }
      });
    });
    
    // Add sides
    wingsData.sides.appetizers.forEach(item => {
      menuItems.push({
        "@type": "MenuItem",
        "name": item.name,
        "description": item.description,
        "offers": {
          "@type": "Offer",
          "price": item.price.toFixed(2),
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
        "name": "Wings & Sides Menu",
        "description": "Crispy wings and fresh sides",
        "hasMenuSection": {
          "@type": "MenuSection",
          "name": "Wings & Sides",
          "hasMenuItem": menuItems
        }
      }
    };
  };

  if (!wingsData) {
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
        <title>Wings & Sides - Johnny's Pizza & Wings | Airdrie AB</title>
        <meta name="description" content="Crispy chicken wings in 11 flavours. Bone-in and boneless options. Fresh sides including fries, onion rings, and appetizers. Delivery & pickup in Airdrie. Call 403-948-2020." />
        <link rel="canonical" href="https://johnnyspizza-wings.com/wings-and-sides" />
        {wingsData && (
          <script type="application/ld+json">
            {JSON.stringify(generateWingsSchema())}
          </script>
        )}
      </Helmet>
      <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-[var(--brand-blue)] text-white py-12 md:py-16 border-b-8 border-black">
        <div className="container mx-auto">
          <h1 className="font-['Bebas_Neue'] text-center mb-4">Wings & Sides</h1>
          <p className="text-xl md:text-2xl font-bold text-center max-w-3xl mx-auto mb-8">
            Crispy wings, fresh sides, and everything you need to complete your meal.
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <a
              href={BUSINESS_INFO.phoneLink}
              className="bg-[var(--brand-yellow)] text-black px-8 py-4 font-['Bebas_Neue'] text-2xl tracking-wide border-6 border-black snap-grow inline-flex items-center gap-2"
            >
              <Phone className="w-6 h-6" />
              Order Now: {BUSINESS_INFO.phone}
            </a>
            <Link href="/menu">
              <button className="bg-white text-[var(--brand-blue)] px-8 py-4 font-['Bebas_Neue'] text-2xl tracking-wide border-6 border-black snap-grow">
                View Pizza Menu
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Wings Section */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto">
          <h2 className="font-['Bebas_Neue'] text-[var(--brand-blue)] mb-8">Chicken Wings</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {/* Bone-In Wings */}
            <div className="bg-white border-6 border-black p-8">
              <h3 className="font-['Bebas_Neue'] text-3xl text-[var(--brand-blue)] mb-6">Regular Wings (Bone-In)</h3>
              <div className="space-y-4">
                {wingsData.bone_in_wings.map((option, idx) => {
                  const menuItem = findMenuItem(`Bone-In Wings`);
                  return (
                    <div key={idx} className="flex justify-between items-center pb-3 border-b-2 border-gray-200">
                      <div className="flex-1">
                        <span className="font-bold text-lg">{option.count} Pieces</span>
                      </div>
                      <span className="font-['Bebas_Neue'] text-2xl text-[var(--brand-blue)] mr-4">${option.price.toFixed(2)}</span>
                      <button
                        onClick={() => {
                          setSelectedWing({
                            id: menuItem?.id || 0,
                            name: `Bone-In Wings (${option.count} pieces)`,
                            options: [{
                              size: `${option.count} pieces`,
                              price: option.price.toFixed(2),
                              pieces: option.count
                            }]
                          });
                          setWingDialogOpen(true);
                        }}
                        className="bg-[var(--brand-yellow)] text-black font-bold px-4 py-2 border-2 border-black snap-grow text-sm"
                      >
                        Add
                      </button>
                    </div>
                  );
                })}
              </div>
              <div className="mt-6 bg-[var(--brand-yellow)] px-4 py-3 border-2 border-black">
                <p className="text-sm font-bold text-center">Perfect for sharing! Great with pizza.</p>
              </div>
            </div>

            {/* Boneless Wings */}
            <div className="bg-white border-6 border-black p-8">
              <h3 className="font-['Bebas_Neue'] text-3xl text-[var(--brand-blue)] mb-6">Boneless Wings</h3>
              <div className="space-y-4">
                {wingsData.boneless_wings.map((option, idx) => {
                  const menuItem = findMenuItem(`Boneless Wings`);
                  return (
                    <div key={idx} className="flex justify-between items-center pb-3 border-b-2 border-gray-200">
                      <div className="flex-1">
                        <span className="font-bold text-lg">{option.count} Pieces</span>
                      </div>
                      <span className="font-['Bebas_Neue'] text-2xl text-[var(--brand-blue)] mr-4">${option.price.toFixed(2)}</span>
                      <button
                        onClick={() => {
                          setSelectedWing({
                            id: menuItem?.id || 0,
                            name: `Boneless Wings (${option.count} pieces)`,
                            options: [{
                              size: `${option.count} pieces`,
                              price: option.price.toFixed(2),
                              pieces: option.count
                            }]
                          });
                          setWingDialogOpen(true);
                        }}
                        className="bg-[var(--brand-yellow)] text-black font-bold px-4 py-2 border-2 border-black snap-grow text-sm"
                      >
                        Add
                      </button>
                    </div>
                  );
                })}
              </div>
              <div className="mt-6 bg-[var(--brand-yellow)] px-4 py-3 border-2 border-black">
                <p className="text-sm font-bold text-center">All white meat. No bones, no mess!</p>
              </div>
            </div>
          </div>

          {/* Flavours */}
          <div className="bg-[var(--brand-yellow)] border-8 border-black p-8 md:p-12 mb-12">
            <h3 className="font-['Bebas_Neue'] text-4xl text-center mb-6">Choose Your Flavour</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {wingsData.flavours.map((flavour, idx) => {
                const isHot = flavour === "Hot";
                const isExtraHot = flavour === "Extra Hot";
                const isSuperHot = flavour === "Super Hot";
                
                return (
                  <div key={idx} className="bg-white border-4 border-black p-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <span className="font-bold">{flavour}</span>
                      {isHot && <Flame className="w-5 h-5 text-red-600" aria-label="Spicy" />}
                      {isExtraHot && (
                        <>
                          <Flame className="w-5 h-5 text-red-600" aria-label="Extra Spicy" />
                          <Flame className="w-5 h-5 text-red-600" aria-label="Extra Spicy" />
                        </>
                      )}
                      {isSuperHot && (
                        <>
                          <Flame className="w-5 h-5 text-red-600" aria-label="Super Spicy" />
                          <Flame className="w-5 h-5 text-red-600" aria-label="Super Spicy" />
                          <Flame className="w-5 h-5 text-red-600" aria-label="Super Spicy" />
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-center mt-6 font-bold text-lg">
              Mix and match flavours on your order!
            </p>
          </div>

          {/* Salads & Appetizers */}
          <div className="mb-12">
            <h2 className="font-['Bebas_Neue'] text-[var(--brand-blue)] mb-8">Salads & Appetizers</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...wingsData.sides.salads, ...wingsData.sides.appetizers].map((item, idx) => {
                const menuItem = findMenuItem(item.name);
                return (
                  <div key={idx} className="bg-white border-4 border-black p-6">
                    <h4 className="font-['Bebas_Neue'] text-2xl text-[var(--brand-blue)] mb-2">{item.name}</h4>
                    {item.description && (
                      <p className="text-sm font-medium text-gray-700 mb-3">{item.description}</p>
                    )}
                    <div className="flex justify-between items-center">
                      <div className="font-['Bebas_Neue'] text-3xl text-[var(--brand-blue)]">
                        ${item.price.toFixed(2)}
                      </div>
                      {menuItem && (
                        <button
                          onClick={() => setSelectedItem({
                            id: menuItem.id,
                            name: menuItem.name,
                            prices: menuItem.prices?.map(p => ({size: p.size || '', price: p.price})) || []
                          })}
                          className="bg-[var(--brand-yellow)] text-black font-bold px-4 py-2 border-2 border-black snap-grow text-sm"
                        >
                          Add
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Fries & Rings */}
          <div className="mb-12">
            <h2 className="font-['Bebas_Neue'] text-[var(--brand-blue)] mb-8">Fries & Rings</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {wingsData.sides.fries_and_rings.map((item, idx) => {
                const menuItem = findMenuItem(item.name);
                return (
                  <div key={idx} className="bg-white border-4 border-black p-6">
                    <h4 className="font-['Bebas_Neue'] text-2xl text-[var(--brand-blue)] mb-4">{item.name}</h4>
                    <div className="flex justify-around mb-4">
                      <div className="text-center">
                        <div className="text-xs font-bold text-gray-600 mb-1">Small</div>
                        <div className="font-['Bebas_Neue'] text-2xl text-[var(--brand-blue)]">${item.small.toFixed(2)}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs font-bold text-gray-600 mb-1">Large</div>
                        <div className="font-['Bebas_Neue'] text-2xl text-[var(--brand-blue)]">${item.large.toFixed(2)}</div>
                      </div>
                    </div>
                    {menuItem && (
                      <button
                        onClick={() => setSelectedItem({
                          id: menuItem.id,
                          name: menuItem.name,
                          prices: menuItem.prices?.map(p => ({size: p.size || '', price: p.price})) || []
                        })}
                        className="w-full bg-[var(--brand-yellow)] text-black font-['Bebas_Neue'] text-xl py-2 border-4 border-black snap-grow"
                      >
                        Add to Cart
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Dipping Sauces */}
          <div className="mb-12">
            <h2 className="font-['Bebas_Neue'] text-[var(--brand-blue)] mb-8">Dipping Sauces</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {wingsData.sides.dipping_sauces.map((sauce, idx) => {
                const menuItem = findMenuItem(sauce.name);
                return (
                  <div key={idx} className="bg-white border-4 border-black p-4 text-center">
                    <h4 className="font-bold text-lg mb-2">{sauce.name}</h4>
                    <p className="text-sm text-gray-600 mb-2">44mL</p>
                    <div className="font-['Bebas_Neue'] text-2xl text-[var(--brand-blue)] mb-3">
                      ${sauce.price.toFixed(2)}
                    </div>
                    {menuItem && (
                      <button
                        onClick={() => {
                          // Add directly to cart without special instructions dialog
                          const price = menuItem.prices?.[0]?.price;
                          if (price) {
                            addToCartMutation.mutate({
                              menuItemId: menuItem.id,
                              price: parseFloat(price),
                              size: '44mL',
                              quantity: 1,
                              notes: '',
                              itemType: "dips",
                            });
                          }
                        }}
                        className="bg-[var(--brand-yellow)] text-black font-bold px-3 py-1 border-2 border-black snap-grow text-sm"
                      >
                        Add
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Drinks */}
          <div className="mb-12">
            <h2 className="font-['Bebas_Neue'] text-[var(--brand-blue)] mb-8">Drinks</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Drink Sizes Card */}
              <div className="bg-white border-6 border-black p-8">
                <h3 className="font-['Bebas_Neue'] text-3xl text-[var(--brand-blue)] mb-6 text-center">Sizes & Pricing</h3>
                <div className="space-y-4">
                  {wingsData.sides.drinks.sizes.map((size, idx) => (
                    <div key={idx} className="flex justify-between items-center pb-3 border-b-2 border-gray-200">
                      <div className="flex-1">
                        <span className="font-bold text-lg">{size.name}</span>
                      </div>
                      <span className="font-['Bebas_Neue'] text-2xl text-[var(--brand-blue)]">${size.price.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Drink Flavors Card */}
              <div className="bg-white border-6 border-black p-8">
                <h3 className="font-['Bebas_Neue'] text-3xl text-[var(--brand-blue)] mb-6 text-center">Available Options</h3>
                <div className="grid grid-cols-2 gap-3">
                  {wingsData.sides.drinks.flavors.map((flavor, idx) => (
                    <div key={idx} className="bg-[var(--brand-yellow)] border-2 border-black p-3 text-center">
                      <span className="font-bold text-sm">{flavor}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Add to Cart Button */}
            <div className="mt-6 flex justify-center">
              <button
                onClick={() => setDrinkDialogOpen(true)}
                className="bg-[var(--brand-yellow)] text-black font-bold px-8 py-4 border-4 border-black snap-grow text-lg uppercase"
              >
                🥤 Add Drinks to Cart
              </button>
            </div>
          </div>

          {/* Upsell Section */}
          <div className="mt-16 bg-[var(--brand-blue)] text-white p-8 md:p-12 border-8 border-black">
            <h3 className="font-['Bebas_Neue'] text-4xl md:text-5xl text-center mb-4">Complete Your Order</h3>
            <p className="text-xl font-bold text-center mb-6">
              Add pizza to your wings order for the ultimate meal!
            </p>
            <div className="flex justify-center gap-4 flex-wrap">
              <Link href="/menu">
                <button className="bg-[var(--brand-yellow)] text-black px-8 py-4 font-['Bebas_Neue'] text-2xl tracking-wide border-6 border-black snap-grow">
                  View Pizza Menu
                </button>
              </Link>
              <a
                href={BUSINESS_INFO.phoneLink}
                className="bg-white text-[var(--brand-blue)] px-8 py-4 font-['Bebas_Neue'] text-2xl tracking-wide border-6 border-black snap-grow inline-flex items-center gap-2"
              >
                <Phone className="w-6 h-6" />
                Call To Order
              </a>
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
        category="sides"
      />
    )}

    {/* Wing Flavor Dialog */}
    {selectedWing && wingsData && (
      <WingFlavorDialog
        open={wingDialogOpen}
        onClose={() => {
          setWingDialogOpen(false);
          setSelectedWing(null);
        }}
        itemName={selectedWing.name}
        itemId={selectedWing.id}
        options={selectedWing.options}
        flavors={selectedWing.name.toLowerCase().includes('boneless') 
          ? wingsData.flavours.filter(f => f !== 'Breaded Golden')
          : wingsData.flavours}
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
        }}
      />
    )}

    {/* Drink Selection Dialog */}
    {wingsData && (
      <DrinkSelectionDialog
        open={drinkDialogOpen}
        onClose={() => setDrinkDialogOpen(false)}
        sizes={wingsData.sides.drinks.sizes}
        flavors={wingsData.sides.drinks.flavors}
        onAddToCart={(flavor, size, price, quantity) => {
          // Find the drink menu item - we'll use the first drink item as they all have the same prices
          const drinkItem = drinksItems?.[0];
          if (!drinkItem) {
            alert('Drinks are not available at this time');
            return;
          }

          addToCartMutation.mutate({
            menuItemId: drinkItem.id,
            price,
            size,
            quantity,
            notes: `${flavor} - ${size}`,
            itemType: "drinks",
          });
        }}
      />
    )}
    </>
  );
}
