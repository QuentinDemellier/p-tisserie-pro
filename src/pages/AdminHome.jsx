import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, Store, Users, Cake, ShoppingCart, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";

export default function AdminHome() {
  const adminSections = [
    {
      title: "Gestion des commandes",
      description: "Créer et suivre toutes les commandes",
      icon: ShoppingCart,
      color: "from-blue-500 to-blue-600",
      actions: [
        { label: "Nouvelle commande", url: "NewOrder" },
        { label: "Liste des commandes", url: "OrdersList" }
      ]
    },
    {
      title: "Production",
      description: "Planning et catalogue produits",
      icon: TrendingUp,
      color: "from-orange-500 to-orange-600",
      actions: [
        { label: "Planning production", url: "Production" },
        { label: "Catalogue produits", url: "CatalogProducts" }
      ]
    },
    {
      title: "Administration",
      description: "Configuration et gestion",
      icon: Settings,
      color: "from-purple-500 to-purple-600",
      actions: [
        { label: "Gestion complète", url: "Admin" }
      ]
    }
  ];

  return (
    <div className="p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-2">
            <Settings className="w-8 h-8 text-[#C98F75]" />
            Tableau de bord administrateur
          </h1>
          <p className="text-gray-600">Accès complet à tous les espaces</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {adminSections.map((section, index) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="border-[#DFD3C3]/30 shadow-xl bg-white/90 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 h-full">
                <CardHeader>
                  <div className={`w-16 h-16 bg-gradient-to-br ${section.color} rounded-2xl flex items-center justify-center mb-4 shadow-lg`}>
                    <section.icon className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-xl mb-2">{section.title}</CardTitle>
                  <CardDescription>{section.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {section.actions.map(action => (
                    <Link key={action.url} to={createPageUrl(action.url)} className="block">
                      <Button className="w-full bg-gradient-to-r from-[#E0A890] to-[#C98F75] hover:from-[#C98F75] hover:to-[#B07E64] text-white">
                        {action.label}
                      </Button>
                    </Link>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="mt-8">
          <Card className="border-[#DFD3C3]/30 shadow-xl bg-gradient-to-r from-[#F8EDE3] to-white">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#E0A890] to-[#C98F75] rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-gray-800">Accès administrateur</h3>
                  <p className="text-sm text-gray-600">Vous avez accès à tous les espaces : vendeurs, production et administration</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}