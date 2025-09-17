const Notificacao = require('../models/notificacaoModel');

// Listar todas as notificações, das mais recentes para as mais antigas
exports.listarNotificacoes = async (req, res) => {
    try {
        const notificacoes = await Notificacao.find().sort({ createdAt: -1 });
        const naoLidas = await Notificacao.countDocuments({ lida: false });
        res.json({ notificacoes, naoLidas });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Marcar notificações como lidas
exports.marcarComoLidas = async (req, res) => {
    try {
        await Notificacao.updateMany({ lida: false }, { $set: { lida: true } });
        res.json({ message: 'Notificações marcadas como lidas.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};