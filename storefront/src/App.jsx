import { useState } from 'react';
// Remove imports não usados (reactLogo, viteLogo) se não precisar deles
import './App.css';
import HomePage from './pages/HomePage'; // Importa a nova página
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'; // Importa o Router

function App() {
  // Pode remover o 'count' se não for usar
  // const [count, setCount] = useState(0)

  return (
    <Router>
      <Routes>
        {/* Rota para a página inicial */}
        <Route path="/" element={<HomePage />} />

        {/* Adicione outras rotas aqui se necessário */}
        {/* Exemplo: <Route path="/produtos" element={<ProductsPage />} /> */}

      </Routes>
    </Router>
  )
}

export default App;