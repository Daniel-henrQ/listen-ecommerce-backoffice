const Compra = require('../models/compraModel');
const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

// Criar nova compra
exports.criarCompra = async (req, res) => {
    try {
        const { produto, fornecedor, quantidade, precoUnitario } = req.body;
        const precoTotal = quantidade * precoUnitario;
        const comprador = req.user.id; // ID do usuário logado (do checkToken)

        const novaCompra = new Compra({
            produto,
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
        // Alterado para carregar um arquivo .png
        const logoPath = path.join(__dirname, '..', '..', 'public', 'images', 'listen.png'); // Supondo que o nome seja 'listen.png'
        if (fs.existsSync(logoPath)) {
            doc.image(logoPath, {
                fit: [150, 150], // Tamanho da imagem
                align: 'center',
                valign: 'top'
            });
        } else {
            doc.fontSize(20).text('Listen E-commerce', { align: 'center' });
        }
        doc.moveDown(2);


        // --- Título ---
        doc.fontSize(18).text(`Nota Fiscal: ${compra.numeroNotaFiscal}`, { align: 'center' });
        doc.moveDown(2);


        // --- Informações do Fornecedor ---
        doc.fontSize(14).text('Dados do Fornecedor', { underline: true });
        doc.fontSize(12).text(`Nome Fantasia: ${compra.fornecedor.nomeFantasia}`);
        doc.text(`CNPJ: ${compra.fornecedor.cnpj}`);
        doc.text(`Endereço: ${compra.fornecedor.endereco.logradouro || ''}, ${compra.fornecedor.endereco.numero || ''} - ${compra.fornecedor.endereco.cidade}, ${compra.fornecedor.endereco.estado}`);
        doc.moveDown();

        // --- Informações do Comprador ---
        doc.fontSize(14).text('Dados do Comprador (Listen)', { underline: true });
        doc.fontSize(12).text(`Comprado por: ${compra.comprador.name}`);
        doc.text(`Email: ${compra.comprador.email}`);
        doc.moveDown(2);

        // --- Detalhes da Compra ---
        doc.fontSize(14).text('Detalhes da Compra', { underline: true });
        const tableTop = doc.y;
        doc.fontSize(12);
        doc.text('Produto', 50, tableTop);
        doc.text('Qtd.', 300, tableTop, { width: 50, align: 'right'});
        doc.text('Preço Unit.', 370, tableTop, { width: 80, align: 'right'});
        doc.text('Subtotal', 470, tableTop, { width: 80, align: 'right'});

        const y = tableTop + 25;
        doc.text(`${compra.produto.nome} - ${compra.produto.artista}`, 50, y);
        doc.text(compra.quantidade.toString(), 300, y, { width: 50, align: 'right'});
        doc.text(`R$ ${compra.precoUnitario.toFixed(2)}`, 370, y, { width: 80, align: 'right'});
        doc.text(`R$ ${compra.precoTotal.toFixed(2)}`, 470, y, { width: 80, align: 'right'});
        
        doc.moveTo(50, doc.y + 10).lineTo(550, doc.y + 10).stroke();
        doc.moveDown(2);

        // --- Total ---
        doc.fontSize(16).text(`Total da Compra: R$ ${compra.precoTotal.toFixed(2)}`, { align: 'right'});
        doc.moveDown();
        
        // --- Data ---
        doc.fontSize(10).text(`Data da Compra: ${new Date(compra.dataCompra).toLocaleDateString('pt-BR')}`, { align: 'right'});


        doc.end();

    } catch (error) {
        console.error("Erro ao gerar PDF:", error);
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