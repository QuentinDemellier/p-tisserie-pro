import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { 
  ShoppingCart, 
  Store, 
  Factory, 
  Settings,
  Cake,
  LogOut,
  Menu,
  TrendingUp,
  Gift
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState(null);
  const [hasEventOrders, setHasEventOrders] = useState(false);

  useEffect(() => {
    const checkEventOrders = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
        
        // Appliquer le mode sombre si activé
        if (userData.dark_mode === true) {
          document.documentElement.classList.add('dark-mode');
        } else {
          document.documentElement.classList.remove('dark-mode');
        }
        
        // Check for event orders
        const [orders, orderLines, products, categories] = await Promise.all([
          base44.entities.Order.list(),
          base44.entities.OrderLine.list(),
          base44.entities.Product.list(),
          base44.entities.Category.list()
        ]);
        
        const hasEvent = orders.some(order => {
          if (order.status === 'Annulée') return false;
          const lines = orderLines.filter(line => line.order_id === order.id);
          return lines.some(line => {
            const product = products.find(p => p.id === line.product_id);
            const category = categories.find(c => c.id === product?.category_id);
            return product?.is_christmas || product?.is_valentine || product?.is_epiphany ||
                   category?.is_christmas || category?.is_valentine || category?.is_epiphany;
          });
        });
        
        setHasEventOrders(hasEvent);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    
    checkEventOrders();
  }, [currentPageName]);

  const cycleRole = () => {
    const roles = ['vendeur', 'production', 'admin'];
    const currentRole = selectedRole || user?.user_role || 'vendeur';
    const currentIndex = roles.indexOf(currentRole);
    const nextIndex = (currentIndex + 1) % roles.length;
    setSelectedRole(roles[nextIndex]);
  };

  // Hide sidebar on Home page (login page)
  if (currentPageName === "Home") {
    return <div className="min-h-screen">{children}</div>;
  }

  // Wait for user to load before showing navigation
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FBF8F3] to-[#F8EDE3]">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-[#E0A890] to-[#C98F75] rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Cake className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  const userRole = selectedRole || user?.user_role || 'vendeur';

  const navigationByRole = {
    vendeur: [
      { title: "Nouvelle commande", url: createPageUrl("NewOrder"), icon: ShoppingCart },
        { title: "Commandes à retirer", url: createPageUrl("VendeurHome"), icon: Cake },
        { title: "Liste des commandes", url: createPageUrl("OrdersList"), icon: Store }
    ],
    boutique: [
      { title: "Commandes à retirer", url: createPageUrl("VendeurHome"), icon: Cake },
      { title: "Nouvelle commande", url: createPageUrl("NewOrder"), icon: ShoppingCart },
      { title: "Toutes les commandes", url: createPageUrl("OrdersList"), icon: Store }
    ],
    production: [
      { title: "Planning production", url: createPageUrl("Production"), icon: Factory },
      { title: "Livraison", url: createPageUrl("DeliveryPrep"), icon: Store },
      { title: "Catalogue produits", url: createPageUrl("CatalogProducts"), icon: ShoppingCart }
    ],
    admin: [
      { title: "Accueil", url: createPageUrl("AdminHome"), icon: Cake },
      { title: "Administration", url: createPageUrl("Admin"), icon: Settings },
      { title: "Rapports", url: createPageUrl("Reports"), icon: TrendingUp }
    ]
  };

  const navigationItems = navigationByRole[userRole] || navigationByRole.vendeur;

  return (
    <SidebarProvider>
        <style>{`
          :root {
            --color-primary: #E0A890;
            --color-primary-dark: #C98F75;
            --color-secondary: #F8EDE3;
            --color-accent: #DFD3C3;
            --color-success: #8BC34A;
          }

          .dark-mode {
            --color-primary: #D4A574;
            --color-primary-dark: #C99668;
            --color-secondary: #2a2a2a;
            --color-accent: #3a3a3a;
          }

          .dark-mode body,
          .dark-mode .min-h-screen {
            background: linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 50%, #141414 100%) !important;
          }

          .dark-mode .bg-white,
          .dark-mode .bg-white\/90,
          .dark-mode .bg-white\/80,
          .dark-mode .bg-white\/60 {
            background-color: rgba(26, 26, 26, 0.95) !important;
            backdrop-filter: blur(12px) !important;
            color: #f5f5f5 !important;
            border-color: rgba(74, 74, 74, 0.3) !important;
          }

          .dark-mode .text-gray-800,
          .dark-mode .text-gray-900 {
            color: #f5f5f5 !important;
          }

          .dark-mode .text-gray-700 {
            color: #e0e0e0 !important;
          }

          .dark-mode .text-gray-600 {
            color: #b8b8b8 !important;
          }

          .dark-mode .text-gray-500 {
            color: #9a9a9a !important;
          }

          .dark-mode .text-gray-400 {
            color: #6a6a6a !important;
          }

          .dark-mode .text-gray-300 {
            color: #5a5a5a !important;
          }

          .dark-mode .border-\\[\\#DFD3C3\\]\\/30,
          .dark-mode .border-\\[\\#DFD3C3\\]\\/20,
          .dark-mode .border {
            border-color: rgba(74, 74, 74, 0.3) !important;
          }

          .dark-mode .bg-gradient-to-br.from-\\[\\#FBF8F3\\],
          .dark-mode .bg-gradient-to-br.from-gray-50 {
            background: linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 50%, #141414 100%) !important;
          }

          .dark-mode .bg-gradient-to-r.from-\\[\\#F8EDE3\\] {
            background: linear-gradient(90deg, rgba(212, 165, 116, 0.1) 0%, rgba(26, 26, 26, 0.95) 100%) !important;
          }

          .dark-mode .bg-gradient-to-r.from-\\[\\#E0A890\\] {
            background: linear-gradient(90deg, #D4A574 0%, #C99668 100%) !important;
          }

          .dark-mode .bg-\\[\\#F8EDE3\\]\\/50,
          .dark-mode .bg-\\[\\#F8EDE3\\]\\/30,
          .dark-mode .bg-\\[\\#F8EDE3\\]\\/20 {
            background-color: rgba(42, 42, 42, 0.4) !important;
          }

          .dark-mode .hover\\:bg-\\[\\#E0A890\\]\\/10:hover,
          .dark-mode .hover\\:bg-\\[\\#F8EDE3\\]\\/20:hover {
            background-color: rgba(212, 165, 116, 0.15) !important;
          }

          .dark-mode .bg-\\[\\#E0A890\\]\\/20 {
            background-color: rgba(212, 165, 116, 0.2) !important;
          }

          .dark-mode .bg-\\[\\#DFD3C3\\]\\/20 {
            background-color: rgba(58, 58, 58, 0.3) !important;
          }

          .dark-mode .text-\\[\\#C98F75\\] {
            color: #D4A574 !important;
          }

          .dark-mode input,
          .dark-mode textarea,
          .dark-mode select {
            background-color: #1f1f1f !important;
            color: #f5f5f5 !important;
            border-color: rgba(74, 74, 74, 0.4) !important;
          }

          .dark-mode input::placeholder,
          .dark-mode textarea::placeholder {
            color: #6a6a6a !important;
          }

          .dark-mode .shadow,
          .dark-mode .shadow-lg,
          .dark-mode .shadow-xl {
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5) !important;
          }

          .dark-mode [data-state="active"] {
            background-color: rgba(212, 165, 116, 0.2) !important;
            color: #D4A574 !important;
          }
        `}</style>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-[#FBF8F3] to-[#F8EDE3]">
        <Sidebar className="border-r border-[#DFD3C3]/30 bg-white/80 backdrop-blur-sm">
          <SidebarHeader className="border-b border-[#DFD3C3]/30 p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-[#E0A890] to-[#C98F75] rounded-2xl flex items-center justify-center shadow-lg">
                <Cake className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-xl text-gray-800">Pâtisserie</h2>
                <p className="text-xs text-gray-500">Gestion des commandes</p>
              </div>
            </div>
          </SidebarHeader>
          
          <SidebarContent className="p-3">
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 py-3">
                Navigation
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navigationItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild 
                        className={`hover:bg-[#E0A890]/10 hover:text-[#C98F75] transition-all duration-200 rounded-xl mb-1 ${
                          location.pathname === item.url ? 'bg-[#E0A890]/20 text-[#C98F75] font-medium' : ''
                        }`}
                      >
                        <Link to={item.url} className="flex items-center gap-3 px-4 py-3">
                          <item.icon className="w-5 h-5" />
                          <span className="font-medium">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="border-t border-[#DFD3C3]/30 p-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3 px-2">
                <div className="w-10 h-10 bg-gradient-to-br from-[#E0A890] to-[#C98F75] rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    {user?.full_name?.[0]?.toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 text-sm truncate">
                    {user?.full_name || 'Utilisateur'}
                  </p>
                  <button
                    onClick={cycleRole}
                    className="text-xs text-gray-500 capitalize hover:text-[#C98F75] hover:bg-[#E0A890]/10 px-2 py-1 rounded transition-colors"
                  >
                    {userRole} ↻
                  </button>
                </div>
              </div>
              <button
                onClick={async () => {
                  try {
                    await base44.auth.logout();
                    window.location.href = createPageUrl("Home");
                  } catch (error) {
                    console.error("Erreur de déconnexion:", error);
                    window.location.href = createPageUrl("Home");
                  }
                }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-[#C98F75] hover:bg-[#E0A890]/10 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Déconnexion
              </button>
            </div>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col">
          <header className="bg-white/60 backdrop-blur-md border-b border-[#DFD3C3]/30 px-6 py-4 md:hidden sticky top-0 z-10">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="hover:bg-[#E0A890]/10 p-2 rounded-lg transition-colors duration-200">
                <Menu className="w-5 h-5" />
              </SidebarTrigger>
              <h1 className="text-lg font-semibold text-gray-800">Pâtisserie</h1>
            </div>
          </header>

          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}