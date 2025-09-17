document.addEventListener('DOMContentLoaded', () => {
    const backendUrl = 'http://localhost:3000';

    const loginForm = document.getElementById('login-form-submit');
    const loginMessage = document.getElementById('login-message');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        loginMessage.textContent = '';

        try {
            const response = await fetch(`${backendUrl}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.msg || 'Erro ao tentar fazer login.');
            }

            loginMessage.style.color = 'green';
            loginMessage.textContent = 'Login realizado com sucesso! Redirecionando...';
            localStorage.setItem('authToken', data.token);

            setTimeout(() => {
                window.location.href = `${backendUrl}/app`;
            }, 1500);

        } catch (error) {
            loginMessage.style.color = '#e74c3c';
            loginMessage.textContent = error.message;
        }
    });
});