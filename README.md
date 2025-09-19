# Listen - Backoffice de E-commerce

## Status do Projeto

Atenção: Este projeto está atualmente em desenvolvimento. As funcionalidades podem sofrer alterações, e novas secções podem ser adicionadas ou removidas.

---

## Sobre o Projeto

O Listen foi desenvolvido para ser uma ferramenta interna de gestão (backoffice), permitindo que administradores e vendedores controlem o inventário de produtos, administrem a base de utilizadores e recebam alertas importantes sobre o estado da loja, como a falta de stock de um produto.

---

## Funcionalidades Principais

* **Autenticação e Segurança:**
    * Sistema de login com tokens JWT (JSON Web Tokens) para garantir a segurança das rotas.
    * Controlo de acesso baseado em funções (*roles*): `adm` (Administrador) e `vendas`.

* **Gestão de Produtos (CRUD Completo):**
    * Adicionar, editar, visualizar e apagar produtos.
    * Upload de imagens de capa para os álbuns, com armazenamento no servidor.
    * Filtros por categoria e pesquisa dinâmica por nome do produto.

* **Gestão de Utilizadores (Apenas para Admins):**
    * Adicionar, visualizar e apagar utilizadores do sistema.
    * Atribuir funções (`adm` ou `vendas`) a novos utilizadores.

* **Notificações em Tempo Real:**
    * Sistema de notificações instantâneas (via Socket.IO) no painel quando eventos importantes ocorrem.
    * Notificação automática por e-mail para administradores quando o stock de um produto chega a zero.

* **Envio de E-mail:**
    * Funcionalidade para enviar e-mails manualmente através de um formulário no painel.

---

## Tecnologias Utilizadas

A aplicação segue uma arquitetura cliente-servidor, utilizando as seguintes tecnologias:

* **Backend:**
    * **Node.js**: Ambiente de execução do JavaScript no servidor.
    * **Express.js**: Framework para a criação da API REST e gestão de rotas.
    * **MongoDB**: Banco de dados NoSQL para armazenar os dados.
    * **Mongoose**: ODM para modelar e interagir com o MongoDB.
    * **JSON Web Token (JWT)**: Para a criação de tokens de autenticação seguros.
    * **Socket.IO**: Para a comunicação em tempo real e notificações.
    * **Nodemailer**: Para o envio de e-mails transacionais e de alerta.
    * **Multer**: Middleware para o upload de ficheiros (imagens dos produtos).
    * **Dotenv**: Para a gestão de variáveis de ambiente.

* **Frontend:**
    * HTML5
    * CSS3 (com variáveis e layout responsivo)
    * JavaScript (Vanilla): Para a manipulação do DOM e comunicação com a API.

* **Ferramentas de Desenvolvimento:**
    * **Nodemon**: Para reiniciar o servidor automaticamente durante o desenvolvimento.

---

## Instalação e Execução

Para executar este projeto localmente, siga os passos abaixo.

**Pré-requisitos:**

* Node.js (versão 16 ou superior)
* Git
* Uma instância do MongoDB (local ou em cloud, como o MongoDB Atlas)

**Passo a passo:**

1.  **Clone o repositório:**
    ```bash
    git clone [https://github.com/seu-usuario/listen-ecommerce-backoffice.git](https://github.com/Daniel-henrQ/listen-ecommerce-backoffice.git)
    ```

2.  **Acesse a pasta do projeto:**
    ```bash
    cd listen-ecommerce-backoffice
    ```

3.  **Instale as dependências do projeto:**
    ```bash
    npm install
    ```

4.  **Configure as variáveis de ambiente:**
    * Crie um ficheiro chamado `.env` na raiz do projeto.
    * Copie o conteúdo abaixo para o ficheiro `.env` e substitua com as suas credenciais:
        ```env
        # Configuração do Banco de Dados MongoDB
        DB_USER=seu_usuario_do_banco
        DB_PASSWORD=sua_senha_do_banco
        DB_CLUSTER=seu_cluster.mongodb.net
        DB_NAME=nome_do_banco

        # Chave secreta para o JWT
        SECRET=SUA_CHAVE_SECRETA_PARA_O_TOKEN

        # Configuração do Servidor de E-mail (SMTP)
        SMTP_HOST=smtp.example.com
        SMTP_PORT=587
        SMTP_USER=seu_email@example.com
        SMTP_PASS=sua_senha_de_email
        SMTP_FROM="Nome do Remetente"
        SMTP_SECURE=false

        # Porta da aplicação
        PORT=3000
        ```

5.  **Inicie o servidor de desenvolvimento:**
    ```bash
    npm run dev
    ```

6.  **Aceda à aplicação:**
    * Abra o seu navegador e aceda a `http://localhost:3000` para ver a página de login.

---

## Estrutura de Ficheiros
/listen-ecommerce-backoffice
|
├── backend/
│   ├── config.js               # Conexão com o MongoDB
│   ├── controllers/            # Lógica de negócio (auth, produtos, etc.)
│   ├── middleware/             # Middlewares (checkToken, checkRole, multer)
│   ├── models/                 # Schemas do Mongoose (Produto, Usuario)
│   ├── routes/                 # Definição das rotas da API
│   └── server.js               # Ficheiro principal do servidor (entry point)
|
├── public/
│   ├── images/                 # Imagens estáticas (logo)
│   ├── script/                 # Ficheiros JavaScript do frontend
│   ├── style/                  # Ficheiros CSS
│   ├── uploads/                # Pasta onde as imagens dos produtos são guardadas
│   ├── index.html              # Página principal do dashboard
│   └── login.html              # Página de login
|
├── .gitignore                  # Ficheiros e pastas a serem ignorados pelo Git
├── package.json                # Dependências e scripts do projeto
└── README.md                   # Documentação do projeto
Feito por Daniel https://github.com/Daniel-henrQ/
