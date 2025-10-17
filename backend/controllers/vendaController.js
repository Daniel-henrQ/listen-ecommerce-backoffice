const Venda = require('../models/vendaModel');
const Produto = require('../models/produtoModel');
const Cliente = require('../models/clienteModel');
const { notificacaoService } = require('./notificacaoService'); // Importar o serviço

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
            status: 'Pagamento Aprovado' // Assume pagamento aprovado ao criar
        });

        // Atualizar o estoque
        for (const item of itens) {
            await Produto.findByIdAndUpdate(item.produto, {
                $inc: { quantidade: -item.quantidade }
            });
        }

        await novaVenda.save();

        // --- NOTIFICAÇÃO ---
        try {
            // Popula nome do cliente para a notificação
            const vendaPopulated = await Venda.findById(novaVenda._id).populate('cliente', 'nome');
            await notificacaoService.notificarNovaVenda(vendaPopulated, vendaPopulated.cliente?.nome);
        } catch (notifError) {
            console.error("Erro ao criar notificação de nova venda:", notifError);
        }
        // --- FIM NOTIFICAÇÃO ---

        res.status(201).json({ msg: 'Venda registrada com sucesso!', venda: novaVenda });

    } catch (error) {
        console.error("Erro ao criar venda:", error); // Log detalhado do erro
        res.status(500).json({ msg: "Ocorreu um erro no servidor ao criar a venda.", error: error.message });
    }
};

// Listar todas as vendas
exports.listarVendas = async (req, res) => {
    try {
        const vendas = await Venda.find()
            .populate('cliente', 'nome email') // Popula nome e email do cliente
            .populate({ // Popula itens e, dentro de itens, popula produto selecionando nome e artista
                path: 'itens.produto',
                select: 'nome artista'
            })
            .sort({ createdAt: -1 }); // Ordena pelas mais recentes
        res.json(vendas);
    } catch (error) {
        console.error("Erro ao buscar vendas:", error);
        res.status(500).json({ msg: "Erro ao buscar vendas." });
    }
};


// Obter uma venda por ID
exports.obterVendaPorId = async (req, res) => {
    try {
        const venda = await Venda.findById(req.params.id)
            .populate('cliente') // Popula o cliente inteiro
            .populate('itens.produto'); // Popula os produtos inteiros dos itens

        if (!venda) {
            return res.status(404).json({ msg: "Venda não encontrada." });
        }
        res.json(venda);
    } catch (error) {
        console.error("Erro ao buscar venda por ID:", error);
        res.status(500).json({ msg: "Erro no servidor ao buscar venda." });
    }
};

// Atualizar status da venda
exports.atualizarStatusVenda = async (req, res) => {
    try {
        const { status } = req.body;
        // Validar se o status enviado é um dos permitidos no Schema
        const allowedStatus = Venda.schema.path('status').enumValues;
        if (!allowedStatus.includes(status)) {
            return res.status(400).json({ msg: `Status inválido. Status permitidos: ${allowedStatus.join(', ')}` });
        }

        const vendaAtualizada = await Venda.findByIdAndUpdate(req.params.id, { status }, { new: true });

        if (!vendaAtualizada) return res.status(404).json({ msg: "Venda não encontrada." });

        // --- NOTIFICAÇÃO ---
        try {
            // Popula nome do cliente
            const vendaPopulated = await Venda.findById(vendaAtualizada._id).populate('cliente', 'nome');
            await notificacaoService.notificarStatusVenda(vendaAtualizada._id, status, vendaPopulated.cliente?.nome);
        } catch (notifError) {
             console.error("Erro ao criar notificação de status de venda:", notifError);
        }
        // --- FIM NOTIFICAÇÃO ---

        res.json({ msg: "Status da venda atualizado.", venda: vendaAtualizada });
    } catch (error) {
        console.error("Erro ao atualizar status da venda:", error);
        res.status(500).json({ msg: "Ocorreu um erro no servidor ao atualizar status da venda.", error: error.message });
    }
};

// Adicionar código de rastreio
exports.adicionarCodigoRastreio = async (req, res) => {
    try {
        const { codigoRastreio } = req.body;
        if (!codigoRastreio) {
            return res.status(400).json({ msg: "Código de rastreio é obrigatório." });
        }

        const vendaAtualizada = await Venda.findByIdAndUpdate(
            req.params.id,
            { codigoRastreio: codigoRastreio, status: 'Enviado' }, // Atualiza status para 'Enviado'
            { new: true }
        );

        if (!vendaAtualizada) return res.status(404).json({ msg: "Venda não encontrada." });

        // --- NOTIFICAÇÃO ---
         try {
             const vendaPopulated = await Venda.findById(vendaAtualizada._id).populate('cliente', 'nome');
             // Notifica sobre o status 'Enviado' também
             await notificacaoService.notificarStatusVenda(vendaAtualizada._id, 'Enviado', vendaPopulated.cliente?.nome);
         } catch (notifError) {
              console.error("Erro ao criar notificação de envio:", notifError);
         }
         // --- FIM NOTIFICAÇÃO ---

        res.json({ msg: "Código de rastreio adicionado e status atualizado para Enviado.", venda: vendaAtualizada });
    } catch (error) {
        console.error("Erro ao adicionar código de rastreio:", error);
        res.status(500).json({ msg: "Ocorreu um erro no servidor ao adicionar código de rastreio.", error: error.message });
    }
};