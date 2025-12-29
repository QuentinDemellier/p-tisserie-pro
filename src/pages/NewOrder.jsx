import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingCart, Search, Calendar, User, Mail, Phone, CheckCircle, ArrowLeft, Edit } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import ProductCard from "../components/order/ProductCard";
import CartItem from "../components/order/CartItem";

export default function NewOrder() {
  const [cart, setCart] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [step, setStep] = useState(1); // 1: catalog, 2: summary
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [stockErrorDialogOpen, setStockErrorDialogOpen] = useState(false);
  const [orderData, setOrderData] = useState({
    shop_id: "",
    pickup_date: "",
    customer_name: "",
    customer_firstname: "",
    customer_phone: "",
    customer_email: ""
  });

  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.filter({ active: true })
  });

  const { data: allCategories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => base44.entities.Category.list('order')
  });

  const categories = allCategories.filter(cat => cat.active !== false);

  const { data: shops = [] } = useQuery({
    queryKey: ['shops'],
    queryFn: () => base44.entities.Shop.filter({ active: true })
  });

  const createOrderMutation = useMutation({
    mutationFn: async (data) => {
      const orderNumber = `CMD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
      
      const order = await base44.entities.Order.create({
        order_number: orderNumber,
        shop_id: data.shop_id,
        pickup_date: data.pickup_date,
        customer_name: data.customer_name,
        customer_firstname: data.customer_firstname,
        customer_phone: data.customer_phone,
        customer_email: data.customer_email,
        total_amount: total,
        status: "Enregistrée"
      });

      const orderLines = await Promise.all(
        cart.map(item =>
          base44.entities.OrderLine.create({
            order_id: order.id,
            product_id: item.id,
            product_name: item.name,
            quantity: item.quantity,
            unit_price: item.price,
            customization: item.customization || "",
            subtotal: item.price * item.quantity
          })
        )
      );

      const shop = shops.find(s => s.id === data.shop_id);
      
      await base44.integrations.Core.SendEmail({
        to: data.customer_email,
        subject: `Confirmation de commande ${orderNumber}`,
        body: `
Bonjour ${data.customer_firstname} ${data.customer_name},

Votre commande a bien été enregistrée !

Numéro de commande : ${orderNumber}
Boutique de retrait : ${shop?.name || ''}
Date de retrait : ${new Date(data.pickup_date).toLocaleDateString('fr-FR', { dateStyle: 'long' })}
Montant total : ${total.toFixed(2)} €

Détail de votre commande :
${cart.map(item => `- ${item.quantity}x ${item.name} (${(item.price * item.quantity).toFixed(2)} €)${item.customization ? `\n  Personnalisation : ${item.customization}` : ''}`).join('\n')}

Merci de votre confiance !

L'équipe de la Pâtisserie
        `
      });

      return { order, orderNumber };
      },
      onSuccess: ({ orderNumber }) => {
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 }
      });
      toast.success("Commande enregistrée !", {
        description: `Numéro de commande : ${orderNumber}`,
        duration: 5000,
        icon: "✓"
      });
      setCart([]);
      setStep(1);
      setOrderData({
        shop_id: "",
        pickup_date: "",
        customer_name: "",
        customer_firstname: "",
        customer_phone: "",
        customer_email: ""
      });
      },
    onError: (error) => {
      toast.error("Erreur lors de la création de la commande");
      console.error(error);
    }
  });

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.id === product.id);
    const currentStock = product.current_stock || 0;
    const hasUnlimitedStock = product.unlimited_stock !== false;
    const currentQuantityInCart = existingItem ? existingItem.quantity : 0;
    
    // Si le stock est illimité, pas de vérification
    if (!hasUnlimitedStock) {
      // Vérifier si on peut ajouter une unité de plus
      if (currentQuantityInCart + 1 > currentStock) {
        setStockErrorDialogOpen(true);
        return;
      }
    }
    
    if (existingItem) {
      updateQuantity(product.id, existingItem.quantity + 1);
    } else {
      setCart([...cart, { ...product, quantity: 1, customization: "" }]);
    }
    toast.success(`${product.name} ajouté au panier`);
  };

  const updateQuantity = (productId, quantity) => {
    const item = cart.find(i => i.id === productId);
    if (!item) return;
    
    const currentStock = item.current_stock || 0;
    const hasUnlimitedStock = item.unlimited_stock !== false;
    
    // Vérifier le stock avant de mettre à jour (sauf si illimité)
    if (!hasUnlimitedStock && quantity > currentStock) {
      setStockErrorDialogOpen(true);
      return;
    }
    
    setCart(cart.map(item => 
      item.id === productId ? { ...item, quantity: Math.max(1, quantity) } : item
    ));
  };

  const updateCustomization = (productId, customization) => {
    setCart(cart.map(item => 
      item.id === productId ? { ...item, customization } : item
    ));
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId));
    toast.info("Produit retiré du panier");
  };

  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || product.category_id === selectedCategory;
    const categoryIsActive = allCategories.find(cat => cat.id === product.category_id)?.active !== false;
    return matchesSearch && matchesCategory && categoryIsActive;
  });

  const handleSubmit = () => {
    if (!orderData.shop_id || !orderData.pickup_date || !orderData.customer_name || 
        !orderData.customer_firstname || !orderData.customer_phone || !orderData.customer_email) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }
    setConfirmDialogOpen(true);
  };

  const handleConfirmOrder = () => {
    setConfirmDialogOpen(false);
    createOrderMutation.mutate(orderData);
  };

  if (step === 2) {
    return (
      <div className="p-6 md:p-8 max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => setStep(1)}
          className="mb-6 hover:bg-[#E0A890]/10"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour au catalogue
        </Button>

        <Card className="border-[#DFD3C3]/30 shadow-xl bg-white/90 backdrop-blur-sm">
          <CardHeader className="border-b border-[#DFD3C3]/30 bg-gradient-to-r from-[#F8EDE3] to-white">
            <CardTitle className="flex items-center gap-2 text-2xl">
              <CheckCircle className="w-6 h-6 text-[#C98F75]" />
              Finalisation de la commande
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div>
              <h3 className="font-bold text-lg mb-4 text-gray-800">Récapitulatif du panier</h3>
              <div className="space-y-3 mb-4">
                {cart.map(item => (
                  <div key={item.id} className="flex justify-between items-start p-4 bg-[#F8EDE3]/30 rounded-lg">
                    <div>
                      <p className="font-semibold">{item.quantity}x {item.name}</p>
                      {item.customization && (
                        <p className="text-sm text-gray-600 mt-1">
                          Personnalisation : {item.customization}
                        </p>
                      )}
                    </div>
                    <p className="font-bold text-[#C98F75]">
                      {(item.price * item.quantity).toFixed(2)} €
                    </p>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center pt-4 border-t-2 border-[#E0A890]">
                <span className="text-xl font-bold">Total</span>
                <span className="text-2xl font-bold text-[#C98F75]">
                  {totalAmount.toFixed(2)} €
                </span>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
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
                    min={new Date().toISOString().split('T')[0]}
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
                    placeholder="Prénom du client"
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
                    placeholder="Nom du client"
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
                    placeholder="06 12 34 56 78"
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
                    placeholder="client@exemple.fr"
                  />
                </div>
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={createOrderMutation.isPending}
              className="w-full bg-gradient-to-r from-[#E0A890] to-[#C98F75] hover:from-[#C98F75] hover:to-[#B07E64] text-white text-lg py-6 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              {createOrderMutation.isPending ? "Création en cours..." : "Valider la commande"}
            </Button>
          </CardContent>
        </Card>

        {/* Dialog stock insuffisant */}
        <Dialog open={stockErrorDialogOpen} onOpenChange={setStockErrorDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl text-red-600">Stock insuffisant</DialogTitle>
            </DialogHeader>
            <div className="py-6 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">⚠️</span>
              </div>
              <p className="text-gray-700 text-lg">
                La quantité demandée dépasse le stock disponible pour ce produit.
              </p>
            </div>
            <div className="flex justify-center">
              <Button
                onClick={() => setStockErrorDialogOpen(false)}
                className="bg-gradient-to-r from-[#E0A890] to-[#C98F75] hover:from-[#C98F75] hover:to-[#B07E64] text-white px-8"
              >
                Compris
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog de confirmation */}
        <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-[#C98F75]" />
                Confirmation de la commande
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              {/* Produits sélectionnés */}
              <div>
                <h3 className="font-bold text-lg mb-3 text-gray-800">Produits commandés</h3>
                <div className="space-y-2">
                  {cart.map(item => (
                    <div key={item.id} className="flex justify-between items-start p-3 bg-[#F8EDE3]/30 rounded-lg">
                      <div className="flex-1">
                        <p className="font-semibold">{item.quantity}x {item.name}</p>
                        {item.customization && (
                          <p className="text-sm text-gray-600 mt-1">
                            Personnalisation : {item.customization}
                          </p>
                        )}
                      </div>
                      <p className="font-bold text-[#C98F75] ml-4">
                        {(item.price * item.quantity).toFixed(2)} €
                      </p>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center pt-3 mt-3 border-t-2 border-[#E0A890]">
                  <span className="text-xl font-bold">Total</span>
                  <span className="text-2xl font-bold text-[#C98F75]">
                    {totalAmount.toFixed(2)} €
                  </span>
                </div>
              </div>

              {/* Informations client */}
              <div>
                <h3 className="font-bold text-lg mb-3 text-gray-800">Informations client</h3>
                <div className="bg-[#F8EDE3]/30 rounded-lg p-4 space-y-2">
                  <p><span className="font-medium">Nom :</span> {orderData.customer_firstname} {orderData.customer_name}</p>
                  <p><span className="font-medium">Téléphone :</span> {orderData.customer_phone}</p>
                  <p><span className="font-medium">Email :</span> {orderData.customer_email}</p>
                </div>
              </div>

              {/* Informations de retrait */}
              <div>
                <h3 className="font-bold text-lg mb-3 text-gray-800">Informations de retrait</h3>
                <div className="bg-[#F8EDE3]/30 rounded-lg p-4 space-y-2">
                  <p><span className="font-medium">Boutique :</span> {shops.find(s => s.id === orderData.shop_id)?.name}</p>
                  <p><span className="font-medium">Adresse :</span> {shops.find(s => s.id === orderData.shop_id)?.location}</p>
                  <p><span className="font-medium">Date de retrait :</span> {new Date(orderData.pickup_date).toLocaleDateString('fr-FR', { dateStyle: 'long' })}</p>
                </div>
              </div>

              {/* Boutons */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setConfirmDialogOpen(false)}
                  className="flex-1 border-[#DFD3C3] hover:bg-[#E0A890]/10 text-base py-6"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Modifier
                </Button>
                <Button
                  onClick={handleConfirmOrder}
                  disabled={createOrderMutation.isPending}
                  className="flex-1 bg-gradient-to-r from-[#E0A890] to-[#C98F75] hover:from-[#C98F75] hover:to-[#B07E64] text-white text-base py-6"
                >
                  {createOrderMutation.isPending ? "Validation..." : "Valider"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Nouvelle commande</h1>
              <p className="text-gray-600">Sélectionnez vos produits</p>
            </div>

            <div className="mb-6 space-y-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Rechercher un produit..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 py-6 text-lg border-[#DFD3C3] bg-white/80 backdrop-blur-sm shadow-sm"
                />
              </div>

              <div className="overflow-x-auto">
                <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
                  <TabsList className="bg-white/80 backdrop-blur-sm border border-[#DFD3C3]/30 p-1 w-full md:w-auto inline-flex">
                    <TabsTrigger value="all" className="data-[state=active]:bg-[#E0A890] data-[state=active]:text-white text-xs md:text-sm">
                      Tous
                    </TabsTrigger>
                    {categories.map(cat => (
                      <TabsTrigger 
                        key={cat.id} 
                        value={cat.id}
                        className="data-[state=active]:bg-[#E0A890] data-[state=active]:text-white text-xs md:text-sm whitespace-nowrap"
                      >
                        {cat.name}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              </div>
            </div>

            {loadingProducts ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1,2,3,4,5,6].map(i => (
                  <div key={i} className="animate-pulse">
                    <div className="aspect-square bg-[#DFD3C3]/30 rounded-lg mb-4" />
                    <div className="h-4 bg-[#DFD3C3]/30 rounded mb-2" />
                    <div className="h-4 bg-[#DFD3C3]/30 rounded w-2/3" />
                  </div>
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <Card className="border-[#DFD3C3]/30 bg-white/80 backdrop-blur-sm">
                <CardContent className="p-12 text-center">
                  <p className="text-gray-500 text-lg">Aucun produit trouvé</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {filteredProducts.map(product => (
                  <ProductCard key={product.id} product={product} onAdd={addToCart} />
                ))}
              </div>
            )}
          </div>

          <div className="lg:w-96 lg:sticky lg:top-6">
            <Card className="border-[#DFD3C3]/30 shadow-2xl bg-white/90 backdrop-blur-sm">
              <CardHeader className="border-b border-[#DFD3C3]/30 bg-gradient-to-r from-[#F8EDE3] to-white">
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-[#C98F75]" />
                  Panier ({cart.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {cart.length === 0 ? (
                  <div className="py-12 text-center">
                    <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500">Votre panier est vide</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3 mb-6 max-h-[50vh] overflow-y-auto pr-2">
                      {cart.map(item => (
                        <CartItem
                          key={item.id}
                          item={item}
                          onUpdateQuantity={updateQuantity}
                          onUpdateCustomization={updateCustomization}
                          onRemove={removeFromCart}
                        />
                      ))}
                    </div>

                    <div className="border-t-2 border-[#E0A890] pt-4 mb-4">
                      <div className="flex justify-between items-center">
                        <span className="text-xl font-bold">Total</span>
                        <span className="text-2xl font-bold text-[#C98F75]">
                          {totalAmount.toFixed(2)} €
                        </span>
                      </div>
                    </div>

                    <Button
                      onClick={() => setStep(2)}
                      className="w-full bg-gradient-to-r from-[#E0A890] to-[#C98F75] hover:from-[#C98F75] hover:to-[#B07E64] text-white text-lg py-6 shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      Finaliser la commande
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Dialog stock insuffisant */}
        <Dialog open={stockErrorDialogOpen} onOpenChange={setStockErrorDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl text-red-600">Stock insuffisant</DialogTitle>
            </DialogHeader>
            <div className="py-6 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">⚠️</span>
              </div>
              <p className="text-gray-700 text-lg">
                La quantité demandée dépasse le stock disponible pour ce produit.
              </p>
            </div>
            <div className="flex justify-center">
              <Button
                onClick={() => setStockErrorDialogOpen(false)}
                className="bg-gradient-to-r from-[#E0A890] to-[#C98F75] hover:from-[#C98F75] hover:to-[#B07E64] text-white px-8"
              >
                Compris
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}