import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import logo from '../assets/images/listen.svg';

function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    // Usar estado para tipo de mensagem (error/success)
    const [message, setMessage] = useState({ text: '', type: '' });
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage({ text: '', type: '' }); // Limpa mensagem anterior

        // Validação básica frontend
        if (!email || !password) {
            setMessage({ text: 'Email e senha são obrigatórios.', type: 'error' });
            return;
        }

        try {
            const response = await axios.post('/api/auth/login', { email, password });
            setMessage({ text: 'Login realizado com sucesso! Redirecionando...', type: 'success' }); // Define como sucesso
            localStorage.setItem('authToken', response.data.token);

            setTimeout(() => {
                navigate('/app');
            }, 1500);

        } catch (error) {
            // Define como erro
            setMessage({ text: error.response?.data?.msg || 'Erro ao tentar fazer login.', type: 'error' });
        }
    };

    return (
        <div className="form-container">
            <div className="form-box" id="login-form">
                <div className="logo">
                    <img src={logo} alt="Logo Listen" />
                </div>
                <h2>Login</h2>
                <form id="login-form-submit" onSubmit={handleSubmit}>
                    <div className="input-group">
                        {/* Ícones mantidos como no HTML original */}
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                        <span>|</span>
                        <input
                            type="email"
                            placeholder="EMAIL"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                             // Adicionar classe de erro se a mensagem for de erro (após tentativa falha)
                             className={message.type === 'error' ? 'input-error' : ''}
                         />
                    </div>
                    <div className="input-group">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                        <span>|</span>
                        <input
                            type="password"
                            placeholder="SENHA"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            // Adicionar classe de erro se a mensagem for de erro
                            className={message.type === 'error' ? 'input-error' : ''}
                        />
                    </div>
                    {/* Usar a classe correta baseada no tipo da mensagem */}
                    {message.text && (
                        <div id="login-message" className={`form-message ${message.type}`}>
                            {message.text}
                        </div>
                    )}
                    <button type="submit">LOGIN</button>
                </form>
            </div>
        </div>
    );
}

export default LoginPage;