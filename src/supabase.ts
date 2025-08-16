import "react-native-url-polyfill"
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://eyrpsaurzqydtnisfyul.supabase.co";
const SUPABASE_ANON_KEY =  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5cnBzYXVyenF5ZHRuaXNmeXVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU2ODgzOTgsImV4cCI6MjA2MTI2NDM5OH0.UxJ1ZBPV8_QeEQMCkLfbpbgPJOd_B9yTnyRr8AAEquo";

export const supabase = createClient(supabaseUrl, SUPABASE_ANON_KEY);

// --- Interfaces ---
export interface Supermercado { id: number; name: string; }
export interface Produto { id: number; name: string; type?: string; supermercado: number; }
export interface Marca { id: number; name: string; produto: number; }
export interface Preco {
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
  created_at: string;
  produtos: { name: string };
  marcas: { name: string };
}
export interface HistoricoCestaBasica {
  id?: number;
  valor: number;
  mes: number;
  ano: number;
  created_at?: string;
  items?: string;
}
export interface SalarioMinimo {
  id: number;
  valor: number;
  ano: number;
  created_at?: string;
}

// --- Funções CRUD (sem alterações) ---
export async function listSupermercados(): Promise<Supermercado[]> {
  const { data, error } = await supabase.from("supermercados").select("*");
  if (error) throw error;
  return data;
}
export async function addSupermercado(name: string) {
  const { error } = await supabase.from("supermercados").insert([{ name }]);
  if (error) throw error;
}
export async function listProdutos(superId: number): Promise<Produto[]> {
  const { data, error } = await supabase.from("produtos").select("*").eq("supermercado", superId);
  if (error) throw error;
  return data;
}
export async function addProduto(name: string, supermercado: number, type?: string) {
  const { error } = await supabase.from("produtos").insert([{ name, supermercado, type }]);
  if (error) throw error;
}
export async function listMarcas(prodId: number): Promise<Marca[]> {
  const { data, error } = await supabase.from("marcas").select("*").eq("produto", prodId);
  if (error) throw error;
  return data;
}
export async function addMarca(name: string, produto: number) {
  const { error } = await supabase.from("marcas").insert([{ name, produto }]);
  if (error) throw error;
}
export async function addPreco(supermercado: number, produto: number, marca: number, price: number) {
  const { error } = await supabase.from("precos").insert([{ supermercado, produto, marca, price }]);
  if (error) throw error;
}
export async function listPrecosProduto(supermercado: number, produto: number): Promise<Preco[]> {
  const { data, error } = await supabase.from('precos').select('*').eq('supermercado', supermercado).eq('produto', produto).order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}
export async function updatePreco(id: number, newPrice: number) {
  const { error } = await supabase.from('precos').update({ price: newPrice }).eq('id', id);
  if (error) throw error;
}
export async function updateProduto(id: number, newName: string, newType?: string) {
  const { error } = await supabase.from('produtos').update({ name: newName, ...(newType !== undefined ? { type: newType } : {}) }).eq('id', id);
  if (error) throw error;
}
export async function deleteProduto(id: number) {
  const { error } = await supabase.from('produtos').delete().eq('id', id);
  if (error) throw error;
}
export async function deleteMarca(id: number) {
  const { error } = await supabase.from('marcas').delete().eq('id', id);
  if (error) throw error;
}

// --- Otimizações e Cálculos da Cesta Básica ---

export const MULTIPLICADORES_CESTA: Record<string, number> = {
  'Carne': 6, 'Leite': 7.5, 'Feijão': 4.5, 'Arroz': 1, 'Farinha': 1.5,
  'Batata': 6, 'Tomate': 9, 'Pão': 6, 'Café': 1.2, 'Banana': 6.3,
  'Açúcar': 1, 'Óleo': 750, 'Manteiga': 750,
};

/**
 * CORRIGIDO: Busca todos os preços e produtos relevantes em duas consultas separadas e os junta no código.
 * Isso evita o erro de relacionamento e mantém a performance.
 */
