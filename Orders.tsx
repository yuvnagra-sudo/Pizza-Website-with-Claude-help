import { Helmet } from "react-helmet-async";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Clock, Package, Truck, CheckCircle, ChevronRight, ShoppingCart } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";

const statusIcons = {
  pending: Clock,
  preparing: Package,
  "out for delivery": Truck,
  completed: CheckCircle,
};

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
  preparing: "bg-blue-100 text-blue-800 border-blue-300",
  "out for delivery": "bg-purple-100 text-purple-800 border-purple-300",
  completed: "bg-green-100 text-green-800 border-green-300",
};

export default function Orders() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { data: orders, isLoading } = trpc.orders.list.useQuery();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const addToCart = trpc.cart.add.useMutation({
    onSuccess: () => {
      utils.cart.get.invalidate();
    },
  });

  if (!authLoading && !isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }

  return (
    <>
      <Helmet>
        <title>My Orders - Johnny's Pizza & Wings</title>
      </Helmet>
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto max-w-4xl">
          <h1 className="font-['Bebas_Neue'] text-5xl text-[var(--brand-blue)] mb-8">
            My Orders
          </h1>

          {isLoading || authLoading ? (
            <div className="text-center py-12">
              <p className="text-xl font-bold">Loading orders...</p>
            </div>
          ) : !orders || orders.length === 0 ? (
            <div className="bg-white border-6 border-black p-12 text-center">
              <Package className="w-24 h-24 mx-auto mb-6 text-gray-300" />
              <h2 className="font-['Bebas_Neue'] text-3xl text-[var(--brand-blue)] mb-4">
                No Orders Yet
              </h2>
              <p className="text-xl mb-8">Start by ordering some delicious pizza!</p>
              <Link href="/menu">
                <Button className="bg-[var(--brand-yellow)] text-black font-['Bebas_Neue'] text-2xl px-8 py-6 border-4 border-black snap-grow">
                  Browse Menu
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => {
                const StatusIcon = statusIcons[order.status as keyof typeof statusIcons] || Clock;
                const statusColor = statusColors[order.status as keyof typeof statusColors] || statusColors.pending;

                return (
                  <Link key={order.id} href={`/order-confirmation/${order.id}`}>
                    <div className="bg-white border-6 border-black p-6 cursor-pointer transition-all">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-['Bebas_Neue'] text-2xl text-[var(--brand-blue)]">
                              Order #{order.id}
                            </h3>
                            <span className={`px-3 py-1 text-sm font-bold border-2 border-black ${statusColor} flex items-center gap-1`}>
                              <StatusIcon className="w-4 h-4" />
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">
                            {new Date(order.createdAt).toLocaleDateString("en-US", {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                        <ChevronRight className="w-6 h-6 text-gray-400" />
                      </div>

                      <div className="border-t-2 border-gray-200 pt-4">
                        <div className="flex justify-between items-center mb-4">
                          <p className="text-sm text-gray-600">
                            {order.orderType === "pickup" ? "Pickup Order" : `Delivery to: ${order.deliveryAddress?.substring(0, 50) || "N/A"}${order.deliveryAddress && order.deliveryAddress.length > 50 ? "..." : ""}`}
                          </p>
                          <p className="font-['Bebas_Neue'] text-2xl text-[var(--brand-blue)]">
                            ${parseFloat(order.total).toFixed(2)}
                          </p>
                        </div>
                        <Button
                          onClick={async (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            
                            try {
                              // Fetch order details to get all items
                              const orderDetails = await utils.client.orders.getById.query({ id: order.id });
                              
                              if (!orderDetails || !orderDetails.items || orderDetails.items.length === 0) {
                                toast.error("Could not load order items");
                                return;
                              }
                              
                              // Add each item to cart
                              for (const item of orderDetails.items) {
                                await addToCart.mutateAsync({
                                  menuItemId: item.menuItemId,
                                  price: parseFloat(item.price?.toString() || "0"),
                                  quantity: item.quantity,
                                  size: item.size || undefined,
                                  notes: item.notes || undefined,
                                  customizations: item.customizations || undefined,
                                });
                              }
                              
                              toast.success(`${orderDetails.items.length} item(s) from Order #${order.id} added to your cart!`);
                              
                              // Navigate to cart
                              setTimeout(() => setLocation("/cart"), 500);
                            } catch (error) {
                              console.error("Reorder error:", error);
                              toast.error("Failed to add items to cart");
                            }
                          }}
                          className="w-full bg-[var(--brand-yellow)] text-black font-['Bebas_Neue'] text-xl px-6 py-3 border-4 border-black snap-grow flex items-center justify-center gap-2"
                        >
                          <ShoppingCart className="w-5 h-5" />
                          Reorder
                        </Button>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
