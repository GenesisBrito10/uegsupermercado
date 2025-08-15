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
  Marca,
  updateMarca
} from '../supabase';
import { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Marcas'>;

export default function BrandScreen({ route }: Props) {
  const { supermarketId, productId, productName } = route.params;

  const [brands, setBrands] = useState<Marca[]>([]);
  const [priceMap, setPriceMap] = useState<Record<number, string>>({});
  const [priceIdMap, setPriceIdMap] = useState<Record<number, number>>({});
  const [newBrand, setNewBrand] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingName, setEditingName] = useState<Record<number, string>>({});

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
    setPriceMap(prev => ({ ...prev, [brandId]: text }));
  };

  const handleConfirm = async (brandId: number) => {
    const text = priceMap[brandId];
    const value = parseFloat(text);
    if (isNaN(value)) {
      return Alert.alert('Preço inválido');
    }
    if (priceIdMap[brandId]) {
      await updatePreco(priceIdMap[brandId], value);
      Alert.alert('✅ Preço atualizado!');
    } else {
      await addPreco(supermarketId, productId, brandId, value);
      Alert.alert('✅ Preço cadastrado!');
    }
    await loadData();
  };

  const startEdit = (id: number, name: string) => {
    setEditingName(prev => ({ ...prev, [id]: name }));
  };

  const confirmEdit = async (id: number) => {
    const text = editingName[id]?.trim();
    if (!text) return;
    await updateMarca(id, text);
    Alert.alert('✅ Marca atualizada');
    setEditingName(prev => {
      const { [id]: _, ...rest } = prev;
      return rest;
    });
    await loadData();
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
            {/* Nome da marca, editar e excluir */}
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center flex-1">
                <Icon name="tag" size={20} color="#4A90E2" />
                {editingName[item.id] !== undefined ? (
                  <TextInput
                    className="flex-1 bg-gray-100 border border-gray-200 rounded-xl py-1 px-2 text-gray-700 ml-3"
                    value={editingName[item.id]}
                    onChangeText={t => setEditingName(prev => ({ ...prev, [item.id]: t }))}
                  />
                ) : (
                  <Text className="text-lg font-semibold text-gray-800 ml-3">
                    {item.name}
                  </Text>
                )}
              </View>
              <View className="flex-row">
                {editingName[item.id] !== undefined ? (
                  <Pressable
                    onPress={() => confirmEdit(item.id)}
                    className="bg-green-500 rounded-full p-3 mr-2"
                  >
                    <Icon name="check" size={16} color="#FFF" />
                  </Pressable>
                ) : (
                  <Pressable
                    onPress={() => startEdit(item.id, item.name)}
                    className="bg-yellow-500 rounded-full p-3 mr-2"
                  >
                    <Icon name="pencil" size={16} color="#FFF" />
                  </Pressable>
                )}
                <Pressable
                  onPress={() => confirmarDeleteMarca(item.id)}
                  className="bg-red-500 rounded-full p-3"
                >
                  <Icon name="trash" size={16} color="#FFF" />
                </Pressable>
              </View>
            </View>

            {/* Input de preço + botão de confirmar */}
            <View className="flex-row items-center">
              <TextInput
                className="flex-1 bg-gray-100 border border-gray-200 rounded-xl py-2 px-3 text-gray-700"
                placeholder="Preço (ex: 12.50)"
                placeholderTextColor="#A0A0A0"
                keyboardType="numeric"
                value={priceMap[item.id] || ''}
                onChangeText={text => handlePriceChange(item.id, text)}
              />
              <Pressable
                onPress={() => handleConfirm(item.id)}
                className="ml-3 bg-green-500 rounded-full p-3 shadow-md"
              >
                <Icon name="check" size={16} color="#FFF" />
              </Pressable>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}
