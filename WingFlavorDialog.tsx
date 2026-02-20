import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Minus, Plus } from "lucide-react";

interface WingOption {
  size: string;
  price: string;
  pieces: number;
}

interface WingFlavorDialogProps {
  open: boolean;
  onClose: () => void;
  itemName: string;
  itemId: number;
  options: WingOption[];
  flavors: string[];
  onAddToCart: (itemId: number, size: string, price: number, quantity: number, specialInstructions: string, selectedFlavors?: { flavor: string; pieces: number }[]) => void;
}

export function WingFlavorDialog({
  open,
  onClose,
  itemName,
  itemId,
  options,
  flavors,
  onAddToCart,
}: WingFlavorDialogProps) {
  const [selectedOption, setSelectedOption] = useState<WingOption | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [singleFlavor, setSingleFlavor] = useState("");
  const [wantToSplitFlavors, setWantToSplitFlavors] = useState(false);
  const [selectedFlavors, setSelectedFlavors] = useState<{ flavor: string; pieces: number }[]>([]);
  const [canSplitFlavors, setCanSplitFlavors] = useState(false);
  const [extraSauce, setExtraSauce] = useState(false);
  const [easySauce, setEasySauce] = useState(false);
  const [wellDone, setWellDone] = useState(false);
  const [extraWellDone, setExtraWellDone] = useState(false);

  useEffect(() => {
    if (options.length > 0 && !selectedOption) {
      setSelectedOption(options[0]);
    }
  }, [options, selectedOption]);

  useEffect(() => {
    // Check if selected option allows flavor splitting (20+ pieces)
    if (selectedOption) {
      const totalPieces = selectedOption.pieces * quantity;
      setCanSplitFlavors(totalPieces >= 20);
      
      // Reset split flavors if no longer eligible
      if (totalPieces < 20) {
        setWantToSplitFlavors(false);
        setSelectedFlavors([]);
      }
    }
  }, [selectedOption, quantity]);

  const handleAddFlavor = () => {
    if (!selectedOption) return;
    
    const totalPieces = selectedOption.pieces * quantity;
    const usedPieces = selectedFlavors.reduce((sum, f) => sum + f.pieces, 0);
    const remainingPieces = totalPieces - usedPieces;
    
    if (remainingPieces >= 10) {
      setSelectedFlavors([...selectedFlavors, { flavor: flavors[0] || "", pieces: 10 }]);
    }
  };

  const handleRemoveFlavor = (index: number) => {
    setSelectedFlavors(selectedFlavors.filter((_, i) => i !== index));
  };

  const handleFlavorChange = (index: number, flavor: string) => {
    const updated = [...selectedFlavors];
    updated[index] = { ...updated[index], flavor };
    setSelectedFlavors(updated);
  };

  const handlePiecesChange = (index: number, pieces: number) => {
    if (!selectedOption) return;
    
    // Allow any value during typing, validation happens on add to cart
    // This allows users to type freely without intermediate clamping
    const updated = [...selectedFlavors];
    updated[index] = { ...updated[index], pieces: isNaN(pieces) ? 10 : pieces };
    setSelectedFlavors(updated);
  };

  const handleAddToCart = () => {
    if (!selectedOption) return;

    // Check if single flavor is selected (when not splitting)
    if (!wantToSplitFlavors && !singleFlavor) {
      alert("Please select a flavor for your wings");
      return;
    }

    const totalPieces = selectedOption.pieces * quantity;
    const usedPieces = selectedFlavors.reduce((sum, f) => sum + f.pieces, 0);
    
    // If splitting flavors, ensure all pieces are accounted for
    if (wantToSplitFlavors && selectedFlavors.length > 0 && usedPieces !== totalPieces) {
      alert(`Please allocate all ${totalPieces} pieces to flavors (currently ${usedPieces} pieces allocated)`);
      return;
    }

    // Build the flavor note
    let flavorNote = "";
    if (wantToSplitFlavors && selectedFlavors.length > 0) {
      flavorNote = selectedFlavors.map(f => `${f.pieces} pcs ${f.flavor}`).join(', ');
    } else {
      flavorNote = `Flavor: ${singleFlavor}`;
    }

    // Build sauce preference note
    let sauceNote = "";
    if (extraSauce) sauceNote = "Extra Sauce";
    else if (easySauce) sauceNote = "Easy Sauce";

    // Build cooking preference note
    let cookingNote = "";
    if (wellDone) cookingNote = "Well Done";
    else if (extraWellDone) cookingNote = "Extra Well Done";

    // Combine all notes
    const notes = [flavorNote, sauceNote, cookingNote, specialInstructions].filter(n => n).join('\n');

    onAddToCart(
      itemId,
      selectedOption.size,
      parseFloat(selectedOption.price),
      quantity,
      notes,
      wantToSplitFlavors && selectedFlavors.length > 0 ? selectedFlavors : undefined
    );
    
    // Reset and close
    setQuantity(1);
    setSpecialInstructions("");
    setSingleFlavor("");
    setWantToSplitFlavors(false);
    setSelectedFlavors([]);
    setExtraSauce(false);
    setEasySauce(false);
    setWellDone(false);
    setExtraWellDone(false);
    onClose();
  };

  const totalPieces = selectedOption ? selectedOption.pieces * quantity : 0;
  const usedPieces = selectedFlavors.reduce((sum, f) => sum + f.pieces, 0);
  const remainingPieces = totalPieces - usedPieces;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white border-4 border-black">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl text-primary uppercase">
            {itemName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Size Selection */}
          <div>
            <h3 className="font-heading text-lg mb-3 uppercase">Select Size:</h3>
            <div className="space-y-2">
              {options.map((option) => (
                <button
                  key={option.size}
                  onClick={() => setSelectedOption(option)}
                  className={`w-full p-4 border-4 border-black font-heading text-lg flex justify-between items-center transition-all ${
                    selectedOption?.size === option.size
                      ? "bg-accent text-black"
                      : "bg-white hover:bg-gray-100"
                  }`}
                >
                  <span>{option.size}</span>
                  <span className="text-primary">${option.price}</span>
                </button>
              ))}
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
            <p className="text-sm mt-2">Total pieces: {totalPieces}</p>
          </div>

          {/* Single Flavor Selection (Default) */}
          {!wantToSplitFlavors && (
            <div className="border-4 border-primary bg-accent/10 p-4">
              <h3 className="font-heading text-lg mb-3 uppercase">Select Flavor:</h3>
              <select
                value={singleFlavor}
                onChange={(e) => setSingleFlavor(e.target.value)}
                className="w-full p-3 border-4 border-black font-heading text-lg"
              >
                <option value="">Choose a flavor...</option>
                {flavors.map((flavor) => (
                  <option key={flavor} value={flavor}>
                    {flavor}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Split Flavors Option */}
          {canSplitFlavors && (
            <div className="flex items-center space-x-3 p-3 border-2 border-primary bg-accent/5">
              <Checkbox
                id="split-flavors"
                checked={wantToSplitFlavors}
                onCheckedChange={(checked) => {
                  setWantToSplitFlavors(checked as boolean);
                  if (!checked) {
                    setSelectedFlavors([]);
                  }
                }}
              />
              <label
                htmlFor="split-flavors"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                I want to split my order into different flavors (20+ wings only, minimum 10 pieces per flavor)
              </label>
            </div>
          )}

          {/* Split Flavor Selection */}
          {wantToSplitFlavors && canSplitFlavors && (
            <div className="border-4 border-primary bg-accent/10 p-4">
              <h3 className="font-heading text-lg mb-3 uppercase">Split Flavors:</h3>
              <p className="text-sm mb-4">
                Allocate your {totalPieces} wings into different flavors (minimum 10 pieces per flavor)
              </p>
              
              {selectedFlavors.map((sf, index) => (
                <div key={index} className="mb-3 p-3 bg-white border-2 border-black">
                  <div className="flex gap-2 mb-2">
                    <select
                      value={sf.flavor}
                      onChange={(e) => handleFlavorChange(index, e.target.value)}
                      className="flex-1 p-2 border-2 border-black font-heading"
                    >
                      {flavors.map((flavor) => (
                        <option key={flavor} value={flavor}>
                          {flavor}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      value={sf.pieces}
                      onChange={(e) => handlePiecesChange(index, parseInt(e.target.value) || 10)}
                      onFocus={(e) => e.target.select()}
                      min="10"
                      step="1"
                      className="w-24 p-2 border-2 border-black font-heading text-center"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveFlavor(index)}
                      className="border-2 border-black"
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}

              {remainingPieces >= 10 && (
                <Button
                  onClick={handleAddFlavor}
                  variant="outline"
                  className="w-full border-2 border-black"
                >
                  Add Flavor ({remainingPieces} pieces remaining)
                </Button>
              )}

              {selectedFlavors.length > 0 && remainingPieces > 0 && (
                <p className="text-sm text-red-600 mt-2">
                  ⚠️ You must allocate all {totalPieces} pieces before adding to cart
                </p>
              )}
            </div>
          )}

          {/* Sauce Preferences */}
          <div className="border-4 border-primary bg-accent/10 p-4">
            <h3 className="font-heading text-lg mb-3 uppercase">Sauce Preferences:</h3>
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3 rounded-lg border-2 border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
                <Checkbox
                  checked={extraSauce}
                  onCheckedChange={(checked) => {
                    setExtraSauce(checked as boolean);
                    if (checked) setEasySauce(false); // Deselect Easy Sauce if Extra Sauce is selected
                  }}
                  className="w-6 h-6"
                />
                <span className="text-sm font-medium text-gray-900">Extra Sauce</span>
              </label>
              <label className="flex items-center gap-3 p-3 rounded-lg border-2 border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
                <Checkbox
                  checked={easySauce}
                  onCheckedChange={(checked) => {
                    setEasySauce(checked as boolean);
                    if (checked) setExtraSauce(false); // Deselect Extra Sauce if Easy Sauce is selected
                  }}
                  className="w-6 h-6"
                />
                <span className="text-sm font-medium text-gray-900">Easy Sauce (Light Sauce)</span>
              </label>
            </div>
          </div>

          {/* Cooking Preferences */}
          <div className="border-4 border-primary bg-accent/10 p-4">
            <h3 className="font-heading text-lg mb-3 uppercase">Cooking Preferences:</h3>
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3 rounded-lg border-2 border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
                <Checkbox
                  checked={wellDone}
                  onCheckedChange={(checked) => {
                    setWellDone(checked as boolean);
                    if (checked) setExtraWellDone(false); // Deselect Extra Well Done if Well Done is selected
                  }}
                  className="w-6 h-6"
                />
                <span className="text-sm font-medium text-gray-900">Well Done</span>
              </label>
              <label className="flex items-center gap-3 p-3 rounded-lg border-2 border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
                <Checkbox
                  checked={extraWellDone}
                  onCheckedChange={(checked) => {
                    setExtraWellDone(checked as boolean);
                    if (checked) setWellDone(false); // Deselect Well Done if Extra Well Done is selected
                  }}
                  className="w-6 h-6"
                />
                <span className="text-sm font-medium text-gray-900">Extra Well Done</span>
              </label>
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
              placeholder="Any special instructions you would like us to do..."
              className="border-4 border-black min-h-[100px]"
            />
          </div>

          {/* Total and Add Button */}
          <div className="border-t-4 border-black pt-4">
            <div className="flex justify-between items-center mb-4">
              <span className="font-heading text-xl uppercase">Total:</span>
              <span className="font-heading text-2xl text-primary">
                ${selectedOption ? (parseFloat(selectedOption.price) * quantity).toFixed(2) : "0.00"}
              </span>
            </div>
            <Button
              onClick={handleAddToCart}
              className="w-full bg-accent hover:bg-accent/90 text-black font-heading text-xl py-6 border-4 border-black uppercase"
              disabled={!wantToSplitFlavors && !singleFlavor}
            >
              🛒 Add to Cart
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
