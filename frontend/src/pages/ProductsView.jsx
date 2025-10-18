import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import Modal from '../components/Modal';
import ActionMenu from '../components/ActionMenu';

// --- Componente ProductForm (NOVO para reutilização) ---
const ProductForm = ({ product, fornecedores, onSubmit, onCancel }) => {
    // State para erros e mensagens do formulário específico
    const [fieldErrors, setFieldErrors] = useState({});
    const [formMessage, setFormMessage] = useState({ text: '', type: '' });
    // State para preview da imagem (opcional, mas melhora UX)
    const [imagePreview, setImagePreview] = useState(product?.imagem ? `/uploads/${product.imagem}` : null);

    const clearFormState = () => {
        setFieldErrors({});
        setFormMessage({ text: '', type: '' });
        setImagePreview(product?.imagem ? `/uploads/${product.imagem}` : null); // Reset preview on open/clear
    };

    // Limpar erros quando 'product' mudar (ao abrir modal)
    useEffect(() => {
        clearFormState();
    }, [product]);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        } else {
            // Se o usuário cancelar a seleção, reverter para a imagem original (se editando) ou limpar
            setImagePreview(product?.imagem ? `/uploads/${product.imagem}` : null);
        }
    };

    const handleInternalSubmit = async (e) => {
        e.preventDefault();
        clearFormState();
        const formData = new FormData(e.target);
        const dataEntries = Object.fromEntries(formData.entries()); // Para validação

        let errors = {};
        if (!dataEntries.nome?.trim()) errors.nome = "Nome é obrigatório.";
        if (!dataEntries.artista?.trim()) errors.artista = "Artista é obrigatório.";
        if (!dataEntries.fornecedor) errors.fornecedor = "Fornecedor é obrigatório.";
        if (!dataEntries.categoria?.trim()) errors.categoria = "Categoria é obrigatória.";
        if (dataEntries.quantidade === null || dataEntries.quantidade === '' || Number(dataEntries.quantidade) < 0) errors.quantidade = "Quantidade inválida.";
        if (dataEntries.preco === null || dataEntries.preco === '' || Number(dataEntries.preco) < 0) errors.preco = "Preço inválido.";
        // Validação de imagem: obrigatória na criação, opcional na edição
        if (!product && !dataEntries.imagem?.name) errors.imagem = "Imagem é obrigatória.";


        setFieldErrors(errors);

        if (Object.keys(errors).length > 0) {
            setFormMessage({ text: 'Por favor, corrija os erros no formulário.', type: 'error' });
            return;
        }

        // Se não houver arquivo selecionado na edição, removemos o campo 'imagem' do formData
        // para que o backend não tente processá-lo e não apague a imagem existente.
        if (product && !formData.get('imagem')?.name) {
             formData.delete('imagem');
        }


        try {
            await onSubmit(formData, product?._id); // Chama a função do pai com formData e ID
             setFormMessage({ text: product ? 'Produto atualizado com sucesso!' : 'Produto adicionado com sucesso!', type: 'success' });
             // Lógica de fechar modal fica no pai
        } catch (err) {
            const apiErrorMessage = err.response?.data?.msg || err.message || `Erro ao salvar produto.`;
             setFormMessage({ text: apiErrorMessage, type: 'error' });
             // Mapeamento simples (pode ser mais complexo se a API retornar erros específicos)
             if (apiErrorMessage.includes('obrigatórios')) { // Exemplo genérico
                // Poderia tentar marcar todos os campos required, mas é impreciso
             }
             if (apiErrorMessage.includes('arquivo inválido')) {
                 setFieldErrors(prev => ({ ...prev, imagem: 'Tipo de imagem inválido.' }));
             }
        }
    };

    return (
        <form onSubmit={handleInternalSubmit} className="vertical-form">
            <div className="form-grid">
                {/* Coluna 1 */}
                <div>
                    <div className="input-group">
                        <label htmlFor={`nome-${product?._id || 'add'}`} className="required">Nome do Produto</label>
                        <input id={`nome-${product?._id || 'add'}`} type="text" name="nome" defaultValue={product?.nome} className={fieldErrors.nome ? 'input-error' : ''} required />
                        {fieldErrors.nome && <span className="error-message-text">{fieldErrors.nome}</span>}
                    </div>
                    <div className="input-group">
                        <label htmlFor={`artista-${product?._id || 'add'}`} className="required">Artista</label>
                        <input id={`artista-${product?._id || 'add'}`} type="text" name="artista" defaultValue={product?.artista} className={fieldErrors.artista ? 'input-error' : ''} required />
                        {fieldErrors.artista && <span className="error-message-text">{fieldErrors.artista}</span>}
                    </div>
                    <div className="input-group">
                        <label htmlFor={`fornecedor-${product?._id || 'add'}`} className="required">Fornecedor</label>
                        <select id={`fornecedor-${product?._id || 'add'}`} name="fornecedor" defaultValue={product?.fornecedor?._id || product?.fornecedor} className={fieldErrors.fornecedor ? 'input-error' : ''} required>
                            <option value="">Selecione um fornecedor</option>
                            {/* Garante que fornecedores é um array antes de mapear */}
                            {Array.isArray(fornecedores) && fornecedores.map(f => <option key={f._id} value={f._id}>{f.nomeFantasia}</option>)}
                        </select>
                        {fieldErrors.fornecedor && <span className="error-message-text">{fieldErrors.fornecedor}</span>}
                    </div>
                    <div className="input-group">
                        <label htmlFor={`categoria-${product?._id || 'add'}`} className="required">Categoria</label>
                        <input id={`categoria-${product?._id || 'add'}`} type="text" name="categoria" defaultValue={product?.categoria} className={fieldErrors.categoria ? 'input-error' : ''} required />
                        {fieldErrors.categoria && <span className="error-message-text">{fieldErrors.categoria}</span>}
                    </div>
                </div>
                {/* Coluna 2 */}
                <div>
                     <div className="input-group">
                        <label htmlFor={`subgeneros-${product?._id || 'add'}`}>Subgêneros (separados por vírgula)</label>
                        <input id={`subgeneros-${product?._id || 'add'}`} type="text" name="subgeneros" defaultValue={product?.subgeneros?.join(', ')} placeholder="Ex: Pop Rock, Metal, Emo" />
                    </div>
                    <div className="input-group">
                        <label htmlFor={`quantidade-${product?._id || 'add'}`} className="required">Quantidade</label>
                        <input id={`quantidade-${product?._id || 'add'}`} type="number" name="quantidade" defaultValue={product?.quantidade} className={fieldErrors.quantidade ? 'input-error' : ''} required min="0" />
                        {fieldErrors.quantidade && <span className="error-message-text">{fieldErrors.quantidade}</span>}
                    </div>
                    <div className="input-group">
                        <label htmlFor={`preco-${product?._id || 'add'}`} className="required">Preço (R$)</label>
                        <input id={`preco-${product?._id || 'add'}`} type="number" name="preco" defaultValue={product?.preco} className={fieldErrors.preco ? 'input-error' : ''} required min="0" step="0.01" />
                        {fieldErrors.preco && <span className="error-message-text">{fieldErrors.preco}</span>}
                    </div>
                    <div className="input-group">
                        <label htmlFor={`imagem-${product?._id || 'add'}`} className={!product ? "required" : ""}>
                            {product ? 'Nova Capa (Opcional)' : 'Capa do Álbum'}
                        </label>
                        <input id={`imagem-${product?._id || 'add'}`} type="file" name="imagem" accept="image/*" onChange={handleImageChange} className={fieldErrors.imagem ? 'input-error' : ''} required={!product} />
                        {fieldErrors.imagem && <span className="error-message-text">{fieldErrors.imagem}</span>}
                         {/* Preview da Imagem */}
                         {imagePreview && (
                            <img src={imagePreview} alt="Preview" style={{ maxWidth: '100px', maxHeight: '100px', marginTop: '10px', display: 'block' }} />
                         )}
                    </div>
                </div>
            </div>
             {/* Mensagem Geral */}
             {formMessage.text && <p className={`form-message ${formMessage.type}`}>{formMessage.text}</p>}
             {/* Ações */}
            <div className="popup-actions">
                 <button type="button" onClick={onCancel} className="delete-btn">Cancelar</button>
                 <button type="submit" className="add-button">{product ? 'Salvar Alterações' : 'Salvar Produto'}</button>
             </div>
        </form>
    );
};


