import React from "react";
import { ShoppingBag } from "lucide-react";
import ProductsManagement from "../components/products/ProductsManagement";

export default function CatalogProducts() {
  return (
    <div className="p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-2">
            <ShoppingBag className="w-8 h-8 text-[#C98F75]" />
            Catalogue produits
          </h1>
          <p className="text-gray-600">Gérez vos produits et leur disponibilité</p>
        </div>

        <ProductsManagement />
      </div>
    </div>
  );
}