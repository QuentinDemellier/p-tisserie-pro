import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const { orderId, action } = await req.json();

        if (!orderId || !action) {
            return Response.json({ error: 'orderId et action requis' }, { status: 400 });
        }

        if (action !== 'decrement' && action !== 'increment') {
            return Response.json({ error: 'action doit être "decrement" ou "increment"' }, { status: 400 });
        }

        const orderLines = await base44.entities.OrderLine.filter({ order_id: orderId });
        const updatedProducts = [];

        for (const line of orderLines) {
            const products = await base44.asServiceRole.entities.Product.filter({ id: line.product_id });
            
            if (products && products.length > 0) {
                const product = products[0];
                
                if (product.unlimited_stock === false) {
                    const currentStock = product.current_stock || 0;
                    const newStock = action === 'decrement' 
                        ? Math.max(0, currentStock - line.quantity)
                        : currentStock + line.quantity;

                    await base44.asServiceRole.entities.Product.update(product.id, {
                        current_stock: newStock
                    });

                    updatedProducts.push({
                        product_name: product.name,
                        old_stock: currentStock,
                        new_stock: newStock,
                        change: action === 'decrement' ? -line.quantity : line.quantity
                    });
                }
            }
        }

        return Response.json({ 
            success: true, 
            message: 'Stock mis à jour',
            updates: updatedProducts
        });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});