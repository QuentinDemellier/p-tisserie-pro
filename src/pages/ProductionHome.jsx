import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Factory, TrendingUp, Truck, Calendar, Package, CheckCircle2, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import confetti from "canvas-confetti";

export default function ProductionHome() {
  const today = new Date().toISOString().split('T')[0];
  const [checkedItems, setCheckedItems] = React.useState({});
  const [selectedShop, setSelectedShop] = React.useState(null);
  const [shopOrdersDialogOpen, setShopOrdersDialogOpen] = React.useState(false);

  const { data: orders = [] } = useQuery({
    queryKey: ['orders'],
    queryFn: () => base44.entities.Order.list()
  });

  const { data: orderLines = [] } = useQuery({
    queryKey: ['orderLines'],
    queryFn: () => base44.entities.OrderLine.list()
  });

  const { data: shops = [] } = useQuery({
    queryKey: ['shops'],
    queryFn: () => base44.entities.Shop.list()
  });

  const todayOrders = orders.filter(order => 
    order.pickup_date === today &&
    order.status !== 'annulee'
  );

  const productionSummary = {};
  todayOrders.forEach(order => {
    const lines = orderLines.filter(line => line.order_id === order.id);
    lines.forEach(line => {
      if (!productionSummary[line.product_name]) {
        productionSummary[line.product_name] = 0;
      }
      productionSummary[line.product_name] += line.quantity;
    });
  });

  const productionList = Object.entries(productionSummary)
    .map(([name, quantity]) => ({ name, quantity }))
    .sort((a, b) => b.quantity - a.quantity);

  const shopStats = shops.map(shop => {
    const shopOrders = todayOrders.filter(o => o.shop_id === shop.id);
    const totalAmount = shopOrders.reduce((sum, o) => sum + o.total_amount, 0);
    return {
      ...shop,
      ordersCount: shopOrders.length,
      orders: shopOrders,
      totalAmount
    };
  }).filter(s => s.ordersCount > 0);

  const handleViewShopOrders = (shop) => {
    setSelectedShop(shop);
    setShopOrdersDialogOpen(true);
  };

  const getStatusColor = (status) => {
    const colors = {
      en_cours: "bg-blue-100 text-blue-800",
      prete: "bg-green-100 text-green-800",
      retiree: "bg-gray-100 text-gray-800",
      annulee: "bg-red-100 text-red-800"
    };
    return colors[status] || colors.en_cours;
  };

  const getStatusLabel = (status) => {
    const labels = {
      en_cours: "En cours",
      prete: "Prête",
      retiree: "Retirée",
      annulee: "Annulée"
    };
    return labels[status] || status;
  };

  // Delivery preparation data
  const deliveryList = shops.map(shop => {
    const shopOrders = todayOrders.filter(o => o.shop_id === shop.id);
    const products = {};
    
    shopOrders.forEach(order => {
      const lines = orderLines.filter(line => line.order_id === order.id);
      lines.forEach(line => {
        const key = line.product_name;
        if (!products[key]) {
          products[key] = {
            name: line.product_name,
            quantity: 0
          };
        }
        products[key].quantity += line.quantity;
      });
    });

    return {
      shop,
      products: Object.values(products),
      totalItems: Object.values(products).reduce((sum, p) => sum + p.quantity, 0)
    };
  }).filter(delivery => delivery.products.length > 0);

  const handleToggle = (shopId, productName) => {
    const key = `${shopId}-${productName}`;
    setCheckedItems(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 }
    });
  };

  const getProgress = (shopId, products) => {
    const total = products.length;
    const checked = products.filter(p => checkedItems[`${shopId}-${p.name}`]).length;
    return { checked, total, percentage: total > 0 ? (checked / total) * 100 : 0 };
  };

  return (
    <div className="p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-2">
            <Factory className="w-8 h-8 text-[#C98F75]" />
            Tableau de bord production
          </h1>
          <p className="text-gray-600">Vue d'ensemble de la production du jour</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="border-[#DFD3C3]/30 shadow-xl bg-gradient-to-br from-orange-50 to-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Commandes du jour</p>
                  <p className="text-4xl font-bold text-orange-600">{todayOrders.length}</p>
                </div>
                <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center">
                  <Calendar className="w-8 h-8 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#DFD3C3]/30 shadow-xl bg-gradient-to-br from-purple-50 to-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Produits différents</p>
                  <p className="text-4xl font-bold text-purple-600">{productionList.length}</p>
                </div>
                <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center">
                  <Package className="w-8 h-8 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#DFD3C3]/30 shadow-xl bg-gradient-to-br from-green-50 to-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Quantité totale</p>
                  <p className="text-4xl font-bold text-green-600">
                    {productionList.reduce((sum, item) => sum + item.quantity, 0)}
                  </p>
                </div>
                <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center">
                  <TrendingUp className="w-8 h-8 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="products" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="products">Production du jour</TabsTrigger>
            <TabsTrigger value="shops">Par boutique</TabsTrigger>
          </TabsList>

          <TabsContent value="products">
            <Card className="border-[#DFD3C3]/30 shadow-xl bg-white/90">
              <CardHeader className="border-b border-[#DFD3C3]/30 bg-gradient-to-r from-[#F8EDE3] to-white">
                <CardTitle>À produire aujourd'hui</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {productionList.length === 0 ? (
                  <p className="text-center py-12 text-gray-500">Aucune production prévue aujourd'hui</p>
                ) : (
                  <div className="grid md:grid-cols-2 gap-4">
                    {productionList.map((item, index) => (
                      <Card key={index} className="border-[#DFD3C3]/30">
                        <CardContent className="p-4 flex justify-between items-center">
                          <span className="font-medium text-gray-800">{item.name}</span>
                          <span className="text-2xl font-bold text-[#C98F75]">{item.quantity}</span>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="shops">
            <Card className="border-[#DFD3C3]/30 shadow-xl bg-white/90">
              <CardHeader className="border-b border-[#DFD3C3]/30 bg-gradient-to-r from-[#F8EDE3] to-white">
                <CardTitle>Répartition par boutique</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {shopStats.length === 0 ? (
                  <p className="text-center py-12 text-gray-500">Aucune commande aujourd'hui</p>
                ) : (
                  <div className="space-y-4">
                    {shopStats.map(shop => (
                      <Card key={shop.id} className="border-[#DFD3C3]/30 hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-center">
                            <button 
                              onClick={() => handleViewShopOrders(shop)}
                              className="text-left hover:opacity-70 transition-opacity flex-1"
                            >
                              <h3 className="font-semibold text-lg text-gray-800 hover:text-[#C98F75] transition-colors flex items-center gap-2">
                                {shop.name}
                                <Eye className="w-4 h-4" />
                              </h3>
                              <p className="text-sm text-gray-600">{shop.location}</p>
                            </button>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-[#C98F75]">{shop.ordersCount}</p>
                              <p className="text-sm text-gray-600">commandes</p>
                              <p className="text-lg font-semibold text-gray-700 mt-1">
                                {shop.totalAmount.toFixed(2)} €
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>


        </Tabs>

        {/* Shop Orders Dialog */}
        <Dialog open={shopOrdersDialogOpen} onOpenChange={setShopOrdersDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">
                Commandes de {selectedShop?.name}
              </DialogTitle>
            </DialogHeader>
            {selectedShop && (
              <div className="space-y-4">
                {selectedShop.orders.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>Aucune commande trouvée</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedShop.orders.map(order => {
                      const lines = orderLines.filter(line => line.order_id === order.id);
                      return (
                        <Card key={order.id} className="border-[#DFD3C3]/30">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <div className="flex items-center gap-3 mb-2">
                                  <span className="font-mono text-sm font-semibold text-[#C98F75]">
                                    {order.order_number}
                                  </span>
                                  <Badge className={getStatusColor(order.status)}>
                                    {getStatusLabel(order.status)}
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-700">
                                  <span className="font-medium">Client :</span> {order.customer_firstname} {order.customer_name}
                                </p>
                                <p className="text-sm text-gray-600">
                                  <span className="font-medium">Téléphone :</span> {order.customer_phone}
                                </p>
                                <p className="text-sm text-gray-600">
                                  <span className="font-medium">Retrait :</span> {format(new Date(order.pickup_date), 'dd MMMM yyyy', { locale: fr })}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-2xl font-bold text-[#C98F75]">{order.total_amount.toFixed(2)} €</p>
                              </div>
                            </div>
                            <div className="border-t border-[#DFD3C3]/30 pt-3">
                              <p className="text-sm font-medium text-gray-700 mb-2">Produits :</p>
                              <div className="space-y-1">
                                {lines.map(line => (
                                  <div key={line.id} className="flex justify-between text-sm">
                                    <span className="text-gray-700">
                                      <span className="font-semibold">{line.quantity}x</span> {line.product_name}
                                      {line.customization && (
                                        <span className="text-gray-500 italic ml-2">({line.customization})</span>
                                      )}
                                    </span>
                                    <span className="text-gray-600">{line.subtotal.toFixed(2)} €</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}