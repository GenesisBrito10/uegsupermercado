import React, { useEffect, useState } from 'react';
import { SectionList, Text, View, ActivityIndicator, Pressable, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/FontAwesome';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { listPrecosPorSuper, PrecoDetail } from '../supabase';
import { exportSupermarketCsv } from '../utils/exportCsv';
import * as Sharing from 'expo-sharing';

type Props = NativeStackScreenProps<RootStackParamList, 'Visão Geral'>;

interface SectionData {
  title: string;
  data: { brand: string; price: number }[];
}

export default function SupermarketDetailScreen({ route }: Props) {
  const { supermarketId, supermarketName } = route.params;
  const [sections, setSections] = useState<SectionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const all: PrecoDetail[] = await listPrecosPorSuper(supermarketId);
        const grouped = all.reduce<SectionData[]>((acc, item) => {
          const prodName = item.produtos.name;
          const entry = { brand: item.marcas.name, price: item.price };
          const section = acc.find(s => s.title === prodName);
          if (section) section.data.push(entry);
          else acc.push({ title: prodName, data: [entry] });
          return acc;
        }, []);
        setSections(grouped);
      } catch (err) {
        console.error(err);
        Alert.alert('Erro ao carregar dados');
      } finally {
        setLoading(false);
      }
    })();
  }, [supermarketId]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const uri = await exportSupermarketCsv(supermarketId, supermarketName);
      await Sharing.shareAsync(uri, { mimeType: 'text/csv' });
    } catch (err) {
      console.error(err);
      Alert.alert('Erro ao exportar CSV');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerCard}>
        <View>
          <Text style={styles.supermarketName}>{supermarketName}</Text>
          <Text style={styles.productCount}>{sections.length} produtos</Text>
        </View>
        <Icon name="shopping-basket" size={32} color="#4A90E2" />
      </View>

      <Pressable
        onPress={handleExport}
        disabled={exporting}
        style={styles.exportButton}
      >
        {exporting ? (
          <ActivityIndicator size="small" color="#FFF" />
        ) : (
          <>
            <Icon name="download" size={18} color="#FFF" />
            <Text style={styles.exportButtonText}>Exportar CSV</Text>
          </>
        )}
      </Pressable>

      <SectionList
        sections={sections}
        keyExtractor={(item, idx) => item.brand + idx}
        renderSectionHeader={({ section: { title } }) => (
          <View style={styles.sectionHeader}>
            <Icon name="cube" size={20} color="#4A90E2" />
            <Text style={styles.sectionTitle}>{title}</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <View style={styles.itemRow}>
            <View style={styles.brandContainer}>
              <Icon name="tag" size={16} color="#7B61FF" />
              <Text style={styles.brandText}>{item.brand}</Text>
            </View>
            <View style={styles.priceContainer}>
              <Icon name="dollar" size={14} color="#4A90E2" />
              <Text style={styles.priceText}>R$ {item.price.toFixed(2)}</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={() => (
          <Text style={styles.emptyText}>Nenhum preço cadastrado ainda.</Text>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f9fafb', paddingHorizontal: 20, paddingTop: 10 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9fafb' },
    headerCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', padding: 20, borderRadius: 16, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
    supermarketName: { fontSize: 24, fontWeight: 'bold', color: '#1F2937' },
    productCount: { fontSize: 14, color: '#6B7280', marginTop: 4 },
    exportButton: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: '#9333EA', borderRadius: 25, paddingVertical: 12, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
    exportButtonText: { color: 'white', fontWeight: 'semibold', marginLeft: 10, fontSize: 16 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, marginTop: 20, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
    sectionTitle: { marginLeft: 10, fontSize: 18, fontWeight: '600', color: '#1F2937' },
    itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', padding: 16, borderRadius: 12, marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
    brandContainer: { flexDirection: 'row', alignItems: 'center' },
    brandText: { marginLeft: 10, fontSize: 16, color: '#374151' },
    priceContainer: { flexDirection: 'row', alignItems: 'center' },
    priceText: { marginLeft: 5, fontSize: 16, fontWeight: '600', color: '#1F2937' },
    emptyText: { textAlign: 'center', color: '#6B7280', marginTop: 40, fontSize: 16 },
});