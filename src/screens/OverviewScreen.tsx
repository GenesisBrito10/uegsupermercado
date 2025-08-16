import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, FlatList, Text, View, StyleSheet, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/FontAwesome';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { listPrecosPorSuper, PrecoDetail } from '../supabase';
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
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.supermarketTitle}>🏬 {supermarketName}</Text>
      <Text style={styles.title}>Visão Geral de Preços</Text>

      <View style={styles.navButtonsContainer}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={[styles.navButton, styles.backButton]}
        >
          <Icon name="arrow-left" size={16} color="#FFFFFF" />
          <Text style={styles.navButtonText}>Voltar</Text>
        </Pressable>
        
        <Pressable
          onPress={() => navigation.navigate('Home' as never)}
          style={[styles.navButton, styles.homeButton]}
        >
          <Icon name="home" size={16} color="#FFFFFF" />
          <Text style={styles.navButtonText}>Menu Principal</Text>
        </Pressable>
      </View>

      {items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="inbox" size={50} color="#CBD5E0" />
          <Text style={styles.emptyText}>
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
              <View style={styles.itemCard}>
                <View style={styles.itemInfo}>
                  <View>
                    <Text style={styles.productName}>{produtoNome}</Text>
                    <Text style={styles.brandName}>{marcaNome}</Text>
                  </View>
                  <View style={styles.priceBadge}>
                    <Text style={styles.priceText}>
                      R$ {parseFloat(item.price.toString()).toFixed(2).replace('.', ',')}
                    </Text>
                  </View>
                </View>
                <Text style={styles.updateDate}>
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

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f9fafb', paddingHorizontal: 20, paddingTop: 10 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9fafb' },
    supermarketTitle: { fontSize: 24, fontWeight: 'bold', color: '#1F2937', marginBottom: 4 },
    title: { fontSize: 20, fontWeight: '600', color: '#6B7280', marginBottom: 20 },
    navButtonsContainer: { flexDirection: 'row', marginBottom: 20, gap: 10 },
    navButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 25, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
    backButton: { backgroundColor: '#6B7280' },
    homeButton: { backgroundColor: '#4A90E2' },
    navButtonText: { color: 'white', fontWeight: 'bold', marginLeft: 8 },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyText: { color: '#6B7280', marginTop: 16, textAlign: 'center' },
    itemCard: { backgroundColor: 'white', padding: 16, borderRadius: 12, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
    itemInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    productName: { fontSize: 18, fontWeight: 'bold', color: '#1F2937' },
    brandName: { fontSize: 14, color: '#6B7280', marginTop: 2 },
    priceBadge: { backgroundColor: '#EFF6FF', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
    priceText: { color: '#3B82F6', fontWeight: 'bold' },
    updateDate: { fontSize: 12, color: '#9CA3AF', marginTop: 12, textAlign: 'right' },
});