import { useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { Helmet } from "react-helmet-async";
import { trpc } from "@/lib/trpc";
import { Clock, Package, ChefHat, Truck, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TrackOrder() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const orderId = params.id ? parseInt(params.id) : null;

  const { data: order, isLoading, refetch } = trpc.orders.getById.useQuery(
    { id: orderId! },
    { enabled: !!orderId, refetchInterval: 30000 } // Auto-refresh every 30 seconds
  );

  useEffect(() => {
    if (!orderId) {
      setLocation("/");
    }
  }, [orderId, setLocation]);

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container py-8">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="pt-6">
            <div className="text-center">
              <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Order Not Found</h2>
              <p className="text-gray-600 mb-4">
                We couldn't find an order with ID #{orderId}
              </p>
              <button
                onClick={() => setLocation("/")}
                className="bg-yellow-400 text-black px-6 py-2 font-bold hover:bg-yellow-500"
              >
                Return Home
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusSteps = order.orderType === "delivery"
    ? [
        { key: "pending", label: "Order Received", icon: Clock },
        { key: "preparing", label: "Preparing", icon: ChefHat },
        { key: "out_for_delivery", label: "Out for Delivery", icon: Truck },
        { key: "completed", label: "Delivered", icon: CheckCircle },
      ]
    : [
        { key: "pending", label: "Order Received", icon: Clock },
        { key: "preparing", label: "Preparing", icon: ChefHat },
        { key: "ready_for_pickup", label: "Ready for Pickup", icon: Package },
        { key: "completed", label: "Picked Up", icon: CheckCircle },
      ];

  const currentStatusIndex = statusSteps.findIndex(step => step.key === order.status);
  const isCancelled = order.status === "cancelled";

  const getEstimatedTime = () => {
    if (isCancelled) return null;
    
    const statusUpdated = new Date(order.statusUpdatedAt);
    const now = new Date();
    const minutesSinceUpdate = Math.floor((now.getTime() - statusUpdated.getTime()) / 60000);

    switch (order.status) {
      case "pending":
        return "5-10 minutes";
      case "preparing":
        const remainingPrepTime = Math.max(0, 20 - minutesSinceUpdate);
        return `${remainingPrepTime}-${remainingPrepTime + 10} minutes`;
      case "out_for_delivery":
        const remainingDeliveryTime = Math.max(0, 25 - minutesSinceUpdate);
        return `${remainingDeliveryTime}-${remainingDeliveryTime + 10} minutes`;
      case "ready_for_pickup" as any:
        return "Ready now!";
      case "completed":
        return null;
      default:
        return "Calculating...";
    }
  };

  const estimatedTime = getEstimatedTime();

  return (
    <>
      <Helmet>
        <title>Track Order #{order.id} - Johnny's Pizza & Wings</title>
      </Helmet>

      <div className="container py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Track Your Order</h1>

          {isCancelled ? (
            <Card className="mb-6 border-red-500">
              <CardContent className="pt-6">
                <div className="text-center">
                  <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold mb-2">Order Cancelled</h2>
                  <p className="text-gray-600">
                    This order has been cancelled. If you have questions, please contact us at 403-948-2020.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Status Timeline */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Order Status</CardTitle>
                </CardHeader>
                <CardContent>
                  {estimatedTime && (
                    <div className="bg-yellow-100 border-4 border-black p-4 mb-6">
                      <p className="font-bold text-lg">
                        Estimated Time: {estimatedTime}
                      </p>
                    </div>
                  )}

                  <div className="relative">
                    {/* Progress Line */}
                    <div className="absolute left-8 top-0 bottom-0 w-1 bg-gray-200"></div>
                    <div
                      className="absolute left-8 top-0 w-1 bg-yellow-400 transition-all duration-500"
                      style={{
                        height: `${(currentStatusIndex / (statusSteps.length - 1)) * 100}%`,
                      }}
                    ></div>

                    {/* Status Steps */}
                    <div className="space-y-8">
                      {statusSteps.map((step, index) => {
                        const Icon = step.icon;
                        const isCompleted = index <= currentStatusIndex;
                        const isCurrent = index === currentStatusIndex;

                        return (
                          <div key={step.key} className="relative flex items-center">
                            <div
                              className={`relative z-10 flex items-center justify-center w-16 h-16 rounded-full border-4 ${
                                isCompleted
                                  ? "bg-yellow-400 border-black"
                                  : "bg-white border-gray-300"
                              }`}
                            >
                              <Icon
                                className={`w-8 h-8 ${
                                  isCompleted ? "text-black" : "text-gray-400"
                                }`}
                              />
                            </div>
                            <div className="ml-6">
                              <h3
                                className={`text-lg font-bold ${
                                  isCompleted ? "text-black" : "text-gray-400"
                                }`}
                              >
                                {step.label}
                              </h3>
                              {isCurrent && (
                                <p className="text-sm text-gray-600 mt-1">
                                  {step.key === "pending" && "We've received your order and are preparing to start."}
                                  {step.key === "preparing" && "Our kitchen is making your order fresh!"}
                                  {step.key === "out_for_delivery" && "Your order is on its way to you."}
                                  {step.key === "ready_for_pickup" && "Your order is ready! Come pick it up."}
                                  {step.key === "completed" && "Thank you for your order!"}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Order Details */}
          <Card>
            <CardHeader>
              <CardTitle>Order Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Order ID</p>
                  <p className="font-bold">#{order.id}</p>
                </div>
                <div>
                  <p className="text-gray-600">Order Type</p>
                  <p className="font-bold capitalize">{order.orderType}</p>
                </div>
                <div>
                  <p className="text-gray-600">Customer</p>
                  <p className="font-bold">{order.customerName}</p>
                </div>
                <div>
                  <p className="text-gray-600">Phone</p>
                  <p className="font-bold">{order.phoneNumber}</p>
                </div>
                {order.orderType === "delivery" && order.deliveryAddress && (
                  <div className="col-span-2">
                    <p className="text-gray-600">Delivery Address</p>
                    <p className="font-bold">{order.deliveryAddress}</p>
                  </div>
                )}
                <div className="col-span-2">
                  <p className="text-gray-600">Total</p>
                  <p className="font-bold text-xl">${parseFloat(order.total?.toString() || "0").toFixed(2)}</p>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t">
                <button
                  onClick={() => setLocation(`/order-confirmation/${order.id}`)}
                  className="w-full bg-yellow-400 text-black px-6 py-3 font-bold hover:bg-yellow-500 border-4 border-black"
                >
                  View Full Order Details
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
