const Compra = require('../models/compraModel');
const Produto = require('../models/produtoModel'); // Importar o modelo de Produto
const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');
const { notificacaoService } = require('./notificacaoService'); // Importar o serviço

// Criar nova compra
exports.criarCompra = async (req, res) => {
    try {
        const {
            produto, fornecedor, quantidade, precoUnitario,
            isNewProduct, novoProdutoNome, novoProdutoArtista, novoProdutoCategoria
        } = req.body;

        // Validação de entrada
        if (!fornecedor || !quantidade || !precoUnitario) {
            return res.status(400).json({ msg: "Fornecedor, quantidade e preço unitário são obrigatórios." });
        }
         if (isNewProduct !== 'true' && !produto) {
             return res.status(400).json({ msg: "Selecione um produto existente ou marque a opção 'novo produto'." });
         }
        if (isNewProduct === 'true' && (!novoProdutoNome || !novoProdutoArtista || !novoProdutoCategoria)) {
            return res.status(400).json({ msg: "Nome, artista e categoria são obrigatórios para um novo produto." });
        }
        if (isNaN(quantidade) || quantidade <= 0 || isNaN(precoUnitario) || precoUnitario < 0) {
             return res.status(400).json({ msg: "Quantidade deve ser maior que 0 e preço unitário não pode ser negativo." });
        }


        const comprador = req.user.id; // Assume que checkToken adicionou req.user
        if (!comprador) {
             return res.status(401).json({ msg: "Usuário não autenticado." }); // Segurança extra
        }
        const precoTotal = quantidade * precoUnitario;
        let produtoId;

        if (isNewProduct === 'true') {
            // Se for um novo produto, cria primeiro o produto
            const novoProduto = new Produto({
                nome: novoProdutoNome,
                artista: novoProdutoArtista,
                categoria: novoProdutoCategoria,
                fornecedor: fornecedor, // Associa o fornecedor selecionado
                preco: 0, // Preço de VENDA pode ser definido depois
                quantidade: 0, // O estoque será atualizado ao finalizar a compra
                // imagem: '', // Imagem pode ser adicionada depois na edição do produto
                // subgeneros: []
            });
            const produtoSalvo = await novoProduto.save();
            produtoId = produtoSalvo._id;
        } else {
            // Usa o ID do produto existente
            produtoId = produto;
            // Opcional: Validar se o produtoId realmente existe
             const produtoExistente = await Produto.findById(produtoId);
             if (!produtoExistente) {
                 return res.status(404).json({ msg: `Produto com ID ${produtoId} não encontrado.` });
             }
        }

        const novaCompra = new Compra({
            produto: produtoId,
            fornecedor,
            comprador,
            quantidade,
            precoUnitario,
            precoTotal
            // Status default é 'Processando'
        });

        await novaCompra.save();

        // --- NOTIFICAÇÃO ---
        try {
            const compraPopulated = await Compra.findById(novaCompra._id).populate('fornecedor', 'nomeFantasia');
            await notificacaoService.notificarNovaCompra(compraPopulated, compraPopulated.fornecedor?.nomeFantasia);
        } catch (notifError) {
            console.error("Erro ao criar notificação de nova compra:", notifError);
        }
        // --- FIM NOTIFICAÇÃO ---

        res.status(201).json(novaCompra);
    } catch (error) {
        console.error("Erro ao criar compra:", error);
        res.status(500).json({ msg: "Ocorreu um erro no servidor ao criar a compra.", error: error.message });
    }
};

