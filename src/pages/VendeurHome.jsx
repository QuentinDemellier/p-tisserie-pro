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
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-1">
            Commandes à retirer
          </h1>
          {userShop && (
            <p className="text-gray-600">{userShop.name}</p>
          )}
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          <Button
            variant={selectedDate === new Date().toISOString().split('T')[0] ? "default" : "outline"}
            onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
            className={selectedDate === new Date().toISOString().split('T')[0] ? "bg-gradient-to-r from-[#E0A890] to-[#C98F75] text-white" : ""}
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
            className={selectedDate === new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0] ? "bg-gradient-to-r from-[#E0A890] to-[#C98F75] text-white" : ""}
          >
            Demain
          </Button>
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-auto"
          />
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <Card className="bg-white border-[#DFD3C3]/30">
            <CardContent className="p-4">
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-3xl font-bold text-gray-800">{filteredOrders.length}</p>
            </CardContent>
          </Card>
          <Card className="bg-orange-50 border-orange-200">
            <CardContent className="p-4">
              <p className="text-sm text-orange-700">En attente</p>
              <p className="text-3xl font-bold text-orange-600">{pendingOrders.length}</p>
            </CardContent>
          </Card>
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4">
              <p className="text-sm text-green-700">Récupérées</p>
              <p className="text-3xl font-bold text-green-600">{completedOrders.length}</p>
            </CardContent>
          </Card>
        </div>

        {pendingOrders.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3 text-orange-700">En attente ({pendingOrders.length})</h2>
            <div className="space-y-3">
              {pendingOrders.map(order => {
                const lines = getOrderProducts(order.id);
                return (
                  <Card key={order.id} className="border-orange-200 bg-white hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xl font-bold text-[#C98F75]">#{order.order_number}</span>
                            {order.status === 'Enregistrée (modifiée)' && (
                              <Badge className="bg-orange-100 text-orange-800">Modifiée</Badge>
                            )}
                          </div>
                          <p className="text-lg font-medium mb-1">
                            {order.customer_firstname} {order.customer_name}
                          </p>
                          <p className="text-sm text-gray-600 flex items-center gap-1 mb-3">
                            <Phone className="w-4 h-4" />
                            {order.customer_phone}
                          </p>
                          <div className="flex flex-wrap gap-2 mb-3">
                            {lines.map(line => (
                              <Badge key={line.id} variant="outline" className="text-xs">
                                {line.quantity}x {line.product_name}
                              </Badge>
                            ))}
                          </div>
                          <p className="text-2xl font-bold text-[#C98F75]">
                            {order.total_amount.toFixed(2)} €
                          </p>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button
                            size="lg"
                            onClick={() => markAsPickedUp(order)}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <CheckCircle2 className="w-5 h-5 mr-2" />
                            Récupérée
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(order)}
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
          </div>
        )}

        {completedOrders.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-3 text-green-700">Récupérées ({completedOrders.length})</h2>
            <div className="space-y-2">
              {completedOrders.map(order => {
                const lines = getOrderProducts(order.id);
                return (
                  <Card key={order.id} className="border-green-200 bg-green-50/50 opacity-70">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
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
                        >
                          Voir
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {filteredOrders.length === 0 && (
          <Card className="border-[#DFD3C3]/30">
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