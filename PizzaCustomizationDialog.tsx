import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Minus, Plus, X } from "lucide-react";
import { canSplitPizza, validateToppingReplacement, calculateAddToppingCharge, getToppingPrice } from "../../../shared/toppingLogic";

interface Topping {
  id: number;
  name: string;
  category: 'vegetable' | 'meat' | 'cheese';
  smallPrice: string;
  mediumPrice: string;
  largePrice: string;
}

interface PizzaOption {
  size: string;
  price: string;
}

interface ToppingModification {
  id: string; // unique ID for UI tracking
  type: 'add' | 'remove' | 'replace';
  topping: Topping;
  replacedTopping?: Topping;
  halfPizza: 'whole' | 'left' | 'right';
  additionalCharge: number;
}

interface PizzaCustomizationDialogProps {
  open: boolean;
  onClose: () => void;
  itemName: string;
  itemId: number;
  itemDescription: string;
  options: PizzaOption[];
  isGlutenFree?: boolean;
  defaultToppings?: Topping[];
  availableToppings: Topping[];
  onAddToCart: (
    itemId: number,
    size: string,
    price: number,
    quantity: number,
    customizations: ToppingModification[],
    cookingPreferences: {
      extraSauce?: boolean;
      easySauce?: boolean;
      wellDone?: boolean;
    },
    specialInstructions: string
  ) => void;
}

