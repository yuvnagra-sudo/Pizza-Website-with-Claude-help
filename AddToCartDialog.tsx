import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Minus, ShoppingCart } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { PizzaCustomizer } from "@/components/PizzaCustomizer";
import { HalfAndHalfPizzaCustomizer } from "@/components/HalfAndHalfPizzaCustomizer";

interface PriceOption {
  size: string;
  price: string;
}

interface AddToCartDialogProps {
  isOpen: boolean;
  onClose: () => void;
  itemName: string;
  itemId: number;
  prices: PriceOption[];
  category?: string;
  // Edit mode props
  editMode?: boolean;
  initialSize?: string;
  initialQuantity?: number;
  initialNotes?: string;
  initialCustomizations?: any;
  onUpdate?: (customizations: any, price?: number, notes?: string, size?: string) => void;
  // Classic Combo mode props
  isClassicCombo?: boolean;
  classicComboButtonText?: string;
}

export default function AddToCartDialog({
  isOpen,
  onClose,
  itemName,
  itemId,
  prices,
  category,
  editMode = false,
  initialSize,
  initialQuantity = 1,
  initialNotes = "",
  initialCustomizations,
  onUpdate,
  isClassicCombo = false,
  classicComboButtonText = "Continue",
}: AddToCartDialogProps) {
  // Filter out medium size for gluten-free items (only 9" and 11")
  const isGlutenFree = itemName?.toLowerCase().includes('gluten');
  const safePrices = prices || []; // Safety check: ensure prices is not undefined
  const filteredPrices = isGlutenFree 
    ? safePrices.filter(p => !p.size.toLowerCase().includes('medium') && !p.size.includes('12'))
    : safePrices;
  
  // Safety check: ensure filteredPrices has at least one item
  const defaultSize = filteredPrices.length > 0 ? filteredPrices[0].size : "";
  const [selectedSize, setSelectedSize] = useState(initialSize || defaultSize);
  const [quantity, setQuantity] = useState(initialQuantity);
  const [notes, setNotes] = useState(initialNotes);
  const [customizations, setCustomizations] = useState<any>(initialCustomizations || null);
  const [isHalfAndHalf, setIsHalfAndHalf] = useState(initialCustomizations?.isHalfAndHalf || false);
  
  const isPizza = category === "pizza";
  
  // Reset state when dialog closes
  useEffect(() => {
    if (!isOpen) {
      const safePrices = prices || [];
      const filtered = isGlutenFree 
        ? safePrices.filter(p => !p.size.toLowerCase().includes('medium') && !p.size.includes('12'))
        : safePrices;
      setSelectedSize(filtered.length > 0 ? filtered[0].size : "");
      setQuantity(1);
      setNotes("");
      setCustomizations(null);
      setIsHalfAndHalf(false);
    }
  }, [isOpen, filteredPrices]);
  const { refetchCart, openCart } = useCart();
  const { isAuthenticated } = useAuth();

  const addToCartMutation = trpc.cart.add.useMutation({
    onSuccess: () => {
      toast.success(`${itemName} added to cart!`);
      refetchCart();
      onClose();
      setQuantity(1);
      setNotes("");
      openCart();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to add to cart");
    },
  });

  const selectedPrice = filteredPrices.find((p) => p.size === selectedSize);
  const priceValue = selectedPrice ? parseFloat(selectedPrice.price) : 0;
  
  // Calculate price based on whether it's half-and-half or regular
  const customizationCost = isHalfAndHalf 
    ? (customizations?.calculatedPrice || 0) - priceValue  // Half-and-half: use calculated price from component
    : (customizations?.toppingModifications?.reduce((sum: number, mod: any) => sum + mod.price, 0) || 0);  // Regular: sum topping costs
  
  const totalPrice = (priceValue + customizationCost) * quantity;

  const handleAddToCart = () => {
    if (!editMode && !isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }

    if (!selectedSize) {
      toast.error("Please select a size");
      return;
    }

    if ((editMode || isClassicCombo) && onUpdate) {
      // Edit mode or Classic Combo mode: call onUpdate callback
      const customizationsData = isPizza ? (isHalfAndHalf ? {
        isHalfAndHalf: true,
        leftHalf: customizations?.leftHalf || null,
        rightHalf: customizations?.rightHalf || null,
        cookingPreferences: customizations?.cookingPreferences || { extraSauce: false, easySauce: false, wellDone: false, extraWellDone: false }
      } : customizations || {
        toppingModifications: [],
        cookingPreferences: { extraSauce: false, easySauce: false, wellDone: false, extraWellDone: false },
        isHalfAndHalf: false
      }) : {};
      
      onUpdate(customizationsData, priceValue + customizationCost, notes, selectedSize);
      // Don't call onClose() here - let the parent component handle dialog closing
      // This prevents race conditions with state updates in Classic Combo mode
      if (!isClassicCombo) {
        onClose();
      }
    } else {
      // Add mode: use mutation
      addToCartMutation.mutate({
        menuItemId: itemId,
        size: selectedSize,
        quantity,
        price: priceValue + customizationCost,
        notes: notes || undefined,
        customizations: isPizza ? JSON.stringify(isHalfAndHalf ? {
          isHalfAndHalf: true,
          leftHalf: customizations?.leftHalf || null,
          rightHalf: customizations?.rightHalf || null,
          cookingPreferences: customizations?.cookingPreferences || { extraSauce: false, easySauce: false, wellDone: false, extraWellDone: false }
        } : customizations || {
          toppingModifications: [],
          cookingPreferences: { extraSauce: false, easySauce: false, wellDone: false, extraWellDone: false },
          isHalfAndHalf: false
        }) : undefined,
        itemType: category as "pizza" | "wings" | "sides" | "drinks",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white border-8 border-black brutal-shadow max-w-md max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-['Bebas_Neue'] text-3xl text-[var(--brand-blue)]">
            {itemName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 overflow-y-auto flex-1">
          {/* Size Selection */}
          <div>
            <label className="font-['Bebas_Neue'] text-xl mb-3 block">Select Size:</label>
            <div className="grid grid-cols-1 gap-3">
              {filteredPrices.map((price) => (
                <button
                  key={price.size}
                  onClick={() => setSelectedSize(price.size)}
                  className={`p-4 border-4 border-black text-left transition-all ${
                    selectedSize === price.size
                      ? "bg-[var(--brand-yellow)] brutal-shadow"
                      : "bg-white hover:bg-gray-50"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold">{price.size}</span>
                    {!isClassicCombo && (
                      <span className="font-['Bebas_Neue'] text-xl">${price.price}</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Half & Half Toggle (only for 12"+ regular pizzas, not gluten-free) */}
          {isPizza && !isGlutenFree && selectedSize && (selectedSize.includes('12') || selectedSize.includes('14') || selectedSize.toLowerCase().includes('medium') || selectedSize.toLowerCase().includes('large')) && (
            <div className="border-4 border-black p-4 bg-white">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isHalfAndHalf}
                  onChange={(e) => {
                    setIsHalfAndHalf(e.target.checked);
                    setCustomizations(null); // Reset customizations when toggling
                  }}
                  className="mt-1 w-5 h-5 border-2 border-black"
                />
                <div>
                  <span className="font-['Bebas_Neue'] text-xl">Make this a Half & Half Pizza</span>
                  <p className="text-sm text-gray-600">Choose different pizzas for each half</p>
                </div>
              </label>
            </div>
          )}

          {/* Quantity */}
          <div>
            <label className="font-['Bebas_Neue'] text-xl mb-3 block">Quantity:</label>
            <div className="flex items-center gap-2 border-4 border-black w-fit">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="bg-gray-100 p-3 hover:bg-gray-200"
              >
                <Minus className="w-5 h-5" />
              </button>
              <span className="w-16 text-center font-bold text-xl">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="bg-gray-100 p-3 hover:bg-gray-200"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Pizza Customization */}
          {isPizza && selectedSize && (
            <div>
              <label className="font-['Bebas_Neue'] text-xl mb-3 block">Customize Your Pizza:</label>
              {isHalfAndHalf ? (
                <HalfAndHalfPizzaCustomizer
                  selectedSize={selectedSize}
                  initialPizzaName={itemName}
                  initialPizzaId={itemId}
                  onCustomizationsChange={setCustomizations}
                />
              ) : (
                <PizzaCustomizer
                  pizzaName={itemName}
                  selectedSize={selectedSize}
                  basePrice={priceValue}
                  onCustomizationsChange={setCustomizations}
                />
              )}
            </div>
          )}

          {/* Special Instructions */}
          <div>
            <label className="font-['Bebas_Neue'] text-xl mb-3 block">
              Special Instructions (Optional):
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special instructions you would like us to do..."
              className="border-4 border-black min-h-[80px]"
            />
          </div>

          {/* Total and Add Button */}
          <div className="border-t-4 border-black pt-4">
            {!isClassicCombo && (
              <div className="flex justify-between items-center mb-4">
                <span className="font-['Bebas_Neue'] text-2xl">Total:</span>
                <span className="font-['Bebas_Neue'] text-3xl text-[var(--brand-blue)]">
                  ${totalPrice.toFixed(2)}
                </span>
              </div>
            )}
            <Button
              onClick={handleAddToCart}
              disabled={!editMode && !isClassicCombo && addToCartMutation.isPending}
              className="w-full bg-[var(--brand-yellow)] text-black font-['Bebas_Neue'] text-2xl py-6 border-4 border-black brutal-shadow snap-grow hover:bg-yellow-400"
            >
              <ShoppingCart className="w-6 h-6 mr-2" />
              {isClassicCombo ? classicComboButtonText : (editMode ? "Update Item" : (addToCartMutation.isPending ? "Adding..." : "Add to Cart"))}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
