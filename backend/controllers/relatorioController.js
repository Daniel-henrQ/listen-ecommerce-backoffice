const Venda = require('../models/vendaModel');
const Compra = require('../models/compraModel');
const Produto = require('../models/produtoModel');
const Fornecedor = require('../models/fornecedorModel');
const mongoose = require('mongoose');
const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');
const { notificacaoService } = require('./notificacaoService'); // Importar o serviço

// Função auxiliar para obter o início e o fim do dia (UTC para consistência)
const getStartOfDayUTC = (date) => {
    const d = new Date(date);
    d.setUTCHours(0, 0, 0, 0);
    return d;
};
const getEndOfDayUTC = (date) => {
    const d = new Date(date);
    d.setUTCHours(23, 59, 59, 999);
    return d;
};

// Função principal para buscar dados para os gráficos/relatório JSON
exports.getReportData = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'Datas de início e fim são obrigatórias.' });
        }

        // Usar UTC para evitar problemas de fuso horário nas queries de data
        const start = getStartOfDayUTC(startDate);
        const end = getEndOfDayUTC(endDate);

        // --- Cálculos de Resumo (Summary) ---
        const [salesSummaryRes, purchaseSummaryRes] = await Promise.all([
            Venda.aggregate([
                { $match: { createdAt: { $gte: start, $lte: end } } },
                { $group: {
                    _id: null,
                    totalRevenue: { $sum: '$valorTotal' },
                    totalItemsSold: { $sum: { $sum: '$itens.quantidade' } }
                }},
            ]),
             Compra.aggregate([
                { $match: { dataCompra: { $gte: start, $lte: end }, status: { $ne: 'Cancelada' } } }, // Ignora compras canceladas no custo
                { $group: {
                     _id: null,
                     totalCost: { $sum: '$precoTotal' },
                     totalItemsPurchased: { $sum: '$quantidade' }
                }},
            ])
        ]);

        const salesSummary = salesSummaryRes[0] || { totalRevenue: 0, totalItemsSold: 0 };
        const purchaseSummary = purchaseSummaryRes[0] || { totalCost: 0, totalItemsPurchased: 0 };

        const summary = {
            receita: salesSummary.totalRevenue,
            custo: purchaseSummary.totalCost,
            lucro: salesSummary.totalRevenue - purchaseSummary.totalCost,
            quantidadeVendida: salesSummary.totalItemsSold,
            quantidadeComprada: purchaseSummary.totalItemsPurchased,
        };

        // --- Cálculos para Gráficos (Charts) ---
        // Usando Promise.all para executar queries em paralelo
        const [
            revenueEvolution,
            soldByArtist,
            revenueByCategory,
            purchasesBySupplier,
            purchasesByCategory,
            revenueVsCostEvolution // Adicionado para Receita vs Custo mensal
        ] = await Promise.all([
            // Evolução da Receita Diária
            Venda.aggregate([
                { $match: { createdAt: { $gte: start, $lte: end } } },
                { $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "UTC" } }, // Usar UTC
                    dailyRevenue: { $sum: '$valorTotal' }
                }},
                { $sort: { _id: 1 } },
                { $project: { _id: 0, date: '$_id', value: '$dailyRevenue' } }
            ]),
            // Vendas por Artista (Quantidade)
            Venda.aggregate([
                { $match: { createdAt: { $gte: start, $lte: end } } },
                { $unwind: '$itens' },
                { $lookup: { from: 'produtos', localField: 'itens.produto', foreignField: '_id', as: 'productInfo' } },
                { $unwind: '$productInfo' },
                { $group: {
                    _id: '$productInfo.artista',
                    totalQuantity: { $sum: '$itens.quantidade' }
                }},
                { $sort: { totalQuantity: -1 } },
                { $project: { _id: 0, artist: '$_id', quantity: '$totalQuantity' } },
                { $limit: 10 } // Limitar aos top 10 para o gráfico não ficar muito grande
            ]),
             // Receita por Categoria
             Venda.aggregate([
                { $match: { createdAt: { $gte: start, $lte: end } } },
                { $unwind: '$itens' },
                { $lookup: { from: 'produtos', localField: 'itens.produto', foreignField: '_id', as: 'productInfo' } },
                { $unwind: '$productInfo' },
                { $group: {
                    _id: '$productInfo.categoria',
                    categoryRevenue: { $sum: { $multiply: ['$itens.quantidade', '$itens.precoUnitario'] } } // Correto: usar o preço unitário do item da venda
                }},
                { $sort: { categoryRevenue: -1 } },
                { $project: { _id: 0, category: '$_id', revenue: '$categoryRevenue' } },
                { $limit: 10 } // Top 10 categorias
             ]),
            // Compras por Fornecedor (Custo)
            Compra.aggregate([
                { $match: { dataCompra: { $gte: start, $lte: end }, status: { $ne: 'Cancelada' } } },
                { $lookup: { from: 'fornecedors', localField: 'fornecedor', foreignField: '_id', as: 'supplierInfo' } },
                { $unwind: '$supplierInfo' },
                { $group: {
                    _id: '$supplierInfo.nomeFantasia',
                    totalCost: { $sum: '$precoTotal' }
                }},
                { $sort: { totalCost: -1 } },
                { $project: { _id: 0, supplier: '$_id', cost: '$totalCost' } },
                 { $limit: 10 } // Top 10 fornecedores
            ]),
            // Custo de Compras por Categoria de Produto
            Compra.aggregate([
                 { $match: { dataCompra: { $gte: start, $lte: end }, status: { $ne: 'Cancelada' } } },
                 { $lookup: { from: 'produtos', localField: 'produto', foreignField: '_id', as: 'productInfo' } },
                 { $unwind: '$productInfo' },
                 { $group: {
                     _id: '$productInfo.categoria',
                     categoryCost: { $sum: '$precoTotal' }
                 }},
                 { $sort: { categoryCost: -1 } },
                 { $project: { _id: 0, category: '$_id', cost: '$categoryCost' } },
                 { $limit: 5 } // Top 5 categorias para gráfico de pizza
            ]),
             // Evolução Receita vs Custo (Mensal - baseado no período selecionado)
             Venda.aggregate([
                { $match: { createdAt: { $gte: start, $lte: end } } },
                { $group: {
                    _id: { $dateToString: { format: "%Y-%m", date: "$createdAt", timezone: "UTC" } }, // Agrupa por Ano-Mês
                    monthlyRevenue: { $sum: '$valorTotal' }
                }},
                 { $sort: { _id: 1 } },
                 { $lookup: { // Junta com os custos mensais do mesmo período
                     from: 'compras',
                     let: { monthYear: '$_id' },
                     pipeline: [
                         { $match: {
                             dataCompra: { $gte: start, $lte: end },
                             status: { $ne: 'Cancelada' },
                             $expr: { $eq: [{ $dateToString: { format: "%Y-%m", date: "$dataCompra", timezone: "UTC" } }, '$$monthYear'] }
                         }},
                         { $group: {
                             _id: null, // Agrupa todos os custos do mês
                             monthlyCost: { $sum: '$precoTotal' }
                         }}
                     ],
                     as: 'monthlyCosts'
                 }},
                { $project: {
                    _id: 0,
                    month: '$_id',
                    revenue: '$monthlyRevenue',
                    // Pega o custo do primeiro (e único) resultado do $lookup ou 0
                    cost: { $ifNull: [ { $arrayElemAt: ['$monthlyCosts.monthlyCost', 0] }, 0 ] }
                }}
             ])
        ]);

        // Filtrar categorias com receita > 0 para o gráfico de pizza Top Categorias
         const topCategoriesRevenue = revenueByCategory
            .filter(item => item.revenue > 0)
            .slice(0, 5); // Pega as top 5 após filtrar


        // --- Monta a Resposta ---
        res.json({
            summary,
            charts: {
                revenueEvolution,
                soldByArtist,
                revenueByCategory, // Agora limitado no backend
                purchasesBySupplier, // Agora limitado no backend
                purchasesByCategory, // Agora limitado no backend
                revenueVsCostEvolution,
                topCategoriesRevenue // Dados filtrados para o gráfico de pizza
            }
        });

    } catch (error) {
        console.error("Erro ao buscar dados do relatório:", error);
        res.status(500).json({ error: "Erro interno do servidor ao processar o relatório." });
    }
};