async function getTodosOsPrecosComDetalhes(): Promise<{ price: number; supermercado: number; type: string | null }[]> {
  const { data: precos, error: precosError } = await supabase
    .from('precos')
    .select('price, supermercado, produto');

  if (precosError) {
    console.error("Erro ao buscar preços:", precosError);
    return [];
  }
  if (!precos) return [];

  const produtoIds = [...new Set(precos.map(p => p.produto))];
  
  const { data: produtos, error: produtosError } = await supabase
    .from('produtos')
    .select('id, type')
    .in('id', produtoIds);

  if (produtosError) {
    console.error("Erro ao buscar produtos:", produtosError);
    return [];
  }

  const produtoTypeMap = new Map(produtos.map(p => [p.id, p.type]));

  return precos.map(preco => ({
    price: preco.price,
    supermercado: preco.supermercado,
    type: produtoTypeMap.get(preco.produto) || null,
  }));
}


/**
 * OTIMIZADO: Calcula o valor total da cesta básica de forma eficiente.
 */
export async function calcularCestaBasica(): Promise<{
  valorTotal: number;
  itens: { tipo: string; quantidade: number; precoUnitario: number; precoTotal: number }[];
}> {
  const todosOsPrecos = await getTodosOsPrecosComDetalhes();
  
  if (todosOsPrecos.length === 0) {
    return { valorTotal: 0, itens: [] };
  }

  const itens = [];
  let valorTotalCesta = 0;

  for (const [tipo, multiplicador] of Object.entries(MULTIPLICADORES_CESTA)) {
    const precosDoTipo = todosOsPrecos.filter(p => p.type === tipo);

    if (precosDoTipo.length === 0) continue;

    const precosPorSupermercado = precosDoTipo.reduce((acc, item) => {
      const superId = item.supermercado;
      if (!acc[superId]) acc[superId] = [];
      acc[superId].push(item.price);
      return acc;
    }, {} as Record<number, number[]>);

    const mediasPorSupermercado = Object.values(precosPorSupermercado).map(precos => {
      const soma = precos.reduce((total, preco) => total + preco, 0);
      return soma / precos.length;
    });

    const mediaFinalTipo = mediasPorSupermercado.length > 0
      ? mediasPorSupermercado.reduce((total, media) => total + media, 0) / mediasPorSupermercado.length
      : 0;
      
    const precoTotalItem = mediaFinalTipo * multiplicador;
    valorTotalCesta += precoTotalItem;
    
    itens.push({
      tipo,
      quantidade: multiplicador,
      precoUnitario: mediaFinalTipo,
      precoTotal: precoTotalItem,
    });
  }
  
  return { valorTotal: valorTotalCesta, itens };
}


// --- Funções de Histórico e Salário Mínimo (sem alterações de lógica) ---
export async function salvarHistoricoCestaBasica(valor: number, itens: any[]): Promise<void> {
  const dataAtual = new Date();
  const mes = dataAtual.getMonth() + 1;
  const ano = dataAtual.getFullYear();
  const itemsJson = JSON.stringify(itens);

  const { data: registro } = await supabase
    .from('historico_cesta_basica').select('id').eq('mes', mes).eq('ano', ano).maybeSingle();

  if (registro) {
    await supabase.from('historico_cesta_basica').update({ valor, items: itemsJson }).eq('id', registro.id);
  } else {
    await supabase.from('historico_cesta_basica').insert([{ valor, mes, ano, items: itemsJson }]);
  }
}
export async function buscarHistoricoCestaBasica(): Promise<HistoricoCestaBasica[]> {
  const { data, error } = await supabase.from('historico_cesta_basica').select('*').order('ano', { ascending: false }).order('mes', { ascending: false });
  if (error) throw error;
  return data || [];
}
export async function buscarSalarioMinimo(): Promise<number> {
  const anoAtual = new Date().getFullYear();
  const { data, error } = await supabase.from('salario_minimo').select('valor').eq('ano', anoAtual).maybeSingle();
  if (error) throw error;
  return data?.valor || 1412;
}
export function calcularPorcentagemSalarioMinimo(valor: number, salarioMinimo: number): number {
  const salarioLiquido = salarioMinimo * 0.925;
  return (valor / salarioLiquido) * 100;
}
export function calcularSalarioMinimoNecessario(valor: number): number {
  return (valor / 0.239) * 3;
}
export function calcularTempoTrabalho(valor: number, salarioMinimo: number): { horas: number; minutos: number; segundos: number } {
  const valorHora = salarioMinimo / 220;
  const tempoTotalHoras = valor / valorHora;
  const horas = Math.floor(tempoTotalHoras);
  const minutos = Math.floor((tempoTotalHoras - horas) * 60);
  const segundos = Math.round(((tempoTotalHoras - horas) * 60 - minutos) * 60);
  return { horas, minutos, segundos };
}