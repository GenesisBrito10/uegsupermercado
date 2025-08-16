import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, FlatList, Pressable, Text, TextInput, View, Alert, StyleSheet
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/FontAwesome';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  listMarcas, addMarca, addPreco, listPrecosProduto, updatePreco, deleteMarca, Marca
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
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [debounceTimeout, setDebounceTimeout] = useState<NodeJS.Timeout | null>(null);
  const [newBrand, setNewBrand] = useState('');
  const [loading, setLoading] = useState(true);

  async function loadData() {
    try {
      const [marcas, precos] = await Promise.all([
        listMarcas(productId),
        listPrecosProduto(supermarketId, productId)
      ]);
      setBrands(marcas);

      const pm: Record<number, string> = {};
      const pidm: Record<number, number> = {};
      marcas.forEach(marca => {
        const entry = precos.find(p => p.marca === marca.id);
        if (entry) {
          pm[marca.id] = entry.price.toString();
          pidm[marca.id] = entry.id;
        }
      });
      setPriceMap(pm);
      setPriceIdMap(pidm);
    } catch (err) {
      Alert.alert('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    return () => {
      if (debounceTimeout) clearTimeout(debounceTimeout);
    };
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
      'Deseja realmente excluir esta marca e seus preços?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir', style: 'destructive', onPress: async () => {
            await deleteMarca(id);
            await loadData();
          }}
      ]
    );
  }

  const handlePriceChange = (brandId: number, text: string) => {
    const sanitizedText = text.replace(',', '.');
    if (/^\d*\.?\d*$/.test(sanitizedText)) {
      setPriceMap(prev => ({ ...prev, [brandId]: sanitizedText }));
      if (debounceTimeout) clearTimeout(debounceTimeout);
      const timeout = setTimeout(() => {
        const value = parseFloat(sanitizedText);
        if (!isNaN(value) && value > 0) {
          autoSavePrice(brandId, value);
        }
      }, 1000); // 1 segundo de debounce
      setDebounceTimeout(timeout);
    }
  };
  
  const autoSavePrice = async (brandId: number, value: number) => {
    setUpdatingId(brandId);
    try {
      if (priceIdMap[brandId]) {
        await updatePreco(priceIdMap[brandId], value);
      } else {
        await addPreco(supermarketId, productId, brandId, value);
      }
      await loadData();
    } catch (error) {
      Alert.alert('Erro ao salvar preço');
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={16} color="#374151" />
        </Pressable>
        <View>
          <Text style={styles.productName}>{productName}</Text>
          <Text style={styles.title}>Marcas & Preços</Text>
        </View>
      </View>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.textInput}
          placeholder="Adicionar nova marca..."
          placeholderTextColor="#9CA3AF"
          value={newBrand}
          onChangeText={setNewBrand}
          onSubmitEditing={criarMarca}
        />
        <Pressable onPress={criarMarca} style={styles.addButton} disabled={!newBrand.trim()}>
          <Icon name="plus" size={16} color="#FFFFFF" />
        </Pressable>
      </View>

      <FlatList
        data={brands}
        keyExtractor={item => item.id.toString()}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={styles.brandCard}>
            <View style={styles.brandHeader}>
              <Text style={styles.brandName}>{item.name}</Text>
              <Pressable onPress={() => confirmarDeleteMarca(item.id)} style={styles.deleteButton}>
                <Icon name="trash" size={14} color="#EF4444" />
              </Pressable>
            </View>

            <View style={styles.priceInputContainer}>
              <Text style={styles.currencySymbol}>R$</Text>
              <TextInput
                style={styles.priceInput}
                placeholder="0,00"
                placeholderTextColor="#9CA3AF"
                keyboardType="decimal-pad"
                value={priceMap[item.id]?.replace('.', ',') || ''}
                onChangeText={text => handlePriceChange(item.id, text)}
              />
              <View style={styles.indicatorContainer}>
                {updatingId === item.id ? (
                  <ActivityIndicator size="small" color="#3B82F6" />
                ) : priceIdMap[item.id] ? (
                  <Icon name="check-circle" size={20} color="#22C55E" />
                ) : null}
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Nenhuma marca cadastrada para este produto.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB', paddingHorizontal: 20 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' },
    header: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16 },
    backButton: { padding: 10 },
    productName: { fontSize: 14, color: '#6B7280' },
    title: { fontSize: 22, fontWeight: 'bold', color: '#111827' },
    inputRow: { flexDirection: 'row', marginBottom: 24, marginTop: 8, alignItems: 'center' },
    textInput: { flex: 1, backgroundColor: 'white', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, paddingVertical: 12, paddingHorizontal: 16, fontSize: 16, color: '#1F2937' },
    addButton: { marginLeft: 12, backgroundColor: '#3B82F6', borderRadius: 8, padding: 14 },
    brandCard: { backgroundColor: 'white', padding: 16, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: '#E5E7EB' },
    brandHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
    brandName: { fontSize: 16, fontWeight: '600', color: '#1F2937' },
    deleteButton: { padding: 8 },
    priceInputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, paddingLeft: 12 },
    currencySymbol: { fontSize: 16, color: '#6B7280', marginRight: 4 },
    priceInput: { flex: 1, paddingVertical: 12, fontSize: 16, color: '#1F2937' },
    indicatorContainer: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
      marginTop: 40,
      alignItems: 'center',
    },
    emptyText: {
      fontSize: 16,
      color: '#6B7280',
      textAlign: 'center',
      lineHeight: 24,
    },
});