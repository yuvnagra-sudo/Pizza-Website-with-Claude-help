import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Plus, ChevronDown, ChevronUp } from "lucide-react";
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
  half?: "left" | "right" | "whole";
}

interface PizzaCustomizerProps {
  pizzaName: string;
  selectedSize: string;
  basePrice: number;  // Add base price prop
  onCustomizationsChange: (customizations: {
    toppingModifications: ToppingModification[];
    cookingPreferences: {
      extraSauce: boolean;
      easySauce: boolean;
      wellDone: boolean;
      extraWellDone: boolean;
    };
    isHalfAndHalf: boolean;
    calculatedPrice: number;  // Add calculated price to customizations
  }) => void;
  initialCustomizations?: any;
}

export function PizzaCustomizer({
  pizzaName,
  selectedSize,
  basePrice,
  onCustomizationsChange,
  initialCustomizations,
}: PizzaCustomizerProps) {
  const [toppingModifications, setToppingModifications] = useState<ToppingModification[]>([]);
  const [cookingPreferences, setCookingPreferences] = useState({
    extraSauce: false,
    easySauce: false,
    wellDone: false,
    extraWellDone: false,
  });
  const [defaultToppings, setDefaultToppings] = useState<string[]>([]);
  const [showAddToppings, setShowAddToppings] = useState(false);
  const [showCooking, setShowCooking] = useState(false);
  const [isHalfAndHalf, setIsHalfAndHalf] = useState(false);
  const [halfSelectionTopping, setHalfSelectionTopping] = useState<string | null>(null);
  const [leftHalfMenuPizza, setLeftHalfMenuPizza] = useState<{id: number, name: string, price: number} | null>(null);
  const [rightHalfMenuPizza, setRightHalfMenuPizza] = useState<{id: number, name: string, price: number} | null>(null);
  const [leftHalfMenuPizzaToppings, setLeftHalfMenuPizzaToppings] = useState<string[]>([]);
  const [rightHalfMenuPizzaToppings, setRightHalfMenuPizzaToppings] = useState<string[]>([]);
  const [showMenuPizzaSelector, setShowMenuPizzaSelector] = useState<'left' | 'right' | null>(null);

  // Detect if this is a Two Topper or Three Topper pizza
  const isTwoTopper = pizzaName.toLowerCase().includes('two topper');
  const isThreeTopper = pizzaName.toLowerCase().includes('three topper');
  const freeToppingLimit = isTwoTopper ? 2 : isThreeTopper ? 3 : 0;

  // Query all available toppings
  const { data: allToppings = [] } = trpc.toppings.list.useQuery();

  // Query default toppings for this specific pizza
  const { data: pizzaToppings = [] } = trpc.toppings.getForPizza.useQuery({ pizzaName });

  // Query all menu pizzas for half-and-half selection
  const { data: menuPizzas = [] } = trpc.menu.list.useQuery(
    { category: "pizza" },
    { enabled: isHalfAndHalf }
  );
  
  // Get tRPC utils for imperative queries
  const utils = trpc.useUtils();

  // Update default toppings when pizza toppings are loaded
  useEffect(() => {
    if (pizzaToppings.length > 0) {
      setDefaultToppings(pizzaToppings);
    }
  }, [pizzaToppings]);

  // Load initial customizations when editing
  useEffect(() => {
    if (initialCustomizations) {
      if (initialCustomizations.toppingModifications) {
        setToppingModifications(initialCustomizations.toppingModifications);
      }
      if (initialCustomizations.cookingPreferences) {
        setCookingPreferences(initialCustomizations.cookingPreferences);
      }
    }
  }, [initialCustomizations]);

  // Recalculate pricing when menu pizzas change
  useEffect(() => {
    if (isHalfAndHalf && (leftHalfMenuPizza || rightHalfMenuPizza)) {
      notifyChange(toppingModifications, cookingPreferences);
    }
  }, [leftHalfMenuPizza, rightHalfMenuPizza]);

  // Load toppings for a selected menu pizza on a specific half
  const loadMenuPizzaToppings = async (pizzaName: string, half: 'left' | 'right') => {
    console.log('[DEBUG] loadMenuPizzaToppings called with:', { pizzaName, half });
    try {
      // Fetch toppings for this pizza using tRPC utils
      const pizzaToppingsData = await utils.toppings.getForPizza.fetch({ pizzaName });
      console.log('[DEBUG] Pizza toppings:', pizzaToppingsData);
      
      // Filter out default ingredients
      const toppingNames = pizzaToppingsData.filter((name: string) => 
        !name.toLowerCase().includes('pizza sauce') && 
        !name.toLowerCase().includes('mozzarella cheese')
      );
      
      // Store in menu pizza toppings state (for pricing logic)
      if (half === 'left') {
        setLeftHalfMenuPizzaToppings(toppingNames);
      } else {
        setRightHalfMenuPizzaToppings(toppingNames);
      }
      
      // Also add to toppingModifications (for UI display)
      setToppingModifications(prev => {
        // Clear existing toppings for this half
        const filtered = prev.filter(mod => mod.half !== half);
        
        // Add new toppings for this half
        const newMods = [...filtered];
        toppingNames.forEach((toppingName: string) => {
          const topping = allToppings.find(t => t.name.toLowerCase() === toppingName.toLowerCase());
          if (topping) {
            newMods.push({
              type: "add",
              toppingId: topping.id,
              toppingName: topping.name,
              price: getToppingPrice(topping),
              half: half,
            });
          }
        });
        
        return newMods;
      });
      
      console.log('[DEBUG] Loaded menu pizza toppings for', half, ':', toppingNames);
    } catch (error) {
      console.error('[ERROR] Failed to load pizza toppings:', error);
    }
  };

  // Get topping price based on size
  const getToppingPrice = (topping: Topping): number => {
    if (selectedSize.includes("10") || selectedSize.toLowerCase().includes("small") || selectedSize.includes("9")) {
      return parseFloat(topping.smallPrice);
    } else if (selectedSize.includes("12") || selectedSize.toLowerCase().includes("medium") || selectedSize.includes("11")) {
      return parseFloat(topping.mediumPrice);
    } else {
      return parseFloat(topping.largePrice);
    }
  };

  // Get current toppings (default + modifications)
  const getCurrentToppings = (): string[] => {
    let current = [...defaultToppings];
    
    toppingModifications.forEach(mod => {
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

  // Recalculate topping prices for Two/Three Topper pizzas
  const recalculateToppingPrices = (mods: ToppingModification[]): ToppingModification[] => {
    if (freeToppingLimit === 0) return mods; // Not a Two/Three Topper
    
    // Count "add" type modifications (these are the customer's chosen toppings)
    const addMods = mods.filter(m => m.type === "add");
    
    // Recalculate prices: first N are free, rest are charged
    return mods.map(mod => {
      if (mod.type !== "add") return mod;
      
      const modIndex = addMods.indexOf(mod);
      if (modIndex < freeToppingLimit) {
        // Within free limit
        return { ...mod, price: 0 };
      } else {
        // Beyond free limit - charge normal price
        const topping = allToppings.find(t => t.id === mod.toppingId);
        if (!topping) return mod;
        return { ...mod, price: getToppingPrice(topping) };
      }
    });
  };

  // Handle topping removal
  const handleRemoveTopping = (toppingName: string) => {
    let newMods = [...toppingModifications];
    
    // Check if this topping was added via "add" modification
    const addIndex = newMods.findIndex(m => 
      m.type === "add" && 
      m.toppingName.toLowerCase() === toppingName.toLowerCase()
    );
    
    // Check if this topping was added via "replace" modification
    const replaceIndex = newMods.findIndex(m => 
      m.type === "replace" && 
      m.toppingName.toLowerCase() === toppingName.toLowerCase()
    );
    
    if (addIndex !== -1) {
      // Remove the "add" modification
      newMods.splice(addIndex, 1);
    } else if (replaceIndex !== -1) {
      // COLLAPSE CHAIN: Convert the "replace" back to a "remove" of the original topping
      const replacement = newMods[replaceIndex];
      newMods[replaceIndex] = {
        type: "remove",
        toppingName: replacement.replacedToppingName!,
        price: 0,
      };
    } else {
      // Add a new "remove" modification
      newMods.push({
        type: "remove",
        toppingName,
        price: 0,
      });
    }
    
    // Recalculate prices for Two/Three Topper pizzas
    newMods = recalculateToppingPrices(newMods);
    
    setToppingModifications(newMods);
    notifyChange(newMods, cookingPreferences);
  };

  // Handle adding a new topping
  const handleAddTopping = (toppingName: string, half: "left" | "right" | "whole" = "whole") => {
    const topping = allToppings.find(t => t.name === toppingName);
    if (!topping) return;

    const newMods = [...toppingModifications];
    
    // For Two Topper and Three Topper pizzas, count only added toppings (not default toppings)
    if (freeToppingLimit > 0) {
      // Count only "add" type modifications (customer-added toppings)
      const addedToppingsCount = newMods.filter(m => m.type === "add").length;
      
      // If we haven't reached the free topping limit, add for free
      if (addedToppingsCount < freeToppingLimit) {
        newMods.push({
          type: "add",
          toppingId: topping.id,
          toppingName: topping.name,
          price: 0, // FREE within limit
          half: isHalfAndHalf ? half : "whole",
        });
        setToppingModifications(newMods);
        notifyChange(newMods, cookingPreferences);
        return;
      }
      // Otherwise, charge normal price for toppings beyond the limit
      newMods.push({
        type: "add",
        toppingId: topping.id,
        toppingName: topping.name,
        price: getToppingPrice(topping), // CHARGED beyond limit
        half: isHalfAndHalf ? half : "whole",
      });
      setToppingModifications(newMods);
      notifyChange(newMods, cookingPreferences);
      return;
    }
    
    // Check if there's an unused "remove" modification that can be converted to a free replacement
    // Find all remove modifications that haven't been used for a replacement yet
    const unusedRemoves = newMods.filter(m => 
      m.type === "remove" && 
      !newMods.some(other => other.type === "replace" && other.replacedToppingName === m.toppingName)
    );
    
    // Count how many free replacements have already been used
    const freeReplacementsUsed = newMods.filter(m => m.type === "replace" && m.price === 0).length;
    
    let replacementCreated = false;
    
    // Try to create a free replacement if we haven't used our one free replacement yet
    if (unusedRemoves.length > 0 && freeReplacementsUsed === 0) {
      // Try to find a same-category removal for a free swap
      const removedTopping = unusedRemoves.find(remove => {
        const removedToppingData = allToppings.find(t => t.name.toLowerCase() === remove.toppingName.toLowerCase());
        if (!removedToppingData) {
          // If not in toppings list, check if it's a default topping by checking default list
          // For default toppings not in database, we'll be conservative and allow vegetable swaps
          const isDefaultTopping = defaultToppings.some(dt => dt.toLowerCase() === remove.toppingName.toLowerCase());
          if (isDefaultTopping) {
            // Assume default toppings can be swapped within same category
            // This is a safe assumption for vegetables
            return topping.category === "vegetable";
          }
          return false;
        }
        
        // Same category swap is FREE
        if (removedToppingData.category === topping.category) {
          return true;
        }
        
        // Downgrade (meat/cheese → vegetable) is FREE
        if ((removedToppingData.category === "meat" || removedToppingData.category === "cheese") && 
            topping.category === "vegetable") {
          return true;
        }
        
        return false;
      });
      
      if (removedTopping) {
        // Remove the "remove" modification and create a "replace" modification with price 0
        const removeIndex = newMods.findIndex(m => m === removedTopping);
        newMods.splice(removeIndex, 1);
        
        newMods.push({
          type: "replace",
          toppingId: topping.id,
          toppingName: topping.name,
          replacedToppingName: removedTopping.toppingName,
          price: 0, // FREE replacement
          half: isHalfAndHalf ? half : "whole",
        });
        
        replacementCreated = true;
      } else {
        // Check if there's a removal that would be a paid upgrade (vegetable → meat/cheese)
        const upgradeRemoval = unusedRemoves.find(remove => {
          const removedToppingData = allToppings.find(t => t.name.toLowerCase() === remove.toppingName.toLowerCase());
          if (!removedToppingData) return false;
          
          // Upgrade (vegetable → meat/cheese) is CHARGED
          return removedToppingData.category === "vegetable" && 
                 (topping.category === "meat" || topping.category === "cheese");
        });
        
        if (upgradeRemoval) {
          // Remove the "remove" modification and create a "replace" modification with charge
          const removeIndex = newMods.findIndex(m => m === upgradeRemoval);
          newMods.splice(removeIndex, 1);
          
          newMods.push({
            type: "replace",
            toppingId: topping.id,
            toppingName: topping.name,
            replacedToppingName: upgradeRemoval.toppingName,
            price: getToppingPrice(topping), // CHARGED for upgrade
            half: isHalfAndHalf ? half : "whole",
          });
          
          replacementCreated = true;
        }
      }
    }
    
    // If no replacement was created, add as a new topping with charge
    if (!replacementCreated) {
      newMods.push({
        type: "add",
        toppingId: topping.id,
        toppingName: topping.name,
        price: getToppingPrice(topping),
        half: isHalfAndHalf ? half : "whole",
      });
    }

    setToppingModifications(newMods);
    notifyChange(newMods, cookingPreferences);
  };

  // Handle cooking preference change with mutual exclusivity
  const handleCookingChange = (pref: keyof typeof cookingPreferences) => {
    let newPrefs = { ...cookingPreferences, [pref]: !cookingPreferences[pref] };
    
    // Implement mutual exclusivity for sauce preferences
    if (pref === 'extraSauce' && newPrefs.extraSauce) {
      newPrefs.easySauce = false; // Deselect Easy Sauce when Extra Sauce is selected
    } else if (pref === 'easySauce' && newPrefs.easySauce) {
      newPrefs.extraSauce = false; // Deselect Extra Sauce when Easy Sauce is selected
    }
    
    // Implement mutual exclusivity for cooking doneness preferences
    if (pref === 'wellDone' && newPrefs.wellDone) {
      newPrefs.extraWellDone = false; // Deselect Extra Well Done when Well Done is selected
    } else if (pref === 'extraWellDone' && newPrefs.extraWellDone) {
      newPrefs.wellDone = false; // Deselect Well Done when Extra Well Done is selected
    }
    
    setCookingPreferences(newPrefs);
    notifyChange(toppingModifications, newPrefs);
  };

  // Notify parent of changes
  const notifyChange = (mods: ToppingModification[], prefs: typeof cookingPreferences) => {
    // Filter out toppings that come from menu pizzas (they're FREE)
    const chargeableMods = mods.filter(mod => {
      if (!isHalfAndHalf) return true;
      
      const toppingName = mod.toppingName;
      if (mod.half === 'left' && leftHalfMenuPizzaToppings.some(t => t.toLowerCase() === toppingName.toLowerCase())) {
        return false; // This topping comes from left menu pizza, don't charge
      }
      if (mod.half === 'right' && rightHalfMenuPizzaToppings.some(t => t.toLowerCase() === toppingName.toLowerCase())) {
        return false; // This topping comes from right menu pizza, don't charge
      }
      return true; // This is a manually added topping, charge for it
    });
    
    const additionalCost = chargeableMods.reduce((sum, mod) => sum + mod.price, 0);
    
    // For half-and-half with menu pizzas, use the higher price as base
    let effectiveBasePrice = basePrice;
    if (isHalfAndHalf && (leftHalfMenuPizza || rightHalfMenuPizza)) {
      const leftPrice = leftHalfMenuPizza?.price || 0;
      const rightPrice = rightHalfMenuPizza?.price || 0;
      effectiveBasePrice = Math.max(leftPrice, rightPrice, basePrice);
      console.log('[PRICING] Half-and-half pricing:', {
        leftPizza: leftHalfMenuPizza?.name,
        leftPrice,
        rightPizza: rightHalfMenuPizza?.name,
        rightPrice,
        basePrice,
        effectiveBasePrice,
        totalMods: mods.length,
        chargeableMods: chargeableMods.length,
        additionalCost,
        calculatedPrice: effectiveBasePrice + additionalCost
      });
    }
    
    const calculatedPrice = effectiveBasePrice + additionalCost;
    
    onCustomizationsChange({
      toppingModifications: mods,
      cookingPreferences: prefs,
      isHalfAndHalf,
      calculatedPrice,
    });
  };

  // Calculate additional cost
  const calculateAdditionalCost = (): number => {
    // Filter out toppings that come from menu pizzas (they're FREE)
    const chargeableMods = toppingModifications.filter(mod => {
      if (!isHalfAndHalf) return true;
      
      const toppingName = mod.toppingName;
      if (mod.half === 'left' && leftHalfMenuPizzaToppings.some(t => t.toLowerCase() === toppingName.toLowerCase())) {
        return false; // This topping comes from left menu pizza, don't charge
      }
      if (mod.half === 'right' && rightHalfMenuPizzaToppings.some(t => t.toLowerCase() === toppingName.toLowerCase())) {
        return false; // This topping comes from right menu pizza, don't charge
      }
      return true; // This is a manually added topping, charge for it
    });
    
    return chargeableMods.reduce((sum, mod) => sum + mod.price, 0);
  };

  // Get available toppings by category (not already on pizza)
  const getAvailableToppings = (category: "vegetable" | "meat" | "cheese"): Topping[] => {
    const currentToppings = getCurrentToppings();
    return allToppings.filter(
      t => t.category === category && 
      !currentToppings.some(ct => ct.toLowerCase() === t.name.toLowerCase())
    );
  };

  const currentToppings = getCurrentToppings();
  const additionalCost = calculateAdditionalCost();
  const vegetables = getAvailableToppings("vegetable");
  const meats = getAvailableToppings("meat");
  const cheeses = getAvailableToppings("cheese");

  return (
    <div className="space-y-4">
      {/* Step 1: Current Toppings - Split View for Half & Half */}
      {isHalfAndHalf ? (
        <div className="bg-white rounded-lg border-2 border-gray-300 overflow-hidden">
          <div className="bg-gray-100 px-4 py-3 border-b-2 border-gray-300">
            <h3 className="font-semibold text-gray-900 text-lg">Your Half & Half Pizza</h3>
          </div>
          <div className="grid grid-cols-2 divide-x-2 divide-gray-300">
            {/* Left Half */}
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-blue-700 flex items-center gap-2">
                  <span className="text-xl">⬅️</span> Left Half
                  {leftHalfMenuPizza && <span className="text-xs font-normal">({leftHalfMenuPizza.name})</span>}
                </h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowMenuPizzaSelector('left')}
                  className="text-xs h-7 px-2"
                >
                  Choose Pizza
                </Button>
              </div>
              {(() => {
                const leftToppings = currentToppings.filter(t => {
                  const mod = toppingModifications.find(m => m.toppingName.toLowerCase() === t.toLowerCase());
                  return !mod || mod.half === "left" || mod.half === "whole";
                });
                return leftToppings.length === 0 ? (
                  <p className="text-gray-500 text-sm">No toppings</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {leftToppings.map((topping, index) => {
                      const mod = toppingModifications.find(m => m.toppingName.toLowerCase() === topping.toLowerCase());
                      const isWhole = mod?.half === "whole";
                      return (
                        <div
                          key={index}
                          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
                            isWhole
                              ? 'bg-purple-100 text-purple-900 border-2 border-purple-400'
                              : 'bg-blue-100 text-blue-900 border-2 border-blue-400'
                          }`}
                        >
                          <span>{topping}{isWhole ? ' (whole)' : ''}</span>
                          <button
                            onClick={() => handleRemoveTopping(topping)}
                            className="hover:bg-black/10 rounded-full p-0.5 transition-colors"
                            aria-label={`Remove ${topping}`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
            {/* Right Half */}
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-orange-700 flex items-center gap-2">
                  <span className="text-xl">➡️</span> Right Half
                  {rightHalfMenuPizza && <span className="text-xs font-normal">({rightHalfMenuPizza.name})</span>}
                </h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowMenuPizzaSelector('right')}
                  className="text-xs h-7 px-2"
                >
                  Choose Pizza
                </Button>
              </div>
              {(() => {
                const rightToppings = currentToppings.filter(t => {
                  const mod = toppingModifications.find(m => m.toppingName.toLowerCase() === t.toLowerCase());
                  return !mod || mod.half === "right" || mod.half === "whole";
                });
                return rightToppings.length === 0 ? (
                  <p className="text-gray-500 text-sm">No toppings</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {rightToppings.map((topping, index) => {
                      const mod = toppingModifications.find(m => m.toppingName.toLowerCase() === topping.toLowerCase());
                      const isWhole = mod?.half === "whole";
                      return (
                        <div
                          key={index}
                          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
                            isWhole
                              ? 'bg-purple-100 text-purple-900 border-2 border-purple-400'
                              : 'bg-orange-100 text-orange-900 border-2 border-orange-400'
                          }`}
                        >
                          <span>{topping}{isWhole ? ' (whole)' : ''}</span>
                          <button
                            onClick={() => handleRemoveTopping(topping)}
                            className="hover:bg-black/10 rounded-full p-0.5 transition-colors"
                            aria-label={`Remove ${topping}`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg border-2 border-gray-300 overflow-hidden">
          <div className="bg-gray-100 px-4 py-3 border-b-2 border-gray-300">
            <h3 className="font-semibold text-gray-900 text-lg">Your Pizza</h3>
          </div>
          <div className="p-4">
            {currentToppings.length === 0 ? (
              <p className="text-gray-500 text-sm">No toppings - plain cheese pizza</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {currentToppings.map((topping, index) => {
                  const isAdded = toppingModifications.some(
                    m => m.type === "add" && m.toppingName.toLowerCase() === topping.toLowerCase()
                  );
                  
                  return (
                    <div
                      key={index}
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
                        isAdded
                          ? 'bg-blue-100 text-blue-900 border-2 border-blue-400'
                          : 'bg-gray-100 text-gray-900 border-2 border-gray-300'
                      }`}
                    >
                      <span>{topping}</span>
                      <button
                        onClick={() => handleRemoveTopping(topping)}
                        className="hover:bg-black/10 rounded-full p-1 transition-colors"
                        aria-label={`Remove ${topping}`}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Half & Half feature removed - now handled by separate HalfAndHalfPizzaCustomizer component */}

      {/* Step 2: Add More Toppings */}
      <div className="bg-white rounded-lg border-2 border-gray-300 overflow-hidden">
        <button
          onClick={() => setShowAddToppings(!showAddToppings)}
          className="w-full px-4 py-3 bg-gray-100 border-b-2 border-gray-300 flex items-center justify-between hover:bg-gray-200 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-gray-700" />
            <span className="font-semibold text-gray-900 text-lg">Add More Toppings</span>
          </div>
          {showAddToppings ? (
            <ChevronUp className="w-5 h-5 text-gray-600" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-600" />
          )}
        </button>
        
        {showAddToppings && (
          <div className="p-4 space-y-4">
            <p className="text-sm text-gray-600">
              Additional toppings: ${allToppings[0] ? getToppingPrice(allToppings[0]).toFixed(2) : '2.49'} each
            </p>

            {/* Vegetables */}
            {vegetables.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-green-700 mb-3 flex items-center gap-2">
                  <span className="text-lg">🥬</span>
                  Vegetables ({vegetables.length})
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {vegetables.map(topping => (
                    <button
                      key={topping.id}
                      onClick={() => {
                        if (isHalfAndHalf) {
                          setHalfSelectionTopping(topping.name);
                        } else {
                          handleAddTopping(topping.name);
                        }
                      }}
                      className="flex items-center justify-between p-3 rounded-lg border-2 border-green-200 bg-white hover:border-green-400 hover:bg-green-50 transition-all active:scale-95"
                    >
                      <span className="text-sm font-medium text-gray-900">{topping.name}</span>
                      <Plus className="w-5 h-5 text-green-600 flex-shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Meats */}
            {meats.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-red-700 mb-3 flex items-center gap-2">
                  <span className="text-lg">🍖</span>
                  Meats ({meats.length})
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {meats.map(topping => (
                    <button
                      key={topping.id}
                      onClick={() => {
                        if (isHalfAndHalf) {
                          setHalfSelectionTopping(topping.name);
                        } else {
                          handleAddTopping(topping.name);
                        }
                      }}
                      className="flex items-center justify-between p-3 rounded-lg border-2 border-red-200 bg-white hover:border-red-400 hover:bg-red-50 transition-all active:scale-95"
                    >
                      <span className="text-sm font-medium text-gray-900">{topping.name}</span>
                      <Plus className="w-5 h-5 text-red-600 flex-shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Cheese */}
            {cheeses.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-yellow-700 mb-3 flex items-center gap-2">
                  <span className="text-lg">🧀</span>
                  Cheese ({cheeses.length})
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {cheeses.map(topping => (
                    <button
                      key={topping.id}
                      onClick={() => {
                        if (isHalfAndHalf) {
                          setHalfSelectionTopping(topping.name);
                        } else {
                          handleAddTopping(topping.name);
                        }
                      }}
                      className="flex items-center justify-between p-3 rounded-lg border-2 border-yellow-200 bg-white hover:border-yellow-400 hover:bg-yellow-50 transition-all active:scale-95"
                    >
                      <span className="text-sm font-medium text-gray-900">{topping.name}</span>
                      <Plus className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Step 3: Cooking Preferences */}
      <div className="bg-white rounded-lg border-2 border-gray-300 overflow-hidden">
        <button
          onClick={() => setShowCooking(!showCooking)}
          className="w-full px-4 py-3 bg-gray-100 border-b-2 border-gray-300 flex items-center justify-between hover:bg-gray-200 transition-colors"
        >
          <span className="font-semibold text-gray-900 text-lg">Cooking Preferences</span>
          {showCooking ? (
            <ChevronUp className="w-5 h-5 text-gray-600" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-600" />
          )}
        </button>
        
        {showCooking && (
          <div className="p-4 space-y-3">
            <label className="flex items-center gap-3 p-3 rounded-lg border-2 border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
              <Checkbox
                checked={cookingPreferences.extraSauce}
                onCheckedChange={() => handleCookingChange("extraSauce")}
                className="w-6 h-6"
              />
              <span className="text-sm font-medium text-gray-900">Extra Sauce</span>
            </label>
            <label className="flex items-center gap-3 p-3 rounded-lg border-2 border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
              <Checkbox
                checked={cookingPreferences.easySauce}
                onCheckedChange={() => handleCookingChange("easySauce")}
                className="w-6 h-6"
              />
              <span className="text-sm font-medium text-gray-900">Easy Sauce (Light Sauce)</span>
            </label>
            <label className="flex items-center gap-3 p-3 rounded-lg border-2 border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
              <Checkbox
                checked={cookingPreferences.wellDone}
                onCheckedChange={() => handleCookingChange("wellDone")}
                className="w-6 h-6"
              />
              <span className="text-sm font-medium text-gray-900">Cooked Well Done</span>
            </label>
            <label className="flex items-center gap-3 p-3 rounded-lg border-2 border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
              <Checkbox
                checked={cookingPreferences.extraWellDone}
                onCheckedChange={() => handleCookingChange("extraWellDone")}
                className="w-6 h-6"
              />
              <span className="text-sm font-medium text-gray-900">Cooked Extra Well Done</span>
            </label>
          </div>
        )}
      </div>

      {/* Summary */}
      {toppingModifications.length > 0 && (
        <div className="bg-blue-50 border-2 border-blue-400 rounded-lg p-4 space-y-3">
          <h4 className="font-semibold text-blue-900 text-lg">Your Changes</h4>
          <div className="space-y-2">
            {toppingModifications.map((mod, index) => (
              <div key={index} className="flex justify-between items-center text-sm">
                <span className="text-blue-800 font-medium">
                  {mod.type === "add" && `+ ${mod.toppingName}${mod.half && mod.half !== "whole" ? ` (${mod.half} half)` : ""}`}
                  {mod.type === "remove" && `- ${mod.toppingName}`}
                  {mod.type === "replace" &&
                    `${mod.replacedToppingName} → ${mod.toppingName}${mod.half && mod.half !== "whole" ? ` (${mod.half} half)` : ""}`}
                </span>
                <span className={`font-semibold ${mod.price === 0 ? 'text-green-700' : 'text-blue-900'}`}>
                  {mod.price === 0 ? 'FREE' : `+$${mod.price.toFixed(2)}`}
                </span>
              </div>
            ))}
          </div>
          {additionalCost > 0 && (
            <div className="pt-3 border-t-2 border-blue-300 flex justify-between items-center">
              <span className="font-semibold text-blue-900 text-lg">Additional Cost:</span>
              <span className="font-bold text-blue-900 text-xl">${additionalCost.toFixed(2)}</span>
            </div>
          )}
        </div>
      )}

      {/* Menu Pizza Selector Dialog */}
      {showMenuPizzaSelector && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Choose Pizza for {showMenuPizzaSelector === 'left' ? 'Left' : 'Right'} Half
              </h3>
              <Button
                onClick={() => setShowMenuPizzaSelector(null)}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-sm text-gray-600">Select a menu pizza to use for this half. You can customize toppings after selecting.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {menuPizzas
                .filter(pizza => {
                  if (!pizza?.prices) return false;
                  // Find price for current size
                  const priceObj = pizza.prices.find(p => p.size === selectedSize);
                  return priceObj && parseFloat(priceObj.price) > 0;
                })
                .map((pizza) => {
                  if (!pizza?.prices) return null;
                  const priceObj = pizza.prices.find(p => p.size === selectedSize);
                  const price = priceObj ? parseFloat(priceObj.price) : 0;
                  
                  return (
                    <button
                      key={pizza?.id || Math.random()}
                      onClick={() => {
                        console.log('[DEBUG] Menu pizza button clicked:', pizza?.name);
                        if (!pizza || !showMenuPizzaSelector) {
                          console.log('[DEBUG] Early return - pizza or showMenuPizzaSelector is null');
                          return;
                        }
                        
                        console.log('[DEBUG] Setting menu pizza for half:', showMenuPizzaSelector);
                        // Set the selected menu pizza for this half
                        const selectedPizza = { id: pizza.id, name: pizza.name, price };
                        if (showMenuPizzaSelector === 'left') {
                          setLeftHalfMenuPizza(selectedPizza);
                        } else {
                          setRightHalfMenuPizza(selectedPizza);
                        }
                        
                        console.log('[DEBUG] About to call loadMenuPizzaToppings');
                        // Load toppings for this pizza on the selected half
                        loadMenuPizzaToppings(pizza.name, showMenuPizzaSelector);
                        
                        console.log('[DEBUG] Closing dialog');
                        setShowMenuPizzaSelector(null);
                      }}
                      className="text-left p-4 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                    >
                      <div className="font-semibold text-gray-900">{pizza?.name || 'Unknown Pizza'}</div>
                      <div className="text-sm text-gray-600 mt-1 line-clamp-2">{pizza?.description || ''}</div>
                      <div className="text-lg font-bold text-blue-700 mt-2">${price.toFixed(2)}</div>
                    </button>
                  );
                })}
            </div>
            <Button
              onClick={() => setShowMenuPizzaSelector(null)}
              variant="outline"
              className="w-full"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Half Selection Dialog */}
      {halfSelectionTopping && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Add {halfSelectionTopping}</h3>
            <p className="text-sm text-gray-600">Which half of the pizza?</p>
            <div className="grid grid-cols-3 gap-3">
              <Button
                onClick={() => {
                  handleAddTopping(halfSelectionTopping, "left");
                  setHalfSelectionTopping(null);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Left Half
              </Button>
              <Button
                onClick={() => {
                  handleAddTopping(halfSelectionTopping, "right");
                  setHalfSelectionTopping(null);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Right Half
              </Button>
              <Button
                onClick={() => {
                  handleAddTopping(halfSelectionTopping, "whole");
                  setHalfSelectionTopping(null);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Whole Pizza
              </Button>
            </div>
            <Button
              onClick={() => setHalfSelectionTopping(null)}
              variant="outline"
              className="w-full"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
