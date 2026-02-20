import { useState, useEffect, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ShoppingCart, MapPin, Phone, FileText, Mail, User, Truck, Store, CreditCard, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { DrinkSelectionDialog } from "@/components/DrinkSelectionDialog";
import { AddressAutocomplete } from "@/components/AddressAutocomplete";
import { FriesSizeDialog } from "@/components/FriesSizeDialog";
import { DippingSauceDialog } from "@/components/DippingSauceDialog";

type OrderType = "pickup" | "delivery";
type PaymentMethod = "debit" | "credit_visa" | "credit_mastercard" | "cash" | "etransfer";

export default function Checkout() {
  const [, navigate] = useLocation();
  const { isAuthenticated, loading: authLoading } = useAuth();
  
  // Load menu_data.json for drinks structure
  const [menuJsonData, setMenuJsonData] = useState<any>(null);
  useEffect(() => {
    fetch('/menu_data.json')
      .then(res => {
        if (!res.ok) throw new Error(`Failed to load menu data (${res.status})`);
        return res.json();
      })
      .then(data => setMenuJsonData(data))
      .catch(err => {
        console.error('Error loading menu data:', err);
        toast.error("Could not load quick-add items. Refresh the page to try again.");
      });
  }, []);
  
  // Order type selection
  const [orderType, setOrderType] = useState<OrderType | null>(null);
  
  // Common fields
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [customerName, setCustomerName] = useState("");
  
  // Delivery-specific fields
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  
  // Pickup-specific fields
  const [scheduledPickupTime, setScheduledPickupTime] = useState<string>("");
  
  // Calculate minimum pickup time once (current time, no additional buffer)
  const minPickupTime = useMemo(() => {
    return new Date().toISOString().slice(0, 16);
  }, []);

  // Business hours validation (Mountain Time)
  const validateBusinessHours = (timeString: string): { valid: boolean; message?: string; nextAvailable?: string } => {
    // The datetime-local input value is in local browser time (UTC in our case)
    // We need to interpret this as Mountain Time for validation
    const selectedTime = new Date(timeString);
    // Since browser is in UTC but user thinks they're selecting MT, treat the input AS Mountain Time
    const selectedMT = selectedTime;
    
    const day = selectedMT.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const hours = selectedMT.getHours();
    const minutes = selectedMT.getMinutes();
    const timeInMinutes = hours * 60 + minutes;
    
    // Define business hours in Mountain Time
    let openTime: number;
    let closeTime: number;
    let dayName: string;
    
    if (day === 0) { // Sunday
      openTime = 16 * 60; // 4:00 PM
      closeTime = 22 * 60; // 10:00 PM
      dayName = "Sunday";
    } else if (day >= 1 && day <= 4) { // Monday - Thursday
      openTime = 11 * 60; // 11:00 AM
      closeTime = 22 * 60; // 10:00 PM
      dayName = ["Monday", "Tuesday", "Wednesday", "Thursday"][day - 1];
    } else { // Friday - Saturday
      openTime = 11 * 60; // 11:00 AM
      closeTime = 24 * 60; // 12:00 AM (midnight)
      dayName = day === 5 ? "Friday" : "Saturday";
    }
    
    // Check if selected time is within business hours
    if (timeInMinutes < openTime || timeInMinutes >= closeTime) {
      const openHour = Math.floor(openTime / 60);
      const openMin = openTime % 60;
      const closeHour = Math.floor(closeTime / 60);
      const closeMin = closeTime % 60;
      
      const formatTime = (h: number, m: number) => {
        const period = h >= 12 ? "PM" : "AM";
        const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
        return `${hour12}:${m.toString().padStart(2, '0')} ${period}`;
      };
      
      // Calculate next available time
      let nextAvailableMT: Date;
      if (timeInMinutes < openTime) {
        // Before opening - suggest opening time today
        nextAvailableMT = new Date(selectedMT);
        nextAvailableMT.setHours(Math.floor(openTime / 60), openTime % 60, 0, 0);
      } else {
        // After closing - suggest opening time next day
        nextAvailableMT = new Date(selectedMT);
        nextAvailableMT.setDate(nextAvailableMT.getDate() + 1);
        const nextDay = nextAvailableMT.getDay();
        const nextOpenTime = nextDay === 0 ? 16 * 60 : 11 * 60;
        nextAvailableMT.setHours(Math.floor(nextOpenTime / 60), nextOpenTime % 60, 0, 0);
      }
      
      // Next available time is already in the format we need (treated as MT)
      const nextAvailableUTC = nextAvailableMT;
      
      return {
        valid: false,
        message: `We're closed at that time. ${dayName} hours: ${formatTime(openHour, openMin)} - ${formatTime(closeHour, closeMin)}`,
        nextAvailable: nextAvailableUTC.toISOString().slice(0, 16)
      };
    }
    
    return { valid: true };
  };
  
  // Optional fields
  const [orderNotes, setOrderNotes] = useState("");

  const utils = trpc.useUtils();
  const { data: cartData, isLoading: cartLoading } = trpc.cart.get.useQuery();
  const removeMutation = trpc.cart.remove.useMutation({
    onSuccess: () => {
      utils.cart.get.invalidate();
      toast.success("Item removed from cart");
    },
  });
  const createOrderMutation = trpc.orders.create.useMutation({
    onSuccess: (data) => {
      // Invalidate cart immediately so UI updates instantly
      utils.cart.get.invalidate();
      toast.success("Order placed successfully!");
      navigate(`/order-confirmation/${data.orderId}`);
      window.scrollTo(0, 0);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to place order");
    },
  });

  // Redirect to login if not authenticated
  if (!authLoading && !isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }

  const items = cartData?.items || [];
  
  // Check if cart contains Walk-in Special items
  const hasWalkinSpecial = items.some(item => {
    try {
      const custom = JSON.parse(item.customizations || '{}');
      return custom.dealType === 'walkin-special';
    } catch (e) {
      return false;
    }
  });
  
  const subtotal = items.reduce((sum, item) => {
    const price = parseFloat(item.price?.toString() || "0");
    return sum + price * item.quantity;
  }, 0);
  
  // Add $5 delivery charge for Airdrie orders
  const deliveryCharge = orderType === "delivery" && deliveryAddress.toLowerCase().includes("airdrie") ? 5.00 : 0;
  
  const tax = (subtotal + deliveryCharge) * 0.05; // 5% GST on subtotal + delivery
  const total = subtotal + deliveryCharge + tax;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!orderType) {
      toast.error("Please select pickup or delivery");
      return;
    }

    if (!phoneNumber.trim()) {
      toast.error("Please enter a phone number");
      return;
    }

    if (!email.trim()) {
      toast.error("Please enter an email address");
      return;
    }

    if (!customerName.trim()) {
      toast.error("Please enter your name");
      return;
    }

    if (orderType === "delivery") {
      if (!deliveryAddress.trim()) {
        toast.error("Please enter a delivery address");
        return;
      }

      if (!paymentMethod) {
        toast.error("Please select a payment method");
        return;
      }
    }

    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    // Validate business hours for scheduled pickup
    if (orderType === "pickup" && scheduledPickupTime) {
      const validation = validateBusinessHours(scheduledPickupTime);
      if (!validation.valid) {
        toast.error(validation.message || "Selected time is outside business hours");
        if (validation.nextAvailable) {
          setScheduledPickupTime(validation.nextAvailable);
          toast.info("Time updated to next available slot");
        }
        return;
      }
    }

    createOrderMutation.mutate({
      orderType,
      phoneNumber: phoneNumber.trim(),
      email: email.trim(),
      customerName: customerName.trim(),
      deliveryAddress: orderType === "delivery" ? deliveryAddress.trim() : undefined,
      additionalInfo: orderType === "delivery" ? additionalInfo.trim() || undefined : undefined,
      paymentMethod: orderType === "delivery" && paymentMethod ? paymentMethod : undefined,
      scheduledPickupTime: orderType === "pickup" && scheduledPickupTime
        ? new Date(scheduledPickupTime).toISOString()
        : undefined,
      orderNotes: orderNotes.trim() || undefined,
    });
  };

  if (cartLoading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl font-bold">Loading...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center py-12">
        <Helmet>
          <title>Checkout - Johnny's Pizza & Wings</title>
        </Helmet>
        <ShoppingCart className="w-24 h-24 text-gray-300 mb-6" />
        <h1 className="font-['Bebas_Neue'] text-4xl text-[var(--brand-blue)] mb-4">
          Your Cart is Empty
        </h1>
        <p className="text-xl mb-8">Add some items to your cart before checking out!</p>
        <Button
          onClick={() => {
            navigate("/menu");
            window.scrollTo(0, 0);
          }}
          className="bg-[var(--brand-yellow)] text-black font-['Bebas_Neue'] text-2xl px-8 py-6 border-4 border-black snap-grow"
        >
          Browse Menu
        </Button>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Checkout - Johnny's Pizza & Wings</title>
      </Helmet>
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto max-w-7xl">
          <h1 className="font-['Bebas_Neue'] text-5xl text-[var(--brand-blue)] mb-8 text-center">
            Checkout
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Top Left: Order Summary */}
            <div className="lg:col-span-1 order-1">
              <div className="bg-white border-6 border-black p-8">
                <h2 className="font-['Bebas_Neue'] text-3xl text-[var(--brand-blue)] mb-6">
                  Order Summary
                </h2>

                <div className="space-y-4 mb-6">
                  {items.map((item) => {
                    // Parse customizations if they exist
                    let customizationsData: any = null;
                    let customizations: any[] = [];
                    try {
                      if (item.customizations) {
                        customizationsData = JSON.parse(item.customizations as string);
                        // For backward compatibility, check if it's an array
                        if (Array.isArray(customizationsData)) {
                          customizations = customizationsData;
                        } else if (customizationsData?.toppingModifications) {
                          // New structure: extract toppingModifications
                          customizations = customizationsData.toppingModifications;
                        }
                      }
                    } catch (e) {
                      console.error("Failed to parse customizations:", e);
                    }

                    const isHalfAndHalf = customizationsData?.isHalfAndHalf;
                    const leftPizzaName = customizationsData?.leftHalf?.basePizzaName;
                    const rightPizzaName = customizationsData?.rightHalf?.basePizzaName;
                    const isWalkinSpecial = customizationsData?.dealType === 'walkin-special';
                    const walkinTopping = customizationsData?.topping;

                    return (
                      <div key={item.id} className="border-b-2 border-gray-200 pb-4">
                        <div className="flex justify-between items-start mb-1">
                          <div className="flex-1 mr-2">
                            <p className="font-bold">
                              {isHalfAndHalf && leftPizzaName && rightPizzaName
                                ? `${leftPizzaName} & ${rightPizzaName}`
                                : item.menuItemName || 'Unknown Item'}
                            </p>
                            {/* Show special type as subtitle (only for Walk-in Special) */}
                            {isWalkinSpecial && (
                              <p className="text-sm text-gray-600 font-medium mt-1">
                                Walk-in Special
                              </p>
                            )}
                            {isWalkinSpecial && walkinTopping && (
                              <p className="text-sm text-gray-600 mt-1">
                                <span className="font-semibold">Topping:</span> {walkinTopping}
                              </p>
                            )}
                            <div className="flex gap-2 items-center flex-wrap">
                              {isHalfAndHalf && (
                                <span className="inline-block bg-purple-500 text-white text-xs font-bold px-2 py-0.5 rounded">HALF & HALF</span>
                              )}
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
                              {/* Show category badge (use itemType for wings) */}
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
                              {/* Extract and show flavor for wings */}
                              {(() => {
                                const flavorMatch = item.notes?.match(/Flavor: ([^[]+)/);
                                if (flavorMatch) {
                                  return (
                                    <span className="inline-block bg-orange-100 text-orange-800 text-xs font-bold px-2 py-0.5 rounded">
                                      {flavorMatch[1].trim()}
                                    </span>
                                  );
                                }
                                // Check for split flavor (e.g., "10 pcs Plain, 10 pcs Lemon Pepper")
                                const splitFlavorMatch = item.notes?.match(/(\d+) pcs ([^,]+), (\d+) pcs ([^[]+)/);
                                if (splitFlavorMatch) {
                                  return (
                                    <span className="inline-block bg-orange-100 text-orange-800 text-xs font-bold px-2 py-0.5 rounded">
                                      SPLIT: {splitFlavorMatch[2].trim()} / {splitFlavorMatch[4].trim()}
                                    </span>
                                  );
                                }
                              })()}
                            </div>
                            
                            {/* Display half-and-half toppings */}
                            {isHalfAndHalf && customizationsData.leftHalf && customizationsData.rightHalf && (
                              <div className="text-sm text-gray-600 mt-2 space-y-1">
                                <div>
                                  <p className="font-semibold text-purple-700">🍕 Left: {customizationsData.leftHalf.basePizzaName}</p>
                                  <p className="text-xs pl-4">{customizationsData.leftHalf.defaultToppings.join(', ')}</p>
                                  {customizationsData.leftHalf.toppingModifications?.length > 0 && (
                                    <div className="text-xs pl-4 mt-1 space-y-0.5">
                                      {customizationsData.leftHalf.toppingModifications.map((mod: any, idx: number) => (
                                        <p key={idx} className="text-purple-600 font-medium">
                                          {mod.type === "add" && `+ ${mod.toppingName}`}
                                          {mod.type === "remove" && `- ${mod.toppingName}`}
                                          {mod.type === "replace" && `${mod.replacedToppingName} → ${mod.toppingName}`}
                                        </p>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <p className="font-semibold text-purple-700">🍕 Right: {customizationsData.rightHalf.basePizzaName}</p>
                                  <p className="text-xs pl-4">{customizationsData.rightHalf.defaultToppings.join(', ')}</p>
                                  {customizationsData.rightHalf.toppingModifications?.length > 0 && (
                                    <div className="text-xs pl-4 mt-1 space-y-0.5">
                                      {customizationsData.rightHalf.toppingModifications.map((mod: any, idx: number) => (
                                        <p key={idx} className="text-purple-600 font-medium">
                                          {mod.type === "add" && `+ ${mod.toppingName}`}
                                          {mod.type === "remove" && `- ${mod.toppingName}`}
                                          {mod.type === "replace" && `${mod.replacedToppingName} → ${mod.toppingName}`}
                                        </p>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                            
                            {/* Display topping modifications for regular pizzas */}
                            {!isHalfAndHalf && customizations.length > 0 && (
                              <div className="text-sm text-gray-600 mt-1">
                                {customizations.map((mod: any, idx: number) => {
                                  if (mod.type === "remove") {
                                    return (
                                      <div key={idx} className="text-red-600">
                                        - {mod.toppingName} <span className="text-green-600 font-semibold">FREE</span>
                                      </div>
                                    );
                                  } else if (mod.type === "add") {
                                    const price = parseFloat(mod.additionalCharge || "0");
                                    return (
                                      <div key={idx} className="text-blue-600">
                                        + {mod.toppingName} {price > 0 ? `+$${price.toFixed(2)}` : <span className="text-green-600 font-semibold">FREE</span>}
                                      </div>
                                    );
                                  } else if (mod.type === "replace") {
                                    const price = parseFloat(mod.additionalCharge || "0");
                                    return (
                                      <div key={idx} className="text-purple-600">
                                        {mod.replacedToppingName} → {mod.toppingName} {price > 0 ? `+$${price.toFixed(2)}` : <span className="text-green-600 font-semibold">FREE</span>}
                                      </div>
                                    );
                                  }
                                  return null;
                                })}
                              </div>
                            )}
                            
                            {/* Display cooking preferences */}
                            {customizationsData?.cookingPreferences && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {customizationsData.cookingPreferences.extraSauce && (
                                  <span className="bg-primary text-white text-xs px-2 py-0.5 rounded">Extra Sauce</span>
                                )}
                                {customizationsData.cookingPreferences.easySauce && (
                                  <span className="bg-primary text-white text-xs px-2 py-0.5 rounded">Easy Sauce</span>
                                )}
                                {customizationsData.cookingPreferences.wellDone && (
                                  <span className="bg-primary text-white text-xs px-2 py-0.5 rounded">Well Done</span>
                                )}
                                {customizationsData.cookingPreferences.extraWellDone && (
                                  <span className="bg-primary text-white text-xs px-2 py-0.5 rounded">Extra Well Done</span>
                                )}
                              </div>
                            )}
                            
                            {item.notes && (
                              <p className="text-sm text-gray-600 italic">Note: {item.notes}</p>
                            )}
                          </div>
                          <div className="flex items-start gap-2">
                            <p className="font-bold">
                              ${(parseFloat(item.price?.toString() || "0") * item.quantity).toFixed(2)}
                            </p>
                            <button
                              onClick={() => removeMutation.mutate({ id: item.id })}
                              className="text-red-600 hover:text-red-800 p-1"
                              disabled={removeMutation.isPending}
                              title="Remove item"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                      </div>
                    );
                  })}
                </div>

                <div className="space-y-2 border-t-4 border-black pt-4">
                  <div className="flex justify-between text-lg">
                    <span>Subtotal:</span>
                    <span className="font-bold">${subtotal.toFixed(2)}</span>
                  </div>
                  {deliveryCharge > 0 && (
                    <div className="flex justify-between text-lg">
                      <span>Delivery Charge:</span>
                      <span className="font-bold">${deliveryCharge.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg">
                    <span>GST (5%):</span>
                    <span className="font-bold">${tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-2xl font-['Bebas_Neue'] pt-2 border-t-2 border-gray-300">
                    <span>Total:</span>
                    <span className="text-[var(--brand-blue)]">${total.toFixed(2)}</span>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-[var(--brand-yellow)] border-4 border-black">
                  <p className="text-sm font-bold text-center">
                    🚚 Estimated Delivery: 30-45 minutes
                  </p>
                </div>
              </div>
            </div>

            {/* Top Right: Quick Add Recommendations (moves below form on mobile) */}
            <div className="lg:col-span-1 order-3 lg:order-2">
              <div className="bg-[var(--brand-blue)] text-white p-8 border-6 border-black">
                <h2 className="font-['Bebas_Neue'] text-3xl text-center mb-6">
                  🍽️ Don't Forget To Add!
                </h2>
                <p className="text-center mb-6 text-lg">
                  Complete your meal with these popular sides:
                </p>
                
                <div className="grid grid-cols-1 gap-4">
                  <QuickAddItem name="Bread Sticks" price="6.99" menuJsonData={menuJsonData} />
                  <QuickAddItem name="Curly Fries" price="5.99" menuJsonData={menuJsonData} />
                  <QuickAddItem name="Drinks" price="1.49" menuJsonData={menuJsonData} />
                  <QuickAddItem name="Dipping Sauces" price="1.19" menuJsonData={menuJsonData} />
                </div>
              </div>
            </div>

            {/* Bottom: Customer Information (promoted to order-2 on mobile so form comes before quick-add) */}
            <div className="lg:col-span-2 order-2 lg:order-3 bg-white border-6 border-black p-8">
              <h2 className="font-['Bebas_Neue'] text-3xl text-[var(--brand-blue)] mb-6">
                Order Information
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Order Type Selection */}
                {!orderType ? (
                  <div className="space-y-4">
                    <p className="font-['Bebas_Neue'] text-xl mb-4">How would you like to receive your order?</p>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setOrderType("pickup")}
                        className="p-6 border-4 border-black hover:bg-[var(--brand-yellow)] transition-colors flex flex-col items-center gap-2"
                      >
                        <Store className="w-12 h-12" />
                        <span className="font-['Bebas_Neue'] text-2xl">Pickup</span>
                      </button>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              onClick={() => {
                                if (hasWalkinSpecial) {
                                  toast.error("Walk-in Special must be picked up in-store. Please select Pickup or remove Walk-in Special from your cart.");
                                } else {
                                  setOrderType("delivery");
                                }
                              }}
                              disabled={hasWalkinSpecial}
                              className={`p-6 border-4 border-black hover:bg-[var(--brand-yellow)] transition-colors flex flex-col items-center gap-2 ${hasWalkinSpecial ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              <Truck className="w-12 h-12" />
                              <span className="font-['Bebas_Neue'] text-2xl">Delivery</span>
                            </button>
                          </TooltipTrigger>
                          {hasWalkinSpecial && (
                            <TooltipContent>
                              <p>Walk-in specials are only allowed for pickup orders</p>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Show selected order type with change button */}
                    <div className="p-4 bg-[var(--brand-yellow)] border-4 border-black flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {orderType === "pickup" ? <Store className="w-6 h-6" /> : <Truck className="w-6 h-6" />}
                        <span className="font-['Bebas_Neue'] text-xl">
                          {orderType === "pickup" ? "Pickup Order" : "Delivery Order"}
                        </span>
                      </div>
                      <Button
                        type="button"
                        onClick={() => setOrderType(null)}
                        variant="outline"
                        className="border-2 border-black"
                      >
                        Change
                      </Button>
                    </div>

                    {/* Common Fields */}
                    <div>
                      <label className="flex items-center gap-2 font-['Bebas_Neue'] text-xl mb-2">
                        <User className="w-5 h-5" />
                        Your Name *
                      </label>
                      <Input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="e.g., John Smith"
                        required
                        className="border-4 border-black"
                      />
                    </div>

                    <div>
                      <label className="flex items-center gap-2 font-['Bebas_Neue'] text-xl mb-2">
                        <Phone className="w-5 h-5" />
                        Phone Number *
                      </label>
                      <Input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="e.g., 403-948-2020"
                        required
                        className="border-4 border-black"
                      />
                      <p className="text-sm text-gray-600 mt-2">
                        We'll call if we have questions about your order
                      </p>
                    </div>

                    <div>
                      <label className="flex items-center gap-2 font-['Bebas_Neue'] text-xl mb-2">
                        <Mail className="w-5 h-5" />
                        Email Address *
                      </label>
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g., john@example.com"
                        required
                        className="border-4 border-black"
                      />
                      <p className="text-sm text-gray-600 mt-2">
                        We'll send your order confirmation here
                      </p>
                    </div>

                    {/* Delivery-Specific Fields */}
                    {orderType === "delivery" && (
                      <>
                        <div>
                          <label className="flex items-center gap-2 font-['Bebas_Neue'] text-xl mb-2">
                            <MapPin className="w-5 h-5" />
                            Delivery Address *
                          </label>
                          <AddressAutocomplete
                            value={deliveryAddress}
                            onChange={setDeliveryAddress}
                            placeholder="Enter your full delivery address..."
                            required
                            className="w-full border-4 border-black rounded-md p-3 font-['Roboto']"
                          />
                          <p className="text-sm text-gray-600 mt-2">
                            Include street, city, and postal code
                          </p>
                        </div>

                        <div>
                          <label className="flex items-center gap-2 font-['Bebas_Neue'] text-xl mb-2">
                            <FileText className="w-5 h-5" />
                            Additional Information
                          </label>
                          <Textarea
                            value={additionalInfo}
                            onChange={(e) => setAdditionalInfo(e.target.value)}
                            placeholder="Apt number, buzz code, 'use side door', backyard, etc."
                            className="border-4 border-black"
                          />
                        </div>

                        <div>
                          <label className="flex items-center gap-2 font-['Bebas_Neue'] text-xl mb-2">
                            <CreditCard className="w-5 h-5" />
                            Payment Method *
                          </label>
                          <div className="grid grid-cols-2 gap-3">
                            {[
                              { value: "debit", label: "Debit" },
                              { value: "credit_visa", label: "Visa" },
                              { value: "credit_mastercard", label: "Mastercard" },
                              { value: "cash", label: "Cash" },
                              { value: "etransfer", label: "E-transfer" },
                            ].map((method) => (
                              <button
                                key={method.value}
                                type="button"
                                onClick={() => setPaymentMethod(method.value as PaymentMethod)}
                                className={`p-3 border-4 border-black hover:bg-[var(--brand-yellow)] transition-colors ${
                                  paymentMethod === method.value ? "bg-[var(--brand-yellow)]" : "bg-white"
                                } ${method.value === "etransfer" ? "col-span-2" : ""}`}
                              >
                                <span className="font-bold">{method.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </>
                    )}

                    {/* Pickup-Specific Fields */}
                    {orderType === "pickup" && (
                      <div>
                        <label className="flex items-center gap-2 font-['Bebas_Neue'] text-xl mb-2">
                          <FileText className="w-5 h-5" />
                          Scheduled Pickup Time (Optional)
                        </label>
                        <Input
                          type="datetime-local"
                          value={scheduledPickupTime}
                          onChange={(e) => setScheduledPickupTime(e.target.value)}
                          min={minPickupTime}
                          className="border-4 border-black"
                        />
                        <p className="text-sm text-gray-600 mt-2">
                          Leave blank for ASAP pickup (30-45 minutes)
                        </p>
                        <div className="text-sm text-gray-700 mt-2 p-3 bg-blue-50 border-2 border-blue-200 rounded">
                          <p className="font-semibold mb-1">📅 Business Hours (Mountain Time):</p>
                          <p>• Mon-Thu: 11:00 AM - 10:00 PM</p>
                          <p>• Fri-Sat: 11:00 AM - 12:00 AM</p>
                          <p>• Sunday: 4:00 PM - 10:00 PM</p>
                        </div>
                      </div>
                    )}

                    {/* Order Notes */}
                    <div>
                      <label className="flex items-center gap-2 font-['Bebas_Neue'] text-xl mb-2">
                        <FileText className="w-5 h-5" />
                        Special Instructions (Optional)
                      </label>
                      <Textarea
                        value={orderNotes}
                        onChange={(e) => setOrderNotes(e.target.value)}
                        placeholder="e.g., Extra napkins, ring doorbell, leave at door, etc."
                        className="border-4 border-black"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={createOrderMutation.isPending}
                      className="w-full bg-[var(--brand-yellow)] text-black font-['Bebas_Neue'] text-2xl py-6 border-4 border-black snap-grow hover:bg-yellow-400"
                    >
                      {createOrderMutation.isPending ? "Placing Order..." : "Place Order"}
                    </Button>
                  </>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// QuickAddItem component
function QuickAddItem({ name, price, menuJsonData }: { name: string; price: string; menuJsonData: any }) {
  const utils = trpc.useUtils();
  const [drinkDialogOpen, setDrinkDialogOpen] = useState(false);
  const [friesDialogOpen, setFriesDialogOpen] = useState(false);
  const [dipDialogOpen, setDipDialogOpen] = useState(false);
  
  const { data: menuData } = trpc.menu.list.useQuery();
  const addToCartMutation = trpc.cart.add.useMutation({
    onSuccess: () => {
      toast.success(`${name} added to cart!`);
      utils.cart.get.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to add item");
    },
  });

  const handleQuickAdd = () => {
    if (name === "Drinks") {
      setDrinkDialogOpen(true);
      return;
    }
    if (name === "Curly Fries") {
      setFriesDialogOpen(true);
      return;
    }
    if (name.includes("Ranch") || name.includes("Dip")) {
      setDipDialogOpen(true);
      return;
    }

    const menuItems = menuData || [];
    const item = menuItems.find((i) => i?.name === name);

    if (!item) {
      toast.error(`${name} not found in menu`);
      return;
    }

    // Get the first available price for this item
    const itemPrice = item.prices?.[0];

    if (!itemPrice) {
      toast.error(`Price not found for ${name}`);
      return;
    }

    addToCartMutation.mutate({
      menuItemId: item.id,
      size: itemPrice.size,
      quantity: 1,
      price: parseFloat(itemPrice.price),
      itemType: "sides",
    });
  };

  // Prepare drink data from menu_data.json
  const drinkFlavors = menuJsonData?.wings_sides?.sides?.drinks?.flavors || [];
  const drinkSizes = menuJsonData?.wings_sides?.sides?.drinks?.sizes || [];

  const handleDrinkAddToCart = (flavor: string, size: string, price: number, quantity: number) => {
    const menuItems = menuData || [];
    const item = menuItems.find((i) => i?.name === flavor && i?.category === "drinks");

    if (!item) {
      toast.error(`${flavor} not found in menu`);
      return;
    }

    const itemPrice = item.prices.find((p) => p.size === size);

    if (!itemPrice) {
      toast.error(`Price not found for ${flavor} (${size})`);
      return;
    }

    addToCartMutation.mutate({
      menuItemId: item.id,
      size: itemPrice.size,
      quantity,
      price: parseFloat(itemPrice.price),
      itemType: "drinks",
    });

    utils.cart.get.invalidate();
    setDrinkDialogOpen(false);
    toast.success(`${quantity}x ${flavor} (${size}) added to cart!`);
  };

  // Prepare fries data
  const friesItems = (menuData || []).filter((i) => i?.name === "Curly Fries");
  const friesSizes = friesItems.flatMap((item) =>
    item?.prices?.map((p) => ({ name: p.size, price: parseFloat(p.price) })) || []
  );

  const handleFriesAddToCart = (size: string, price: number, quantity: number) => {
    const menuItems = menuData || [];
    const item = menuItems.find((i) => i?.name === "Curly Fries");

    if (!item) {
      toast.error("Curly Fries not found in menu");
      return;
    }

    const itemPrice = item.prices.find((p) => p.size === size);

    if (!itemPrice) {
      toast.error(`Price not found for Curly Fries (${size})`);
      return;
    }

    addToCartMutation.mutate({
      menuItemId: item.id,
      size: itemPrice.size,
      quantity,
      price: parseFloat(itemPrice.price),
      itemType: "sides",
    });

    utils.cart.get.invalidate();
    setFriesDialogOpen(false);
    toast.success(`${quantity}x Curly Fries (${size}) added to cart!`);
  };

  // Prepare dipping sauce data (exclude GF duplicates since all sauces are naturally GF)
  const dipItems = (menuData || []).filter((i) => 
    i?.category === "sides" && 
    (i?.name?.includes("Ranch") || i?.name?.includes("Dip") || i?.name?.includes("Sauce")) &&
    !i?.name?.includes("(GF)") // Exclude GF-labeled duplicates
  );
  const dipSauces = dipItems.map((item) => ({
    name: item?.name || "",
    price: parseFloat(item?.prices?.[0]?.price || "0"),
  })).filter((d) => d.name);

  const handleDipAddToCart = (sauce: string, price: number, quantity: number) => {
    const menuItems = menuData || [];
    const item = menuItems.find((i) => i?.name === sauce && i?.category === "sides");

    if (!item) {
      toast.error(`${sauce} not found in menu`);
      return;
    }

    const itemPrice = item.prices?.[0];

    if (!itemPrice) {
      toast.error(`Price not found for ${sauce}`);
      return;
    }

    addToCartMutation.mutate({
      menuItemId: item.id,
      size: '44mL',
      quantity,
      price: parseFloat(itemPrice.price),
      itemType: "dips",
    });

    utils.cart.get.invalidate();
    setDipDialogOpen(false);
    toast.success(`${quantity}x ${sauce} added to cart!`);
  };

  return (
    <>
      <div className="bg-[var(--brand-yellow)] text-black p-4 border-4 border-black">
        <div className="flex items-center justify-between mb-2">
          <span className="font-['Bebas_Neue'] text-2xl">{name}</span>
          <span className="font-bold text-xl text-[var(--brand-blue)]">${price}</span>
        </div>
        <Button
          onClick={handleQuickAdd}
          disabled={addToCartMutation.isPending}
          className="w-full bg-white text-black border-2 border-black hover:bg-gray-100"
        >
          + Add
        </Button>
      </div>

      {name === "Drinks" && (
        <DrinkSelectionDialog
          open={drinkDialogOpen}
          onClose={() => setDrinkDialogOpen(false)}
          sizes={drinkSizes}
          flavors={drinkFlavors}
          onAddToCart={handleDrinkAddToCart}
        />
      )}

      {name === "Curly Fries" && (
        <FriesSizeDialog
          open={friesDialogOpen}
          onClose={() => setFriesDialogOpen(false)}
          sizes={friesSizes}
          onAddToCart={handleFriesAddToCart}
        />
      )}

      {(name.includes("Ranch") || name.includes("Dip")) && (
        <DippingSauceDialog
          open={dipDialogOpen}
          onClose={() => setDipDialogOpen(false)}
          sauces={dipSauces}
          onAddToCart={handleDipAddToCart}
        />
      )}
    </>
  );
}
