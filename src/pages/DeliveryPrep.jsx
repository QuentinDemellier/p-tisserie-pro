import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Truck, Package, CheckCircle2, Download, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import confetti from "canvas-confetti";

export default function DeliveryPrep() {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

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

  const { data: deliveryItems = [] } = useQuery({
    queryKey: ['deliveryItems', selectedDate],
    queryFn: () => base44.entities.DeliveryItem.filter({ delivery_date: selectedDate })
  });

  const updateDeliveryItemMutation = useMutation({
    mutationFn: async ({ delivery_date, shop_id, product_name, checked }) => {
      const existingItem = deliveryItems.find(
        item => item.shop_id === shop_id && item.product_name === product_name
      );
      
      if (existingItem) {
        await base44.entities.DeliveryItem.update(existingItem.id, { checked });
      } else {
        await base44.entities.DeliveryItem.create({
          delivery_date,
          shop_id,
          product_name,
          checked
        });
      }
    },
    onMutate: async ({ delivery_date, shop_id, product_name, checked }) => {
      await queryClient.cancelQueries({ queryKey: ['deliveryItems', selectedDate] });
      
      const previousItems = queryClient.getQueryData(['deliveryItems', selectedDate]);
      
      queryClient.setQueryData(['deliveryItems', selectedDate], (old = []) => {
        const existingItem = old.find(
          item => item.shop_id === shop_id && item.product_name === product_name
        );
        
        if (existingItem) {
          return old.map(item => 
            item.shop_id === shop_id && item.product_name === product_name
              ? { ...item, checked }
              : item
          );
        } else {
          return [...old, { delivery_date, shop_id, product_name, checked }];
        }
      });
      
      return { previousItems };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['deliveryItems', selectedDate], context.previousItems);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveryItems', selectedDate] });
    }
  });

  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }) => {
      await base44.entities.Order.update(orderId, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    }
  });

  const filteredOrders = orders.filter(order => 
    order.pickup_date === selectedDate &&
    order.status !== 'annulee'
  );

  // Regrouper les produits par boutique
  const deliveryList = shops.map(shop => {
    const shopOrders = filteredOrders.filter(o => o.shop_id === shop.id);
    const products = {};
    
    shopOrders.forEach(order => {
      const lines = orderLines.filter(line => line.order_id === order.id);
      lines.forEach(line => {
        const key = line.product_name;
        if (!products[key]) {
          products[key] = {
            name: line.product_name,
            quantity: 0,
            orders: []
          };
        }
        products[key].quantity += line.quantity;
        products[key].orders.push({
          orderNumber: order.order_number,
          quantity: line.quantity,
          customization: line.customization
        });
      });
    });

    return {
      shop,
      products: Object.values(products),
      totalItems: Object.values(products).reduce((sum, p) => sum + p.quantity, 0)
    };
  }).filter(delivery => delivery.products.length > 0);

  const handleToggle = (shopId, productName) => {
    const existingItem = deliveryItems.find(
      item => item.shop_id === shopId && item.product_name === productName
    );
    const newCheckedState = !existingItem?.checked;
    
    updateDeliveryItemMutation.mutate({
      delivery_date: selectedDate,
      shop_id: shopId,
      product_name: productName,
      checked: newCheckedState
    });

    if (newCheckedState) {
      const shopOrders = filteredOrders.filter(o => o.shop_id === shopId);
      shopOrders.forEach(order => {
        const lines = orderLines.filter(line => line.order_id === order.id);
        const hasProduct = lines.some(line => line.product_name === productName);
        if (hasProduct && (order.status === 'Enregistrée' || order.status === 'Enregistrée (modifiée)')) {
          updateOrderStatusMutation.mutate({
            orderId: order.id,
            status: 'En livraison'
          });
        }
      });

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 }
      });
    }
  };

  const isItemChecked = (shopId, productName) => {
    const item = deliveryItems.find(
      item => item.shop_id === shopId && item.product_name === productName
    );
    return item?.checked || false;
  };

  const getProgress = (shopId, products) => {
    const total = products.length;
    const checked = products.filter(p => isItemChecked(shopId, p.name)).length;
    return { checked, total, percentage: total > 0 ? (checked / total) * 100 : 0 };
  };

  const exportDeliveryList = () => {
    const headers = ["Boutique", "Produit", "Quantité", "Détails"];
    const rows = [];

    deliveryList.forEach(({ shop, products }) => {
      products.forEach(product => {
        const details = product.orders.map(o => 
          `${o.orderNumber} (${o.quantity}x)${o.customization ? ` - ${o.customization}` : ''}`
        ).join(' | ');
        rows.push([shop.name, product.name, product.quantity, details]);
      });
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `preparation_livraison_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-2">
            <Truck className="w-8 h-8 text-[#C98F75]" />
            Préparation livraison
          </h1>
          <p className="text-gray-600 mb-6">Liste des produits à charger</p>
          
          <Card className="border-[#DFD3C3]/30 shadow-xl bg-white/90 backdrop-blur-sm mb-6">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col gap-4">
                <div className="flex-1">
                  <Label htmlFor="delivery_date" className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4" />
                    Date de livraison
                  </Label>
                  <Input
                    id="delivery_date"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="border-[#DFD3C3]"
                  />
                </div>
                <Button
                  onClick={exportDeliveryList}
                  variant="outline"
                  className="border-[#DFD3C3] hover:bg-[#E0A890]/10"
                  disabled={deliveryList.length === 0}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exporter la liste
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {deliveryList.length === 0 ? (
          <Card className="border-[#DFD3C3]/30 shadow-xl bg-white/90">
            <CardContent className="p-12 text-center">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">Aucune livraison prévue aujourd'hui</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {deliveryList.map(({ shop, products, totalItems }) => {
              const progress = getProgress(shop.id, products);
              const isComplete = progress.percentage === 100;

              return (
                <Card key={shop.id} className="border-[#DFD3C3]/30 shadow-xl bg-white/90 backdrop-blur-sm">
                  <CardHeader className={`border-b border-[#DFD3C3]/30 ${isComplete ? 'bg-green-50' : 'bg-gradient-to-r from-[#F8EDE3] to-white'}`}>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 ${isComplete ? 'bg-green-500' : 'bg-gradient-to-br from-[#E0A890] to-[#C98F75]'} rounded-xl flex items-center justify-center`}>
                          {isComplete ? (
                            <CheckCircle2 className="w-6 h-6 text-white" />
                          ) : (
                            <Package className="w-6 h-6 text-white" />
                          )}
                        </div>
                        <div>
                          <CardTitle className="text-xl">{shop.name}</CardTitle>
                          <p className="text-sm text-gray-600">{shop.location}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="text-lg px-3 py-1 mb-2">
                          {totalItems} articles
                        </Badge>
                        <div className="text-sm text-gray-600">
                          {progress.checked} / {progress.total} produits chargés
                        </div>
                      </div>
                    </div>
                    {!isComplete && (
                      <div className="mt-4">
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-[#E0A890] to-[#C98F75] transition-all duration-300"
                            style={{ width: `${progress.percentage}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      {products.map(product => {
                        const isChecked = isItemChecked(shop.id, product.name);
                        return (
                          <div 
                            key={product.name}
                            className={`flex items-start gap-4 p-4 rounded-lg border transition-all ${
                              isChecked 
                                ? 'bg-green-50 border-green-200' 
                                : 'bg-white border-[#DFD3C3]/30 hover:border-[#E0A890]'
                            }`}
                          >
                            <Checkbox
                              id={`${shop.id}-${product.name}`}
                              checked={isChecked}
                              onCheckedChange={() => handleToggle(shop.id, product.name)}
                              className="mt-1"
                            />
                            <label
                              htmlFor={`${shop.id}-${product.name}`}
                              className="flex-1 cursor-pointer"
                            >
                              <div className="flex justify-between items-start mb-2">
                                <span className={`font-semibold text-lg ${isChecked ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                                  {product.name}
                                </span>
                                <Badge className={isChecked ? 'bg-green-500' : 'bg-[#E0A890]'}>
                                  {product.quantity}x
                                </Badge>
                              </div>
                              <div className="space-y-1 text-sm text-gray-600">
                                {product.orders.map((order, idx) => (
                                  <div key={idx} className="flex items-start gap-2">
                                    <span className="font-mono text-xs text-[#C98F75]">{order.orderNumber}</span>
                                    <span>→ {order.quantity}x</span>
                                    {order.customization && (
                                      <span className="italic text-gray-500">({order.customization})</span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}