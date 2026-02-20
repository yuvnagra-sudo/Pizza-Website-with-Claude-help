import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Plus } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface Topping {
  id: number;
  name: string;
  category: "vegetable" | "meat" | "cheese";
  smallPrice: string;
  mediumPrice: string;
  largePrice: string;
}

interface ToppingModification {
  type: "add" | "remove" | "replace";
  toppingId?: number;
  toppingName: string;
  replacedToppingName?: string;
  price: number;
}

interface HalfPizza {
  basePizzaName: string | null;
  basePizzaId: number | null;
  basePizzaPrice: number;
  defaultToppings: string[];
  toppingModifications: ToppingModification[];
}

interface HalfAndHalfPizzaCustomizerProps {
  selectedSize: string;
  basePrice?: number;  // Optional, not used but accepted for compatibility
  initialPizzaName?: string;  // The pizza the user originally clicked on
  initialPizzaId?: number;  // The ID of the pizza the user originally clicked on
  onCustomizationsChange: (customizations: {
    isHalfAndHalf: boolean;
    leftHalf: HalfPizza;
    rightHalf: HalfPizza;
    calculatedPrice: number;
    cookingPreferences: {
      extraSauce: boolean;
      easySauce: boolean;
      wellDone: boolean;
      extraWellDone: boolean;
    };
  }) => void;
  initialLeftHalf?: HalfPizza;
  initialRightHalf?: HalfPizza;
  initialCookingPreferences?: {
    extraSauce: boolean;
    easySauce: boolean;
    wellDone: boolean;
    extraWellDone: boolean;
  };
}

