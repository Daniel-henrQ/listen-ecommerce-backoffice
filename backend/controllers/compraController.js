const Compra = require('../models/compraModel');
const Produto = require('../models/produtoModel'); // Importar o modelo de Produto
const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

// Criar nova compra
exports.criarCompra = async (req, res) => {
    try {
        const {
            produto, fornecedor, quantidade, precoUnitario,
            isNewProduct, novoProdutoNome, novoProdutoArtista, novoProdutoCategoria
        } = req.body;

        const comprador = req.user.id;
        const precoTotal = quantidade * precoUnitario;
        let produtoId;

        if (isNewProduct === 'true') {
            // Se for um novo produto, cria primeiro o produto
            if (!novoProdutoNome || !novoProdutoArtista || !novoProdutoCategoria) {
                return res.status(400).json({ msg: "Nome, artista e categoria são obrigatórios para um novo produto." });
            }
            const novoProduto = new Produto({
                nome: novoProdutoNome,
                artista: novoProdutoArtista,
                categoria: novoProdutoCategoria,
                fornecedor: fornecedor,
                preco: 0, // Preço de venda pode ser definido depois
                quantidade: 0, // O estoque será atualizado ao finalizar a compra
            });
            const produtoSalvo = await novoProduto.save();
            produtoId = produtoSalvo._id;
        } else {
            // Usa o ID do produto existente
            produtoId = produto;
        }

        const novaCompra = new Compra({
            produto: produtoId,
            fornecedor,
            comprador,
            quantidade,
            precoUnitario,
            precoTotal
        });

        await novaCompra.save();
        res.status(201).json(novaCompra);
    } catch (error) {
        res.status(500).json({ msg: "Ocorreu um erro no servidor.", error: error.message });
    }
};

// Listar todas as compras
exports.listarCompras = async (req, res) => {
    try {
        const compras = await Compra.find()
            .populate('produto', 'nome artista')
            .populate('fornecedor', 'nomeFantasia cnpj')
            .populate('comprador', 'name email')
            .sort({ dataCompra: -1 });
        res.json(compras);
    } catch (error) {
        res.status(500).json({ msg: "Erro ao buscar compras." });
    }
};

// Gerar Nota Fiscal em PDF
exports.gerarNotaFiscalPDF = async (req, res) => {
    try {
        const compra = await Compra.findById(req.params.id)
            .populate('produto')
            .populate('fornecedor')
            .populate('comprador');

        if (!compra) {
            return res.status(404).send('Compra não encontrada');
        }

        const doc = new PDFDocument({ margin: 50 });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename=nota-fiscal-${compra.numeroNotaFiscal}.pdf`);

        doc.pipe(res);

        // --- Cabeçalho com Logo ---
        // (Código da logo já existente e correto)
        const logoPath = path.join(__dirname, '..', '..', 'public', 'images', 'listen.png'); // Caminho relativo ajustado
        if (fs.existsSync(logoPath)) {
            doc.image(logoPath, {
                fit: [150, 150], // Ajuste o tamanho conforme necessário
                align: 'center',
                valign: 'top'
            });
             doc.moveDown(2); // Espaço após a logo
        } else {
            console.warn(`Logo não encontrada em: ${logoPath}`); // Aviso no console do servidor
            doc.fontSize(20).text('Listen E-commerce', { align: 'center' }); // Texto alternativo
             doc.moveDown(2);
        }

        // --- Título ---
        doc.fontSize(18).text(`Nota Fiscal de Compra: ${compra.numeroNotaFiscal}`, { align: 'center' });
        doc.moveDown(2);

        // --- Informações do Fornecedor ---
        doc.fontSize(14).text('Dados do Fornecedor', { underline: true });
        doc.fontSize(12).text(`Nome Fantasia: ${compra.fornecedor.nomeFantasia}`);
        doc.text(`CNPJ: ${compra.fornecedor.cnpj}`);
        doc.text(`Endereço: ${compra.fornecedor.endereco.logradouro || ''}, ${compra.fornecedor.endereco.numero || ''} - ${compra.fornecedor.endereco.cidade || ''}, ${compra.fornecedor.endereco.estado || ''}`);
        doc.moveDown();

        // --- Informações do Comprador ---
        doc.fontSize(14).text('Dados do Comprador (Listen)', { underline: true });
        doc.fontSize(12).text(`Comprado por: ${compra.comprador.name}`);
        doc.text(`Email: ${compra.comprador.email}`);
        // Adicionar CNPJ da Listen se necessário/disponível
        doc.moveDown(2);

        // --- Detalhes da Compra ---
        doc.fontSize(14).text('Detalhes da Compra', { underline: true });
        const tableTop = doc.y + 15; // Adiciona um pequeno espaço antes da tabela
        doc.fontSize(10); // Fonte menor para a tabela

        // Cabeçalhos da tabela
        const headerY = tableTop;
        doc.font('Helvetica-Bold'); // Negrito para cabeçalhos
        doc.text('Produto', 50, headerY, { width: 240 });
        doc.text('Qtd.', 300, headerY, { width: 50, align: 'right'});
        doc.text('Preço Unit.', 370, headerY, { width: 80, align: 'right'});
        doc.text('Subtotal', 470, headerY, { width: 80, align: 'right'});
        doc.font('Helvetica'); // Volta para a fonte normal

        // Linha abaixo dos cabeçalhos
        doc.moveTo(50, headerY + 15).lineTo(550, headerY + 15).strokeOpacity(0.5).strokeColor('#aaaaaa').stroke();

        // Linha do produto
        const itemY = headerY + 25;
        doc.fontSize(10).text(`${compra.produto.nome} - ${compra.produto.artista || ''}`, 50, itemY, { width: 240, ellipsis: true });
        doc.text(compra.quantidade.toString(), 300, itemY, { width: 50, align: 'right'});
        doc.text(`R$ ${compra.precoUnitario.toFixed(2)}`, 370, itemY, { width: 80, align: 'right'});
        doc.text(`R$ ${compra.precoTotal.toFixed(2)}`, 470, itemY, { width: 80, align: 'right'});

        // Linha abaixo do item
        const endTableY = itemY + 20;
        doc.moveTo(50, endTableY).lineTo(550, endTableY).strokeOpacity(0.5).strokeColor('#aaaaaa').stroke();
        doc.moveDown(2);


        // --- Total ---
        doc.fontSize(14).font('Helvetica-Bold').text(`Total da Compra: R$ ${compra.precoTotal.toFixed(2)}`, { align: 'right'});
        doc.font('Helvetica'); // Volta para a fonte normal
        doc.moveDown();

        // --- Data ---
        doc.fontSize(10).text(`Data da Compra: ${new Date(compra.dataCompra).toLocaleDateString('pt-BR')}`, { align: 'right'});


        doc.end();

    } catch (error) {
        console.error("Erro ao gerar PDF da Nota Fiscal:", error);
        res.status(500).send("Erro ao gerar a nota fiscal.");
    }
};

// Atualizar o status de uma compra
exports.atualizarStatusCompra = async (req, res) => {
    try {
        const { status } = req.body;
        const compra = await Compra.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true, runValidators: true }
        );

        if (!compra) {
            return res.status(404).json({ msg: "Compra não encontrada." });
        }

        res.json(compra);
    } catch (error) {
        res.status(500).json({ msg: "Ocorreu um erro no servidor.", error: error.message });
    }
};