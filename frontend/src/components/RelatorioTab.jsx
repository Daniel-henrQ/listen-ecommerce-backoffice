import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Line, Bar, Pie } from 'react-chartjs-2';
import {
    Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler
} from 'chart.js';

// Registra componentes Chart.js
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);

// Card de Métrica
const MetricCard = ({ title, value }) => (
    <div style={styles.card}>
        <h4 style={styles.cardTitle}>{title}</h4>
        <h2 style={styles.cardValue}>{value}</h2>
    </div>
);

// Container de Gráfico
const ChartContainer = ({ title, children }) => (
    <div style={styles.card}>
        <h3 style={styles.chartTitle}>{title}</h3>
        <div style={styles.chartContent}>
            {children}
        </div>
    </div>
);

// *** NOVO: O componente agora aceita a prop 'reportType' ***
function RelatorioTab({ reportType = 'vendas' }) { // Valor padrão 'vendas'
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];

    const [startDate, setStartDate] = useState(firstDayOfMonth);
    const [endDate, setEndDate] = useState(lastDayOfMonth);
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            if (!startDate || !endDate) return;
            setLoading(true);
            try {
                // Idealmente, o backend deveria aceitar um parâmetro 'type' aqui
                // Por agora, buscamos todos os dados e filtramos/ajustamos no frontend
                const response = await api.get(`/relatorios/data?startDate=${startDate}&endDate=${endDate}`);
                setReportData(response.data);
            } catch (error) {
                console.error(`Erro ao buscar dados do relatório (${reportType}):`, error);
                setReportData(null);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [startDate, endDate, reportType]); // Adicionado reportType às dependências

    const handleGeneratePDF = async () => {
        // A geração de PDF pode precisar ser ajustada no backend para aceitar o tipo
        try {
            const response = await api.get(`/relatorios/pdf?startDate=${startDate}&endDate=${endDate}&type=${reportType}`, { responseType: 'blob' });
            const file = new Blob([response.data], { type: 'application/pdf' });
            const fileURL = URL.createObjectURL(file);
            window.open(fileURL, '_blank');
        } catch (error) {
            console.error("Erro ao gerar PDF:", error);
            alert("Não foi possível gerar o relatório em PDF.");
        }
    };

    // --- Configurações dos Gráficos (Ajustadas condicionalmente) ---

    const commonChartOptions = { /* ... (mantém as opções de estilo) ... */ };
    const horizontalBarOptions = { /* ... (mantém as opções de estilo) ... */ };
    const pieOptions = { /* ... (mantém as opções de estilo) ... */ };
    const revenueVsCostOptions = { /* ... (mantém as opções de estilo) ... */ };

    // Gráficos específicos de VENDAS
    const revenueEvolutionChart = { /* ... (configuração do gráfico de evolução da receita) ... */ };
    const soldByArtistChart = { /* ... (configuração do gráfico de quantidade vendida por artista) ... */ };
    const revenueByCategoryChart = { /* ... (configuração do gráfico de receita por categoria) ... */ };
    const revenueVsCostChart = { /* ... (configuração do gráfico receita vs custo) ... */ };
    const topCategoriesChart = { /* ... (configuração do gráfico de pizza top categorias) ... */ };

    // *** NOVO: Gráficos específicos de COMPRAS (Exemplos) ***
    const costEvolutionChart = { // Similar ao revenueEvolution, mas com dados de custo
        labels: reportData?.charts?.revenueVsCostEvolution?.map(item => item.month) || [], // Usando dados combinados por mês
        datasets: [{
            label: 'Custo Mensal',
            data: reportData?.charts?.revenueVsCostEvolution?.map(item => item.cost) || [],
            borderColor: '#dc3545', // Cor vermelha para custo
            backgroundColor: 'rgba(220, 53, 69, 0.1)',
            pointBackgroundColor: '#c82333',
            pointRadius: 4,
            tension: 0.3,
            fill: false,
        }]
    };

    const purchasesBySupplierChart = { // Gráfico de barras: Custo por Fornecedor
        // Você precisará adicionar essa agregação no backend
        labels: reportData?.charts?.purchasesBySupplier?.map(item => item.supplier) || ['Fornecedor A', 'Fornecedor B'], // Exemplo
        datasets: [{
            label: 'Custo por Fornecedor',
            data: reportData?.charts?.purchasesBySupplier?.map(item => item.cost) || [1200, 850], // Exemplo
            backgroundColor: '#6c757d',
            borderColor: '#495057',
            borderWidth: 1
        }]
    };

    const purchasesByCategoryChart = { // Gráfico de Pizza: Custo por Categoria
         // Você precisará adicionar essa agregação no backend
         labels: reportData?.charts?.purchasesByCategory?.map(item => item.category) || ['Categoria X', 'Categoria Y', 'Categoria Z'], // Exemplo
         datasets: [{
             data: reportData?.charts?.purchasesByCategory?.map(item => item.cost) || [500, 700, 400], // Exemplo
             backgroundColor: ['#6c757d', '#adb5bd', '#dee2e6'],
             borderWidth: 0,
         }]
    };


    return (
        <div>
            {/* Seletor de Período e Botão PDF (sem alteração na estrutura) */}
            <div style={styles.actionBar}>
                <div style={styles.dateSelectors}>
                    {/* ... inputs de data ... */}
                </div>
                <button onClick={handleGeneratePDF} style={styles.pdfButton}>Gerar PDF</button>
            </div>

            {loading && <p style={styles.loadingText}>Carregando dados do relatório...</p>}

            {!loading && reportData?.summary && (
                <div>
                    {/* --- CARDS --- */}
                    {/* Exibe cards relevantes com base no reportType */}
                    <div style={styles.cardGrid}>
                        {reportType === 'vendas' && <MetricCard title="Receita" value={`R$ ${reportData.summary.receita.toFixed(2)}`} />}
                        {reportType === 'vendas' && <MetricCard title="Lucro" value={`R$ ${reportData.summary.lucro.toFixed(2)}`} />}
                        <MetricCard title={reportType === 'vendas' ? "Custo (Vendas)" : "Custo (Compras)"} value={`R$ ${reportData.summary.custo.toFixed(2)}`} />
                        <MetricCard title={reportType === 'vendas' ? "Quantidade Vendida" : "Quantidade Comprada"} value={reportType === 'vendas' ? reportData.summary.quantidadeVendida : 'N/A' /* Adicionar busca no backend */} />
                    </div>

                    {/* --- GRÁFICOS --- */}
                    {/* Renderiza gráficos diferentes com base no reportType */}
                    <div style={styles.chartsGrid}>
                        {reportType === 'vendas' ? (
                            <>
                                <ChartContainer title="Evolução da Receita">
                                    {reportData.charts?.revenueEvolution?.length > 0 ? <Line options={commonChartOptions} data={revenueEvolutionChart} /> : <p style={styles.noDataText}>Sem dados</p>}
                                </ChartContainer>
                                <ChartContainer title="Quantidade Vendida por Artista">
                                    {reportData.charts?.soldByArtist?.length > 0 ? <Bar options={horizontalBarOptions} data={soldByArtistChart} /> : <p style={styles.noDataText}>Sem dados</p>}
                                </ChartContainer>
                                <ChartContainer title="Lucro por Categoria">
                                    {reportData.charts?.revenueByCategory?.length > 0 ? <Bar options={horizontalBarOptions} data={revenueByCategoryChart} /> : <p style={styles.noDataText}>Sem dados</p>}
                                </ChartContainer>
                                <ChartContainer title="Evolução Receita vs Custo">
                                    {reportData.charts?.revenueVsCostEvolution?.length > 0 ? <Line options={revenueVsCostOptions} data={revenueVsCostChart} /> : <p style={styles.noDataText}>Sem dados</p>}
                                </ChartContainer>
                                <ChartContainer title="Top 3 em Receita">
                                    {reportData.charts?.topCategoriesRevenue?.length > 0 ? <div style={styles.pieContainer}><Pie options={pieOptions} data={topCategoriesChart} /></div> : <p style={styles.noDataText}>Sem dados</p>}
                                </ChartContainer>
                            </>
                        ) : ( // Gráficos para reportType === 'compras'
                            <>
                                <ChartContainer title="Evolução do Custo (Mensal)">
                                     {reportData.charts?.revenueVsCostEvolution?.length > 0 ? <Line options={{...commonChartOptions, plugins: {legend: {display: true}}}} data={costEvolutionChart} /> : <p style={styles.noDataText}>Sem dados</p>}
                                </ChartContainer>
                                <ChartContainer title="Custo por Fornecedor (Exemplo)">
                                    {/* Adicionar lógica de dados reais do backend */}
                                    <Bar options={horizontalBarOptions} data={purchasesBySupplierChart} />
                                </ChartContainer>
                                <ChartContainer title="Custo por Categoria (Exemplo)">
                                    {/* Adicionar lógica de dados reais do backend */}
                                     <div style={styles.pieContainer}><Pie options={pieOptions} data={purchasesByCategoryChart} /></div>
                                </ChartContainer>
                                {/* Adicione mais gráficos específicos de compras aqui */}
                            </>
                        )}
                    </div>
                </div>
            )}

            {!loading && !reportData?.summary && <p style={styles.loadingText}>Nenhum dado encontrado para o período selecionado.</p>}
        </div>
    );
}

