import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

interface CustomizeItemDialogProps {
  open: boolean;
  onClose: () => void;
  itemName: string;
  itemCategory?: string;
  currentCustomizations?: {
    cookingPreferences?: {
      extraSauce?: boolean;
      easySauce?: boolean;
      wellDone?: boolean;
    };
    specialInstructions?: string;
  };
  onSave: (customizations: {
    cookingPreferences: {
      extraSauce: boolean;
      easySauce: boolean;
      wellDone: boolean;
    };
    specialInstructions: string;
  }) => void;
}

export function CustomizeItemDialog({
  open,
  onClose,
  itemName,
  itemCategory,
  currentCustomizations,
  onSave,
}: CustomizeItemDialogProps) {
  const [cookingPreferences, setCookingPreferences] = useState({
    extraSauce: false,
    easySauce: false,
    wellDone: false,
  });
  const [specialInstructions, setSpecialInstructions] = useState("");

  // Load current customizations when dialog opens
  useEffect(() => {
    if (open && currentCustomizations) {
      const prefs = currentCustomizations.cookingPreferences || {};
      setCookingPreferences({
        extraSauce: prefs.extraSauce || false,
        easySauce: prefs.easySauce || false,
        wellDone: prefs.wellDone || false,
      });
      setSpecialInstructions(currentCustomizations.specialInstructions || "");
    }
  }, [open, currentCustomizations]);

  const handleSave = () => {
    onSave({
      cookingPreferences,
      specialInstructions,
    });
    onClose();
  };

  const isPizza = itemCategory === "pizza" || itemName.toLowerCase().includes("pizza");

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-white border-4 border-black">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl text-primary uppercase">
            Customize: {itemName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Cooking Preferences - Only for pizzas */}
          {isPizza && (
            <div className="border-4 border-primary bg-accent/10 p-4">
              <h3 className="font-heading text-lg mb-4 uppercase">Cooking Preferences:</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="extra-sauce"
                    checked={cookingPreferences.extraSauce}
                    onCheckedChange={(checked) =>
                      setCookingPreferences({
                        ...cookingPreferences,
                        extraSauce: checked as boolean,
                      })
                    }
                  />
                  <label
                    htmlFor="extra-sauce"
                    className="text-sm font-medium cursor-pointer"
                  >
                    Extra Sauce
                  </label>
                </div>
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="easy-sauce"
                    checked={cookingPreferences.easySauce}
                    onCheckedChange={(checked) =>
                      setCookingPreferences({
                        ...cookingPreferences,
                        easySauce: checked as boolean,
                      })
                    }
                  />
                  <label
                    htmlFor="easy-sauce"
                    className="text-sm font-medium cursor-pointer"
                  >
                    Easy Sauce (light sauce)
                  </label>
                </div>
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="well-done"
                    checked={cookingPreferences.wellDone}
                    onCheckedChange={(checked) =>
                      setCookingPreferences({
                        ...cookingPreferences,
                        wellDone: checked as boolean,
                      })
                    }
                  />
                  <label
                    htmlFor="well-done"
                    className="text-sm font-medium cursor-pointer"
                  >
                    Cooked Well Done
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Special Instructions */}
          <div>
            <h3 className="font-heading text-lg mb-3 uppercase">
              Special Instructions:
            </h3>
            <Textarea
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              placeholder="e.g., Extra crispy, no onions, cut into squares..."
              className="border-4 border-black min-h-[120px] focus:border-primary"
            />
            <p className="text-xs text-gray-600 mt-2">
              Note: Special requests are subject to availability and may incur additional charges.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t-4 border-black">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 border-4 border-black font-heading text-lg uppercase"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="flex-1 bg-accent hover:bg-accent/90 text-black font-heading text-lg border-4 border-black uppercase"
            >
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
