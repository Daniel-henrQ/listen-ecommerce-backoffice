const Produto = require('../models/produtoModel');
const Compra = require('../models/compraModel'); // Importar o modelo de Compra
const { notificacaoService } = require('./notificacaoService');
const fs = require('fs');
const path = require('path');

// Função auxiliar para processar subgêneros
const processarSubgeneros = (subgeneros) => {
  if (typeof subgeneros === 'string' && subgeneros.trim() !== '') {
    return subgeneros.split(',').map(s => s.trim()).filter(Boolean);
  }
  return [];
};

exports.criarProduto = async (req, res, next) => {
  try {
    const { nome, artista, categoria, preco, quantidade, fornecedor } = req.body;
    const produtoData = { nome, artista, categoria, preco, quantidade, fornecedor };
    
    produtoData.subgeneros = processarSubgeneros(req.body.subgeneros);

    if (req.file) {
      produtoData.imagem = req.file.filename;
    }
    const produto = new Produto(produtoData);
    await produto.save();
    res.status(201).json(produto);
  } catch (error) {
    next(error);
  }
};

exports.listarProdutos = async (req, res, next) => {
  try {
    const filtro = {};
    const { nome, categoria } = req.query;
    if (nome) {
      filtro.nome = { $regex: nome, $options: 'i' };
    }
    if (categoria) {
      filtro.categoria = categoria;
    }
    // Popula os dados do fornecedor ao listar
    const produtos = await Produto.find(filtro).populate('fornecedor', 'nomeFantasia');
    res.json(produtos);
  } catch (error) {
    next(error);
  }
};

exports.atualizarProduto = async (req, res, next) => {
  try {
    const updateData = req.body;
    
    if (req.body.subgeneros) {
      updateData.subgeneros = processarSubgeneros(req.body.subgeneros);
    }

    if (req.file) {
      updateData.imagem = req.file.filename;
    }
    const produtoAtualizado = await Produto.findByIdAndUpdate(req.params.id, updateData, { new: true }).populate('fornecedor', 'nomeFantasia');
    if (!produtoAtualizado) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    const qtd = produtoAtualizado.quantidade;
    if (qtd === 0) {
      await notificacaoService.notificarEstoqueZerado(produtoAtualizado);
    } else if (qtd > 0 && qtd <= 10) {
      await notificacaoService.notificarEstoqueBaixo(produtoAtualizado);
    }
    res.json(produtoAtualizado);
  } catch (error) {
    next(error);
  }
};

// Nova função para aprovar a compra e atualizar o estoque
exports.aprovarCompraEAtualizarEstoque = async (req, res, next) => {
    try {
        const { compraId } = req.body;
        if (!compraId) {
            return res.status(400).json({ msg: "O ID da compra é obrigatório." });
        }

        const compra = await Compra.findById(compraId).populate('produto');
        if (!compra) {
            return res.status(404).json({ msg: "Compra não encontrada." });
        }

        if (compra.status !== 'Entregue') {
             return res.status(400).json({ msg: "Apenas compras com status 'Entregue' podem ser finalizadas para atualização de estoque." });
        }

        const produto = await Produto.findById(compra.produto._id);
        if (!produto) {
             // Isso não deve acontecer se a compra foi criada corretamente
             return res.status(404).json({ msg: "Produto associado à compra não encontrado." });
        }

        // Adiciona a quantidade da compra ao estoque existente
        produto.quantidade += compra.quantidade;
        await produto.save();
        
        // Atualiza o status da compra para 'Finalizada'
        compra.status = 'Finalizada';
        await compra.save();

        res.json({ msg: `Estoque do produto "${produto.nome}" atualizado com sucesso!`, produto });

    } catch (error) {
        next(error);
    }
};


// As funções deletarProduto e deletarVariosProdutos permanecem as mesmas
exports.deletarProduto = async (req, res, next) => {
  try {
    const produto = await Produto.findByIdAndDelete(req.params.id);
    if (!produto) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    if (produto.imagem) {
      const imagePath = path.join(__dirname, '..', '..', 'public', 'uploads', produto.imagem);
      if (fs.existsSync(imagePath)) {
        await fs.promises.unlink(imagePath).catch(err => console.error("Erro ao apagar imagem:", err));
      }
    }
    res.json({ message: 'Produto deletado com sucesso' });
  } catch (error) {
    next(error);
  }
};

exports.deletarVariosProdutos = async (req, res, next) => {
    try {
        const { ids } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ error: 'A requisição deve conter um array de IDs.' });
        }
        const produtos = await Produto.find({ _id: { $in: ids } });
        await Produto.deleteMany({ _id: { $in: ids } });
        for (const produto of produtos) {
            if (produto.imagem) {
                const imagePath = path.join(__dirname, '..', '..', 'public', 'uploads', produto.imagem);
                if (fs.existsSync(imagePath)) {
                   await fs.promises.unlink(imagePath).catch(err => console.error("Erro ao apagar imagem:", err));
                }
            }
        }
        res.json({ message: 'Produtos deletados com sucesso.' });
    } catch (error) {
        next(error);
    }
};