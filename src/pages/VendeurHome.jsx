import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Calendar, CheckCircle2, Package } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import confetti from "canvas-confetti";
import { toast } from "sonner";

export default function VendeurHome() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const today = new Date().toISOString().split('T')[0];

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
      toast.success("Commande marquée comme retirée");
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  });

  const userShopId = user?.assigned_shop_id;
  const userShop = shops.find(s => s.id === userShopId);

  const todayOrders = orders.filter(order => 
    order.pickup_date === today && 
    order.shop_id === userShopId &&
    order.status !== 'annulee' &&
    order.status !== 'retiree'
  );

  const completedToday = orders.filter(order => 
    order.pickup_date === today && 
    order.shop_id === userShopId &&
    order.status === 'retiree'
  ).length;

  const getStatusColor = (status) => {
    const colors = {
      en_cours: "bg-blue-100 text-blue-800",
      prete: "bg-green-100 text-green-800",
      retiree: "bg-gray-100 text-gray-800"
    };
    return colors[status] || colors.en_cours;
  };

  const getStatusLabel = (status) => {
    const labels = {
      en_cours: "En cours",
      prete: "Prête",
      retiree: "Retirée"
    };
    return labels[status] || status;
  };

  return (
    <div className="p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-2">
            <ShoppingCart className="w-8 h-8 text-[#C98F75]" />
            Tableau de bord vendeur
          </h1>
          {userShop && (
            <p className="text-gray-600 text-lg">Boutique : <span className="font-semibold">{userShop.name}</span></p>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="border-[#DFD3C3]/30 shadow-xl bg-gradient-to-br from-blue-50 to-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">À retirer aujourd'hui</p>
                  <p className="text-4xl font-bold text-blue-600">{todayOrders.length}</p>
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
                  <p className="text-sm text-gray-600 mb-1">Retirées aujourd'hui</p>
                  <p className="text-4xl font-bold text-green-600">{completedToday}</p>
                </div>
                <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#DFD3C3]/30 shadow-xl bg-gradient-to-br from-[#F8EDE3] to-white">
            <CardContent className="p-6 flex items-center justify-center">
              <Link to={createPageUrl("NewOrder")} className="w-full">
                <Button className="w-full h-full bg-gradient-to-r from-[#E0A890] to-[#C98F75] hover:from-[#C98F75] hover:to-[#B07E64] text-white text-lg py-6">
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Nouvelle commande
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <Card className="border-[#DFD3C3]/30 shadow-xl bg-white/90 backdrop-blur-sm">
          <CardHeader className="border-b border-[#DFD3C3]/30 bg-gradient-to-r from-[#F8EDE3] to-white">
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-[#C98F75]" />
              Commandes à retirer aujourd'hui
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {todayOrders.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">Aucune commande à retirer aujourd'hui</p>
              </div>
            ) : (
              <div className="space-y-4">
                {todayOrders.map(order => (
                  <Card key={order.id} className="border-[#DFD3C3]/30 hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="font-mono font-semibold text-[#C98F75] text-lg">
                              {order.order_number}
                            </span>
                            <Badge className={getStatusColor(order.status)}>
                              {getStatusLabel(order.status)}
                            </Badge>
                          </div>
                          <p className="text-gray-700 mb-1">
                            <span className="font-medium">Client :</span> {order.customer_firstname} {order.customer_name}
                          </p>
                          <p className="text-gray-600 text-sm">
                            <span className="font-medium">Téléphone :</span> {order.customer_phone}
                          </p>
                          <p className="text-xl font-bold text-[#C98F75] mt-2">
                            {order.total_amount.toFixed(2)} €
                          </p>
                        </div>
                        <div className="flex flex-col gap-2">
                          {order.status === 'prete' && (
                            <Button
                              onClick={() => updateStatusMutation.mutate({
                                id: order.id,
                                status: 'retiree',
                                oldStatus: order.status
                              })}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              Marquer comme retirée
                            </Button>
                          )}
                          <Link to={createPageUrl("OrdersList")}>
                            <Button variant="outline" className="w-full border-[#DFD3C3]">
                              Voir détails
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}