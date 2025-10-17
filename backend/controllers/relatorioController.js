const Venda = require('../models/vendaModel');
const Compra = require('../models/compraModel');
const Produto = require('../models/produtoModel');
const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

// Função auxiliar para obter o início e o fim do dia para garantir que a data final seja inclusiva
const getStartOfDay = (date) => new Date(date.setHours(0, 0, 0, 0));
const getEndOfDay = (date) => new Date(date.setHours(23, 59, 59, 999));

exports.getReportData = async (req, res) => {
    try {
        let { startDate, endDate } = req.query;

        // Se as datas não forem fornecidas, usa o mês atual como padrão
        if (!startDate || !endDate) {
            const today = new Date();
            startDate = new Date(today.getFullYear(), today.getMonth(), 1);
            endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        } else {
            startDate = new Date(startDate);
            endDate = new Date(endDate);
        }

        const start = getStartOfDay(startDate);
        const end = getEndOfDay(endDate);

        const dateFilterVendas = { createdAt: { $gte: start, $lte: end } };
        const dateFilterCompras = { dataCompra: { $gte: start, $lte: end } };

        // --- 1. Resumo (Cards) ---
        const salesSummary = await Venda.aggregate([
            { $match: dateFilterVendas },
            { $group: {
                _id: null,
                totalRevenue: { $sum: '$valorTotal' },
                totalItemsSold: { $sum: { $sum: '$itens.quantidade' } }
            }},
        ]);

        const purchaseSummary = await Compra.aggregate([
            { $match: dateFilterCompras },
            { $group: { _id: null, totalCost: { $sum: '$precoTotal' } }},
        ]);

        const revenue = salesSummary[0]?.totalRevenue || 0;
        const cost = purchaseSummary[0]?.totalCost || 0;
        const itemsSold = salesSummary[0]?.totalItemsSold || 0;

        // --- 2. Evolução da Receita (Gráfico de Linha) ---
        const revenueEvolution = await Venda.aggregate([
            { $match: dateFilterVendas },
            { $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                dailyRevenue: { $sum: "$valorTotal" }
            }},
            { $sort: { _id: 1 } }
        ]);

        // --- 3. Quantidade Vendida por Artista (Gráfico de Barras Horizontais) ---
        const soldByArtist = await Venda.aggregate([
            { $match: dateFilterVendas },
            { $unwind: '$itens' },
            { $lookup: { from: 'produtos', localField: 'itens.produto', foreignField: '_id', as: 'productInfo' } },
            { $unwind: '$productInfo' },
            { $group: {
                _id: '$productInfo.artista',
                totalQuantity: { $sum: '$itens.quantidade' }
            }},
            { $sort: { totalQuantity: -1 } },
            { $limit: 6 }
        ]);

        // --- 4. Receita por Categoria (Gráfico de Barras Horizontais) ---
        const revenueByCategory = await Venda.aggregate([
            { $match: dateFilterVendas },
            { $unwind: '$itens' },
            { $lookup: { from: 'produtos', localField: 'itens.produto', foreignField: '_id', as: 'productInfo' } },
            { $unwind: '$productInfo' },
            { $group: {
                _id: '$productInfo.categoria',
                categoryRevenue: { $sum: { $multiply: ['$itens.quantidade', '$itens.precoUnitario'] } }
            }},
             { $sort: { categoryRevenue: -1 } },
             { $limit: 4 }
        ]);

        // --- 5. Evolução Receita vs Custo (Gráfico de Área/Linha) ---
         const monthlyRevenue = await Venda.aggregate([
            { $match: dateFilterVendas },
            { $group: {
                 _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
                 monthlyRevenue: { $sum: "$valorTotal" }
            }},
            { $sort: { _id: 1 } }
        ]);
         const monthlyCost = await Compra.aggregate([
            { $match: dateFilterCompras },
            { $group: {
                 _id: { $dateToString: { format: "%Y-%m", date: "$dataCompra" } },
                 monthlyCost: { $sum: "$precoTotal" }
            }},
            { $sort: { _id: 1 } }
        ]);

         const combinedMonthly = {};
         monthlyRevenue.forEach(item => combinedMonthly[item._id] = { revenue: item.monthlyRevenue, cost: 0 });
         monthlyCost.forEach(item => {
             if (combinedMonthly[item._id]) {
                 combinedMonthly[item._id].cost = item.monthlyCost;
             } else {
                 combinedMonthly[item._id] = { revenue: 0, cost: item.monthlyCost };
             }
         });
         const revenueVsCostEvolution = Object.entries(combinedMonthly).map(([month, values]) => ({ month, ...values })).sort((a, b) => a.month.localeCompare(b.month));

        // Monta o objeto de resposta final
        const reportData = {
            summary: {
                receita: revenue,
                custo: cost,
                lucro: revenue - cost,
                quantidadeVendida: itemsSold,
            },
            charts: {
                revenueEvolution: revenueEvolution.map(item => ({ date: item._id, value: item.dailyRevenue })),
                soldByArtist: soldByArtist.map(item => ({ artist: item._id, quantity: item.totalQuantity })),
                revenueByCategory: revenueByCategory.map(item => ({ category: item._id, revenue: item.categoryRevenue })),
                revenueVsCostEvolution: revenueVsCostEvolution,
                topCategoriesRevenue: revenueByCategory.map(item => ({ category: item._id, revenue: item.categoryRevenue }))
            }
        };

        res.json(reportData);

    } catch (error) {
        console.error("Erro detalhado ao buscar dados do relatório:", error);
        res.status(500).json({ msg: "Erro ao buscar dados para o relatório.", error: error.message });
    }
};

exports.generatePDFReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        if (!startDate || !endDate) {
            return res.status(400).send('Datas de início e fim são obrigatórias.');
        }

        const summary = { receita: 4424.12, custo: 1200.50, lucro: 3223.62, quantidadeVendida: 984 }; // Mock

        const doc = new PDFDocument({ margin: 50 });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename=relatorio_${startDate}_a_${endDate}.pdf`);
        doc.pipe(res);

        doc.fontSize(18).text('Relatório de Vendas e Compras', { align: 'center' });
        doc.fontSize(12).text(`Período: ${new Date(startDate).toLocaleDateString('pt-BR')} a ${new Date(endDate).toLocaleDateString('pt-BR')}`, { align: 'center' });
        doc.moveDown(2);
        doc.fontSize(14).text('Resumo Financeiro', { underline: true });
        doc.moveDown();
        doc.fontSize(12).text(`Receita Total: R$ ${summary.receita.toFixed(2)}`);
        doc.text(`Custo Total (Compras): R$ ${summary.custo.toFixed(2)}`);
        doc.text(`Lucro Bruto: R$ ${summary.lucro.toFixed(2)}`);
        doc.text(`Total de Itens Vendidos: ${summary.quantidadeVendida}`);
        doc.moveDown(2);
        doc.fontSize(14).text('Detalhes Adicionais (Exemplo)', { underline: true });
        doc.moveDown();
        doc.fontSize(12).text("Aqui poderiam entrar tabelas com as vendas/compras detalhadas do período, produtos mais vendidos, etc.");

        doc.end();
    } catch (error) {
        console.error("Erro ao gerar PDF:", error);
        res.status(500).send("Erro ao gerar o relatório em PDF.");
    }
};