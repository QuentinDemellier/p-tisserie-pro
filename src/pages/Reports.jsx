import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, Package, Store, Euro, Calendar, Download } from "lucide-react";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";

export default function Reports() {
  const [periodType, setPeriodType] = useState("day");
  const [startDate, setStartDate] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const { data: orders = [] } = useQuery({
    queryKey: ['orders'],
    queryFn: () => base44.entities.Order.list('-created_date')
  });

  const { data: orderLines = [] } = useQuery({
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

  const filteredOrders = orders.filter(order => 
    order.pickup_date >= startDate && 
    order.pickup_date <= endDate &&
    order.status !== 'annulee'
  );

  // 1. Ventes par période
  const getSalesByPeriod = () => {
    const salesMap = {};
    
    filteredOrders.forEach(order => {
      let key;
      const date = new Date(order.pickup_date);
      
      if (periodType === "day") {
        key = format(date, 'dd/MM/yyyy', { locale: fr });
      } else if (periodType === "week") {
        const weekStart = startOfWeek(date, { locale: fr });
        key = `Semaine du ${format(weekStart, 'dd/MM', { locale: fr })}`;
      } else if (periodType === "month") {
        key = format(date, 'MMMM yyyy', { locale: fr });
      }
      
      if (!salesMap[key]) {
        salesMap[key] = { period: key, revenue: 0, orders: 0 };
      }
      salesMap[key].revenue += order.total_amount;
      salesMap[key].orders += 1;
    });
    
    return Object.values(salesMap).sort((a, b) => {
      return a.period.localeCompare(b.period);
    });
  };

  // 2. Top produits vendus
  const getTopProducts = () => {
    const productMap = {};
    
    filteredOrders.forEach(order => {
      const lines = orderLines.filter(line => line.order_id === order.id);
      lines.forEach(line => {
        if (!productMap[line.product_name]) {
          productMap[line.product_name] = {
            name: line.product_name,
            quantity: 0,
            revenue: 0
          };
        }
        productMap[line.product_name].quantity += line.quantity;
        productMap[line.product_name].revenue += line.subtotal;
      });
    });
    
    return Object.values(productMap)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);
  };

  // 3. Ventes par boutique
  const getSalesByShop = () => {
    const shopMap = {};
    
    filteredOrders.forEach(order => {
      const shop = shops.find(s => s.id === order.shop_id);
      const shopName = shop?.name || 'Boutique inconnue';
      
      if (!shopMap[shopName]) {
        shopMap[shopName] = {
          name: shopName,
          revenue: 0,
          orders: 0
        };
      }
      shopMap[shopName].revenue += order.total_amount;
      shopMap[shopName].orders += 1;
    });
    
    return Object.values(shopMap).sort((a, b) => b.revenue - a.revenue);
  };

  // 4. Chiffre d'affaires par jour
  const getDailyRevenue = () => {
    const revenueMap = {};
    
    filteredOrders.forEach(order => {
      const date = format(new Date(order.pickup_date), 'dd/MM/yyyy', { locale: fr });
      
      if (!revenueMap[date]) {
        revenueMap[date] = { date, revenue: 0 };
      }
      revenueMap[date].revenue += order.total_amount;
    });
    
    return Object.values(revenueMap).sort((a, b) => {
      const dateA = a.date.split('/').reverse().join('');
      const dateB = b.date.split('/').reverse().join('');
      return dateA.localeCompare(dateB);
    });
  };

  const salesByPeriod = getSalesByPeriod();
  const topProducts = getTopProducts();
  const salesByShop = getSalesByShop();
  const dailyRevenue = getDailyRevenue();

  const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.total_amount, 0);
  const totalOrders = filteredOrders.length;
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const COLORS = ['#E0A890', '#C98F75', '#DFD3C3', '#8BC34A', '#F8EDE3', '#B07E64', '#9B8B7E', '#6B9B37'];

  const exportReport = (data, filename) => {
    const headers = Object.keys(data[0] || {});
    const rows = data.map(item => headers.map(key => item[key]));
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${startDate}_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-[#C98F75]" />
            Rapports et analyses
          </h1>
          <p className="text-sm sm:text-base text-gray-600">Analyses détaillées des ventes et performances</p>
        </div>

        {/* Filtres de période */}
        <Card className="border-[#DFD3C3]/30 shadow-xl bg-white/90 backdrop-blur-sm mb-6">
          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="start_date" className="text-sm">Date de début</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mt-2 border-[#DFD3C3]"
                />
              </div>
              <div>
                <Label htmlFor="end_date" className="text-sm">Date de fin</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                  className="mt-2 border-[#DFD3C3]"
                />
              </div>
              <div>
                <Label className="text-sm">Type de période</Label>
                <Select value={periodType} onValueChange={setPeriodType}>
                  <SelectTrigger className="mt-2 border-[#DFD3C3]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">Par jour</SelectItem>
                    <SelectItem value="week">Par semaine</SelectItem>
                    <SelectItem value="month">Par mois</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistiques globales */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
          <Card className="border-[#DFD3C3]/30 shadow-xl bg-gradient-to-br from-[#E0A890]/10 to-white">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-600 mb-1">Chiffre d'affaires total</p>
                  <p className="text-2xl sm:text-4xl font-bold text-[#C98F75]">{totalRevenue.toFixed(2)} €</p>
                </div>
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#E0A890]/20 rounded-2xl flex items-center justify-center">
                  <Euro className="w-6 h-6 sm:w-8 sm:h-8 text-[#C98F75]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#DFD3C3]/30 shadow-xl bg-gradient-to-br from-blue-50 to-white">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-600 mb-1">Nombre de commandes</p>
                  <p className="text-2xl sm:text-4xl font-bold text-blue-600">{totalOrders}</p>
                </div>
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 rounded-2xl flex items-center justify-center">
                  <Package className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#DFD3C3]/30 shadow-xl bg-gradient-to-br from-green-50 to-white">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-600 mb-1">Panier moyen</p>
                  <p className="text-2xl sm:text-4xl font-bold text-green-600">{averageOrderValue.toFixed(2)} €</p>
                </div>
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-2xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Onglets de rapports */}
        <Tabs defaultValue="period" className="w-full">
          <div className="overflow-x-auto mb-6">
            <TabsList className="bg-white/80 backdrop-blur-sm border border-[#DFD3C3]/30 p-1 inline-flex w-full sm:w-auto">
              <TabsTrigger value="period" className="data-[state=active]:bg-[#E0A890] data-[state=active]:text-white text-xs sm:text-sm whitespace-nowrap">
                Ventes par période
              </TabsTrigger>
              <TabsTrigger value="products" className="data-[state=active]:bg-[#E0A890] data-[state=active]:text-white text-xs sm:text-sm whitespace-nowrap">
                Top produits
              </TabsTrigger>
              <TabsTrigger value="shops" className="data-[state=active]:bg-[#E0A890] data-[state=active]:text-white text-xs sm:text-sm whitespace-nowrap">
                Par boutique
              </TabsTrigger>
              <TabsTrigger value="daily" className="data-[state=active]:bg-[#E0A890] data-[state=active]:text-white text-xs sm:text-sm whitespace-nowrap">
                CA journalier
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Ventes par période */}
          <TabsContent value="period">
            <Card className="border-[#DFD3C3]/30 shadow-xl bg-white/90">
              <CardHeader className="border-b border-[#DFD3C3]/30 bg-gradient-to-r from-[#F8EDE3] to-white">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <CardTitle className="text-lg sm:text-xl">Ventes par {periodType === 'day' ? 'jour' : periodType === 'week' ? 'semaine' : 'mois'}</CardTitle>
                  <Button
                    onClick={() => exportReport(salesByPeriod, 'ventes_par_periode')}
                    variant="outline"
                    className="border-[#DFD3C3] text-xs sm:text-sm"
                    size="sm"
                  >
                    <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                    Exporter
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                {salesByPeriod.length === 0 ? (
                  <p className="text-center py-12 text-gray-500">Aucune donnée sur cette période</p>
                ) : (
                  <>
                    <div className="h-64 sm:h-80 mb-6">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={salesByPeriod}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#DFD3C3" />
                          <XAxis dataKey="period" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="revenue" fill="#E0A890" name="Chiffre d'affaires (€)" />
                          <Bar dataKey="orders" fill="#C98F75" name="Nombre de commandes" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-2">
                      {salesByPeriod.map((item, index) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-[#F8EDE3]/30 rounded-lg text-sm">
                          <span className="font-medium">{item.period}</span>
                          <div className="flex gap-4 text-right">
                            <span className="text-[#C98F75] font-bold">{item.revenue.toFixed(2)} €</span>
                            <span className="text-gray-600">{item.orders} cmd</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Top produits */}
          <TabsContent value="products">
            <Card className="border-[#DFD3C3]/30 shadow-xl bg-white/90">
              <CardHeader className="border-b border-[#DFD3C3]/30 bg-gradient-to-r from-[#F8EDE3] to-white">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <CardTitle className="text-lg sm:text-xl">Top 10 des produits vendus</CardTitle>
                  <Button
                    onClick={() => exportReport(topProducts, 'top_produits')}
                    variant="outline"
                    className="border-[#DFD3C3] text-xs sm:text-sm"
                    size="sm"
                  >
                    <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                    Exporter
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                {topProducts.length === 0 ? (
                  <p className="text-center py-12 text-gray-500">Aucune donnée sur cette période</p>
                ) : (
                  <>
                    <div className="h-64 sm:h-80 mb-6">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={topProducts} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="#DFD3C3" />
                          <XAxis type="number" tick={{ fontSize: 12 }} />
                          <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10 }} />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="quantity" fill="#E0A890" name="Quantité vendue" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-2">
                      {topProducts.map((product, index) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-[#F8EDE3]/30 rounded-lg text-sm">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-[#E0A890] to-[#C98F75] rounded-full flex items-center justify-center text-white font-bold text-xs">
                              {index + 1}
                            </div>
                            <span className="font-medium">{product.name}</span>
                          </div>
                          <div className="flex gap-4 text-right">
                            <span className="text-[#C98F75] font-bold">{product.quantity} vendus</span>
                            <span className="text-gray-600">{product.revenue.toFixed(2)} €</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Ventes par boutique */}
          <TabsContent value="shops">
            <Card className="border-[#DFD3C3]/30 shadow-xl bg-white/90">
              <CardHeader className="border-b border-[#DFD3C3]/30 bg-gradient-to-r from-[#F8EDE3] to-white">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <CardTitle className="text-lg sm:text-xl">Ventes par boutique</CardTitle>
                  <Button
                    onClick={() => exportReport(salesByShop, 'ventes_par_boutique')}
                    variant="outline"
                    className="border-[#DFD3C3] text-xs sm:text-sm"
                    size="sm"
                  >
                    <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                    Exporter
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                {salesByShop.length === 0 ? (
                  <p className="text-center py-12 text-gray-500">Aucune donnée sur cette période</p>
                ) : (
                  <>
                    <div className="h-64 sm:h-80 mb-6">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={salesByShop}
                            dataKey="revenue"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            label={(entry) => `${entry.name}: ${entry.revenue.toFixed(0)}€`}
                          >
                            {salesByShop.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-2">
                      {salesByShop.map((shop, index) => (
                        <div key={index} className="flex justify-between items-center p-4 bg-[#F8EDE3]/30 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-4 h-4 rounded-full" 
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <span className="font-medium">{shop.name}</span>
                          </div>
                          <div className="flex gap-4 text-right">
                            <span className="text-[#C98F75] font-bold">{shop.revenue.toFixed(2)} €</span>
                            <span className="text-gray-600">{shop.orders} cmd</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* CA journalier */}
          <TabsContent value="daily">
            <Card className="border-[#DFD3C3]/30 shadow-xl bg-white/90">
              <CardHeader className="border-b border-[#DFD3C3]/30 bg-gradient-to-r from-[#F8EDE3] to-white">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <CardTitle className="text-lg sm:text-xl">Chiffre d'affaires journalier</CardTitle>
                  <Button
                    onClick={() => exportReport(dailyRevenue, 'ca_journalier')}
                    variant="outline"
                    className="border-[#DFD3C3] text-xs sm:text-sm"
                    size="sm"
                  >
                    <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                    Exporter
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                {dailyRevenue.length === 0 ? (
                  <p className="text-center py-12 text-gray-500">Aucune donnée sur cette période</p>
                ) : (
                  <>
                    <div className="h-64 sm:h-96 mb-6">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={dailyRevenue}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#DFD3C3" />
                          <XAxis dataKey="date" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="revenue" 
                            stroke="#E0A890" 
                            strokeWidth={3}
                            name="CA (€)"
                            dot={{ fill: "#C98F75", r: 4 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {dailyRevenue.map((day, index) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-[#F8EDE3]/30 rounded-lg text-sm">
                          <span className="font-medium">{day.date}</span>
                          <span className="text-[#C98F75] font-bold">{day.revenue.toFixed(2)} €</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}