const Produto = require('../models/produto');
const notificacaoService = require('./notificacaoService');
const fs = require('fs'); // Módulo para interagir com o sistema de arquivos
const path = require('path'); // Módulo para lidar com caminhos de arquivos

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

        //Verifica se o arquivo existe ANTES de tentar apagar.
        if (fs.existsSync(oldImagePath)) {
          try {
            await fs.promises.unlink(oldImagePath);
            console.log(`Imagem antiga (${produtoExistente.imagem}) apagada com sucesso.`);
          } catch (unlinkError) {
            // Caso ocorra um erro de permissão ou outro problema durante a exclusão.
            console.error(`Erro ao apagar o arquivo existente ${oldImagePath}:`, unlinkError);
          }
        }
      }
      // Adiciona o nome da nova imagem aos dados de atualização.
      updateData.imagem = req.file.filename;
    }

    const produtoAtualizado = await Produto.findByIdAndUpdate(produtoId, updateData, { new: true, runValidators: true });
    
    if (!produtoAtualizado) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    // Lógica de notificação de estoque baixo
    if (req.body.quantidade !== undefined && produtoAtualizado.quantidade === 0) {
      await notificacaoService.criarNotificacaoEstoqueBaixo(produtoAtualizado);
    }

    res.json(produtoAtualizado);
  } catch (error) {
    next(error);
  }
};

// Deletar produto por id (com exclusão de imagem)
exports.deletarProduto = async (req, res, next) => {
    try {
        const produto = await Produto.findByIdAndDelete(req.params.id);
        if (!produto) {
            return res.status(404).json({ error: 'Produto não encontrado' });
        }

        // Se o produto tinha uma imagem, apague-a do disco.
        if (produto.imagem) {
            const imagePath = path.join(__dirname, '..', '..', 'public', 'uploads', produto.imagem);
            if (fs.existsSync(imagePath)) {
                try {
                    await fs.promises.unlink(imagePath);
                    console.log(`Imagem (${produto.imagem}) do produto deletado foi apagada.`);
                } catch (unlinkError) {
                    console.error(`Erro ao apagar a imagem do produto deletado ${imagePath}:`, unlinkError);
                }
            }
        }
        res.json({ message: 'Produto deletado com sucesso' });
    } catch (error) {
        next(error);
    }
};

// Deletar vários produtos (com exclusão de imagens)
exports.deletarVariosProdutos = async (req, res, next) => {
    try {
        const { ids } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ error: 'A requisição deve conter um array de IDs.' });
        }

        // Encontra os produtos para pegar os nomes das imagens antes de deletá-los.
        const produtosParaDeletar = await Produto.find({ _id: { $in: ids } });

        // Deleta os registros do banco de dados.
        const resultado = await Produto.deleteMany({ _id: { $in: ids } });

        // Itera sobre os produtos que foram deletados para apagar suas imagens.
        for (const produto of produtosParaDeletar) {
            if (produto.imagem) {
                const imagePath = path.join(__dirname, '..', '..', 'public', 'uploads', produto.imagem);
                if (fs.existsSync(imagePath)) {
                    try {
                        await fs.promises.unlink(imagePath);
                        console.log(`Imagem (${produto.imagem}) de produto deletado em massa foi apagada.`);
                    } catch (unlinkError) {
                        console.error(`Erro ao apagar a imagem ${imagePath}:`, unlinkError);
                    }
                }
            }
        }
        res.json({ message: `${resultado.deletedCount} produtos deletados com sucesso.` });
    } catch (error) {
        next(error);
    }
};
