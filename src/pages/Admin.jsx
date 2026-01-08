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
import { Plus, Pencil, Trash2, Tag, Store, MapPin, Image as ImageIcon, Settings, Users, History, Key, ShoppingBag, CheckSquare } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

export default function Admin() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("products");

  // Product states
  const [editingProduct, setEditingProduct] = useState(null);
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [bulkActionDialogOpen, setBulkActionDialogOpen] = useState(false);
  const [bulkAction, setBulkAction] = useState("");
  const [bulkCategoryId, setBulkCategoryId] = useState("");
  const [productFilterCategory, setProductFilterCategory] = useState("all");
  const [productFilterStatus, setProductFilterStatus] = useState("all");
  const [productFilterEvent, setProductFilterEvent] = useState("all");
  const [productFormData, setProductFormData] = useState({
    name: "",
    price: "",
    image_url: "",
    category_id: "",
    active: true,
    current_stock: 0,
    unlimited_stock: true
  });

  // Category states
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [categoryFilterStatus, setCategoryFilterStatus] = useState("all");
  const [categoryFilterEvent, setCategoryFilterEvent] = useState("all");
  const [categoryFormData, setCategoryFormData] = useState({
    name: "",
    description: "",
    order: 0,
    active: true,
    is_christmas: false,
    is_valentine: false,
    is_epiphany: false,
    is_custom_event: false,
    event_color: "#9333ea",
    event_icon: "🎉"
  });

  // Shop states
  const [editingShop, setEditingShop] = useState(null);
  const [shopDialogOpen, setShopDialogOpen] = useState(false);
  const [shopFormData, setShopFormData] = useState({
    name: "",
    location: "",
    active: true
  });

  // User states
  const [editingUser, setEditingUser] = useState(null);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [userFormData, setUserFormData] = useState({
    user_role: "vendeur",
    assigned_shop_id: ""
  });
  const [selectedUserOrders, setSelectedUserOrders] = useState(null);
  const [userOrdersDialogOpen, setUserOrdersDialogOpen] = useState(false);

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

  const { data: users = [], isLoading: loadingUsers } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list('-created_date')
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['orders'],
    queryFn: () => base44.entities.Order.list('-created_date')
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
    
    // Check the event type of the selected category
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

  // Category handlers
  const handleOpenCategoryDialog = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setCategoryFormData({ 
        name: category.name || "", 
        description: category.description || "", 
        order: category.order || 0, 
        active: category.active !== false,
        is_christmas: category.is_christmas === true,
        is_valentine: category.is_valentine === true,
        is_epiphany: category.is_epiphany === true,
        is_custom_event: category.is_custom_event === true,
        event_color: category.event_color || "#9333ea",
        event_icon: category.event_icon || "🎉"
      });
    } else {
      setEditingCategory(null);
      setCategoryFormData({ name: "", description: "", order: categories.length, active: true, is_christmas: false, is_valentine: false, is_epiphany: false, is_custom_event: false, event_color: "#9333ea", event_icon: "🎉" });
    }
    setCategoryDialogOpen(true);
  };

  const handleCategorySubmit = async () => {
    if (!categoryFormData.name) {
      toast.error("Le nom est obligatoire");
      return;
    }
    const data = { ...categoryFormData, order: parseInt(categoryFormData.order) || 0 };

    if (editingCategory) {
      // Update category
      await updateCategoryMutation.mutateAsync({ id: editingCategory.id, data });

      // If event flags changed, update all products in this category
      const eventChanged = data.is_christmas !== editingCategory.is_christmas || 
                           data.is_valentine !== editingCategory.is_valentine || 
                           data.is_epiphany !== editingCategory.is_epiphany ||
                           data.is_custom_event !== editingCategory.is_custom_event;

      if (eventChanged) {
        const categoryProducts = products.filter(p => p.category_id === editingCategory.id);
        await Promise.all(
          categoryProducts.map(product => 
            base44.entities.Product.update(product.id, { 
              is_christmas: data.is_christmas,
              is_valentine: data.is_valentine,
              is_epiphany: data.is_epiphany,
              is_custom_event: data.is_custom_event
            })
          )
        );
        queryClient.invalidateQueries({ queryKey: ['products'] });
        toast.success(`${categoryProducts.length} produit(s) mis à jour`);
      }
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

  // User mutations
  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.User.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success("Utilisateur mis à jour");
      setUserDialogOpen(false);
    },
    onError: () => toast.error("Erreur lors de la mise à jour")
  });

  // User handlers
  const handleOpenUserDialog = (user) => {
    setEditingUser(user);
    setUserFormData({
      user_role: user.user_role || "vendeur",
      assigned_shop_id: user.assigned_shop_id || ""
    });
    setUserDialogOpen(true);
  };

  const handleUserSubmit = () => {
    updateUserMutation.mutate({ id: editingUser.id, data: userFormData });
  };

  const handleViewUserOrders = async (user) => {
    const userOrders = orders.filter(order => order.created_by === user.email);
    setSelectedUserOrders({ user, orders: userOrders });
    setUserOrdersDialogOpen(true);
  };

  const getRoleLabel = (role) => {
    const labels = {
      vendeur: "Vendeur",
      boutique: "Boutique",
      production: "Production",
      admin: "Administrateur"
    };
    return labels[role] || role;
  };

  const getRoleColor = (role) => {
    const colors = {
      vendeur: "bg-blue-100 text-blue-800",
      boutique: "bg-purple-100 text-purple-800",
      production: "bg-orange-100 text-orange-800",
      admin: "bg-red-100 text-red-800"
    };
    return colors[role] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-2">
            <Settings className="w-8 h-8 text-[#C98F75]" />
            Administration
          </h1>
          <p className="text-gray-600">Gérez les produits, catégories, boutiques et utilisateurs</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 mb-6 h-auto">
            <TabsTrigger value="products" className="text-sm sm:text-base py-2">Produits</TabsTrigger>
            <TabsTrigger value="categories" className="text-sm sm:text-base py-2">Catégories</TabsTrigger>
            <TabsTrigger value="shops" className="text-sm sm:text-base py-2">Boutiques</TabsTrigger>
            <TabsTrigger value="users" className="text-sm sm:text-base py-2">Utilisateurs</TabsTrigger>
          </TabsList>

          {/* PRODUCTS TAB */}
          <TabsContent value="products">
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
                <Select value={productFilterEvent} onValueChange={setProductFilterEvent}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    <SelectItem value="christmas">🎄 Noël</SelectItem>
                    <SelectItem value="valentine">❤️ St-Valentin</SelectItem>
                    <SelectItem value="epiphany">👑 Épiphanie</SelectItem>
                    <SelectItem value="regular">Classique</SelectItem>
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
                  const category = categories.find(c => c.id === product.category_id);
                  const isChristmas = product.is_christmas === true || category?.is_christmas === true;
                  const isValentine = product.is_valentine === true || category?.is_valentine === true;
                  const isEpiphany = product.is_epiphany === true || category?.is_epiphany === true;
                  const isCustomEvent = product.is_custom_event === true || category?.is_custom_event === true;
                  const isEvent = isChristmas || isValentine || isEpiphany || isCustomEvent;
                  if (productFilterEvent === "christmas" && !isChristmas) return false;
                  if (productFilterEvent === "valentine" && !isValentine) return false;
                  if (productFilterEvent === "epiphany" && !isEpiphany) return false;
                  if (productFilterEvent === "custom" && !isCustomEvent) return false;
                  if (productFilterEvent === "regular" && isEvent) return false;
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
                          <TableRow key={i}><TableCell colSpan={7}><div className="h-12 bg-[#DFD3C3]/20 animate-pulse rounded" /></TableCell></TableRow>
                        ))
                      ) : products.length === 0 ? (
                        <TableRow><TableCell colSpan={8} className="text-center py-12 text-gray-500">Aucun produit</TableCell></TableRow>
                      ) : (
                        products.filter(product => {
                          // Filter by category
                          if (productFilterCategory !== "all" && product.category_id !== productFilterCategory) {
                            return false;
                          }
                          // Filter by status
                          if (productFilterStatus === "active" && product.active === false) {
                            return false;
                          }
                          if (productFilterStatus === "inactive" && product.active !== false) {
                            return false;
                          }
                          // Filter by event type
                          const category = categories.find(c => c.id === product.category_id);
                          const isChristmas = product.is_christmas === true || category?.is_christmas === true;
                          const isValentine = product.is_valentine === true || category?.is_valentine === true;
                          const isEpiphany = product.is_epiphany === true || category?.is_epiphany === true;
                          const isCustomEvent = product.is_custom_event === true || category?.is_custom_event === true;
                          const isEvent = isChristmas || isValentine || isEpiphany || isCustomEvent;
                          if (productFilterEvent === "christmas" && !isChristmas) {
                            return false;
                          }
                          if (productFilterEvent === "valentine" && !isValentine) {
                            return false;
                          }
                          if (productFilterEvent === "epiphany" && !isEpiphany) {
                            return false;
                          }
                          if (productFilterEvent === "custom" && !isCustomEvent) {
                            return false;
                          }
                          if (productFilterEvent === "regular" && isEvent) {
                            return false;
                          }
                          return true;
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
            <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
              <div className="flex flex-wrap gap-2">
                <Select value={categoryFilterStatus} onValueChange={setCategoryFilterStatus}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={categoryFilterEvent} onValueChange={setCategoryFilterEvent}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    <SelectItem value="christmas">🎄 Noël</SelectItem>
                    <SelectItem value="valentine">❤️ St-Valentin</SelectItem>
                    <SelectItem value="epiphany">👑 Épiphanie</SelectItem>
                    <SelectItem value="regular">Classique</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => handleOpenCategoryDialog()} className="bg-gradient-to-r from-[#E0A890] to-[#C98F75] hover:from-[#C98F75] hover:to-[#B07E64] text-white">
                <Plus className="w-4 h-4 mr-2" />
                Nouvelle catégorie
              </Button>
            </div>
            <Card className="border-[#DFD3C3]/30 shadow-xl bg-white/90">
              <CardHeader className="border-b border-[#DFD3C3]/30 bg-gradient-to-r from-[#F8EDE3] to-white">
                <CardTitle className="flex items-center gap-2"><Tag className="w-5 h-5 text-[#C98F75]" />Liste des catégories ({categories.filter(cat => {
                  if (categoryFilterStatus === "active" && cat.active === false) return false;
                  if (categoryFilterStatus === "inactive" && cat.active !== false) return false;
                  const isEvent = cat.is_christmas === true || cat.is_valentine === true || cat.is_epiphany === true || cat.is_custom_event === true;
                  if (categoryFilterEvent === "christmas" && cat.is_christmas !== true) return false;
                  if (categoryFilterEvent === "valentine" && cat.is_valentine !== true) return false;
                  if (categoryFilterEvent === "epiphany" && cat.is_epiphany !== true) return false;
                  if (categoryFilterEvent === "custom" && cat.is_custom_event !== true) return false;
                  if (categoryFilterEvent === "regular" && isEvent) return false;
                  return true;
                }).length})</CardTitle>
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
                          <TableHead>Type</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {categories.filter(cat => {
                          if (categoryFilterStatus === "active" && cat.active === false) return false;
                          if (categoryFilterStatus === "inactive" && cat.active !== false) return false;
                          const isEvent = cat.is_christmas === true || cat.is_valentine === true || cat.is_epiphany === true || cat.is_custom_event === true;
                          if (categoryFilterEvent === "christmas" && cat.is_christmas !== true) return false;
                          if (categoryFilterEvent === "valentine" && cat.is_valentine !== true) return false;
                          if (categoryFilterEvent === "epiphany" && cat.is_epiphany !== true) return false;
                          if (categoryFilterEvent === "custom" && cat.is_custom_event !== true) return false;
                          if (categoryFilterEvent === "regular" && isEvent) return false;
                          return true;
                        }).map(category => {
                          let eventBadge = null;
                          if (category.is_christmas === true) eventBadge = <Badge className="bg-red-100 text-red-800 border-red-300">🎄 Noël</Badge>;
                          if (category.is_valentine === true) eventBadge = <Badge className="bg-pink-100 text-pink-800 border-pink-300">❤️ St-Valentin</Badge>;
                          if (category.is_epiphany === true) eventBadge = <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">👑 Épiphanie</Badge>;
                          if (category.is_custom_event === true) {
                            eventBadge = <Badge style={{ backgroundColor: category.event_color + '20', color: category.event_color, borderColor: category.event_color + '50' }}>{category.event_icon} {category.name}</Badge>;
                          }
                          return (
                          <TableRow key={category.id} className="hover:bg-[#F8EDE3]/20">
                            <TableCell><div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#E0A890] to-[#C98F75] flex items-center justify-center text-white font-bold">{category.order}</div></TableCell>
                            <TableCell className="font-semibold text-lg">{category.name}</TableCell>
                            <TableCell className="text-gray-600">{category.description || '-'}</TableCell>
                            <TableCell>
                              {eventBadge}
                            </TableCell>
                            <TableCell><Badge className={category.active !== false ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>{category.active !== false ? "Active" : "Inactive"}</Badge></TableCell>
                            <TableCell className="text-right">
                             <div className="flex gap-2 justify-end">
                               <Button variant="ghost" size="icon" onClick={() => handleOpenCategoryDialog(category)} className="hover:bg-[#E0A890]/10"><Pencil className="w-4 h-4" /></Button>
                               <Button variant="ghost" size="icon" onClick={() => { if (confirm("Supprimer cette catégorie ?")) deleteCategoryMutation.mutate(category.id); }} className="hover:bg-red-50 text-red-600"><Trash2 className="w-4 h-4" /></Button>
                             </div>
                            </TableCell>
                            </TableRow>
                            );})}
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

          {/* USERS TAB */}
          <TabsContent value="users">
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Note :</strong> Les utilisateurs doivent être invités via le tableau de bord Base44. 
                Une fois invités, vous pouvez modifier leur rôle et leur boutique assignée ci-dessous.
              </p>
            </div>
            <Card className="border-[#DFD3C3]/30 shadow-xl bg-white/90">
              <CardHeader className="border-b border-[#DFD3C3]/30 bg-gradient-to-r from-[#F8EDE3] to-white">
                <CardTitle className="flex items-center gap-2"><Users className="w-5 h-5 text-[#C98F75]" />Liste des utilisateurs ({users.length})</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {loadingUsers ? (
                  <div className="p-6 space-y-4">{Array(5).fill(0).map((_, i) => (<div key={i} className="h-20 bg-[#DFD3C3]/20 animate-pulse rounded" />))}</div>
                ) : users.length === 0 ? (
                  <div className="p-12 text-center text-gray-500"><Users className="w-12 h-12 mx-auto mb-4 text-gray-300" /><p>Aucun utilisateur</p></div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-[#F8EDE3]/50">
                          <TableHead>Utilisateur</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Rôle</TableHead>
                          <TableHead>Boutique assignée</TableHead>
                          <TableHead>Commandes</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map(user => {
                          const assignedShop = shops.find(s => s.id === user.assigned_shop_id);
                          const userOrdersCount = orders.filter(o => o.created_by === user.email).length;
                          return (
                            <TableRow key={user.id} className="hover:bg-[#F8EDE3]/20">
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#E0A890] to-[#C98F75] flex items-center justify-center">
                                    <span className="text-white font-semibold text-sm">
                                      {user.full_name?.[0]?.toUpperCase() || 'U'}
                                    </span>
                                  </div>
                                  <span className="font-semibold">{user.full_name || 'Utilisateur'}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-gray-600">{user.email}</TableCell>
                              <TableCell>
                                <Badge className={getRoleColor(user.user_role || 'vendeur')}>
                                  {getRoleLabel(user.user_role || 'vendeur')}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {assignedShop ? (
                                  <Badge variant="outline" className="border-[#E0A890] text-[#C98F75]">
                                    {assignedShop.name}
                                  </Badge>
                                ) : (
                                  <span className="text-gray-400 text-sm">Non assigné</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleViewUserOrders(user)}
                                  disabled={userOrdersCount === 0}
                                  className="hover:bg-[#E0A890]/10"
                                >
                                  <ShoppingBag className="w-4 h-4 mr-2" />
                                  {userOrdersCount}
                                </Button>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex gap-2 justify-end">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleOpenUserDialog(user)}
                                    className="hover:bg-[#E0A890]/10"
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
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

        {/* Category Dialog */}
        <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{editingCategory ? "Modifier la catégorie" : "Nouvelle catégorie"}</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div><Label>Nom *</Label><Input value={categoryFormData.name} onChange={(e) => setCategoryFormData({...categoryFormData, name: e.target.value})} className="mt-2" /></div>
              <div><Label>Description</Label><Textarea value={categoryFormData.description} onChange={(e) => setCategoryFormData({...categoryFormData, description: e.target.value})} className="mt-2" rows={3} /></div>
              <div><Label>Ordre d'affichage</Label><Input type="number" min="0" value={categoryFormData.order} onChange={(e) => setCategoryFormData({...categoryFormData, order: e.target.value})} className="mt-2" /></div>
              <div className="flex items-center justify-between p-4 bg-[#F8EDE3]/30 rounded-lg">
                <div><Label>Catégorie active</Label><p className="text-sm text-gray-600">Visible dans le catalogue</p></div>
                <Switch checked={categoryFormData.active} onCheckedChange={(checked) => setCategoryFormData({...categoryFormData, active: checked})} />
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
                  <div>
                    <Label className="flex items-center gap-2">
                      🎄 Catégorie Noël
                    </Label>
                    <p className="text-sm text-gray-600">Visible uniquement dans "Commande Noël"</p>
                    <p className="text-xs text-gray-500 mt-1">Les produits seront automatiquement tagués Noël</p>
                  </div>
                  <Switch 
                    checked={categoryFormData.is_christmas} 
                    onCheckedChange={(checked) => setCategoryFormData({
                      ...categoryFormData, 
                      is_christmas: checked,
                      is_valentine: checked ? false : categoryFormData.is_valentine,
                      is_epiphany: checked ? false : categoryFormData.is_epiphany
                    })} 
                  />
                </div>
                <div className="flex items-center justify-between p-4 bg-pink-50 rounded-lg border border-pink-200">
                  <div>
                    <Label className="flex items-center gap-2">
                      ❤️ Catégorie Saint-Valentin
                    </Label>
                    <p className="text-sm text-gray-600">Visible uniquement dans "Commande Saint-Valentin"</p>
                    <p className="text-xs text-gray-500 mt-1">Les produits seront automatiquement tagués Saint-Valentin</p>
                  </div>
                  <Switch 
                    checked={categoryFormData.is_valentine} 
                    onCheckedChange={(checked) => setCategoryFormData({
                      ...categoryFormData, 
                      is_valentine: checked,
                      is_christmas: checked ? false : categoryFormData.is_christmas,
                      is_epiphany: checked ? false : categoryFormData.is_epiphany
                    })} 
                  />
                </div>
                <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div>
                    <Label className="flex items-center gap-2">
                      👑 Catégorie Épiphanie
                    </Label>
                    <p className="text-sm text-gray-600">Visible uniquement dans "Commande Épiphanie"</p>
                    <p className="text-xs text-gray-500 mt-1">Les produits seront automatiquement tagués Épiphanie</p>
                  </div>
                  <Switch 
                    checked={categoryFormData.is_epiphany} 
                    onCheckedChange={(checked) => setCategoryFormData({
                      ...categoryFormData, 
                      is_epiphany: checked,
                      is_christmas: checked ? false : categoryFormData.is_christmas,
                      is_valentine: checked ? false : categoryFormData.is_valentine,
                      is_custom_event: checked ? false : categoryFormData.is_custom_event
                    })} 
                  />
                </div>
                <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <div>
                    <Label className="flex items-center gap-2">
                      🎉 Catégorie personnalisée
                    </Label>
                    <p className="text-sm text-gray-600">Créez votre propre événement avec couleur et icône</p>
                  </div>
                  <Switch 
                    checked={categoryFormData.is_custom_event} 
                    onCheckedChange={(checked) => setCategoryFormData({
                      ...categoryFormData, 
                      is_custom_event: checked,
                      is_christmas: checked ? false : categoryFormData.is_christmas,
                      is_valentine: checked ? false : categoryFormData.is_valentine,
                      is_epiphany: checked ? false : categoryFormData.is_epiphany
                    })} 
                  />
                </div>
                {categoryFormData.is_custom_event && (
                  <div className="space-y-3 p-4 bg-purple-50/50 rounded-lg border border-purple-200">
                    <div>
                      <Label>Couleur de l'événement</Label>
                      <div className="flex gap-2 mt-2">
                        <Input 
                          type="color" 
                          value={categoryFormData.event_color} 
                          onChange={(e) => setCategoryFormData({...categoryFormData, event_color: e.target.value})}
                          className="w-20 h-10"
                        />
                        <Input 
                          type="text" 
                          value={categoryFormData.event_color} 
                          onChange={(e) => setCategoryFormData({...categoryFormData, event_color: e.target.value})}
                          placeholder="#9333ea"
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Icône de l'événement (emoji)</Label>
                      <Input 
                        value={categoryFormData.event_icon} 
                        onChange={(e) => setCategoryFormData({...categoryFormData, event_icon: e.target.value})}
                        placeholder="🎉"
                        className="mt-2"
                        maxLength={2}
                      />
                      <div className="flex flex-wrap gap-2 mt-2">
                        {['🎉', '🎊', '🎈', '🎁', '🌟', '✨', '🎪', '🎭', '🎨', '🎵'].map(icon => (
                          <button
                            key={icon}
                            type="button"
                            onClick={() => setCategoryFormData({...categoryFormData, event_icon: icon})}
                            className="w-10 h-10 text-2xl hover:bg-purple-100 rounded transition-colors"
                          >
                            {icon}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
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

        {/* User Dialog */}
        <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Modifier l'utilisateur</DialogTitle>
            </DialogHeader>
            {editingUser && (
              <div className="space-y-4 py-4">
                <div className="p-4 bg-[#F8EDE3]/30 rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#E0A890] to-[#C98F75] flex items-center justify-center">
                      <span className="text-white font-semibold">
                        {editingUser.full_name?.[0]?.toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold">{editingUser.full_name}</p>
                      <p className="text-sm text-gray-600">{editingUser.email}</p>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    Inscrit le {format(new Date(editingUser.created_date), 'dd MMMM yyyy', { locale: fr })}
                  </div>
                </div>

                <div>
                  <Label>Rôle *</Label>
                  <Select value={userFormData.user_role} onValueChange={(value) => setUserFormData({...userFormData, user_role: value})}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vendeur">Vendeur</SelectItem>
                      <SelectItem value="boutique">Boutique</SelectItem>
                      <SelectItem value="production">Production</SelectItem>
                      <SelectItem value="admin">Administrateur</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">Détermine les accès de l'utilisateur</p>
                </div>

                <div>
                  <Label>Boutique assignée</Label>
                  <Select 
                    value={userFormData.assigned_shop_id} 
                    onValueChange={(value) => setUserFormData({...userFormData, assigned_shop_id: value})}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Aucune boutique assignée" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={null}>Aucune boutique</SelectItem>
                      {shops.filter(s => s.active !== false).map(shop => (
                        <SelectItem key={shop.id} value={shop.id}>{shop.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">Pour les rôles "boutique", limite l'accès aux commandes de cette boutique</p>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button variant="outline" onClick={() => setUserDialogOpen(false)} className="flex-1">
                    Annuler
                  </Button>
                  <Button 
                    onClick={handleUserSubmit} 
                    className="flex-1 bg-gradient-to-r from-[#E0A890] to-[#C98F75] hover:from-[#C98F75] hover:to-[#B07E64] text-white"
                  >
                    Mettre à jour
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* User Orders History Dialog */}
        <Dialog open={userOrdersDialogOpen} onOpenChange={setUserOrdersDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <History className="w-5 h-5 text-[#C98F75]" />
                Historique des commandes de {selectedUserOrders?.user.full_name}
              </DialogTitle>
            </DialogHeader>
            {selectedUserOrders && (
              <div className="space-y-4">
                {selectedUserOrders.orders.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <ShoppingBag className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>Aucune commande trouvée</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedUserOrders.orders.map(order => {
                      const shop = shops.find(s => s.id === order.shop_id);
                      const getStatusColor = (status) => {
                        const colors = {
                          enregistree: "bg-blue-100 text-blue-800",
                          enregistree_modifiee: "bg-orange-100 text-orange-800",
                          en_livraison: "bg-purple-100 text-purple-800",
                          recuperee: "bg-green-100 text-green-800",
                          annulee: "bg-red-100 text-red-800"
                        };
                        return colors[status] || colors.enregistree;
                      };
                      const getStatusLabel = (status) => {
                        const labels = {
                          enregistree: "Enregistrée",
                          enregistree_modifiee: "Enregistrée - modifiée",
                          en_livraison: "En livraison",
                          recuperee: "Récupérée",
                          annulee: "Annulée"
                        };
                        return labels[status] || status;
                      };
                      return (
                        <Card key={order.id} className="border-[#DFD3C3]/30">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start">
                              <div className="space-y-2">
                                <div className="flex items-center gap-3">
                                  <span className="font-mono text-sm font-semibold text-[#C98F75]">
                                    {order.order_number}
                                  </span>
                                  <Badge className={getStatusColor(order.status)}>
                                    {getStatusLabel(order.status)}
                                  </Badge>
                                </div>
                                <div className="text-sm space-y-1 text-gray-600">
                                  <p><span className="font-medium">Client:</span> {order.customer_firstname} {order.customer_name}</p>
                                  <p><span className="font-medium">Boutique:</span> {shop?.name || '-'}</p>
                                  <p><span className="font-medium">Date de retrait:</span> {format(new Date(order.pickup_date), 'dd MMMM yyyy', { locale: fr })}</p>
                                  <p className="text-xs text-gray-500">Créée le {format(new Date(order.created_date), 'dd/MM/yyyy à HH:mm', { locale: fr })}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-2xl font-bold text-[#C98F75]">{order.total_amount.toFixed(2)} €</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
                <div className="pt-4 border-t border-[#DFD3C3]/30">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Total des commandes:</span>
                    <span className="text-2xl font-bold text-[#C98F75]">
                      {selectedUserOrders.orders.reduce((sum, o) => sum + o.total_amount, 0).toFixed(2)} €
                    </span>
                  </div>
                </div>
              </div>
            )}
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
      </div>
    </div>
  );
}