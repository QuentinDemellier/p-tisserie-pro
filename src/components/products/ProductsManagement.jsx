import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Pencil, Trash2, Image as ImageIcon, CheckSquare, Pause, Play } from "lucide-react";
import { toast } from "sonner";

export default function ProductsManagement() {
  const queryClient = useQueryClient();

  // Product states
  const [editingProduct, setEditingProduct] = useState(null);
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [bulkActionDialogOpen, setBulkActionDialogOpen] = useState(false);
  const [bulkAction, setBulkAction] = useState("");
  const [bulkCategoryId, setBulkCategoryId] = useState("");
  const [productFilterCategory, setProductFilterCategory] = useState("all");
  const [productFilterStatus, setProductFilterStatus] = useState("all");
  const [productSortOrder, setProductSortOrder] = useState("default");
  const [productFormData, setProductFormData] = useState({
    name: "",
    price: "",
    image_url: "",
    category_id: "",
    active: true,
    current_stock: 0,
    unlimited_stock: true
  });

  // Queries
  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list('-created_date')
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => base44.entities.Category.list('order')
  });

  // Product mutations
  const createProductMutation = useMutation({
    mutationFn: (data) => base44.entities.Product.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success("Produit créé");
      setProductDialogOpen(false);
    }
  });

  const updateProductMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Product.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success("Produit mis à jour");
      setProductDialogOpen(false);
    }
  });

  const deleteProductMutation = useMutation({
    mutationFn: (id) => base44.entities.Product.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success("Produit supprimé");
    }
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, active }) => base44.entities.Product.update(id, { active }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success(variables.active ? "Produit réactivé" : "Produit mis en pause");
    },
    onError: () => toast.error("Erreur lors de la mise à jour")
  });

  const bulkUpdateProductMutation = useMutation({
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

  // Product handlers
  const handleOpenProductDialog = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setProductFormData({
        name: product.name || "",
        price: product.price || "",
        image_url: product.image_url || "",
        category_id: product.category_id || "",
        active: product.active !== false,
        current_stock: product.current_stock || 0,
        unlimited_stock: product.unlimited_stock !== false
      });
    } else {
      setEditingProduct(null);
      setProductFormData({ name: "", price: "", image_url: "", category_id: "", active: true, current_stock: 0, unlimited_stock: true });
    }
    setProductDialogOpen(true);
  };

  const handleProductSubmit = () => {
    if (!productFormData.name || !productFormData.price || !productFormData.category_id) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }
    
    const selectedCategory = categories.find(c => c.id === productFormData.category_id);

    const data = { 
      ...productFormData, 
      price: parseFloat(productFormData.price),
      unlimited_stock: productFormData.unlimited_stock,
      current_stock: parseInt(productFormData.current_stock) || 0,
      is_christmas: selectedCategory?.is_christmas === true,
      is_valentine: selectedCategory?.is_valentine === true,
      is_epiphany: selectedCategory?.is_epiphany === true,
      is_custom_event: selectedCategory?.is_custom_event === true
    };
    
    if (editingProduct) {
      updateProductMutation.mutate({ id: editingProduct.id, data });
    } else {
      createProductMutation.mutate(data);
    }
  };

  const handleSelectAllProducts = (checked) => {
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

    bulkUpdateProductMutation.mutate({ productIds: selectedProducts, updates });
  };

  return (
    <>
      <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
        <div className="flex flex-wrap gap-2">
          <Select value={productFilterCategory} onValueChange={setProductFilterCategory}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Catégorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les catégories</SelectItem>
              {categories.map(cat => {
                let emoji = '';
                if (cat.is_christmas === true) emoji = '🎄 ';
                if (cat.is_valentine === true) emoji = '❤️ ';
                if (cat.is_epiphany === true) emoji = '👑 ';
                if (cat.is_custom_event === true) emoji = (cat.event_icon || '🎉') + ' ';
                return (
                  <SelectItem key={cat.id} value={cat.id}>
                    {emoji}{cat.name}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          <Select value={productFilterStatus} onValueChange={setProductFilterStatus}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="active">Actif</SelectItem>
              <SelectItem value="inactive">Inactif</SelectItem>
            </SelectContent>
          </Select>
          <Select value={productSortOrder} onValueChange={setProductSortOrder}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tri" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Plus récent</SelectItem>
              <SelectItem value="name-asc">Nom (A-Z)</SelectItem>
              <SelectItem value="name-desc">Nom (Z-A)</SelectItem>
              <SelectItem value="price-asc">Prix croissant</SelectItem>
              <SelectItem value="price-desc">Prix décroissant</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => handleOpenProductDialog()} className="bg-gradient-to-r from-[#E0A890] to-[#C98F75] hover:from-[#C98F75] hover:to-[#B07E64] text-white">
          <Plus className="w-4 h-4 mr-2" />
          Nouveau produit
        </Button>
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

      <Card className="border-[#DFD3C3]/30 shadow-xl bg-white/90">
        <CardHeader className="border-b border-[#DFD3C3]/30 bg-gradient-to-r from-[#F8EDE3] to-white">
          <CardTitle>Liste des produits ({products.filter(product => {
            if (productFilterCategory !== "all" && product.category_id !== productFilterCategory) return false;
            if (productFilterStatus === "active" && product.active === false) return false;
            if (productFilterStatus === "inactive" && product.active !== false) return false;
            return true;
          }).length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#F8EDE3]/50">
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedProducts.length === products.length && products.length > 0}
                      onCheckedChange={handleSelectAllProducts}
                    />
                  </TableHead>
                  <TableHead>Image</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Prix</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingProducts ? (
                  Array(5).fill(0).map((_, i) => (
                    <TableRow key={i}><TableCell colSpan={8}><div className="h-12 bg-[#DFD3C3]/20 animate-pulse rounded" /></TableCell></TableRow>
                  ))
                ) : products.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-12 text-gray-500">Aucun produit</TableCell></TableRow>
                ) : (
                  products.filter(product => {
                    if (productFilterCategory !== "all" && product.category_id !== productFilterCategory) return false;
                    if (productFilterStatus === "active" && product.active === false) return false;
                    if (productFilterStatus === "inactive" && product.active !== false) return false;
                    return true;
                  }).sort((a, b) => {
                    if (productSortOrder === "name-asc") {
                      return (a.name || "").localeCompare(b.name || "");
                    } else if (productSortOrder === "name-desc") {
                      return (b.name || "").localeCompare(a.name || "");
                    } else if (productSortOrder === "price-asc") {
                      return (a.price || 0) - (b.price || 0);
                    } else if (productSortOrder === "price-desc") {
                      return (b.price || 0) - (a.price || 0);
                    }
                    return 0;
                  }).map(product => {
                    const category = categories.find(c => c.id === product.category_id);
                    const isChristmas = product.is_christmas === true || category?.is_christmas === true;
                    const isValentine = product.is_valentine === true || category?.is_valentine === true;
                    const isEpiphany = product.is_epiphany === true || category?.is_epiphany === true;
                    const isCustomEvent = product.is_custom_event === true || category?.is_custom_event === true;
                    let eventEmoji = '';
                    if (isChristmas) eventEmoji = '🎄 ';
                    if (isValentine) eventEmoji = '❤️ ';
                    if (isEpiphany) eventEmoji = '👑 ';
                    if (isCustomEvent) eventEmoji = (category?.event_icon || '🎉') + ' ';
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
                            {product.image_url ? <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" /> : <span className="text-2xl">🧁</span>}
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold">{eventEmoji}{product.name}</TableCell>
                        <TableCell><Badge variant="outline" className="border-[#E0A890] text-[#C98F75]">{category?.name || '-'}</Badge></TableCell>
                        <TableCell className="font-bold text-[#C98F75]">{product.price?.toFixed(2)} €</TableCell>
                        <TableCell>
                          {product.unlimited_stock !== false ? (
                            <Badge variant="outline" className="border-green-300 text-green-700">Illimité</Badge>
                          ) : (
                            <span className="font-semibold">{product.current_stock || 0}</span>
                          )}
                        </TableCell>
                        <TableCell><Badge className={product.active !== false ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>{product.active !== false ? "Actif" : "Inactif"}</Badge></TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => toggleActiveMutation.mutate({ 
                                id: product.id, 
                                active: product.active === false 
                              })} 
                              className={product.active === false ? "hover:bg-green-50 text-green-600" : "hover:bg-gray-50 text-gray-600"}
                              title={product.active === false ? "Réactiver" : "Mettre en pause"}
                            >
                              {product.active === false ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleOpenProductDialog(product)} className="hover:bg-[#E0A890]/10"><Pencil className="w-4 h-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => { if (confirm("Supprimer ce produit ?")) deleteProductMutation.mutate(product.id); }} className="hover:bg-red-50 text-red-600"><Trash2 className="w-4 h-4" /></Button>
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

      {/* Product Dialog */}
      <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingProduct ? "Modifier le produit" : "Nouveau produit"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div><Label>Nom *</Label><Input value={productFormData.name} onChange={(e) => setProductFormData({...productFormData, name: e.target.value})} className="mt-2" /></div>
            <div className="grid md:grid-cols-2 gap-4">
              <div><Label>Prix (€) *</Label><Input type="number" step="0.01" min="0" value={productFormData.price} onChange={(e) => setProductFormData({...productFormData, price: e.target.value})} className="mt-2" /></div>
              <div><Label>Catégorie *</Label><Select value={productFormData.category_id} onValueChange={(value) => setProductFormData({...productFormData, category_id: value})}><SelectTrigger className="mt-2"><SelectValue /></SelectTrigger><SelectContent>{categories.map(cat => {
                let emoji = '';
                if (cat.is_christmas === true) emoji = '🎄 ';
                if (cat.is_valentine === true) emoji = '❤️ ';
                if (cat.is_epiphany === true) emoji = '👑 ';
                if (cat.is_custom_event === true) emoji = (cat.event_icon || '🎉') + ' ';
                return (<SelectItem key={cat.id} value={cat.id}>{emoji}{cat.name}</SelectItem>);
              })}</SelectContent></Select></div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-[#F8EDE3]/30 rounded-lg">
                <div>
                  <Label>Stock illimité</Label>
                  <p className="text-sm text-gray-600">Aucun suivi de stock</p>
                </div>
                <Switch 
                  checked={productFormData.unlimited_stock} 
                  onCheckedChange={(checked) => setProductFormData({
                    ...productFormData, 
                    unlimited_stock: checked,
                    current_stock: checked ? 0 : productFormData.current_stock
                  })} 
                />
              </div>
              
              {!productFormData.unlimited_stock && (
                <div>
                  <Label>Stock disponible *</Label>
                  <Input 
                    type="number" 
                    min="0" 
                    value={productFormData.current_stock} 
                    onChange={(e) => setProductFormData({...productFormData, current_stock: e.target.value})} 
                    className="mt-2" 
                    placeholder="Quantité en stock"
                  />
                </div>
              )}
            </div>
            <div>
              <Label>Photo</Label>
              <div className="flex gap-2 mt-2">
                <Input value={productFormData.image_url} onChange={(e) => setProductFormData({...productFormData, image_url: e.target.value})} placeholder="https://..." />
                <Button type="button" variant="outline" onClick={() => { const urls = ["https://images.unsplash.com/photo-1578985545062-69928b1d9587", "https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e"]; setProductFormData({...productFormData, image_url: urls[Math.floor(Math.random() * urls.length)]}); }}><ImageIcon className="w-4 h-4" /></Button>
              </div>
              {productFormData.image_url && <img src={productFormData.image_url} alt="Preview" className="mt-3 w-full h-48 object-cover rounded-lg" />}
            </div>
            <div className="flex items-center justify-between p-4 bg-[#F8EDE3]/30 rounded-lg">
              <div><Label>Produit actif</Label><p className="text-sm text-gray-600">Visible dans le catalogue</p></div>
              <Switch checked={productFormData.active} onCheckedChange={(checked) => setProductFormData({...productFormData, active: checked})} />
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setProductDialogOpen(false)} className="flex-1">Annuler</Button>
              <Button onClick={handleProductSubmit} className="flex-1 bg-gradient-to-r from-[#E0A890] to-[#C98F75] hover:from-[#C98F75] hover:to-[#B07E64] text-white">{editingProduct ? "Mettre à jour" : "Créer"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Action Dialog */}
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
                disabled={bulkUpdateProductMutation.isPending}
                className="flex-1 bg-gradient-to-r from-[#E0A890] to-[#C98F75] hover:from-[#C98F75] hover:to-[#B07E64] text-white"
              >
                {bulkUpdateProductMutation.isPending ? "En cours..." : "Confirmer"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}