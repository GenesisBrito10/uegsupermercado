// src/screens/ProductScreen.tsx
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    Text,
    TextInput,
    View,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/FontAwesome';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
    listProdutos,
    addProduto,
    deleteProduto,
    Produto,
} from '../supabase';
import { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Produtos'>;

export default function ProductScreen({ route, navigation }: Props) {
    const { supermarketId, supermarketName, supermarketLocation } = route.params;
    const [list, setList] = useState<Produto[]>([]);
    const [novo, setNovo] = useState('');
    const [tipo, setTipo] = useState('');
    const [loading, setLoading] = useState(false);

    async function load() {
        setLoading(true);
        try {
            const data = await listProdutos(supermarketId);
            setList(data);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
    }, []);

    async function criar() {
        if (!novo.trim()) return;
        await addProduto(novo.trim(), supermarketId, tipo.trim());
        setNovo('');
        setTipo('');
        load();
    }

    function confirmarDelete(id: number) {
        Alert.alert(
            'Excluir produto',
            'Tem certeza que deseja excluir este produto?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Excluir',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteProduto(id);
                            Alert.alert('✅ Produto excluído');
                            load();
                        } catch {
                            Alert.alert('Erro ao excluir');
                        }
                    },
                },
            ]
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-50 px-6 pt-4">
            <Text className="text-3xl font-extrabold text-gray-800 mb-2">
                🏬 {supermarketName}
            </Text>
            <Text className="text-xl font-semibold text-gray-700 mb-4">
                Produtos
            </Text>

            {/* Inputs + botão adicionar */}
            <View className="mb-6">
                <View className="flex-row mb-3 items-center">
                    <TextInput
                        className="flex-1 bg-white border border-gray-200 rounded-2xl py-3 px-4 text-gray-700 shadow-sm"
                        placeholder="Novo produto..."
                        placeholderTextColor="#A0A0A0"
                        value={novo}
                        onChangeText={setNovo}
                    />
                </View>
                <View className="flex-row items-center">
                    <TextInput
                        className="flex-1 bg-white border border-gray-200 rounded-2xl py-3 px-4 text-gray-700 shadow-sm"
                        placeholder="Tipo do produto..."
                        placeholderTextColor="#A0A0A0"
                        value={tipo}
                        onChangeText={setTipo}
                    />
                    <Pressable
                        onPress={criar}
                        className="ml-3 bg-blue-600 rounded-full p-3 shadow-md"
                    >
                        <Icon name="plus" size={18} color="#FFF" />
                    </Pressable>
                </View>
            </View>

            <Pressable
                onPress={() =>
                    navigation.navigate('Visão Geral', {
                        supermarketId,
                        supermarketName,
                        supermarketLocation,
                    })
                }
                className="bg-blue-500 rounded-full p-3 mb-4 shadow-md"
            >
                <Text className="text-white text-center font-semibold">Visão Geral</Text>
            </Pressable>

            {/* Lista de produtos */}
            {loading ? (
                <ActivityIndicator size="large" color="#4A90E2" />
            ) : (
                <FlatList
                    data={list}
                    keyExtractor={(item) => item.id.toString()}
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item }) => (
                        <Pressable
                            onPress={() =>
                                navigation.navigate('Marcas', {
                                    supermarketId,
                                    productId: item.id,
                                    productName: item.name,
                                })
                            }
                            className="bg-white p-4 rounded-2xl mb-4 shadow-md"
                        >
                            <View className="flex-row items-center justify-between">
                                <View className="flex-row items-center">
                                    <Icon name="cube" size={20} color="#4A90E2" />
                                    <View className="ml-3">
                                        <Text className="text-lg font-semibold text-gray-800">
                                            {item.name}
                                        </Text>
                                        {item.type ? (
                                            <Text className="text-sm text-gray-500">{item.type}</Text>
                                        ) : null}
                                    </View>
                                </View>
                                <Pressable
                                    onPress={() => confirmarDelete(item.id)}
                                    className="bg-red-500 rounded-full p-3"
                                >
                                    <Icon name="trash" size={16} color="#FFF" />
                                </Pressable>
                            </View>
                        </Pressable>
                    )}
                />
            )}
        </SafeAreaView>
    );
}
