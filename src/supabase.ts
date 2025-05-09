import "react-native-url-polyfill"
import { createClient } from "@supabase/supabase-js";


const supabaseUrl = "https://eyrpsaurzqydtnisfyul.supabase.co";
const SUPABASE_ANON_KEY =  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5cnBzYXVyenF5ZHRuaXNmeXVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU2ODgzOTgsImV4cCI6MjA2MTI2NDM5OH0.UxJ1ZBPV8_QeEQMCkLfbpbgPJOd_B9yTnyRr8AAEquo";

export const supabase = createClient(supabaseUrl, SUPABASE_ANON_KEY);

// Modelos TS
export interface Supermercado { id: number; name: string; }
export interface Produto     { id: number; name: string; supermercado: number; }
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
export async function addProduto(name: string, supermercado: number) {
  const { error } = await supabase
    .from("produtos")
    .insert([{ name, supermercado }]);
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
  const { error } = await supabase
    .from("precos")
    .insert([{ supermercado, produto, marca, price }]);
  if (error) throw error;
}
export async function listPrecos(): Promise<Preco[]> {
  const { data, error } = await supabase
    .from("precos")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
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
  const { error } = await supabase
    .from('precos')
    .update({ price: newPrice })
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