export function HalfAndHalfPizzaCustomizer({
  selectedSize,
  initialPizzaName,
  initialPizzaId,
  onCustomizationsChange,
  initialLeftHalf,
  initialRightHalf,
  initialCookingPreferences,
}: HalfAndHalfPizzaCustomizerProps) {
  const [leftHalf, setLeftHalf] = useState<HalfPizza>(initialLeftHalf || {
    basePizzaName: null,
    basePizzaId: null,
    basePizzaPrice: 0,
    defaultToppings: [],
    toppingModifications: [],
  });

  const [rightHalf, setRightHalf] = useState<HalfPizza>(initialRightHalf || {
    basePizzaName: null,
    basePizzaId: null,
    basePizzaPrice: 0,
    defaultToppings: [],
    toppingModifications: [],
  });

  const [cookingPreferences, setCookingPreferences] = useState(initialCookingPreferences || {
    extraSauce: false,
    easySauce: false,
    wellDone: false,
    extraWellDone: false,
  });

  const [showPizzaSelector, setShowPizzaSelector] = useState<'left' | 'right' | null>(null);
  const [showToppingSelector, setShowToppingSelector] = useState<'left' | 'right' | null>(null);

  // Query all available toppings
  const { data: allToppings = [] } = trpc.toppings.list.useQuery();

  // Query all menu pizzas
  const { data: menuPizzas = [] } = trpc.menu.list.useQuery({ category: "pizza" });

  // Get tRPC utils for imperative queries
  const utils = trpc.useUtils();

  // Get topping price based on size
  const getToppingPrice = (topping: Topping): number => {
    if (selectedSize.includes("12") || selectedSize.toLowerCase().includes("medium")) {
      return parseFloat(topping.mediumPrice);
    } else {
      return parseFloat(topping.largePrice);
    }
  };

  // Load base pizza for a half
  const loadBasePizza = async (pizzaId: number, pizzaName: string, half: 'left' | 'right') => {
    try {
      // Find the pizza in menu to get its price
      const pizza = menuPizzas.find((p: any) => p?.id === pizzaId);
      if (!pizza) return;

      // Get price for selected size
      const priceObj = pizza.prices?.find((p: any) => p?.size === selectedSize);
      const price = priceObj ? parseFloat(priceObj.price) : 0;

      // Fetch default toppings for this pizza
      const toppings = await utils.toppings.getForPizza.fetch({ pizzaName });

      const newHalf: HalfPizza = {
        basePizzaName: pizzaName,
        basePizzaId: pizzaId,
        basePizzaPrice: price,
        defaultToppings: toppings,
        toppingModifications: [],
      };

      if (half === 'left') {
        setLeftHalf(newHalf);
      } else {
        setRightHalf(newHalf);
      }

      setShowPizzaSelector(null);
    } catch (error) {
      console.error('Failed to load base pizza:', error);
    }
  };

  // Calculate price
  const calculatePrice = (): number => {
    // Calculate total cost for each half (base + toppings)
    const leftAdditionalCost = leftHalf.toppingModifications
      .filter(mod => mod.type === 'add')
      .reduce((sum, mod) => sum + mod.price, 0);
    const leftHalfTotal = leftHalf.basePizzaPrice + leftAdditionalCost;

    const rightAdditionalCost = rightHalf.toppingModifications
      .filter(mod => mod.type === 'add')
      .reduce((sum, mod) => sum + mod.price, 0);
    const rightHalfTotal = rightHalf.basePizzaPrice + rightAdditionalCost;

    // Charge only for the more expensive half
    return Math.max(leftHalfTotal, rightHalfTotal);
  };

  // Auto-populate left half with initial pizza on mount
  useEffect(() => {
    if (initialPizzaName && initialPizzaId && !initialLeftHalf && leftHalf.basePizzaName === null) {
      loadBasePizza(initialPizzaId, initialPizzaName, 'left');
    }
  }, [initialPizzaName, initialPizzaId]);

  // Notify parent of changes
  useEffect(() => {
    const calculatedPrice = calculatePrice();
    onCustomizationsChange({
      isHalfAndHalf: true,
      leftHalf,
      rightHalf,
      calculatedPrice,
      cookingPreferences,
    });
  }, [leftHalf, rightHalf, cookingPreferences]);

  // Get current toppings for a half (default + modifications)
  const getCurrentToppings = (half: HalfPizza): string[] => {
    let current = [...half.defaultToppings];

    half.toppingModifications.forEach(mod => {
      if (mod.type === "remove") {
        current = current.filter(t => t.toLowerCase() !== mod.toppingName.toLowerCase());
      } else if (mod.type === "add") {
        if (!current.some(t => t.toLowerCase() === mod.toppingName.toLowerCase())) {
          current.push(mod.toppingName);
        }
      } else if (mod.type === "replace" && mod.replacedToppingName) {
        const index = current.findIndex(t => t.toLowerCase() === mod.replacedToppingName!.toLowerCase());
        if (index !== -1) {
          current[index] = mod.toppingName;
        }
      }
    });

    return current;
  };

  // Add topping to a half
  const handleAddTopping = (toppingName: string, half: 'left' | 'right') => {
    const topping = allToppings.find(t => t.name === toppingName);
    if (!topping) return;

    const targetHalf = half === 'left' ? leftHalf : rightHalf;
    const newMods = [...targetHalf.toppingModifications];

    newMods.push({
      type: "add",
      toppingId: topping.id,
      toppingName: topping.name,
      price: getToppingPrice(topping),
    });

    if (half === 'left') {
      setLeftHalf({ ...leftHalf, toppingModifications: newMods });
    } else {
      setRightHalf({ ...rightHalf, toppingModifications: newMods });
    }

    setShowToppingSelector(null);
  };

  // Remove topping from a half
  const handleRemoveTopping = (toppingName: string, half: 'left' | 'right') => {
    const targetHalf = half === 'left' ? leftHalf : rightHalf;
    let newMods = [...targetHalf.toppingModifications];

    // Check if this topping was added
    const addIndex = newMods.findIndex(m =>
      m.type === "add" &&
      m.toppingName.toLowerCase() === toppingName.toLowerCase()
    );

    if (addIndex !== -1) {
      // Remove the "add" modification
      newMods.splice(addIndex, 1);
    } else {
      // Add a "remove" modification
      newMods.push({
        type: "remove",
        toppingName,
        price: 0,
      });
    }

    if (half === 'left') {
      setLeftHalf({ ...leftHalf, toppingModifications: newMods });
    } else {
      setRightHalf({ ...rightHalf, toppingModifications: newMods });
    }
  };

  return (
    <div className="space-y-6">
      {/* Split View */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-lg font-bold text-gray-900 mb-4">YOUR HALF & HALF PIZZA</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left Half */}
          <div className="bg-white rounded-lg p-4 border-2 border-blue-200">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-blue-700 flex items-center gap-2">
                <span className="text-xl">⬅️</span> LEFT HALF
              </h4>
              {leftHalf.basePizzaName && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPizzaSelector('left')}
                >
                  Change
                </Button>
              )}
            </div>

            {!leftHalf.basePizzaName ? (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowPizzaSelector('left')}
              >
                Choose Base Pizza
              </Button>
            ) : (
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-900">
                  {leftHalf.basePizzaName}
                </div>
                <div className="text-xs text-gray-600">
                  ${leftHalf.basePizzaPrice.toFixed(2)}
                </div>
                
                <div className="flex flex-wrap gap-1 mt-2">
                  {getCurrentToppings(leftHalf).map((topping, idx) => (
                    <div
                      key={idx}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs"
                    >
                      <span>{topping}</span>
                      <button
                        onClick={() => handleRemoveTopping(topping, 'left')}
                        className="hover:bg-blue-200 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-2"
                  onClick={() => setShowToppingSelector('left')}
                >
                  <Plus className="h-4 w-4 mr-1" /> Add Topping
                </Button>
              </div>
            )}
          </div>

          {/* Right Half */}
          <div className="bg-white rounded-lg p-4 border-2 border-orange-200">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-orange-700 flex items-center gap-2">
                <span className="text-xl">➡️</span> RIGHT HALF
              </h4>
              {rightHalf.basePizzaName && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPizzaSelector('right')}
                >
                  Change
                </Button>
              )}
            </div>

            {!rightHalf.basePizzaName ? (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowPizzaSelector('right')}
              >
                Choose Base Pizza
              </Button>
            ) : (
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-900">
                  {rightHalf.basePizzaName}
                </div>
                <div className="text-xs text-gray-600">
                  ${rightHalf.basePizzaPrice.toFixed(2)}
                </div>
                
                <div className="flex flex-wrap gap-1 mt-2">
                  {getCurrentToppings(rightHalf).map((topping, idx) => (
                    <div
                      key={idx}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs"
                    >
                      <span>{topping}</span>
                      <button
                        onClick={() => handleRemoveTopping(topping, 'right')}
                        className="hover:bg-orange-200 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-2"
                  onClick={() => setShowToppingSelector('right')}
                >
                  <Plus className="h-4 w-4 mr-1" /> Add Topping
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cooking Preferences */}
      <div className="space-y-2">
        <h3 className="font-semibold text-gray-900">Cooking Preferences</h3>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={cookingPreferences.extraSauce}
              onChange={(e) => {
                const newValue = e.target.checked;
                setCookingPreferences({ 
                  ...cookingPreferences, 
                  extraSauce: newValue,
                  easySauce: newValue ? false : cookingPreferences.easySauce // Deselect Easy Sauce if Extra Sauce is selected
                });
              }}
              className="rounded"
            />
            <span className="text-sm">Extra Sauce</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={cookingPreferences.easySauce}
              onChange={(e) => {
                const newValue = e.target.checked;
                setCookingPreferences({ 
                  ...cookingPreferences, 
                  easySauce: newValue,
                  extraSauce: newValue ? false : cookingPreferences.extraSauce // Deselect Extra Sauce if Easy Sauce is selected
                });
              }}
              className="rounded"
            />
            <span className="text-sm">Easy Sauce</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={cookingPreferences.wellDone}
              onChange={(e) => {
                const newValue = e.target.checked;
                setCookingPreferences({ 
                  ...cookingPreferences, 
                  wellDone: newValue,
                  extraWellDone: newValue ? false : cookingPreferences.extraWellDone // Deselect Extra Well Done if Well Done is selected
                });
              }}
              className="rounded"
            />
            <span className="text-sm">Well Done</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={cookingPreferences.extraWellDone}
              onChange={(e) => {
                const newValue = e.target.checked;
                setCookingPreferences({ 
                  ...cookingPreferences, 
                  extraWellDone: newValue,
                  wellDone: newValue ? false : cookingPreferences.wellDone // Deselect Well Done if Extra Well Done is selected
                });
              }}
              className="rounded"
            />
            <span className="text-sm">Extra Well Done</span>
          </label>
        </div>
      </div>

      {/* Pizza Selector Dialog */}
      {showPizzaSelector && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                Choose Pizza for {showPizzaSelector === 'left' ? 'Left' : 'Right'} Half
              </h3>
              <button
                onClick={() => setShowPizzaSelector(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {menuPizzas.filter((pizza: any) => 
                pizza.name !== 'Add-on Toppings' && 
                !pizza.name.includes('(Gluten-Free)')
              ).map((pizza: any) => {
                const priceObj = pizza.prices?.find((p: any) => p.size === selectedSize);
                const price = priceObj ? parseFloat(priceObj.price) : 0;

                return (
                  <button
                    key={pizza.id}
                    onClick={() => loadBasePizza(pizza.id, pizza.name, showPizzaSelector!)}
                    className="text-left p-3 border rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                  >
                    <div className="font-medium text-gray-900">{pizza.name}</div>
                    <div className="text-sm text-gray-600 mt-1">{pizza.description}</div>
                    <div className="text-sm font-semibold text-blue-600 mt-2">
                      ${price.toFixed(2)}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Topping Selector Dialog */}
      {showToppingSelector && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                Add Topping to {showToppingSelector === 'left' ? 'Left' : 'Right'} Half
              </h3>
              <button
                onClick={() => setShowToppingSelector(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              {['vegetable', 'meat', 'cheese'].map(category => {
                const categoryToppings = allToppings.filter(t => t.category === category);
                if (categoryToppings.length === 0) return null;

                return (
                  <div key={category}>
                    <h4 className="font-semibold text-gray-900 mb-2 capitalize">{category}s</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {categoryToppings.map(topping => (
                        <button
                          key={topping.id}
                          onClick={() => handleAddTopping(topping.name, showToppingSelector!)}
                          className="text-left p-2 border rounded hover:border-blue-500 hover:bg-blue-50 transition-colors"
                        >
                          <div className="text-sm font-medium">{topping.name}</div>
                          <div className="text-xs text-gray-600">
                            +${getToppingPrice(topping).toFixed(2)}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
