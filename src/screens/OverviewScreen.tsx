import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Text,
  View,
  StyleSheet,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/FontAwesome';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  listPrecosPorSuper,
  PrecoDetail,
} from '../supabase';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useNavigation } from '@react-navigation/native';

type Props = NativeStackScreenProps<RootStackParamList, 'Visão Geral'>;

export default function OverviewScreen({ route }: Props) {
  const navigation = useNavigation();
  const { supermarketId, supermarketName } = route.params;
  const [items, setItems] = useState<PrecoDetail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const data = await listPrecosPorSuper(supermarketId);
        setItems(data || []);
      } catch (error) {
        console.error('Erro ao carregar preços:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [supermarketId]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#4A90E2" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50 px-6 pt-4">
      <Text className="text-3xl font-extrabold text-gray-800 mb-2">
        🏬 {supermarketName}
      </Text>
      <Text className="text-xl font-semibold text-gray-700 mb-4">
        Visão Geral de Preços
      </Text>

      {/* Botões de navegação */}
      <View className="flex-row mb-6">
        <Pressable
          onPress={() => navigation.goBack()}
          className="bg-gray-500 rounded-full py-3 px-5 mr-2 flex-1 flex-row items-center justify-center"
        >
          <Icon name="arrow-left" size={16} color="#FFFFFF" />
          <Text className="text-white font-bold ml-2">Voltar</Text>
        </Pressable>
        
        <Pressable
          onPress={() => navigation.navigate('Home' as never)}
          className="bg-blue-500 rounded-full py-3 px-5 flex-1 flex-row items-center justify-center"
        >
          <Icon name="home" size={16} color="#FFFFFF" />
          <Text className="text-white font-bold ml-2">Menu Principal</Text>
        </Pressable>
      </View>

      {items.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <Icon name="inbox" size={50} color="#CBD5E0" />
          <Text className="text-gray-500 mt-4 text-center">
            Não há preços cadastrados para este supermercado
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const produtoNome = item.produtos && item.produtos[0]?.name || 'Produto';
            const marcaNome = item.marcas && item.marcas[0]?.name || 'Marca';
            
            return (
              <View className="bg-white p-4 rounded-2xl mb-4 shadow-md">
                <View className="flex-row justify-between items-start">
                  <View>
                    <Text className="text-lg font-bold text-gray-800">{produtoNome}</Text>
                    <Text className="text-sm text-gray-600 mt-1">{marcaNome}</Text>
                  </View>
                  <View className="bg-blue-100 px-3 py-1 rounded-full">
                    <Text className="text-blue-700 font-bold">
                      R$ {parseFloat(item.price.toString()).toFixed(2).replace('.', ',')}
                    </Text>
                  </View>
                </View>
                <Text className="text-xs text-gray-500 mt-3">
                  Atualizado em: {new Date(item.created_at).toLocaleDateString()}
                </Text>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}
