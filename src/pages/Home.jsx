import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Factory, Settings, Store, Cake, ArrowRight, Lock } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.auth.me()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const handleAccess = (targetPage) => {
    if (!user) {
      base44.auth.redirectToLogin(createPageUrl(targetPage));
      return;
    }

    navigate(createPageUrl(targetPage));
  };

  const spaces = [
    {
      id: 'vendeurs',
      title: 'Espace Vendeurs',
      description: 'Créer et gérer les commandes clients',
      subtitle: 'Connexion avec identifiant boutique',
      icon: ShoppingCart,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      targetPage: 'NewOrder',
      requiredRole: ['vendeur', 'boutique'],
      features: ['Nouvelle commande', 'Consultation des commandes', 'Suivi par boutique']
    },
    {
      id: 'production',
      title: 'Espace Production',
      description: 'Planning de production et gestion du catalogue',
      subtitle: 'Connexion avec identifiant laboratoire',
      icon: Factory,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      targetPage: 'Production',
      requiredRole: ['production'],
      features: ['Planning de production', 'Gestion du catalogue', 'Suivi des fabrications']
    },
    {
      id: 'admin',
      title: 'Administration',
      description: 'Gestion complète de la pâtisserie',
      subtitle: 'Connexion administrateur',
      icon: Settings,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      targetPage: 'Admin',
      requiredRole: ['admin'],
      features: ['Gestion des produits', 'Gestion des boutiques', 'Gestion des utilisateurs']
    }
  ];

  const hasAccess = (requiredRoles) => {
    if (!user) return false;
    const userRole = user.user_role || 'vendeur';
    return requiredRoles.includes(userRole);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FBF8F3] to-[#F8EDE3] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-[#E0A890] to-[#C98F75] rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Cake className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FBF8F3] to-[#F8EDE3]">
      <div className="container mx-auto px-4 py-12 md:py-20">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-[#E0A890] to-[#C98F75] rounded-2xl flex items-center justify-center shadow-lg">
              <Cake className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800">
              Pâtisserie
            </h1>
          </div>
          <p className="text-xl text-gray-600 mb-2">Gestion des commandes et production</p>
          {user && (
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <div className="w-8 h-8 bg-gradient-to-br from-[#E0A890] to-[#C98F75] rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-xs">
                  {user.full_name?.[0]?.toUpperCase() || 'U'}
                </span>
              </div>
              <span>{user.full_name}</span>
              <span>•</span>
              <button
                onClick={() => base44.auth.logout()}
                className="text-[#C98F75] hover:underline"
              >
                Se déconnecter
              </button>
            </div>
          )}
        </motion.div>

        {/* Spaces Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {spaces.map((space, index) => (
            <motion.div
              key={space.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="border-[#DFD3C3]/30 shadow-xl bg-white/90 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 h-full">
                <CardHeader>
                  <div className={`w-16 h-16 bg-gradient-to-br ${space.color} rounded-2xl flex items-center justify-center mb-4 shadow-lg`}>
                    <space.icon className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl mb-2">{space.title}</CardTitle>
                  <CardDescription className="text-base mb-2">
                    {space.description}
                  </CardDescription>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mt-2">
                    <Lock className="w-4 h-4" />
                    <span className="italic">{space.subtitle}</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className={`${space.bgColor} rounded-lg p-4 space-y-2`}>
                    {space.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-sm">
                        <div className={`w-5 h-5 bg-gradient-to-br ${space.color} rounded flex items-center justify-center flex-shrink-0 mt-0.5`}>
                          <span className="text-white text-xs">✓</span>
                        </div>
                        <span className="text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {user && !hasAccess(space.requiredRole) && (
                    <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-200">
                      <Lock className="w-4 h-4 flex-shrink-0" />
                      <span>Connexion requise avec les accès appropriés</span>
                    </div>
                  )}

                  <Button
                    onClick={() => handleAccess(space.targetPage)}
                    className={`w-full bg-gradient-to-r ${space.color} hover:opacity-90 text-white shadow-lg text-base py-6 group`}
                  >
                    {!user ? (
                      <>
                        <Lock className="w-5 h-5 mr-2" />
                        Se connecter
                      </>
                    ) : hasAccess(space.requiredRole) ? (
                      <>
                        Accéder
                        <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                      </>
                    ) : (
                      <>
                        <Lock className="w-5 h-5 mr-2" />
                        Connexion requise
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Footer Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-16 text-center"
        >
          <Card className="max-w-2xl mx-auto border-[#DFD3C3]/30 bg-white/60 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#E0A890] to-[#C98F75] rounded-xl flex items-center justify-center flex-shrink-0">
                  <Store className="w-6 h-6 text-white" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-lg text-gray-800 mb-2">
                    Système de connexion par espace
                  </h3>
                  <div className="text-sm text-gray-600 space-y-2">
                    <p>• <strong>Vendeurs :</strong> Chaque boutique dispose de son propre identifiant de connexion</p>
                    <p>• <strong>Production :</strong> Un identifiant unique pour accéder au laboratoire</p>
                    <p>• <strong>Administration :</strong> Accès complet à tous les espaces</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}