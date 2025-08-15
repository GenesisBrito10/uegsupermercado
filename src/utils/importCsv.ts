import { supabase } from '../supabase';

async function findOrCreateSupermarket(name: string): Promise<number> {
  const { data } = await supabase
    .from('supermercados')
    .select('id')
    .eq('name', name)
    .maybeSingle();
  if (data) return data.id;
  const { data: inserted, error } = await supabase
    .from('supermercados')
    .insert([{ name }])
    .select('id')
    .single();
  if (error) throw error;
  return inserted.id;
}

async function findOrCreateProduto(name: string, supermercado: number): Promise<number> {
  const { data } = await supabase
    .from('produtos')
    .select('id')
    .eq('name', name)
    .eq('supermercado', supermercado)
    .maybeSingle();
  if (data) return data.id;
  const { data: inserted, error } = await supabase
    .from('produtos')
    .insert([{ name, supermercado }])
    .select('id')
    .single();
  if (error) throw error;
  return inserted.id;
}

async function findOrCreateMarca(name: string, produto: number): Promise<number> {
  const { data } = await supabase
    .from('marcas')
    .select('id')
    .eq('name', name)
    .eq('produto', produto)
    .maybeSingle();
  if (data) return data.id;
  const { data: inserted, error } = await supabase
    .from('marcas')
    .insert([{ name, produto }])
    .select('id')
    .single();
  if (error) throw error;
  return inserted.id;
}

/**
 * Importa dados de uma planilha CSV com colunas:
 * Supermercado;Produto;Marca
 * A coluna Marca pode conter várias marcas separadas por vírgula.
 */
export async function importSpreadsheet(csv: string) {
  const lines = csv.trim().split(/\r?\n/);
  if (lines.length <= 1) return;
  lines.shift(); // remove cabeçalho
  for (const line of lines) {
    if (!line.trim()) continue;
    const [superName, productName, brandField] = line.split(';');
    if (!superName || !productName) continue;
    const superId = await findOrCreateSupermarket(superName.trim());
    const prodId = await findOrCreateProduto(productName.trim(), superId);
    const brands = (brandField || '')
      .split(',')
      .map(b => b.trim())
      .filter(Boolean);
    for (const brand of brands) {
      await findOrCreateMarca(brand, prodId);
    }
  }
}
