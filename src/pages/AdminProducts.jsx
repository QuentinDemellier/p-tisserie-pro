import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Image as ImageIcon, CheckSquare, Square } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";

export default function AdminProducts() {
  const queryClient = useQueryClient();
  const [editingProduct, setEditingProduct] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [bulkActionDialogOpen, setBulkActionDialogOpen] = useState(false);
  const [bulkAction, setBulkAction] = useState("");
  const [bulkCategoryId, setBulkCategoryId] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    image_url: "",
    category_id: "",
    active: true
  });

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list('-created_date')
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => base44.entities.Category.list('order')
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Product.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success("Produit créé avec succès");
      handleCloseDialog();
    },
    onError: () => toast.error("Erreur lors de la création du produit")
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Product.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success("Produit mis à jour");
      handleCloseDialog();
    },
    onError: () => toast.error("Erreur lors de la mise à jour")
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Product.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success("Produit supprimé");
    },
    onError: () => toast.error("Erreur lors de la suppression")
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ productIds, updates }) => {
      await Promise.all(
        productIds.map(id => base44.entities.Product.update(id, updates))
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setSelectedProducts([]);
      setBulkActionDialogOpen(false);
      setBulkAction("");
      setBulkCategoryId("");
      toast.success("Produits mis à jour avec succès");
    },
    onError: () => toast.error("Erreur lors de la mise à jour groupée")
  });

  const handleOpenDialog = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name || "",
        description: product.description || "",
        price: product.price || "",
        image_url: product.image_url || "",
        category_id: product.category_id || "",
        active: product.active !== false
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: "",
        description: "",
        price: "",
        image_url: "",
        category_id: "",
        active: true
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingProduct(null);
    setFormData({
      name: "",
      description: "",
      price: "",
      image_url: "",
      category_id: "",
      active: true
    });
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.price || !formData.category_id) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    const data = {
      ...formData,
      price: parseFloat(formData.price)
    };

    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedProducts(products.map(p => p.id));
    } else {
      setSelectedProducts([]);
    }
  };

  const handleSelectProduct = (productId, checked) => {
    if (checked) {
      setSelectedProducts([...selectedProducts, productId]);
    } else {
      setSelectedProducts(selectedProducts.filter(id => id !== productId));
    }
  };

  const handleBulkAction = () => {
    if (!bulkAction) {
      toast.error("Veuillez sélectionner une action");
      return;
    }

    if (bulkAction === "change_category" && !bulkCategoryId) {
      toast.error("Veuillez sélectionner une catégorie");
      return;
    }

    let updates = {};
    if (bulkAction === "activate") {
      updates = { active: true };
    } else if (bulkAction === "deactivate") {
      updates = { active: false };
    } else if (bulkAction === "change_category") {
      updates = { category_id: bulkCategoryId };
    }

    bulkUpdateMutation.mutate({ productIds: selectedProducts, updates });
  };

  return (
    <div className="p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Gestion des produits</h1>
            <p className="text-gray-600">Gérez votre catalogue de pâtisseries</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => handleOpenDialog()}
                className="bg-gradient-to-r from-[#E0A890] to-[#C98F75] hover:from-[#C98F75] hover:to-[#B07E64] text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nouveau produit
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingProduct ? "Modifier le produit" : "Nouveau produit"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="name">Nom du produit *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="mt-2"
                    placeholder="Ex: Tarte au citron"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="mt-2"
                    placeholder="Description du produit..."
                    rows={3}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price">Prix (€) *</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: e.target.value})}
                      className="mt-2"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <Label htmlFor="category">Catégorie *</Label>
                    <Select
                      value={formData.category_id}
                      onValueChange={(value) => setFormData({...formData, category_id: value})}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Sélectionnez une catégorie" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(cat => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="image_url">URL de l'image</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      id="image_url"
                      value={formData.image_url}
                      onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                      placeholder="https://..."
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const urls = [
                          "https://images.unsplash.com/photo-1578985545062-69928b1d9587",
                          "https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e",
                          "https://images.unsplash.com/photo-1565958011703-44f9829ba187"
                        ];
                        setFormData({...formData, image_url: urls[Math.floor(Math.random() * urls.length)]});
                      }}
                    >
                      <ImageIcon className="w-4 h-4" />
                    </Button>
                  </div>
                  {formData.image_url && (
                    <img
                      src={formData.image_url}
                      alt="Preview"
                      className="mt-2 w-32 h-32 object-cover rounded-lg"
                    />
                  )}
                </div>

                <div className="flex items-center justify-between p-4 bg-[#F8EDE3]/30 rounded-lg">
                  <div>
                    <Label htmlFor="active">Produit actif</Label>
                    <p className="text-sm text-gray-600">Le produit sera visible dans le catalogue</p>
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
                    {editingProduct ? "Mettre à jour" : "Créer"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {selectedProducts.length > 0 && (
          <Card className="border-[#DFD3C3]/30 shadow-xl bg-gradient-to-r from-[#E0A890] to-[#C98F75] text-white mb-4">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                <div className="flex items-center gap-2">
                  <CheckSquare className="w-5 h-5" />
                  <span className="font-semibold">{selectedProducts.length} produit(s) sélectionné(s)</span>
                </div>
                <div className="flex flex-wrap gap-2 flex-1">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setBulkAction("activate");
                      setBulkActionDialogOpen(true);
                    }}
                    className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                  >
                    Mettre actif
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setBulkAction("deactivate");
                      setBulkActionDialogOpen(true);
                    }}
                    className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                  >
                    Mettre en pause
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setBulkAction("change_category");
                      setBulkActionDialogOpen(true);
                    }}
                    className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                  >
                    Changer la catégorie
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedProducts([])}
                  className="hover:bg-white/20 text-white"
                >
                  Annuler
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="border-[#DFD3C3]/30 shadow-xl bg-white/90 backdrop-blur-sm">
          <CardHeader className="border-b border-[#DFD3C3]/30 bg-gradient-to-r from-[#F8EDE3] to-white">
            <CardTitle>Liste des produits ({products.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#F8EDE3]/50">
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedProducts.length === products.length && products.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Image</TableHead>
                    <TableHead>Nom</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead>Prix</TableHead>
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
                  ) : products.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-gray-500">
                        Aucun produit. Créez votre premier produit !
                      </TableCell>
                    </TableRow>
                  ) : (
                    products.map(product => {
                      const category = categories.find(c => c.id === product.category_id);
                      return (
                        <TableRow key={product.id} className="hover:bg-[#F8EDE3]/20">
                          <TableCell>
                            <Checkbox
                              checked={selectedProducts.includes(product.id)}
                              onCheckedChange={(checked) => handleSelectProduct(product.id, checked)}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-[#F8EDE3] to-[#DFD3C3] overflow-hidden flex items-center justify-center">
                              {product.image_url ? (
                                <img
                                  src={product.image_url}
                                  alt={product.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-2xl">🧁</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-semibold">{product.name}</TableCell>
                          <TableCell className="max-w-xs truncate text-sm text-gray-600">
                            {product.description || '-'}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="border-[#E0A890] text-[#C98F75]">
                              {category?.name || '-'}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-bold text-[#C98F75]">
                            {product.price?.toFixed(2)} €
                          </TableCell>
                          <TableCell>
                            <Badge className={product.active !== false ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                              {product.active !== false ? "Actif" : "Inactif"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenDialog(product)}
                                className="hover:bg-[#E0A890]/10"
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  if (confirm("Êtes-vous sûr de vouloir supprimer ce produit ?")) {
                                    deleteMutation.mutate(product.id);
                                  }
                                }}
                                className="hover:bg-red-50 text-red-600"
                              >
                                <Trash2 className="w-4 h-4" />
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

        <Dialog open={bulkActionDialogOpen} onOpenChange={setBulkActionDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Action groupée</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-sm text-gray-600">
                Vous allez modifier {selectedProducts.length} produit(s)
              </p>
              
              {bulkAction === "activate" && (
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="font-semibold text-green-800">Mettre les produits actifs</p>
                  <p className="text-sm text-green-600 mt-1">
                    Les produits seront visibles dans le catalogue
                  </p>
                </div>
              )}

              {bulkAction === "deactivate" && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="font-semibold text-gray-800">Mettre les produits en pause</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Les produits seront masqués du catalogue
                  </p>
                </div>
              )}

              {bulkAction === "change_category" && (
                <div>
                  <Label htmlFor="bulk_category">Nouvelle catégorie</Label>
                  <Select value={bulkCategoryId} onValueChange={setBulkCategoryId}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Sélectionnez une catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setBulkActionDialogOpen(false);
                    setBulkAction("");
                    setBulkCategoryId("");
                  }}
                  className="flex-1"
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleBulkAction}
                  disabled={bulkUpdateMutation.isPending}
                  className="flex-1 bg-gradient-to-r from-[#E0A890] to-[#C98F75] hover:from-[#C98F75] hover:to-[#B07E64] text-white"
                >
                  {bulkUpdateMutation.isPending ? "En cours..." : "Confirmer"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}