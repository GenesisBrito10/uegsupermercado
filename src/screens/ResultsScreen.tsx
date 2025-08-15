import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Pressable,
  ActivityIndicator,
  Dimensions,
  TouchableOpacity,
  Alert,
  FlatList
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { LineChart } from 'react-native-chart-kit';
import {
  calcularCestaBasica,
  MULTIPLICADORES_CESTA,
  salvarHistoricoCestaBasica,
  buscarHistoricoCestaBasica,
  buscarSalarioMinimo,
  calcularPorcentagemSalarioMinimo,
  calcularSalarioMinimoNecessario,
  calcularTempoTrabalho,
  HistoricoCestaBasica
} from '../supabase';

const screenWidth = Dimensions.get('window').width;

// Meses em português para uso no componente
const mesesAbreviados = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const mesesCompletos = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export default function ResultsScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [cestaBasica, setCestaBasica] = useState<{
    valorTotal: number;
    itens: {
      tipo: string;
      quantidade: number;
      precoUnitario: number;
      precoTotal: number;
    }[];
  } | null>(null);
  const [historicoSalvo, setHistoricoSalvo] = useState(false);
  const [historico, setHistorico] = useState<HistoricoCestaBasica[]>([]);
  const [anoSelecionado, setAnoSelecionado] = useState(new Date().getFullYear());
  const [historicoAnual, setHistoricoAnual] = useState<HistoricoCestaBasica[]>([]);
  const [showAllItems, setShowAllItems] = useState(false);
  const [periodoSelecionado, setPeriodoSelecionado] = useState<'ano' | 'semestre' | 'todos'>('ano');
  const [dadosGrafico, setDadosGrafico] = useState<{
    labels: string[];
    datasets: {
      data: number[];
      color: (opacity: number) => string;
      strokeWidth: number;
    }[];
    legend: string[];
  }>({ labels: [], datasets: [{ data: [], color: () => '', strokeWidth: 2 }], legend: [] });
  const [cestaCarregada, setCestaCarregada] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState<{value: number, index: number} | null>(null);
  const [variacaoPercentual, setVariacaoPercentual] = useState<number | null>(null);
  const [variacaoAbsoluta, setVariacaoAbsoluta] = useState<number | null>(null);
  const [valorMesAnterior, setValorMesAnterior] = useState<number | null>(null);
  const [salarioMinimo, setSalarioMinimo] = useState<number>(1412);
  const [salarioMinimoNecessario, setSalarioMinimoNecessario] = useState<number | null>(null);
  const [itemSelecionado, setItemSelecionado] = useState<{
    tipo: string;
    quantidade: number;
    precoUnitario: number;
    precoTotal: number;
  } | null>(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState<boolean>(false);
  const [porcentagemSalario, setPorcentagemSalario] = useState<number | null>(null);
  const [tempoTrabalho, setTempoTrabalho] = useState<{
    horas: number;
    minutos: number;
    segundos: number;
  } | null>(null);
  // Estado para controlar a visualização das abas
  const [activeTab, setActiveTab] = useState<'resumo' | 'grafico' | 'itens'>('resumo');
  
  // Usar useFocusEffect para garantir que a função será executada sempre que a tela receber foco
  useFocusEffect(
    React.useCallback(() => {
      async function carregarDados() {
        try {
          setLoading(true);
          
          // Carregar dados da cesta básica atual
          const resultado = await calcularCestaBasica();
          setCestaBasica(resultado);
          
          // Carregar histórico completo
          const historicoData = await buscarHistoricoCestaBasica();
          setHistorico(historicoData);
          
          // Carregar salário mínimo atual
          const salarioMinimoAtual = await buscarSalarioMinimo();
          setSalarioMinimo(salarioMinimoAtual);
          
          // Calcular variação percentual em relação ao mês anterior
          calcularVariacaoPercentual(historicoData);
          
          // Calcular relação com salário mínimo
          if (resultado.valorTotal > 0) {
            const pctSalario = calcularPorcentagemSalarioMinimo(resultado.valorTotal, salarioMinimoAtual);
            setPorcentagemSalario(pctSalario);
            
            const tempo = calcularTempoTrabalho(resultado.valorTotal);
            setTempoTrabalho(tempo);
            
            // Salvar no histórico
            await salvarHistoricoCestaBasica(resultado.valorTotal, resultado.itens);
            setHistoricoSalvo(true);

            const salarioMinimoNecessario = calcularSalarioMinimoNecessario(resultado.valorTotal);
            setSalarioMinimoNecessario(salarioMinimoNecessario);
          }
          
          setCestaCarregada(true);
        } catch (error) {
          console.error("Erro ao calcular cesta básica:", error);
          // Fallback para dados simulados em caso de erro
          setCestaBasica({
            valorTotal: 155.29,
            itens: Object.entries(MULTIPLICADORES_CESTA).map(([tipo, quantidade]) => ({
              tipo,
              quantidade,
              precoUnitario: 10,
              precoTotal: 10 * quantidade
            }))
          });
          setCestaCarregada(true);
        } finally {
          setLoading(false);
        }
      }
      
      carregarDados();
      
      return () => {
        // Cleanup quando a tela perder foco
        setHistoricoSalvo(false);
      };
    }, [])
  );
  
  // Função para calcular a variação percentual em relação ao mês anterior
  const calcularVariacaoPercentual = (historico: HistoricoCestaBasica[]) => {
    if (!historico || historico.length < 2) {
      setVariacaoPercentual(null);
      setVariacaoAbsoluta(null);
      setValorMesAnterior(null);
      return;
    }
    
    // Obter o mês atual e o mês anterior
    const dataAtual = new Date();
    const mesAtual = dataAtual.getMonth() + 1; // 1-12
    const anoAtual = dataAtual.getFullYear();
    
    // Encontrar o registro do mês atual
    const registroAtual = historico.find(h => h.mes === mesAtual && h.ano === anoAtual);
    
    // Determinar o mês anterior
    let mesAnterior = mesAtual - 1;
    let anoAnterior = anoAtual;
    
    if (mesAnterior <= 0) {
      mesAnterior = 12;
      anoAnterior--;
    }
    
    // Encontrar o registro do mês anterior
    const registroAnterior = historico.find(h => h.mes === mesAnterior && h.ano === anoAnterior);
    
    // Se temos os dois registros, calculamos a variação
    if (registroAtual && registroAnterior && registroAnterior.valor > 0) {
      const variacao = ((registroAtual.valor - registroAnterior.valor) / registroAnterior.valor) * 100;
      const diferencaAbsoluta = registroAtual.valor - registroAnterior.valor;
      
      setVariacaoPercentual(variacao);
      setVariacaoAbsoluta(diferencaAbsoluta);
      setValorMesAnterior(registroAnterior.valor);
    } else {
      setVariacaoPercentual(null);
      setVariacaoAbsoluta(null);
      setValorMesAnterior(null);
    }
  };
  
  // Efeito separado para processar apenas os dados do gráfico quando os filtros mudam
  useEffect(() => {
    if (cestaCarregada && historico.length > 0) {
      processarDadosGrafico(historico, anoSelecionado, periodoSelecionado);
    }
  }, [anoSelecionado, periodoSelecionado, cestaCarregada, historico]);
  
  // Determinar o mês e ano atual para mostrar
  const dataAtual = new Date();
  const mesAtualIndex = dataAtual.getMonth(); // 0-11
  const mesAtualNome = mesesCompletos[mesAtualIndex];
  const anoAtual = dataAtual.getFullYear();
  
  // Processar dados do gráfico baseado no período selecionado
  const processarDadosGrafico = (
    historicoCompleto: HistoricoCestaBasica[], 
    ano: number, 
    periodo: 'ano' | 'semestre' | 'todos'
  ) => {
    if (historicoCompleto.length === 0) {
      setDadosGrafico({
        labels: [],
        datasets: [{ data: [], color: () => '#4A90E2', strokeWidth: 2 }],
        legend: []
      });
      return;
    }
    
    let dadosFiltrados: HistoricoCestaBasica[] = [];
    let labels: string[] = [];
    let dataValues: number[] = [];
    
    if (periodo === 'todos') {
      // Todos os anos - agrupa por ano e mostra a média de cada ano
      const anosPorOrdem = [...new Set(historicoCompleto.map(h => h.ano))].sort();
      
      labels = anosPorOrdem.map(a => a.toString());
      
      dataValues = anosPorOrdem.map(ano => {
        const registrosDoAno = historicoCompleto.filter(h => h.ano === ano);
        const soma = registrosDoAno.reduce((acc, curr) => acc + curr.valor, 0);
        return registrosDoAno.length > 0 ? soma / registrosDoAno.length : 0;
      });
    } else if (periodo === 'semestre') {
      // Últimos 6 meses - pegar dados dos últimos 6 meses, independente do ano
      const dataAtual = new Date();
      const mesAtual = dataAtual.getMonth() + 1; // 1-12
      const anoAtual = dataAtual.getFullYear();
      
      // Criar array com os últimos 6 meses (mês/ano)
      const ultimosSeisMeses: {mes: number, ano: number}[] = [];
      for (let i = 0; i < 6; i++) {
        let mes = mesAtual - i;
        let ano = anoAtual;
        
        if (mes <= 0) {
          mes += 12;
          ano -= 1;
        }
        
        ultimosSeisMeses.push({ mes, ano });
      }
      
      // Ordenar do mais antigo para o mais recente
      ultimosSeisMeses.reverse();
      
      // Filtrar histórico para incluir apenas os últimos 6 meses
      dadosFiltrados = ultimosSeisMeses.map(({ mes, ano }) => {
        const registro = historicoCompleto.find(h => h.mes === mes && h.ano === ano);
        return registro || { id: 0, valor: 0, mes, ano, created_at: '' };
      });
      
      // Criar labels como "Jan/23", "Fev/23", etc.
      labels = ultimosSeisMeses.map(({ mes, ano }) => {
        const mesAbreviado = mesesAbreviados[mes - 1]; // Ajuste para índice 0-11
        const anoAbreviado = String(ano).slice(-2);
        return `${mesAbreviado}/${anoAbreviado}`;
      });
      
      dataValues = dadosFiltrados.map(registro => registro.valor);
    } else {
      // Ano específico - pegar todos os meses do ano selecionado
      dadosFiltrados = historicoCompleto.filter(h => h.ano === ano);
      
      // Array de 12 meses, inicialmente com valores undefined
      const valoresPorMes: (number | undefined)[] = Array(12).fill(undefined);
      
      // Preencher com os valores disponíveis
      dadosFiltrados.forEach(item => {
        valoresPorMes[item.mes - 1] = item.valor;
      });
      
      labels = mesesAbreviados;
      dataValues = valoresPorMes.map(v => v === undefined ? 0 : v);
    }
    
    setDadosGrafico({
      labels,
      datasets: [
        {
          data: dataValues,
          color: (opacity = 1) => `rgba(74, 144, 226, ${opacity})`,
          strokeWidth: 2
        }
      ],
      legend: [] // Corrigido aqui: a propriedade legend é um array
    });
  };
  
  // Configuração melhorada do gráfico
  const chartConfig = {
    backgroundGradientFrom: "#ffffff",
    backgroundGradientTo: "#ffffff",
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(74, 144, 226, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(74, 144, 226, ${opacity})`,
    style: {
      borderRadius: 16
    },
    propsForDots: {
      r: "3", // Reduzindo o tamanho das bolinhas
      strokeWidth: "1",
      stroke: "#4A90E2"
    },
    propsForLabels: {
      fontSize: 10
    },
    formatYLabel: (value: string) => `R$${Number(value).toFixed(0)}`,
  };
  
  const anosDisponiveis = Array.from(
    new Set(historico.map(item => item.ano))
  ).sort((a, b) => b - a); // Ordenar decrescente
  
  // Função para abrir o modal de detalhes do item
  const abrirDetalhesItem = (item: {
    tipo: string;
    quantidade: number;
    precoUnitario: number;
    precoTotal: number;
  }) => {
    setItemSelecionado(item);
    setDetailsModalVisible(true);
  };
  
  // Calcular porcentagem do salário mínimo
  const calcularPorcentagemSalario = (valor: number): number => {
    const salarioLiquido = salarioMinimo * 0.925;
    return (valor / salarioLiquido) * 100;
  };
  
  // Calcular tempo de trabalho
  const calcularTempoTrabalho = (valor: number): { horas: number; minutos: number; segundos: number } => {
    const valorHora = salarioMinimo / 220;
    const tempoTotalHoras = valor / valorHora;
    
    const horas = Math.floor(tempoTotalHoras);
    const minutos = Math.floor((tempoTotalHoras - horas) * 60);
    const segundos = Math.floor(((tempoTotalHoras - horas) * 60 - minutos) * 60);
    
    return { horas, minutos, segundos };
  };
  
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Resultados</Text>
          <View style={styles.headerButtons}>
            <Pressable 
              style={styles.backButtonSmall}
              onPress={() => navigation.navigate('Home' as never)}
            >
              <Icon name="arrow-left" size={16} color="#4A90E2" />
            </Pressable>
          </View>
        </View>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text style={styles.loadingText}>Calculando valor da cesta básica...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      {/* Header com título e botão de voltar */}
      <View style={styles.header}>
        <Text style={styles.title}>Cesta Básica</Text>
        <View style={styles.headerButtons}>
          <Pressable 
            style={styles.backButtonSmall}
            onPress={() => navigation.navigate('Home' as never)}
          >
            <Icon name="arrow-left" size={16} color="#4A90E2" />
          </Pressable>
        </View>
      </View>
      
      {/* Card valor total com informações resumidas */}
      <View style={styles.totalCardModern}>
        <Text style={styles.periodInfo}>{mesAtualNome} de {anoAtual}</Text>
        <View style={styles.totalValueContainer}>
          <Text style={styles.totalValueModern}>
            R$ {cestaBasica?.valorTotal.toFixed(2).replace('.', ',') || '0,00'}
          </Text>
          
          {variacaoPercentual !== null && variacaoAbsoluta !== null && (
            <View style={[
              styles.variationBadge,
              variacaoPercentual >= 0 ? styles.positiveVariation : styles.negativeVariation
            ]}>
              <Icon 
                name={variacaoPercentual >= 0 ? 'arrow-up' : 'arrow-down'} 
                size={10} 
                color="white" 
                style={styles.variationIcon}
              />
              <Text style={styles.variationText}>
                {Math.abs(variacaoPercentual).toFixed(1)}%
              </Text>
            </View>
          )}
        </View>
        
        {/* Valor anterior e diferença - visíveis apenas na aba de resumo */}
        {activeTab === 'resumo' && valorMesAnterior !== null && variacaoAbsoluta !== null && (
          <View style={styles.variationDetailsContainer}>
            <Text style={styles.variationDetailsText}>
              Mês anterior: R$ {valorMesAnterior.toFixed(2).replace('.', ',')}
            </Text>
            <Text style={[
              styles.variationDetailsText,
              variacaoAbsoluta >= 0 ? styles.positiveVariationText : styles.negativeVariationText
            ]}>
              {variacaoAbsoluta >= 0 ? '+' : '-'} R$ {Math.abs(variacaoAbsoluta).toFixed(2).replace('.', ',')} ({Math.abs(variacaoPercentual!).toFixed(1)}%)
            </Text>
          </View>
        )}
        
        {/* Seção de impacto financeiro - visível apenas na aba de resumo */}
        {activeTab === 'resumo' && porcentagemSalario !== null && tempoTrabalho !== null && (
          <View style={styles.impactContainer}>
            <View style={styles.impactHeader}>
              <Icon name="wallet" size={14} color="#6B7280" />
              <Text style={styles.impactTitle}>
                Impacto Financeiro
              </Text>
            </View>
            
            {/* ====== INÍCIO DA ALTERAÇÃO NO LAYOUT ====== */}
            <View style={styles.impactList}>
              {/* Item 1: Porcentagem do Salário */}
              <View style={styles.impactListItem}>
                <Text style={styles.impactLabel}>Do salário mínimo</Text>
                <Text style={styles.impactValue}>
                  {porcentagemSalario.toFixed(1)}%
                </Text>
              </View>

              {/* Item 2: Tempo de Trabalho */}
              <View style={styles.impactListItem}>
                <Text style={styles.impactLabel}>Tempo de trabalho</Text>
                <View style={styles.impactTimeContainer}>
                  <Text style={styles.impactTimeValue}>
                    {tempoTrabalho.horas}
                    <Text style={styles.impactTimeUnit}>h </Text>
                    {tempoTrabalho.minutos}
                    <Text style={styles.impactTimeUnit}>m </Text>
                    {tempoTrabalho.segundos}
                    <Text style={styles.impactTimeUnit}>s</Text>
                  </Text>
                </View>
              </View>
              
              {/* Item 3: Salário Mínimo Necessário */}
              <View style={styles.impactListItem}>
                <Text style={styles.impactLabel}>Salário mínimo necessário</Text>
                <Text style={styles.impactValue}>
                  R$ {salarioMinimoNecessario?.toFixed(2).replace('.', ',')}
                </Text>
              </View>
            </View>
            {/* ====== FIM DA ALTERAÇÃO NO LAYOUT ====== */}

          </View>
        )}
        
        <View style={styles.updateInfoContainer}>
          <Icon name="clock" size={12} color="#9CA3AF" />
          <Text style={styles.updateInfo}>
            Atualizado hoje
            {historicoSalvo && <Text style={{color: '#4CAF50'}}> • Salvo</Text>}
          </Text>
        </View>
      </View>
      
      {/* Restante do seu código permanece o mesmo... */}

      {/* Navegação em abas */}
      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'resumo' && styles.activeTabButton]}
          onPress={() => setActiveTab('resumo')}
        >
          <Icon 
            name="info-circle" 
            size={16} 
            color={activeTab === 'resumo' ? '#4A90E2' : '#6B7280'} 
            style={styles.tabIcon}
          />
          <Text style={[styles.tabText, activeTab === 'resumo' && styles.activeTabText]}>
            Resumo
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'grafico' && styles.activeTabButton]}
          onPress={() => setActiveTab('grafico')}
        >
          <Icon 
            name="chart-line" 
            size={16} 
            color={activeTab === 'grafico' ? '#4A90E2' : '#6B7280'}
            style={styles.tabIcon}
          />
          <Text style={[styles.tabText, activeTab === 'grafico' && styles.activeTabText]}>
            Gráfico
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'itens' && styles.activeTabButton]}
          onPress={() => setActiveTab('itens')}
        >
          <Icon 
            name="shopping-basket" 
            size={16} 
            color={activeTab === 'itens' ? '#4A90E2' : '#6B7280'}
            style={styles.tabIcon}
          />
          <Text style={[styles.tabText, activeTab === 'itens' && styles.activeTabText]}>
            Itens
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Conteúdo baseado na aba selecionada */}
      <View style={styles.tabContent}>
        {/* Aba de Resumo - Informações adicionais do mês atual */}
        {activeTab === 'resumo' && (
          <ScrollView style={styles.resumoContainer}>
            <View style={styles.infoCard}>
              <Text style={styles.infoCardTitle}>
                <Icon name="money-bill-wave" size={14} color="#4A90E2" /> Comparativo Salarial
              </Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Salário Mínimo {new Date().getFullYear()}:</Text>
                <Text style={styles.infoValue}>R$ {salarioMinimo.toFixed(2).replace('.', ',')}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Valor Líquido (92,5%):</Text>
                <Text style={styles.infoValue}>R$ {(salarioMinimo * 0.925).toFixed(2).replace('.', ',')}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Horas Trabalhadas/Mês:</Text>
                <Text style={styles.infoValue}>220h</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Valor da Hora:</Text>
                <Text style={styles.infoValue}>R$ {(salarioMinimo / 220).toFixed(2).replace('.', ',')}</Text>
              </View>
            </View>
            
            <View style={styles.infoCard}>
              <Text style={styles.infoCardTitle}>
                <Icon name="lightbulb" size={14} color="#4A90E2" /> Você Sabia?
              </Text>
              <Text style={styles.infoText}>
                A cesta básica foi estabelecida pelo Decreto-Lei nº 399, de 1938, e varia conforme a região do Brasil.
              </Text>
              <Text style={styles.infoText}>
                Em média, uma família brasileira gasta cerca de 30% a 50% da sua renda com alimentação.
              </Text>
            </View>
          </ScrollView>
        )}
        
        {/* Aba de Gráfico - Histórico de preços */}
        {activeTab === 'grafico' && (
          <View style={styles.graphContainer}>
            <View style={styles.chartHeader}>
              <Text style={styles.chartTitle}>Variação de Preços</Text>
            </View>
              
            {/* Seletor de período */}
            <View style={styles.filterScrollContainer}>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterScrollContent}
              >
                <TouchableOpacity
                  style={[
                    styles.filterButton,
                    periodoSelecionado === 'ano' && styles.filterButtonActive
                  ]}
                  onPress={() => setPeriodoSelecionado('ano')}
                >
                  <Text style={[
                    styles.filterButtonText,
                    periodoSelecionado === 'ano' && styles.filterButtonTextActive
                  ]}>
                    Ano atual
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.filterButton,
                    periodoSelecionado === 'semestre' && styles.filterButtonActive
                  ]}
                  onPress={() => setPeriodoSelecionado('semestre')}
                >
                  <Text style={[
                    styles.filterButtonText,
                    periodoSelecionado === 'semestre' && styles.filterButtonTextActive
                  ]}>
                    Últimos 6 meses
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.filterButton,
                    periodoSelecionado === 'todos' && styles.filterButtonActive
                  ]}
                  onPress={() => setPeriodoSelecionado('todos')}
                >
                  <Text style={[
                    styles.filterButtonText,
                    periodoSelecionado === 'todos' && styles.filterButtonTextActive
                  ]}>
                    Todos os anos
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
            
            {/* Seletor de ano (visível apenas quando periodoSelecionado é 'ano') */}
            {periodoSelecionado === 'ano' && (
              <View style={styles.yearSelectorContainer}>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.yearScrollContent}
                >
                  {anosDisponiveis.map(ano => (
                    <TouchableOpacity
                      key={ano}
                      style={[
                        styles.yearButton,
                        anoSelecionado === ano && styles.yearButtonActive
                      ]}
                      onPress={() => setAnoSelecionado(ano)}
                    >
                      <Text 
                        style={[
                          styles.yearButtonText,
                          anoSelecionado === ano && styles.yearButtonTextActive
                        ]}
                      >
                        {ano}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
            
            {dadosGrafico.labels.length > 0 ? (
              <View style={styles.chartWrapper}>
                <LineChart
                  data={dadosGrafico}
                  width={screenWidth - 40}
                  height={220}
                  chartConfig={chartConfig}
                  bezier
                  style={styles.chart}
                  withInnerLines={true}
                  withOuterLines={true}
                  withDots={true}
                  withShadow={false}
                  fromZero={true}
                  yAxisInterval={1}
                  yAxisSuffix=""
                  yAxisLabel="R$"
                  hideLegend={true}
                  onDataPointClick={({value, index, x, y}) => {
                    if (value > 0) {
                      setSelectedPoint({value, index});
                      setTimeout(() => {
                        setSelectedPoint(null);
                      }, 2000);
                    }
                  }}
                  decorator={() => {
                    if (!selectedPoint) return null;
                    
                    const { value, index } = selectedPoint;
                    const data = dadosGrafico.datasets[0].data;
                    const maxValue = Math.max(...data.filter(v => v > 0));
                    const minValue = Math.min(...data.filter(v => v > 0));
                    const range = maxValue - minValue;
                    
                    const normalizedValue = range === 0 ? 0.5 : (value - minValue) / range;
                    const chartWidth = screenWidth - 60;
                    const chartHeight = 180;
                    const x = (index / (dadosGrafico.labels.length - 1)) * chartWidth + 20;
                    const y = (1 - normalizedValue) * chartHeight + 10;
                    
                    return (
                      <View
                        style={{
                          position: 'absolute',
                          left: x - 40,
                          top: y - 30,
                          width: 80,
                          alignItems: 'center'
                        }}
                      >
                        <View style={styles.tooltipContainer}>
                          <Text style={styles.tooltipText}>
                            R$ {value.toFixed(2).replace('.', ',')}
                          </Text>
                        </View>
                      </View>
                    );
                  }}
                />
              </View>
            ) : (
              <View style={styles.noDataContainer}>
                <Icon name="chart-line" size={50} color="#E5E7EB" />
                <Text style={styles.noDataText}>Sem dados para o período selecionado</Text>
              </View>
            )}
          </View>
        )}
        
        {/* Aba de Itens - Lista de produtos na cesta */}
        {activeTab === 'itens' && (
          <View style={styles.itemsTabContainer}>
            <View style={styles.itemsHeader}>
              <Text style={styles.itemsTitle}>Itens da Cesta</Text>
              <TouchableOpacity 
                style={styles.showAllButton}
                onPress={() => setShowAllItems(!showAllItems)}
              >
                <Text style={styles.showAllText}>
                  {showAllItems ? 'Mostrar menos' : 'Ver todos'}
                </Text>
              </TouchableOpacity>
            </View>
            
            {cestaBasica?.itens.length === 0 ? (
              <View style={styles.emptyStateContainer}>
                <Icon name="shopping-basket" size={50} color="#E5E7EB" />
                <Text style={styles.emptyStateText}>Nenhum item na cesta básica</Text>
              </View>
            ) : (
              <FlatList
                data={cestaBasica?.itens
                  .sort((a, b) => b.precoTotal - a.precoTotal)
                  .slice(0, showAllItems ? undefined : 5)}
                keyExtractor={(item, index) => `item-${index}`}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={styles.itemCardModern}
                    onPress={() => abrirDetalhesItem(item)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.itemIconAndName}>
                      <View style={styles.itemIcon}>
                        <Icon name={getIconForType(item.tipo)} size={16} color="#4A90E2" />
                      </View>
                      <View>
                        <Text style={styles.itemNameModern}>{item.tipo}</Text>
                        <Text style={styles.itemQuantityModern}>{item.quantidade}x</Text>
                      </View>
                    </View>
                    <View style={styles.priceContainerModern}>
                      <Text style={styles.itemTotalPrice}>
                        R$ {item.precoTotal.toFixed(2).replace('.', ',')}
                      </Text>
                      <Text style={styles.itemUnitPriceModern}>
                        R$ {item.precoUnitario.toFixed(2).replace('.', ',')} (un)
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
                contentContainerStyle={styles.itemsListContent}
              />
            )}
          </View>
        )}
      </View>
      
      {/* Modal em tela cheia para visualização de todos os itens */}
      {showAllItems && (
        <View style={styles.fullScreenOverlay}>
          <View style={styles.fullScreenContainer}>
            <View style={styles.fullScreenHeader}>
              <Text style={styles.fullScreenTitle}>Todos os Itens da Cesta</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowAllItems(false)}
              >
                <Icon name="times" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={cestaBasica?.itens.sort((a, b) => b.precoTotal - a.precoTotal)}
              keyExtractor={(item, index) => `fullscreen-item-${index}`}
              showsVerticalScrollIndicator={true}
              contentContainerStyle={styles.fullScreenListContent}
              renderItem={({ item }) => (
                <View style={styles.fullScreenItemCard}>
                  <View style={styles.itemIconAndName}>
                    <View style={styles.itemIcon}>
                      <Icon name={getIconForType(item.tipo)} size={16} color="#4A90E2" />
                    </View>
                    <View style={styles.itemDetails}>
                      <Text style={styles.fullScreenItemName}>{item.tipo}</Text>
                      <Text style={styles.itemQuantityModern}>Quantidade: {item.quantidade}x</Text>
                    </View>
                  </View>
                  <View style={styles.fullScreenPriceContainer}>
                    <Text style={styles.fullScreenItemUnitPrice}>
                      Preço Unitário: R$ {item.precoUnitario.toFixed(2).replace('.', ',')}
                    </Text>
                    <Text style={styles.fullScreenItemTotalPrice}>
                      Total: R$ {item.precoTotal.toFixed(2).replace('.', ',')}
                    </Text>
                  </View>
                  
                  <TouchableOpacity 
                    style={styles.detailsButton}
                    onPress={() => abrirDetalhesItem(item)}
                  >
                    <Icon name="info-circle" size={14} color="#FFFFFF" />
                    <Text style={styles.detailsButtonText}>Ver detalhes</Text>
                  </TouchableOpacity>
                </View>
              )}
            />
            
            <View style={styles.fullScreenFooter}>
              <Text style={styles.fullScreenFooterText}>
                Total da Cesta: R$ {cestaBasica?.valorTotal.toFixed(2).replace('.', ',')}
              </Text>
              <TouchableOpacity 
                style={styles.closeFullScreenButton}
                onPress={() => setShowAllItems(false)}
              >
                <Text style={styles.closeFullScreenButtonText}>Fechar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
      
      {/* Modal de detalhes do item */}
      {detailsModalVisible && itemSelecionado && (
        <View style={styles.detailsModalOverlay}>
          <View style={styles.detailsModalContainer}>
            <View style={styles.detailsModalHeader}>
              <Text style={styles.detailsModalTitle}>{itemSelecionado.tipo}</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setDetailsModalVisible(false)}
              >
                <Icon name="times" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.detailsModalContent}>
              {/* Informações básicas */}
              <View style={styles.detailsSection}>
                <Text style={styles.detailsSectionTitle}>Informações Básicas</Text>
                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>Quantidade:</Text>
                  <Text style={styles.detailsValue}>{itemSelecionado.quantidade}x</Text>
                </View>
                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>Preço Unitário:</Text>
                  <Text style={styles.detailsValue}>
                    R$ {itemSelecionado.precoUnitario.toFixed(2).replace('.', ',')}
                  </Text>
                </View>
                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>Preço Total:</Text>
                  <Text style={styles.detailsValue}>
                    R$ {itemSelecionado.precoTotal.toFixed(2).replace('.', ',')}
                  </Text>
                </View>
              </View>
              
              {/* Relação com o salário mínimo */}
              <View style={styles.detailsSection}>
                <Text style={styles.detailsSectionTitle}>Relação com Salário Mínimo</Text>
                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>Salário Mínimo Atual:</Text>
                  <Text style={styles.detailsValue}>
                    R$ {salarioMinimo.toFixed(2).replace('.', ',')}
                  </Text>
                </View>
                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>Salário Líquido (92,5%):</Text>
                  <Text style={styles.detailsValue}>
                    R$ {(salarioMinimo * 0.925).toFixed(2).replace('.', ',')}
                  </Text>
                </View>
                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>Porcentagem do Salário:</Text>
                  <Text style={styles.detailsHighlightValue}>
                    {calcularPorcentagemSalario(itemSelecionado.precoTotal).toFixed(2)}%
                  </Text>
                </View>
              </View>
              
              {/* Tempo de trabalho */}
              <View style={styles.detailsSection}>
                <Text style={styles.detailsSectionTitle}>Tempo de Trabalho Necessário</Text>
                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>Valor Hora Trabalhada:</Text>
                  <Text style={styles.detailsValue}>
                    R$ {(salarioMinimo / 220).toFixed(2).replace('.', ',')}
                  </Text>
                </View>
                
                {(() => {
                  const tempo = calcularTempoTrabalho(itemSelecionado.precoTotal);
                  return (
                    <View style={styles.timeContainer}>
                      <View style={styles.timeBlock}>
                        <Text style={styles.timeValue}>{tempo.horas}</Text>
                        <Text style={styles.timeLabel}>horas</Text>
                      </View>
                      <View style={styles.timeBlock}>
                        <Text style={styles.timeValue}>{tempo.minutos}</Text>
                        <Text style={styles.timeLabel}>minutos</Text>
                      </View>
                      <View style={styles.timeBlock}>
                        <Text style={styles.timeValue}>{tempo.segundos}</Text>
                        <Text style={styles.timeLabel}>segundos</Text>
                      </View>
                    </View>
                  );
                })()}
                
                <Text style={styles.timeExplanation}>
                  Tempo necessário para pagar este item trabalhando com salário mínimo.
                </Text>
              </View>
            </ScrollView>
            
            <TouchableOpacity 
              style={styles.closeDetailButton}
              onPress={() => setDetailsModalVisible(false)}
            >
              <Text style={styles.closeDetailButtonText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

// Função auxiliar para retornar ícone apropriado para cada tipo de produto
function getIconForType(tipo: string): string {
  const icones: Record<string, string> = {
    'Carne': 'drumstick-bite',
    'Leite': 'coffee',
    'Feijão': 'seedling',
    'Arroz': 'bread-slice',
    'Farinha': 'cookie',
    'Batata': 'carrot',
    'Tomate': 'apple-alt',
    'Pão': 'bread-slice',
    'Café': 'coffee',
    'Banana': 'apple-alt',
    'Açúcar': 'candy-cane',
    'Óleo': 'wine-bottle',
    'Manteiga': 'cheese',
  };
  
  return icones[tipo] || 'shopping-basket';
}

// SEU STYLESHEET COM OS AJUSTES APLICADOS
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  headerButtons: {
    flexDirection: 'row',
  },
  backButtonSmall: {
    padding: 10,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
  },
  totalCardModern: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  periodInfo: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 4,
  },
  totalValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    justifyContent: 'center',
  },
  totalValueModern: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
  },
  variationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginLeft: 10,
  },
  positiveVariation: {
    backgroundColor: '#10B981',
  },
  negativeVariation: {
    backgroundColor: '#EF4444',
  },
  variationIcon: {
    marginRight: 3,
  },
  variationText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
  },
  updateInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  updateInfo: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 4,
    textAlign: 'center',
  },
  chartContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  filterScrollContainer: {
    marginTop: 8,
    marginBottom: 8,
  },
  filterScrollContent: {
    paddingRight: 20,
  },
  yearScrollContent: {
    paddingRight: 20,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#F3F4F6',
  },
  filterButtonActive: {
    backgroundColor: '#EFF6FF',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#6B7280',
  },
  filterButtonTextActive: {
    color: '#4A90E2',
    fontWeight: 'bold',
  },
  yearSelectorContainer: {
    marginBottom: 15,
  },
  chartWrapper: {
    marginTop: 10,
    alignItems: 'center',
  },
  noDataContainer: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noDataText: {
    marginTop: 12,
    color: '#9CA3AF',
    fontSize: 14,
  },
  itemsContainer: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  itemsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  itemsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  showAllText: {
    fontSize: 14,
    color: '#4A90E2',
    fontWeight: '500',
    padding: 6,
  },
  showAllButton: {
    padding: 8,
  },
  expandedItemsContainer: {
    flex: 2,
  },
  itemsListContent: {
    paddingBottom: 8,
  },
  itemCardModern: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  itemIconAndName: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemNameModern: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4B5563',
  },
  itemQuantityModern: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  priceContainerModern: {
    alignItems: 'flex-end',
  },
  itemTotalPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4B5563',
  },
  itemUnitPriceModern: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#6B7280',
  },
  tooltipContainer: {
    backgroundColor: 'rgba(74, 144, 226, 0.9)',
    borderRadius: 8,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  tooltipText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  variationDetailsContainer: {
    marginTop: 4,
    marginBottom: 8,
    alignItems: 'center',
  },
  variationDetailsText: {
    fontSize: 12,
    color: '#6B7280',
  },
  positiveVariationText: {
    color: '#10B981',
    fontWeight: '500',
  },
  negativeVariationText: {
    color: '#EF4444',
    fontWeight: '500',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    marginTop: 12,
    color: '#9CA3AF',
    fontSize: 14,
    textAlign: 'center',
  },
  fullScreenOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  fullScreenContainer: {
    backgroundColor: 'white',
    width: '100%',
    height: '100%',
    borderRadius: 0,
    padding: 0,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  fullScreenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#F9FAFB',
  },
  fullScreenTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  closeButton: {
    padding: 8,
  },
  fullScreenListContent: {
    padding: 16,
  },
  fullScreenItemCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  itemDetails: {
    flex: 1,
  },
  fullScreenItemName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  fullScreenPriceContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  fullScreenItemUnitPrice: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  fullScreenItemTotalPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
  fullScreenFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    backgroundColor: '#F9FAFB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fullScreenFooterText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  closeFullScreenButton: {
    backgroundColor: '#4A90E2',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  closeFullScreenButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4A90E2',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  detailsButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 6,
  },
  detailsModalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  detailsModalContainer: {
    backgroundColor: 'white',
    width: '90%',
    maxHeight: '80%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  detailsModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#F9FAFB',
  },
  detailsModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  detailsModalContent: {
    padding: 20,
    maxHeight: 500,
  },
  detailsSection: {
    marginBottom: 24,
  },
  detailsSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailsLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  detailsValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  detailsHighlightValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 16,
  },
  timeBlock: {
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 12,
    minWidth: 80,
  },
  timeValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
  timeLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  timeExplanation: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },
  closeDetailButton: {
    backgroundColor: '#4A90E2',
    paddingVertical: 12,
    alignItems: 'center',
  },
  closeDetailButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  // ====== INÍCIO DOS ESTILOS AJUSTADOS PARA O IMPACTO FINANCEIRO ======
  impactContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  impactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12, // Aumentado o espaço abaixo do título
    paddingHorizontal: 4, // Alinhamento com o resto do card
  },
  impactTitle: {
    fontSize: 14, // Aumentado para melhor leitura
    color: '#374151', // Cor mais escura para destaque
    fontWeight: '600',
    marginLeft: 8,
  },
  impactList: { // NOVO: Container para os itens verticais
    flexDirection: 'column',
    gap: 8, // NOVO: Espaço entre os itens da lista
  },
  impactListItem: { // NOVO: Estilo para cada linha de impacto
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB', // Fundo sutil para destacar
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  impactLabel: { // AJUSTADO
    fontSize: 14,
    color: '#6B7280',
  },
  impactValue: { // AJUSTADO
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
  impactTimeContainer: { // Inalterado
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  impactTimeValue: { // AJUSTADO
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
  impactTimeUnit: { // AJUSTADO
    fontSize: 14,
    fontWeight: 'normal',
    color: '#6B7280',
  },
  // ESTILOS ANTIGOS (REMOVIDOS OU SUBSTITUÍDOS)
  /* impactRow: { ... },
  impactItem: { ... },
  impactDivider: { ... },
  */
  // ====== FIM DOS ESTILOS AJUSTADOS ======

  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderBottomColor: '#4A90E2',
  },
  tabIcon: {
    marginRight: 6,
  },
  tabText: {
    fontSize: 14,
    color: '#6B7280',
  },
  activeTabText: {
    color: '#4A90E2',
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  resumoContainer: {
    flex: 1,
    padding: 16,
  },
  infoCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  infoCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  infoText: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 8,
    lineHeight: 20,
  },
  graphContainer: {
    flex: 1,
    padding: 16,
  },
  itemsTabContainer: {
    flex: 1,
    padding: 16,
  },
});