import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle2, Phone, Package, X } from "lucide-react";
import EditOrderDialog from "../components/order/EditOrderDialog";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import confetti from "canvas-confetti";
import { toast } from "sonner";

export default function VendeurHome() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderLines, setOrderLines] = useState([]);
  const [editingOrder, setEditingOrder] = useState(null);
  const [editingOrderLines, setEditingOrderLines] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

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

  const markAsPickedUpMutation = useMutation({
    mutationFn: async ({ id, oldStatus }) => {
      await base44.entities.Order.update(id, { status: 'Récupérée' });
      if (user) {
        await base44.entities.OrderStatusHistory.create({
          order_id: id,
          old_status: oldStatus,
          new_status: 'Récupérée',
          changed_by: user.email
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      toast.success("Commande récupérée !");
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
    order.pickup_date === selectedDate &&
    order.shop_id === userShopId &&
    order.status !== 'Annulée'
  );

  const pendingOrders = filteredOrders.filter(o => o.status !== 'Récupérée');
  const completedOrders = filteredOrders.filter(o => o.status === 'Récupérée');

  const getOrderProducts = (orderId) => {
    return allOrderLines.filter(line => line.order_id === orderId);
  };

  const markAsPickedUp = (order) => {
    markAsPickedUpMutation.mutate({
      id: order.id,
      oldStatus: order.status
    });
  };

  return (
    <div className="p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Commandes à retirer
          </h1>
          {userShop && (
            <p className="text-gray-600 text-lg">Boutique : <span className="font-semibold">{userShop.name}</span></p>
          )}
        </div>

        <Card className="border-[#DFD3C3]/30 shadow-xl bg-white/90 backdrop-blur-sm mb-6">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedDate === new Date().toISOString().split('T')[0] ? "default" : "outline"}
                onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                className={selectedDate === new Date().toISOString().split('T')[0] ? "bg-gradient-to-r from-[#E0A890] to-[#C98F75] hover:from-[#C98F75] hover:to-[#B07E64] text-white" : "border-[#DFD3C3]"}
              >
                Aujourd'hui
              </Button>
              <Button
                variant={selectedDate === new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0] ? "default" : "outline"}
                onClick={() => {
                  const tomorrow = new Date();
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  setSelectedDate(tomorrow.toISOString().split('T')[0]);
                }}
                className={selectedDate === new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0] ? "bg-gradient-to-r from-[#E0A890] to-[#C98F75] hover:from-[#C98F75] hover:to-[#B07E64] text-white" : "border-[#DFD3C3]"}
              >
                Demain
              </Button>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-auto border-[#DFD3C3]"
              />
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="border-[#DFD3C3]/30 shadow-xl bg-gradient-to-br from-gray-50 to-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total</p>
                  <p className="text-4xl font-bold text-gray-800">{filteredOrders.length}</p>
                </div>
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center">
                  <Package className="w-8 h-8 text-gray-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#DFD3C3]/30 shadow-xl bg-gradient-to-br from-orange-50 to-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">En attente</p>
                  <p className="text-4xl font-bold text-orange-600">{pendingOrders.length}</p>
                </div>
                <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center">
                  <Package className="w-8 h-8 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#DFD3C3]/30 shadow-xl bg-gradient-to-br from-green-50 to-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Récupérées</p>
                  <p className="text-4xl font-bold text-green-600">{completedOrders.length}</p>
                </div>
                <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {pendingOrders.length > 0 && (
          <Card className="border-[#DFD3C3]/30 shadow-xl bg-white/90 backdrop-blur-sm mb-6">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold mb-4 text-orange-700">
                En attente ({pendingOrders.length})
              </h2>
              <div className="space-y-3">
                {pendingOrders.map(order => {
                  const lines = getOrderProducts(order.id);
                  return (
                    <Card key={order.id} className="border-[#DFD3C3]/30 hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                          <div className="flex-1 min-w-0 w-full">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <span className="font-mono font-semibold text-lg text-[#C98F75]">
                                #{order.order_number}
                              </span>
                              {order.status === 'Enregistrée (modifiée)' && (
                                <Badge className="bg-orange-100 text-orange-800">Modifiée</Badge>
                              )}
                            </div>
                            <p className="text-lg font-semibold mb-1">
                              {order.customer_firstname} {order.customer_name}
                            </p>
                            <p className="text-sm text-gray-600 flex items-center gap-1 mb-3">
                              <Phone className="w-4 h-4" />
                              {order.customer_phone}
                            </p>
                            <div className="flex flex-wrap gap-2 mb-3">
                              {lines.map(line => (
                                <Badge key={line.id} variant="outline" className="text-xs font-normal">
                                  {line.quantity}x {line.product_name}
                                </Badge>
                              ))}
                            </div>
                            <p className="text-2xl font-bold text-[#C98F75]">
                              {order.total_amount.toFixed(2)} €
                            </p>
                          </div>
                          <div className="flex flex-col gap-2 w-full sm:w-auto">
                            <Button
                              size="lg"
                              onClick={() => markAsPickedUp(order)}
                              className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto"
                            >
                              <CheckCircle2 className="w-5 h-5 mr-2" />
                              Récupérée
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewDetails(order)}
                              className="border-[#DFD3C3] w-full sm:w-auto"
                            >
                              Détails
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {completedOrders.length > 0 && (
          <Card className="border-[#DFD3C3]/30 shadow-xl bg-white/90 backdrop-blur-sm">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold mb-4 text-green-700">
                Récupérées ({completedOrders.length})
              </h2>
              <div className="space-y-2">
                {completedOrders.map(order => (
                  <Card key={order.id} className="border-[#DFD3C3]/30 bg-green-50/30">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 flex-1">
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                          <div>
                            <p className="font-semibold text-gray-700">
                              #{order.order_number} - {order.customer_firstname} {order.customer_name}
                            </p>
                            <p className="text-sm text-gray-600">{order.total_amount.toFixed(2)} €</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(order)}
                          className="text-gray-600"
                        >
                          Voir
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {filteredOrders.length === 0 && (
          <Card className="border-[#DFD3C3]/30 shadow-xl bg-white/90 backdrop-blur-sm">
            <CardContent className="p-12 text-center">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">Aucune commande pour cette date</p>
            </CardContent>
          </Card>
        )}

        <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-[#C98F75]">
                Commande #{selectedOrder?.order_number}
              </DialogTitle>
            </DialogHeader>
            
            {selectedOrder && (
              <div className="space-y-4">
                <Card className="bg-gray-50 border-none">
                  <CardContent className="p-4">
                    <p className="text-xl font-bold mb-1">{selectedOrder.customer_firstname} {selectedOrder.customer_name}</p>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone className="w-4 h-4" />
                      <p>{selectedOrder.customer_phone}</p>
                    </div>
                    {selectedOrder.customer_email && (
                      <p className="text-sm text-gray-600 mt-1">{selectedOrder.customer_email}</p>
                    )}
                    {selectedOrder.ticket_number && (
                      <p className="text-sm text-gray-600 mt-1">Ticket: {selectedOrder.ticket_number}</p>
                    )}
                  </CardContent>
                </Card>

                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Produits
                  </h3>
                  <div className="space-y-2">
                    {orderLines.map(line => (
                      <div key={line.id} className="flex justify-between items-start p-3 bg-white rounded-lg border border-gray-200">
                        <div className="flex-1">
                          <p className="font-semibold text-lg">{line.quantity}x {line.product_name}</p>
                          {line.customization && (
                            <p className="text-sm text-gray-600 mt-1 italic">→ {line.customization}</p>
                          )}
                        </div>
                        <p className="font-bold text-[#C98F75] text-lg">{line.subtotal.toFixed(2)} €</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t-2 border-[#E0A890] flex justify-between items-center">
                  <span className="text-xl font-bold">Total</span>
                  <span className="text-3xl font-bold text-[#C98F75]">
                    {selectedOrder.total_amount.toFixed(2)} €
                  </span>
                </div>

                {selectedOrder.status !== 'Récupérée' && (
                  <Button
                    size="lg"
                    onClick={() => {
                      markAsPickedUp(selectedOrder);
                      setSelectedOrder(null);
                    }}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                  >
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                    Marquer comme récupérée
                  </Button>
                )}
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