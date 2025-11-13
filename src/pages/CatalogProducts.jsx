import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Image as ImageIcon, ArrowLeft, Pause, Play } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";

export default function CatalogProducts() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editingProduct, setEditingProduct] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    image_url: "",
    category_id: "",
    active: true,
    stock_limit: 0
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

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, active }) => base44.entities.Product.update(id, { active }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success(variables.active ? "Produit réactivé" : "Produit mis en pause");
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

  const handleOpenDialog = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name || "",
        price: product.price || "",
        image_url: product.image_url || "",
        category_id: product.category_id || "",
        active: product.active !== false,
        stock_limit: product.stock_limit || 0
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: "",
        price: "",
        image_url: "",
        category_id: "",
        active: true,
        stock_limit: 0
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingProduct(null);
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.price || !formData.category_id) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    const data = {
      ...formData,
      price: parseFloat(formData.price),
      stock_limit: parseInt(formData.stock_limit) || 0
    };

    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const productsByCategory = categories.map(category => ({
    ...category,
    products: products.filter(p => p.category_id === category.id)
  }));

  return (
    <div className="p-6 md:p-8 bg-gradient-to-br from-[#FBF8F3] to-[#F8EDE3] min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <Button
              variant="ghost"
              onClick={() => navigate(createPageUrl("Production"))}
              className="mb-4 hover:bg-[#E0A890]/10"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour à la production
            </Button>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Catalogue produits</h1>
            <p className="text-gray-600">Gérez vos produits par catégorie</p>
          </div>
          <Button
            onClick={() => handleOpenDialog()}
            className="bg-gradient-to-r from-[#E0A890] to-[#C98F75] hover:from-[#C98F75] hover:to-[#B07E64] text-white shadow-lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nouveau produit
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-6">
            {[1,2,3].map(i => (
              <Card key={i} className="border-[#DFD3C3]/30 animate-pulse">
                <CardHeader className="h-16 bg-[#F8EDE3]/30" />
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {[1,2,3,4].map(j => (
                      <div key={j} className="h-64 bg-[#DFD3C3]/20 rounded-lg" />
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : productsByCategory.length === 0 ? (
          <Card className="border-[#DFD3C3]/30 bg-white/90 backdrop-blur-sm">
            <CardContent className="p-12 text-center">
              <p className="text-gray-500 text-lg">Aucune catégorie. Créez des catégories d'abord.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {productsByCategory.map(category => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="border-[#DFD3C3]/30 shadow-xl bg-white/90 backdrop-blur-sm overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-[#E0A890]/20 to-[#F8EDE3] border-b border-[#DFD3C3]/30">
                    <CardTitle className="flex items-center justify-between">
                      <span className="text-2xl">{category.name}</span>
                      <Badge variant="outline" className="text-lg px-3 py-1">
                        {category.products.length} produit{category.products.length > 1 ? 's' : ''}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    {category.products.length === 0 ? (
                      <p className="text-center py-8 text-gray-500">Aucun produit dans cette catégorie</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {category.products.map(product => (
                          <motion.div
                            key={product.id}
                            whileHover={{ y: -5 }}
                            className="relative group"
                          >
                            <Card className={`overflow-hidden transition-all duration-300 ${
                              product.active === false ? 'opacity-60 border-gray-300' : 'border-[#DFD3C3]/30 hover:shadow-xl'
                            }`}>
                              {product.active === false && (
                                <div className="absolute top-2 right-2 z-10">
                                  <Badge className="bg-gray-500">En pause</Badge>
                                </div>
                              )}
                              <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-[#F8EDE3] to-[#DFD3C3]">
                                {product.image_url ? (
                                  <img
                                    src={product.image_url}
                                    alt={product.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <span className="text-6xl">🧁</span>
                                  </div>
                                )}
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
                                  <Button
                                    size="icon"
                                    variant="secondary"
                                    onClick={() => handleOpenDialog(product)}
                                    className="bg-white hover:bg-gray-100"
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="secondary"
                                    onClick={() => toggleActiveMutation.mutate({ 
                                      id: product.id, 
                                      active: !product.active 
                                    })}
                                    className="bg-white hover:bg-gray-100"
                                  >
                                    {product.active === false ? (
                                      <Play className="w-4 h-4" />
                                    ) : (
                                      <Pause className="w-4 h-4" />
                                    )}
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="secondary"
                                    onClick={() => {
                                      if (confirm(`Supprimer "${product.name}" ?`)) {
                                        deleteMutation.mutate(product.id);
                                      }
                                    }}
                                    className="bg-white hover:bg-red-50 text-red-600"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                              <CardContent className="p-4">
                                <h3 className="font-bold text-lg text-gray-800 mb-2 line-clamp-2">
                                  {product.name}
                                </h3>
                                <div className="flex items-center justify-between">
                                  <span className="text-2xl font-bold text-[#C98F75]">
                                    {product.price?.toFixed(2)} €
                                  </span>
                                  {product.stock_limit > 0 && (
                                    <Badge variant="outline" className="text-xs">
                                      Stock: {product.stock_limit}
                                    </Badge>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">
                {editingProduct ? "Modifier le produit" : "Nouveau produit"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="name">Titre du produit *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="mt-2 text-lg"
                  placeholder="Ex: Tarte au citron meringuée"
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
                    className="mt-2 text-lg"
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
                <Label htmlFor="stock_limit">Limite de stock quotidien</Label>
                <Input
                  id="stock_limit"
                  type="number"
                  min="0"
                  value={formData.stock_limit}
                  onChange={(e) => setFormData({...formData, stock_limit: e.target.value})}
                  className="mt-2"
                  placeholder="0 = illimité"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Nombre maximum d'unités disponibles par jour (0 = illimité)
                </p>
              </div>

              <div>
                <Label htmlFor="image_url">Photo du produit</Label>
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
                        "https://images.unsplash.com/photo-1565958011703-44f9829ba187",
                        "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3",
                        "https://images.unsplash.com/photo-1563805042-7684c019e1cb"
                      ];
                      setFormData({...formData, image_url: urls[Math.floor(Math.random() * urls.length)]});
                    }}
                  >
                    <ImageIcon className="w-4 h-4" />
                  </Button>
                </div>
                {formData.image_url && (
                  <div className="mt-3">
                    <img
                      src={formData.image_url}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between p-4 bg-[#F8EDE3]/30 rounded-lg">
                <div>
                  <Label htmlFor="active">Produit actif</Label>
                  <p className="text-sm text-gray-600">
                    {formData.active ? "Visible dans le catalogue de commande" : "Produit en pause"}
                  </p>
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
                  {editingProduct ? "Mettre à jour" : "Créer le produit"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}