import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Factory, TrendingUp, Truck, Calendar, Package } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function ProductionHome() {
  const today = new Date().toISOString().split('T')[0];

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
      totalAmount
    };
  }).filter(s => s.ordersCount > 0);

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

          <Card className="border-[#DFD3C3]/30 shadow-xl bg-gradient-to-br from-[#F8EDE3] to-white">
            <CardContent className="p-6 flex flex-col gap-2">
              <Link to={createPageUrl("Production")} className="w-full">
                <Button className="w-full bg-gradient-to-r from-[#E0A890] to-[#C98F75] hover:from-[#C98F75] hover:to-[#B07E64] text-white">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Planning complet
                </Button>
              </Link>
              <Link to={createPageUrl("DeliveryPrep")} className="w-full">
                <Button variant="outline" className="w-full border-[#DFD3C3]">
                  <Truck className="w-4 h-4 mr-2" />
                  Préparation livraison
                </Button>
              </Link>
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
                            <div>
                              <h3 className="font-semibold text-lg text-gray-800">{shop.name}</h3>
                              <p className="text-sm text-gray-600">{shop.location}</p>
                            </div>
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
      </div>
    </div>
  );
}