// storefront/src/components/AuthModal.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios'; // Certifique-se de importar o axios
import { jwtDecode } from "jwt-decode"; // Importar jwt-decode para verificar role no finally
import styles from './AuthModal.module.css';

// --- Ícones ---
const EmailIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16"><path d="M.05 3.555A2 2 0 0 1 2 2h12a2 2 0 0 1 1.95 1.555L8 8.414zM0 4.697v7.104l5.803-3.558zM6.761 8.83l-6.57 4.027A2 2 0 0 0 2 14h12a2 2 0 0 0 1.808-1.144l-6.57-4.027L8 9.586zm9.192-3.831-.002-.001-.002-.001L10.197 8.87l5.803 3.557z"/></svg>;
const UserIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16"><path d="M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6"/></svg>;
const LockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16"><path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2m3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2"/></svg>;
const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16"><path d="M.293.293a1 1 0 0 1 1.414 0L8 6.586 14.293.293a1 1 0 1 1 1.414 1.414L9.414 8l6.293 6.293a1 1 0 0 1-1.414 1.414L8 9.414l-6.293 6.293a1 1 0 0 1-1.414-1.414L6.586 8 .293 1.707a1 1 0 0 1 0-1.414"/></svg>;
const CpfIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16"><path d="M1 1h14v2H1zm0 4h14v2H1zm0 4h14v2H1zm0 4h14v2H1z"/></svg>; // Ícone simples para CPF

