import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Minus, Plus, Trash2 } from "lucide-react";

export default function CartItem({ item, onUpdateQuantity, onUpdateCustomization, onRemove }) {
  return (
    <Card className="border-[#DFD3C3]/30 bg-white/80 backdrop-blur-sm">
      <CardContent className="p-4">
        <div className="flex gap-4">
          <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-[#F8EDE3] to-[#DFD3C3] flex items-center justify-center flex-shrink-0 overflow-hidden">
            {item.image_url ? (
              <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl">🧁</span>
            )}
          </div>
          
          <div className="flex-1 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-bold text-gray-800">{item.name}</h4>
                <p className="text-sm text-[#C98F75] font-semibold">{item.price.toFixed(2)} € / unité</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onRemove(item.id)}
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
                className="h-9 w-9 border-[#DFD3C3]"
              >
                <Minus className="w-4 h-4" />
              </Button>
              <Input
                type="number"
                min="1"
                value={item.quantity}
                onChange={(e) => onUpdateQuantity(item.id, parseInt(e.target.value) || 1)}
                className="w-16 text-center border-[#DFD3C3]"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                className="h-9 w-9 border-[#DFD3C3]"
              >
                <Plus className="w-4 h-4" />
              </Button>
              <span className="ml-auto font-bold text-lg text-gray-800">
                {(item.price * item.quantity).toFixed(2)} €
              </span>
            </div>

            <Textarea
              placeholder="Personnalisation (message sur le gâteau, demande spéciale...)"
              value={item.customization || ''}
              onChange={(e) => onUpdateCustomization(item.id, e.target.value)}
              className="text-sm border-[#DFD3C3] bg-white/50 resize-none"
              rows={2}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}