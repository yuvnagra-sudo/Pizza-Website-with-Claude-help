import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface FriesSizeDialogProps {
  open: boolean;
  onClose: () => void;
  sizes: { name: string; price: number }[];
  onAddToCart: (size: string, price: number, quantity: number) => void;
}

export function FriesSizeDialog({ open, onClose, sizes, onAddToCart }: FriesSizeDialogProps) {
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  const handleAdd = () => {
    if (!selectedSize) return;
    
    const sizeData = sizes.find((s) => s.name === selectedSize);
    if (!sizeData) return;

    onAddToCart(selectedSize, sizeData.price, quantity);
    
    // Reset state
    setSelectedSize(null);
    setQuantity(1);
  };

  const selectedSizeData = sizes.find((s) => s.name === selectedSize);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-md border-4 border-black brutal-shadow">
        <DialogHeader>
          <DialogTitle className="font-['Bebas_Neue'] text-3xl text-[var(--brand-blue)]">
            Select Fries Size
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Size Selection */}
          <div>
            <label className="font-['Bebas_Neue'] text-xl mb-3 block">Choose Size:</label>
            <div className="grid grid-cols-2 gap-3">
              {sizes.map((size) => (
                <button
                  key={size.name}
                  onClick={() => setSelectedSize(size.name)}
                  className={`p-4 border-4 border-black brutal-shadow transition-all ${
                    selectedSize === size.name
                      ? "bg-[var(--brand-yellow)] scale-105"
                      : "bg-white hover:bg-gray-100"
                  }`}
                >
                  <div className="font-['Bebas_Neue'] text-xl">{size.name}</div>
                  <div className="font-bold text-[var(--brand-blue)]">${size.price.toFixed(2)}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Quantity Selection */}
          {selectedSize && (
            <div>
              <label className="font-['Bebas_Neue'] text-xl mb-3 block">Quantity:</label>
              <div className="flex items-center gap-4">
                <Button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-12 h-12 text-2xl border-4 border-black brutal-shadow"
                >
                  -
                </Button>
                <span className="text-2xl font-bold w-12 text-center">{quantity}</span>
                <Button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-12 h-12 text-2xl border-4 border-black brutal-shadow"
                >
                  +
                </Button>
              </div>
            </div>
          )}

          {/* Total and Add Button */}
          {selectedSize && selectedSizeData && (
            <div className="border-t-4 border-black pt-4">
              <div className="flex justify-between items-center mb-4">
                <span className="font-['Bebas_Neue'] text-2xl">Total:</span>
                <span className="font-bold text-2xl text-[var(--brand-blue)]">
                  ${(selectedSizeData.price * quantity).toFixed(2)}
                </span>
              </div>
              <Button
                onClick={handleAdd}
                className="w-full bg-[var(--brand-blue)] text-white border-4 border-black brutal-shadow hover:bg-blue-700 font-['Bebas_Neue'] text-xl py-6"
              >
                Add to Cart
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
