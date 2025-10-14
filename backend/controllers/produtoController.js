const Produto = require('../models/produtoModel'); // <-- CORRIGIDO
const { notificacaoService } = require('./notificacaoService');
const fs = require('fs');
const path = require('path');

exports.criarProduto = async (req, res, next) => {
  try {
    const { nome, artista, categoria, preco, quantidade, fornecedor } = req.body;
    const produtoData = { nome, artista, categoria, preco, quantidade, fornecedor };
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
    const produtos = await Produto.find(filtro);
    res.json(produtos);
  } catch (error) {
    next(error);
  }
};

exports.atualizarProduto = async (req, res, next) => {
  try {
    const updateData = req.body;
    if (req.file) {
      updateData.imagem = req.file.filename;
    }
    const produtoAtualizado = await Produto.findByIdAndUpdate(req.params.id, updateData, { new: true });
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