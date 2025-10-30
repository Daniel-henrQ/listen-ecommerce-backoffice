import React from 'react';

// 1. Importa os componentes de Nav e Footer específicos
import RockNav from '../components/RockNav';
import RockFooter from '../components/RockFooter';

// 2. Importa o novo componente de Conteúdo
import CategoryPageContent from '../components/CategoryPageContent';

// 3. Importa o NOVO CSS apenas para pegar a classe de estilo
import pageStyles from '../assets/css/CategoryPages.module.css';

function RockPage() {
    
    // A lógica de Nav (auth, sidebar) está no <RockNav />
    // A lógica de Produtos (fetch, carousel) está no <CategoryPageContent />

    return (
        <>
            <RockNav />
            
            <CategoryPageContent 
                categoryName="Rock"
                mainClassName={pageStyles.rockPage} 
            />
            
            <RockFooter />
        </>
    );
}

export default RockPage;