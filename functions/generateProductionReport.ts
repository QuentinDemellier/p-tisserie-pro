import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const { startDate, endDate } = await req.json();

        if (!startDate || !endDate) {
            return Response.json({ error: 'startDate et endDate requis' }, { status: 400 });
        }

        const orders = await base44.asServiceRole.entities.Order.list('-pickup_date');
        const filteredOrders = orders.filter(order => 
            order.pickup_date >= startDate && 
            order.pickup_date <= endDate &&
            order.status !== 'Annulée'
        );

        const orderLines = await base44.asServiceRole.entities.OrderLine.list();
        const relevantLines = orderLines.filter(line => 
            filteredOrders.some(order => order.id === line.order_id)
        );

        const productionSummary = {};
        for (const line of relevantLines) {
            if (!productionSummary[line.product_name]) {
                productionSummary[line.product_name] = {
                    name: line.product_name,
                    totalQuantity: 0,
                    totalRevenue: 0,
                    orderCount: 0
                };
            }
            productionSummary[line.product_name].totalQuantity += line.quantity;
            productionSummary[line.product_name].totalRevenue += line.subtotal;
            productionSummary[line.product_name].orderCount += 1;
        }

        const products = Object.values(productionSummary).sort((a, b) => 
            b.totalQuantity - a.totalQuantity
        );

        const totalRevenue = filteredOrders.reduce((sum, order) => 
            sum + order.total_amount, 0
        );

        const report = {
            period: {
                startDate,
                endDate
            },
            summary: {
                totalOrders: filteredOrders.length,
                totalRevenue: totalRevenue,
                averageOrderValue: filteredOrders.length > 0 ? totalRevenue / filteredOrders.length : 0,
                uniqueProducts: products.length
            },
            products: products,
            orders: filteredOrders.map(order => ({
                order_number: order.order_number,
                customer: `${order.customer_firstname} ${order.customer_name}`,
                pickup_date: order.pickup_date,
                total_amount: order.total_amount,
                status: order.status
            }))
        };

        return Response.json(report);
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});