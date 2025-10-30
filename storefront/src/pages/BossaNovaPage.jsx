import React from 'react';

// 1. Importa os componentes de Nav e Footer específicos
import BossaNovaNav from '../components/BossaNovaNav';
import BossaNovaFooter from '../components/BossaNovaFooter';

// 2. Importa o novo componente de Conteúdo
import CategoryPageContent from '../components/CategoryPageContent';

// 3. Importa o NOVO CSS apenas para pegar a classe de estilo
import pageStyles from '../assets/css/CategoryPages.module.css';

function BossaNovaPage() {
    
    return (
        <>
            <BossaNovaNav />
            
            <CategoryPageContent 
                categoryName="Bossa Nova"
                mainClassName={pageStyles.bossaNovaPage}
            />
            
            <BossaNovaFooter />
        </>
    );
}

export default BossaNovaPage;