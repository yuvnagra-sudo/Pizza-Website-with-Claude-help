import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const WALKIN_SPECIAL_PRICES = {
  "10": 8.99,
  "12": 11.99,
  "14": 13.99,
};

const SIZES = [
  { value: "10", label: '10"' },
  { value: "12", label: '12"' },
  { value: "14", label: '14"' },
];

export default function WalkinSpecial() {
  const [, navigate] = useLocation();
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedTopping, setSelectedTopping] = useState<string>("");

  // Fetch toppings
  const { data: toppingsData } = trpc.toppings.list.useQuery();
  const utils = trpc.useUtils();
  const addToCart = trpc.cart.add.useMutation({
    onSuccess: () => {
      toast.success("Walk-in Special added to cart!");
      utils.cart.get.invalidate(); // Instantly update cart
      navigate("/");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to add to cart");
    },
  });

  // Get available toppings
  const toppings = toppingsData || [];

  const handleToppingSelect = (toppingId: string) => {
    if (selectedTopping === toppingId) {
      // Deselect the topping if clicking the same one
      setSelectedTopping("");
    } else {
      // Select or change to the new topping
      setSelectedTopping(toppingId);
    }
  };

  const handleAddToCart = () => {
    if (!selectedSize) {
      toast.error("Please select a pizza size");
      return;
    }
    if (!selectedTopping) {
      toast.error("Please select one topping");
      return;
    }

    const selectedToppingData = toppings.find((t: any) => t.id === parseInt(selectedTopping));
    const price = WALKIN_SPECIAL_PRICES[selectedSize as keyof typeof WALKIN_SPECIAL_PRICES];

    addToCart.mutate({
      menuItemId: 1, // Placeholder - we'll use a special identifier
      size: `${selectedSize}"`,
      price,
      quantity: 1,
      customizations: JSON.stringify({
        dealType: 'walkin-special',
        topping: selectedToppingData?.name,
      }),
      notes: `Walk-in Special: ${selectedSize}" pizza with ${selectedToppingData?.name}`,
    });
  };

  const selectedPrice = selectedSize ? WALKIN_SPECIAL_PRICES[selectedSize as keyof typeof WALKIN_SPECIAL_PRICES] : null;

  return (
    <>
      <Helmet>
        <title>Walk-in Special - Johnny's Pizza & Wings</title>
        <meta name="description" content="One-topping pizza at a special price. Choose your size and topping!" />
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-[var(--brand-blue)] text-white py-8 border-b-8 border-black">
          <div className="container mx-auto">
            <button
              onClick={() => navigate("/specials")}
              className="flex items-center gap-2 text-white hover:text-[var(--brand-yellow)] transition-colors mb-4"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-['Bebas_Neue'] text-xl">Back to Specials</span>
            </button>
            <h1 className="font-['Bebas_Neue'] text-5xl md:text-6xl mb-2">Walk-in Special</h1>
            <p className="text-xl">One-Topping Pizza at a Great Price!</p>
          </div>
        </div>

        <div className="container mx-auto py-8 md:py-12">
          <div className="max-w-4xl mx-auto">
            {/* Deal Info */}
            <div className="bg-white border-8 border-[var(--brand-blue)] p-6 md:p-8 brutal-shadow mb-8">
              <h2 className="font-['Bebas_Neue'] text-3xl text-[var(--brand-blue)] mb-4">
                What's Included
              </h2>
              <ul className="space-y-2 text-lg">
                <li>✓ Choose your pizza size</li>
                <li>✓ Choose ANY ONE topping</li>
                <li>✓ Includes cheese and pizza sauce</li>
                <li className="text-red-600 font-bold">✗ Not available for gluten-free pizzas</li>
              </ul>
            </div>

            {/* Size Selection */}
            <div className="bg-white border-8 border-black p-6 md:p-8 brutal-shadow mb-8">
              <h2 className="font-['Bebas_Neue'] text-3xl mb-4">1. Choose Your Size</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {SIZES.map((size) => (
                  <button
                    key={size.value}
                    onClick={() => setSelectedSize(size.value)}
                    className={`p-6 border-4 border-black brutal-shadow transition-all ${
                      selectedSize === size.value
                        ? "bg-[var(--brand-blue)] text-white scale-105"
                        : "bg-white hover:bg-gray-50"
                    }`}
                  >
                    <div className="font-['Bebas_Neue'] text-4xl mb-2">{size.label}</div>
                    <div className="text-2xl font-bold">
                      ${WALKIN_SPECIAL_PRICES[size.value as keyof typeof WALKIN_SPECIAL_PRICES].toFixed(2)}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Topping Selection */}
            <div className="bg-white border-8 border-black p-6 md:p-8 brutal-shadow mb-8">
              <h2 className="font-['Bebas_Neue'] text-3xl mb-2">2. Choose ONE Topping</h2>
              <p className="text-gray-600 mb-6">
                {selectedTopping ? "1 topping selected" : "Select your free topping"}
              </p>
              
              {/* Vegetables */}
              <div className="mb-6">
                <h3 className="font-['Bebas_Neue'] text-2xl text-[var(--brand-blue)] mb-3 pb-2 border-b-4 border-[var(--brand-blue)]">🥬 Vegetables</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {toppings.filter((t: any) => ['Banana Peppers', 'Black Olives', 'Cooked Tomatoes', 'Dill Pickles', 'Fresh Tomatoes', 'Green Olives', 'Green Peppers', 'Jalapeno', 'Lettuce', 'Mushrooms', 'Onions', 'Pineapple', 'Red Onions', 'Spinach'].includes(t.name)).map((topping: any) => (
                    <button
                      key={topping.id}
                      onClick={() => handleToppingSelect(topping.id.toString())}
                      className={`p-4 border-4 border-black brutal-shadow transition-all text-left ${
                        selectedTopping === topping.id.toString()
                          ? "bg-[var(--brand-yellow)] scale-105"
                          : "bg-white hover:bg-gray-50"
                      }`}
                    >
                      <div className="font-bold">{topping.name}</div>
                      {selectedTopping === topping.id.toString() && (
                        <div className="text-sm text-[var(--brand-blue)] font-bold mt-1">✓ Selected</div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Meats */}
              <div className="mb-6">
                <h3 className="font-['Bebas_Neue'] text-2xl text-[var(--brand-blue)] mb-3 pb-2 border-b-4 border-[var(--brand-blue)]">🍖 Meats</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {toppings.filter((t: any) => ['Anchovy', 'Bacon', 'Beef', 'Chicken', 'Donair Meat', 'Ham', 'Italian Sausage', 'Pepperoni', 'Salami', 'Shrimp', 'Spicy Beef'].includes(t.name)).map((topping: any) => (
                    <button
                      key={topping.id}
                      onClick={() => handleToppingSelect(topping.id.toString())}
                      className={`p-4 border-4 border-black brutal-shadow transition-all text-left ${
                        selectedTopping === topping.id.toString()
                          ? "bg-[var(--brand-yellow)] scale-105"
                          : "bg-white hover:bg-gray-50"
                      }`}
                    >
                      <div className="font-bold">{topping.name}</div>
                      {selectedTopping === topping.id.toString() && (
                        <div className="text-sm text-[var(--brand-blue)] font-bold mt-1">✓ Selected</div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dairy/Cheese */}
              <div>
                <h3 className="font-['Bebas_Neue'] text-2xl text-[var(--brand-blue)] mb-3 pb-2 border-b-4 border-[var(--brand-blue)]">🧀 Dairy & Cheese</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {toppings.filter((t: any) => ['Extra Cheese', 'Feta Cheese'].includes(t.name)).map((topping: any) => (
                    <button
                      key={topping.id}
                      onClick={() => handleToppingSelect(topping.id.toString())}
                      className={`p-4 border-4 border-black brutal-shadow transition-all text-left ${
                        selectedTopping === topping.id.toString()
                          ? "bg-[var(--brand-yellow)] scale-105"
                          : "bg-white hover:bg-gray-50"
                      }`}
                    >
                      <div className="font-bold">{topping.name}</div>
                      {selectedTopping === topping.id.toString() && (
                        <div className="text-sm text-[var(--brand-blue)] font-bold mt-1">✓ Selected</div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Summary and Add to Cart */}
            <div className="bg-[var(--brand-yellow)] border-8 border-black p-6 md:p-8 brutal-shadow">
              <h2 className="font-['Bebas_Neue'] text-3xl mb-4">Your Walk-in Special</h2>
              <div className="space-y-2 mb-6">
                <p className="text-lg">
                  <span className="font-bold">Size:</span> {selectedSize ? `${selectedSize}"` : "Not selected"}
                </p>
                <p className="text-lg">
                  <span className="font-bold">Topping:</span>{" "}
                  {selectedTopping
                    ? toppings.find((t: any) => t.id === parseInt(selectedTopping))?.name
                    : "Not selected"}
                </p>
                {selectedPrice && (
                  <p className="text-3xl font-['Bebas_Neue'] text-[var(--brand-blue)] mt-4">
                    Total: ${selectedPrice.toFixed(2)}
                  </p>
                )}
              </div>
              <div className="flex gap-4">
                <Button
                  onClick={handleAddToCart}
                  disabled={!selectedSize || !selectedTopping || addToCart.isPending}
                  className="flex-1 bg-[var(--brand-blue)] text-white border-4 border-black brutal-shadow hover:bg-[var(--brand-blue)]/90 font-['Bebas_Neue'] text-2xl py-6"
                >
                  {addToCart.isPending ? "Adding..." : "Add to Cart"}
                </Button>
                <Button
                  onClick={() => navigate("/specials")}
                  variant="outline"
                  className="border-4 border-black brutal-shadow font-['Bebas_Neue'] text-xl"
                >
                  Cancel
                </Button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