// Listar todas as compras
exports.listarCompras = async (req, res) => {
    try {
        const compras = await Compra.find()
            .populate('produto', 'nome artista') // Popula nome e artista do produto
            .populate('fornecedor', 'nomeFantasia cnpj') // Popula nome e CNPJ do fornecedor
            .populate('comprador', 'name email') // Popula nome e email do comprador
            .sort({ dataCompra: -1 }); // Ordena pelas mais recentes
        res.json(compras);
    } catch (error) {
        console.error("Erro ao buscar compras:", error);
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
         // Verificar se temos todas as informações necessárias
        if (!compra.produto || !compra.fornecedor || !compra.comprador) {
             return res.status(500).send('Erro: Dados incompletos para gerar a nota fiscal (produto, fornecedor ou comprador não encontrado).');
        }


        const doc = new PDFDocument({ margin: 50 });

        res.setHeader('Content-Type', 'application/pdf');
        // Usar numeroNotaFiscal no nome do arquivo
        res.setHeader('Content-Disposition', `inline; filename=nota-fiscal-${compra.numeroNotaFiscal || compra._id}.pdf`);

        doc.pipe(res);

        // --- Cabeçalho com Logo ---
        const logoPath = path.join(__dirname, '..', '..', 'public', 'images', 'listen.png');
        if (fs.existsSync(logoPath)) {
            doc.image(logoPath, {
                fit: [100, 100], // Ajuste o tamanho conforme necessário
                align: 'center',
                valign: 'top'
            });
             doc.moveDown(1); // Espaço após a logo
        } else {
            console.warn(`Logo não encontrada em: ${logoPath}`); // Aviso no console do servidor
            doc.fontSize(20).text('Listen E-commerce', { align: 'center' }); // Texto alternativo
             doc.moveDown(1);
        }

        // --- Título ---
        doc.fontSize(18).text(`Nota Fiscal de Compra: ${compra.numeroNotaFiscal || 'N/A'}`, { align: 'center' });
        doc.moveDown(2);

        // --- Informações do Fornecedor ---
        doc.fontSize(14).text('Dados do Fornecedor', { underline: true });
        doc.fontSize(12).text(`Nome Fantasia: ${compra.fornecedor.nomeFantasia || 'Não informado'}`);
        doc.text(`CNPJ: ${compra.fornecedor.cnpj || 'Não informado'}`);
         // Verifica se o endereço existe antes de tentar acessar suas propriedades
         const enderecoFornecedor = compra.fornecedor.endereco;
         if (enderecoFornecedor) {
            doc.text(`Endereço: ${enderecoFornecedor.logradouro || ''}, ${enderecoFornecedor.numero || ''} - ${enderecoFornecedor.cidade || ''}/${enderecoFornecedor.estado || ''}`);
         } else {
             doc.text('Endereço: Não informado');
         }
        doc.moveDown();

        // --- Informações do Comprador (Empresa) ---
        doc.fontSize(14).text('Dados do Comprador (Listen)', { underline: true });
        doc.fontSize(12).text(`Comprado por: ${compra.comprador.name || 'Usuário desconhecido'}`);
        doc.text(`Email: ${compra.comprador.email || 'Não informado'}`);
        // Adicionar CNPJ/Endereço da Listen se necessário/disponível (buscar de .env ou config)
        // doc.text(`CNPJ Listen: SEU_CNPJ_AQUI`);
        doc.moveDown(2);

        // --- Detalhes da Compra ---
        doc.fontSize(14).text('Detalhes da Compra', { underline: true });
        const tableTop = doc.y + 15; // Adiciona um pequeno espaço antes da tabela
        doc.fontSize(10); // Fonte menor para a tabela

        // Cabeçalhos da tabela
        const headerY = tableTop;
        const startX = 50;
        const colWidthProduto = 240;
        const colWidthQtd = 50;
        const colWidthUnit = 80;
        const colWidthSubtotal = 80;
        const endX = startX + colWidthProduto + colWidthQtd + colWidthUnit + colWidthSubtotal + 30; // Ajustar conforme necessário

        doc.font('Helvetica-Bold'); // Negrito para cabeçalhos
        doc.text('Produto', startX, headerY, { width: colWidthProduto });
        doc.text('Qtd.', startX + colWidthProduto + 10, headerY, { width: colWidthQtd, align: 'right'});
        doc.text('Preço Unit.', startX + colWidthProduto + colWidthQtd + 20, headerY, { width: colWidthUnit, align: 'right'});
        doc.text('Subtotal', startX + colWidthProduto + colWidthQtd + colWidthUnit + 30, headerY, { width: colWidthSubtotal, align: 'right'});
        doc.font('Helvetica'); // Volta para a fonte normal

        // Linha abaixo dos cabeçalhos
        doc.moveTo(startX, headerY + 15).lineTo(endX, headerY + 15).strokeOpacity(0.5).strokeColor('#aaaaaa').stroke();

        // Linha do produto
        const itemY = headerY + 25;
        doc.fontSize(10).text(`${compra.produto.nome} - ${compra.produto.artista || ''}`, startX, itemY, { width: colWidthProduto, ellipsis: true });
        doc.text(compra.quantidade.toString(), startX + colWidthProduto + 10, itemY, { width: colWidthQtd, align: 'right'});
        doc.text(`R$ ${compra.precoUnitario.toFixed(2)}`, startX + colWidthProduto + colWidthQtd + 20, itemY, { width: colWidthUnit, align: 'right'});
        doc.text(`R$ ${compra.precoTotal.toFixed(2)}`, startX + colWidthProduto + colWidthQtd + colWidthUnit + 30, itemY, { width: colWidthSubtotal, align: 'right'});

        // Linha abaixo do item
        const endTableY = itemY + 20;
        doc.moveTo(startX, endTableY).lineTo(endX, endTableY).strokeOpacity(0.5).strokeColor('#aaaaaa').stroke();
        doc.moveDown(2);


        // --- Total ---
        doc.fontSize(14).font('Helvetica-Bold').text(`Total da Compra: R$ ${compra.precoTotal.toFixed(2)}`, { align: 'right'});
        doc.font('Helvetica'); // Volta para a fonte normal
        doc.moveDown();

        // --- Data ---
        doc.fontSize(10).text(`Data da Compra: ${new Date(compra.dataCompra).toLocaleDateString('pt-BR')}`, { align: 'right'});

         // --- NOTIFICAÇÃO ---
         try {
             await notificacaoService.notificarNotaGerada(compra._id, 'compra');
         } catch (notifError) {
             console.error("Erro ao criar notificação de nota fiscal:", notifError);
         }
         // --- FIM NOTIFICAÇÃO ---

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
        // Validar se o status enviado é um dos permitidos no Schema
        const allowedStatus = Compra.schema.path('status').enumValues;
         if (!status || !allowedStatus.includes(status)) {
             return res.status(400).json({ msg: `Status inválido ou não fornecido. Status permitidos: ${allowedStatus.join(', ')}` });
         }

        const compra = await Compra.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true, runValidators: true } // runValidators é bom aqui também
        );

        if (!compra) {
            return res.status(404).json({ msg: "Compra não encontrada." });
        }

         // --- NOTIFICAÇÃO ---
         try {
             const compraPopulated = await Compra.findById(compra._id).populate('fornecedor', 'nomeFantasia');
             await notificacaoService.notificarStatusCompra(compra._id, status, compraPopulated.fornecedor?.nomeFantasia);
         } catch (notifError) {
              console.error("Erro ao criar notificação de status de compra:", notifError);
         }
         // --- FIM NOTIFICAÇÃO ---

        res.json(compra);
    } catch (error) {
        console.error("Erro ao atualizar status da compra:", error);
        res.status(500).json({ msg: "Ocorreu um erro no servidor ao atualizar o status da compra.", error: error.message });
    }
};