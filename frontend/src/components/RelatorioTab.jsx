import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Line, Bar, Pie } from 'react-chartjs-2';
import {
    Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler, TimeScale
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler, TimeScale);

// --- Componentes Reutilizáveis com o novo estilo ---

const MetricCard = ({ title, value, isCurrency = true }) => (
    <div style={modernStyles.metricCard}>
        <h4 style={modernStyles.metricCardTitle}>{title}</h4>
        <h2 style={modernStyles.metricCardValue}>
            {typeof value === 'number' ?
                (isCurrency ? `R$ ${value.toFixed(2)}` : value.toLocaleString('pt-BR'))
                : value
            }
        </h2>
    </div>
);

const ChartContainer = ({ title, children }) => (
    <div style={modernStyles.chartCard}>
        <h3 style={modernStyles.chartTitle}>{title}</h3>
        <div style={modernStyles.chartContent}>
            {children}
        </div>
    </div>
);

function RelatorioTab({ reportType = 'vendas' }) {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];

    const [startDate, setStartDate] = useState(firstDayOfMonth);
    const [endDate, setEndDate] = useState(lastDayOfMonth);
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!startDate || !endDate) return;
            setLoading(true);
            setError(null);
            try {
                const response = await api.get(`/relatorios/data?startDate=${startDate}&endDate=${endDate}`);
                if (response.data.error) {
                    throw new Error(response.data.error);
                }
                setReportData(response.data);
            } catch (error) {
                console.error(`Erro ao buscar dados do relatório (${reportType}):`, error);
                const errorMsg = error.response?.data?.msg || error.message || "Erro desconhecido ao buscar dados.";
                setError(errorMsg);
                setReportData(null);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [startDate, endDate, reportType]);

    const handleGeneratePDF = async () => {
        setError(null);
        try {
            const response = await api.get(`/relatorios/pdf?startDate=${startDate}&endDate=${endDate}`, { responseType: 'blob' });
            const file = new Blob([response.data], { type: 'application/pdf' });
            const fileURL = URL.createObjectURL(file);
            window.open(fileURL, '_blank');
        } catch (error) {
            console.error("Erro ao gerar PDF:", error);
            const errorMsg = error.response?.data?.msg || error.message || "Não foi possível gerar o relatório em PDF.";
            setError(errorMsg);
        }
    };

    // --- Paleta de Cores em Tons de Cinza para os Gráficos ---
    const primaryGray = '#495057';    // Cinza escuro principal para texto e linhas
    const secondaryGray = '#6c757d';  // Cinza médio para subtítulos e elementos secundários
    const lightGray = '#ced4da';     // Cinza claro para bordas e divisores
    const extraLightGray = '#e9ecef'; // Cinza muito claro para fundos sutis
    const chartBackgroundGray = 'rgba(200, 200, 200, 0.2)'; // Fundo suave para áreas de gráfico

    const pieColors = [
        '#495057', // Cinza escuro
        '#6c757d', // Cinza médio
        '#adb5bd', // Cinza claro
        '#ced4da', // Cinza muito claro
        '#dee2e6'  // Cinza mais claro ainda
    ];

    // --- Opções Comuns dos Gráficos com o novo estilo ---
    const commonChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                titleFont: { size: 14, weight: 'bold' },
                bodyFont: { size: 12 },
                padding: 10,
                cornerRadius: 4,
                displayColors: false,
            }
        },
        scales: {
            x: {
                grid: { display: false, borderColor: lightGray }, // Bordas do grid em cinza claro
                ticks: { color: secondaryGray, font: { size: 11 } }
            },
            y: {
                grid: { color: extraLightGray }, // Linhas do grid em cinza muito claro
                ticks: { color: secondaryGray, font: { size: 11 } }
            }
        }
    };

    const horizontalBarOptions = {
        ...commonChartOptions,
        indexAxis: 'y',
        scales: {
            x: {
                grid: { color: extraLightGray },
                ticks: { color: secondaryGray, font: { size: 11 } }
            },
            y: {
                grid: { display: false, borderColor: lightGray },
                ticks: { color: secondaryGray, font: { size: 11 } }
            }
        },
        plugins: { ...commonChartOptions.plugins, legend: { display: false } }
    };

    const pieOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: { font: { size: 11 }, color: secondaryGray } // Legenda em cinza médio
            },
            tooltip: { ...commonChartOptions.plugins.tooltip }
        }
    };

    const revenueVsCostOptions = {
        ...commonChartOptions,
        plugins: {
            ...commonChartOptions.plugins,
            legend: {
                display: true,
                position: 'top',
                labels: { font: { size: 12 }, color: primaryGray } // Legenda em cinza escuro
            }
        },
        scales: {
            x: { ...commonChartOptions.scales.x },
            y: { ...commonChartOptions.scales.y, stacked: false }
        }
    };

    // --- Configurações dos Gráficos Específicos com a nova paleta ---

    const revenueEvolutionChart = {
        labels: reportData?.charts?.revenueEvolution?.map(item => item.date) || [],
        datasets: [{
            label: 'Receita Diária',
            data: reportData?.charts?.revenueEvolution?.map(item => item.value) || [],
            borderColor: primaryGray,
            backgroundColor: chartBackgroundGray,
            pointBackgroundColor: primaryGray,
            pointRadius: 4,
            tension: 0.4, // Suaviza a linha
            fill: true,
        }]
    };

    const soldByArtistChart = {
        labels: reportData?.charts?.soldByArtist?.map(item => item.artist) || [],
        datasets: [{
            label: 'Quantidade Vendida',
            data: reportData?.charts?.soldByArtist?.map(item => item.quantity) || [],
            backgroundColor: primaryGray, // Cor cinza para as barras
            borderColor: primaryGray,
            borderWidth: 1,
            barThickness: 10 // Mais fino para um visual limpo
        }]
    };

    const revenueByCategoryChart = {
        labels: reportData?.charts?.revenueByCategory?.map(item => item.category) || [],
        datasets: [{
            label: 'Receita',
            data: reportData?.charts?.revenueByCategory?.map(item => item.revenue) || [],
            backgroundColor: secondaryGray, // Outro tom de cinza para barras
            borderColor: secondaryGray,
            borderWidth: 1,
            barThickness: 10
        }]
    };

    const revenueVsCostChart = {
        labels: reportData?.charts?.revenueVsCostEvolution?.map(item => item.month) || [],
        datasets: [
            {
                label: 'Receita Mensal',
                data: reportData?.charts?.revenueVsCostEvolution?.map(item => item.revenue) || [],
                borderColor: primaryGray,
                backgroundColor: 'rgba(73, 80, 87, 0.2)', // Cinza mais escuro com transparência
                tension: 0.4,
                fill: true,
            },
            {
                label: 'Custo Mensal',
                data: reportData?.charts?.revenueVsCostEvolution?.map(item => item.cost) || [],
                borderColor: secondaryGray,
                backgroundColor: 'rgba(108, 117, 125, 0.2)', // Cinza médio com transparência
                tension: 0.4,
                fill: true,
            }
        ]
    };

    const topCategoriesChart = {
        labels: reportData?.charts?.topCategoriesRevenue?.map(item => item.category) || [],
        datasets: [{
            data: reportData?.charts?.topCategoriesRevenue?.map(item => item.revenue) || [],
            backgroundColor: pieColors, // Cores da fatia do gráfico de pizza
            borderWidth: 0,
        }]
    };

    // Gráficos de COMPRAS
    const costEvolutionChart = {
        labels: reportData?.charts?.revenueVsCostEvolution?.map(item => item.month) || [],
        datasets: [{
            label: 'Custo Mensal',
            data: reportData?.charts?.revenueVsCostEvolution?.map(item => item.cost) || [],
            borderColor: secondaryGray,
            backgroundColor: 'rgba(108, 117, 125, 0.2)',
            pointBackgroundColor: secondaryGray,
            pointRadius: 4,
            tension: 0.4,
            fill: true,
        }]
    };

    const purchasesBySupplierChart = {
        labels: reportData?.charts?.purchasesBySupplier?.map(item => item.supplier) || [],
        datasets: [{
            label: 'Custo por Fornecedor',
            data: reportData?.charts?.purchasesBySupplier?.map(item => item.cost) || [],
            backgroundColor: primaryGray,
            borderColor: primaryGray,
            borderWidth: 1,
            barThickness: 10
        }]
    };

    const purchasesByCategoryChart = {
        labels: reportData?.charts?.purchasesByCategory?.map(item => item.category) || [],
        datasets: [{
            data: reportData?.charts?.purchasesByCategory?.map(item => item.cost) || [],
            backgroundColor: pieColors,
            borderWidth: 0,
        }]
    };

    return (
        <div style={modernStyles.container}>
            <div style={modernStyles.actionBar}>
                <div style={modernStyles.dateSelectors}>
                    <div style={modernStyles.inputGroup}>
                        <label htmlFor="startDate" style={modernStyles.label}>Data Início</label>
                        <input type="date" id="startDate" value={startDate} onChange={e => setStartDate(e.target.value)} style={modernStyles.dateInput} />
                    </div>
                    <div style={modernStyles.inputGroup}>
                        <label htmlFor="endDate" style={modernStyles.label}>Data Fim</label>
                        <input type="date" id="endDate" value={endDate} onChange={e => setEndDate(e.target.value)} style={modernStyles.dateInput} />
                    </div>
                </div>
                <button onClick={handleGeneratePDF} style={modernStyles.pdfButton} disabled={loading}>
                    {loading ? 'Gerando...' : 'Gerar PDF'}
                </button>
            </div>

            {loading && <p style={modernStyles.loadingText}>Carregando dados do relatório...</p>}
            {error && <p style={{ ...modernStyles.loadingText, color: 'red' }}>Erro: {error}</p>}

            {!loading && !error && reportData?.summary && (
                <div>
                    <div style={modernStyles.metricCardGrid}>
                        {reportType === 'vendas' && <MetricCard title="Receita" value={reportData.summary.receita} />}
                        {reportType === 'vendas' && <MetricCard title="Lucro" value={reportData.summary.lucro} />}
                        <MetricCard title="Custo" value={reportData.summary.custo} />
                        {reportType === 'vendas' && <MetricCard title="Quantidade Vendida" value={reportData.summary.quantidadeVendida} isCurrency={false} />}
                        <MetricCard title="Quantidade Comprada" value={reportData.summary.quantidadeComprada} isCurrency={false} />
                    </div>

                    <div style={modernStyles.chartsGrid}>
                        {reportType === 'vendas' ? (
                            <>
                                <ChartContainer title="Evolução Anual da Receita">
                                    {reportData.charts?.revenueEvolution?.length > 0 ? <Line options={commonChartOptions} data={revenueEvolutionChart} /> : <p style={modernStyles.noDataText}>Sem dados de receita diária</p>}
                                </ChartContainer>
                                <ChartContainer title="Quantidade Vendida por Artista">
                                    {reportData.charts?.soldByArtist?.length > 0 ? <Bar options={horizontalBarOptions} data={soldByArtistChart} /> : <p style={modernStyles.noDataText}>Sem dados de vendas por artista</p>}
                                </ChartContainer>
                                <ChartContainer title="Receita por Categoria">
                                    {reportData.charts?.revenueByCategory?.length > 0 ? <Bar options={horizontalBarOptions} data={revenueByCategoryChart} /> : <p style={modernStyles.noDataText}>Sem dados de receita por categoria</p>}
                                </ChartContainer>
                                <ChartContainer title="Evolução Receita vs Custo">
                                    {reportData.charts?.revenueVsCostEvolution?.length > 0 ? <Line options={revenueVsCostOptions} data={revenueVsCostChart} /> : <p style={modernStyles.noDataText}>Sem dados mensais</p>}
                                </ChartContainer>
                                <ChartContainer title="Top Categorias por Receita">
                                    {reportData.charts?.topCategoriesRevenue?.length > 0 ? <div style={modernStyles.pieWrapper}><Pie options={pieOptions} data={topCategoriesChart} /></div> : <p style={modernStyles.noDataText}>Sem dados de receita por categoria</p>}
                                </ChartContainer>
                            </>
                        ) : (
                            <>
                                <ChartContainer title="Evolução do Custo (Mensal)">
                                    {reportData.charts?.revenueVsCostEvolution?.length > 0 ? <Line options={{ ...commonChartOptions, plugins: { legend: { display: true, labels: { color: primaryGray } } } }} data={costEvolutionChart} /> : <p style={modernStyles.noDataText}>Sem dados de custo mensal</p>}
                                </ChartContainer>
                                <ChartContainer title="Top Fornecedores por Custo">
                                    {reportData.charts?.purchasesBySupplier?.length > 0 ? <Bar options={horizontalBarOptions} data={purchasesBySupplierChart} /> : <p style={modernStyles.noDataText}>Sem dados de custo por fornecedor</p>}
                                </ChartContainer>
                                <ChartContainer title="Distribuição de Custo por Top Categorias">
                                    {reportData.charts?.purchasesByCategory?.length > 0 ? <div style={modernStyles.pieWrapper}><Pie options={pieOptions} data={purchasesByCategoryChart} /></div> : <p style={modernStyles.noDataText}>Sem dados de custo por categoria</p>}
                                </ChartContainer>
                            </>
                        )}
                    </div>
                </div>
            )}

            {!loading && !error && !reportData?.summary && <p style={modernStyles.loadingText}>Nenhum dado encontrado para o período selecionado.</p>}
        </div>
    );
}

