import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { jsPDF } from 'npm:jspdf@2.5.1';

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

        const doc = new jsPDF();

        // En-tête
        doc.setFontSize(24);
        doc.setTextColor(224, 168, 144);
        doc.text('Pâtisserie', 20, 20);
        
        doc.setFontSize(16);
        doc.setTextColor(0, 0, 0);
        doc.text(`Commande ${orderData.order_number}`, 20, 35);

        // Informations client
        doc.setFontSize(12);
        doc.text('Informations client', 20, 50);
        doc.setFontSize(10);
        doc.text(`Nom: ${orderData.customer_firstname} ${orderData.customer_name}`, 20, 60);
        doc.text(`Téléphone: ${orderData.customer_phone}`, 20, 67);
        doc.text(`Email: ${orderData.customer_email}`, 20, 74);

        // Informations retrait
        doc.setFontSize(12);
        doc.text('Informations de retrait', 120, 50);
        doc.setFontSize(10);
        doc.text(`Boutique: ${shop[0]?.name || 'N/A'}`, 120, 60);
        doc.text(`Adresse: ${shop[0]?.location || 'N/A'}`, 120, 67);
        doc.text(`Date: ${new Date(orderData.pickup_date).toLocaleDateString('fr-FR')}`, 120, 74);

        // Ligne de séparation
        doc.setDrawColor(224, 168, 144);
        doc.setLineWidth(0.5);
        doc.line(20, 85, 190, 85);

        // Produits
        doc.setFontSize(12);
        doc.text('Produits commandés', 20, 95);

        let y = 105;
        doc.setFontSize(10);

        orderLines.forEach((line) => {
            if (y > 270) {
                doc.addPage();
                y = 20;
            }

            doc.text(`${line.quantity}x ${line.product_name}`, 20, y);
            doc.text(`${line.unit_price.toFixed(2)} €`, 120, y);
            doc.text(`${line.subtotal.toFixed(2)} €`, 160, y);

            if (line.customization) {
                y += 7;
                doc.setFontSize(9);
                doc.setTextColor(100, 100, 100);
                doc.text(`Personnalisation: ${line.customization}`, 25, y);
                doc.setTextColor(0, 0, 0);
                doc.setFontSize(10);
            }

            y += 10;
        });

        // Total
        y += 10;
        doc.setDrawColor(224, 168, 144);
        doc.setLineWidth(0.5);
        doc.line(20, y, 190, y);

        y += 10;
        doc.setFontSize(14);
        doc.setTextColor(201, 143, 117);
        doc.text(`Total: ${orderData.total_amount.toFixed(2)} €`, 140, y);

        const pdfBytes = doc.output('arraybuffer');

        return new Response(pdfBytes, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename=commande_${orderData.order_number}.pdf`
            }
        });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});