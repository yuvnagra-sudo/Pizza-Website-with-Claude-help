import { Helmet } from "react-helmet-async";
import { Link, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Clock, Package, Truck, CheckCircle, MapPin, Phone, FileText, ChevronLeft, User, Mail, Store, CreditCard } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

const statusConfig = {
  pending: {
    icon: Clock,
    color: "bg-yellow-100 text-yellow-800 border-yellow-300",
    message: "We've received your order and will start preparing it soon!",
  },
  preparing: {
    icon: Package,
    color: "bg-blue-100 text-blue-800 border-blue-300",
    message: "Your order is being prepared with care!",
  },
  "out for delivery": {
    icon: Truck,
    color: "bg-purple-100 text-purple-800 border-purple-300",
    message: "Your order is on its way!",
  },
  completed: {
    icon: CheckCircle,
    color: "bg-green-100 text-green-800 border-green-300",
    message: "Your order has been delivered. Enjoy!",
  },
};

export default function OrderDetail() {
  const { id } = useParams();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { data: order, isLoading } = trpc.orders.getById.useQuery({ id: parseInt(id || "0") });

  if (!authLoading && !isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }

  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl font-bold">Loading order...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center py-12">
        <Helmet>
          <title>Order Not Found - Johnny's Pizza & Wings</title>
        </Helmet>
        <h1 className="font-['Bebas_Neue'] text-4xl text-[var(--brand-blue)] mb-4">
          Order Not Found
        </h1>
        <p className="text-xl mb-8">We couldn't find this order.</p>
        <Link href="/orders">
          <Button className="bg-[var(--brand-yellow)] text-black font-['Bebas_Neue'] text-2xl px-8 py-6 border-4 border-black brutal-shadow snap-grow">
            View All Orders
          </Button>
        </Link>
      </div>
    );
  }

  const config = statusConfig[order.status as keyof typeof statusConfig] || statusConfig.pending;
  const StatusIcon = config.icon;

  return (
    <>
      <Helmet>
        <title>{`Order #${order.id} - Johnny's Pizza & Wings`}</title>
      </Helmet>
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto max-w-4xl">
          {/* Back Button */}
          <Link href="/orders">
            <button className="flex items-center gap-2 mb-6 font-bold text-[var(--brand-blue)] hover:underline">
              <ChevronLeft className="w-5 h-5" />
              Back to Orders
            </button>
          </Link>

          {/* Thank You Message (for pending orders) */}
          {order.status === "pending" && (
            <div className="bg-[var(--brand-yellow)] border-6 border-black p-8 brutal-shadow mb-6 text-center">
              <h1 className="font-['Bebas_Neue'] text-5xl text-black mb-4">
                Thank You for Your Order!
              </h1>
              <p className="text-xl font-bold mb-2">
                We've received your order and will start preparing it soon.
              </p>
              <p className="text-lg mb-6">
                Order confirmation has been sent to <span className="font-bold">{order.email}</span>
              </p>
              <Link href={`/track-order/${order.id}`}>
                <button className="bg-black text-white px-8 py-3 font-bold hover:bg-gray-800 border-4 border-black">
                  Track Your Order
                </button>
              </Link>
            </div>
          )}

          {/* Order Header */}
          <div className="bg-white border-6 border-black p-8 brutal-shadow mb-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="font-['Bebas_Neue'] text-4xl text-[var(--brand-blue)] mb-2">
                  Order #{order.id}
                </h1>
                <p className="text-gray-600">
                  Placed on {new Date(order.createdAt).toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <span className={`px-4 py-2 font-bold border-4 border-black ${config.color} flex items-center gap-2`}>
                <StatusIcon className="w-5 h-5" />
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </span>
            </div>

            <div className="p-4 bg-gray-50 border-4 border-black">
              <p className="text-center font-bold">{config.message}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Customer & Delivery Information */}
            <div className="bg-white border-6 border-black p-6 brutal-shadow">
              <h2 className="font-['Bebas_Neue'] text-2xl text-[var(--brand-blue)] mb-4">
                {order.orderType === "pickup" ? "Customer Information" : "Delivery Information"}
              </h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 mt-1 text-[var(--brand-blue)]" />
                  <div>
                    <p className="font-bold mb-1">Name:</p>
                    <p className="text-gray-700">{order.customerName}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 mt-1 text-[var(--brand-blue)]" />
                  <div>
                    <p className="font-bold mb-1">Email:</p>
                    <p className="text-gray-700">{order.email}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 mt-1 text-[var(--brand-blue)]" />
                  <div>
                    <p className="font-bold mb-1">Phone:</p>
                    <p className="text-gray-700">{order.phoneNumber}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  {order.orderType === "pickup" ? <Store className="w-5 h-5 mt-1 text-[var(--brand-blue)]" /> : <Truck className="w-5 h-5 mt-1 text-[var(--brand-blue)]" />}
                  <div>
                    <p className="font-bold mb-1">Order Type:</p>
                    <p className="text-gray-700">{order.orderType === "pickup" ? "Pickup" : "Delivery"}</p>
                  </div>
                </div>
                {order.orderType === "delivery" && order.deliveryAddress && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 mt-1 text-[var(--brand-blue)]" />
                    <div>
                      <p className="font-bold mb-1">Delivery Address:</p>
                      <p className="text-gray-700">{order.deliveryAddress}</p>
                    </div>
                  </div>
                )}
                {order.paymentMethod && (
                  <div className="flex items-start gap-3">
                    <CreditCard className="w-5 h-5 mt-1 text-[var(--brand-blue)]" />
                    <div>
                      <p className="font-bold mb-1">Payment Method:</p>
                      <p className="text-gray-700">
                        {order.paymentMethod === "credit_visa" ? "Credit Card (Visa)" :
                         order.paymentMethod === "credit_mastercard" ? "Credit Card (Mastercard)" :
                         order.paymentMethod === "debit" ? "Debit Card" :
                         order.paymentMethod === "etransfer" ? "E-Transfer" :
                         "Cash"}
                      </p>
                    </div>
                  </div>
                )}
                {order.orderNotes && (
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 mt-1 text-[var(--brand-blue)]" />
                    <div>
                      <p className="font-bold mb-1">Notes:</p>
                      <p className="text-gray-700 italic">{order.orderNotes}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-white border-6 border-black p-6 brutal-shadow">
              <h2 className="font-['Bebas_Neue'] text-2xl text-[var(--brand-blue)] mb-4">
                Order Items
              </h2>
              <div className="space-y-3 mb-6">
                {order.items?.map((item: any) => {
                  // Parse customizations if they exist
                  let customizationsData: any = null;
                  let customizations: any[] = [];
                  try {
                    if (item.customizations) {
                      customizationsData = JSON.parse(item.customizations);
                      if (Array.isArray(customizationsData)) {
                        customizations = customizationsData;
                      } else if (customizationsData?.toppingModifications) {
                        customizations = customizationsData.toppingModifications;
                      }
                    }
                  } catch (e) {
                    console.error("Failed to parse customizations:", e);
                  }

                  const isHalfAndHalf = customizationsData?.isHalfAndHalf;

                  return (
                    <div key={item.id} className="border-b-2 border-gray-200 pb-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-bold">
                            {isHalfAndHalf && customizationsData.leftHalf && customizationsData.rightHalf
                              ? `${customizationsData.leftHalf.basePizzaName} & ${customizationsData.rightHalf.basePizzaName}`
                              : item.menuItemName}
                          </p>
                          <div className="flex gap-2 items-center">
                            {isHalfAndHalf && (
                              <span className="inline-block bg-purple-500 text-white text-xs font-bold px-2 py-0.5 rounded">HALF & HALF</span>
                            )}
                            {item.size && (
                              <p className="text-sm text-gray-600">{item.size}</p>
                            )}
                          </div>
                          
                          {/* Display topping modifications for regular pizzas */}
                          {!isHalfAndHalf && customizations.length > 0 && (
                            <div className="text-sm text-gray-600 mt-1">
                              {customizations.map((mod: any, idx: number) => (
                                <div key={idx}>
                                  {mod.type === "remove" && `- ${mod.toppingName}`}
                                  {mod.type === "add" && `+ ${mod.toppingName}`}
                                  {mod.type === "replace" && `${mod.replacedToppingName} → ${mod.toppingName}`}
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {/* Display half-and-half toppings */}
                          {isHalfAndHalf && customizationsData.leftHalf && customizationsData.rightHalf && (
                            <div className="text-sm text-gray-600 mt-2 space-y-1">
                              <div>
                                <p className="font-semibold text-purple-700">🍕 Left: {customizationsData.leftHalf.basePizzaName}</p>
                                {customizationsData.leftHalf.toppingModifications?.length > 0 && (
                                  <div className="text-xs pl-4 mt-1">
                                    {customizationsData.leftHalf.toppingModifications.map((mod: any, idx: number) => (
                                      <p key={idx}>
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
                                {customizationsData.rightHalf.toppingModifications?.length > 0 && (
                                  <div className="text-xs pl-4 mt-1">
                                    {customizationsData.rightHalf.toppingModifications.map((mod: any, idx: number) => (
                                      <p key={idx}>
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
                            <p className="text-sm text-gray-600 italic mt-1">Note: {item.notes}</p>
                          )}
                          <p className="text-sm text-gray-600 mt-1">Qty: {item.quantity}</p>
                        </div>
                        <p className="font-bold">
                          ${(parseFloat(item.price?.toString() || "0") * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-2 border-t-4 border-black pt-4">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-bold">${parseFloat(order.subtotal).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>GST (5%):</span>
                  <span className="font-bold">${parseFloat(order.tax).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-2xl font-['Bebas_Neue'] pt-2 border-t-2 border-gray-300">
                  <span>Total:</span>
                  <span className="text-[var(--brand-blue)]">${parseFloat(order.total).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/menu">
              <Button className="bg-[var(--brand-yellow)] text-black font-['Bebas_Neue'] text-xl px-8 py-4 border-4 border-black brutal-shadow snap-grow">
                Order Again
              </Button>
            </Link>
            <Link href="/orders">
              <Button className="bg-white text-[var(--brand-blue)] font-['Bebas_Neue'] text-xl px-8 py-4 border-4 border-black brutal-shadow snap-grow">
                View All Orders
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