// Estilos (mantidos da versão anterior)
const styles = {
    actionBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', padding: '15px 0', marginBottom: '25px' },
    dateSelectors: { display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' },
    inputGroup: { display: 'flex', flexDirection: 'column', gap: '5px' },
    label: { fontSize: '12px', color: '#6c757d', fontWeight: '700', textTransform: 'uppercase' },
    dateInput: { padding: '10px 15px', border: '1px solid #ced4da', borderRadius: '8px', fontSize: '14px', backgroundColor: '#fff' },
    pdfButton: { padding: '12px 22px', backgroundColor: '#343a40', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' },
    cardGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '25px' },
    card: { background: '#fff', padding: '25px', borderRadius: '8px', border: '1px solid #e9ecef', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' },
    cardTitle: { marginBottom: '8px', color: '#6c757d', fontSize: '14px', fontWeight: 'bold' },
    cardValue: { color: '#212529', margin: 0, fontSize: '28px', fontWeight: 'bold' },
    chartsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '25px' },
    chartTitle: { marginBottom: '20px', textAlign: 'left', fontSize: '16px', fontWeight: 'bold', color: '#495057' },
    chartContent: { position: 'relative', minHeight: '250px' },
    loadingText: { textAlign: 'center', padding: '40px 20px', color: '#6c757d', fontSize: '16px' },
    noDataText: { textAlign: 'center', color: '#adb5bd', paddingTop: '50px' },
    pieContainer: { maxHeight: '250px', display: 'flex', justifyContent: 'center' } // Para limitar altura do gráfico de pizza
};

export default RelatorioTab;