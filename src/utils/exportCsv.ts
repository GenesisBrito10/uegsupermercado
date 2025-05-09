// src/utils/exportCsv.ts
import * as FileSystem from 'expo-file-system';
import { listPrecosPorSuper, PrecoDetail } from '../supabase';

/**
 * Gera um arquivo CSV com BOM para corretamente exibir acentos.
 */
export async function exportSupermarketCsv(
  supermarketId: number,
  supermarketName: string
): Promise<string> {
  // 1. Busca todos os preços com produto e marca
  const items: PrecoDetail[] = await listPrecosPorSuper(supermarketId);

  // 2. Monta o conteúdo CSV
  const header = ['Produto', 'Marca', 'Preço', 'Data'];
  const rows = items.map(item => [
    item.produtos.name,
    item.marcas.name,
    item.price.toFixed(2),
    new Date(item.created_at).toLocaleString()
  ]);

  // 3. Função de escape de aspas
  const esc = (field: string) => `"${field.replace(/"/g, '""')}"`;

  // 4. Conteúdo sem BOM
  const csvContent = [
    header.map(esc).join(','),
    ...rows.map(r => r.map(esc).join(','))
  ].join('\n');

  // 5. Prefixa BOM (\uFEFF)
  const bom = '\uFEFF';
  const csvWithBom = bom + csvContent;

  // 6. Define URI do arquivo
  const safeName = supermarketName
    .normalize('NFD')               // separa diacríticos
    .replace(/[\u0300-\u036f]/g, '')// remove acentos do nome do arquivo
    .replace(/[^a-z0-9]/gi, '_')
    .toLowerCase();
  const fileUri = `${FileSystem.documentDirectory}${safeName}.csv`;

  // 7. Escreve com UTF-8
  await FileSystem.writeAsStringAsync(
    fileUri,
    csvWithBom,
    { encoding: FileSystem.EncodingType.UTF8 }
  );

  return fileUri;
}
