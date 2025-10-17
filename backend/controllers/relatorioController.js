// backend/controllers/relatorioController.js

const Venda = require('../models/vendaModel');
const Compra = require('../models/compraModel');
const Produto = require('../models/produtoModel');
const Fornecedor = require('../models/fornecedorModel'); // Importar Fornecedor
const mongoose = require('mongoose'); // Importar mongoose para usar ObjectId
const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

// Função auxiliar para obter o início e o fim do dia
const getStartOfDay = (date) => new Date(date.setHours(0, 0, 0, 0));
const getEndOfDay = (date) => new Date(date.setHours(23, 59, 59, 999));

// ... (função getReportData permanece a mesma) ...
exports.getReportData = async (req, res) => {
    // ... (código existente da função getReportData) ...
};


exports.generatePDFReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        if (!startDate || !endDate) {
            return res.status(400).send('Datas de início e fim são obrigatórias.');
        }

        const start = getStartOfDay(new Date(startDate));
        const end = getEndOfDay(new Date(endDate));

        // --- Buscar Dados Reais ---
        // (Busca os dados resumidos e detalhados como feito em getReportData)

        // Resumo
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

        // Dados para tabelas de vendas
        const topVendas = await Venda.find({ createdAt: { $gte: start, $lte: end } })
                                   .populate('cliente', 'nome')
                                   .sort({ valorTotal: -1 })
                                   .limit(5);
         const soldByArtist = await Venda.aggregate([
            { $match: { createdAt: { $gte: start, $lte: end } } },
            { $unwind: '$itens' },
            { $lookup: { from: 'produtos', localField: 'itens.produto', foreignField: '_id', as: 'productInfo' } },
            { $unwind: '$productInfo' },
            { $group: {
                _id: '$productInfo.artista',
                totalQuantity: { $sum: '$itens.quantidade' }
            }},
            { $sort: { totalQuantity: -1 } },
            { $limit: 5 } // Top 5 artistas
        ]);
        const revenueByCategory = await Venda.aggregate([
             { $match: { createdAt: { $gte: start, $lte: end } } },
             { $unwind: '$itens' },
             { $lookup: { from: 'produtos', localField: 'itens.produto', foreignField: '_id', as: 'productInfo' } },
             { $unwind: '$productInfo' },
             { $group: {
                 _id: '$productInfo.categoria',
                 categoryRevenue: { $sum: { $multiply: ['$itens.quantidade', '$itens.precoUnitario'] } }
             }},
              { $sort: { categoryRevenue: -1 } },
              { $limit: 5 } // Top 5 categorias
         ]);


        // Dados para tabela de compras
        const topCompras = await Compra.find({ dataCompra: { $gte: start, $lte: end } })
                                    .populate('fornecedor', 'nomeFantasia')
                                    .populate('produto', 'nome')
                                    .sort({ precoTotal: -1 })
                                    .limit(5);

        // --- Geração do PDF ---
        const doc = new PDFDocument({ margin: 50 });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename=relatorio_${startDate}_a_${endDate}.pdf`);
        doc.pipe(res);

        // --- Cabeçalho com Logo ---
        // (Código da logo já existente e correto)
        const logoPath = path.join(__dirname, '..', '..', 'public', 'images', 'listen.png');
        if (fs.existsSync(logoPath)) {
            doc.image(logoPath, { fit: [100, 100], align: 'center' }).moveDown(0.5);
        } else {
             doc.fontSize(20).text('Listen E-commerce', { align: 'center' }).moveDown(0.5); // Fallback caso a logo não exista
        }

        doc.fontSize(18).text('Relatório de Vendas e Compras', { align: 'center' });
        doc.fontSize(12).text(`Período: ${new Date(startDate).toLocaleDateString('pt-BR')} a ${new Date(endDate).toLocaleDateString('pt-BR')}`, { align: 'center' });
        doc.moveDown(2);

        // --- Resumo Financeiro ---
        doc.fontSize(14).text('Resumo Financeiro e de Quantidades', { underline: true });
        doc.moveDown();
        doc.fontSize(12).text(`Receita Total (Vendas): R$ ${summary.receita.toFixed(2)}`);
        doc.text(`Custo Total (Compras): R$ ${summary.custo.toFixed(2)}`);
        doc.text(`Lucro Bruto: R$ ${summary.lucro.toFixed(2)}`);
        doc.text(`Total de Itens Vendidos: ${summary.quantidadeVendida}`);
        doc.text(`Total de Itens Comprados: ${summary.quantidadeComprada}`);
        doc.moveDown(2);

        // --- Detalhes de Vendas ---
        doc.fontSize(14).text('Detalhes de Vendas', { underline: true }).moveDown();

        // Tabela Top 5 Vendas
        doc.fontSize(12).text('Top 5 Vendas por Valor', { underline: false });
        doc.moveDown(0.5);
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
        doc.y = yVendas; // Atualiza a posição Y
        doc.moveDown(1.5);

        // Tabela Top 5 Artistas por Quantidade Vendida (NOVO)
        doc.fontSize(12).text('Top 5 Artistas por Quantidade Vendida', { underline: false });
        doc.moveDown(0.5);
        const tableTopArtistas = doc.y;
        doc.fontSize(10);
        doc.text('Artista', 50, tableTopArtistas);
        doc.text('Quantidade Vendida', 400, tableTopArtistas, { width: 100, align: 'right' });
        doc.moveTo(50, tableTopArtistas + 15).lineTo(550, tableTopArtistas + 15).stroke();
        let yArtistas = tableTopArtistas + 25;
        soldByArtist.forEach(item => {
            doc.text(item._id || 'N/A', 50, yArtistas, { width: 340, ellipsis: true });
            doc.text(item.totalQuantity.toString(), 400, yArtistas, { width: 100, align: 'right' });
            yArtistas += 20;
        });
         doc.y = yArtistas; // Atualiza a posição Y
        doc.moveDown(1.5);

        // Tabela Top 5 Categorias por Receita (NOVO)
        doc.fontSize(12).text('Top 5 Categorias por Receita', { underline: false });
        doc.moveDown(0.5);
        const tableTopCategorias = doc.y;
        doc.fontSize(10);
        doc.text('Categoria', 50, tableTopCategorias);
        doc.text('Receita Gerada', 400, tableTopCategorias, { width: 100, align: 'right' });
        doc.moveTo(50, tableTopCategorias + 15).lineTo(550, tableTopCategorias + 15).stroke();
        let yCategorias = tableTopCategorias + 25;
        revenueByCategory.forEach(item => {
             doc.text(item._id || 'N/A', 50, yCategorias, { width: 340, ellipsis: true });
             doc.text(`R$ ${item.categoryRevenue.toFixed(2)}`, 400, yCategorias, { width: 100, align: 'right' });
             yCategorias += 20;
        });
         doc.y = yCategorias; // Atualiza a posição Y
        doc.moveDown(2);


        // --- Detalhes de Compras ---
        doc.fontSize(14).text('Detalhes de Compras', { underline: true }).moveDown();

        // Tabela Top 5 Compras
        doc.fontSize(12).text('Top 5 Compras por Valor', { underline: false });
        doc.moveDown(0.5);
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