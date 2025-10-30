import React from 'react';
import { Link } from 'react-router-dom';
import styles from '../assets/css/CategoryFooters.module.css'; // <-- NOSSO NOVO CSS

const logoWhitePath = '/listen-white.svg';

function RockFooter() {
    return (
        <footer className={`${styles.footerBase} ${styles.rockFooter}`}>
            <div className={styles.footerContainer}>
                {/* Coluna 1 */}
                <div className={styles.footerColumn}>
                    <h3>Junte-se a nós</h3>
                    <p>Cadastre seu e-mail e receba 10% de desconto na primeira compra</p>
                    <form className={styles.newsletterForm}>
                        <input type="text" placeholder="Nome" required />
                        <input type="email" placeholder="E-mail" required />
                    </form>
                </div>
                {/* Coluna 2 */}
                <div className={styles.footerColumn}>
                    <h3>Categorias</h3>
                    <ul>
                        <li><Link to="/rock">Rock</Link></li>
                        <li><Link to="/bossa-nova">Bossa nova</Link></li>
                        <li><Link to="/jazz-blues">Jazz e Blues</Link></li>
                    </ul>
                </div>
                {/* Coluna 3 */}
                <div className={styles.footerColumn}>
                    <h3>Contato</h3>
                    <p>(19) 3590-000</p>
                    <p>E-mail: faleconosco@listen.com.br</p>
                </div>
                {/* Coluna 4 */}
                <div className={`${styles.footerColumn} ${styles.footerLogoColumn}`}>
                    <Link to="/">
                        <img src={logoWhitePath} alt="Listen." className={styles.footerLogo} />
                    </Link>
                </div>
            </div>
        </footer>
    );
}

export default RockFooter;