// storefront/src/components/AuthModal.jsx
import React, { useState, useEffect, useContext } from 'react'; // Adicionar useContext
import axios from 'axios';
import { AuthContext } from '../context/AuthContext.jsx'; // Importar AuthContext
// Remover jwtDecode se não for mais usado aqui
// import { jwtDecode } from "jwt-decode";
import styles from './AuthModal.module.css';

// Ícones... (como estavam)
const EmailIcon = () => {/*...*/};
const UserIcon = () => {/*...*/};
const LockIcon = () => {/*...*/};
const CloseIcon = () => {/*...*/};
const CpfIcon = () => {/*...*/};


function AuthModal({ isOpen, onClose }) {
    const { login } = useContext(AuthContext); // Obter função login do contexto
    const [view, setView] = useState('welcome');
    // ... (outros states como estavam) ...
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [registerEmail, setRegisterEmail] = useState('');
    const [registerUsername, setRegisterUsername] = useState('');
    const [registerPassword, setRegisterPassword] = useState('');
    const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');
    const [registerTermsAccepted, setRegisterTermsAccepted] = useState(false);
    const [registerCpf, setRegisterCpf] = useState('');
    const [message, setMessage] = useState({ text: '', type: '', target: null });
    const [isLoading, setIsLoading] = useState(false);


    // useEffect para resetar o estado (como estava)
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
             setRegisterCpf('');
             setMessage({ text: '', type: '', target: null });
             setIsLoading(false);
         }
     }, [isOpen]);

    // --- Função de Login ATUALIZADA ---
    const handleLogin = async (e) => {
        e.preventDefault();
        setMessage({ text: '', type: '', target: null });
        setIsLoading(true);

        if (!loginEmail || !loginPassword) {
            setMessage({ text: 'Email e Senha são obrigatórios.', type: 'error', target: 'login' });
            setIsLoading(false);
            return;
        }

        try {
            const response = await axios.post('/api/auth/login', { email: loginEmail, password: loginPassword });
            const { token, user } = response.data;

            // Chama a função login do contexto para guardar o token e atualizar o estado
            login(token);

            setMessage({ text: 'Login bem-sucedido!', type: 'success', target: 'login' });

            // Redireciona APENAS se for adm ou vendas
            if (user?.role === 'adm' || user?.role === 'vendas') {
                setMessage({ text: 'Login bem-sucedido! A redirecionar para o backoffice...', type: 'success', target: 'login' });
                // A lógica de DEV/PROD para redirecionamento permanece
                 if (import.meta.env.DEV) {
                     console.log("DEV Mode: Redirecionando para http://localhost:5174/app/");
                     window.location.href = 'http://localhost:5174/app/';
                 } else {
                     console.log("PROD Mode: Redirecionando para /app");
                     window.location.href = '/app';
                 }
                 // Não precisa mais setIsLoading(false) aqui, pois a página vai mudar
            } else {
                // Para Cliente, apenas fecha o modal após um delay
                setTimeout(() => {
                    onClose(); // Fecha o modal
                     // Não precisa mais recarregar a página, o contexto atualizado fará o re-render
                     // window.location.reload();
                }, 1000);
                 setIsLoading(false); // Garante que o loading para no caso do cliente
            }

        } catch (error) {
            setMessage({ text: error.response?.data?.msg || 'Erro no login. Verifique as suas credenciais.', type: 'error', target: 'login' });
             setIsLoading(false); // Para o loading em caso de erro
        }
        // Não precisa de finally aqui, setIsLoading é tratado nos branches
    };

    // --- Função handleRegister (permanece como estava, pois não faz login automático) ---
     const handleRegister = async (e) => {
         e.preventDefault();
         setMessage({ text: '', type: '', target: null });
         setIsLoading(true);

         // ... (validações como estavam) ...
         if (!registerEmail || !registerUsername || !registerCpf || !registerPassword || !registerConfirmPassword) { setMessage({ text: 'Todos os campos são obrigatórios.', type: 'error', target: 'register' }); setIsLoading(false); return; }
         if (registerPassword !== registerConfirmPassword) { setMessage({ text: 'As senhas não conferem.', type: 'error', target: 'register' }); setIsLoading(false); return; }
         if (registerPassword.length < 6) { setMessage({ text: 'A senha deve ter no mínimo 6 caracteres.', type: 'error', target: 'register' }); setIsLoading(false); return; }
         if (!registerTermsAccepted) { setMessage({ text: 'Você deve aceitar os termos.', type: 'error', target: 'register' }); setIsLoading(false); return; }


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

    if (!isOpen) return null;

    // --- Renderização do Modal (JSX como estava) ---
    return (
        <div className={styles.overlay} onClick={onClose}>
            {/* ... (restante do JSX do modal como estava) ... */}
             <div className={`${styles.modalContent} ${view === 'register' ? styles.showRegister : ''}`} onClick={(e) => e.stopPropagation()}>
                <button className={styles.closeButton} onClick={onClose} aria-label="Fechar"> <CloseIcon /> </button>
                <div className={styles.splitLayout}>
                    {/* --- COLUNA ESQUERDA --- */}
                    <div className={styles.leftColumn}>
                        {view === 'welcome' && ( <div className={styles.welcomeContent}> {/* ... conteúdo welcome ... */} <h2 className={styles.columnTitle}>BEM-VINDO!</h2> <p className={styles.welcomeText}>Cadastre-se e ganhe 10% off na primeira compra!</p> <button onClick={() => { setView('register'); setMessage({ text: '', type: '', target: null }); }} className={styles.primaryButton} disabled={isLoading} > Criar conta </button> {message.target === 'login' && message.type === 'success' && !message.text.includes('Redirecionando') && <p className={`${styles.message} ${styles.success}`} style={{marginTop: '15px'}}>{message.text}</p> } </div> )}
                        {view === 'register' && ( <form onSubmit={handleRegister} noValidate> {/* ... inputs de registo ... */} <h2 className={styles.columnTitle}>CADASTRE-SE</h2> <div className={styles.inputGroup}> <span className={styles.icon}><UserIcon /></span> <input type="text" placeholder="NOME" value={registerUsername} onChange={(e) => setRegisterUsername(e.target.value)} required /> </div> <div className={styles.inputGroup}> <span className={styles.icon}><EmailIcon /></span> <input type="email" placeholder="EMAIL" value={registerEmail} onChange={(e) => setRegisterEmail(e.target.value)} required /> </div> <div className={styles.inputGroup}> <span className={styles.icon}><CpfIcon /></span> <input type="text" placeholder="CPF" value={registerCpf} onChange={(e) => setRegisterCpf(e.target.value)} required /> </div> <div className={styles.inputGroup}> <span className={styles.icon}><LockIcon /></span> <input type="password" placeholder="SENHA (mín. 6 caracteres)" value={registerPassword} onChange={(e) => setRegisterPassword(e.target.value)} required /> </div> <div className={styles.inputGroup}> <span className={styles.icon}><LockIcon /></span> <input type="password" placeholder="CONFIRMAR SENHA" value={registerConfirmPassword} onChange={(e) => setRegisterConfirmPassword(e.target.value)} required /> </div> <div className={styles.termsGroup}> <input type="checkbox" id="termsReg" checked={registerTermsAccepted} onChange={(e) => setRegisterTermsAccepted(e.target.checked)} /> <label htmlFor="termsReg">Li e aceito os <a href="/termos" target="_blank" className={styles.termsLink}>TERMOS</a></label> </div> {message.target === 'register' && message.text && <p className={`${styles.message} ${message.type === 'error' ? styles.error : styles.success}`}>{message.text}</p>} <button type="submit" className={styles.primaryButton} disabled={isLoading || !registerTermsAccepted} > {isLoading ? 'CADASTRANDO...' : 'CADASTRAR'} </button> <p className={styles.toggleText}> Já tem conta? <button type="button" onClick={() => { setView('welcome'); setMessage({ text: '', type: '', target: null }); }} className={styles.toggleLink}>Fazer Login</button> </p> </form> )}
                    </div>

                    {/* --- LINHA DIVISÓRIA --- */}
                    <div className={styles.divider}></div>

                    {/* --- COLUNA DIREITA --- */}
                    <div className={styles.rightColumn}>
                        <form onSubmit={handleLogin} noValidate> {/* ... inputs de login ... */} <h2 className={styles.columnTitle}>FAÇA LOGIN</h2> <div className={styles.inputGroup}> <span className={styles.icon}><EmailIcon /></span> <input type="email" placeholder="EMAIL" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required /> </div> <div className={styles.inputGroup}> <span className={styles.icon}><LockIcon /></span> <input type="password" placeholder="SENHA" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required /> </div> <div className={styles.rememberGroup}> <input type="checkbox" id="remember" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} /> <label htmlFor="remember">Lembrar senha?</label> </div> {message.target === 'login' && message.text && <p className={`${styles.message} ${message.type === 'error' ? styles.error : styles.success}`}>{message.text}</p>} <button type="submit" className={styles.primaryButton} disabled={isLoading}> {isLoading ? 'ENTRANDO...' : 'Entrar'} </button> {view === 'welcome' && ( <p className={styles.toggleText}> Não tem conta? <button type="button" onClick={() => { setView('register'); setMessage({ text: '', type: '', target: null }); }} className={styles.toggleLink}>Criar conta</button> </p> )} </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AuthModal;