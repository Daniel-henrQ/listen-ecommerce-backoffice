const Produto = require('../models/produtoModel');
const Compra = require('../models/compraModel'); // Importar o modelo de Compra
const { notificacaoService } = require('./notificacaoService');
const fs = require('fs');
const path = require('path');

// Função auxiliar para processar subgêneros (string separada por vírgula para array)
const processarSubgeneros = (subgeneros) => {
  if (typeof subgeneros === 'string' && subgeneros.trim() !== '') {
    // Divide por vírgula, remove espaços em branco extras e filtra strings vazias
    return subgeneros.split(',').map(s => s.trim()).filter(Boolean);
  }
  return []; // Retorna array vazio se não for string ou estiver vazia
};

// Criar novo produto
exports.criarProduto = async (req, res, next) => {
  try {
    const { nome, artista, categoria, preco, quantidade, fornecedor } = req.body;

    // Validação básica de campos obrigatórios
    if (!nome || !artista || !categoria || preco == null || quantidade == null || !fornecedor) {
        return res.status(400).json({ error: 'Campos obrigatórios: nome, artista, categoria, preco, quantidade, fornecedor.' });
    }

    const produtoData = {
        nome,
        artista,
        categoria,
        preco: Number(preco), // Garante que é número
        quantidade: Number(quantidade), // Garante que é número
        fornecedor
    };

    // Processa subgêneros se enviados
    produtoData.subgeneros = processarSubgeneros(req.body.subgeneros);

    // Adiciona imagem se foi feito upload
    if (req.file) {
      produtoData.imagem = req.file.filename;
    } else {
         // Considerar se imagem é obrigatória no frontend
         console.warn("Produto criado sem imagem.");
    }

    const produto = new Produto(produtoData);
    await produto.save();
    res.status(201).json(produto);
  } catch (error) {
     // Trata erros de validação do Mongoose
    if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(val => val.message);
        return res.status(400).json({ error: messages.join(', ') });
    }
    next(error); // Passa outros erros para o middleware de erro geral
  }
};

// Listar produtos (com filtro por nome e categoria)
exports.listarProdutos = async (req, res, next) => {
  try {
    const filtro = {};
    const { nome, categoria } = req.query;

    if (nome) {
      // Busca por nome (case-insensitive)
      filtro.nome = { $regex: nome, $options: 'i' };
    }
    if (categoria && categoria !== 'all') { // Ignora 'all' se enviado
      filtro.categoria = categoria;
    }

    // Popula o campo 'fornecedor' buscando apenas o 'nomeFantasia'
    const produtos = await Produto.find(filtro).populate('fornecedor', 'nomeFantasia');
    res.json(produtos);
  } catch (error) {
    next(error);
  }
};

// Atualizar produto por ID
exports.atualizarProduto = async (req, res, next) => {
  try {
    const updateData = { ...req.body }; // Copia os dados do corpo da requisição

    // Processa subgêneros se foram enviados no update
    if (req.body.subgeneros !== undefined) { // Permite limpar subgeneros enviando string vazia
      updateData.subgeneros = processarSubgeneros(req.body.subgeneros);
    } else {
        // Se não foi enviado, não altera (remove do objeto de update)
        delete updateData.subgeneros;
    }

    // Se uma nova imagem foi enviada, atualiza o nome e remove a antiga (se existir)
    if (req.file) {
       const produtoExistente = await Produto.findById(req.params.id);
       if (produtoExistente && produtoExistente.imagem) {
           const oldImagePath = path.join(__dirname, '..', '..', 'public', 'uploads', produtoExistente.imagem);
            if (fs.existsSync(oldImagePath)) {
              // Usa unlink (async) mas não espera necessariamente, só loga erro
              fs.promises.unlink(oldImagePath).catch(err => console.error("Erro ao apagar imagem antiga:", err));
            }
       }
      updateData.imagem = req.file.filename;
    }

     // Assegura que preço e quantidade são números, se enviados
     if (updateData.preco !== undefined) updateData.preco = Number(updateData.preco);
     if (updateData.quantidade !== undefined) updateData.quantidade = Number(updateData.quantidade);

    // Atualiza o produto, retorna o novo documento e executa validadores
    const produtoAtualizado = await Produto.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true }).populate('fornecedor', 'nomeFantasia');

    if (!produtoAtualizado) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    // --- NOTIFICAÇÃO de Estoque ---
    const qtd = produtoAtualizado.quantidade;
    if (qtd === 0) {
      await notificacaoService.notificarEstoqueZerado(produtoAtualizado);
    } else if (qtd > 0 && qtd <= 10) { // Notifica se estiver entre 1 e 10
      await notificacaoService.notificarEstoqueBaixo(produtoAtualizado);
    }
    // --- FIM NOTIFICAÇÃO ---

    res.json(produtoAtualizado);
  } catch (error) {
     // Trata erros de validação do Mongoose
     if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(val => val.message);
        return res.status(400).json({ error: messages.join(', ') });
     }
    next(error);
  }
};

