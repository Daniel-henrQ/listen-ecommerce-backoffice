// storefront/src/components/AuthModal.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './AuthModal.module.css';

// Ícones (mantidos como antes)
const EmailIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16"><path d="M.05 3.555A2 2 0 0 1 2 2h12a2 2 0 0 1 1.95 1.555L8 8.414zM0 4.697v7.104l5.803-3.558zM6.761 8.83l-6.57 4.027A2 2 0 0 0 2 14h12a2 2 0 0 0 1.808-1.144l-6.57-4.027L8 9.586zm9.192-3.831-.002-.001-.002-.001L10.197 8.87l5.803 3.557z"/></svg>;
const UserIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16"><path d="M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6"/></svg>;
const LockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16"><path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2m3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2"/></svg>;
const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16"><path d="M.293.293a1 1 0 0 1 1.414 0L8 6.586 14.293.293a1 1 0 1 1 1.414 1.414L9.414 8l6.293 6.293a1 1 0 0 1-1.414 1.414L8 9.414l-6.293 6.293a1 1 0 0 1-1.414-1.414L6.586 8 .293 1.707a1 1 0 0 1 0-1.414"/></svg>;

// Componente do Modal
function AuthModal({ isOpen, onClose }) {
    const [view, setView] = useState('welcome'); // 'welcome' ou 'register'
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);

    const [registerEmail, setRegisterEmail] = useState('');
    const [registerUsername, setRegisterUsername] = useState(''); // Usado como 'nome' para Cliente
    const [registerPassword, setRegisterPassword] = useState('');
    const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');
    const [registerTermsAccepted, setRegisterTermsAccepted] = useState(false);
    // Adicionar CPF ao registo
    const [registerCpf, setRegisterCpf] = useState('');

    const [message, setMessage] = useState({ text: '', type: '', target: null }); // target: 'login' | 'register'
    const [isLoading, setIsLoading] = useState(false);

    // Reseta tudo ao abrir/fechar
    useEffect(() => {
        if (isOpen) {
            setView('welcome');
            setLoginEmail('');
            setLoginPassword('');
            setRememberMe(false);
            setRegisterEmail('');
            setRegisterUsername('');
            setRegisterPassword('');
            setRegisterConfirmPassword('');
            setRegisterTermsAccepted(false);
            setRegisterCpf(''); // Limpa CPF
            setMessage({ text: '', type: '', target: null });
            setIsLoading(false);
        }
    }, [isOpen]);

    // --- Funções de Submissão ---
    const handleLogin = async (e) => {
        e.preventDefault();
        setMessage({ text: '', type: '', target: null });
        setIsLoading(true);

        if (!loginEmail || !loginPassword) {
            setMessage({ text: 'Email e Senha são obrigatórios.', type: 'error', target: 'login' });
            setIsLoading(false); return;
        }
        try {
            // Esta chamada agora funciona para ambos os tipos de utilizador
            const response = await axios.post('/api/auth/login', { email: loginEmail, password: loginPassword });
            setMessage({ text: 'Login bem-sucedido! Redirecionando...', type: 'success', target: 'login' });
            localStorage.setItem('authToken', response.data.token);

            // Verifica o papel retornado pela API para decidir o redirecionamento
            const userRole = response.data.user?.role;
            if (userRole === 'adm' || userRole === 'vendas') {
                // Redireciona funcionário para o backoffice
                setTimeout(() => {
                    window.location.href = '/app'; // Redireciona para o backoffice
                }, 1000);
            } else if (userRole === 'cliente') {
                // Mantém cliente no storefront (ou redireciona para dashboard de cliente, se houver)
                setTimeout(() => {
                    onClose(); // Fecha o modal
                    window.location.reload(); // Recarrega a página para atualizar o estado de autenticação na HomePage
                }, 1000);
            } else {
                 // Caso inesperado (papel não reconhecido)
                 console.error("Papel de utilizador desconhecido recebido:", userRole);
                 setMessage({ text: 'Login bem-sucedido, mas papel desconhecido.', type: 'error', target: 'login' });
                 setTimeout(onClose, 1500); // Fecha o modal após um tempo
            }
        } catch (error) {
            setMessage({ text: error.response?.data?.msg || 'Erro no login.', type: 'error', target: 'login' });
        } finally { setIsLoading(false); }
    };

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
        if (!registerTermsAccepted) {
            setMessage({ text: 'Você deve aceitar os termos.', type: 'error', target: 'register' });
            setIsLoading(false); return;
        }
        try {
            // Envia para a rota de criação de Cliente
            const response = await axios.post('/api/clientes', {
                email: registerEmail,
                nome: registerUsername, // O backend espera 'nome' para Cliente
                cpf: registerCpf,
                password: registerPassword,
                confirmpassword: registerConfirmPassword
                // Outros campos de cliente poderiam ser adicionados aqui
            });
            setMessage({ text: response.data.msg || 'Cadastro realizado com sucesso!', type: 'success', target: 'register' });
             setTimeout(() => {
                 setView('welcome'); // Muda para a view de login após sucesso
                 setMessage({ text: 'Cadastro realizado! Faça login para continuar.', type: 'success', target: 'login' }); // Mensagem na tela de login
             }, 1500);
        } catch (error) {
            setMessage({ text: error.response?.data?.msg || 'Erro ao cadastrar.', type: 'error', target: 'register' });
        } finally { setIsLoading(false); }
    };

    if (!isOpen) return null;

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
                                <h2 className={styles.columnTitle}>BEM VINDO!</h2>
                                <p className={styles.welcomeText}>Cadastre-se e ganhe 10% off na primeira compra!</p>
                                <button
                                    onClick={() => setView('register')}
                                    className={styles.primaryButton}
                                    disabled={isLoading}
                                >
                                    Criar conta
                                </button>
                                {/* Mensagem de sucesso do registo pode aparecer aqui */}
                                {message.target === 'login' && message.type === 'success' && !message.text.includes('Redirecionando') &&
                                    <p className={`${styles.message} ${styles.success}`} style={{marginTop: '15px'}}>{message.text}</p>
                                }
                            </div>
                        )}

                        {view === 'register' && (
                            <form onSubmit={handleRegister}>
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
                                    <span className={styles.icon}><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16"><path d="M1 1h14v2H1zM3 5h10v2H3zm0 4h10v2H3zm0 4h10v2H3z"/></svg></span> {/* Ícone genérico para CPF */}
                                    <input type="text" placeholder="CPF" value={registerCpf} onChange={(e) => setRegisterCpf(e.target.value)} required />
                                </div>
                                <div className={styles.inputGroup}>
                                    <span className={styles.icon}><LockIcon /></span>
                                    <input type="password" placeholder="SENHA" value={registerPassword} onChange={(e) => setRegisterPassword(e.target.value)} required />
                                </div>
                                <div className={styles.inputGroup}>
                                    <span className={styles.icon}><LockIcon /></span>
                                    <input type="password" placeholder="CONFIRMAR SENHA" value={registerConfirmPassword} onChange={(e) => setRegisterConfirmPassword(e.target.value)} required />
                                </div>
                                <div className={styles.termsGroup}>
                                    <input type="checkbox" id="termsReg" checked={registerTermsAccepted} onChange={(e) => setRegisterTermsAccepted(e.target.checked)} />
                                    <label htmlFor="termsReg">Aceitar <a href="/termos" target="_blank" className={styles.termsLink}>TERMOS</a></label>
                                </div>
                                {message.target === 'register' && message.text && <p className={`${styles.message} ${message.type === 'error' ? styles.error : styles.success}`}>{message.text}</p>}
                                <button type="submit" className={styles.primaryButton} disabled={isLoading}>
                                    {isLoading ? 'CADASTRANDO...' : 'CADASTRAR'}
                                </button>
                                 <p className={styles.toggleText}>
                                    Já tem conta? <button type="button" onClick={() => setView('welcome')} className={styles.toggleLink}>Fazer Login</button>
                                 </p>
                            </form>
                        )}
                    </div>

                    {/* --- LINHA DIVISÓRIA --- */}
                    <div className={styles.divider}></div>

                    {/* --- COLUNA DIREITA (Login Form) --- */}
                    <div className={styles.rightColumn}>
                        <form onSubmit={handleLogin}>
                            <h2 className={styles.columnTitle}>FAÇA LOGIN</h2>
                            <div className={styles.inputGroup}>
                                <span className={styles.icon}><EmailIcon /></span> {/* Alterado para EmailIcon */}
                                <input
                                    type="email" // Alterado para email
                                    placeholder="EMAIL" // Placeholder atualizado
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
                            {/* Mostra "Criar conta" apenas se a view esquerda for 'welcome' */}
                            {view === 'welcome' && (
                                <p className={styles.toggleText}>
                                   Não tem conta? <button type="button" onClick={() => setView('register')} className={styles.toggleLink}>Criar conta</button>
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