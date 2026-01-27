import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ShoppingCart, Calendar, CheckCircle2, Package, Pencil, Gift } from "lucide-react";
import EditOrderDialog from "../components/order/EditOrderDialog";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import confetti from "canvas-confetti";
import { toast } from "sonner";

export default function VendeurHome() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderLines, setOrderLines] = useState([]);
  const [optimisticStatus, setOptimisticStatus] = useState({});
  const [editingOrder, setEditingOrder] = useState(null);
  const [editingOrderLines, setEditingOrderLines] = useState([]);
  const [filterMode, setFilterMode] = useState("today");
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const handleFilterMode = (mode) => {
    setFilterMode(mode);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (mode === "today") {
      const todayStr = today.toISOString().split('T')[0];
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (mode === "tomorrow") {
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      setStartDate(tomorrowStr);
      setEndDate(tomorrowStr);
    }
  };

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: orders = [] } = useQuery({
    queryKey: ['orders'],
    queryFn: () => base44.entities.Order.list('-created_date')
  });

  const { data: shops = [] } = useQuery({
    queryKey: ['shops'],
    queryFn: () => base44.entities.Shop.list()
  });

  const { data: allOrderLines = [] } = useQuery({
    queryKey: ['orderLines'],
    queryFn: () => base44.entities.OrderLine.list()
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list()
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => base44.entities.Category.list()
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, oldStatus }) => {
      await base44.entities.Order.update(id, { status });
      if (user) {
        await base44.entities.OrderStatusHistory.create({
          order_id: id,
          old_status: oldStatus,
          new_status: status,
          changed_by: user.email
        });
      }
    },
    onSuccess: (data, variables) => {
      setOptimisticStatus(prev => {
        const newState = { ...prev };
        delete newState[variables.id];
        return newState;
      });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      if (variables.status === 'Récupérée') {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      } else {
        toast.success("Commande mise à jour");
      }
    },
    onError: (error, variables) => {
      setOptimisticStatus(prev => {
        const newState = { ...prev };
        delete newState[variables.id];
        return newState;
      });
      toast.error("Erreur lors de la mise à jour");
    }
  });

  const handleViewDetails = async (order) => {
    setSelectedOrder(order);
    const lines = await base44.entities.OrderLine.filter({ order_id: order.id });
    setOrderLines(lines);
  };

  const handleEditOrder = async (order) => {
    const lines = await base44.entities.OrderLine.filter({ order_id: order.id });
    setEditingOrder(order);
    setEditingOrderLines(lines);
  };

  const userShopId = user?.assigned_shop_id;
  const userShop = shops.find(s => s.id === userShopId);

  const filteredOrders = orders.filter(order => 
    order.pickup_date >= startDate && 
    order.pickup_date <= endDate &&
    order.shop_id === userShopId &&
    order.status !== 'Annulée'
  );

  const completedCount = filteredOrders.filter(order => 
    order.status === 'Récupérée'
  ).length;

  const getStatusColor = (status) => {
    const colors = {
      "Enregistrée": "bg-blue-100 text-blue-800",
      "Enregistrée (modifiée)": "bg-orange-100 text-orange-800",
      "En livraison": "bg-purple-100 text-purple-800",
      "Récupérée": "bg-green-100 text-green-800",
      "Annulée": "bg-red-100 text-red-800"
    };
    return colors[status] || colors["Enregistrée"];
  };

  const getStatusLabel = (status) => {
    return status || "Enregistrée";
  };

  const getEventBadge = (orderId) => {
    const lines = allOrderLines.filter(line => line.order_id === orderId);
    for (const line of lines) {
      const product = products.find(p => p.id === line.product_id);
      const category = categories.find(c => c.id === product?.category_id);
      
      if (product?.is_christmas || category?.is_christmas) {
        return <Badge className="bg-red-100 text-red-800 border-red-300">🎄 Noël</Badge>;
      }
      if (product?.is_valentine || category?.is_valentine) {
        return <Badge className="bg-pink-100 text-pink-800 border-pink-300">❤️ St-Valentin</Badge>;
      }
      if (product?.is_epiphany || category?.is_epiphany) {
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">👑 Épiphanie</Badge>;
      }
    }
    return null;
  };

  return (
    <div className="p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-2">
            <ShoppingCart className="w-8 h-8 text-[#C98F75]" />
            Commandes à retirer
          </h1>
          {userShop && (
            <p className="text-gray-600 text-lg">Boutique : <span className="font-semibold">{userShop.name}</span></p>
          )}
        </div>

        <Card className="border-[#DFD3C3]/30 shadow-xl bg-white/90 backdrop-blur-sm mb-6">
          <CardContent className="p-4 sm:p-6">
            {filterMode === "custom" ? (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleFilterMode("today")}
                    className="border-[#DFD3C3]"
                  >
                    Aujourd'hui
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleFilterMode("tomorrow")}
                    className="border-[#DFD3C3]"
                  >
                    Demain
                  </Button>
                  <Button
                    variant="default"
                    className="bg-gradient-to-r from-[#E0A890] to-[#C98F75] hover:from-[#C98F75] hover:to-[#B07E64] text-white"
                  >
                    Plage de dates
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start_date" className="flex items-center gap-2 mb-2 text-sm">
                      <Calendar className="w-4 h-4" />
                      Date de début
                    </Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="border-[#DFD3C3]"
                    />
                  </div>
                  <div>
                    <Label htmlFor="end_date" className="flex items-center gap-2 mb-2 text-sm">
                      <Calendar className="w-4 h-4" />
                      Date de fin
                    </Label>
                    <Input
                      id="end_date"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      min={startDate}
                      className="border-[#DFD3C3]"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={filterMode === "today" ? "default" : "outline"}
                  onClick={() => handleFilterMode("today")}
                  className={filterMode === "today" ? "bg-gradient-to-r from-[#E0A890] to-[#C98F75] hover:from-[#C98F75] hover:to-[#B07E64] text-white" : "border-[#DFD3C3]"}
                >
                  Aujourd'hui
                </Button>
                <Button
                  variant={filterMode === "tomorrow" ? "default" : "outline"}
                  onClick={() => handleFilterMode("tomorrow")}
                  className={filterMode === "tomorrow" ? "bg-gradient-to-r from-[#E0A890] to-[#C98F75] hover:from-[#C98F75] hover:to-[#B07E64] text-white" : "border-[#DFD3C3]"}
                >
                  Demain
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setFilterMode("custom")}
                  className="border-[#DFD3C3]"
                >
                  Plage de dates
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className="border-[#DFD3C3]/30 shadow-xl bg-gradient-to-br from-blue-50 to-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Commandes à retirer</p>
                  <p className="text-4xl font-bold text-blue-600">{filteredOrders.length}</p>
                </div>
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center">
                  <Calendar className="w-8 h-8 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#DFD3C3]/30 shadow-xl bg-gradient-to-br from-green-50 to-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Déjà récupérées</p>
                  <p className="text-4xl font-bold text-green-600">{completedCount}</p>
                </div>
                <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-[#DFD3C3]/30 shadow-xl bg-white/90 backdrop-blur-sm">
          <CardHeader className="border-b border-[#DFD3C3]/30 bg-gradient-to-r from-[#F8EDE3] to-white">
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-[#C98F75]" />
              Liste des commandes
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {filteredOrders.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">Aucune commande sur cette période</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map(order => {
                  const currentStatus = optimisticStatus[order.id] !== undefined ? optimisticStatus[order.id] : order.status;
                  const isCompleted = currentStatus === 'Récupérée';
                  return (
                  <Card key={order.id} className={`border-[#DFD3C3]/30 hover:shadow-md transition-shadow ${isCompleted ? 'opacity-50 bg-gray-50' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row items-start gap-4">
                       <div className="flex items-center pt-1">
                         <Checkbox
                           id={`order-${order.id}`}
                           checked={isCompleted}
                           onCheckedChange={(checked) => {
                             if (checked) {
                               setOptimisticStatus(prev => ({ ...prev, [order.id]: 'Récupérée' }));
                               updateStatusMutation.mutate({
                                 id: order.id,
                                 status: 'Récupérée',
                                 oldStatus: order.status
                               });
                             } else {
                               setOptimisticStatus(prev => ({ ...prev, [order.id]: 'Enregistrée' }));
                               updateStatusMutation.mutate({
                                 id: order.id,
                                 status: 'Enregistrée',
                                 oldStatus: order.status
                               });
                             }
                           }}
                           className="h-6 w-6"
                         />
                       </div>
                      <div className="flex-1 min-w-0">
                       <div className="flex flex-wrap items-center gap-2 mb-2">
                         <span className={`font-mono font-semibold text-sm sm:text-lg ${isCompleted ? 'line-through text-gray-400' : 'text-[#C98F75]'}`}>
                           {order.order_number}
                         </span>
                         <Badge className={getStatusColor(currentStatus)}>
                           {getStatusLabel(currentStatus)}
                         </Badge>
                         {getEventBadge(order.id)}
                       </div>
                        <p className={`mb-1 text-sm sm:text-base ${isCompleted ? 'text-gray-500' : 'text-gray-700'}`}>
                          <span className="font-medium">Client :</span> {order.customer_firstname} {order.customer_name}
                        </p>
                        <p className={`text-xs sm:text-sm ${isCompleted ? 'text-gray-400' : 'text-gray-600'}`}>
                          <span className="font-medium">Téléphone :</span> {order.customer_phone}
                        </p>
                        {order.ticket_number && (
                          <p className={`text-xs sm:text-sm ${isCompleted ? 'text-gray-400' : 'text-gray-600'}`}>
                            <span className="font-medium">N° Ticket :</span> {order.ticket_number}
                          </p>
                        )}
                        <p className={`text-lg sm:text-xl font-bold mt-2 ${isCompleted ? 'text-gray-400' : 'text-[#C98F75]'}`}>
                          {order.total_amount.toFixed(2)} €
                        </p>
                      </div>
                      <div className="w-full sm:w-auto flex gap-2">
                        <Button 
                          variant="outline" 
                          size="icon"
                          className="border-[#DFD3C3]"
                          onClick={() => handleEditOrder(order)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          className="border-[#DFD3C3] flex-1 sm:flex-none text-sm"
                          onClick={() => handleViewDetails(order)}
                        >
                          Voir détails
                        </Button>
                      </div>
                     </div>
                     </CardContent>
                     </Card>
                     );
                     })}
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">
                Détails de la commande {selectedOrder?.order_number}
              </DialogTitle>
            </DialogHeader>
            
            {selectedOrder && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold text-sm text-gray-500 mb-2">Informations client</h3>
                    <div className="space-y-1">
                      <p><span className="font-medium">Nom :</span> {selectedOrder.customer_firstname} {selectedOrder.customer_name}</p>
                      <p><span className="font-medium">Téléphone :</span> {selectedOrder.customer_phone}</p>
                      <p><span className="font-medium">Email :</span> {selectedOrder.customer_email}</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-gray-500 mb-2">Informations retrait</h3>
                    <div className="space-y-1">
                      <p><span className="font-medium">Boutique :</span> {userShop?.name}</p>
                      <p><span className="font-medium">Date :</span> {format(new Date(selectedOrder.pickup_date), 'dd MMMM yyyy', { locale: fr })}</p>
                      <p><span className="font-medium">Statut :</span> <Badge className={getStatusColor(selectedOrder.status)}>{getStatusLabel(selectedOrder.status)}</Badge></p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-sm text-gray-500 mb-3">Produits commandés</h3>
                  <div className="space-y-3">
                    {orderLines.map(line => (
                      <Card key={line.id} className="border-[#DFD3C3]/30">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-semibold">{line.quantity}x {line.product_name}</p>
                              <p className="text-sm text-gray-600">{line.unit_price.toFixed(2)} € / unité</p>
                            </div>
                            <p className="font-bold text-[#C98F75]">{line.subtotal.toFixed(2)} €</p>
                          </div>
                          {line.customization && (
                            <div className="mt-2 p-2 bg-[#F8EDE3]/50 rounded text-sm">
                              <span className="font-medium">Personnalisation :</span> {line.customization}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t-2 border-[#E0A890] flex justify-between items-center">
                  <span className="text-xl font-bold">Total</span>
                  <span className="text-2xl font-bold text-[#C98F75]">
                    {selectedOrder.total_amount.toFixed(2)} €
                  </span>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <EditOrderDialog
          order={editingOrder}
          orderLines={editingOrderLines}
          onClose={() => {
            setEditingOrder(null);
            setEditingOrderLines([]);
          }}
        />
        </div>
        </div>
        );
        }