import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { motion } from "framer-motion";

export default function ProductCard({ product, onAdd }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 border-[#DFD3C3]/30 bg-white/90 backdrop-blur-sm h-full">
        <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-[#F8EDE3] to-[#DFD3C3]">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-6xl">🧁</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
        <CardContent className="p-5">
          <h3 className="font-bold text-lg text-gray-800 mb-2 line-clamp-1">
            {product.name}
          </h3>
          {product.description && (
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
              {product.description}
            </p>
          )}
          <div className="flex items-center justify-between mt-4">
            <span className="text-2xl font-bold text-[#C98F75]">
              {product.price.toFixed(2)} €
            </span>
            <Button
              onClick={() => onAdd(product)}
              className="bg-gradient-to-r from-[#E0A890] to-[#C98F75] hover:from-[#C98F75] hover:to-[#B07E64] text-white shadow-lg hover:shadow-xl transition-all duration-300"
              size="icon"
            >
              <Plus className="w-5 h-5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}