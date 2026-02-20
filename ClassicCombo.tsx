import { useState, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { useLocation } from "wouter";
import { ArrowLeft, Check, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import AddToCartDialog from "@/components/AddToCartDialog";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

// Classic Combo Pricing from CSV
const CLASSIC_COMBO_PRICES: Record<string, Record<string, number>> = {
  "Cheese": { "10": 18.99, "12": 25.99, "14": 30.99 },
  "Two Topper": { "10": 22.99, "12": 28.99, "14": 35.99 },
  "Hawaiian": { "10": 22.99, "12": 28.99, "14": 35.99 },
  "Pepperoni": { "10": 22.99, "12": 28.99, "14": 35.99 },
  "Three Topper": { "10": 26.99, "12": 32.99, "14": 38.99 },
  "Dill Pickle": { "10": 26.99, "12": 32.99, "14": 38.99 },
  "BBQ Chicken": { "10": 26.99, "12": 32.99, "14": 38.99 },
  "BBQ Chicken with Bacon": { "10": 26.99, "12": 32.99, "14": 38.99 },
  "Chicken Deluxe": { "10": 26.99, "12": 32.99, "14": 38.99 },
  "Hot & Spicy Chicken": { "10": 26.99, "12": 32.99, "14": 38.99 },
  "Butter Chicken": { "10": 26.99, "12": 32.99, "14": 38.99 },
  "Buffalo Chicken": { "10": 26.99, "12": 32.99, "14": 38.99 },
  "Chipotle Chicken": { "10": 26.99, "12": 32.99, "14": 38.99 },
  "Teriyaki Chicken": { "10": 26.99, "12": 32.99, "14": 38.99 },
  "Super Loaded": { "10": 29.99, "12": 35.99, "14": 41.99 },
  "Meat Supreme": { "10": 29.99, "12": 35.99, "14": 41.99 },
  "Caesar's Pizza": { "10": 29.99, "12": 35.99, "14": 41.99 },
  "Johnny's Special": { "10": 29.99, "12": 35.99, "14": 41.99 },
  "Vegetarian": { "10": 26.99, "12": 32.99, "14": 38.99 },
  "Greek Style": { "10": 26.99, "12": 32.99, "14": 38.99 },
  "Canadian Style": { "10": 26.99, "12": 32.99, "14": 38.99 },
  "Canadian Classic": { "10": 26.99, "12": 32.99, "14": 38.99 },
  "Royal Deluxe": { "10": 26.99, "12": 32.99, "14": 38.99 },
  "Spice Lovers": { "10": 26.99, "12": 32.99, "14": 38.99 },
  "Donair": { "10": 29.99, "12": 35.99, "14": 41.99 },
};

// Pizza categories for filtering
// Pizza categories matching main menu filters
const PIZZA_CATEGORIES: Record<string, string[]> = {
  "All": [],
  "Favorites": ["Hawaiian", "Super Loaded", "Meat Supreme", "Johnny's Special", "Vegetarian", "Royal Deluxe", "Donair"],
  "Sweet": ["Hawaiian", "Donair"],
  "Spicy": ["Butter Chicken", "Hot & Spicy Chicken", "Buffalo Chicken", "Spice Lovers"],
  "Vegetarian": ["Cheese", "Johnny's Special", "Vegetarian", "Greek Style", "Dill Pickle"],
  "Chicken": ["BBQ Chicken", "BBQ Chicken with Bacon", "Chicken Deluxe", "Butter Chicken", "Hot & Spicy Chicken", "Buffalo Chicken", "Chipotle Chicken", "Teriyaki Chicken"],
};

type RouteType = "2-pizzas" | "pizza-wings";
type StepType = 1 | 2 | 3 | 4;

interface PizzaSelection {
  menuItemId: number;
  name: string;
  size: string;
  basePrice: number;
  customizations: any;
  notes: string;
  totalPrice: number;
}

interface WingSelection {
  wingId: number;
  name: string;
  type: string;
  flavor: string;
  count: number;
}

export default function ClassicCombo() {
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();
  const { openCart } = useCart();
  
  // Step state
  const [currentStep, setCurrentStep] = useState<StepType>(1);
  const [selectedRoute, setSelectedRoute] = useState<RouteType | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>("");
  
  // Pizza selection state
  const [pizza1, setPizza1] = useState<PizzaSelection | null>(null);
  const [pizza2, setPizza2] = useState<PizzaSelection | null>(null);
  const [currentPizzaStep, setCurrentPizzaStep] = useState<1 | 2>(1);
  
  // Wings selection state
  const [wings, setWings] = useState<WingSelection | null>(null);
  const [selectedWingType, setSelectedWingType] = useState<string>("");
  const [showWingFlavorDialog, setShowWingFlavorDialog] = useState(false);
  const [selectedFlavor, setSelectedFlavor] = useState<string>("");
  
  // Dialog state
  const [showPizzaDialog, setShowPizzaDialog] = useState(false);
  const [selectedPizzaForDialog, setSelectedPizzaForDialog] = useState<any>(null);
  
  // Filter state
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  
  // Fetch menu items
  const { data: menuItems, isLoading } = trpc.menu.list.useQuery({ category: "pizza" });
  const { data: wingsList } = trpc.wings.getAll.useQuery();
  const { data: wingFlavors } = trpc.wings.getFlavors.useQuery();
  const utils = trpc.useUtils();
  const addToCartMutation = trpc.cart.add.useMutation();
  
  // Filter pizzas
  const regularPizzas = useMemo(() => {
    if (!menuItems) return [];
    
    return menuItems.filter(
      (item) =>
        !item.name.toLowerCase().includes("walk-in") &&
        !item.name.toLowerCase().includes("test") &&
        !item.name.toLowerCase().includes("gluten")
    );
  }, [menuItems]);
  
  // Apply category and search filters
  const filteredPizzas = useMemo(() => {
    let filtered = regularPizzas;
    
    console.log("ClassicCombo: Starting with regular pizzas:", filtered.length);
    console.log("ClassicCombo: Selected category:", selectedCategory);
    console.log("ClassicCombo: Search query:", searchQuery);
    
    // Apply category filter
    if (selectedCategory !== "All") {
      const categoryPizzas = PIZZA_CATEGORIES[selectedCategory] || [];
      console.log("ClassicCombo: Category pizzas list:", categoryPizzas);
      filtered = filtered.filter(pizza => categoryPizzas.includes(pizza.name));
      console.log("ClassicCombo: After category filter:", filtered.length, filtered.map(p => p.name));
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(pizza =>
        pizza.name.toLowerCase().includes(query) ||
        (pizza.description && pizza.description.toLowerCase().includes(query))
      );
      console.log("ClassicCombo: After search filter:", filtered.length);
    }
    
    console.log("ClassicCombo: Final filtered pizzas:", filtered.length);
    return filtered;
  }, [regularPizzas, selectedCategory, searchQuery]);
  
  // Handle Step 1 continue
  const handleStep1Continue = () => {
    if (!selectedRoute || !selectedSize) {
      toast.error("Please select a combo type and size");
      return;
    }
    setCurrentStep(2);
  };
  
  // Handle pizza click
  const handlePizzaClick = (pizza: any) => {
    console.log('Pizza clicked:', pizza);
    console.log('Pizza prices:', pizza.prices);
    setSelectedPizzaForDialog(pizza);
    // Map selectedSize ("10", "12", "14") to database format ("Small (10\")", "Medium (12\")", "Large (14\")")
    const sizeMap: Record<string, string> = {
      "10": "Small (10\")",
      "12": "Medium (12\")",
      "14": "Large (14\")"
    };
    const dbSize = sizeMap[selectedSize];
    console.log('Selected size:', selectedSize, '-> DB size:', dbSize);
    const prices = pizza.prices
      .filter((p: any) => p.size === dbSize)
      .map((p: any) => ({ size: p.size, price: p.price }));
    console.log('Filtered prices:', prices);
    console.log('Setting showPizzaDialog to true');
    setShowPizzaDialog(true);
  };
  
  // Handle pizza customization complete from AddToCartDialog
  const handlePizzaCustomized = (customizations: any, totalPrice: number, notes: string) => {
    if (!selectedPizzaForDialog) return;
    
      // Get the correct base price for the selected size from the pizza's prices array
      const sizeMap: Record<string, string> = {
        "10": "Small (10\")",
        "12": "Medium (12\")",
        "14": "Large (14\")"
      };
      const dbSize = sizeMap[selectedSize];
      const priceForSize = selectedPizzaForDialog.prices.find((p: any) => p.size === dbSize);
      const basePrice = priceForSize ? parseFloat(priceForSize.price) : parseFloat(selectedPizzaForDialog.prices[0].price);
      
      const pizzaData: PizzaSelection = {
        menuItemId: selectedPizzaForDialog.id,
        name: selectedPizzaForDialog.name,
        size: selectedSize,
        basePrice: basePrice,
        customizations: customizations,
        notes: notes,
        totalPrice: totalPrice
      };
    
    if (currentPizzaStep === 1) {
      setPizza1(pizzaData);
      setShowPizzaDialog(false);
      setCurrentStep(3);
      setCurrentPizzaStep(2);
    } else {
      setPizza2(pizzaData);
      setShowPizzaDialog(false);
      setCurrentStep(4);
    }
  };
  
  // Handle final add to cart
  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    
    try {
      if (selectedRoute === "2-pizzas" && pizza1 && pizza2) {
        // Calculate Classic Combo pricing (base combo price + topping modifications)
        const pizza1ToppingCharges = pizza1.totalPrice - pizza1.basePrice;
        const pizza1ComboPrice = (CLASSIC_COMBO_PRICES[pizza1.name]?.[selectedSize] || pizza1.basePrice) + pizza1ToppingCharges;
        
        const pizza2ToppingCharges = pizza2.totalPrice - pizza2.basePrice;
        const pizza2ComboPrice = (CLASSIC_COMBO_PRICES[pizza2.name]?.[selectedSize] || pizza2.basePrice) + pizza2ToppingCharges;
        
        // Classic Combo Logic: Charge for the MORE EXPENSIVE pizza, other pizza is FREE
        const chargedPrice = Math.max(pizza1ComboPrice, pizza2ComboPrice);
        const pizza1Price = pizza1ComboPrice >= pizza2ComboPrice ? chargedPrice : 0;
        const pizza2Price = pizza2ComboPrice > pizza1ComboPrice ? chargedPrice : 0;
        
        // Add both pizzas to cart
        await addToCartMutation.mutateAsync({
          menuItemId: pizza1.menuItemId,
          size: pizza1.size,
          quantity: 1,
          price: pizza1Price,
          notes: pizza1.notes + (pizza1Price === 0 ? " [Classic Combo - FREE]" : " [Classic Combo - Charged]"),
          customizations: JSON.stringify(pizza1.customizations),
          itemType: "pizza"
        });
        
        await addToCartMutation.mutateAsync({
          menuItemId: pizza2.menuItemId,
          size: pizza2.size,
          quantity: 1,
          price: pizza2Price,
          notes: pizza2.notes + (pizza2Price === 0 ? " [Classic Combo - FREE]" : " [Classic Combo - Charged]"),
          customizations: JSON.stringify(pizza2.customizations),
          itemType: "pizza"
        });
        
        // Success handling
        await utils.cart.get.invalidate(); // Refresh cart data
        toast.success("Classic Combo added to cart!");
        openCart(); // Open cart to show new items
        
        // Reset state
        setCurrentStep(1);
        setSelectedRoute(null);
        setSelectedSize(null);
        setPizza1(null);
        setPizza2(null);
        setCurrentPizzaStep(1);
        setWings(null);
        setSelectedWingType("");
        setSelectedFlavor("");
      } else if (selectedRoute === "pizza-wings" && pizza1) {
        // Calculate Classic Combo pricing for pizza + wings route
        // Pizza is ALWAYS charged, wings are ALWAYS free
        const pizza1ToppingCharges = pizza1.totalPrice - pizza1.basePrice;
        const pizza1ComboPrice = (CLASSIC_COMBO_PRICES[pizza1.name]?.[selectedSize] || pizza1.basePrice) + pizza1ToppingCharges;
        
        await addToCartMutation.mutateAsync({
          menuItemId: pizza1.menuItemId,
          size: pizza1.size,
          quantity: 1,
          price: pizza1ComboPrice,
          notes: pizza1.notes + " [Classic Combo - Pizza (Charged)]",
          customizations: JSON.stringify(pizza1.customizations),
          itemType: "pizza"
        });
        
        // Add wings to cart with $0 price
        if (wings) {
          const wingSize = `${wings.count}pc`;
          await addToCartMutation.mutateAsync({
            menuItemId: wings.wingId,
            size: wingSize,
            quantity: 1,
            price: 0,
            notes: `Flavor: ${wings.flavor} [Classic Combo - Wings (FREE)]`,
            customizations: JSON.stringify({ flavors: [wings.flavor] }),
            itemType: "wings"
          });
        }
        
        // Success handling
        await utils.cart.get.invalidate(); // Refresh cart data
        toast.success("Classic Combo added to cart!");
        openCart(); // Open cart to show new items
        
        // Reset state
        setCurrentStep(1);
        setSelectedRoute(null);
        setSelectedSize(null);
        setPizza1(null);
        setPizza2(null);
        setCurrentPizzaStep(1);
        setWings(null);
        setSelectedWingType("");
        setSelectedFlavor("");
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast.error("Failed to add to cart. Please try again.");
    }
  };
  
  // Progress bar component
  const ProgressBar = () => {
    const steps = selectedRoute === "2-pizzas" ? 4 : 4;
    return (
      <div className="flex items-center justify-center gap-2 mb-8">
        {[1, 2, 3, 4].map((step) => (
          <div key={step} className="flex items-center">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-black ${
              step < currentStep ? "bg-green-500" : 
              step === currentStep ? "bg-[var(--brand-yellow)]" : 
              "bg-white"
            }`}>
              {step < currentStep ? (
                <Check className="w-5 h-5 text-white" />
              ) : (
                <span className="font-['Bebas_Neue'] text-lg">{step}</span>
              )}
            </div>
            {step < steps && (
              <div className={`w-12 h-1 ${
                step < currentStep ? "bg-green-500" : "bg-gray-300"
              }`} />
            )}
          </div>
        ))}
      </div>
    );
  };
  
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  
  return (
    <>
      <Helmet>
        <title>Classic Combo - Johnny's Pizza & Wings</title>
      </Helmet>
      
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-[var(--brand-blue)] text-white py-8">
          <div className="container">
            <Button
              onClick={() => navigate("/specials")}
              variant="ghost"
              className="text-white hover:bg-white/20 mb-4 border-2 border-white"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Specials
            </Button>
            <h1 className="font-['Bebas_Neue'] text-5xl md:text-6xl mb-2">
              THE CLASSIC COMBO
            </h1>
            <p className="text-xl">Best Value Deal - Choose Your Combo!</p>
          </div>
        </div>
        
        <div className="container py-8">
          <ProgressBar />
          
          {/* Step 1: Choose Combo Type & Size */}
          {currentStep === 1 && (
            <div className="space-y-8">
              <div className="border-4 border-black p-8 bg-gradient-to-br from-gray-50 to-gray-100">
                <h2 className="font-['Bebas_Neue'] text-3xl mb-6 text-[var(--brand-blue)]">1. CHOOSE YOUR COMBO</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <button
                    onClick={() => setSelectedRoute("2-pizzas")}
                    className={`p-6 border-4 border-black transition-all ${
                      selectedRoute === "2-pizzas"
                        ? "bg-[var(--brand-blue)] text-white scale-105"
                        : "bg-white hover:bg-gray-50"
                    }`}
                  >
                    <div className="font-['Bebas_Neue'] text-3xl mb-2">2 Pizzas</div>
                    <p className="text-lg">Same size, any toppings</p>
                  </button>
                  <button
                    onClick={() => setSelectedRoute("pizza-wings")}
                    className={`p-6 border-4 border-black transition-all ${
                      selectedRoute === "pizza-wings"
                        ? "bg-[var(--brand-blue)] text-white scale-105"
                        : "bg-white hover:bg-gray-50"
                    }`}
                  >
                    <div className="font-['Bebas_Neue'] text-3xl mb-2">Pizza + Wings</div>
                    <p className="text-lg">Get a wing meal with your pizza</p>
                    <p className="text-sm mt-2 opacity-80">
                      10" = 8 wings | 12" = 12 wings | 14" = 14 wings
                    </p>
                  </button>
                </div>
              </div>
              
              <div className="border-4 border-black p-8 bg-gradient-to-br from-gray-50 to-gray-100">
                <h2 className="font-['Bebas_Neue'] text-3xl mb-6 text-[var(--brand-blue)]">2. SELECT SIZE</h2>
                <div className="grid grid-cols-3 gap-4">
                  {["10", "12", "14"].map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`p-6 border-4 border-black transition-all ${
                        selectedSize === size
                          ? "bg-[var(--brand-yellow)] scale-105"
                          : "bg-white hover:bg-gray-50"
                      }`}
                    >
                      <div className="font-['Bebas_Neue'] text-4xl">{size}"</div>
                    </button>
                  ))}
                </div>
              </div>
              
              <Button
                onClick={handleStep1Continue}
                disabled={!selectedRoute || !selectedSize}
                className="w-full bg-[var(--brand-blue)] text-white border-4 border-black hover:bg-[var(--brand-blue)]/90 font-['Bebas_Neue'] text-2xl py-6"
              >
                Continue to Pizza Selection →
              </Button>
            </div>
          )}
          
          {/* Step 2: Build First Pizza */}
          {currentStep === 2 && (
            <div className="space-y-8">
              <div className="border-4 border-black p-8 bg-gradient-to-br from-blue-50 to-blue-100">
                <h2 className="font-['Bebas_Neue'] text-3xl mb-4 text-[var(--brand-blue)]">
                  {selectedRoute === "2-pizzas" ? "BUILD YOUR FIRST PIZZA" : "BUILD YOUR PIZZA"}
                </h2>
                <p className="text-lg mb-6">{selectedSize}" Pizza - Choose from our menu</p>
                
                {/* Search Bar */}
                <div className="mb-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      type="text"
                      placeholder="Search pizzas..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 border-2 border-black"
                    />
                  </div>
                </div>
                
                {/* Category Tabs */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {Object.keys(PIZZA_CATEGORIES).map((category) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`px-4 py-2 border-2 border-black font-['Bebas_Neue'] text-lg transition-all ${
                        selectedCategory === category
                          ? "bg-[var(--brand-yellow)] scale-105"
                          : "bg-white hover:bg-gray-100"
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
                
                {/* Pizza Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                  {filteredPizzas.map((pizza) => (
                    <button
                      key={pizza.id}
                      onClick={() => handlePizzaClick(pizza)}
                      className="p-3 md:p-4 border-4 border-black bg-white hover:bg-[var(--brand-yellow)] transition-all text-left flex flex-col min-h-[140px] md:min-h-[160px]"
                    >
                      <div className="font-['Bebas_Neue'] text-lg md:text-xl mb-1 md:mb-2 leading-tight">{pizza.name}</div>
                      {pizza.description && (
                        <p className="text-xs md:text-sm text-gray-600 mb-2 line-clamp-3 md:line-clamp-2 flex-grow">{pizza.description}</p>
                      )}
                      <div className="text-base md:text-lg font-bold mt-auto">
                        ${CLASSIC_COMBO_PRICES[pizza.name]?.[selectedSize]?.toFixed(2) || "N/A"}
                      </div>
                    </button>
                  ))}
                </div>
                
                {filteredPizzas.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No pizzas found. Try a different search or category.
                  </div>
                )}
              </div>
              
              <div className="flex gap-4">
                <Button
                  onClick={() => setCurrentStep(1)}
                  variant="outline"
                  className="border-4 border-black font-['Bebas_Neue'] text-xl py-6"
                >
                  ← Back
                </Button>
              </div>
            </div>
          )}
          
          {/* Step 3: Build Second Pizza or Wings */}
          {currentStep === 3 && selectedRoute === "2-pizzas" && (
            <div className="space-y-8">
              <div className="border-4 border-black p-4 bg-green-50 mb-4">
                <p className="text-lg">
                  ✓ <strong>Pizza #1:</strong> {pizza1?.name}
                </p>
              </div>
              
              <div className="border-4 border-black p-8 bg-gradient-to-br from-blue-50 to-blue-100">
                <h2 className="font-['Bebas_Neue'] text-3xl mb-4 text-[var(--brand-blue)]">BUILD YOUR SECOND PIZZA</h2>
                <p className="text-lg mb-6">{selectedSize}" Pizza - Choose from our menu</p>
                
                {/* Search Bar */}
                <div className="mb-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      type="text"
                      placeholder="Search pizzas..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 border-2 border-black"
                    />
                  </div>
                </div>
                
                {/* Category Tabs */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {Object.keys(PIZZA_CATEGORIES).map((category) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`px-4 py-2 border-2 border-black font-['Bebas_Neue'] text-lg transition-all ${
                        selectedCategory === category
                          ? "bg-[var(--brand-yellow)] scale-105"
                          : "bg-white hover:bg-gray-100"
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
                
                {/* Pizza Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                  {filteredPizzas.map((pizza) => (
                    <button
                      key={pizza.id}
                      onClick={() => handlePizzaClick(pizza)}
                      className="p-3 md:p-4 border-4 border-black bg-white hover:bg-[var(--brand-yellow)] transition-all text-left flex flex-col min-h-[140px] md:min-h-[160px]"
                    >
                      <div className="font-['Bebas_Neue'] text-lg md:text-xl mb-1 md:mb-2 leading-tight">{pizza.name}</div>
                      {pizza.description && (
                        <p className="text-xs md:text-sm text-gray-600 mb-2 line-clamp-3 md:line-clamp-2 flex-grow">{pizza.description}</p>
                      )}
                      <div className="text-base md:text-lg font-bold mt-auto">
                        ${CLASSIC_COMBO_PRICES[pizza.name]?.[selectedSize]?.toFixed(2) || "N/A"}
                      </div>
                    </button>
                  ))}
                </div>
                
                {filteredPizzas.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No pizzas found. Try a different search or category.
                  </div>
                )}
              </div>
              
              <div className="flex gap-4">
                <Button
                  onClick={() => {
                    setCurrentStep(2);
                    setCurrentPizzaStep(1);
                  }}
                  variant="outline"
                  className="border-4 border-black font-['Bebas_Neue'] text-xl py-6"
                >
                  ← Back
                </Button>
              </div>
            </div>
          )}
          
          {/* Step 3: Wings Selection (Pizza + Wings Route) */}
          {currentStep === 3 && selectedRoute === "pizza-wings" && (
            <div className="space-y-8">
              <div className="border-4 border-black p-4 bg-green-50 mb-4">
                <p className="text-lg">
                  ✓ <strong>Pizza:</strong> {pizza1?.name}
                </p>
              </div>
              
              <div className="border-4 border-black p-8 bg-gradient-to-br from-blue-50 to-blue-100">
                <h2 className="font-['Bebas_Neue'] text-3xl mb-4 text-[var(--brand-blue)]">SELECT YOUR WINGS</h2>
                <p className="text-lg mb-6">
                  {selectedSize === "10" ? "8" : selectedSize === "12" ? "12" : "14"} Wings - Choose your wing type
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {wingsList?.map((wing) => (
                    <button
                      key={wing.id}
                      onClick={() => setSelectedWingType(wing.type)}
                      className={`p-6 border-4 border-black transition-all text-left ${
                        selectedWingType === wing.type
                          ? "bg-[var(--brand-yellow)] scale-105"
                          : "bg-white hover:bg-gray-100"
                      }`}
                    >
                      <div className="font-['Bebas_Neue'] text-2xl mb-2">{wing.name}</div>
                      <p className="text-gray-600">{wing.description}</p>
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="flex gap-4">
                <Button
                  onClick={() => {
                    setCurrentStep(2);
                    setSelectedWingType("");
                  }}
                  variant="outline"
                  className="border-4 border-black font-['Bebas_Neue'] text-xl py-6"
                >
                  ← Back
                </Button>
                {selectedWingType && (
                  <Button
                    onClick={() => setShowWingFlavorDialog(true)}
                    className="flex-1 bg-[var(--brand-yellow)] hover:bg-[var(--brand-yellow)]/90 border-4 border-black font-['Bebas_Neue'] text-xl py-6"
                  >
                    Continue to Flavor Selection →
                  </Button>
                )}
              </div>
            </div>
          )}
          
          {/* Step 4: Review & Confirm */}
          {currentStep === 4 && (() => {
            // Calculate Classic Combo pricing for display
            const pizza1ToppingCharges = pizza1 ? pizza1.totalPrice - pizza1.basePrice : 0;
            const pizza1ComboPrice = pizza1 ? (CLASSIC_COMBO_PRICES[pizza1.name]?.[selectedSize] || pizza1.basePrice) + pizza1ToppingCharges : 0;
            
            const pizza2ToppingCharges = pizza2 ? pizza2.totalPrice - pizza2.basePrice : 0;
            const pizza2ComboPrice = pizza2 ? (CLASSIC_COMBO_PRICES[pizza2.name]?.[selectedSize] || pizza2.basePrice) + pizza2ToppingCharges : 0;
            
            // Classic Combo Logic: Charge for the MORE EXPENSIVE pizza, other is FREE
            const totalComboPrice = Math.max(pizza1ComboPrice, pizza2ComboPrice);
            const pizza1IsFree = pizza2ComboPrice > pizza1ComboPrice;
            const pizza2IsFree = pizza1ComboPrice >= pizza2ComboPrice;
            
            return (
            <>
            <div className="space-y-8">
              <div className="border-4 border-black p-8 bg-gradient-to-br from-yellow-50 to-yellow-100">
                <h2 className="font-['Bebas_Neue'] text-3xl mb-6 text-[var(--brand-blue)]">REVIEW YOUR CLASSIC COMBO</h2>
                
                <div className="space-y-4 mb-6">
                  <p className="text-lg">
                    <strong>Combo:</strong> {selectedRoute === "2-pizzas" ? "2 Pizzas" : "Pizza + Wings"}
                  </p>
                  <p className="text-lg">
                    <strong>Size:</strong> {selectedSize}"
                  </p>
                </div>
                
                {pizza1 && (
                  <div className="border-4 border-black p-4 bg-gray-50 mb-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-['Bebas_Neue'] text-2xl">
                          PIZZA #1: {pizza1.name}
                        </p>
                        <p className="text-lg font-bold">
                          {pizza1IsFree ? (
                            <span className="text-green-600">FREE</span>
                          ) : (
                            `$${pizza1ComboPrice.toFixed(2)}`
                          )}
                        </p>
                      </div>
                    </div>
                    {pizza1.notes && (
                      <p className="text-sm mt-2">📝 {pizza1.notes}</p>
                    )}
                    <Button
                      onClick={() => {
                        setCurrentStep(2);
                        setCurrentPizzaStep(1);
                      }}
                      variant="outline"
                      size="sm"
                      className="mt-2 border-2 border-black"
                    >
                      Edit Pizza #1
                    </Button>
                  </div>
                )}
                
                {pizza2 && selectedRoute === "2-pizzas" && (
                  <div className="border-4 border-black p-4 bg-gray-50 mb-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-['Bebas_Neue'] text-2xl">
                          PIZZA #2: {pizza2.name}
                        </p>
                        <p className="text-lg font-bold">
                          {pizza2IsFree ? (
                            <span className="text-green-600">FREE</span>
                          ) : (
                            `$${pizza2ComboPrice.toFixed(2)}`
                          )}
                        </p>
                      </div>
                    </div>
                    {pizza2.notes && (
                      <p className="text-sm mt-2">📝 {pizza2.notes}</p>
                    )}
                    <Button
                      onClick={() => {
                        setCurrentStep(3);
                        setCurrentPizzaStep(2);
                      }}
                      variant="outline"
                      size="sm"
                      className="mt-2 border-2 border-black"
                    >
                      Edit Pizza #2
                    </Button>
                  </div>
                )}
                
                {wings && selectedRoute === "pizza-wings" && (
                  <div className="border-4 border-black p-4 bg-gray-50 mb-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-['Bebas_Neue'] text-2xl">
                          WINGS: {wings.count}PC {wings.name.toUpperCase()}
                        </p>
                        <p className="text-lg font-bold text-green-600">FREE</p>
                        <p className="text-sm mt-1">✓ Flavor: {wings.flavor}</p>
                      </div>
                    </div>
                    <Button
                      onClick={() => {
                        setCurrentStep(3);
                        setSelectedWingType("");
                        setSelectedFlavor("");
                        setWings(null);
                      }}
                      variant="outline"
                      size="sm"
                      className="mt-2 border-2 border-black"
                    >
                      Edit Wings
                    </Button>
                  </div>
                )}
                
                <div className="border-t-4 border-black pt-4 mt-6">
                  <div className="flex justify-between items-center text-2xl font-bold">
                    <span className="font-['Bebas_Neue']">TOTAL:</span>
                    <span>
                      ${selectedRoute === "pizza-wings" ? pizza1ComboPrice.toFixed(2) : totalComboPrice.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-4">
                <Button
                  onClick={() => setCurrentStep(selectedRoute === "2-pizzas" ? 3 : 2)}
                  variant="outline"
                  className="flex-1 border-4 border-black font-['Bebas_Neue'] text-xl py-6"
                >
                  ← Back
                </Button>
                <Button
                  onClick={handleAddToCart}
                  disabled={addToCartMutation.isPending}
                  className="flex-1 bg-[var(--brand-yellow)] text-black border-4 border-black hover:bg-[var(--brand-yellow)]/90 font-['Bebas_Neue'] text-xl py-6"
                >
                  {addToCartMutation.isPending ? "Adding..." : "Add to Cart"}
                </Button>
              </div>
            </div>
            </>
            );
          })()}
        </div>
      </div>
      
      {/* Add to Cart Dialog */}
      {showPizzaDialog && selectedPizzaForDialog && (
        <AddToCartDialog
          itemName={selectedPizzaForDialog.name}
          itemId={selectedPizzaForDialog.id}
          prices={selectedPizzaForDialog.prices.filter((p: any) => {
            const sizeMap: Record<string, string> = {
              "10": "Small (10\")",
              "12": "Medium (12\")",
              "14": "Large (14\")"
            };
            return p.size === sizeMap[selectedSize];
          })}
          category={selectedPizzaForDialog.category}
          isOpen={showPizzaDialog}
          onClose={() => setShowPizzaDialog(false)}
          isClassicCombo={true}
          onUpdate={handlePizzaCustomized}
          classicComboButtonText={currentPizzaStep === 1 ? "Continue to Next Pizza →" : "Continue to Review →"}
        />
      )}
      
      {/* Wing Flavor Selection Dialog */}
      {showWingFlavorDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white border-4 border-black p-6 max-w-md w-full">
            <h3 className="font-['Bebas_Neue'] text-2xl mb-4">SELECT WING FLAVOR</h3>
            <p className="text-gray-600 mb-4">
              Choose a flavor for your {selectedSize === "10" ? "8" : selectedSize === "12" ? "12" : "14"} {selectedWingType} wings
            </p>
            
            <select
              value={selectedFlavor}
              onChange={(e) => setSelectedFlavor(e.target.value)}
              className="w-full p-3 border-2 border-black mb-6"
            >
              <option value="">Select a flavor</option>
              {wingFlavors?.map((flavor) => (
                <option key={flavor.id} value={flavor.name}>
                  {flavor.name}
                </option>
              ))}
            </select>
            
            <div className="flex gap-4">
              <Button
                onClick={() => {
                  setShowWingFlavorDialog(false);
                  setSelectedFlavor("");
                }}
                variant="outline"
                className="flex-1 border-2 border-black"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (!selectedFlavor) return;
                  
                  const wingCount = selectedSize === "10" ? 8 : selectedSize === "12" ? 12 : 14;
                  const selectedWing = wingsList?.find(w => w.type === selectedWingType);
                  
                  if (selectedWing) {
                    setWings({
                      wingId: selectedWing.id,
                      name: selectedWing.name,
                      type: selectedWingType,
                      flavor: selectedFlavor,
                      count: wingCount
                    });
                    setShowWingFlavorDialog(false);
                    setCurrentStep(4); // Go to review
                  }
                }}
                disabled={!selectedFlavor}
                className="flex-1 bg-[var(--brand-yellow)] hover:bg-[var(--brand-yellow)]/90 border-2 border-black"
              >
                Continue to Review →
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
