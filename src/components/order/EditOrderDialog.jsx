import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, User, Mail, Phone, Plus, Minus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";

export default function EditOrderDialog({ order, orderLines, onClose }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [comment, setComment] = useState("");
  const [orderData, setOrderData] = useState({
    shop_id: "",
    pickup_date: "",
    customer_name: "",
    customer_firstname: "",
    customer_phone: "",
    customer_email: ""
  });
  const [lines, setLines] = useState([]);

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.filter({ active: true })
  });

  const { data: shops = [] } = useQuery({
    queryKey: ['shops'],
    queryFn: () => base44.entities.Shop.filter({ active: true })
  });

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  useEffect(() => {
    if (order) {
      setOrderData({
        shop_id: order.shop_id,
        pickup_date: order.pickup_date,
        customer_name: order.customer_name,
        customer_firstname: order.customer_firstname,
        customer_phone: order.customer_phone,
        customer_email: order.customer_email
      });
      setLines(orderLines.map(line => ({
        ...line,
        product_id: line.product_id,
        product_name: line.product_name,
        quantity: line.quantity,
        unit_price: line.unit_price,
        customization: line.customization || ""
      })));
    }
  }, [order, orderLines]);

  const updateOrderMutation = useMutation({
    mutationFn: async () => {
      const modifications = [];
      const newTotal = lines.reduce((sum, line) => sum + line.quantity * line.unit_price, 0);

      // Détecter les modifications
      if (orderData.customer_name !== order.customer_name || 
          orderData.customer_firstname !== order.customer_firstname ||
          orderData.customer_phone !== order.customer_phone ||
          orderData.customer_email !== order.customer_email) {
        modifications.push({
          type: "infos_client",
          details: JSON.stringify({
            ancien: {
              nom: order.customer_name,
              prenom: order.customer_firstname,
              telephone: order.customer_phone,
              email: order.customer_email
            },
            nouveau: {
              nom: orderData.customer_name,
              prenom: orderData.customer_firstname,
              telephone: orderData.customer_phone,
              email: orderData.customer_email
            }
          })
        });
      }

      if (orderData.pickup_date !== order.pickup_date) {
        modifications.push({
          type: "date_retrait",
          details: JSON.stringify({
            ancienne: order.pickup_date,
            nouvelle: orderData.pickup_date
          })
        });
      }

      if (orderData.shop_id !== order.shop_id) {
        const oldShop = shops.find(s => s.id === order.shop_id);
        const newShop = shops.find(s => s.id === orderData.shop_id);
        modifications.push({
          type: "boutique",
          details: JSON.stringify({
            ancienne: oldShop?.name || order.shop_id,
            nouvelle: newShop?.name || orderData.shop_id
          })
        });
      }

      // Comparer les lignes
      const originalLineIds = orderLines.map(l => l.id);
      const currentLineIds = lines.filter(l => l.id).map(l => l.id);
      const deletedLines = orderLines.filter(l => !currentLineIds.includes(l.id));
      const addedLines = lines.filter(l => !l.id);
      const modifiedLines = lines.filter(l => {
        const original = orderLines.find(ol => ol.id === l.id);
        return original && (original.quantity !== l.quantity || original.customization !== l.customization);
      });

      if (deletedLines.length > 0) {
        modifications.push({
          type: "produits_supprimes",
          details: JSON.stringify(deletedLines.map(l => ({
            produit: l.product_name,
            quantite: l.quantity
          })))
        });
      }

      if (addedLines.length > 0) {
        modifications.push({
          type: "produits_ajoutes",
          details: JSON.stringify(addedLines.map(l => ({
            produit: l.product_name,
            quantite: l.quantity
          })))
        });
      }

      if (modifiedLines.length > 0) {
        modifications.push({
          type: "quantites_modifiees",
          details: JSON.stringify(modifiedLines.map(l => {
            const original = orderLines.find(ol => ol.id === l.id);
            return {
              produit: l.product_name,
              ancienne_quantite: original.quantity,
              nouvelle_quantite: l.quantity,
              ancienne_personnalisation: original.customization || "",
              nouvelle_personnalisation: l.customization || ""
            };
          }))
        });
      }

      // Mettre à jour la commande
      await base44.entities.Order.update(order.id, {
        ...orderData,
        total_amount: newTotal,
        status: "enregistree_modifiee"
      });

      // Supprimer les anciennes lignes
      for (const line of orderLines) {
        await base44.entities.OrderLine.delete(line.id);
      }

      // Créer les nouvelles lignes
      for (const line of lines) {
        await base44.entities.OrderLine.create({
          order_id: order.id,
          product_id: line.product_id,
          product_name: line.product_name,
          quantity: line.quantity,
          unit_price: line.unit_price,
          customization: line.customization,
          subtotal: line.quantity * line.unit_price
        });
      }

      // Enregistrer les modifications
      for (const mod of modifications) {
        await base44.entities.OrderModification.create({
          order_id: order.id,
          modified_by: user?.email || "inconnu",
          modification_type: mod.type,
          details: mod.details,
          comment: comment
        });
      }

      await base44.entities.OrderStatusHistory.create({
        order_id: order.id,
        old_status: order.status,
        new_status: "enregistree_modifiee",
        changed_by: user?.email || "inconnu",
        comment: comment || "Commande modifiée"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['orderLines'] });
      toast.success("Commande modifiée avec succès");
      onClose();
    },
    onError: () => {
      toast.error("Erreur lors de la modification");
    }
  });

  const addLine = () => {
    setLines([...lines, {
      product_id: "",
      product_name: "",
      quantity: 1,
      unit_price: 0,
      customization: ""
    }]);
  };

  const updateLine = (index, field, value) => {
    const newLines = [...lines];
    newLines[index][field] = value;

    if (field === "product_id") {
      const product = products.find(p => p.id === value);
      if (product) {
        newLines[index].product_name = product.name;
        newLines[index].unit_price = product.price;
      }
    }

    setLines(newLines);
  };

  const removeLine = (index) => {
    setLines(lines.filter((_, i) => i !== index));
  };

  const totalAmount = lines.reduce((sum, line) => sum + line.quantity * line.unit_price, 0);

  return (
    <Dialog open={!!order} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Modifier la commande {order?.order_number}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="shop">Boutique de retrait *</Label>
              <Select value={orderData.shop_id} onValueChange={(value) => setOrderData({...orderData, shop_id: value})}>
                <SelectTrigger className="mt-2 border-[#DFD3C3]">
                  <SelectValue placeholder="Sélectionnez une boutique" />
                </SelectTrigger>
                <SelectContent>
                  {shops.map(shop => (
                    <SelectItem key={shop.id} value={shop.id}>
                      {shop.name} - {shop.location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="pickup_date">Date de retrait *</Label>
              <div className="relative mt-2">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="pickup_date"
                  type="date"
                  value={orderData.pickup_date}
                  onChange={(e) => setOrderData({...orderData, pickup_date: e.target.value})}
                  className="pl-10 border-[#DFD3C3]"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="customer_firstname">Prénom *</Label>
              <div className="relative mt-2">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="customer_firstname"
                  value={orderData.customer_firstname}
                  onChange={(e) => setOrderData({...orderData, customer_firstname: e.target.value})}
                  className="pl-10 border-[#DFD3C3]"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="customer_name">Nom *</Label>
              <div className="relative mt-2">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="customer_name"
                  value={orderData.customer_name}
                  onChange={(e) => setOrderData({...orderData, customer_name: e.target.value})}
                  className="pl-10 border-[#DFD3C3]"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="customer_phone">Téléphone *</Label>
              <div className="relative mt-2">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="customer_phone"
                  type="tel"
                  value={orderData.customer_phone}
                  onChange={(e) => setOrderData({...orderData, customer_phone: e.target.value})}
                  className="pl-10 border-[#DFD3C3]"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="customer_email">Email *</Label>
              <div className="relative mt-2">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="customer_email"
                  type="email"
                  value={orderData.customer_email}
                  onChange={(e) => setOrderData({...orderData, customer_email: e.target.value})}
                  className="pl-10 border-[#DFD3C3]"
                />
              </div>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-3">
              <Label>Produits commandés</Label>
              <Button onClick={addLine} variant="outline" size="sm" className="border-[#DFD3C3]">
                <Plus className="w-4 h-4 mr-2" />
                Ajouter un produit
              </Button>
            </div>
            <div className="space-y-3">
              {lines.map((line, index) => (
                <Card key={index} className="border-[#DFD3C3]/30">
                  <CardContent className="p-4">
                    <div className="grid grid-cols-12 gap-3 items-start">
                      <div className="col-span-5">
                        <Select 
                          value={line.product_id} 
                          onValueChange={(value) => updateLine(index, "product_id", value)}
                        >
                          <SelectTrigger className="border-[#DFD3C3]">
                            <SelectValue placeholder="Produit" />
                          </SelectTrigger>
                          <SelectContent>
                            {products.map(p => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.name} - {p.price.toFixed(2)} €
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-9 w-9"
                            onClick={() => updateLine(index, "quantity", Math.max(1, line.quantity - 1))}
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <Input
                            type="number"
                            min="1"
                            value={line.quantity}
                            onChange={(e) => updateLine(index, "quantity", parseInt(e.target.value) || 1)}
                            className="text-center border-[#DFD3C3] h-9"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-9 w-9"
                            onClick={() => updateLine(index, "quantity", line.quantity + 1)}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="col-span-4">
                        <Input
                          placeholder="Personnalisation"
                          value={line.customization}
                          onChange={(e) => updateLine(index, "customization", e.target.value)}
                          className="border-[#DFD3C3]"
                        />
                      </div>
                      <div className="col-span-1 flex justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeLine(index)}
                          className="text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="mt-2 text-right">
                      <span className="text-sm font-semibold text-[#C98F75]">
                        {(line.quantity * line.unit_price).toFixed(2)} €
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="comment">Commentaire sur la modification</Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="mt-2 border-[#DFD3C3]"
              placeholder="Raison de la modification..."
              rows={3}
            />
          </div>

          <div className="pt-4 border-t-2 border-[#E0A890] flex justify-between items-center">
            <span className="text-xl font-bold">Total</span>
            <span className="text-2xl font-bold text-[#C98F75]">
              {totalAmount.toFixed(2)} €
            </span>
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Annuler
            </Button>
            <Button
              onClick={() => updateOrderMutation.mutate()}
              disabled={updateOrderMutation.isPending || lines.length === 0}
              className="flex-1 bg-gradient-to-r from-[#E0A890] to-[#C98F75] hover:from-[#C98F75] hover:to-[#B07E64] text-white"
            >
              {updateOrderMutation.isPending ? "Enregistrement..." : "Enregistrer les modifications"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}