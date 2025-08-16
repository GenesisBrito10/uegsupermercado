import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator, FlatList, Pressable, Text, TextInput, View, Alert, Modal, ScrollView, StyleSheet, TouchableWithoutFeedback
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/FontAwesome';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { listProdutos, addProduto, deleteProduto, updateProduto, Produto } from '../supabase';
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
        'Carne', 'Leite', 'Feijão', 'Arroz', 'Farinha', 'Batata',
        'Tomate', 'Pão', 'Café', 'Banana', 'Açúcar', 'Óleo', 'Manteiga',
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
    useEffect(() => { load(); }, []);

    async function criar() {
        if (!novo.trim()) return;
        await addProduto(novo.trim(), supermarketId, tipoSelecionado || undefined);
        setNovo('');
        setTipoSelecionado(null);
        load();
    }

    function confirmarDelete(id: number) {
        Alert.alert('Excluir produto', 'Tem certeza que deseja excluir?', [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Excluir', style: 'destructive',
                onPress: async () => {
                    await deleteProduto(id);
                    load();
                },
            },
        ]);
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

    const closeModals = () => {
        setModalVisible(false);
        setEditModalVisible(false);
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Icon name="arrow-left" size={16} color="#374151" />
                </Pressable>
                <View>
                    <Text style={styles.supermarketTitle}>{supermarketName}</Text>
                    <Text style={styles.title}>Produtos</Text>
                </View>
            </View>

            <View style={styles.inputSection}>
                <TextInput
                    style={styles.textInput}
                    placeholder="Nome do novo produto"
                    placeholderTextColor="#9CA3AF"
                    value={novo}
                    onChangeText={setNovo}
                />
                <Pressable 
                    onPress={() => setModalVisible(true)}
                    style={styles.typeSelector}
                >
                    <Text style={tipoSelecionado ? styles.typeSelectedText : styles.typePlaceholderText}>
                        {tipoSelecionado || "Selecione o tipo"}
                    </Text>
                    <Icon name="chevron-down" size={14} color="#6B7280" />
                </Pressable>
                 <Pressable
                    onPress={criar}
                    style={styles.addButton}
                    disabled={!novo.trim()}
                >
                    <Text style={styles.addButtonText}>Adicionar</Text>
                </Pressable>
            </View>

            <Modal
                animationType="slide" transparent={true} visible={modalVisible || editModalVisible}
                onRequestClose={closeModals}
            >
                <TouchableWithoutFeedback onPress={closeModals}>
                    <View style={styles.modalContainer}>
                        <TouchableWithoutFeedback>
                            <View style={styles.modalContent}>
                                <Text style={styles.modalTitle}>Selecione o tipo</Text>
                                <ScrollView>
                                    {tiposProdutos.map((tipo) => (
                                        <Pressable
                                            key={tipo}
                                            style={[styles.modalItem, ((editModalVisible ? editTipo : tipoSelecionado) === tipo) && styles.modalItemSelected]}
                                            onPress={() => {
                                                if (editModalVisible) {
                                                    setEditTipo(tipo);
                                                    setEditModalVisible(false);
                                                } else {
                                                    setTipoSelecionado(tipo);
                                                    setModalVisible(false);
                                                }
                                            }}
                                        >
                                            <Text style={styles.modalItemText}>{tipo}</Text>
                                        </Pressable>
                                    ))}
                                </ScrollView>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
            
            {loading ? (
                <ActivityIndicator size="large" color="#3B82F6" />
            ) : (
                <FlatList
                    data={list}
                    keyExtractor={(item) => item.id.toString()}
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item }) => (
                        <View style={styles.productCard}>
                            {editId === item.id ? (
                                <View>
                                    <TextInput
                                        value={editValue}
                                        onChangeText={setEditValue}
                                        style={[styles.textInput, { marginBottom: 12 }]}
                                        autoFocus
                                    />
                                    <Pressable 
                                        onPress={() => setEditModalVisible(true)}
                                        style={[styles.typeSelector, { marginBottom: 16 }]}
                                    >
                                        <Text style={editTipo ? styles.typeSelectedText : styles.typePlaceholderText}>
                                            {editTipo || "Selecione o tipo"}
                                        </Text>
                                        <Icon name="chevron-down" size={14} color="#6B7280" />
                                    </Pressable>
                                    <View style={styles.editActions}>
                                        <Pressable onPress={cancelarEdicao} style={[styles.editButton, styles.cancelButton]}>
                                            <Text style={styles.cancelButtonText}>Cancelar</Text>
                                        </Pressable>
                                        <Pressable onPress={() => salvarEdicao(item.id)} style={[styles.editButton, styles.saveButton]}>
                                            <Text style={styles.saveButtonText}>Salvar</Text>
                                        </Pressable>
                                    </View>
                                </View>
                            ) : (
                                <Pressable
                                    style={styles.productContent}
                                    onPress={() => navigation.navigate('Marcas', { supermarketId, productId: item.id, productName: item.name })}
                                >
                                    <View style={styles.productDetails}>
                                        <Text style={styles.productName}>{item.name}</Text>
                                        {item.type && (
                                            <Text style={styles.productType}>{item.type}</Text>
                                        )}
                                    </View>
                                    <View style={styles.productActions}>
                                        <Pressable onPress={() => iniciarEdicao(item)} style={styles.actionButton}>
                                            <Icon name="pencil" size={16} color="#4B5563" />
                                        </Pressable>
                                        <Pressable onPress={() => confirmarDelete(item.id)} style={styles.actionButton}>
                                            <Icon name="trash" size={16} color="#EF4444" />
                                        </Pressable>
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

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB', paddingHorizontal: 20 },
    header: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16 },
    backButton: { padding: 10 },
    supermarketTitle: { fontSize: 14, color: '#6B7280' },
    title: { fontSize: 22, fontWeight: 'bold', color: '#111827' },
    inputSection: { gap: 12, marginVertical: 8, marginBottom: 24 },
    textInput: { backgroundColor: 'white', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 14, fontSize: 16, color: '#1F2937' },
    addButton: { backgroundColor: '#3B82F6', paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
    addButtonText: { color: 'white', fontWeight: '600', fontSize: 16 },
    typeSelector: { backgroundColor: 'white', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    typeSelectedText: { color: '#1F2937', fontSize: 16 },
    typePlaceholderText: { color: '#9CA3AF', fontSize: 16 },
    modalContainer: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'transparent' },
    modalContent: { backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '60%', shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 5 },
    modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 16, textAlign: 'center' },
    modalItem: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    modalItemSelected: { backgroundColor: '#EFF6FF' },
    modalItemText: { fontSize: 16, color: '#374151', textAlign: 'center' },
    productCard: { backgroundColor: 'white', padding: 16, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: '#E5E7EB' },
    productContent: { flexDirection: 'row', alignItems: 'center' },
    productDetails: { flex: 1 },
    productName: { fontSize: 16, fontWeight: '600', color: '#1F2937' },
    productType: { fontSize: 12, color: '#6B7280', marginTop: 4, backgroundColor: '#F3F4F6', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10, alignSelf: 'flex-start', overflow: 'hidden' },
    productActions: { flexDirection: 'row', gap: 8 },
    actionButton: { padding: 8 },
    editActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 8 },
    editButton: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
    cancelButton: { backgroundColor: '#E5E7EB' },
    cancelButtonText: { color: '#374151', fontWeight: '600' },
    saveButton: { backgroundColor: '#3B82F6' },
    saveButtonText: { color: 'white', fontWeight: '600' },
});