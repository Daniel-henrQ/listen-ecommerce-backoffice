// backend/controllers/produtoController.js

// CORREÇÃO: Garante que estamos a importar o ficheiro com o nome correto.
const Produto = require('../models/produtoModel'); 
const { notificacaoService } = require('./notificacaoService');
const fs = require('fs');
const path = require('path');

// Criar novo produto
exports.criarProduto = async (req, res, next) => {
  try {
    const { nome, artista, categoria, preco, quantidade } = req.body;
    const produtoData = { nome, artista, categoria, preco, quantidade };

    if (req.file) {
      produtoData.imagem = req.file.filename;
    }

    const produto = new Produto(produtoData);
    const salvo = await produto.save();
    res.status(201).json(salvo);
  } catch (error) {
    next(error);
  }
};

// Criar vários produtos de uma vez
exports.criarVariosProdutos = async (req, res, next) => {
  try {
    const produtos = req.body;
    if (!Array.isArray(produtos) || produtos.length === 0) {
      return res.status(400).json({ error: 'A requisição deve conter um array de produtos.' });
    }
    const salvos = await Produto.insertMany(produtos);
    res.status(201).json(salvos);
  } catch (error) {
    next(error);
  }
};


// Listar produtos (com filtro)
exports.listarProdutos = async (req, res, next) => {
  try {
    const filtro = {};
    const queryParams = req.query;
    for (const key in queryParams) {
      if (queryParams[key]) {
        if (key === 'nome') {
          filtro[key] = { $regex: queryParams[key], $options: 'i' };
        } else {
          filtro[key] = queryParams[key];
        }
      }
    }
    const produtos = await Produto.find(filtro);
    res.json(produtos);
  } catch (error) {
    next(error);
  }
};

// Buscar produto por id
exports.buscarProdutoPorId = async (req, res, next) => {
  try {
    const produto = await Produto.findById(req.params.id);
    if (!produto) return res.status(404).json({ error: 'Produto não encontrado' });
    res.json(produto);
  } catch (error) {
    next(error);
  }
};

// Atualizar produto por id 
exports.atualizarProduto = async (req, res, next) => {
  try {
    const updateData = req.body;
    const produtoId = req.params.id;

    if (req.file) {
      const produtoExistente = await Produto.findById(produtoId);
      if (produtoExistente && produtoExistente.imagem) {
        const oldImagePath = path.join(__dirname, '..', '..', 'public', 'uploads', produtoExistente.imagem);
        if (fs.existsSync(oldImagePath)) {
          fs.promises.unlink(oldImagePath).catch(err => console.error("Erro ao apagar imagem antiga:", err));
        }
      }
      updateData.imagem = req.file.filename;
    }

    const produtoAtualizado = await Produto.findByIdAndUpdate(produtoId, updateData, { new: true, runValidators: true });
    
    if (!produtoAtualizado) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    // Lógica de notificação de estoque
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

// Deletar produto por id
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

// Deletar vários produtos
exports.deletarVariosProdutos = async (req, res, next) => {
    try {
        const { ids } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ error: 'A requisição deve conter um array de IDs.' });
        }

        const produtosParaDeletar = await Produto.find({ _id: { $in: ids } });
        await Produto.deleteMany({ _id: { $in: ids } });

        for (const produto of produtosParaDeletar) {
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