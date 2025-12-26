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
  TrendingUp
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

  useEffect(() => {
    base44.auth.me()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

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
      { title: "Liste des commandes", url: createPageUrl("OrdersList"), icon: Store },
      { title: "Commandes du jour", url: createPageUrl("VendeurHome"), icon: Cake }
    ],
    boutique: [
      { title: "Accueil", url: createPageUrl("VendeurHome"), icon: Cake },
      { title: "Nouvelle commande", url: createPageUrl("NewOrder"), icon: ShoppingCart },
      { title: "Toutes les commandes", url: createPageUrl("OrdersList"), icon: Store }
    ],
    production: [
      { title: "Planning production", url: createPageUrl("Production"), icon: Factory },
      { title: "Livraison du jour", url: createPageUrl("ProductionHome"), icon: Cake },
      { title: "Livraison", url: createPageUrl("DeliveryPrep"), icon: Store },
      { title: "Catalogue produits", url: createPageUrl("CatalogProducts"), icon: ShoppingCart }
    ],
    admin: [
      { title: "Administration", url: createPageUrl("Admin"), icon: Settings },
      { title: "Rapports", url: createPageUrl("Reports"), icon: Factory }
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
                onClick={() => {
                  base44.auth.logout();
                  window.location.href = createPageUrl("Home");
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