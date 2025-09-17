document.addEventListener("DOMContentLoaded", () => {
    const API_EMAIL_URL = "/api/enviar-email";
    const token = localStorage.getItem('authToken');
    if (!token) return;

    const authHeaders = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

    const sendEmailIcon = document.getElementById("send-email-icon");
    const popupEnviarEmail = document.getElementById("popup-enviar-email");
    const formSendEmail = document.getElementById("form-send-email");
    const sendEmailMessage = document.getElementById("send-email-message");

    if (sendEmailIcon) {
        sendEmailIcon.addEventListener("click", () => {
            if (popupEnviarEmail) popupEnviarEmail.style.display = "flex";
        });
    }

    if (formSendEmail) {
        formSendEmail.addEventListener("submit", async (e) => {
            e.preventDefault();
            const formData = new FormData(formSendEmail);
            const emailData = Object.fromEntries(formData.entries());
            sendEmailMessage.textContent = "";

            try {
                const res = await fetch(API_EMAIL_URL, {
                    method: 'POST',
                    headers: authHeaders,
                    body: JSON.stringify(emailData)
                });

                const data = await res.json();
                if (!res.ok) throw new Error(data.msg || "Erro ao enviar e-mail.");

                sendEmailMessage.style.color = 'green';
                sendEmailMessage.textContent = "E-mail enviado com sucesso!";

                setTimeout(() => {
                    popupEnviarEmail.style.display = "none";
                    formSendEmail.reset();
                    sendEmailMessage.textContent = "";
                }, 2000);

            } catch (error) {
                sendEmailMessage.style.color = '#e74c3c';
                sendEmailMessage.textContent = error.message;
            }
        });
    }

    if (popupEnviarEmail) {
        popupEnviarEmail.addEventListener("click", (e) => {
            if (e.target === popupEnviarEmail) {
                popupEnviarEmail.style.display = "none";
            }
        });
    }
});