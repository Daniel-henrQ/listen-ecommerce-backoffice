// storefront/src/components/AuthModal.jsx
import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext.jsx';
import styles from './AuthModal.module.css';

// SVG Icons (assuming they are defined correctly)
const EmailIcon = () => <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"></path><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"></path></svg>;
const UserIcon = () => <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"></path></svg>;
const LockIcon = () => <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"></path></svg>;
const CloseIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
const CpfIcon = () => <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18"><path fillRule="evenodd" d="M3 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm2 2V5h1v1H5zM3 13a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1v-3zm2 2v-1h1v1H5zM10 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1V4zm2 2V5h1v1h-1zM10 13a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-3zm2 2v-1h1v1h-1z" clipRule="evenodd"></path></svg>;


function AuthModal({ isOpen, onClose }) {
    const { login } = useContext(AuthContext);
    const [view, setView] = useState('welcome');
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [registerEmail, setRegisterEmail] = useState('');
    const [registerUsername, setRegisterUsername] = useState('');
    const [registerPassword, setRegisterPassword] = useState('');
    const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');
    const [registerTermsAccepted, setRegisterTermsAccepted] = useState(false);
    const [registerCpf, setRegisterCpf] = useState('');
    const [message, setMessage] = useState({ text: '', type: '', target: null }); // General messages
    const [fieldErrors, setFieldErrors] = useState({}); // Field-specific errors
    const [isLoading, setIsLoading] = useState(false);

    // Helper to clear form states
    const clearForms = () => {
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
        setFieldErrors({}); // Clear field errors too
        setIsLoading(false);
    };

    useEffect(() => {
        if (isOpen) {
            setView('welcome'); // Start at welcome screen
            clearForms(); // Reset all fields and errors
        }
    }, [isOpen]);

    // --- LOGIN ---
const handleLogin = async (e) => {
  e.preventDefault();
  setMessage({ text: '', type: '', target: null });
  setFieldErrors({});
  setIsLoading(true);

  let errors = {};
  if (!loginEmail) errors.loginEmail = 'Email é obrigatório.';
  if (!loginPassword) errors.loginPassword = 'Senha é obrigatória.';

  if (Object.keys(errors).length > 0) {
    setFieldErrors(errors);
    setIsLoading(false);
    return;
  }

  try {
    // 🔹 Usa o AuthContext, que já lida com token e API base
    const loginData = { email: loginEmail, password: loginPassword };
    const result = await login(loginData);

    // Se o login for bem-sucedido, o AuthContext já deve armazenar o token e o user
    if (result?.user?.role === 'adm' || result?.user?.role === 'vendas') {
      const backofficeUrlBase = import.meta.env.DEV ? 'http://localhost:5174/app/' : '/app';
      const redirectUrl = `${backofficeUrlBase}?token=${encodeURIComponent(result.token)}`;
      window.location.href = redirectUrl;
    } else {
      setTimeout(() => onClose(), 500);
      setIsLoading(false);
    }
  } catch (error) {
    console.error('Erro no login:', error);
    const errorMsg = error.response?.data?.msg || 'Erro no login. Verifique as suas credenciais.';
    setMessage({ text: errorMsg, type: 'error', target: 'login' });
    setFieldErrors({ loginEmail: ' ', loginPassword: ' ' });
    setIsLoading(false);
  }
};

   // --- REGISTER ---
    // 🔹 MODIFICADO para usar a função 'register' do AuthContext
    const handleRegister = async (e) => {
        e.preventDefault();
        setMessage({ text: '', type: '', target: null }); // Clear general message
        setFieldErrors({}); // Clear field errors
        setIsLoading(true);

        let errors = {};
        if (!registerUsername.trim()) errors.registerUsername = 'Nome é obrigatório.';
        if (!registerEmail.trim() || !/\S+@\S+\.\S+/.test(registerEmail)) errors.registerEmail = 'Email inválido.';
        if (!registerCpf.trim() /* || add CPF validation regex */) errors.registerCpf = 'CPF inválido.';
        if (!registerPassword) errors.registerPassword = 'Senha é obrigatória.';
        else if (registerPassword.length < 6) errors.registerPassword = 'Senha deve ter no mínimo 6 caracteres.';
        if (registerPassword !== registerConfirmPassword) {
            errors.registerConfirmPassword = 'As senhas não conferem.';
            // Optionally mark the first password field too if they mismatch
            if (!errors.registerPassword) errors.registerPassword = ' '; // Trigger error style
        }
        if (!registerTermsAccepted) errors.registerTermsAccepted = 'Você deve aceitar os termos.';

        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            setIsLoading(false);
            return;
        }

        try {
            // 🔹 Usa a função register do AuthContext
            const registerData = {
                email: registerEmail,
                nome: registerUsername, // 'nome' é usado no backend
                cpf: registerCpf,
                password: registerPassword,
                confirmpassword: registerConfirmPassword
            };

            // 🔹 A função register (do context) já cuida do login automático
            //    Ela chama /auth/register e armazena token e usuário
            await register(registerData);

            // 🔹 Se chegou aqui, o registro e o login funcionaram
            setMessage({ text: 'Cadastro e login realizados!', type: 'success', target: 'register' });
            
            setTimeout(() => {
                onClose(); // Fecha o modal
                setIsLoading(false);
            }, 1500); // Fecha após 1.5 seg

        } catch (error) {
            // A função register do context pode lançar um erro que pegamos aqui
            const errorMsg = error.response?.data?.msg || error.message || 'Erro ao cadastrar. Verifique os dados.';
            setMessage({ text: errorMsg, type: 'error', target: 'register' }); // Show general error
            
            // Highlight specific fields based on common API errors
            if (errorMsg.toLowerCase().includes('e-mail')) {
                setFieldErrors(prev => ({ ...prev, registerEmail: 'Email já em uso.' }));
            }
            if (errorMsg.toLowerCase().includes('cpf')) {
                setFieldErrors(prev => ({ ...prev, registerCpf: 'CPF já em uso.' }));
            }
             setIsLoading(false); // Stop loading on error
        }
    };

    if (!isOpen) return null;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={`${styles.modalContent} ${view === 'register' ? styles.showRegister : ''}`} onClick={(e) => e.stopPropagation()}>
                <button className={styles.closeButton} onClick={onClose} aria-label="Fechar"> <CloseIcon /> </button>
                <div className={styles.splitLayout}>

                    {/* --- COLUNA ESQUERDA (Cadastro / Boas-vindas) --- */}
                    <div className={styles.leftColumn}>
                        {view === 'welcome' && (
                            <div className={styles.welcomeContent}>
                                <h2 className={styles.columnTitle}>BEM-VINDO!</h2>
                                <p className={styles.welcomeText}>Cadastre-se e ganhe 10% off na primeira compra!</p>
                                <button
                                    onClick={() => { setView('register'); clearForms(); }}
                                    className={styles.primaryButton}
                                    disabled={isLoading}
                                >
                                    Criar conta
                                </button>
                                {/* Removed success message display from here */}
                            </div>
                        )}
                        {view === 'register' && (
                            <form onSubmit={handleRegister} noValidate>
                                <h2 className={styles.columnTitle}>CADASTRE-SE</h2>

                                {/* Input Nome */}
                                <div className={`${styles.inputGroup} ${fieldErrors.registerUsername ? styles.inputError : ''}`}>
                                    <span className={styles.icon}><UserIcon /></span>
                                    <input type="text" placeholder="NOME" value={registerUsername} onChange={(e) => {setRegisterUsername(e.target.value); setFieldErrors(p=>({...p, registerUsername:''}))}} required />
                                </div>
                                {fieldErrors.registerUsername && <p className={styles.errorMessageText}>{fieldErrors.registerUsername}</p>}

                                {/* Input Email */}
                                <div className={`${styles.inputGroup} ${fieldErrors.registerEmail ? styles.inputError : ''}`}>
                                    <span className={styles.icon}><EmailIcon /></span>
                                    <input type="email" placeholder="EMAIL" value={registerEmail} onChange={(e) => {setRegisterEmail(e.target.value); setFieldErrors(p=>({...p, registerEmail:''}))}} required />
                                </div>
                                {fieldErrors.registerEmail && <p className={styles.errorMessageText}>{fieldErrors.registerEmail}</p>}

                                {/* Input CPF */}
                                <div className={`${styles.inputGroup} ${fieldErrors.registerCpf ? styles.inputError : ''}`}>
                                    <span className={styles.icon}><CpfIcon /></span>
                                    <input type="text" placeholder="CPF" value={registerCpf} onChange={(e) => {setRegisterCpf(e.target.value); setFieldErrors(p=>({...p, registerCpf:''}))}} required />
                                </div>
                                {fieldErrors.registerCpf && <p className={styles.errorMessageText}>{fieldErrors.registerCpf}</p>}

                                {/* Input Senha */}
                                <div className={`${styles.inputGroup} ${fieldErrors.registerPassword ? styles.inputError : ''}`}>
                                    <span className={styles.icon}><LockIcon /></span>
                                    <input type="password" placeholder="SENHA (mín. 6 caracteres)" value={registerPassword} onChange={(e) => {setRegisterPassword(e.target.value); setFieldErrors(p=>({...p, registerPassword:''}))}} required />
                                </div>
                                {fieldErrors.registerPassword && <p className={styles.errorMessageText}>{fieldErrors.registerPassword}</p>}

                                {/* Input Confirmar Senha */}
                                <div className={`${styles.inputGroup} ${fieldErrors.registerConfirmPassword ? styles.inputError : ''}`}>
                                    <span className={styles.icon}><LockIcon /></span>
                                    <input type="password" placeholder="CONFIRMAR SENHA" value={registerConfirmPassword} onChange={(e) => {setRegisterConfirmPassword(e.target.value); setFieldErrors(p=>({...p, registerConfirmPassword:''}))}} required />
                                </div>
                                {fieldErrors.registerConfirmPassword && <p className={styles.errorMessageText}>{fieldErrors.registerConfirmPassword}</p>}

                                {/* Checkbox Termos */}
                                <div className={`${styles.termsGroup} ${fieldErrors.registerTermsAccepted ? styles.inputError : ''}`}>
                                    <input type="checkbox" id="termsReg" checked={registerTermsAccepted} onChange={(e) => {setRegisterTermsAccepted(e.target.checked); setFieldErrors(p=>({...p, registerTermsAccepted:''}))}} />
                                    <label htmlFor="termsReg">Li e aceito os <a href="/termos" target="_blank" className={styles.termsLink}>TERMOS</a></label>
                                </div>
                                {fieldErrors.registerTermsAccepted && <p className={styles.errorMessageText} style={{ marginTop: '-15px', marginBottom: '15px'}}>{fieldErrors.registerTermsAccepted}</p>}

                                {/* General Register Message */}
                                {message.target === 'register' && message.text && <p className={`${styles.message} ${message.type === 'error' ? styles.error : styles.success}`}>{message.text}</p>}

                                <button type="submit" className={styles.primaryButton} disabled={isLoading /* Keep terms check? || !registerTermsAccepted */} >
                                    {isLoading ? 'CADASTRANDO...' : 'CADASTRAR'}
                                </button>
                                <p className={styles.toggleText}>
                                    Já tem conta?
                                    <button type="button" onClick={() => { setView('welcome'); clearForms(); }} className={styles.toggleLink}>Fazer Login</button>
                                </p>
                            </form>
                        )}
                    </div>

                    {/* --- LINHA DIVISÓRIA --- */}
                    <div className={styles.divider}></div>

                    {/* --- COLUNA DIREITA (Login) --- */}
                    <div className={styles.rightColumn}>
                        <form onSubmit={handleLogin} noValidate>
                            <h2 className={styles.columnTitle}>FAÇA LOGIN</h2>

                            {/* Input Email Login */}
                            <div className={`${styles.inputGroup} ${fieldErrors.loginEmail ? styles.inputError : ''}`}>
                                <span className={styles.icon}><EmailIcon /></span>
                                <input type="email" placeholder="EMAIL" value={loginEmail} onChange={(e) => {setLoginEmail(e.target.value); setFieldErrors(p=>({...p, loginEmail:''}))}} required />
                            </div>
                            {fieldErrors.loginEmail && <p className={styles.errorMessageText}>{fieldErrors.loginEmail}</p>}

                            {/* Input Senha Login */}
                            <div className={`${styles.inputGroup} ${fieldErrors.loginPassword ? styles.inputError : ''}`}>
                                <span className={styles.icon}><LockIcon /></span>
                                <input type="password" placeholder="SENHA" value={loginPassword} onChange={(e) => {setLoginPassword(e.target.value); setFieldErrors(p=>({...p, loginPassword:''}))}} required />
                            </div>
                            {fieldErrors.loginPassword && <p className={styles.errorMessageText}>{fieldErrors.loginPassword}</p>}

                            {/* Remember Me */}
                            <div className={styles.rememberGroup}>
                                <input type="checkbox" id="remember" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                                <label htmlFor="remember">Lembrar senha?</label>
                            </div>

                            {/* General Login Message */}
                            {message.target === 'login' && message.text && <p className={`${styles.message} ${message.type === 'error' ? styles.error : styles.success}`}>{message.text}</p>}

                            <button type="submit" className={styles.primaryButton} disabled={isLoading}>
                                {isLoading ? 'ENTRANDO...' : 'Entrar'}
                            </button>

                            {/* REMOVED Redundant Create Account Link from here */}
                            {/*
                            {view === 'welcome' && (
                                <p className={styles.toggleText}>
                                    Não tem conta?
                                    <button type="button" onClick={() => { setView('register'); clearForms(); }} className={styles.toggleLink}>Criar conta</button>
                                </p>
                            )}
                             */}
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AuthModal;