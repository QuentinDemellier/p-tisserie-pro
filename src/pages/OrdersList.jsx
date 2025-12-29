import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Calendar, Store, Eye, Download, Trash2, Pencil, X } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import EditOrderDialog from "../components/order/EditOrderDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

export default function OrdersList() {
  const queryClient = useQueryClient();
  const [tempStatus, setTempStatus] = useState("");
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedShop, setSelectedShop] = useState("all");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderLines, setOrderLines] = useState([]);
  const [statusHistory, setStatusHistory] = useState([]);
  const [editingOrder, setEditingOrder] = useState(null);
  const [editingOrderLines, setEditingOrderLines] = useState([]);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [deleteReason, setDeleteReason] = useState("");

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => base44.entities.Order.list('-created_date')
  });

  const { data: shops = [] } = useQuery({
    queryKey: ['shops'],
    queryFn: () => base44.entities.Shop.list()
  });

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_firstname.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesShop = selectedShop === "all" || order.shop_id === selectedShop;
    const matchesDate = !selectedDate || order.pickup_date === selectedDate;
    
    return matchesSearch && matchesShop && matchesDate;
  });

  const deleteOrderMutation = useMutation({
    mutationFn: async (orderId) => {
      const lines = await base44.entities.OrderLine.filter({ order_id: orderId });
      await Promise.all(lines.map(line => base44.entities.OrderLine.delete(line.id)));
      await base44.entities.Order.delete(orderId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setSelectedOrder(null);
      toast.success("Commande supprimée");
    },
    onError: () => toast.error("Erreur lors de la suppression")
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, oldStatus }) => {
      await base44.entities.Order.update(id, { status });
      const user = await base44.auth.me();
      await base44.entities.OrderStatusHistory.create({
        order_id: id,
        old_status: oldStatus,
        new_status: status,
        changed_by: user.email
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['orderHistory'] });
      toast.success("Statut mis à jour");
    },
    onError: () => toast.error("Erreur lors de la mise à jour")
  });

  useEffect(() => {
    if (selectedOrder) {
      // Synchroniser selectedOrder et tempStatus avec les données actuelles
      const currentOrder = orders.find(o => o.id === selectedOrder.id);
      if (currentOrder) {
        if (currentOrder.status !== tempStatus) {
          setTempStatus(currentOrder.status);
        }
        // Mettre à jour selectedOrder avec les dernières données
        if (JSON.stringify(currentOrder) !== JSON.stringify(selectedOrder)) {
          setSelectedOrder(currentOrder);
        }
      }
    }
  }, [orders, selectedOrder]);

  const handleViewDetails = async (order) => {
    setSelectedOrder(order);
    setTempStatus(order.status || 'Enregistrée');
    const lines = await base44.entities.OrderLine.filter({ order_id: order.id });
    setOrderLines(lines);
    const history = await base44.entities.OrderStatusHistory.filter({ order_id: order.id }, '-created_date');
    setStatusHistory(history);
  };

  const handleEditOrder = async (order) => {
    const lines = await base44.entities.OrderLine.filter({ order_id: order.id });
    setEditingOrder(order);
    setEditingOrderLines(lines);
  };

  const handleCancelOrder = async () => {
    if (!cancelReason.trim()) {
      toast.error("Veuillez indiquer la raison de l'annulation");
      return;
    }
    await updateStatusMutation.mutateAsync({ 
      id: selectedOrder.id, 
      status: 'Annulée', 
      oldStatus: selectedOrder.status 
    });
    await base44.entities.OrderStatusHistory.create({
      order_id: selectedOrder.id,
      old_status: selectedOrder.status,
      new_status: 'Annulée',
      changed_by: user?.email || "inconnu",
      comment: cancelReason
    });
    setCancelDialogOpen(false);
    setCancelReason("");
    setSelectedOrder(null);
    toast.success("Commande annulée");
  };

  const handleDeleteOrder = async () => {
    if (!deleteReason.trim()) {
      toast.error("Veuillez indiquer la raison de la suppression");
      return;
    }
    await deleteOrderMutation.mutateAsync(selectedOrder.id);
    setDeleteDialogOpen(false);
    setDeleteReason("");
  };

  const getStatusColor = (status) => {
    const colors = {
      "Enregistrée": "bg-blue-100 text-blue-800 border-blue-200",
      "Enregistrée (modifiée)": "bg-orange-100 text-orange-800 border-orange-200",
      "En livraison": "bg-purple-100 text-purple-800 border-purple-200",
      "Récupérée": "bg-green-100 text-green-800 border-green-200",
      "Annulée": "bg-red-100 text-red-800 border-red-200"
    };
    return colors[status] || colors["Enregistrée"];
  };

  const exportToCSV = () => {
    const headers = ["Numéro", "Client", "Boutique", "Date retrait", "Montant", "Statut"];
    const rows = filteredOrders.map(order => {
      const shop = shops.find(s => s.id === order.shop_id);
      return [
        order.order_number,
        `${order.customer_firstname} ${order.customer_name}`,
        shop?.name || '',
        format(new Date(order.pickup_date), 'dd/MM/yyyy'),
        `${order.total_amount.toFixed(2)} €`,
        getStatusLabel(order.status)
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `commandes_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Commandes boutique</h1>
            <p className="text-gray-600">Gérez et suivez vos commandes</p>
          </div>
          <Button
            onClick={exportToCSV}
            variant="outline"
            className="border-[#DFD3C3] hover:bg-[#E0A890]/10"
          >
            <Download className="w-4 h-4 mr-2" />
            Exporter en CSV
          </Button>
        </div>

        <Card className="border-[#DFD3C3]/30 shadow-xl bg-white/90 backdrop-blur-sm mb-6">
          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Rechercher par numéro ou client..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 border-[#DFD3C3]"
                />
              </div>

              <div className="relative">
                <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
                <Select value={selectedShop} onValueChange={setSelectedShop}>
                  <SelectTrigger className="pl-10 border-[#DFD3C3]">
                    <SelectValue placeholder="Toutes les boutiques" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les boutiques</SelectItem>
                    {shops.map(shop => (
                      <SelectItem key={shop.id} value={shop.id}>{shop.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="pl-10 border-[#DFD3C3]"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#DFD3C3]/30 shadow-xl bg-white/90 backdrop-blur-sm">
          <CardHeader className="border-b border-[#DFD3C3]/30 bg-gradient-to-r from-[#F8EDE3] to-white">
            <CardTitle>Liste des commandes ({filteredOrders.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#F8EDE3]/50">
                    <TableHead>Numéro</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Boutique</TableHead>
                    <TableHead>Date retrait</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array(5).fill(0).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell colSpan={7}>
                          <div className="h-12 bg-[#DFD3C3]/20 animate-pulse rounded" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : filteredOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-gray-500">
                        Aucune commande trouvée
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredOrders.map(order => {
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
                          <TableCell className="font-bold">
                            {order.total_amount.toFixed(2)} €
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(order.status)}>
                              {getStatusLabel(order.status)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditOrder(order)}
                                className="hover:bg-[#E0A890]/10"
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleViewDetails(order)}
                                className="hover:bg-[#E0A890]/10"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
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
                      <p><span className="font-medium">Boutique :</span> {shops.find(s => s.id === selectedOrder.shop_id)?.name}</p>
                      <p><span className="font-medium">Date :</span> {format(new Date(selectedOrder.pickup_date), 'dd MMMM yyyy', { locale: fr })}</p>
                      <div>
                        <Label className="text-xs text-gray-500 mb-1">Statut de la commande</Label>
                        <Select 
                          value={tempStatus} 
                          onValueChange={(newStatus) => {
                            setTempStatus(newStatus);
                            updateStatusMutation.mutate({
                              id: selectedOrder.id,
                              status: newStatus,
                              oldStatus: selectedOrder.status
                            });
                          }}
                        >
                          <SelectTrigger className="mt-1 w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Enregistrée">Enregistrée</SelectItem>
                            <SelectItem value="Enregistrée (modifiée)">Enregistrée (modifiée)</SelectItem>
                            <SelectItem value="En livraison">En livraison</SelectItem>
                            <SelectItem value="Récupérée">Récupérée</SelectItem>
                            <SelectItem value="Annulée">Annulée</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
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

                {statusHistory.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-[#DFD3C3]/30">
                    <h3 className="font-semibold text-sm text-gray-500 mb-3">Historique des changements de statut</h3>
                    <div className="space-y-2">
                      {statusHistory.map(entry => (
                        <div key={entry.id} className="flex items-center justify-between p-3 bg-[#F8EDE3]/30 rounded-lg text-sm">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className={getStatusColor(entry.old_status)}>
                                {getStatusLabel(entry.old_status)}
                              </Badge>
                              <span className="text-gray-400">→</span>
                              <Badge variant="outline" className={getStatusColor(entry.new_status)}>
                                {getStatusLabel(entry.new_status)}
                              </Badge>
                            </div>
                            <span className="text-gray-600">par {entry.changed_by}</span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {format(new Date(entry.created_date), 'dd/MM/yyyy HH:mm', { locale: fr })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-6 border-t border-[#DFD3C3]/30 flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setCancelDialogOpen(true)}
                    className="flex-1 border-orange-300 text-orange-600 hover:bg-orange-50"
                    disabled={selectedOrder?.status === 'Annulée'}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Annuler la commande
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setDeleteDialogOpen(true)}
                    className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Supprimer la commande
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Cancel Dialog */}
        <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Annuler la commande</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-sm text-gray-600">
                Veuillez indiquer la raison de l'annulation de la commande {selectedOrder?.order_number}
              </p>
              <Textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Raison de l'annulation..."
                className="border-[#DFD3C3]"
                rows={4}
              />
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setCancelDialogOpen(false);
                    setCancelReason("");
                  }}
                  className="flex-1"
                >
                  Retour
                </Button>
                <Button
                  onClick={handleCancelOrder}
                  disabled={updateStatusMutation.isPending}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
                >
                  {updateStatusMutation.isPending ? "Annulation..." : "Confirmer l'annulation"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Supprimer la commande</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-sm text-gray-600">
                Veuillez indiquer la raison de la suppression de la commande {selectedOrder?.order_number}
              </p>
              <p className="text-sm text-red-600 font-semibold">
                ⚠️ Cette action est irréversible et supprimera définitivement la commande.
              </p>
              <Textarea
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="Raison de la suppression..."
                className="border-[#DFD3C3]"
                rows={4}
              />
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setDeleteDialogOpen(false);
                    setDeleteReason("");
                  }}
                  className="flex-1"
                >
                  Retour
                </Button>
                <Button
                  onClick={handleDeleteOrder}
                  disabled={deleteOrderMutation.isPending}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                >
                  {deleteOrderMutation.isPending ? "Suppression..." : "Confirmer la suppression"}
                </Button>
              </div>
            </div>
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