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
    Modal,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/FontAwesome';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
    listProdutos,
    addProduto,
    deleteProduto,
    updateProduto,
    Produto,
} from '../supabase';
import { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Produtos'>;

export default function ProductScreen({ route, navigation }: Props) {
    const { supermarketId, supermarketName } = route.params;
    const [list, setList] = useState<Produto[]>([]);
    const [novo, setNovo] = useState('');
    const [tipoSelecionado, setTipoSelecionado] = useState<string | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);
    const [editValue, setEditValue] = useState('');
    const [editTipo, setEditTipo] = useState<string | null>(null);
    const [editModalVisible, setEditModalVisible] = useState(false);

    const tiposProdutos = [
        'Carne',
        'Leite',
        'Feijão',
        'Arroz',
        'Farinha',
        'Batata',
        'Tomate',
        'Pão',
        'Café',
        'Banana',
        'Açúcar',
        'Óleo',
        'Manteiga',
    ];

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
        await addProduto(novo.trim(), supermarketId, tipoSelecionado || undefined);
        setNovo('');
        setTipoSelecionado(null);
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

    async function salvarEdicao(id: number) {
        if (!editValue.trim()) return;
        await updateProduto(id, editValue.trim(), editTipo || undefined);
        setEditId(null);
        setEditValue('');
        setEditTipo(null);
        load();
    }

    function iniciarEdicao(item: Produto) {
        setEditId(item.id);
        setEditValue(item.name);
        setEditTipo(item.type || null);
    }

    function cancelarEdicao() {
        setEditId(null);
        setEditValue('');
        setEditTipo(null);
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-50 px-6 pt-4">
            <Text className="text-3xl font-extrabold text-gray-800 mb-2">
                🏬 {supermarketName}
            </Text>
            <Text className="text-xl font-semibold text-gray-700 mb-4">
                Produtos
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
                    onPress={() => navigation.navigate('Home')}
                    className="bg-blue-500 rounded-full py-3 px-5 flex-1 flex-row items-center justify-center"
                >
                    <Icon name="home" size={16} color="#FFFFFF" />
                    <Text className="text-white font-bold ml-2">Menu Principal</Text>
                </Pressable>
            </View>

            {/* Input + tipo + botão adicionar */}
            <View className="mb-6">
                <View className="flex-row items-center mb-2">
                    <TextInput
                        className="flex-1 bg-white border border-gray-200 rounded-2xl py-3 px-4 text-gray-700 shadow-sm"
                        placeholder="Novo produto..."
                        placeholderTextColor="#A0A0A0"
                        value={novo}
                        onChangeText={setNovo}
                    />
                    <Pressable
                        onPress={criar}
                        className="ml-3 bg-blue-600 rounded-full p-3 shadow-md"
                    >
                        <Icon name="plus" size={18} color="#FFF" />
                    </Pressable>
                </View>
                
                <Pressable 
                    onPress={() => setModalVisible(true)}
                    className="bg-white border border-gray-200 rounded-2xl py-3 px-4 shadow-sm flex-row items-center justify-between"
                >
                    <Text className={tipoSelecionado ? "text-gray-700" : "text-gray-400"}>
                        {tipoSelecionado || "Selecione o tipo do produto"}
                    </Text>
                    <Icon name="chevron-down" size={14} color="#666" />
                </Pressable>
            </View>

            {/* Modal para seleção de tipo */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View className="flex-1 justify-end bg-black/50">
                    <View className="bg-white rounded-t-3xl p-5 h-1/2">
                        <View className="flex-row justify-between items-center mb-4">
                            <Text className="text-xl font-bold text-gray-800">Selecione o tipo</Text>
                            <Pressable onPress={() => setModalVisible(false)}>
                                <Icon name="times" size={20} color="#666" />
                            </Pressable>
                        </View>
                        <ScrollView>
                            {tiposProdutos.map((tipo) => (
                                <Pressable
                                    key={tipo}
                                    className={`p-4 border-b border-gray-100 flex-row justify-between items-center ${
                                        tipoSelecionado === tipo ? "bg-blue-50" : ""
                                    }`}
                                    onPress={() => {
                                        setTipoSelecionado(tipo);
                                        setModalVisible(false);
                                    }}
                                >
                                    <Text className="text-lg text-gray-700">{tipo}</Text>
                                    {tipoSelecionado === tipo && (
                                        <Icon name="check" size={18} color="#4A90E2" />
                                    )}
                                </Pressable>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Modal para seleção de tipo na edição */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={editModalVisible}
                onRequestClose={() => setEditModalVisible(false)}
            >
                <View className="flex-1 justify-end bg-black/50">
                    <View className="bg-white rounded-t-3xl p-5 h-1/2">
                        <View className="flex-row justify-between items-center mb-4">
                            <Text className="text-xl font-bold text-gray-800">Editar tipo</Text>
                            <Pressable onPress={() => setEditModalVisible(false)}>
                                <Icon name="times" size={20} color="#666" />
                            </Pressable>
                        </View>
                        <ScrollView>
                            {tiposProdutos.map((tipo) => (
                                <Pressable
                                    key={tipo}
                                    className={`p-4 border-b border-gray-100 flex-row justify-between items-center ${
                                        editTipo === tipo ? "bg-blue-50" : ""
                                    }`}
                                    onPress={() => {
                                        setEditTipo(tipo);
                                        setEditModalVisible(false);
                                    }}
                                >
                                    <Text className="text-lg text-gray-700">{tipo}</Text>
                                    {editTipo === tipo && (
                                        <Icon name="check" size={18} color="#4A90E2" />
                                    )}
                                </Pressable>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            <Pressable
                onPress={() =>
                    navigation.navigate('Visão Geral', {
                        supermarketId,
                        supermarketName,
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
                        <View className="bg-white p-4 rounded-2xl mb-4 shadow-md">
                            {editId === item.id ? (
                                // Modo de edição - Layout melhorado
                                <View>
                                    <View className="mb-3">
                                        <Text className="text-xs text-gray-500 mb-1">Nome do produto</Text>
                                        <TextInput
                                            value={editValue}
                                            onChangeText={setEditValue}
                                            className="border border-gray-300 rounded-lg p-2 text-gray-700"
                                            autoFocus
                                        />
                                    </View>
                                    
                                    <Pressable 
                                        onPress={() => setEditModalVisible(true)}
                                        className="mb-4 border border-gray-300 rounded-lg p-3 flex-row justify-between items-center"
                                    >
                                        <Text className={editTipo ? "text-gray-700" : "text-gray-400"}>
                                            {editTipo || "Selecione o tipo do produto"}
                                        </Text>
                                        <Icon name="chevron-down" size={14} color="#666" />
                                    </Pressable>
                                    
                                    <View className="flex-row justify-end">
                                        <Pressable
                                            onPress={cancelarEdicao}
                                            className="bg-gray-300 rounded-full px-4 py-2 mr-2"
                                        >
                                            <Text className="text-gray-700">Cancelar</Text>
                                        </Pressable>
                                        <Pressable
                                            onPress={() => salvarEdicao(item.id)}
                                            className="bg-green-500 rounded-full px-4 py-2"
                                        >
                                            <Text className="text-white">Salvar</Text>
                                        </Pressable>
                                    </View>
                                </View>
                            ) : (
                                // Modo de visualização
                                <Pressable
                                    onPress={() =>
                                        navigation.navigate('Marcas', {
                                            supermarketId,
                                            productId: item.id,
                                            productName: item.name,
                                        })
                                    }
                                >
                                    <View className="flex-row items-center justify-between">
                                        <View className="flex-row items-center flex-1">
                                            <Icon name="cube" size={20} color="#4A90E2" />
                                            <View className="ml-3 flex-1">
                                                <Text className="text-lg font-semibold text-gray-800">
                                                    {item.name}
                                                </Text>
                                                {item.type && (
                                                    <Text className="text-xs text-gray-500">
                                                        Tipo: {item.type}
                                                    </Text>
                                                )}
                                            </View>
                                        </View>
                                        <View className="flex-row">
                                            <Pressable
                                                onPress={() => iniciarEdicao(item)}
                                                className="bg-yellow-500 rounded-full p-3 mr-2"
                                            >
                                                <Icon name="pencil" size={16} color="#FFF" />
                                            </Pressable>
                                            <Pressable
                                                onPress={() => confirmarDelete(item.id)}
                                                className="bg-red-500 rounded-full p-3"
                                            >
                                                <Icon name="trash" size={16} color="#FFF" />
                                            </Pressable>
                                        </View>
                                    </View>
                                </Pressable>
                            )}
                        </View>
                    )}
                />
            )}
        </SafeAreaView>
    );
}
