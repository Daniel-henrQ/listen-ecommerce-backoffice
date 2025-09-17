const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs'); // ADICIONADO: Módulo File System

// Define o caminho para a pasta de uploads
const uploadDir = path.resolve(__dirname, '..', '..', 'public', 'uploads');

//Garante que o diretório de uploads exista
// Se o diretório não existe, ele será criado.
if (!fs.existsSync(uploadDir)) {
  try {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log(`Diretório de uploads criado em: ${uploadDir}`);
  } catch (error) {
    console.error(`Erro ao criar o diretório de uploads:`, error);
  }
}

// Define onde os arquivos serão armazenados
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir); 
  },
  filename: (req, file, cb) => {
    // Gera um nome de arquivo único para evitar conflitos
    crypto.randomBytes(16, (err, hash) => {
      if (err) cb(err);
      const fileName = `${hash.toString('hex')}-${file.originalname}`;
      cb(null, fileName);
    });
  },
});

// Configura o middleware do Multer
const upload = multer({
  storage,
  // Adiciona um filtro para aceitar apenas imagens
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'image/jpeg',
      'image/pjpeg',
      'image/png',
      'image/gif',
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo inválido.'));
    }
  },
});

module.exports = upload;