import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Gift, CheckCircle2 } from "lucide-react";
import confetti from "canvas-confetti";
import { toast } from "sonner";

export default function EventOrders() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: orders = [] } = useQuery({
    queryKey: ['orders'],
    queryFn: () => base44.entities.Order.list('-created_date')
  });

  const { data: allOrderLines = [] } = useQuery({
    queryKey: ['orderLines'],
    queryFn: () => base44.entities.OrderLine.list()
  });

  const { data: shops = [] } = useQuery({
    queryKey: ['shops'],
    queryFn: () => base44.entities.Shop.list()
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      toast.success("Commande marquée comme récupérée");
    },
    onError: () => {
      toast.error("Erreur lors de la mise à jour");
    }
  });

  const userShopId = user?.assigned_shop_id;

  // Filter event orders
  const eventOrders = orders.filter(order => {
    if (order.status === 'Annulée') return false;
    if (userShopId && order.shop_id !== userShopId) return false;
    
    const lines = allOrderLines.filter(line => line.order_id === order.id);
    return lines.some(line => {
      const product = products.find(p => p.id === line.product_id);
      const category = categories.find(c => c.id === product?.category_id);
      return product?.is_christmas || product?.is_valentine || product?.is_epiphany ||
             category?.is_christmas || category?.is_valentine || category?.is_epiphany;
    });
  });

  const getOrderLines = (orderId) => {
    return allOrderLines.filter(line => line.order_id === orderId);
  };

  const getEventBadge = (orderId) => {
    const lines = getOrderLines(orderId);
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

  const handleToggleRecovered = (order) => {
    if (order.status === 'Récupérée') {
      updateStatusMutation.mutate({
        id: order.id,
        status: 'Enregistrée',
        oldStatus: order.status
      });
    } else {
      updateStatusMutation.mutate({
        id: order.id,
        status: 'Récupérée',
        oldStatus: order.status
      });
    }
  };

  const completedCount = eventOrders.filter(o => o.status === 'Récupérée').length;

  return (
    <div className="p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-2">
            <Gift className="w-8 h-8 text-[#C98F75]" />
            Récupération de commande
          </h1>
          <p className="text-gray-600">Commandes événementielles à retirer</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className="border-[#DFD3C3]/30 shadow-xl bg-gradient-to-br from-purple-50 to-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total commandes</p>
                  <p className="text-4xl font-bold text-purple-600">{eventOrders.length}</p>
                </div>
                <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center">
                  <Gift className="w-8 h-8 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#DFD3C3]/30 shadow-xl bg-gradient-to-br from-green-50 to-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Récupérées</p>
                  <p className="text-4xl font-bold text-green-600">{completedCount}</p>
                </div>
                <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-[#DFD3C3]/30 shadow-xl bg-white/90">
          <CardHeader className="border-b border-[#DFD3C3]/30 bg-gradient-to-r from-[#F8EDE3] to-white">
            <CardTitle>Liste des commandes</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {eventOrders.length === 0 ? (
              <div className="text-center py-12">
                <Gift className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">Aucune commande événementielle</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-[#F8EDE3]/50">
                      <TableHead>Client</TableHead>
                      <TableHead>Produits</TableHead>
                      <TableHead>N° Ticket</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead className="text-center">Récupérée</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {eventOrders.map(order => {
                      const lines = getOrderLines(order.id);
                      const isRecovered = order.status === 'Récupérée';
                      
                      return (
                        <TableRow 
                          key={order.id} 
                          className={`hover:bg-[#F8EDE3]/20 ${isRecovered ? 'opacity-50 bg-gray-50' : ''}`}
                        >
                          <TableCell>
                            <div className={isRecovered ? 'line-through text-gray-500' : ''}>
                              <p className="font-semibold">{order.customer_firstname} {order.customer_name}</p>
                              <p className="text-sm text-gray-600">{order.customer_phone}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {lines.map(line => (
                                <div key={line.id} className={`text-sm ${isRecovered ? 'text-gray-500' : 'text-gray-700'}`}>
                                  <span className="font-semibold">{line.quantity}x</span> {line.product_name}
                                  {line.customization && (
                                    <div className="text-xs text-gray-500 italic ml-4">
                                      {line.customization}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className={`font-mono text-sm ${isRecovered ? 'text-gray-400' : 'text-[#C98F75] font-semibold'}`}>
                              {order.ticket_number || '-'}
                            </span>
                          </TableCell>
                          <TableCell>{getEventBadge(order.id)}</TableCell>
                          <TableCell>
                            <span className={`font-bold text-lg ${isRecovered ? 'text-gray-400' : 'text-[#C98F75]'}`}>
                              {order.total_amount.toFixed(2)} €
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <Checkbox
                              checked={isRecovered}
                              onCheckedChange={() => handleToggleRecovered(order)}
                              className="h-6 w-6"
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}