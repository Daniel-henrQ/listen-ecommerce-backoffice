const Cliente = require('../models/clienteModel');
const Produto = require('../models/produtoModel');
const bcrypt = require('bcrypt'); // Importar bcrypt

exports.criarCliente = async (req, res) => {
    // Adicione nome aos campos esperados se 'username' for usado como 'nome'
    const { email, cpf, nome, password, confirmpassword /* outros campos... */ } = req.body;

    // ... (suas validações existentes para email, cpf, nome, etc.) ...

    // Validação de senha (exemplo mínimo)
    if (!password) {
        return res.status(422).json({ msg: "A senha é obrigatória." });
    }
     if (password !== confirmpassword) { // Adicionado if confirmpassword existe
        return res.status(422).json({ msg: "As senhas não conferem." });
     }


    try {
        if (await Cliente.findOne({ email })) {
            return res.status(422).json({ msg: "Este e-mail já está em uso." });
        }
        if (cpf && await Cliente.findOne({ cpf })) {
            return res.status(422).json({ msg: "Este CPF já está cadastrado." });
        }

        // --- HASHING DA SENHA ---
        const salt = await bcrypt.genSalt(12);
        const passwordHash = await bcrypt.hash(password, salt);
        // -------------------------

        // Cria o cliente usando os dados e a senha hasheada
        const novoCliente = new Cliente({
            email,
            nome, // Certifique-se de que o campo 'nome' está sendo enviado
            cpf,
            password: passwordHash, // Salva a senha hasheada
            // ... (restante dos campos como telefone, endereco, etc., se enviados)
        });

        await novoCliente.save();
        // Não retorne a senha, mesmo hasheada
         const clienteParaRetorno = novoCliente.toObject();
         delete clienteParaRetorno.password;

        res.status(201).json({ msg: "Cliente criado com sucesso!", cliente: clienteParaRetorno });
    } catch (error) {
        console.error("Erro ao criar cliente:", error); // Log do erro
        res.status(500).json({ msg: "Ocorreu um erro no servidor.", error: error.message });
    }
};

// Listar todos os clientes com filtro de busca
exports.listarClientes = async (req, res) => {
    try {
        const { search } = req.query;
        const filtro = {};
        if (search) {
            filtro.$or = [
                { nome: { $regex: search, $options: 'i' } },
                { sobrenome: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { cpf: { $regex: search, $options: 'i' } }
            ];
        }
        const clientes = await Cliente.find(filtro).select('-password'); // Não enviar senha
        res.json(clientes);
    } catch (error) {
        res.status(500).json({ msg: "Erro ao buscar clientes." });
    }
};

// Obter um cliente por ID
exports.obterClientePorId = async (req, res) => {
    try {
        const cliente = await Cliente.findById(req.params.id).select('-password'); // Não enviar senha
        if (!cliente) {
            return res.status(404).json({ msg: "Cliente não encontrado." });
        }
        res.json(cliente);
    } catch (error) {
        res.status(500).json({ msg: "Erro no servidor." });
    }
};


// Atualizar um cliente
exports.atualizarCliente = async (req, res) => {
    try {
        // Remove o campo de senha do body para não ser atualizado indevidamente
        delete req.body.password;
       
        const clienteAtualizado = await Cliente.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        ).select('-password'); // Não enviar senha

        if (!clienteAtualizado) {
            return res.status(404).json({ msg: "Cliente não encontrado." });
        }
        res.json({ msg: "Cliente atualizado com sucesso!", cliente: clienteAtualizado });
    } catch (error) {
        res.status(500).json({ msg: "Ocorreu um erro no servidor.", error: error.message });
    }
};

// Deletar um cliente
exports.deletarCliente = async (req, res) => {
    try {
        const clienteDeletado = await Cliente.findByIdAndDelete(req.params.id);
        if (!clienteDeletado) {
            return res.status(404).json({ msg: "Cliente não encontrado." });
        }
        res.json({ msg: "Cliente deletado com sucesso." });
    } catch (error) {
        res.status(500).json({ msg: "Ocorreu um erro no servidor." });
    }
};


// --- NOVAS FUNÇÕES DE FAVORITOS ---

// Obter todos os favoritos de um cliente
exports.getFavoritos = async (req, res) => {
    try {
        // Usa req.id do cliente logado (vindo do checkToken)
        // Se seu checkToken salva como req.user.id, mude req.id para req.user.id
        const cliente = await Cliente.findById(req.id).populate('favoritos');
       
        if (!cliente) {
            return res.status(404).json({ msg: 'Cliente não encontrado' });
        }
       
        res.status(200).json(cliente.favoritos);
    } catch (error) {
        res.status(500).json({ msg: 'Erro ao buscar favoritos', error: error.message });
    }
};

// Adicionar um produto aos favoritos
exports.addFavorito = async (req, res) => {
    // **MELHORIA 1: Alterado de req.body para req.params para consistência**
    const { produtoId } = req.params; 
   
    try {
        const cliente = await Cliente.findById(req.id); // Use req.id ou req.user.id
        if (!cliente) {
            return res.status(404).json({ msg: 'Cliente não encontrado' });
        }

        // Usa $addToSet para evitar duplicatas
        const clienteAtualizado = await Cliente.findByIdAndUpdate(req.id, { // Use req.id ou req.user.id
            $addToSet: { favoritos: produtoId }
        }, { new: true }).populate('favoritos'); // **MELHORIA 2: Retorna dados atualizados**
       
        // Retorna a lista atualizada
        res.status(200).json(clienteAtualizado.favoritos);
    } catch (error) {
        res.status(500).json({ msg: 'Erro ao adicionar favorito', error: error.message });
    }
};

// Remover um produto dos favoritos
exports.removeFavorito = async (req, res) => {
    const { produtoId } = req.params;
   
    try {
        const cliente = await Cliente.findById(req.id); // Use req.id ou req.user.id
        if (!cliente) {
            return res.status(404).json({ msg: 'Cliente não encontrado' });
        }

        // Usa $pull para remover o item do array
        const clienteAtualizado = await Cliente.findByIdAndUpdate(req.id, { // Use req.id ou req.user.id
            $pull: { favoritos: produtoId }
        }, { new: true }).populate('favoritos'); // **MELHORIA 2: Retorna dados atualizados**
       
        // Retorna a lista atualizada
        res.status(200).json(clienteAtualizado.favoritos);
    } catch (error) {
        res.status(500).json({ msg: 'Erro ao remover favorito', error: error.message });
    }
};

// Limpar todos os favoritos
exports.clearFavoritos = async (req, res) => {
    try {
        await Cliente.findByIdAndUpdate(req.id, { // Use req.id ou req.user.id
            $set: { favoritos: [] }
        });
       
        // **MELHORIA 2: Retorna lista vazia**
        res.status(200).json([]);
    } catch (error) {
        res.status(500).json({ msg: 'Erro ao limpar favoritos', error: error.message });
    }
};