// --- Componente do Modal ---
function AuthModal({ isOpen, onClose }) {
    // Estados para controlar a visão ('welcome' ou 'register'), inputs, mensagens e loading
    const [view, setView] = useState('welcome');
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);

    const [registerEmail, setRegisterEmail] = useState('');
    const [registerUsername, setRegisterUsername] = useState(''); // Usado como 'nome' para Cliente
    const [registerPassword, setRegisterPassword] = useState('');
    const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');
    const [registerTermsAccepted, setRegisterTermsAccepted] = useState(false);
    const [registerCpf, setRegisterCpf] = useState(''); // Estado para o CPF

    const [message, setMessage] = useState({ text: '', type: '', target: null }); // target: 'login' | 'register'
    const [isLoading, setIsLoading] = useState(false);

    // Efeito para resetar o estado do modal sempre que ele for aberto ou fechado
    useEffect(() => {
        if (isOpen) {
            setView('welcome'); // Sempre começa na tela de boas-vindas/login
            // Limpa todos os campos de input
            setLoginEmail('');
            setLoginPassword('');
            setRememberMe(false);
            setRegisterEmail('');
            setRegisterUsername('');
            setRegisterPassword('');
            setRegisterConfirmPassword('');
            setRegisterTermsAccepted(false);
            setRegisterCpf(''); // Limpa CPF
            // Limpa mensagens e estado de loading
            setMessage({ text: '', type: '', target: null });
            setIsLoading(false);
        }
    }, [isOpen]); // Executa quando 'isOpen' muda

    // --- Funções de Submissão ---

    // Função para lidar com o Login
    const handleLogin = async (e) => {
        e.preventDefault(); // Impede o recarregamento padrão da página
        setMessage({ text: '', type: '', target: null }); // Limpa mensagens anteriores
        setIsLoading(true); // Ativa o estado de carregamento
        let loggedInUserRole = null; // Variável para guardar o role após o login bem sucedido
        let loginErrorOccurred = false; // Flag para controlar se houve erro

        // Validação frontend básica
        if (!loginEmail || !loginPassword) {
            setMessage({ text: 'Email e Senha são obrigatórios.', type: 'error', target: 'login' });
            setIsLoading(false);
            return; // Interrompe se campos vazios
        }

        try {
            // Chama o endpoint de login unificado
            const response = await axios.post('/api/auth/login', { email: loginEmail, password: loginPassword });
            const { token, user } = response.data; // Extrai o token e as informações do usuário da resposta

            localStorage.setItem('authToken', token); // Armazena o token no localStorage
            setMessage({ text: 'Login bem-sucedido! Redirecionando...', type: 'success', target: 'login' });
            loggedInUserRole = user?.role; // Guarda o role para usar no finally

            // Redireciona com base no papel ('role') retornado pela API
            if (user?.role === 'adm' || user?.role === 'vendas') {
                // --- AJUSTE AQUI ---
                if (import.meta.env.DEV) {
                    // Desenvolvimento: Redireciona para a URL completa do servidor Vite do backoffice
                    console.log("DEV Mode: Redirecionando para http://localhost:5174/app/");
                    window.location.href = 'http://localhost:5174/app/';
                } else {
                    // Produção: Redireciona para o caminho relativo /app
                    console.log("PROD Mode: Redirecionando para /app");
                    window.location.href = '/app';
                }
                // Não precisa de setTimeout, redirecionamento deve ser rápido
                // --- FIM DO AJUSTE ---
            } else if (user?.role === 'cliente') {
                // Cliente: Fecha o modal e recarrega a página atual do storefront (APÓS 1 SEGUNDO)
                setTimeout(() => {
                    onClose(); // Chama a função para fechar o modal
                    window.location.reload(); // Recarrega a página para atualizar o estado (ex: mostrar nome do usuário)
                }, 1000); // Mantém o delay para o cliente ver a mensagem
            } else {
                // Caso inesperado (papel não reconhecido)
                console.error("Papel do usuário desconhecido:", user?.role);
                setMessage({ text: 'Login bem-sucedido, mas redirecionamento falhou.', type: 'error', target: 'login' });
                loginErrorOccurred = true; // Marca que houve um erro lógico
                setTimeout(onClose, 1500); // Fecha o modal após um tempo
            }
        } catch (error) {
            // Exibe mensagem de erro vinda da API ou uma mensagem genérica
            setMessage({ text: error.response?.data?.msg || 'Erro no login. Verifique suas credenciais.', type: 'error', target: 'login' });
            loginErrorOccurred = true; // Marca que houve erro na requisição
        } finally {
             // Só desativa o loading se NÃO for um funcionário logando OU se ocorreu um erro
             if (loggedInUserRole === 'cliente' || !loggedInUserRole || loginErrorOccurred) {
                setIsLoading(false);
             }
             // Se for 'adm' ou 'vendas' e não houve erro, a página vai redirecionar antes disso
        }
    };


    // Função para lidar com o Cadastro (Apenas Clientes) - SEM ALTERAÇÕES
    const handleRegister = async (e) => {
        e.preventDefault();
        setMessage({ text: '', type: '', target: null });
        setIsLoading(true);

        if (!registerEmail || !registerUsername || !registerCpf || !registerPassword || !registerConfirmPassword) {
            setMessage({ text: 'Todos os campos são obrigatórios.', type: 'error', target: 'register' });
            setIsLoading(false); return;
        }
        if (registerPassword !== registerConfirmPassword) {
            setMessage({ text: 'As senhas não conferem.', type: 'error', target: 'register' });
            setIsLoading(false); return;
        }
        if (registerPassword.length < 6) {
             setMessage({ text: 'A senha deve ter no mínimo 6 caracteres.', type: 'error', target: 'register' });
             setIsLoading(false); return;
        }
        if (!registerTermsAccepted) {
            setMessage({ text: 'Você deve aceitar os termos.', type: 'error', target: 'register' });
            setIsLoading(false); return;
        }

        try {
            const response = await axios.post('/api/clientes', {
                email: registerEmail,
                nome: registerUsername,
                cpf: registerCpf,
                password: registerPassword,
                confirmpassword: registerConfirmPassword
            });
            setMessage({ text: response.data.msg || 'Cadastro realizado com sucesso!', type: 'success', target: 'register' });
            setTimeout(() => {
                setView('welcome');
                setMessage({ text: 'Cadastro realizado! Faça login para continuar.', type: 'success', target: 'login' });
            }, 1500);
        } catch (error) {
            setMessage({ text: error.response?.data?.msg || 'Erro ao cadastrar. Verifique os dados.', type: 'error', target: 'register' });
        } finally {
            setIsLoading(false);
        }
    };

    // Se o modal não estiver aberto, não renderiza nada
    if (!isOpen) return null;

    // --- Renderização do Modal --- (O JSX permanece o mesmo da resposta anterior)
    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={`${styles.modalContent} ${view === 'register' ? styles.showRegister : ''}`} onClick={(e) => e.stopPropagation()}>
                <button className={styles.closeButton} onClick={onClose} aria-label="Fechar">
                    <CloseIcon />
                </button>
                <div className={styles.splitLayout}>
                    {/* --- COLUNA ESQUERDA (Welcome / Register Form) --- */}
                    <div className={styles.leftColumn}>
                        {view === 'welcome' && (
                            <div className={styles.welcomeContent}>
                                <h2 className={styles.columnTitle}>BEM-VINDO!</h2>
                                <p className={styles.welcomeText}>Cadastre-se e ganhe 10% off na primeira compra!</p>
                                <button
                                    onClick={() => { setView('register'); setMessage({ text: '', type: '', target: null }); }}
                                    className={styles.primaryButton}
                                    disabled={isLoading}
                                >
                                    Criar conta
                                </button>
                                {message.target === 'login' && message.type === 'success' && !message.text.includes('Redirecionando') &&
                                    <p className={`${styles.message} ${styles.success}`} style={{marginTop: '15px'}}>{message.text}</p>
                                }
                            </div>
                        )}
                        {view === 'register' && (
                            <form onSubmit={handleRegister} noValidate>
                                <h2 className={styles.columnTitle}>CADASTRE-SE</h2>
                                <div className={styles.inputGroup}>
                                    <span className={styles.icon}><UserIcon /></span>
                                    <input type="text" placeholder="NOME" value={registerUsername} onChange={(e) => setRegisterUsername(e.target.value)} required />
                                </div>
                                <div className={styles.inputGroup}>
                                    <span className={styles.icon}><EmailIcon /></span>
                                    <input type="email" placeholder="EMAIL" value={registerEmail} onChange={(e) => setRegisterEmail(e.target.value)} required />
                                </div>
                                <div className={styles.inputGroup}>
                                    <span className={styles.icon}><CpfIcon /></span>
                                    <input type="text" placeholder="CPF" value={registerCpf} onChange={(e) => setRegisterCpf(e.target.value)} required />
                                </div>
                                <div className={styles.inputGroup}>
                                    <span className={styles.icon}><LockIcon /></span>
                                    <input type="password" placeholder="SENHA (mín. 6 caracteres)" value={registerPassword} onChange={(e) => setRegisterPassword(e.target.value)} required />
                                </div>
                                <div className={styles.inputGroup}>
                                    <span className={styles.icon}><LockIcon /></span>
                                    <input type="password" placeholder="CONFIRMAR SENHA" value={registerConfirmPassword} onChange={(e) => setRegisterConfirmPassword(e.target.value)} required />
                                </div>
                                <div className={styles.termsGroup}>
                                    <input type="checkbox" id="termsReg" checked={registerTermsAccepted} onChange={(e) => setRegisterTermsAccepted(e.target.checked)} />
                                    <label htmlFor="termsReg">Li e aceito os <a href="/termos" target="_blank" className={styles.termsLink}>TERMOS</a></label>
                                </div>
                                {message.target === 'register' && message.text && <p className={`${styles.message} ${message.type === 'error' ? styles.error : styles.success}`}>{message.text}</p>}
                                <button type="submit" className={styles.primaryButton} disabled={isLoading || !registerTermsAccepted}>
                                    {isLoading ? 'CADASTRANDO...' : 'CADASTRAR'}
                                </button>
                                <p className={styles.toggleText}>
                                    Já tem conta? <button type="button" onClick={() => { setView('welcome'); setMessage({ text: '', type: '', target: null }); }} className={styles.toggleLink}>Fazer Login</button>
                                </p>
                            </form>
                        )}
                    </div>
                    {/* --- LINHA DIVISÓRIA --- */}
                    <div className={styles.divider}></div>
                    {/* --- COLUNA DIREITA (Login Form) --- */}
                    <div className={styles.rightColumn}>
                        <form onSubmit={handleLogin} noValidate>
                            <h2 className={styles.columnTitle}>FAÇA LOGIN</h2>
                            <div className={styles.inputGroup}>
                                <span className={styles.icon}><EmailIcon /></span>
                                <input
                                    type="email"
                                    placeholder="EMAIL"
                                    value={loginEmail}
                                    onChange={(e) => setLoginEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div className={styles.inputGroup}>
                                <span className={styles.icon}><LockIcon /></span>
                                <input
                                    type="password"
                                    placeholder="SENHA"
                                    value={loginPassword}
                                    onChange={(e) => setLoginPassword(e.target.value)}
                                    required
                                />
                            </div>
                            <div className={styles.rememberGroup}>
                                <input
                                    type="checkbox"
                                    id="remember"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                />
                                <label htmlFor="remember">Lembrar senha?</label>
                            </div>
                            {message.target === 'login' && message.text && <p className={`${styles.message} ${message.type === 'error' ? styles.error : styles.success}`}>{message.text}</p>}
                            <button type="submit" className={styles.primaryButton} disabled={isLoading}>
                                {isLoading ? 'ENTRANDO...' : 'Entrar'}
                            </button>
                            {view === 'welcome' && (
                                <p className={styles.toggleText}>
                                    Não tem conta? <button type="button" onClick={() => { setView('register'); setMessage({ text: '', type: '', target: null }); }} className={styles.toggleLink}>Criar conta</button>
                                </p>
                            )}
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AuthModal;