// --- Componente Principal ProductsView ---
function ProductsView() {
    const [products, setProducts] = useState([]);
    const [fornecedores, setFornecedores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalVisible, setAddModalVisible] = useState(false);
    const [isEditModalVisible, setEditModalVisible] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [selectedProducts, setSelectedProducts] = useState(new Set());
    const [viewMessage, setViewMessage] = useState(''); // Mensagem geral da view

    // Popup de visualização de imagem
    const [isImagePopupVisible, setImagePopupVisible] = useState(false);
    const [imagePopupUrl, setImagePopupUrl] = useState('');


    const fetchProducts = useCallback(async () => {
        setLoading(true);
        setViewMessage('');
        try {
            const params = new URLSearchParams();
            if (categoryFilter !== 'all') params.append('categoria', categoryFilter);
            if (searchTerm) params.append('nome', searchTerm);
            const response = await api.get(`/produtos?${params.toString()}`);
            setProducts(response.data);
        } catch (err) {
             console.error("Erro ao buscar produtos:", err);
             setViewMessage('Erro ao carregar produtos.');
        } finally {
            setLoading(false);
        }
    }, [categoryFilter, searchTerm]);

    // Busca fornecedores e produtos ao montar
    useEffect(() => {
        const fetchInitialData = async () => {
             setLoading(true);
             setViewMessage('');
            try {
                // Busca fornecedores primeiro, pois são necessários no formulário
                const fornecedoresRes = await api.get('/fornecedores');
                setFornecedores(fornecedoresRes.data);
                 // Depois busca produtos (já com fornecedores disponíveis)
                 await fetchProducts();
            } catch (err) {
                console.error("Erro ao buscar dados iniciais (fornecedores/produtos):", err);
                 setViewMessage('Erro ao carregar dados iniciais.');
                 setLoading(false); // Garante que o loading termine mesmo com erro
            }
            // setLoading(false) é chamado dentro de fetchProducts
        };
        fetchInitialData();
    }, [fetchProducts]); // Dependência em fetchProducts

     // Função onSubmit para passar ao ProductForm
     const handleFormSubmit = async (formData, id) => {
         // A lógica de try/catch é feita dentro do ProductForm
         if (id) {
             // Edição
             await api.put(`/produtos/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
             setTimeout(() => setEditModalVisible(false), 1500); // Fecha modal
         } else {
             // Adição
             await api.post('/produtos', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
             setTimeout(() => setAddModalVisible(false), 1500); // Fecha modal
         }
         fetchProducts(); // Recarrega a lista
     };

    // Funções handleDeleteProduct e handleDeleteSelected permanecem as mesmas
     const handleDeleteProduct = async (productId) => {
        if (window.confirm("Tem a certeza que deseja excluir este produto?")) {
            try {
                await api.delete(`/produtos/${productId}`);
                fetchProducts();
                 setSelectedProducts(prev => { // Remove da seleção se estiver selecionado
                     const newSelection = new Set(prev);
                     newSelection.delete(productId);
                     return newSelection;
                 });
            } catch (err) { alert("Falha ao apagar."); }
        }
    };

    const handleDeleteSelected = async () => {
        const ids = Array.from(selectedProducts);
        if (ids.length > 0 && window.confirm(`Excluir ${ids.length} produto(s) selecionado(s)?`)) {
            try {
                await api.delete('/produtos/varios', { data: { ids } }); // Envia IDs no corpo da requisição DELETE
                fetchProducts();
                setSelectedProducts(new Set()); // Limpa seleção
            } catch (err) {
                 console.error("Erro ao excluir selecionados:", err.response || err);
                 alert(err.response?.data?.error || "Falha ao apagar produtos selecionados.");
            }
        }
    };


    const openEditModal = (product) => {
        setEditingProduct(product);
        setEditModalVisible(true);
    };

     const openAddModal = () => {
         setEditingProduct(null); // Garante que não está editando
         setAddModalVisible(true);
     };

     // Funções de seleção permanecem iguais
     const handleSelectProduct = (productId, isChecked) => {
        const newSelection = new Set(selectedProducts);
        if (isChecked) newSelection.add(productId);
        else newSelection.delete(productId);
        setSelectedProducts(newSelection);
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedProducts(new Set(products.map(p => p._id)));
        } else {
            setSelectedProducts(new Set());
        }
    };

     // Funções para popup de imagem
     const openImagePopup = (imageUrl) => {
         setImagePopupUrl(imageUrl);
         setImagePopupVisible(true);
     };
     const closeImagePopup = () => {
         setImagePopupVisible(false);
         setImagePopupUrl('');
     };

    // Determina se a checkbox "Selecionar Todos" deve estar marcada
     const isAllSelected = products.length > 0 && selectedProducts.size === products.length;


    if (loading && products.length === 0) return <p>A carregar...</p>;

    return (
        <div>
            <div className="view-header">
                <h2>Produtos</h2>
                {/* Botão Excluir Selecionados aparece se houver seleção */}
                {selectedProducts.size > 0 && (
                    <button id="btn-excluir-selecionados" onClick={handleDeleteSelected} className="delete-button">
                        Excluir Selecionado(s) ({selectedProducts.size})
                    </button>
                )}
            </div>
            <div className="action-bar">
                <div className="filter-tabs">
                     {/* Categorias - mantido */}
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
                         <input type="text" placeholder="Buscar por nome..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                    <button onClick={openAddModal} className="add-button">+ ADD Novo Produto</button>
                </div>
            </div>

            {viewMessage && <p style={{ color: 'red', textAlign: 'center' }}>{viewMessage}</p>}
            {loading && <p style={{ textAlign: 'center' }}>Atualizando...</p>}

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            {/* Checkbox Selecionar Todos */}
                            <th><input type="checkbox" onChange={handleSelectAll} checked={isAllSelected} title="Selecionar Todos" /></th>
                            <th>Produto</th>
                            <th>Artista</th>
                            <th>Fornecedor</th>
                            <th>Categoria</th>
                            <th>Subgêneros</th>
                            <th>Qtd.</th>
                            <th>Preço</th>
                            <th>Data Cadastro</th>
                            <th style={{textAlign: 'right'}}>Ação</th>
                        </tr>
                    </thead>
                    <tbody>
                         {products.length === 0 && !loading ? (
                             <tr><td colSpan="10" style={{ textAlign: 'center' }}>Nenhum produto encontrado.</td></tr>
                         ) : (
                            products.map(product => (
                                <tr key={product._id}>
                                    <td><input type="checkbox" className="produto-checkbox" checked={selectedProducts.has(product._id)} onChange={(e) => handleSelectProduct(product._id, e.target.checked)} /></td>
                                    <td>
                                        {/* Tornar imagem clicável */}
                                        <img
                                            src={`/uploads/${product.imagem}`}
                                            alt={product.nome}
                                            className="product-cover"
                                            onClick={() => openImagePopup(`/uploads/${product.imagem}`)}
                                            onError={(e) => { e.target.style.display='none'; /* Opcional: esconder imagem quebrada */ }} // Fallback simples
                                        />
                                        <span>{product.nome}</span>
                                    </td>
                                    <td>{product.artista}</td>
                                    {/* Exibe nome fantasia, ou 'N/A' se fornecedor não populado */}
                                    <td>{product.fornecedor?.nomeFantasia || 'N/A'}</td>
                                    <td>{product.categoria}</td>
                                    <td>{product.subgeneros?.join(', ') || '-'}</td>
                                    <td>{product.quantidade}</td>
                                    <td>R$ {product.preco?.toFixed(2) || '0.00'}</td>
                                    <td>{new Date(product.createdAt).toLocaleDateString('pt-BR')}</td>
                                    <td className="actions">
                                        <ActionMenu
                                            onEdit={() => openEditModal(product)}
                                            onDelete={() => handleDeleteProduct(product._id)}
                                        />
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal Adicionar */}
            <Modal isVisible={isAddModalVisible} onClose={() => setAddModalVisible(false)} title="Adicionar Novo Produto">
                <div className="popup popup-produto">
                     {/* Passa null como product e a função handleFormSubmit */}
                    <ProductForm
                         product={null}
                         fornecedores={fornecedores}
                         onSubmit={handleFormSubmit}
                         onCancel={() => setAddModalVisible(false)}
                     />
                </div>
            </Modal>

            {/* Modal Editar */}
            {editingProduct && (
                <Modal isVisible={isEditModalVisible} onClose={() => setEditModalVisible(false)} title="Editar Produto">
                    <div className="popup popup-produto">
                        {/* Passa o editingProduct e a função handleFormSubmit */}
                         <ProductForm
                             product={editingProduct}
                             fornecedores={fornecedores}
                             onSubmit={handleFormSubmit}
                             onCancel={() => setEditModalVisible(false)}
                         />
                    </div>
                </Modal>
            )}

            {/* Modal Visualizar Imagem */}
            <Modal isVisible={isImagePopupVisible} onClose={closeImagePopup} title="Visualizar Imagem">
                 <div className="image-popup-content">
                    {/* Botão de fechar dentro do componente Modal já deve funcionar, mas podemos adicionar um extra se necessário */}
                    {/* <span className="close-image-popup" onClick={closeImagePopup}>&times;</span> */}
                    <img src={imagePopupUrl} alt="Imagem do Produto Ampliada" id="imagem-ampliada" />
                 </div>
            </Modal>

        </div>
    );
}

export default ProductsView;