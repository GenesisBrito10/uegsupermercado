// src/screens/SupermarketScreen.tsx
import React, { useEffect, useState } from 'react';
import { FlatList, Pressable, Text, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/FontAwesome';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { listSupermercados, addSupermercado, Supermercado } from '../supabase';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useNavigation } from '@react-navigation/native';

type Props = NativeStackScreenProps<RootStackParamList, 'Supermercados'>;

export default function SupermarketScreen({ navigation }: Props) {
  const [list, setList] = useState<Supermercado[]>([]);
  const [novo, setNovo] = useState('');

  async function load() {
    setList(await listSupermercados());
  }
  useEffect(() => { load(); }, []);

  async function criar() {
    if (!novo.trim()) return;
    await addSupermercado(novo.trim());
    setNovo('');
    load();
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50 px-6 pt-4">
      <Text className="text-3xl font-extrabold text-gray-800 mb-2">
        Supermercados
      </Text>
      <Text className="text-xl font-semibold text-gray-700 mb-4">
        Lista de estabelecimentos
      </Text>

      {/* Botão de voltar para o menu */}
      <Pressable
        className="bg-blue-500 rounded-full py-3 px-5 mb-6 flex-row items-center justify-center"
        onPress={() => navigation.navigate('Home' as never)}
      >
        <Icon name="arrow-left" size={16} color="#FFFFFF" />
        <Text className="text-white font-bold ml-2">Voltar ao Menu</Text>
      </Pressable>

      <Pressable className="flex-row mb-6 items-center">
        <TextInput
          className="flex-1 bg-white border border-gray-200 rounded-2xl py-3 px-4 text-gray-700 shadow-sm"
          placeholder="Adicionar novo..."
          placeholderTextColor="#A0A0A0"
          value={novo}
          onChangeText={setNovo}
        />
        
        <Pressable
          onPress={criar}
          className="ml-3 bg-blue-600 rounded-full p-3 shadow-md"
        >
          <Icon name="plus" size={16} color="#FFF" />
        </Pressable>
      </Pressable>

      <FlatList
        data={list}
        keyExtractor={i => i.id.toString()}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <Pressable
            onPress={() =>
              navigation.navigate('Produtos', {
                supermarketId: item.id,
                supermarketName: item.name,
              })
            }
            className="bg-white p-4 rounded-2xl mb-4 shadow-md flex-row items-center"
          >
            <Icon name="building" size={20} color="#4A90E2" />
            <Text className="text-lg font-semibold text-gray-800 ml-3">
              {item.name}
            </Text>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}
