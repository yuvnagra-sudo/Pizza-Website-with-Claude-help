import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PizzaCustomizer } from "@/components/PizzaCustomizer";
import { HalfAndHalfPizzaCustomizer } from "@/components/HalfAndHalfPizzaCustomizer";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";

interface EditCartItemDialogProps {
  open: boolean;
  onClose: () => void;
  itemName: string;
  itemCategory?: string;
  itemSize?: string;
  menuItemId: number;  // Add menuItemId to fetch base price
  currentCustomizations?: any;
  onSave: (customizations: any, price?: number) => void;
}

export function EditCartItemDialog({
  open,
  onClose,
  itemName,
  itemCategory,
  itemSize,
  menuItemId,
  currentCustomizations,
  onSave,
}: EditCartItemDialogProps) {
  const isPizza = itemCategory === "pizza";
  
  // Fetch menu item to get base price
  const { data: menuItem } = trpc.menu.getById.useQuery({ id: menuItemId });
  
  // Calculate base price from menu item
  const basePrice = menuItem?.prices?.find((p: any) => p.size === itemSize)?.price 
    ? parseFloat(menuItem.prices.find((p: any) => p.size === itemSize)!.price)
    : 0;
  
  // For pizzas: use PizzaCustomizer state
  const [pizzaCustomizations, setPizzaCustomizations] = useState<any>(null);
  
  // For non-pizzas: use simple customization state
  const [extraSauce, setExtraSauce] = useState(false);
  const [easySauce, setEasySauce] = useState(false);
  const [wellDone, setWellDone] = useState(false);
  const [extraWellDone, setExtraWellDone] = useState(false);
  const [specialInstructions, setSpecialInstructions] = useState("");

  // Initialize state from current customizations
  useEffect(() => {
    if (currentCustomizations) {
      if (currentCustomizations.cookingPreferences) {
        setExtraSauce(currentCustomizations.cookingPreferences.extraSauce || false);
        setEasySauce(currentCustomizations.cookingPreferences.easySauce || false);
        setWellDone(currentCustomizations.cookingPreferences.wellDone || false);
        setExtraWellDone(currentCustomizations.cookingPreferences.extraWellDone || false);
      }
      setSpecialInstructions(currentCustomizations.specialInstructions || "");
      setPizzaCustomizations(currentCustomizations);
    }
  }, [currentCustomizations]);

  const handleSave = () => {
    if (isPizza) {
      // For pizzas, use the pizza customizations from PizzaCustomizer or HalfAndHalfPizzaCustomizer
      // Extract the calculated price from pizzaCustomizations
      const price = pizzaCustomizations?.calculatedPrice;
      onSave(pizzaCustomizations || {
        toppingModifications: [],
        cookingPreferences: { extraSauce, easySauce, wellDone, extraWellDone },
        isHalfAndHalf: false
      }, price);
    } else {
      // For non-pizzas, use the simple customization (no price change)
      onSave({
        cookingPreferences: {
          extraSauce,
          easySauce,
          wellDone,
          extraWellDone,
        },
        specialInstructions,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-white border-8 border-black brutal-shadow max-w-md max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-['Bebas_Neue'] text-3xl text-[var(--brand-blue)]">
            Customize {itemName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 overflow-y-auto flex-1">
          {isPizza && itemSize && basePrice ? (
            // Check if it's a half-and-half pizza
            currentCustomizations?.isHalfAndHalf ? (
              <HalfAndHalfPizzaCustomizer
                selectedSize={itemSize}
                basePrice={basePrice}
                onCustomizationsChange={setPizzaCustomizations}
                initialLeftHalf={currentCustomizations.leftHalf}
                initialRightHalf={currentCustomizations.rightHalf}
                initialCookingPreferences={currentCustomizations.cookingPreferences}
              />
            ) : (
              // Regular pizza customization
              <PizzaCustomizer
                pizzaName={itemName}
                selectedSize={itemSize}
                basePrice={basePrice}
                onCustomizationsChange={setPizzaCustomizations}
                initialCustomizations={currentCustomizations}
              />
            )
          ) : (
            // Simple customization for non-pizzas
            <>
              <div>
                <label className="font-['Bebas_Neue'] text-xl mb-3 block">
                  Cooking Preferences:
                </label>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="extra-sauce"
                      checked={extraSauce}
                      onCheckedChange={(checked) => {
                        setExtraSauce(checked as boolean);
                        if (checked) setEasySauce(false); // Deselect Easy Sauce if Extra Sauce is selected
                      }}
                    />
                    <label htmlFor="extra-sauce" className="font-bold cursor-pointer">
                      Extra Sauce
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="easy-sauce"
                      checked={easySauce}
                      onCheckedChange={(checked) => {
                        setEasySauce(checked as boolean);
                        if (checked) setExtraSauce(false); // Deselect Extra Sauce if Easy Sauce is selected
                      }}
                    />
                    <label htmlFor="easy-sauce" className="font-bold cursor-pointer">
                      Easy Sauce (Light)
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="well-done"
                      checked={wellDone}
                      onCheckedChange={(checked) => {
                        setWellDone(checked as boolean);
                        if (checked) setExtraWellDone(false); // Deselect Extra Well Done if Well Done is selected
                      }}
                    />
                    <label htmlFor="well-done" className="font-bold cursor-pointer">
                      Cooked Well Done
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="extra-well-done"
                      checked={extraWellDone}
                      onCheckedChange={(checked) => {
                        setExtraWellDone(checked as boolean);
                        if (checked) setWellDone(false); // Deselect Well Done if Extra Well Done is selected
                      }}
                    />
                    <label htmlFor="extra-well-done" className="font-bold cursor-pointer">
                      Cooked Extra Well Done
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label className="font-['Bebas_Neue'] text-xl mb-3 block">
                  Special Instructions (Optional):
                </label>
                <Textarea
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  placeholder="Any special instructions you would like us to do..."
                  className="border-4 border-black min-h-[80px]"
                />
              </div>
            </>
          )}

          {/* Save Button */}
          <div className="border-t-4 border-black pt-4">
            <Button
              onClick={handleSave}
              className="w-full bg-[var(--brand-yellow)] text-black font-['Bebas_Neue'] text-2xl py-6 border-4 border-black brutal-shadow snap-grow hover:bg-yellow-400"
            >
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
