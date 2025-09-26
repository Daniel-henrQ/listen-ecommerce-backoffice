import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import logo from '../assets/images/listen.svg';

function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');

        try {
            const response = await axios.post('/api/auth/login', { email, password });
            setMessage('Login realizado com sucesso! Redirecionando...');
            localStorage.setItem('authToken', response.data.token);

            setTimeout(() => {
                navigate('/app');
            }, 1500);

        } catch (error) {
            setMessage(error.response?.data?.msg || 'Erro ao tentar fazer login.');
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
                        <svg width="20" height="20" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                        <span>|</span>
                        <input type="email" placeholder="EMAIL" required value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>
                    <div className="input-group">
                        <svg width="20" height="20" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                        <span>|</span>
                        <input type="password" placeholder="SENHA" required value={password} onChange={(e) => setPassword(e.target.value)} />
                    </div>
                    {message && <div id="login-message">{message}</div>}
                    <button type="submit">LOGIN</button>
                </form>
            </div>
        </div>
    );
}

export default LoginPage;