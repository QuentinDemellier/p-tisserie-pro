import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const { orderId } = await req.json();

        if (!orderId) {
            return Response.json({ error: 'orderId requis' }, { status: 400 });
        }

        const order = await base44.entities.Order.filter({ id: orderId });
        if (!order || order.length === 0) {
            return Response.json({ error: 'Commande introuvable' }, { status: 404 });
        }

        const orderData = order[0];
        const orderLines = await base44.entities.OrderLine.filter({ order_id: orderId });
        const shop = await base44.entities.Shop.filter({ id: orderData.shop_id });

        const productsText = orderLines.map(line => 
            `- ${line.quantity}x ${line.product_name} (${line.subtotal.toFixed(2)} €)${line.customization ? `\n  Personnalisation: ${line.customization}` : ''}`
        ).join('\n');

        await base44.integrations.Core.SendEmail({
            to: orderData.customer_email,
            subject: `Rappel - Commande ${orderData.order_number} à retirer`,
            body: `
Bonjour ${orderData.customer_firstname} ${orderData.customer_name},

Nous vous rappelons que votre commande est prête à être retirée :

📦 Numéro de commande : ${orderData.order_number}
🏪 Boutique : ${shop[0]?.name || 'N/A'}
📍 Adresse : ${shop[0]?.location || 'N/A'}
📅 Date de retrait : ${new Date(orderData.pickup_date).toLocaleDateString('fr-FR', { dateStyle: 'long' })}
💰 Montant total : ${orderData.total_amount.toFixed(2)} €

Détail de votre commande :
${productsText}

Merci de votre confiance !

L'équipe de la Pâtisserie
            `
        });

        return Response.json({ 
            success: true, 
            message: 'Rappel envoyé avec succès' 
        });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});