// Aprovar compra e atualizar estoque
exports.aprovarCompraEAtualizarEstoque = async (req, res, next) => {
    try {
        const { compraId } = req.body;
        if (!compraId) {
            return res.status(400).json({ msg: "O ID da compra é obrigatório." });
        }

        // Busca a compra e popula o produto e fornecedor necessários
        const compra = await Compra.findById(compraId)
            .populate('produto', 'nome') // Apenas o nome do produto
            .populate('fornecedor', 'nomeFantasia'); // Apenas o nome fantasia do fornecedor

        if (!compra) {
            return res.status(404).json({ msg: "Compra não encontrada." });
        }

        // Verifica o status da compra
        if (compra.status !== 'Entregue') {
             return res.status(400).json({ msg: `Apenas compras com status 'Entregue' podem ser finalizadas. Status atual: ${compra.status}.` });
        }

        // Atualiza a quantidade do produto
        // $inc incrementa atomicamente a quantidade
        const produtoAtualizado = await Produto.findByIdAndUpdate(
            compra.produto._id,
            { $inc: { quantidade: compra.quantidade } },
            { new: true } // Retorna o documento atualizado
        );

        if (!produtoAtualizado) {
             // Isso não deveria acontecer se a compra existe, mas é uma verificação de segurança
             return res.status(404).json({ msg: "Produto associado à compra não encontrado durante atualização de estoque." });
        }

        // Atualiza o status da compra para 'Finalizada'
        compra.status = 'Finalizada';
        await compra.save();

        // --- NOTIFICAÇÃO ---
        try {
            // Notifica que o status da compra mudou para 'Finalizada'
            await notificacaoService.notificarStatusCompra(compra._id, 'Finalizada', compra.fornecedor?.nomeFantasia);
        } catch (notifError) {
             console.error("Erro ao criar notificação de compra finalizada:", notifError);
        }
         // --- FIM NOTIFICAÇÃO ---

        res.json({ msg: `Estoque do produto "${produtoAtualizado.nome}" atualizado com sucesso! Status da compra #${compra.numeroNotaFiscal || compra._id} alterado para Finalizada.`, produto: produtoAtualizado });

    } catch (error) {
        console.error("Erro ao aprovar compra e atualizar estoque:", error);
        next(error);
    }
};


// Deletar produto por ID
exports.deletarProduto = async (req, res, next) => {
  try {
    const produto = await Produto.findByIdAndDelete(req.params.id);
    if (!produto) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    // Remove a imagem associada, se existir
    if (produto.imagem) {
      const imagePath = path.join(__dirname, '..', '..', 'public', 'uploads', produto.imagem);
      if (fs.existsSync(imagePath)) {
        // Tenta apagar, loga erro se falhar, mas não impede a resposta de sucesso
        fs.promises.unlink(imagePath).catch(err => console.error("Erro ao apagar imagem do produto deletado:", err));
      }
    }
    res.json({ message: 'Produto deletado com sucesso' });
  } catch (error) {
    next(error);
  }
};

// Deletar vários produtos por IDs
exports.deletarVariosProdutos = async (req, res, next) => {
    try {
        const { ids } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ error: 'A requisição deve conter um array de IDs.' });
        }

        // Encontra os produtos para poder pegar os nomes das imagens
        const produtosParaDeletar = await Produto.find({ _id: { $in: ids } });

        // Deleta os produtos do banco de dados
        const result = await Produto.deleteMany({ _id: { $in: ids } });

        if (result.deletedCount === 0) {
             return res.status(404).json({ error: 'Nenhum dos produtos especificados foi encontrado.' });
        }

        // Tenta apagar as imagens associadas
        for (const produto of produtosParaDeletar) {
            if (produto.imagem) {
                const imagePath = path.join(__dirname, '..', '..', 'public', 'uploads', produto.imagem);
                if (fs.existsSync(imagePath)) {
                   fs.promises.unlink(imagePath).catch(err => console.error(`Erro ao apagar imagem ${produto.imagem}:`, err));
                }
            }
        }
        res.json({ message: `${result.deletedCount} produto(s) deletado(s) com sucesso.` });
    } catch (error) {
        next(error);
    }
};