import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Trash2, Store, MapPin } from "lucide-react";
import { toast } from "sonner";

export default function AdminShops() {
  const queryClient = useQueryClient();
  const [editingShop, setEditingShop] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    active: true
  });

  const { data: shops = [], isLoading } = useQuery({
    queryKey: ['shops'],
    queryFn: () => base44.entities.Shop.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Shop.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shops'] });
      toast.success("Boutique créée avec succès");
      handleCloseDialog();
    },
    onError: () => toast.error("Erreur lors de la création de la boutique")
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Shop.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shops'] });
      toast.success("Boutique mise à jour");
      handleCloseDialog();
    },
    onError: () => toast.error("Erreur lors de la mise à jour")
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Shop.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shops'] });
      toast.success("Boutique supprimée");
    },
    onError: () => toast.error("Erreur lors de la suppression")
  });

  const handleOpenDialog = (shop = null) => {
    if (shop) {
      setEditingShop(shop);
      setFormData({
        name: shop.name || "",
        location: shop.location || "",
        active: shop.active !== false
      });
    } else {
      setEditingShop(null);
      setFormData({
        name: "",
        location: "",
        active: true
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingShop(null);
    setFormData({
      name: "",
      location: "",
      active: true
    });
  };

  const handleSubmit = () => {
    if (!formData.name) {
      toast.error("Le nom de la boutique est obligatoire");
      return;
    }

    if (editingShop) {
      updateMutation.mutate({ id: editingShop.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <div className="p-6 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Gestion des boutiques</h1>
            <p className="text-gray-600">Gérez vos points de vente</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => handleOpenDialog()}
                className="bg-gradient-to-r from-[#E0A890] to-[#C98F75] hover:from-[#C98F75] hover:to-[#B07E64] text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nouvelle boutique
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editingShop ? "Modifier la boutique" : "Nouvelle boutique"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="name">Nom de la boutique *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="mt-2"
                    placeholder="Ex: Poitiers Centre"
                  />
                </div>

                <div>
                  <Label htmlFor="location">Adresse / Localisation</Label>
                  <Textarea
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    className="mt-2"
                    placeholder="Adresse complète..."
                    rows={3}
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-[#F8EDE3]/30 rounded-lg">
                  <div>
                    <Label htmlFor="active">Boutique active</Label>
                    <p className="text-sm text-gray-600">La boutique sera disponible pour les commandes</p>
                  </div>
                  <Switch
                    id="active"
                    checked={formData.active}
                    onCheckedChange={(checked) => setFormData({...formData, active: checked})}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={handleCloseDialog}
                    className="flex-1"
                  >
                    Annuler
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="flex-1 bg-gradient-to-r from-[#E0A890] to-[#C98F75] hover:from-[#C98F75] hover:to-[#B07E64] text-white"
                  >
                    {editingShop ? "Mettre à jour" : "Créer"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="border-[#DFD3C3]/30 shadow-xl bg-white/90 backdrop-blur-sm">
          <CardHeader className="border-b border-[#DFD3C3]/30 bg-gradient-to-r from-[#F8EDE3] to-white">
            <CardTitle className="flex items-center gap-2">
              <Store className="w-5 h-5 text-[#C98F75]" />
              Liste des boutiques ({shops.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-4">
                {Array(3).fill(0).map((_, i) => (
                  <div key={i} className="h-20 bg-[#DFD3C3]/20 animate-pulse rounded" />
                ))}
              </div>
            ) : shops.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <Store className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Aucune boutique. Créez votre première boutique !</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-[#F8EDE3]/50">
                      <TableHead>Nom</TableHead>
                      <TableHead>Localisation</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {shops.map(shop => (
                      <TableRow key={shop.id} className="hover:bg-[#F8EDE3]/20">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#E0A890] to-[#C98F75] flex items-center justify-center">
                              <Store className="w-6 h-6 text-white" />
                            </div>
                            <span className="font-semibold text-lg">{shop.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-start gap-2 text-gray-600">
                            <MapPin className="w-4 h-4 mt-1 flex-shrink-0" />
                            <span>{shop.location || '-'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={shop.active !== false ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                            {shop.active !== false ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenDialog(shop)}
                              className="hover:bg-[#E0A890]/10"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                if (confirm("Êtes-vous sûr de vouloir supprimer cette boutique ?")) {
                                  deleteMutation.mutate(shop.id);
                                }
                              }}
                              className="hover:bg-red-50 text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
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