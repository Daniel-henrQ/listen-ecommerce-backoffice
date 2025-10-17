import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import Modal from '../components/Modal';
import ActionMenu from '../components/ActionMenu';

function ProductsView() {
    const [products, setProducts] = useState([]);
    const [fornecedores, setFornecedores] = useState([]); // Estado para armazenar fornecedores
    const [loading, setLoading] = useState(true);
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalVisible, setAddModalVisible] = useState(false);
    const [isEditModalVisible, setEditModalVisible] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [selectedProducts, setSelectedProducts] = useState(new Set());

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

    // Busca fornecedores ao montar o componente
    useEffect(() => {
        const fetchFornecedores = async () => {
            try {
                const response = await api.get('/fornecedores');
                setFornecedores(response.data);
            } catch (err) {
                console.error("Erro ao buscar fornecedores", err);
            }
        };
        fetchFornecedores();
        fetchProducts();
    }, [fetchProducts]);

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
                     {/* Categoria 'Pop' removida */}
                     {['all', 'Rock', 'Jazz & Blues', 'Bossa Nova'].map(cat => (
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
                            <th>Fornecedor</th>
                            <th>Categoria</th>
                            <th>Subgêneros</th>
                            <th>Quantidade</th>
                            <th>Preço</th>
                            <th>Data</th>
                            <th style={{textAlign: 'right'}}>Ação</th>
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
                                <td>{product.fornecedor?.nomeFantasia}</td>
                                <td>{product.categoria}</td>
                                <td>{product.subgeneros?.join(', ')}</td>
                                <td>{product.quantidade}</td>
                                <td>R$ {product.preco.toFixed(2)}</td>
                                <td>{new Date(product.createdAt).toLocaleDateString('pt-BR')}</td>
                                <td className="actions" style={{textAlign: 'right'}}>
                                    <ActionMenu 
                                        onEdit={() => openEditModal(product)}
                                        onDelete={() => handleDeleteProduct(product._id)}
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Modal isVisible={isAddModalVisible} onClose={() => setAddModalVisible(false)} title="Adicionar Novo Produto">
                <div className="popup-produto">
                    <form onSubmit={handleAddProduct} className="vertical-form">
                        <div className="form-grid">
                            <div>
                                <div className="input-group"><label>Nome do Produto</label><input type="text" name="nome" required /></div>
                                <div className="input-group"><label>Artista</label><input type="text" name="artista" required /></div>
                                <div className="input-group">
                                    <label>Fornecedor</label>
                                    <select name="fornecedor" required>
                                        <option value="">Selecione um fornecedor</option>
                                        {fornecedores.map(f => <option key={f._id} value={f._id}>{f.nomeFantasia}</option>)}
                                    </select>
                                </div>
                                <div className="input-group"><label>Categoria</label><input type="text" name="categoria" required /></div>
                            </div>
                            <div>
                                <div className="input-group"><label>Subgêneros (separados por vírgula)</label><input type="text" name="subgeneros" placeholder="Pop Rock, Metal, Emo" /></div>
                                <div className="input-group"><label>Quantidade</label><input type="number" name="quantidade" required min="0" /></div>
                                <div className="input-group"><label>Preço</label><input type="number" name="preco" required min="0" step="0.01" /></div>
                                <div className="input-group"><label>Capa do Álbum</label><input type="file" name="imagem" accept="image/*" required /></div>
                            </div>
                        </div>
                        <div className="popup-actions"><button type="submit" className="add-button">Salvar Produto</button></div>
                    </form>
                </div>
            </Modal>

            {editingProduct && (
                <Modal isVisible={isEditModalVisible} onClose={() => setEditModalVisible(false)} title="Editar Produto">
                    <div className="popup-produto">
                        <form onSubmit={handleEditProduct} className="vertical-form">
                            <div className="form-grid">
                                <div>
                                    <div className="input-group"><label>Nome</label><input type="text" name="nome" defaultValue={editingProduct.nome} required /></div>
                                    <div className="input-group"><label>Artista</label><input type="text" name="artista" defaultValue={editingProduct.artista} required /></div>
                                    <div className="input-group">
                                        <label>Fornecedor</label>
                                        <select name="fornecedor" required defaultValue={editingProduct.fornecedor?._id}>
                                            {fornecedores.map(f => <option key={f._id} value={f._id}>{f.nomeFantasia}</option>)}
                                        </select>
                                    </div>
                                    <div className="input-group"><label>Categoria</label><input type="text" name="categoria" defaultValue={editingProduct.categoria} required /></div>
                                </div>
                                <div>
                                    <div className="input-group"><label>Subgêneros (separados por vírgula)</label><input type="text" name="subgeneros" defaultValue={editingProduct.subgeneros?.join(', ')} /></div>
                                    <div className="input-group"><label>Quantidade</label><input type="number" name="quantidade" defaultValue={editingProduct.quantidade} required min="0" /></div>
                                    <div className="input-group"><label>Preço</label><input type="number" name="preco" defaultValue={editingProduct.preco} required min="0" step="0.01" /></div>
                                    <div className="input-group"><label>Nova Capa (Opcional)</label><input type="file" name="imagem" accept="image/*" /></div>
                                </div>
                            </div>
                            <div className="popup-actions"><button type="submit" className="add-button">Salvar Alterações</button></div>
                        </form>
                    </div>
                </Modal>
            )}
        </div>
    );
}

export default ProductsView;