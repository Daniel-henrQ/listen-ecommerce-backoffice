import React from 'react';

// 1. Importa os componentes de Nav e Footer específicos
import JazzBluesNav from '../components/JazzBluesNav';
import JazzBluesFooter from '../components/JazzBluesFooter';

// 2. Importa o novo componente de Conteúdo
import CategoryPageContent from '../components/CategoryPageContent';

// 3. Importa o NOVO CSS apenas para pegar a classe de estilo
import pageStyles from '../assets/css/CategoryPages.module.css';

function JazzBluesPage() {
    
    return (
        <>
            <JazzBluesNav />
            
            <CategoryPageContent 
                categoryName="Jazz & Blues"
                mainClassName={pageStyles.jazzPage}
            />
            
            <JazzBluesFooter />
        </>
    );
}

export default JazzBluesPage;