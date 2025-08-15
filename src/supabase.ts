import "react-native-url-polyfill"
import { createClient } from "@supabase/supabase-js";


const supabaseUrl = "https://eyrpsaurzqydtnisfyul.supabase.co";
const SUPABASE_ANON_KEY =  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5cnBzYXVyenF5ZHRuaXNmeXVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU2ODgzOTgsImV4cCI6MjA2MTI2NDM5OH0.UxJ1ZBPV8_QeEQMCkLfbpbgPJOd_B9yTnyRr8AAEquo";

export const supabase = createClient(supabaseUrl, SUPABASE_ANON_KEY);

// Modelos TS
export interface Supermercado { id: number; name: string; }
export interface Produto     { id: number; name: string; type?: string; supermercado: number; }
export interface Marca        { id: number; name: string; produto: number; }
export interface Preco        {
  id: number;
  supermercado: number;
  produto: number;
  marca: number;
  price: number;
  created_at: string;
}

export interface PrecoDetail {
  id: number;
  price: number;
  produto: number;
  marca: number;
  created_at: string;
  produtos: { name: string }[];  // nome do produto
  marcas:   { name: string }[];  // nome da marca
}

// Interface para o histórico da cesta básica
export interface HistoricoCestaBasica {
  id?: number;
  valor: number;
  mes: number;
  ano: number;
  created_at?: string;
  items?: string; // JSON string com os itens da cesta
}

// Interface para o salário mínimo
export interface SalarioMinimo {
  id: number;
  valor: number;
  ano: number;
  created_at?: string;
}

// CRUD
export async function listSupermercados(): Promise<Supermercado[]> {
  const { data, error } = await supabase
    .from("supermercados")
    .select("*");
  if (error) throw error;
  return data;
}
export async function addSupermercado(name: string) {
  const { error } = await supabase
    .from("supermercados")
    .insert([{ name }]);
  if (error) throw error;
}

export async function listProdutos(superId: number): Promise<Produto[]> {
  const { data, error } = await supabase
    .from("produtos")
    .select("*")
    .eq("supermercado", superId);
  if (error) throw error;
  return data;
}

// Função auxiliar para ajustar o timestamp (3 horas a menos)
function ajustarTimestamp(): string {
  const data = new Date();
  data.setHours(data.getHours() - 3);
  return data.toISOString();
}

export async function addProduto(name: string, supermercado: number, type?: string) {
  const timestamp = ajustarTimestamp();
  const { error } = await supabase
    .from("produtos")
    .insert([{ 
      name, 
      supermercado, 
      type,
      created_at: timestamp 
    }]);
  if (error) throw error;
}

export async function listMarcas(prodId: number): Promise<Marca[]> {
  const { data, error } = await supabase
    .from("marcas")
    .select("*")
    .eq("produto", prodId);
  if (error) throw error;
  return data;
}
export async function addMarca(name: string, produto: number) {
  const { error } = await supabase
    .from("marcas")
    .insert([{ name, produto }]);
  if (error) throw error;
}

export async function addPreco(
  supermercado: number,
  produto: number,
  marca: number,
  price: number
) {
  const timestamp = ajustarTimestamp();
  const { error } = await supabase
    .from("precos")
    .insert([{ 
      supermercado, 
      produto, 
      marca, 
      price,
      created_at: timestamp 
    }]);
  if (error) throw error;
}
export async function listPrecos(): Promise<Preco[]> {
  const { data, error } = await supabase
    .from("precos")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
}


export async function listPrecosPorSuper(supermercado: number): Promise<PrecoDetail[]> {
  const { data, error } = await supabase
    .from('precos')
    .select('id, price, produto, marca, created_at, produtos(name), marcas(name)')
    .eq('supermercado', supermercado);
    if (error) throw error;
  return data;
}

