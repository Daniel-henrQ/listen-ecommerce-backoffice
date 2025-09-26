import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import Modal from '../components/Modal';

function ProductsView() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalVisible, setAddModalVisible] = useState(false);
    const [isEditModalVisible, setEditModalVisible] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [selectedProducts, setSelectedProducts] = useState(new Set());
    const [activeActionMenu, setActiveActionMenu] = useState(null);

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (categoryFilter !== 'all') params.append('categoria', categoryFilter);
            if (searchTerm) params.append('nome', searchTerm);
            const response = await api.get(`/produtos?${params.toString()}`);
            setProducts(response.data);
        } catch (err) { console.error(err); } 
        finally { setLoading(false); }
    }, [categoryFilter, searchTerm]);

    useEffect(() => { fetchProducts(); }, [fetchProducts]);

    const handleAddProduct = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        try {
            await api.post('/produtos', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            setAddModalVisible(false);
            fetchProducts();
        } catch (err) { alert("Erro ao adicionar produto."); }
    };

    const handleEditProduct = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        try {
            await api.put(`/produtos/${editingProduct._id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            setEditModalVisible(false);
            fetchProducts();
        } catch (err) { alert("Erro ao editar produto."); }
    };

    const handleDeleteProduct = async (productId) => {
        if (window.confirm("Tem a certeza?")) {
            try {
                await api.delete(`/produtos/${productId}`);
                fetchProducts();
            } catch (err) { alert("Falha ao apagar."); }
        }
    };

    const handleDeleteSelected = async () => {
        const ids = Array.from(selectedProducts);
        if (ids.length > 0 && window.confirm(`Excluir ${ids.length} produtos?`)) {
            try {
                await api.delete('/produtos/varios', { data: { ids } });
                fetchProducts();
                setSelectedProducts(new Set());
            } catch (err) { alert("Falha ao apagar selecionados."); }
        }
    };

    const openEditModal = (product) => {
        setEditingProduct(product);
        setEditModalVisible(true);
    };

    const handleSelectProduct = (productId, isChecked) => {
        const newSelection = new Set(selectedProducts);
        if (isChecked) newSelection.add(productId);
        else newSelection.delete(productId);
        setSelectedProducts(newSelection);
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) setSelectedProducts(new Set(products.map(p => p._id)));
        else setSelectedProducts(new Set());
    };
    
    if (loading) return <p>A carregar...</p>;

    return (
        <div>
            <div className="view-header">
                <h2>Produtos</h2>
                {selectedProducts.size > 0 && (
                    <button id="btn-excluir-selecionados" onClick={handleDeleteSelected} className="delete-button">
                        Excluir Selecionados
                    </button>
                )}
            </div>
            <div className="action-bar">
                <div className="filter-tabs">
                     {['all', 'Pop', 'Rock', 'Jazz & Blues', 'Bossa Nova'].map(cat => (
                         <a href="#" key={cat} 
                            className={`filter-tab ${categoryFilter === cat ? 'active' : ''}`}
                            onClick={(e) => { e.preventDefault(); setCategoryFilter(cat); }}>
                            {cat === 'all' ? 'Todos' : cat}
                         </a>
                    ))}
                </div>
                <div className="search-add">
                    <div className="search-box">
                         <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                    <button onClick={() => setAddModalVisible(true)} className="add-button">+ ADD Novo Produto</button>
                </div>
            </div>
            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th><input type="checkbox" onChange={handleSelectAll} /></th>
                            <th>Produto</th>
                            <th>Artista</th>
                            <th>Categoria</th>
                            <th>Quantidade</th>
                            <th>Preço</th>
                            <th>Data</th>
                            <th>Ação</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map(product => (
                            <tr key={product._id}>
                                <td><input type="checkbox" checked={selectedProducts.has(product._id)} onChange={(e) => handleSelectProduct(product._id, e.target.checked)} /></td>
                                <td>
                                    <img src={`/uploads/${product.imagem}`} alt={product.nome} className="product-cover" />
                                    <span>{product.nome}</span>
                                </td>
                                <td>{product.artista}</td>
                                <td>{product.categoria}</td>
                                <td>{product.quantidade}</td>
                                <td>R$ {product.preco.toFixed(2)}</td>
                                <td>{new Date(product.createdAt).toLocaleDateString('pt-BR')}</td>
                                <td className="actions">
                                    <button className="action-button" onClick={() => setActiveActionMenu(activeActionMenu === product._id ? null : product._id)}>...</button>
                                    <ul className={`action-menu ${activeActionMenu === product._id ? 'show' : ''}`}>
                                        <li onClick={() => {openEditModal(product); setActiveActionMenu(null);}}>Editar</li>
                                        <li className="delete" onClick={() => {handleDeleteProduct(product._id); setActiveActionMenu(null);}}>Excluir</li>
                                    </ul>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Modal isVisible={isAddModalVisible} onClose={() => setAddModalVisible(false)}>
                <h3>Adicionar Novo Produto</h3>
                <form onSubmit={handleAddProduct} className="vertical-form">
                    <div className="input-group"><label>Nome do Produto</label><input type="text" name="nome" required /></div>
                    <div className="input-group"><label>Artista</label><input type="text" name="artista" required /></div>
                    <div className="input-group"><label>Categoria</label><input type="text" name="categoria" required /></div>
                    <div className="input-group"><label>Quantidade</label><input type="number" name="quantidade" required min="0" /></div>
                    <div className="input-group"><label>Preço</label><input type="number" name="preco" required min="0" step="0.01" /></div>
                    <div className="input-group"><label>Capa do Álbum</label><input type="file" name="imagem" accept="image/*" required /></div>
                    <div className="popup-actions"><button type="submit" className="add-button">Salvar Produto</button></div>
                </form>
            </Modal>

            {editingProduct && (
                <Modal isVisible={isEditModalVisible} onClose={() => setEditModalVisible(false)}>
                    <h3>Editar Produto</h3>
                    <form onSubmit={handleEditProduct} className="vertical-form">
                        <div className="input-group"><label>Nome</label><input type="text" name="nome" defaultValue={editingProduct.nome} required /></div>
                        <div className="input-group"><label>Artista</label><input type="text" name="artista" defaultValue={editingProduct.artista} required /></div>
                        <div className="input-group"><label>Categoria</label><input type="text" name="categoria" defaultValue={editingProduct.categoria} required /></div>
                        <div className="input-group"><label>Quantidade</label><input type="number" name="quantidade" defaultValue={editingProduct.quantidade} required min="0" /></div>
                        <div className="input-group"><label>Preço</label><input type="number" name="preco" defaultValue={editingProduct.preco} required min="0" step="0.01" /></div>
                        <div className="input-group"><label>Nova Capa (Opcional)</label><input type="file" name="imagem" accept="image/*" /></div>
                        <div className="popup-actions"><button type="submit" className="add-button">Salvar Alterações</button></div>
                    </form>
                </Modal>
            )}
        </div>
    );
}

export default ProductsView;