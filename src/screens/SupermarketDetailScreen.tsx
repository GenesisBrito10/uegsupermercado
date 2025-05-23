import React, { useEffect, useState } from 'react';
import { SectionList, Text, View, ActivityIndicator, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/FontAwesome';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { listPrecosPorSuper, PrecoDetail } from '../supabase';
import { exportSupermarketCsv } from '../utils/exportCsv';
import * as Sharing from 'expo-sharing';

type Props = NativeStackScreenProps<RootStackParamList, 'Visão Geral'>;

interface SectionData {
  title: string;
  data: { brand: string; price: number }[];
}

export default function SupermarketDetailScreen({ route }: Props) {
  const { supermarketId, supermarketName } = route.params;
  const [sections, setSections] = useState<SectionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const all: PrecoDetail[] = await listPrecosPorSuper(supermarketId);
        const grouped = all.reduce<SectionData[]>((acc, item) => {
          const prodName = item.produtos.name;
          const entry = { brand: item.marcas.name, price: item.price };
          const section = acc.find(s => s.title === prodName);
          if (section) section.data.push(entry);
          else acc.push({ title: prodName, data: [entry] });
          return acc;
        }, []);
        setSections(grouped);
      } catch (err) {
        console.error(err);
        Alert.alert('Erro ao carregar dados');
      } finally {
        setLoading(false);
      }
    })();
  }, [supermarketId]);

  /**
   * Gera e compartilha o arquivo CSV
   */
  const handleExport = async () => {
    setExporting(true);
    try {
      const uri = await exportSupermarketCsv(supermarketId, supermarketName);
      await Sharing.shareAsync(uri, { mimeType: 'text/csv' });
    } catch (err) {
      console.error(err);
      Alert.alert('Erro ao exportar CSV');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#4A90E2" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50 px-6 pt-4">
      {/* Header do supermercado */}
      <View className="bg-white p-4 rounded-2xl mb-4 shadow-md flex-row justify-between items-center">
        <View>
          <Text className="text-2xl font-bold text-gray-800">{supermarketName}</Text>
          <Text className="text-sm text-gray-500">{sections.length} produtos</Text>
        </View>
        <Icon name="shopping-basket" size={32} color="#4A90E2" />
      </View>

      {/* Botão Exportar CSV */}
      <Pressable
        onPress={handleExport}
        disabled={exporting}
        className="mb-6 bg-purple-600 rounded-full py-3 px-6 shadow-md flex-row justify-center items-center"
      >
        {exporting ? (
          <ActivityIndicator size="small" color="#FFF" />
        ) : (
          <>
            <Icon name="download" size={18} color="#FFF" />
            <Text className="text-white font-semibold ml-2">Exportar CSV</Text>
          </>
        )}
      </Pressable>

      {/* Lista seccionada de produtos e marcas */}
      <SectionList
        sections={sections}
        keyExtractor={(item, idx) => item.brand + idx}
        renderSectionHeader={({ section: { title } }) => (
          <View className="flex-row items-center mb-2 mt-4">
            <Icon name="cube" size={20} color="#4A90E2" />
            <Text className="ml-2 text-lg font-semibold text-gray-800">{title}</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <View className="bg-white p-4 rounded-2xl mb-3 shadow-sm flex-row justify-between items-center">
            <View className="flex-row items-center">
              <Icon name="tag" size={16} color="#7B61FF" />
              <Text className="ml-2 text-base font-medium text-gray-800">{item.brand}</Text>
            </View>
            <View className="flex-row items-center">
              <Icon name="dollar" size={14} color="#4A90E2" />
              <Text className="ml-1 text-base font-semibold text-gray-800">R$ {item.price.toFixed(2)}</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={() => (
          <Text className="text-center text-gray-500 mt-10">Nenhum preço cadastrado ainda.</Text>
        )}
      />
    </SafeAreaView>
  );
}