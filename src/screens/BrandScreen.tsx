// src/screens/BrandScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  TextInput,
  View,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/FontAwesome';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  listMarcas,
  addMarca,
  addPreco,
  listPrecosProduto,
  updatePreco,
  deleteMarca,
  Marca
} from '../supabase';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useNavigation } from '@react-navigation/native';

type Props = NativeStackScreenProps<RootStackParamList, 'Marcas'>;

export default function BrandScreen({ route }: Props) {
  const navigation = useNavigation();
  const { supermarketId, productId, productName } = route.params;

  const [brands, setBrands] = useState<Marca[]>([]);
  const [priceMap, setPriceMap] = useState<Record<number, string>>({});
  const [priceIdMap, setPriceIdMap] = useState<Record<number, number>>({});
  const [isUpdating, setIsUpdating] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [debounceTimeout, setDebounceTimeout] = useState<NodeJS.Timeout | null>(null);
  const [newBrand, setNewBrand] = useState('');
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);
    try {
      const [marcas, precos] = await Promise.all([
        listMarcas(productId),
        listPrecosProduto(supermarketId, productId)
      ]);
      setBrands(marcas);

      const pm: Record<number, string> = {};
      const pidm: Record<number, number> = {};
      for (const marca of marcas) {
        const entry = precos.find(p => p.marca === marca.id);
        if (entry) {
          pm[marca.id] = entry.price.toString();
          pidm[marca.id] = entry.id;
        }
      }
      setPriceMap(pm);
      setPriceIdMap(pidm);
    } catch (err) {
      Alert.alert('Erro ao carregar dados');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function criarMarca() {
    if (!newBrand.trim()) return;
    await addMarca(newBrand.trim(), productId);
    setNewBrand('');
    await loadData();
  }

  function confirmarDeleteMarca(id: number) {
    Alert.alert(
      'Excluir marca',
      'Deseja realmente excluir esta marca e todos os seus preços?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            await deleteMarca(id);
            Alert.alert('Marca excluída');
            await loadData();
          }
        }
      ]
    );
  }

  const handlePriceChange = (brandId: number, text: string) => {
    // Substitui vírgula por ponto para garantir compatibilidade com parseFloat
    const sanitizedText = text.replace(',', '.');
    
    // Validação para permitir apenas números e um único ponto decimal
    if (sanitizedText === '' || /^\d*\.?\d*$/.test(sanitizedText)) {
      setPriceMap(prev => ({ ...prev, [brandId]: sanitizedText }));
      
      // Cancel previous timeout
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
      
      // Set a new timeout to auto-save after 1000ms of inactivity
      const timeout = setTimeout(() => {
        // Only proceed if the value is a valid number
        const value = parseFloat(sanitizedText);
        if (!isNaN(value)) {
          autoSavePrice(brandId, value);
        }
      }, 1000);
      
      setDebounceTimeout(timeout);
    }
  };

  const autoSavePrice = async (brandId: number, value: number) => {
    // Prevent multiple simultaneous updates
    if (isUpdating) return;
    
    try {
      setIsUpdating(true);
      setUpdatingId(brandId);
      
      if (priceIdMap[brandId]) {
        await updatePreco(priceIdMap[brandId], value);
        // Update quietly without alerts
      } else {
        await addPreco(supermarketId, productId, brandId, value);
        // Show alert only on first save
        Alert.alert('✅ Preço cadastrado!');
      }
      await loadData();
    } catch (error) {
      console.error('Erro ao salvar preço:', error);
      Alert.alert('Erro ao salvar preço');
    } finally {
      setIsUpdating(false);
      setUpdatingId(null);
    }
  };

  // We don't need handleConfirm anymore as prices are saved automatically
  // But we'll keep a modified version for manual confirmation if needed
  const handleManualConfirm = async (brandId: number) => {
    const text = priceMap[brandId];
    const value = parseFloat(text);
    if (isNaN(value)) {
      return Alert.alert('Preço inválido');
    }
    
    autoSavePrice(brandId, value);
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
      {/* Cabeçalho */}
      <Text className="text-3xl font-extrabold text-gray-800 mb-2">
        📦 {productName}
      </Text>
      <Text className="text-xl font-semibold text-gray-700 mb-4">
        Marcas & Preços
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

      {/* Input de nova marca + botão de adicionar */}
      <View className="flex-row mb-6 items-center">
        <TextInput
          className="flex-1 bg-white border border-gray-200 rounded-2xl py-3 px-4 text-gray-700 shadow-sm"
          placeholder="Nova marca..."
          placeholderTextColor="#A0A0A0"
          value={newBrand}
          onChangeText={setNewBrand}
        />
        <Pressable
          onPress={criarMarca}
          className="ml-3 bg-blue-600 rounded-full p-3 shadow-md"
        >
          <Icon name="plus" size={18} color="#FFF" />
        </Pressable>
      </View>

      {/* Lista de marcas */}
      <FlatList
        data={brands}
        keyExtractor={item => item.id.toString()}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View className="bg-white p-4 rounded-2xl mb-4 shadow-md">
            {/* Nome da marca e botão de excluir */}
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center">
                <Icon name="tag" size={20} color="#4A90E2" />
                <Text className="text-lg font-semibold text-gray-800 ml-3">
                  {item.name}
                </Text>
              </View>
              <Pressable
                onPress={() => confirmarDeleteMarca(item.id)}
                className="bg-red-500 rounded-full p-3"
              >
                <Icon name="trash" size={16} color="#FFF" />
              </Pressable>
            </View>

            {/* Input de preço com indicador de salvamento automático */}
            <View className="flex-row items-center">
              <View className="flex-1 relative">
                <TextInput
                  className="flex-1 bg-gray-100 border border-gray-200 rounded-xl py-2 px-3 text-gray-700"
                  placeholder="Preço (ex: 12.50)"
                  placeholderTextColor="#A0A0A0"
                  keyboardType="decimal-pad"
                  value={priceMap[item.id] || ''}
                  onChangeText={text => handlePriceChange(item.id, text)}
                />
                {updatingId === item.id && (
                  <View className="absolute right-3 top-2">
                    <ActivityIndicator size="small" color="#4A90E2" />
                  </View>
                )}
              </View>
              {parseFloat(priceMap[item.id] || '0') > 0 && (
                <Text className="ml-2 text-green-600">
                  <Icon name="check" size={16} />
                </Text>
              )}
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}