export function PizzaCustomizationDialog({
  open,
  onClose,
  itemName,
  itemId,
  itemDescription,
  options,
  isGlutenFree = false,
  defaultToppings = [],
  availableToppings,
  onAddToCart,
}: PizzaCustomizationDialogProps) {
  const [selectedOption, setSelectedOption] = useState<PizzaOption | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [modifications, setModifications] = useState<ToppingModification[]>([]);
  const [isHalfAndHalf, setIsHalfAndHalf] = useState(false);
  const [cookingPreferences, setCookingPreferences] = useState({
    extraSauce: false,
    easySauce: false,
    wellDone: false,
  });

  // Current toppings state (default + modifications)
  const [currentToppings, setCurrentToppings] = useState<Topping[]>(defaultToppings);

  useEffect(() => {
    if (options.length > 0 && !selectedOption) {
      setSelectedOption(options[0]);
    }
  }, [options, selectedOption]);

  useEffect(() => {
    // Reset half-and-half if size doesn't support it
    if (selectedOption && !canSplitPizza(selectedOption.size, isGlutenFree)) {
      setIsHalfAndHalf(false);
    }
  }, [selectedOption, isGlutenFree]);

  const canSplit = selectedOption ? canSplitPizza(selectedOption.size, isGlutenFree) : false;

  const handleAddTopping = (topping: Topping, half: 'whole' | 'left' | 'right' = 'whole') => {
    if (!selectedOption) return;

    const charge = calculateAddToppingCharge(topping, selectedOption.size);
    const newMod: ToppingModification = {
      id: `add-${Date.now()}-${Math.random()}`,
      type: 'add',
      topping,
      halfPizza: half,
      additionalCharge: charge,
    };

    setModifications([...modifications, newMod]);
    setCurrentToppings([...currentToppings, topping]);
  };

  const handleRemoveTopping = (topping: Topping, half: 'whole' | 'left' | 'right' = 'whole') => {
    const newMod: ToppingModification = {
      id: `remove-${Date.now()}-${Math.random()}`,
      type: 'remove',
      topping,
      halfPizza: half,
      additionalCharge: 0,
    };

    setModifications([...modifications, newMod]);
    setCurrentToppings(currentToppings.filter(t => t.id !== topping.id));
  };

  const handleReplaceTopping = (
    originalTopping: Topping,
    newTopping: Topping,
    half: 'whole' | 'left' | 'right' = 'whole'
  ) => {
    if (!selectedOption) return;

    const replacementCount = modifications.filter(m => m.type === 'replace').length;
    const validation = validateToppingReplacement(
      originalTopping,
      newTopping,
      selectedOption.size,
      replacementCount
    );

    if (!validation.isValid) {
      alert(validation.errorMessage);
      return;
    }

    const newMod: ToppingModification = {
      id: `replace-${Date.now()}-${Math.random()}`,
      type: 'replace',
      topping: newTopping,
      replacedTopping: originalTopping,
      halfPizza: half,
      additionalCharge: validation.additionalCharge,
    };

    setModifications([...modifications, newMod]);
    setCurrentToppings(
      currentToppings.map(t => (t.id === originalTopping.id ? newTopping : t))
    );
  };

  const handleRemoveModification = (modId: string) => {
    setModifications(modifications.filter(m => m.id !== modId));
    // Recalculate current toppings
    let toppings = [...defaultToppings];
    modifications.filter(m => m.id !== modId).forEach(mod => {
      if (mod.type === 'add') {
        toppings.push(mod.topping);
      } else if (mod.type === 'remove') {
        toppings = toppings.filter(t => t.id !== mod.topping.id);
      } else if (mod.type === 'replace' && mod.replacedTopping) {
        toppings = toppings.map(t => (t.id === mod.replacedTopping!.id ? mod.topping : t));
      }
    });
    setCurrentToppings(toppings);
  };

  const calculateTotal = () => {
    if (!selectedOption) return 0;
    const basePrice = parseFloat(selectedOption.price);
    const customizationCharges = modifications.reduce((sum, mod) => sum + mod.additionalCharge, 0);
    return (basePrice + customizationCharges) * quantity;
  };

  const handleAddToCart = () => {
    if (!selectedOption) return;

    onAddToCart(
      itemId,
      selectedOption.size,
      parseFloat(selectedOption.price),
      quantity,
      modifications,
      cookingPreferences,
      specialInstructions
    );

    // Reset and close
    setQuantity(1);
    setSpecialInstructions("");
    setModifications([]);
    setIsHalfAndHalf(false);
    setCookingPreferences({ extraSauce: false, easySauce: false, wellDone: false });
    setCurrentToppings(defaultToppings);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white border-4 border-black">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl text-primary uppercase">
            {itemName}
          </DialogTitle>
          <p className="text-sm text-gray-600">{itemDescription}</p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Size Selection */}
          <div>
            <h3 className="font-heading text-lg mb-3 uppercase">Select Size:</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {options.map((option) => (
                <button
                  key={option.size}
                  onClick={() => setSelectedOption(option)}
                  className={`p-4 border-4 border-black font-heading text-lg flex flex-col items-center transition-all ${
                    selectedOption?.size === option.size
                      ? "bg-accent text-black"
                      : "bg-white hover:bg-gray-100"
                  }`}
                >
                  <span>{option.size}</span>
                  <span className="text-primary text-xl">${option.price}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Half and Half Option */}
          {canSplit && (
            <div className="flex items-center space-x-3 p-3 border-2 border-primary bg-accent/5">
              <Checkbox
                id="half-and-half"
                checked={isHalfAndHalf}
                onCheckedChange={(checked) => setIsHalfAndHalf(checked as boolean)}
              />
              <label
                htmlFor="half-and-half"
                className="text-sm font-medium leading-none cursor-pointer"
              >
                Make this a half-and-half pizza (two different flavor combinations on one pizza)
              </label>
            </div>
          )}

          {/* Current Toppings */}
          <div className="border-4 border-primary bg-accent/10 p-4">
            <h3 className="font-heading text-lg mb-3 uppercase">Current Toppings:</h3>
            <div className="flex flex-wrap gap-2">
              {currentToppings.map((topping) => (
                <div
                  key={topping.id}
                  className="flex items-center gap-2 bg-white border-2 border-black px-3 py-1"
                >
                  <span className="text-sm">{topping.name}</span>
                  <button
                    onClick={() => handleRemoveTopping(topping)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {currentToppings.length === 0 && (
                <p className="text-sm text-gray-500">No toppings selected</p>
              )}
            </div>
          </div>

          {/* Add Toppings */}
          <div>
            <h3 className="font-heading text-lg mb-3 uppercase">Add Toppings:</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-60 overflow-y-auto p-2 border-2 border-gray-300">
              {availableToppings.map((topping) => (
                <button
                  key={topping.id}
                  onClick={() => handleAddTopping(topping)}
                  className="p-2 border-2 border-black bg-white hover:bg-accent text-sm text-left"
                >
                  <div className="font-medium">{topping.name}</div>
                  <div className="text-xs text-primary">
                    +${selectedOption ? getToppingPrice(topping, selectedOption.size).toFixed(2) : topping.mediumPrice}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Modifications Summary */}
          {modifications.length > 0 && (
            <div className="border-2 border-primary bg-yellow-50 p-4">
              <h3 className="font-heading text-lg mb-3 uppercase">Your Customizations:</h3>
              <div className="space-y-2">
                {modifications.map((mod) => (
                  <div
                    key={mod.id}
                    className="flex items-center justify-between bg-white border border-gray-300 p-2"
                  >
                    <span className="text-sm">
                      {mod.type === 'add' && `Add ${mod.topping.name}`}
                      {mod.type === 'remove' && `Remove ${mod.topping.name}`}
                      {mod.type === 'replace' &&
                        `Replace ${mod.replacedTopping?.name} with ${mod.topping.name}`}
                      {mod.halfPizza !== 'whole' && ` (${mod.halfPizza} half)`}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-primary font-bold">
                        {mod.additionalCharge > 0 ? `+$${mod.additionalCharge.toFixed(2)}` : 'Free'}
                      </span>
                      <button
                        onClick={() => handleRemoveModification(mod.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cooking Preferences */}
          <div className="border-2 border-gray-300 p-4">
            <h3 className="font-heading text-lg mb-3 uppercase">Cooking Preferences:</h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="extra-sauce"
                  checked={cookingPreferences.extraSauce}
                  onCheckedChange={(checked) =>
                    setCookingPreferences({ ...cookingPreferences, extraSauce: checked as boolean })
                  }
                />
                <label htmlFor="extra-sauce" className="text-sm cursor-pointer">
                  Extra Sauce
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="easy-sauce"
                  checked={cookingPreferences.easySauce}
                  onCheckedChange={(checked) =>
                    setCookingPreferences({ ...cookingPreferences, easySauce: checked as boolean })
                  }
                />
                <label htmlFor="easy-sauce" className="text-sm cursor-pointer">
                  Easy Sauce (light sauce)
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="well-done"
                  checked={cookingPreferences.wellDone}
                  onCheckedChange={(checked) =>
                    setCookingPreferences({ ...cookingPreferences, wellDone: checked as boolean })
                  }
                />
                <label htmlFor="well-done" className="text-sm cursor-pointer">
                  Cooked Well Done
                </label>
              </div>
            </div>
          </div>

          {/* Quantity */}
          <div>
            <h3 className="font-heading text-lg mb-3 uppercase">Quantity:</h3>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="border-4 border-black"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="font-heading text-2xl w-12 text-center">{quantity}</span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity(quantity + 1)}
                className="border-4 border-black"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Special Instructions */}
          <div>
            <h3 className="font-heading text-lg mb-3 uppercase">
              Special Instructions (Optional):
            </h3>
            <Textarea
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              placeholder="e.g., Extra crispy crust, no onions on left half..."
              className="border-4 border-black min-h-[100px]"
            />
          </div>

          {/* Total and Add Button */}
          <div className="border-t-4 border-black pt-4">
            <div className="flex justify-between items-center mb-4">
              <span className="font-heading text-xl uppercase">Total:</span>
              <span className="font-heading text-2xl text-primary">
                ${calculateTotal().toFixed(2)}
              </span>
            </div>
            <Button
              onClick={handleAddToCart}
              className="w-full bg-accent hover:bg-accent/90 text-black font-heading text-xl py-6 border-4 border-black uppercase"
            >
              🛒 Add to Cart
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
