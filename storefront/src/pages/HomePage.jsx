// storefront/src/pages/HomePage.jsx
import React, { useEffect } from 'react'; // Reduzido imports
import '../assets/css/HomePage.css'; 

// Importa os novos componentes
import HomeNav from '../components/HomeNav.jsx';
import HomeFooter from '../components/HomeFooter.jsx';

function HomePage({ onOpenSidebar }) {

    // Este hook gerencia a cor de fundo global
    useEffect(() => {
        // Adiciona a classe 'bg-light' ao body quando a HomePage carregar
        document.body.classList.add('bg-light');

        // Função de "limpeza": remove a classe quando a HomePage for "desmontada"
        return () => {
            document.body.classList.remove('bg-light');
        };
    }, []); // O array vazio [] garante que isso rode apenas na montagem e desmontagem

    // Toda a lógica da Nav e do Footer foi movida

    return (
        <>
            <header className="hero-section"> 
                 <div className="video-background"> 
                    <video src="/Minimalist_Vinyl_Record_Video_Generation.mp4" autoPlay muted loop playsInline></video>
                    <div className="video-overlay"></div> 
                 </div>

                {/* --- COMPONENTE DE NAV SUBSTITUÍDO --- */}
                <HomeNav onOpenSidebar={onOpenSidebar} />
            </header>

              <main>
                  <section className="about-us"> 
                      <h2>A listen.</h2>
                        <p>Ouvir um vinil é um ritual. É tirar o disco da capa com cuidado, colocar na vitrola, ouvir os estalos antes da primeira nota. É presença. É tempo. É arte que gira. A listen. nasceu desse sentimento.</p>
                        <p>Não somos apenas uma loja. Somos um lugar que entende que a música tem textura, tem cheiro, tem peso. Que o design pode mudar de forma conforme o som muda de tom. Que o rock pede contraste, o jazz pede elegância, e a bossa nova dança em sutileza. Aqui, cada gênero tem espaço para ser o que é, sem se encaixar em moldes. Do clean ao punk, sem esforço.</p>
                        <p>Criamos a listen. porque acreditamos que estética importa. Mas sentimento importa mais. Se você coleciona discos porque cada um carrega uma história, está no lugar certo. Se você enxerga beleza no que é imperfeito, analógico, real seja bem-vindo. A gente compartilha do mesmo som.</p>
                  </section>
              </main>
              
              {/* --- COMPONENTE DE FOOTER SUBSTITUÍDO --- */}
              <HomeFooter />

            {/* Os Modais agora são renderizados dentro de HomeNav.jsx */}
        </>
    );
}
export default HomePage;