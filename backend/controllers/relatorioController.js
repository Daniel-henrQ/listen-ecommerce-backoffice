const Venda = require('../models/vendaModel');
const Compra = require('../models/compraModel');
const Produto = require('../models/produtoModel');
const Fornecedor = require('../models/fornecedorModel'); // Importar Fornecedor
const mongoose = require('mongoose'); // Importar mongoose para usar ObjectId
const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

// Função auxiliar para obter o início e o fim do dia para garantir que a data final seja inclusiva
const getStartOfDay = (date) => new Date(date.setHours(0, 0, 0, 0));
const getEndOfDay = (date) => new Date(date.setHours(23, 59, 59, 999));

exports.getReportData = async (req, res) => {
    try {
        let { startDate, endDate } = req.query;
        let errorMsg = null; // Para armazenar mensagens de erro

        // Se as datas não forem fornecidas, usa o mês atual como padrão
        if (!startDate || !endDate) {
            const today = new Date();
            startDate = new Date(today.getFullYear(), today.getMonth(), 1);
            endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        } else {
            // Validar se as datas são válidas
            startDate = new Date(startDate);
            endDate = new Date(endDate);
            if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                return res.status(400).json({ msg: "Datas de início ou fim inválidas." });
            }
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
            { $group: {
                 _id: null,
                 totalCost: { $sum: '$precoTotal' },
                 totalItemsPurchased: { $sum: '$quantidade' } // Adicionado
            }},
        ]);

        const revenue = salesSummary[0]?.totalRevenue || 0;
        const cost = purchaseSummary[0]?.totalCost || 0;
        const itemsSold = salesSummary[0]?.totalItemsSold || 0;
        const itemsPurchased = purchaseSummary[0]?.totalItemsPurchased || 0; // Adicionado

        // --- 2. Evolução da Receita (Gráfico de Linha Vendas) ---
        const revenueEvolution = await Venda.aggregate([
            { $match: dateFilterVendas },
            { $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                dailyRevenue: { $sum: "$valorTotal" }
            }},
            { $sort: { _id: 1 } }
        ]);

        // --- 3. Quantidade Vendida por Artista (Gráfico de Barras Vendas) ---
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
            { $limit: 6 } // Limita aos top 6
        ]);

        // --- 4. Receita por Categoria (Gráfico de Barras Vendas) ---
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
             { $limit: 4 } // Limita aos top 4
        ]);

        // --- 5. Evolução Receita vs Custo (Gráfico de Área/Linha Combinado) ---
         const monthlyRevenue = await Venda.aggregate([
            { $match: { createdAt: { $gte: start, $lte: end } } }, // Filtro geral de data
            { $group: {
                 _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
                 monthlyRevenue: { $sum: "$valorTotal" }
            }},
            { $sort: { _id: 1 } }
        ]);
         const monthlyCost = await Compra.aggregate([
            { $match: { dataCompra: { $gte: start, $lte: end } } }, // Filtro geral de data
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

        // --- 6. Custo por Fornecedor (Gráfico de Barras Compras) --- *** NOVO ***
        const purchasesBySupplier = await Compra.aggregate([
            { $match: dateFilterCompras },
            { $lookup: { from: 'fornecedors', localField: 'fornecedor', foreignField: '_id', as: 'supplierInfo' } },
            { $unwind: '$supplierInfo' },
            { $group: {
                _id: '$supplierInfo.nomeFantasia', // Agrupa pelo nome fantasia do fornecedor
                totalCost: { $sum: '$precoTotal' }
            }},
            { $sort: { totalCost: -1 } },
            { $limit: 6 } // Limita aos top 6
        ]);

        // --- 7. Custo por Categoria (Gráfico de Pizza Compras) --- *** NOVO ***
        const purchasesByCategory = await Compra.aggregate([
            { $match: dateFilterCompras },
            { $lookup: { from: 'produtos', localField: 'produto', foreignField: '_id', as: 'productInfo' } },
            { $unwind: '$productInfo' },
            { $group: {
                _id: '$productInfo.categoria', // Agrupa pela categoria do produto comprado
                totalCost: { $sum: '$precoTotal' }
            }},
            { $sort: { totalCost: -1 } },
             { $limit: 5 } // Limita aos top 5
        ]);


        // Monta o objeto de resposta final
        const reportData = {
            summary: {
                receita: revenue,
                custo: cost,
                lucro: revenue - cost,
                quantidadeVendida: itemsSold,
                quantidadeComprada: itemsPurchased, // Adicionado
            },
            charts: {
                revenueEvolution: revenueEvolution.map(item => ({ date: item._id, value: item.dailyRevenue })),
                soldByArtist: soldByArtist.map(item => ({ artist: item._id, quantity: item.totalQuantity })),
                revenueByCategory: revenueByCategory.map(item => ({ category: item._id, revenue: item.categoryRevenue })),
                revenueVsCostEvolution: revenueVsCostEvolution,
                topCategoriesRevenue: revenueByCategory.map(item => ({ category: item._id, revenue: item.categoryRevenue })),
                purchasesBySupplier: purchasesBySupplier.map(item => ({ supplier: item._id, cost: item.totalCost })), // Adicionado
                purchasesByCategory: purchasesByCategory.map(item => ({ category: item._id, cost: item.totalCost })), // Adicionado
            },
            error: errorMsg // Inclui a mensagem de erro se houver
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

        // Buscar dados reais para o PDF (similar à busca para os gráficos)
        const start = getStartOfDay(new Date(startDate));
        const end = getEndOfDay(new Date(endDate));

        const salesSummary = await Venda.aggregate([
            { $match: { createdAt: { $gte: start, $lte: end } } },
            { $group: {
                _id: null,
                totalRevenue: { $sum: '$valorTotal' },
                totalItemsSold: { $sum: { $sum: '$itens.quantidade' } }
            }},
        ]);

        const purchaseSummary = await Compra.aggregate([
            { $match: { dataCompra: { $gte: start, $lte: end } } },
            { $group: {
                 _id: null,
                 totalCost: { $sum: '$precoTotal' },
                 totalItemsPurchased: { $sum: '$quantidade' }
            }},
        ]);

        const summary = {
            receita: salesSummary[0]?.totalRevenue || 0,
            custo: purchaseSummary[0]?.totalCost || 0,
            lucro: (salesSummary[0]?.totalRevenue || 0) - (purchaseSummary[0]?.totalCost || 0),
            quantidadeVendida: salesSummary[0]?.totalItemsSold || 0,
            quantidadeComprada: purchaseSummary[0]?.totalItemsPurchased || 0,
        };

        const doc = new PDFDocument({ margin: 50 });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename=relatorio_${startDate}_a_${endDate}.pdf`);
        doc.pipe(res);

        // --- Cabeçalho com Logo ---
        const logoPath = path.join(__dirname, '..', '..', 'public', 'images', 'listen.png');
        if (fs.existsSync(logoPath)) {
            doc.image(logoPath, { fit: [100, 100], align: 'center' }).moveDown(0.5);
        }

        doc.fontSize(18).text('Relatório de Vendas e Compras', { align: 'center' });
        doc.fontSize(12).text(`Período: ${new Date(startDate).toLocaleDateString('pt-BR')} a ${new Date(endDate).toLocaleDateString('pt-BR')}`, { align: 'center' });
        doc.moveDown(2);
        doc.fontSize(14).text('Resumo Financeiro e de Quantidades', { underline: true });
        doc.moveDown();
        doc.fontSize(12).text(`Receita Total (Vendas): R$ ${summary.receita.toFixed(2)}`);
        doc.text(`Custo Total (Compras): R$ ${summary.custo.toFixed(2)}`);
        doc.text(`Lucro Bruto: R$ ${summary.lucro.toFixed(2)}`);
        doc.text(`Total de Itens Vendidos: ${summary.quantidadeVendida}`);
        doc.text(`Total de Itens Comprados: ${summary.quantidadeComprada}`);
        doc.moveDown(2);

        // --- Adicionar Tabelas (Exemplo: Top 5 Vendas) ---
        doc.fontSize(14).text('Top 5 Vendas no Período', { underline: true });
        doc.moveDown();
        const topVendas = await Venda.find({ createdAt: { $gte: start, $lte: end } })
                                   .populate('cliente', 'nome')
                                   .sort({ valorTotal: -1 })
                                   .limit(5);

        const tableTopVendas = doc.y;
        doc.fontSize(10);
        doc.text('Cliente', 50, tableTopVendas);
        doc.text('Valor Total', 250, tableTopVendas, { width: 100, align: 'right' });
        doc.text('Data', 400, tableTopVendas, { width: 100, align: 'right' });
        doc.moveTo(50, tableTopVendas + 15).lineTo(550, tableTopVendas + 15).stroke();

        let yVendas = tableTopVendas + 25;
        topVendas.forEach(venda => {
            doc.text(venda.cliente?.nome || 'N/A', 50, yVendas);
            doc.text(`R$ ${venda.valorTotal.toFixed(2)}`, 250, yVendas, { width: 100, align: 'right' });
            doc.text(new Date(venda.createdAt).toLocaleDateString('pt-BR'), 400, yVendas, { width: 100, align: 'right' });
            yVendas += 20;
        });
        doc.moveDown(2);

        // --- Adicionar Tabelas (Exemplo: Top 5 Compras) ---
        doc.fontSize(14).text('Top 5 Compras no Período', { underline: true });
        doc.moveDown();
        const topCompras = await Compra.find({ dataCompra: { $gte: start, $lte: end } })
                                    .populate('fornecedor', 'nomeFantasia')
                                    .populate('produto', 'nome')
                                    .sort({ precoTotal: -1 })
                                    .limit(5);

        const tableTopCompras = doc.y;
        doc.fontSize(10);
        doc.text('Fornecedor', 50, tableTopCompras);
        doc.text('Produto', 200, tableTopCompras);
        doc.text('Valor Total', 400, tableTopCompras, { width: 100, align: 'right' });
        doc.moveTo(50, tableTopCompras + 15).lineTo(550, tableTopCompras + 15).stroke();

        let yCompras = tableTopCompras + 25;
        topCompras.forEach(compra => {
             doc.text(compra.fornecedor?.nomeFantasia || 'N/A', 50, yCompras, { width: 140, ellipsis: true });
             doc.text(compra.produto?.nome || 'N/A', 200, yCompras, { width: 190, ellipsis: true });
             doc.text(`R$ ${compra.precoTotal.toFixed(2)}`, 400, yCompras, { width: 100, align: 'right' });
             yCompras += 20;
        });

        doc.end();
    } catch (error) {
        console.error("Erro ao gerar PDF:", error);
        res.status(500).send("Erro ao gerar o relatório em PDF.");
    }
};