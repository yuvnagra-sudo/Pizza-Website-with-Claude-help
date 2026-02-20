import { useState, useEffect, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Clock, Package, ChefHat, Truck, CheckCircle, Filter, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

type OrderStatus = "pending" | "preparing" | "ready_for_pickup" | "out_for_delivery" | "completed" | "cancelled";
type OrderType = "pickup" | "delivery";

export default function Kitchen() {
  const { user, loading: authLoading } = useAuth();
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [typeFilter, setTypeFilter] = useState<OrderType | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [datePreset, setDatePreset] = useState<"today" | "yesterday" | "last7" | "last30" | "all" | "custom">("all");
  const [customDateFrom, setCustomDateFrom] = useState("");
  const [customDateTo, setCustomDateTo] = useState("");

  // Derive the active date window from the preset
  const getDateWindow = (): { from: Date | null; to: Date | null } => {
    const now = new Date();
    const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const endOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

    switch (datePreset) {
      case "today":
        return { from: startOfDay(now), to: endOfDay(now) };
      case "yesterday": {
        const yest = new Date(now);
        yest.setDate(yest.getDate() - 1);
        return { from: startOfDay(yest), to: endOfDay(yest) };
      }
      case "last7": {
        const d = new Date(now);
        d.setDate(d.getDate() - 6);
        return { from: startOfDay(d), to: endOfDay(now) };
      }
      case "last30": {
        const d = new Date(now);
        d.setDate(d.getDate() - 29);
        return { from: startOfDay(d), to: endOfDay(now) };
      }
      case "custom":
        return {
          from: customDateFrom ? new Date(customDateFrom + "T00:00:00") : null,
          to: customDateTo ? new Date(customDateTo + "T23:59:59") : null,
        };
      default:
        return { from: null, to: null };
    }
  };

  const newOrderAudioRef = useRef<HTMLAudioElement | null>(null);
  const statusChangeAudioRef = useRef<HTMLAudioElement | null>(null);
  const urgentAudioRef = useRef<HTMLAudioElement | null>(null);
  const previousOrderCountRef = useRef(0);
  const previousOrdersRef = useRef<Map<number, string>>(new Map());

  // Fetch all orders with auto-refresh every 10 seconds
  const { data: allOrders = [], refetch } = trpc.orders.listAll.useQuery(undefined, {
    enabled: user?.role === "admin",
    refetchInterval: 10000, // 10 seconds
  });

  const updateStatusMutation = trpc.orders.updateStatus.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Order status updated");
    },
    onError: (error: any) => {
      toast.error(`Failed to update status: ${error.message}`);
    },
  });

  // Play alert sounds for new orders and status changes
  useEffect(() => {
    // Check for new orders
    if (allOrders.length > previousOrderCountRef.current && previousOrderCountRef.current > 0) {
      newOrderAudioRef.current?.play().catch(() => {
        // Ignore audio play errors (browser autoplay policy)
      });
    }
    previousOrderCountRef.current = allOrders.length;

    // Check for status changes and urgent orders
    let hasUrgentOrder = false;
    allOrders.forEach((order: any) => {
      const previousStatus = previousOrdersRef.current.get(order.id);

      // Status changed
      if (previousStatus && previousStatus !== order.status) {
        statusChangeAudioRef.current?.play().catch(() => {});
      }

      // Check if order is now urgent (>= RED threshold)
      const ageMinutes = Math.floor((new Date().getTime() - new Date(order.createdAt).getTime()) / 60000);
      if (ageMinutes >= TIME_THRESHOLD_RED && order.status !== "completed" && order.status !== "cancelled") {
        if (ageMinutes % 5 === 0) {
          hasUrgentOrder = true;
        }
      }

      // Update previous status
      previousOrdersRef.current.set(order.id, order.status);
    });

    // Play urgent sound once per poll cycle, regardless of how many orders are urgent
    if (hasUrgentOrder) {
      urgentAudioRef.current?.play().catch(() => {});
    }
  }, [allOrders]);

  // Filter orders
  const { from: dateFrom, to: dateTo } = getDateWindow();
  const filteredOrders = allOrders.filter((order: any) => {
    // Status filter
    if (statusFilter !== "all" && order.status !== statusFilter) return false;

    // Type filter
    if (typeFilter !== "all" && order.orderType !== typeFilter) return false;

    // Date filter
    if (dateFrom || dateTo) {
      const createdAt = new Date(order.createdAt);
      if (dateFrom && createdAt < dateFrom) return false;
      if (dateTo && createdAt > dateTo) return false;
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        order.id.toString().includes(query) ||
        order.customerName.toLowerCase().includes(query) ||
        order.email?.toLowerCase().includes(query)
      );
    }

    return true;
  });

  // Sort orders: pending first, then by creation time (oldest first)
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    if (a.status === "pending" && b.status !== "pending") return -1;
    if (a.status !== "pending" && b.status === "pending") return 1;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  // Export currently-filtered orders to CSV
  const exportToCSV = () => {
    if (sortedOrders.length === 0) {
      toast.error("No orders to export");
      return;
    }

    const headers = [
      "Order ID", "Order Number", "Status", "Type", "Customer Name",
      "Phone", "Email", "Delivery Address", "Payment Method",
      "Subtotal", "Delivery Fee", "Tax", "Total",
      "Items", "Order Notes", "Created At",
    ];

    const rows = sortedOrders.map((order: any) => {
      const itemSummary = (order.items ?? [])
        .map((i: any) => `${i.quantity}x ${i.menuItemName}${i.size ? ` (${i.size})` : ""}`)
        .join(" | ");
      return [
        order.id,
        order.orderNumber ?? order.id,
        order.status,
        order.orderType,
        order.customerName,
        order.phoneNumber,
        order.email ?? "",
        order.deliveryAddress ?? "",
        order.paymentMethod ?? "",
        parseFloat(order.subtotal ?? "0").toFixed(2),
        parseFloat(order.deliveryFee ?? "0").toFixed(2),
        parseFloat(order.tax ?? "0").toFixed(2),
        parseFloat(order.total ?? "0").toFixed(2),
        itemSummary,
        order.orderNotes ?? "",
        new Date(order.createdAt).toLocaleString(),
      ].map((v) => `"${String(v).replace(/"/g, '""')}"`);
    });

    const csvContent = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const dateLabel = datePreset === "all" ? "all-time" : datePreset;
    link.href = url;
    link.download = `johnnys-orders-${dateLabel}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Exported ${sortedOrders.length} order(s) to CSV`);
  };

  const handleStatusUpdate = (orderId: number, newStatus: OrderStatus) => {
    updateStatusMutation.mutate({ orderId, status: newStatus });
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "preparing":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "ready_for_pickup":
        return "bg-green-100 text-green-800 border-green-300";
      case "out_for_delivery":
        return "bg-purple-100 text-purple-800 border-purple-300";
      case "completed":
        return "bg-gray-100 text-gray-800 border-gray-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getOrderAge = (createdAt: Date) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffMinutes = Math.floor((now.getTime() - created.getTime()) / 60000);
    
    if (diffMinutes < 60) return `${diffMinutes}m`;
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    return `${hours}h ${minutes}m`;
  };

  // Configurable time thresholds (in minutes)
  const TIME_THRESHOLD_YELLOW = 10; // Turn yellow after 10 minutes
  const TIME_THRESHOLD_RED = 15; // Turn red after 15 minutes

  const getOrderAgeMinutes = (createdAt: Date) => {
    return Math.floor((new Date().getTime() - new Date(createdAt).getTime()) / 60000);
  };

  const getOrderAgeColor = (createdAt: Date) => {
    const ageMinutes = getOrderAgeMinutes(createdAt);
    if (ageMinutes >= TIME_THRESHOLD_RED) return "red";
    if (ageMinutes >= TIME_THRESHOLD_YELLOW) return "yellow";
    return "white";
  };

  const isOrderOld = (createdAt: Date) => {
    return getOrderAgeMinutes(createdAt) >= TIME_THRESHOLD_RED;
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--brand-blue)] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Please sign in to access the kitchen display.</p>
            <a href={getLoginUrl()} className="bg-[var(--brand-yellow)] text-black px-6 py-2 font-bold hover:bg-yellow-500 border-4 border-black inline-block">
              Sign In
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (user.role !== "admin") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p>You don't have permission to access the kitchen display.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Kitchen Display - Johnny's Pizza & Wings</title>
      </Helmet>
      
      {/* Audio alerts */}
      <audio ref={newOrderAudioRef} src="/new-order.mp3" preload="auto" />
      <audio ref={statusChangeAudioRef} src="/status-change.mp3" preload="auto" />
      <audio ref={urgentAudioRef} src="/urgent-order.mp3" preload="auto" />

      <div className="min-h-screen bg-gray-100 p-4">
        {/* Header */}
        <div className="mb-6">
          <h1 className="font-['Bebas_Neue'] text-5xl text-[var(--brand-blue)] mb-2">
            Kitchen Display System
          </h1>
          <p className="text-gray-600">
            {sortedOrders.length} order{sortedOrders.length !== 1 ? "s" : ""} • Auto-refresh every 10s
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white border-4 border-black p-4 brutal-shadow mb-6">
          <div className="flex flex-wrap gap-4">
            {/* Status Filter */}
            <div className="flex-1 min-w-[180px]">
              <label className="block font-bold mb-2">
                <Filter className="inline w-4 h-4 mr-1" />
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as OrderStatus | "all")}
                className="w-full border-2 border-black p-2 font-bold"
              >
                <option value="all">All Orders</option>
                <option value="pending">Pending</option>
                <option value="preparing">Preparing</option>
                <option value="ready_for_pickup">Ready for Pickup</option>
                <option value="out_for_delivery">Out for Delivery</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            {/* Type Filter */}
            <div className="flex-1 min-w-[150px]">
              <label className="block font-bold mb-2">Order Type</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as OrderType | "all")}
                className="w-full border-2 border-black p-2 font-bold"
              >
                <option value="all">All Types</option>
                <option value="pickup">Pickup</option>
                <option value="delivery">Delivery</option>
              </select>
            </div>

            {/* Date Range */}
            <div className="flex-1 min-w-[180px]">
              <label className="block font-bold mb-2">Date Range</label>
              <select
                value={datePreset}
                onChange={(e) => setDatePreset(e.target.value as typeof datePreset)}
                className="w-full border-2 border-black p-2 font-bold"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="last7">Last 7 Days</option>
                <option value="last30">Last 30 Days</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>

            {/* Custom date inputs — only shown when preset = custom */}
            {datePreset === "custom" && (
              <>
                <div className="flex-1 min-w-[160px]">
                  <label className="block font-bold mb-2">From</label>
                  <input
                    type="date"
                    value={customDateFrom}
                    onChange={(e) => setCustomDateFrom(e.target.value)}
                    className="w-full border-2 border-black p-2"
                  />
                </div>
                <div className="flex-1 min-w-[160px]">
                  <label className="block font-bold mb-2">To</label>
                  <input
                    type="date"
                    value={customDateTo}
                    onChange={(e) => setCustomDateTo(e.target.value)}
                    className="w-full border-2 border-black p-2"
                  />
                </div>
              </>
            )}

            {/* Search */}
            <div className="flex-1 min-w-[180px]">
              <label className="block font-bold mb-2">Search</label>
              <input
                type="text"
                placeholder="Order ID or customer name"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full border-2 border-black p-2"
              />
            </div>

            {/* Export CSV */}
            <div className="flex items-end min-w-[160px]">
              <button
                onClick={exportToCSV}
                className="w-full bg-[var(--brand-yellow)] text-black font-bold border-4 border-black px-4 py-2 flex items-center justify-center gap-2 hover:bg-yellow-300 transition-colors brutal-shadow"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            </div>
          </div>
        </div>

        {/* Orders Grid */}
        {sortedOrders.length === 0 ? (
          <div className="bg-white border-4 border-black p-12 brutal-shadow text-center">
            <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-xl font-bold text-gray-600">No orders to display</p>
            <p className="text-gray-500 mt-2">Orders will appear here automatically</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedOrders.map((order) => {
              const orderAge = getOrderAge(order.createdAt);
              const ageMinutes = getOrderAgeMinutes(order.createdAt);
              const ageColor = getOrderAgeColor(order.createdAt);
              const isOld = isOrderOld(order.createdAt);

              // Determine card background based on age
              let cardBgClass = "bg-white";
              let cardBorderClass = "border-black";
              
              if (ageColor === "red") {
                cardBgClass = "bg-red-50";
                cardBorderClass = "border-red-600";
              } else if (ageColor === "yellow") {
                cardBgClass = "bg-yellow-50";
                cardBorderClass = "border-yellow-600";
              }

              return (
                <div
                  key={order.id}
                  className={`${cardBgClass} border-4 ${cardBorderClass} brutal-shadow p-4 transition-colors duration-500`}
                >
                  {/* Order Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-['Bebas_Neue'] text-3xl text-[var(--brand-blue)]">
                        Order #{order.id}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="w-5 h-5 text-gray-500" />
                        <span className={`text-2xl font-bold ${
                          ageColor === "red" ? "text-red-600" :
                          ageColor === "yellow" ? "text-yellow-600" :
                          "text-gray-700"
                        }`}>
                          {orderAge}
                        </span>
                        <span className="text-sm text-gray-500">ago</span>
                        {isOld && <span className="text-red-600 font-bold text-sm ml-2">⚠ URGENT</span>}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {ageMinutes} minute{ageMinutes !== 1 ? "s" : ""} elapsed
                      </p>
                    </div>
                    <div className={`px-3 py-1 border-2 ${getStatusColor(order.status)} font-bold text-sm`}>
                      {order.status.replace("_", " ").toUpperCase()}
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div className="mb-4 pb-4 border-b-2 border-gray-200">
                    <p className="font-bold">{order.customerName}</p>
                    <p className="text-sm text-gray-600">{order.phoneNumber}</p>
                    {order.email && (
                      <p className="text-sm text-gray-600">📧 {order.email}</p>
                    )}
                    <p className="text-sm flex items-center gap-1 mt-1">
                      {order.orderType === "delivery" ? (
                        <>
                          <Truck className="w-4 h-4" />
                          Delivery: {order.deliveryAddress}
                        </>
                      ) : (
                        <>
                          <Package className="w-4 h-4" />
                          Pickup
                        </>
                      )}
                    </p>
                    {order.scheduledPickupTime && (
                      <p className="text-sm font-semibold text-blue-700 mt-2">
                        ⏰ Scheduled for: {new Date(order.scheduledPickupTime).toLocaleString('en-US', {
                          timeZone: 'America/Edmonton',
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true
                        })}
                      </p>
                    )}
                  </div>

                  {/* Order Items */}
                  <div className="mb-4 pb-4 border-b-2 border-gray-200">
                    <p className="font-bold mb-3 text-lg">Order Items:</p>
                    <div className="space-y-3">
                      {order.items && order.items.length > 0 ? (
                        order.items.map((item: any, idx: number) => {
                          let customizations = null;
                          try {
                            customizations = item.customizations ? JSON.parse(item.customizations) : null;
                          } catch (e) {
                            // Invalid JSON, skip customizations
                          }

                          return (
                            <div key={idx} className="bg-gray-50 p-3 border-2 border-gray-300">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <p className="font-bold text-base">
                                    {item.quantity}x {item.menuItemName}
                                  </p>
                                  {item.size && (
                                    <p className="text-sm text-gray-600">Size: {item.size}</p>
                                  )}
                                </div>
                                <p className="font-bold">${item.price ?? "N/A"}</p>
                              </div>

                              {/* Customizations */}
                              {customizations && (
                                <div className="mt-2 text-sm">
                                  {/* Half and Half Pizza */}
                                  {customizations.isHalfAndHalf && (
                                    <div className="mb-2">
                                      <p className="font-bold text-red-600">🍕 HALF & HALF:</p>
                                      <div className="ml-2">
                                        <p className="font-semibold">Left Side:</p>
                                        {customizations.leftSide?.added?.length > 0 && (
                                          <p className="text-green-700">+ {customizations.leftSide.added.join(", ")}</p>
                                        )}
                                        {customizations.leftSide?.removed?.length > 0 && (
                                          <p className="text-red-700">- {customizations.leftSide.removed.join(", ")}</p>
                                        )}
                                        <p className="font-semibold mt-1">Right Side:</p>
                                        {customizations.rightSide?.added?.length > 0 && (
                                          <p className="text-green-700">+ {customizations.rightSide.added.join(", ")}</p>
                                        )}
                                        {customizations.rightSide?.removed?.length > 0 && (
                                          <p className="text-red-700">- {customizations.rightSide.removed.join(", ")}</p>
                                        )}
                                      </div>
                                    </div>
                                  )}

                                  {/* Regular Pizza Toppings */}
                                  {!customizations.isHalfAndHalf && customizations.toppingModifications && (
                                    <div className="mb-2">
                                      {customizations.toppingModifications.added?.length > 0 && (
                                        <p className="text-green-700 font-semibold">
                                          ➕ Add: {customizations.toppingModifications.added.join(", ")}
                                        </p>
                                      )}
                                      {customizations.toppingModifications.removed?.length > 0 && (
                                        <p className="text-red-700 font-semibold">
                                          ➖ Remove: {customizations.toppingModifications.removed.join(", ")}
                                        </p>
                                      )}
                                    </div>
                                  )}

                                  {/* Cooking Preferences */}
                                  {(customizations.extraSauce || customizations.easySauce || customizations.wellDone) && (
                                    <div className="mb-2">
                                      <p className="font-bold text-orange-600">🔥 Cooking:</p>
                                      <div className="ml-2">
                                        {customizations.extraSauce && <p>• Extra Sauce</p>}
                                        {customizations.easySauce && <p>• Easy Sauce</p>}
                                        {customizations.wellDone && <p>• Well Done</p>}
                                      </div>
                                    </div>
                                  )}

                                  {/* Wings Flavor */}
                                  {customizations.flavor && (
                                    <p className="font-bold text-purple-600">
                                      🍗 Flavor: {customizations.flavor}
                                    </p>
                                  )}
                                </div>
                              )}

                              {/* Special Notes */}
                              {item.notes && (
                                <div className="mt-2 p-2 bg-yellow-50 border-2 border-yellow-400">
                                  <p className="font-bold text-yellow-800">📝 Special Instructions:</p>
                                  <p className="text-sm text-yellow-900">{item.notes}</p>
                                </div>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-gray-500 italic">No items found</p>
                      )}
                    </div>
                    <div className="mt-3 pt-3 border-t-2 border-gray-300">
                      <p className="font-bold text-lg">Total: ${order.total}</p>
                    </div>
                  </div>

                  {/* Order Notes */}
                  {order.orderNotes && (
                    <div className="mb-4 p-3 bg-red-50 border-2 border-red-400">
                      <p className="font-bold text-red-800">⚠️ ORDER NOTES:</p>
                      <p className="text-sm text-red-900 font-semibold">{order.orderNotes}</p>
                    </div>
                  )}

                  {/* Status Actions */}
                  <div className="space-y-2 mt-4 pt-4 border-t-2 border-gray-300">
                    {order.status === "pending" && (
                      <button
                        onClick={() => handleStatusUpdate(order.id, "preparing")}
                        className="w-full bg-blue-600 text-white px-6 py-3 font-bold hover:bg-blue-700 border-4 border-black brutal-shadow transition-all hover:translate-x-0.5 hover:translate-y-0.5 flex items-center justify-center gap-2 text-lg"
                        disabled={updateStatusMutation.isPending}
                      >
                        <ChefHat className="w-5 h-5" />
                        START PREPARING
                      </button>
                    )}
                    
                    {order.status === "preparing" && (
                      <>
                        {order.orderType === "pickup" ? (
                          <button
                            onClick={() => handleStatusUpdate(order.id, "ready_for_pickup")}
                            className="w-full bg-green-600 text-white px-6 py-3 font-bold hover:bg-green-700 border-4 border-black brutal-shadow transition-all hover:translate-x-0.5 hover:translate-y-0.5 flex items-center justify-center gap-2 text-lg"
                            disabled={updateStatusMutation.isPending}
                          >
                            <CheckCircle className="w-5 h-5" />
                            READY FOR PICKUP
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStatusUpdate(order.id, "out_for_delivery")}
                            className="w-full bg-purple-600 text-white px-6 py-3 font-bold hover:bg-purple-700 border-4 border-black brutal-shadow transition-all hover:translate-x-0.5 hover:translate-y-0.5 flex items-center justify-center gap-2 text-lg"
                            disabled={updateStatusMutation.isPending}
                          >
                            <Truck className="w-5 h-5" />
                            OUT FOR DELIVERY
                          </button>
                        )}
                      </>
                    )}
                    
                    {((order.status as any) === "ready_for_pickup" || order.status === "out_for_delivery") && (
                      <button
                        onClick={() => handleStatusUpdate(order.id, "completed")}
                        className="w-full bg-gray-800 text-white px-6 py-3 font-bold hover:bg-gray-900 border-4 border-black brutal-shadow transition-all hover:translate-x-0.5 hover:translate-y-0.5 flex items-center justify-center gap-2 text-lg"
                        disabled={updateStatusMutation.isPending}
                      >
                        <CheckCircle className="w-5 h-5" />
                        MARK COMPLETED
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
