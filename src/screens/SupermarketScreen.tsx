// src/screens/SupermarketScreen.tsx
import React, { useEffect, useState } from 'react';
import { FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/FontAwesome';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { listSupermercados, addSupermercado, Supermercado } from '../supabase';
import { RootStackParamList } from '../navigation/AppNavigator';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { importSpreadsheet } from '../utils/importCsv';

type Props = NativeStackScreenProps<RootStackParamList, 'Supermercados'>;

export default function SupermarketScreen({ navigation }: Props) {
  const [list, setList] = useState<Supermercado[]>([]);
  const [novo, setNovo] = useState('');
  const [local, setLocal] = useState('');

  async function load() {
    setList(await listSupermercados());
  }
  useEffect(() => { load(); }, []);

  async function criar() {
    if (!novo.trim()) return;
    await addSupermercado(novo.trim(), local.trim());
    setNovo('');
    setLocal('');
    load();
  }

  async function handleImport() {
    const result = await DocumentPicker.getDocumentAsync({ type: 'text/csv' });
    if (result.canceled) return;
    const file = result.assets[0];
    const content = await FileSystem.readAsStringAsync(file.uri, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    await importSpreadsheet(content);
    load();
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50 px-6 pt-4">
      <Text className="text-3xl font-extrabold text-gray-800 mb-6">
        🛒 Supermercados
      </Text>

      <Pressable
        onPress={handleImport}
        className="bg-purple-600 rounded-full p-3 mb-4 shadow-md"
      >
        <Text className="text-white text-center font-semibold">Importar Planilha</Text>
      </Pressable>

      <View className="mb-6">
        <View className="flex-row items-center mb-3">
          <TextInput
            className="flex-1 bg-white border border-gray-200 rounded-2xl py-3 px-4 text-gray-700 shadow-sm"
            placeholder="Nome do supermercado..."
            placeholderTextColor="#A0A0A0"
            value={novo}
            onChangeText={setNovo}
          />
        </View>
        <View className="flex-row items-center">
          <TextInput
            className="flex-1 bg-white border border-gray-200 rounded-2xl py-3 px-4 text-gray-700 shadow-sm"
            placeholder="Localização..."
            placeholderTextColor="#A0A0A0"
            value={local}
            onChangeText={setLocal}
          />
          <Pressable
            onPress={criar}
            className="ml-3 bg-blue-600 rounded-full p-3 shadow-md"
          >
            <Icon name="plus" size={16} color="#FFF" />
          </Pressable>
        </View>
      </View>

      <FlatList
        data={list}
        keyExtractor={i => i.id.toString()}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View className="bg-white p-4 rounded-2xl mb-4 shadow-md flex-row items-center justify-between">
            <Pressable
              onPress={() =>
                navigation.navigate('Produtos', {
                  supermarketId: item.id,
                  supermarketName: item.name,
                  supermarketLocation: item.location ?? '',
                })
              }
              className="flex-row items-center flex-1"
            >
              <Icon name="building" size={20} color="#4A90E2" />
              <Text className="text-lg font-semibold text-gray-800 ml-3">
                {item.name}
              </Text>
            </Pressable>
            <Pressable
              onPress={() =>
                navigation.navigate('Visão Geral', {
                  supermarketId: item.id,
                  supermarketName: item.name,
                  supermarketLocation: item.location ?? '',
                })
              }
              className="ml-3 bg-green-500 rounded-full p-3"
            >
              <Icon name="info" size={16} color="#FFF" />
            </Pressable>
          </View>
        )}
      />
    </SafeAreaView>
  );
}
