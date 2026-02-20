import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Minus, Plus } from "lucide-react";

interface DrinkSize {
  name: string;
  price: number;
}

interface DrinkSelectionDialogProps {
  open: boolean;
  onClose: () => void;
  sizes: DrinkSize[];
  flavors: string[];
  onAddToCart: (flavor: string, size: string, price: number, quantity: number) => void;
}

export function DrinkSelectionDialog({
  open,
  onClose,
  sizes,
  flavors,
  onAddToCart,
}: DrinkSelectionDialogProps) {
  const [selectedSize, setSelectedSize] = useState<DrinkSize | null>(null);
  const [selectedFlavor, setSelectedFlavor] = useState("");
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (sizes.length > 0 && !selectedSize) {
      setSelectedSize(sizes[0]);
    }
  }, [sizes, selectedSize]);

  const handleAddToCart = () => {
    if (!selectedSize || !selectedFlavor) {
      alert("Please select both a drink flavor and size");
      return;
    }

    onAddToCart(selectedFlavor, selectedSize.name, selectedSize.price, quantity);
    
    // Reset and close
    setQuantity(1);
    setSelectedFlavor("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white border-4 border-black">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl text-primary uppercase">
            Select Your Drink
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Flavor Selection */}
          <div className="border-4 border-primary bg-accent/10 p-4">
            <h3 className="font-heading text-lg mb-3 uppercase">Choose Flavor:</h3>
            <select
              value={selectedFlavor}
              onChange={(e) => setSelectedFlavor(e.target.value)}
              className="w-full p-3 border-4 border-black font-heading text-lg"
            >
              <option value="">Select a drink...</option>
              {flavors.map((flavor) => (
                <option key={flavor} value={flavor}>
                  {flavor}
                </option>
              ))}
            </select>
          </div>

          {/* Size Selection */}
          <div>
            <h3 className="font-heading text-lg mb-3 uppercase">Select Size:</h3>
            <div className="space-y-2">
              {sizes.map((size) => (
                <button
                  key={size.name}
                  onClick={() => setSelectedSize(size)}
                  className={`w-full p-4 border-4 border-black font-heading text-lg flex justify-between items-center transition-all ${
                    selectedSize?.name === size.name
                      ? "bg-accent text-black"
                      : "bg-white hover:bg-gray-100"
                  }`}
                >
                  <span>{size.name}</span>
                  <span className="text-primary">${size.price.toFixed(2)}</span>
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
          </div>

          {/* Total and Add Button */}
          <div className="border-t-4 border-black pt-4">
            <div className="flex justify-between items-center mb-4">
              <span className="font-heading text-xl uppercase">Total:</span>
              <span className="font-heading text-2xl text-primary">
                ${selectedSize ? (selectedSize.price * quantity).toFixed(2) : "0.00"}
              </span>
            </div>
            <Button
              onClick={handleAddToCart}
              className="w-full bg-accent hover:bg-accent/90 text-black font-heading text-xl py-6 border-4 border-black uppercase"
              disabled={!selectedFlavor || !selectedSize}
            >
              🛒 Add to Cart
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
