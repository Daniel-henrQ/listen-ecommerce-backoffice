const Venda = require('../models/vendaModel');
const Produto = require('../models/produtoModel');
const Cliente = require('../models/clienteModel');

// Criar uma nova venda
exports.criarVenda = async (req, res) => {
    try {
        const { clienteId, itens, pagamento, enderecoEntrega, valorTotal } = req.body;

        // Validações básicas
        if (!clienteId || !itens || !pagamento || !enderecoEntrega || !valorTotal) {
            return res.status(400).json({ msg: 'Todos os campos são obrigatórios.' });
        }
        if (!Array.isArray(itens) || itens.length === 0) {
            return res.status(400).json({ msg: 'A lista de itens não pode estar vazia.' });
        }

        // Validação de estoque
        for (const item of itens) {
            const produto = await Produto.findById(item.produto);
            if (!produto) {
                return res.status(404).json({ msg: `Produto com ID ${item.produto} não encontrado.` });
            }
            if (produto.quantidade < item.quantidade) {
                return res.status(400).json({ msg: `Estoque insuficiente para o produto "${produto.nome}". Apenas ${produto.quantidade} unidades disponíveis.` });
            }
        }
        
        // Criar a Venda
        const novaVenda = new Venda({
            cliente: clienteId,
            itens,
            pagamento,
            enderecoEntrega,
            valorTotal,
            status: 'Pagamento Aprovado'
        });
        
        // Atualizar o estoque
        for (const item of itens) {
            await Produto.findByIdAndUpdate(item.produto, {
                $inc: { quantidade: -item.quantidade }
            });
        }
        
        await novaVenda.save();
        
        res.status(201).json({ msg: 'Venda registrada com sucesso!', venda: novaVenda });

    } catch (error) {
        res.status(500).json({ msg: "Ocorreu um erro no servidor.", error: error.message });
    }
};

// Listar todas as vendas
exports.listarVendas = async (req, res) => {
    try {
        const vendas = await Venda.find()
            .populate('cliente', 'nome email')
            .populate('itens.produto', 'nome artista')
            .sort({ createdAt: -1 });
        res.json(vendas);
    } catch (error) {
        res.status(500).json({ msg: "Erro ao buscar vendas." });
    }
};

// Obter uma venda por ID
exports.obterVendaPorId = async (req, res) => {
    try {
        const venda = await Venda.findById(req.params.id)
            .populate('cliente')
            .populate('itens.produto');

        if (!venda) {
            return res.status(404).json({ msg: "Venda não encontrada." });
        }
        res.json(venda);
    } catch (error) {
        res.status(500).json({ msg: "Erro no servidor." });
    }
};

// Atualizar status da venda
exports.atualizarStatusVenda = async (req, res) => {
    try {
        const { status } = req.body;
        const vendaAtualizada = await Venda.findByIdAndUpdate(req.params.id, { status }, { new: true });
        if (!vendaAtualizada) return res.status(404).json({ msg: "Venda não encontrada." });
        res.json({ msg: "Status da venda atualizado.", venda: vendaAtualizada });
    } catch (error) {
        res.status(500).json({ msg: "Ocorreu um erro no servidor.", error: error.message });
    }
};

// Adicionar código de rastreio
exports.adicionarCodigoRastreio = async (req, res) => {
    try {
        const { codigoRastreio } = req.body;
        const vendaAtualizada = await Venda.findByIdAndUpdate(
            req.params.id,
            { codigoRastreio: codigoRastreio, status: 'Enviado' },
            { new: true }
        );
        if (!vendaAtualizada) return res.status(404).json({ msg: "Venda não encontrada." });
        res.json({ msg: "Código de rastreio adicionado.", venda: vendaAtualizada });
    } catch (error) {
        res.status(500).json({ msg: "Ocorreu um erro no servidor.", error: error.message });
    }
};