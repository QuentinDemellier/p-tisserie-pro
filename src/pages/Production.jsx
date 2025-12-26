import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, Factory, Download, Package, Cake, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Production() {
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

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

  const filteredOrders = orders.filter(order => 
    order.pickup_date >= startDate && 
    order.pickup_date <= endDate &&
    order.status !== 'annulee'
  );

  const productionSummary = {};
  filteredOrders.forEach(order => {
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

  const exportProduction = () => {
    const headers = ["Produit", "Quantité totale"];
    const rows = productionList.map(item => [item.name, item.quantity]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `production_${startDate}_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-2">
            <Factory className="w-8 h-8 text-[#C98F75]" />
            Tableau de bord production
          </h1>
          <p className="text-gray-600">Planifiez votre production</p>
        </div>

        <Card className="border-[#DFD3C3]/30 shadow-xl bg-white/90 backdrop-blur-sm mb-6">
          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 items-end">
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
              <Button
                onClick={exportProduction}
                className="bg-gradient-to-r from-[#E0A890] to-[#C98F75] hover:from-[#C98F75] hover:to-[#B07E64] text-white w-full"
              >
                <Download className="w-4 h-4 mr-2" />
                Exporter
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <Card className="border-[#DFD3C3]/30 shadow-xl bg-gradient-to-br from-[#E0A890]/10 to-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5 text-[#C98F75]" />
                Synthèse par produit
              </CardTitle>
            </CardHeader>
            <CardContent>
              {productionList.length === 0 ? (
                <p className="text-center py-8 text-gray-500">Aucune commande sur cette période</p>
              ) : (
                <div className="space-y-3">
                  {productionList.map((item, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center p-4 bg-white rounded-lg border border-[#DFD3C3]/30 hover:shadow-md transition-shadow"
                    >
                      <span className="font-medium text-gray-800">{item.name}</span>
                      <span className="text-2xl font-bold text-[#C98F75]">{item.quantity}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-[#DFD3C3]/30 shadow-xl bg-gradient-to-br from-[#DFD3C3]/10 to-white">
            <CardHeader>
              <CardTitle>Statistiques</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-white rounded-lg border border-[#DFD3C3]/30">
                <p className="text-sm text-gray-600 mb-1">Commandes à préparer</p>
                <p className="text-3xl font-bold text-[#C98F75]">{filteredOrders.length}</p>
              </div>
              <div className="p-4 bg-white rounded-lg border border-[#DFD3C3]/30">
                <p className="text-sm text-gray-600 mb-1">Produits différents</p>
                <p className="text-3xl font-bold text-[#C98F75]">{productionList.length}</p>
              </div>
              <div className="p-4 bg-white rounded-lg border border-[#DFD3C3]/30">
                <p className="text-sm text-gray-600 mb-1">Quantité totale</p>
                <p className="text-3xl font-bold text-[#C98F75]">
                  {productionList.reduce((sum, item) => sum + item.quantity, 0)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-[#DFD3C3]/30 shadow-xl bg-white/90 backdrop-blur-sm">
          <CardHeader className="border-b border-[#DFD3C3]/30 bg-gradient-to-r from-[#F8EDE3] to-white">
            <CardTitle>Détail des commandes</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#F8EDE3]/50">
                    <TableHead>Numéro commande</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Boutique</TableHead>
                    <TableHead>Date retrait</TableHead>
                    <TableHead>Produits</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12 text-gray-500">
                        Aucune commande sur cette période
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredOrders.map(order => {
                      const lines = orderLines.filter(line => line.order_id === order.id);
                      const shop = shops.find(s => s.id === order.shop_id);
                      return (
                        <TableRow key={order.id} className="hover:bg-[#F8EDE3]/20">
                          <TableCell className="font-mono text-sm font-semibold text-[#C98F75]">
                            {order.order_number}
                          </TableCell>
                          <TableCell>
                            {order.customer_firstname} {order.customer_name}
                          </TableCell>
                          <TableCell>{shop?.name || '-'}</TableCell>
                          <TableCell>
                            {format(new Date(order.pickup_date), 'dd MMM yyyy', { locale: fr })}
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {lines.map(line => (
                                <div key={line.id} className="text-sm">
                                  <span className="font-semibold">{line.quantity}x</span> {line.product_name}
                                  {line.customization && (
                                    <p className="text-xs text-gray-600 mt-0.5 ml-4">
                                      → {line.customization}
                                    </p>
                                  )}
                                </div>
                              ))}
                              {order.status === 'enregistree_modifiee' && (
                                <div className="flex items-center gap-1 text-orange-600 text-xs mt-1">
                                  <AlertCircle className="w-3 h-3" />
                                  <span>Commande modifiée</span>
                                </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}