// Função para gerar o relatório em PDF
exports.generatePDFReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        if (!startDate || !endDate) {
            return res.status(400).send('Datas de início e fim são obrigatórias.');
        }

        const start = getStartOfDayUTC(startDate); // Usar UTC
        const end = getEndOfDayUTC(endDate);     // Usar UTC

        // --- Buscar Dados Reais (similar a getReportData) ---
        const [salesSummaryRes, purchaseSummaryRes, topVendas, soldByArtist, revenueByCategory, topCompras] = await Promise.all([
             Venda.aggregate([
                { $match: { createdAt: { $gte: start, $lte: end } } },
                { $group: { _id: null, totalRevenue: { $sum: '$valorTotal' }, totalItemsSold: { $sum: { $sum: '$itens.quantidade' } } } }
            ]),
            Compra.aggregate([
                { $match: { dataCompra: { $gte: start, $lte: end }, status: { $ne: 'Cancelada' } } },
                { $group: { _id: null, totalCost: { $sum: '$precoTotal' }, totalItemsPurchased: { $sum: '$quantidade' } } }
            ]),
            Venda.find({ createdAt: { $gte: start, $lte: end } })
               .populate('cliente', 'nome')
               .sort({ valorTotal: -1 })
               .limit(5),
             Venda.aggregate([ // Vendas por Artista
                { $match: { createdAt: { $gte: start, $lte: end } } },
                { $unwind: '$itens' }, { $lookup: { from: 'produtos', localField: 'itens.produto', foreignField: '_id', as: 'productInfo' } }, { $unwind: '$productInfo' },
                { $group: { _id: '$productInfo.artista', totalQuantity: { $sum: '$itens.quantidade' } } },
                { $sort: { totalQuantity: -1 } }, { $limit: 5 }
             ]),
             Venda.aggregate([ // Receita por Categoria
                 { $match: { createdAt: { $gte: start, $lte: end } } },
                 { $unwind: '$itens' }, { $lookup: { from: 'produtos', localField: 'itens.produto', foreignField: '_id', as: 'productInfo' } }, { $unwind: '$productInfo' },
                 { $group: { _id: '$productInfo.categoria', categoryRevenue: { $sum: { $multiply: ['$itens.quantidade', '$itens.precoUnitario'] } } } },
                  { $sort: { categoryRevenue: -1 } }, { $limit: 5 }
             ]),
            Compra.find({ dataCompra: { $gte: start, $lte: end }, status: { $ne: 'Cancelada' } }) // Ignora canceladas
                .populate('fornecedor', 'nomeFantasia')
                .populate('produto', 'nome')
                .sort({ precoTotal: -1 })
                .limit(5)
        ]);

        const salesSummary = salesSummaryRes[0] || { totalRevenue: 0, totalItemsSold: 0 };
        const purchaseSummary = purchaseSummaryRes[0] || { totalCost: 0, totalItemsPurchased: 0 };
        const summary = {
            receita: salesSummary.totalRevenue,
            custo: purchaseSummary.totalCost,
            lucro: salesSummary.totalRevenue - purchaseSummary.totalCost,
            quantidadeVendida: salesSummary.totalItemsSold,
            quantidadeComprada: purchaseSummary.totalItemsPurchased,
        };

        // --- Geração do PDF ---
        const doc = new PDFDocument({ margin: 50 });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename=relatorio_${startDate}_a_${endDate}.pdf`);
        doc.pipe(res);

        // --- Cabeçalho com Logo ---
        const logoPath = path.join(__dirname, '..', '..', 'public', 'images', 'listen.png');
        if (fs.existsSync(logoPath)) {
            doc.image(logoPath, { fit: [100, 100], align: 'center' }).moveDown(0.5);
        } else {
             doc.fontSize(20).text('Listen E-commerce', { align: 'center' }).moveDown(0.5);
        }

        doc.fontSize(18).text('Relatório de Vendas e Compras', { align: 'center' });
        doc.fontSize(12).text(`Período: ${new Date(startDate).toLocaleDateString('pt-BR')} a ${new Date(endDate).toLocaleDateString('pt-BR')}`, { align: 'center' });
        doc.moveDown(2);

        // --- Resumo Financeiro ---
        doc.fontSize(14).text('Resumo Financeiro e de Quantidades', { underline: true });
        doc.moveDown();
        doc.fontSize(12).text(`Receita Total (Vendas): R$ ${summary.receita.toFixed(2)}`);
        doc.text(`Custo Total (Compras): R$ ${summary.custo.toFixed(2)}`);
        doc.font('Helvetica-Bold').text(`Lucro Bruto: R$ ${summary.lucro.toFixed(2)}`).font('Helvetica');
        doc.text(`Total de Itens Vendidos: ${summary.quantidadeVendida}`);
        doc.text(`Total de Itens Comprados: ${summary.quantidadeComprada}`);
        doc.moveDown(2);

        // --- Detalhes de Vendas ---
        doc.fontSize(14).text('Detalhes de Vendas', { underline: true }).moveDown();

        // Função auxiliar para desenhar tabelas
         const drawTable = (title, headers, data, yStart) => {
             doc.fontSize(12).text(title, { underline: false });
             doc.moveDown(0.5);
             const tableTop = yStart || doc.y;
             const startX = 50;
             let currentX = startX;
             const rowHeight = 20;
             const headerHeight = 15;
             const tableWidth = 500; // Largura total da tabela

             doc.fontSize(10).font('Helvetica-Bold');
             headers.forEach(header => {
                 doc.text(header.label, currentX, tableTop, { width: header.width, align: header.align || 'left' });
                 currentX += header.width + (header.padding || 5); // Adiciona padding
             });
             doc.font('Helvetica');
             doc.moveTo(startX, tableTop + headerHeight).lineTo(startX + tableWidth, tableTop + headerHeight).strokeOpacity(0.5).strokeColor('#aaaaaa').stroke();

             let currentY = tableTop + headerHeight + 5;
             data.forEach(row => {
                 currentX = startX;
                 headers.forEach(header => {
                     doc.text(row[header.key] || 'N/A', currentX, currentY, { width: header.width, align: header.align || 'left', ellipsis: true });
                     currentX += header.width + (header.padding || 5);
                 });
                 currentY += rowHeight;
             });
             doc.y = currentY; // Atualiza a posição Y global
             doc.moveDown(1.5);
         };

        // Tabela Top 5 Vendas
         drawTable('Top 5 Vendas por Valor',
             [
                 { key: 'cliente', label: 'Cliente', width: 200 },
                 { key: 'valor', label: 'Valor Total', width: 100, align: 'right' },
                 { key: 'data', label: 'Data', width: 100, align: 'right' }
             ],
             topVendas.map(v => ({ cliente: v.cliente?.nome, valor: `R$ ${v.valorTotal.toFixed(2)}`, data: new Date(v.createdAt).toLocaleDateString('pt-BR') }))
         );

        // Tabela Top 5 Artistas
         drawTable('Top 5 Artistas por Quantidade Vendida',
             [
                 { key: 'artista', label: 'Artista', width: 350 },
                 { key: 'quantidade', label: 'Qtd. Vendida', width: 100, align: 'right' }
             ],
             soldByArtist.map(item => ({ artista: item._id || 'N/A', quantidade: item.totalQuantity.toString() }))
         );

        // Tabela Top 5 Categorias por Receita
         drawTable('Top 5 Categorias por Receita',
             [
                 { key: 'categoria', label: 'Categoria', width: 350 },
                 { key: 'receita', label: 'Receita Gerada', width: 100, align: 'right' }
             ],
             revenueByCategory.map(item => ({ categoria: item._id || 'N/A', receita: `R$ ${item.categoryRevenue.toFixed(2)}` }))
         );


        // --- Detalhes de Compras ---
        doc.fontSize(14).text('Detalhes de Compras', { underline: true }).moveDown();

         // Tabela Top 5 Compras
         drawTable('Top 5 Compras por Valor',
             [
                 { key: 'fornecedor', label: 'Fornecedor', width: 150 },
                 { key: 'produto', label: 'Produto', width: 200 },
                 { key: 'valor', label: 'Valor Total', width: 100, align: 'right' }
             ],
             topCompras.map(compra => ({
                 fornecedor: compra.fornecedor?.nomeFantasia,
                 produto: compra.produto?.nome,
                 valor: `R$ ${compra.precoTotal.toFixed(2)}`
             }))
         );

         // --- NOTIFICAÇÃO ---
         try {
            const periodo = `${new Date(startDate).toLocaleDateString('pt-BR')} a ${new Date(endDate).toLocaleDateString('pt-BR')}`;
            await notificacaoService.notificarRelatorioGerado('Vendas e Compras (PDF)', periodo);
         } catch (notifError) {
            console.error("Erro ao criar notificação de relatório PDF:", notifError);
         }
        // --- FIM NOTIFICAÇÃO ---

        doc.end();
    } catch (error) {
        console.error("Erro ao gerar PDF:", error);
        res.status(500).send("Erro ao gerar o relatório em PDF.");
    }
};