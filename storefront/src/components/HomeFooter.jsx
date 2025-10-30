// storefront/src/components/HomeFooter.jsx
import React from 'react';
import { Link } from 'react-router-dom';

// Importa o mesmo CSS da Home, pois os estilos do Footer estão lá
import '../assets/css/HomePage.css';

function HomeFooter() {
    return (
        <footer> 
            <div className="footer-container"> 
                <div className="footer-column"> 
                    <h3>Junte-se a nós</h3>
                    <p>Cadastre seu e-mail e receba 50% de desconto na primeira compra</p>
                    <form className="newsletter-form"> 
                        <input type="text" placeholder="Nome" required/>
                        <input type="email" placeholder="E-mail" required/>
                         
                    </form>
                </div>
                <div className="footer-column"> 
                    <h3>Categorias</h3>
                    <ul>
                      <li><Link to="/rock">Rock</Link></li>
                       <li><Link to="/bossa-nova">Bossa nova</Link></li> 
                       <li><Link to="/jazz-blues">Jazz e Blues</Link></li>
                        <li><Link to="/pop">Pop</Link></li>
                    </ul>
                </div>
                <div className="footer-column"> 
                    <h3>Contato</h3>
                    <p>(19) 3590-000</p>
                    <p>E-mail: faleconosco@listen.com.br</p>
                </div>
            </div>
        </footer>
    );
}

export default HomeFooter;