// --- Novos Estilos Modernos em Escala de Cinza ---
const modernStyles = {
    container: {
        fontFamily: 'Roboto, Arial, sans-serif',
        backgroundColor: '#f8f9fa', // Fundo principal da página
        padding: '20px',
    },
    actionBar: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '20px',
        marginBottom: '30px',
        paddingBottom: '20px',
        borderBottom: '1px solid #e9ecef', // Borda sutil
    },
    dateSelectors: {
        display: 'flex',
        gap: '15px',
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    inputGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '5px',
    },
    label: {
        fontSize: '11px',
        color: '#6c757d',
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    dateInput: {
        padding: '10px 12px',
        border: '1px solid #dee2e6', // Borda clara
        borderRadius: '6px',
        fontSize: '14px',
        backgroundColor: '#fff',
        color: '#495057',
        outline: 'none',
        transition: 'border-color 0.2s',
        ':focus': {
            borderColor: '#adb5bd',
        }
    },
    pdfButton: {
        padding: '12px 20px',
        backgroundColor: '#495057', // Cinza escuro
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontWeight: '600',
        fontSize: '14px',
        transition: 'background-color 0.2s, transform 0.1s',
        ':hover': {
            backgroundColor: '#343a40',
            transform: 'translateY(-1px)',
        },
        ':disabled': {
            backgroundColor: '#adb5bd',
            cursor: 'not-allowed',
        }
    },
    metricCardGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', // Cards um pouco maiores
        gap: '25px',
        marginBottom: '40px',
    },
    metricCard: {
        background: '#fff',
        padding: '25px',
        borderRadius: '10px', // Bordas mais arredondadas
        border: '1px solid #e9ecef', // Borda sutil
        boxShadow: '0 4px 15px rgba(0,0,0,0.03)', // Sombra mais suave
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
    },
    metricCardTitle: {
        marginBottom: '10px',
        color: '#6c757d',
        fontSize: '13px',
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    metricCardValue: {
        color: '#343a40', // Preto quase total
        margin: 0,
        fontSize: '28px', // Maior
        fontWeight: '700',
    },
    chartsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', // Gráficos maiores
        gap: '25px',
    },
    chartCard: {
        background: '#fff',
        padding: '25px',
        borderRadius: '10px',
        border: '1px solid #e9ecef',
        boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
        display: 'flex',
        flexDirection: 'column',
    },
    chartTitle: {
        marginBottom: '20px',
        textAlign: 'left',
        fontSize: '16px',
        fontWeight: '600',
        color: '#495057',
    },
    chartContent: {
        position: 'relative',
        height: '320px', // Altura um pouco maior
        width: '100%',
    },
    loadingText: {
        textAlign: 'center',
        padding: '60px 20px',
        color: '#6c757d',
        fontSize: '16px',
    },
    noDataText: {
        textAlign: 'center',
        color: '#adb5bd',
        paddingTop: '60px',
        fontSize: '14px',
    },
    pieWrapper: {
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative', // Necessário para centralizar corretamente
    }
};

export default RelatorioTab;