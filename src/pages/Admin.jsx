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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Pencil, Trash2, Tag, Store, MapPin, Image as ImageIcon, Settings } from "lucide-react";
import { toast } from "sonner";

export default function Admin() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("products");

  // Product states
  const [editingProduct, setEditingProduct] = useState(null);
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [productFormData, setProductFormData] = useState({
    name: "",
    price: "",
    image_url: "",
    category_id: "",
    active: true,
    stock_limit: 0
  });

  // Category states
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [categoryFormData, setCategoryFormData] = useState({
    name: "",
    description: "",
    order: 0
  });

  // Shop states
  const [editingShop, setEditingShop] = useState(null);
  const [shopDialogOpen, setShopDialogOpen] = useState(false);
  const [shopFormData, setShopFormData] = useState({
    name: "",
    location: "",
    active: true
  });

  // Queries
  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list('-created_date')
  });

  const { data: categories = [], isLoading: loadingCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => base44.entities.Category.list('order')
  });

  const { data: shops = [], isLoading: loadingShops } = useQuery({
    queryKey: ['shops'],
    queryFn: () => base44.entities.Shop.list()
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

  // Category mutations
  const createCategoryMutation = useMutation({
    mutationFn: (data) => base44.entities.Category.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success("Catégorie créée");
      setCategoryDialogOpen(false);
    }
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Category.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success("Catégorie mise à jour");
      setCategoryDialogOpen(false);
    }
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id) => base44.entities.Category.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success("Catégorie supprimée");
    }
  });

  // Shop mutations
  const createShopMutation = useMutation({
    mutationFn: (data) => base44.entities.Shop.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shops'] });
      toast.success("Boutique créée");
      setShopDialogOpen(false);
    }
  });

  const updateShopMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Shop.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shops'] });
      toast.success("Boutique mise à jour");
      setShopDialogOpen(false);
    }
  });

  const deleteShopMutation = useMutation({
    mutationFn: (id) => base44.entities.Shop.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shops'] });
      toast.success("Boutique supprimée");
    }
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
        stock_limit: product.stock_limit || 0
      });
    } else {
      setEditingProduct(null);
      setProductFormData({ name: "", price: "", image_url: "", category_id: "", active: true, stock_limit: 0 });
    }
    setProductDialogOpen(true);
  };

  const handleProductSubmit = () => {
    if (!productFormData.name || !productFormData.price || !productFormData.category_id) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }
    const data = { ...productFormData, price: parseFloat(productFormData.price), stock_limit: parseInt(productFormData.stock_limit) || 0 };
    if (editingProduct) {
      updateProductMutation.mutate({ id: editingProduct.id, data });
    } else {
      createProductMutation.mutate(data);
    }
  };

  // Category handlers
  const handleOpenCategoryDialog = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setCategoryFormData({ name: category.name || "", description: category.description || "", order: category.order || 0 });
    } else {
      setEditingCategory(null);
      setCategoryFormData({ name: "", description: "", order: categories.length });
    }
    setCategoryDialogOpen(true);
  };

  const handleCategorySubmit = () => {
    if (!categoryFormData.name) {
      toast.error("Le nom est obligatoire");
      return;
    }
    const data = { ...categoryFormData, order: parseInt(categoryFormData.order) || 0 };
    if (editingCategory) {
      updateCategoryMutation.mutate({ id: editingCategory.id, data });
    } else {
      createCategoryMutation.mutate(data);
    }
  };

  // Shop handlers
  const handleOpenShopDialog = (shop = null) => {
    if (shop) {
      setEditingShop(shop);
      setShopFormData({ name: shop.name || "", location: shop.location || "", active: shop.active !== false });
    } else {
      setEditingShop(null);
      setShopFormData({ name: "", location: "", active: true });
    }
    setShopDialogOpen(true);
  };

  const handleShopSubmit = () => {
    if (!shopFormData.name) {
      toast.error("Le nom est obligatoire");
      return;
    }
    if (editingShop) {
      updateShopMutation.mutate({ id: editingShop.id, data: shopFormData });
    } else {
      createShopMutation.mutate(shopFormData);
    }
  };

  return (
    <div className="p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-2">
            <Settings className="w-8 h-8 text-[#C98F75]" />
            Administration
          </h1>
          <p className="text-gray-600">Gérez les produits, catégories et boutiques</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="products" className="text-base">Produits</TabsTrigger>
            <TabsTrigger value="categories" className="text-base">Catégories</TabsTrigger>
            <TabsTrigger value="shops" className="text-base">Boutiques</TabsTrigger>
          </TabsList>

          {/* PRODUCTS TAB */}
          <TabsContent value="products">
            <div className="flex justify-end mb-4">
              <Button onClick={() => handleOpenProductDialog()} className="bg-gradient-to-r from-[#E0A890] to-[#C98F75] hover:from-[#C98F75] hover:to-[#B07E64] text-white">
                <Plus className="w-4 h-4 mr-2" />
                Nouveau produit
              </Button>
            </div>
            <Card className="border-[#DFD3C3]/30 shadow-xl bg-white/90">
              <CardHeader className="border-b border-[#DFD3C3]/30 bg-gradient-to-r from-[#F8EDE3] to-white">
                <CardTitle>Liste des produits ({products.length})</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-[#F8EDE3]/50">
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
                          <TableRow key={i}><TableCell colSpan={7}><div className="h-12 bg-[#DFD3C3]/20 animate-pulse rounded" /></TableCell></TableRow>
                        ))
                      ) : products.length === 0 ? (
                        <TableRow><TableCell colSpan={7} className="text-center py-12 text-gray-500">Aucun produit</TableCell></TableRow>
                      ) : (
                        products.map(product => {
                          const category = categories.find(c => c.id === product.category_id);
                          return (
                            <TableRow key={product.id} className="hover:bg-[#F8EDE3]/20">
                              <TableCell>
                                <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-[#F8EDE3] to-[#DFD3C3] overflow-hidden flex items-center justify-center">
                                  {product.image_url ? <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" /> : <span className="text-2xl">🧁</span>}
                                </div>
                              </TableCell>
                              <TableCell className="font-semibold">{product.name}</TableCell>
                              <TableCell><Badge variant="outline" className="border-[#E0A890] text-[#C98F75]">{category?.name || '-'}</Badge></TableCell>
                              <TableCell className="font-bold text-[#C98F75]">{product.price?.toFixed(2)} €</TableCell>
                              <TableCell>{product.stock_limit > 0 ? product.stock_limit : 'Illimité'}</TableCell>
                              <TableCell><Badge className={product.active !== false ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>{product.active !== false ? "Actif" : "Inactif"}</Badge></TableCell>
                              <TableCell className="text-right">
                                <div className="flex gap-2 justify-end">
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
          </TabsContent>

          {/* CATEGORIES TAB */}
          <TabsContent value="categories">
            <div className="flex justify-end mb-4">
              <Button onClick={() => handleOpenCategoryDialog()} className="bg-gradient-to-r from-[#E0A890] to-[#C98F75] hover:from-[#C98F75] hover:to-[#B07E64] text-white">
                <Plus className="w-4 h-4 mr-2" />
                Nouvelle catégorie
              </Button>
            </div>
            <Card className="border-[#DFD3C3]/30 shadow-xl bg-white/90">
              <CardHeader className="border-b border-[#DFD3C3]/30 bg-gradient-to-r from-[#F8EDE3] to-white">
                <CardTitle className="flex items-center gap-2"><Tag className="w-5 h-5 text-[#C98F75]" />Liste des catégories ({categories.length})</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {loadingCategories ? (
                  <div className="p-6 space-y-4">{Array(3).fill(0).map((_, i) => (<div key={i} className="h-16 bg-[#DFD3C3]/20 animate-pulse rounded" />))}</div>
                ) : categories.length === 0 ? (
                  <div className="p-12 text-center text-gray-500"><Tag className="w-12 h-12 mx-auto mb-4 text-gray-300" /><p>Aucune catégorie</p></div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-[#F8EDE3]/50">
                          <TableHead>Ordre</TableHead>
                          <TableHead>Nom</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {categories.map(category => (
                          <TableRow key={category.id} className="hover:bg-[#F8EDE3]/20">
                            <TableCell><div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#E0A890] to-[#C98F75] flex items-center justify-center text-white font-bold">{category.order}</div></TableCell>
                            <TableCell className="font-semibold text-lg">{category.name}</TableCell>
                            <TableCell className="text-gray-600">{category.description || '-'}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex gap-2 justify-end">
                                <Button variant="ghost" size="icon" onClick={() => handleOpenCategoryDialog(category)} className="hover:bg-[#E0A890]/10"><Pencil className="w-4 h-4" /></Button>
                                <Button variant="ghost" size="icon" onClick={() => { if (confirm("Supprimer cette catégorie ?")) deleteCategoryMutation.mutate(category.id); }} className="hover:bg-red-50 text-red-600"><Trash2 className="w-4 h-4" /></Button>
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
          </TabsContent>

          {/* SHOPS TAB */}
          <TabsContent value="shops">
            <div className="flex justify-end mb-4">
              <Button onClick={() => handleOpenShopDialog()} className="bg-gradient-to-r from-[#E0A890] to-[#C98F75] hover:from-[#C98F75] hover:to-[#B07E64] text-white">
                <Plus className="w-4 h-4 mr-2" />
                Nouvelle boutique
              </Button>
            </div>
            <Card className="border-[#DFD3C3]/30 shadow-xl bg-white/90">
              <CardHeader className="border-b border-[#DFD3C3]/30 bg-gradient-to-r from-[#F8EDE3] to-white">
                <CardTitle className="flex items-center gap-2"><Store className="w-5 h-5 text-[#C98F75]" />Liste des boutiques ({shops.length})</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {loadingShops ? (
                  <div className="p-6 space-y-4">{Array(3).fill(0).map((_, i) => (<div key={i} className="h-20 bg-[#DFD3C3]/20 animate-pulse rounded" />))}</div>
                ) : shops.length === 0 ? (
                  <div className="p-12 text-center text-gray-500"><Store className="w-12 h-12 mx-auto mb-4 text-gray-300" /><p>Aucune boutique</p></div>
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
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#E0A890] to-[#C98F75] flex items-center justify-center"><Store className="w-6 h-6 text-white" /></div>
                                <span className="font-semibold text-lg">{shop.name}</span>
                              </div>
                            </TableCell>
                            <TableCell><div className="flex items-start gap-2 text-gray-600"><MapPin className="w-4 h-4 mt-1 flex-shrink-0" /><span>{shop.location || '-'}</span></div></TableCell>
                            <TableCell><Badge className={shop.active !== false ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>{shop.active !== false ? "Active" : "Inactive"}</Badge></TableCell>
                            <TableCell className="text-right">
                              <div className="flex gap-2 justify-end">
                                <Button variant="ghost" size="icon" onClick={() => handleOpenShopDialog(shop)} className="hover:bg-[#E0A890]/10"><Pencil className="w-4 h-4" /></Button>
                                <Button variant="ghost" size="icon" onClick={() => { if (confirm("Supprimer cette boutique ?")) deleteShopMutation.mutate(shop.id); }} className="hover:bg-red-50 text-red-600"><Trash2 className="w-4 h-4" /></Button>
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
          </TabsContent>
        </Tabs>

        {/* Product Dialog */}
        <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editingProduct ? "Modifier le produit" : "Nouveau produit"}</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div><Label>Nom *</Label><Input value={productFormData.name} onChange={(e) => setProductFormData({...productFormData, name: e.target.value})} className="mt-2" /></div>
              <div className="grid md:grid-cols-2 gap-4">
                <div><Label>Prix (€) *</Label><Input type="number" step="0.01" min="0" value={productFormData.price} onChange={(e) => setProductFormData({...productFormData, price: e.target.value})} className="mt-2" /></div>
                <div><Label>Catégorie *</Label><Select value={productFormData.category_id} onValueChange={(value) => setProductFormData({...productFormData, category_id: value})}><SelectTrigger className="mt-2"><SelectValue /></SelectTrigger><SelectContent>{categories.map(cat => (<SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>))}</SelectContent></Select></div>
              </div>
              <div><Label>Limite de stock</Label><Input type="number" min="0" value={productFormData.stock_limit} onChange={(e) => setProductFormData({...productFormData, stock_limit: e.target.value})} className="mt-2" placeholder="0 = illimité" /></div>
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

        {/* Category Dialog */}
        <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{editingCategory ? "Modifier la catégorie" : "Nouvelle catégorie"}</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div><Label>Nom *</Label><Input value={categoryFormData.name} onChange={(e) => setCategoryFormData({...categoryFormData, name: e.target.value})} className="mt-2" /></div>
              <div><Label>Description</Label><Textarea value={categoryFormData.description} onChange={(e) => setCategoryFormData({...categoryFormData, description: e.target.value})} className="mt-2" rows={3} /></div>
              <div><Label>Ordre d'affichage</Label><Input type="number" min="0" value={categoryFormData.order} onChange={(e) => setCategoryFormData({...categoryFormData, order: e.target.value})} className="mt-2" /></div>
              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setCategoryDialogOpen(false)} className="flex-1">Annuler</Button>
                <Button onClick={handleCategorySubmit} className="flex-1 bg-gradient-to-r from-[#E0A890] to-[#C98F75] hover:from-[#C98F75] hover:to-[#B07E64] text-white">{editingCategory ? "Mettre à jour" : "Créer"}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Shop Dialog */}
        <Dialog open={shopDialogOpen} onOpenChange={setShopDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{editingShop ? "Modifier la boutique" : "Nouvelle boutique"}</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div><Label>Nom *</Label><Input value={shopFormData.name} onChange={(e) => setShopFormData({...shopFormData, name: e.target.value})} className="mt-2" /></div>
              <div><Label>Localisation</Label><Textarea value={shopFormData.location} onChange={(e) => setShopFormData({...shopFormData, location: e.target.value})} className="mt-2" rows={3} /></div>
              <div className="flex items-center justify-between p-4 bg-[#F8EDE3]/30 rounded-lg">
                <div><Label>Boutique active</Label><p className="text-sm text-gray-600">Disponible pour les commandes</p></div>
                <Switch checked={shopFormData.active} onCheckedChange={(checked) => setShopFormData({...shopFormData, active: checked})} />
              </div>
              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setShopDialogOpen(false)} className="flex-1">Annuler</Button>
                <Button onClick={handleShopSubmit} className="flex-1 bg-gradient-to-r from-[#E0A890] to-[#C98F75] hover:from-[#C98F75] hover:to-[#B07E64] text-white">{editingShop ? "Mettre à jour" : "Créer"}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}