export async function listPrecosProduto(
  supermercado: number,
  produto: number
): Promise<Preco[]> {
  const { data, error } = await supabase
    .from('precos')
    .select('*')
    .eq('supermercado', supermercado)
    .eq('produto', produto)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function updatePreco(id: number, newPrice: number) {
  const timestamp = ajustarTimestamp();
  const { error } = await supabase
    .from('precos')
    .update({ 
      price: newPrice,
      created_at: timestamp 
    })
    .eq('id', id);
  if (error) throw error;
}

export async function updateProduto(id: number, newName: string, newType?: string) {
  const { error } = await supabase
    .from('produtos')
    .update({ name: newName, ...(newType !== undefined ? { type: newType } : {}) })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteProduto(id: number) {
  const { error } = await supabase
    .from('produtos')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

export async function deleteMarca(id: number) {
  const { error } = await supabase
    .from('marcas')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// Salva o valor da cesta básica no histórico
export async function salvarHistoricoCestaBasica(
  valor: number,
  itens: {
    tipo: string;
    quantidade: number;
    precoUnitario: number;
    precoTotal: number;
  }[]
): Promise<void> {
  const dataAtual = new Date();
  const mes = dataAtual.getMonth() + 1; // Janeiro é 0, então somamos 1
  const ano = dataAtual.getFullYear();
  
  // Verificar se já existe um registro para este mês/ano
  const { data: registroExistente } = await supabase
    .from('historico_cesta_basica')
    .select('id')
    .eq('mes', mes)
    .eq('ano', ano)
    .maybeSingle();
  
  const timestamp = ajustarTimestamp();
  const itemsJson = JSON.stringify(itens);
  
  if (registroExistente) {
    // Atualizar registro existente
    await supabase
      .from('historico_cesta_basica')
      .update({
        valor,
        items: itemsJson,
        created_at: timestamp
      })
      .eq('id', registroExistente.id);
  } else {
    // Criar novo registro
    await supabase
      .from('historico_cesta_basica')
      .insert([{
        valor,
        mes,
        ano,
        items: itemsJson,
        created_at: timestamp
      }]);
  }
}

// Busca o histórico da cesta básica
export async function buscarHistoricoCestaBasica(): Promise<HistoricoCestaBasica[]> {
  const { data, error } = await supabase
    .from('historico_cesta_basica')
    .select('*')
    .order('ano', { ascending: false })
    .order('mes', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

// Multiplicadores da cesta básica por tipo de produto
export const MULTIPLICADORES_CESTA = {
  'Carne': 6,
  'Leite': 7.5,
  'Feijão': 4.5,
  'Arroz': 1,
  'Farinha': 1.5,
  'Batata': 6,
  'Tomate': 9,
  'Pão': 6,
  'Café': 1.2,
  'Banana': 6.3,
  'Açúcar': 1,
  'Óleo': 750,
  'Manteiga': 750,
};

// Busca produtos por tipo
export async function getProdutosPorTipo(tipo: string): Promise<Produto[]> {
  const { data, error } = await supabase
    .from('produtos')
    .select('*')
    .eq('type', tipo);
  
  if (error) throw error;
  return data || [];
}

// Busca preços de produtos por tipo
export async function getPrecosPorTipoDeProduto(tipo: string): Promise<{
  produto: Produto;
  marca: Marca;
  preco: Preco;
}[]> {
  // Primeiro buscar todos os produtos do tipo
  const produtos = await getProdutosPorTipo(tipo);
  
  if (produtos.length === 0) return [];
  
  const resultado: {produto: Produto; marca: Marca; preco: Preco}[] = [];
  
  // Para cada produto, buscar suas marcas e preços
  for (const produto of produtos) {
    const { data: marcas } = await supabase
      .from('marcas')
      .select('*')
      .eq('produto', produto.id);
      
    if (!marcas || marcas.length === 0) continue;
    
    for (const marca of marcas) {
      const { data: precos } = await supabase
        .from('precos')
        .select('*')
        .eq('marca', marca.id)
        .order('created_at', { ascending: false })
        .limit(1);
        
      if (precos && precos.length > 0) {
        resultado.push({
          produto,
          marca,
          preco: precos[0]
        });
      }
    }
  }
  
  return resultado;
}

// Calcula os valores da cesta básica
export async function calcularCestaBasica(): Promise<{
  valorTotal: number;
  itens: {
    tipo: string;
    quantidade: number;
    precoUnitario: number;
    precoTotal: number;
  }[];
}> {
  const tipos = Object.keys(MULTIPLICADORES_CESTA);
  const itens: {
    tipo: string;
    quantidade: number;
    precoUnitario: number;
    precoTotal: number;
  }[] = [];
  
  let valorTotal = 0;

  // Para cada tipo de produto na cesta básica
  for (const tipo of tipos) {
    const dadosTipo = await getPrecosPorTipoDeProduto(tipo);
    
    if (dadosTipo.length === 0) continue;
    
    // Calcular média por supermercado
    const precoPorSupermercado: Record<number, number[]> = {};
    
    for (const item of dadosTipo) {
      const superId = item.preco.supermercado;
      if (!precoPorSupermercado[superId]) {
        precoPorSupermercado[superId] = [];
      }
      precoPorSupermercado[superId].push(item.preco.price);
    }
    
    // Calcular média de cada supermercado
    const mediasPorSupermercado = Object.values(precoPorSupermercado).map(precos => {
      if (precos.length === 0) return 0;
      const soma = precos.reduce((total, preco) => total + preco, 0);
      return soma / precos.length;
    });
    
    // Calcular média das médias
    let mediaFinal = 0;
    if (mediasPorSupermercado.length > 0) {
      const somaMedias = mediasPorSupermercado.reduce((total, media) => total + media, 0);
      mediaFinal = somaMedias / mediasPorSupermercado.length;
    }
    
    // Aplicar multiplicador
    const multiplicador = MULTIPLICADORES_CESTA[tipo as keyof typeof MULTIPLICADORES_CESTA];
    const precoTotal = mediaFinal * multiplicador;
    
    valorTotal += precoTotal;
    
    itens.push({
      tipo,
      quantidade: multiplicador,
      precoUnitario: mediaFinal,
      precoTotal
    });
  }
  
  return { valorTotal, itens };
}

// Busca o salário mínimo atual
export async function buscarSalarioMinimo(): Promise<number> {
  const anoAtual = new Date().getFullYear();
  
  const { data, error } = await supabase
    .from('salario_minimo')
    .select('valor')
    .eq('ano', anoAtual)
    .maybeSingle();
  
  if (error) throw error;
  
  // Valor padrão caso não encontre na tabela
  return data?.valor || 1412;
}

// Calcular porcentagem do salário mínimo
export function calcularPorcentagemSalarioMinimo(valor: number, salarioMinimo: number): number {
  // Salário líquido considerando 7.5% de desconto do INSS
  const salarioLiquido = salarioMinimo * 0.925;
  return (valor / salarioLiquido) * 100;
}

export function calcularSalarioMinimoNecessario(valor: number): number {
  return (valor/0.239)*3;
}

// Calcular tempo de trabalho em horas, minutos e segundos
export function calcularTempoTrabalho(valor: number, salarioMinimo: number): {
  horas: number;
  minutos: number;
  segundos: number;
} {
  // Salário dividido por 220 horas mensais = valor da hora de trabalho
  const valorHora = salarioMinimo / 220;
  
  // Tempo em horas
  const tempoTotalHoras = valor / valorHora;
  
  // Converter para horas, minutos e segundos
  const horas = Math.floor(tempoTotalHoras);
  const minutos = Math.floor((tempoTotalHoras - horas) * 60);
  const segundos = Math.floor(((tempoTotalHoras - horas) * 60 - minutos) * 60);
  
  return { horas, minutos, segundos };
}