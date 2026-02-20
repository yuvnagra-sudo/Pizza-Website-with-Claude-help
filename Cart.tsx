import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

export default function Cart() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const utils = trpc.useUtils();
  
  const { data: cartData, isLoading } = trpc.cart.get.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const updateCartMutation = trpc.cart.update.useMutation({
    onSuccess: () => {
      utils.cart.get.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update cart");
    },
  });

  const removeFromCartMutation = trpc.cart.remove.useMutation({
    onSuccess: () => {
      utils.cart.get.invalidate();
      toast.success("Item removed from cart");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to remove item");
    },
  });

  const clearCartMutation = trpc.cart.clear.useMutation({
    onSuccess: () => {
      utils.cart.get.invalidate();
      toast.success("Cart cleared");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to clear cart");
    },
  });

  const handleUpdateQuantity = (id: number, currentQuantity: number, delta: number) => {
    const newQuantity = currentQuantity + delta;
    if (newQuantity < 1) return;
    
    updateCartMutation.mutate({ id, quantity: newQuantity });
  };

  const handleRemoveItem = (id: number) => {
    removeFromCartMutation.mutate({ id });
  };

  const handleClearCart = () => {
    if (confirm("Are you sure you want to clear your cart?")) {
      clearCartMutation.mutate();
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }

  const cartItems = cartData?.items || [];
  const subtotal = cartData?.total || 0;
  const tax = subtotal * 0.05; // 5% GST
  const total = subtotal + tax;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 py-12">
        <div className="container">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
              <h1 className="text-4xl font-bold">Shopping Cart</h1>
              {cartItems.length > 0 && (
                <Button variant="outline" onClick={handleClearCart}>
                  Clear Cart
                </Button>
              )}
            </div>

            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : cartItems.length === 0 ? (
              <Card className="elegant-shadow">
                <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
                  <ShoppingBag className="h-16 w-16 text-muted-foreground" />
                  <p className="text-lg text-muted-foreground">Your cart is empty</p>
                  <Button asChild>
                    <Link href="/menu">
                      <a>Browse Menu</a>
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="space-y-4">
                  {cartItems.map((item) => (
                    <Card key={item.id} className="elegant-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="flex-1 space-y-2">
                            <h3 className="text-lg font-semibold">{item.menuItemName}</h3>
                            
                            {/* Category badges */}
                            <div className="flex flex-wrap gap-2">
                              {item.size && (
                                <span className="inline-block bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-0.5 rounded">
                                  {(() => {
                                    // Only add inch symbol for pizza items
                                    const isPizza = item.itemType === 'pizza' || item.menuItemCategory === 'pizza';
                                    if (isPizza) {
                                      return item.size.includes('"') ? item.size : `${item.size}"`;
                                    }
                                    // For non-pizza items, remove inch symbol if present
                                    return item.size.replace('"', '');
                                  })()}
                                </span>
                              )}
                              {/* Show Classic Combo badge */}
                              {item.notes?.includes('[Classic Combo') && (
                                <span className="inline-block bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded">CLASSIC COMBO</span>
                              )}
                              {/* Show category badge */}
                              {(item.itemType || item.menuItemCategory) && (
                                <span className="inline-block bg-blue-100 text-blue-800 text-xs font-bold px-2 py-0.5 rounded">
                                  {(() => {
                                    const type = item.itemType || item.menuItemCategory;
                                    // Map to CSV Title Card names
                                    if (type === 'pizza') return 'Pizza';
                                    if (type === 'wings') return 'Wings';
                                    if (type === 'sides') return 'Side';
                                    if (type === 'dips') return 'Dip';
                                    if (type === 'drinks') return 'Drinks';
                                    return type;
                                  })()}
                                </span>
                              )}
                              {/* Show gluten-free tag if item is gluten-free */}
                              {item.menuItemName?.toLowerCase().includes('gluten') && (
                                <span className="inline-block bg-purple-100 text-purple-800 text-xs font-bold px-2 py-0.5 rounded">GLUTEN-FREE</span>
                              )}
                              {/* Show wing flavor if present */}
                              {item.notes && !item.notes.includes('[Classic Combo') && item.itemType === 'wings' && (
                                <span className="inline-block bg-orange-100 text-orange-800 text-xs font-bold px-2 py-0.5 rounded">
                                  {item.notes.replace(/Split: /g, '').replace(/ \/ /g, '/')}
                                </span>
                              )}
                            </div>
                            
                            {item.menuItemDescription && (
                              <p className="text-sm text-muted-foreground">{item.menuItemDescription}</p>
                            )}
                            {item.notes && !item.notes.includes('[Classic Combo') && item.itemType !== 'wings' && (
                              <p className="text-sm text-muted-foreground">Notes: {item.notes}</p>
                            )}
                          </div>
                          
                          <div className="flex flex-col items-end gap-3">
                            <p className="text-lg font-bold text-primary">
                              ${(parseFloat(item.price?.toString() || "0") * item.quantity).toFixed(2)}
                            </p>
                            
                            <div className="flex items-center gap-2">
                              <Button
                                size="icon"
                                variant="outline"
                                onClick={() => handleUpdateQuantity(item.id, item.quantity, -1)}
                                disabled={updateCartMutation.isPending || item.quantity <= 1}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <span className="w-8 text-center font-medium">{item.quantity}</span>
                              <Button
                                size="icon"
                                variant="outline"
                                onClick={() => handleUpdateQuantity(item.id, item.quantity, 1)}
                                disabled={updateCartMutation.isPending}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                            
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleRemoveItem(item.id)}
                              disabled={removeFromCartMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Remove
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <Card className="elegant-shadow-lg">
                  <CardHeader>
                    <CardTitle>Order Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal</span>
                      <span className="font-medium">${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>GST (5%)</span>
                      <span className="font-medium">${tax.toFixed(2)}</span>
                    </div>
                    <div className="border-t pt-3 flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span className="text-primary">${total.toFixed(2)}</span>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button asChild className="w-full" size="lg">
                      <Link href="/checkout">
                        <a>Proceed to Checkout</a>
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
