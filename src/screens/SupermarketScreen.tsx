import React, { useEffect, useState } from 'react';
import { FlatList, Pressable, Text, TextInput, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/FontAwesome';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { listSupermercados, addSupermercado, Supermercado } from '../supabase';
import { RootStackParamList } from '../navigation/AppNavigator';

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
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => navigation.navigate('Home' as never)}
        >
          <Icon name="arrow-left" size={16} color="#374151" />
        </Pressable>
        <Text style={styles.title}>Supermercados</Text>
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          placeholder="Adicionar novo supermercado..."
          placeholderTextColor="#9CA3AF"
          value={novo}
          onChangeText={setNovo}
          onSubmitEditing={criar}
        />
        <Pressable
          onPress={criar}
          style={styles.addButton}
          disabled={!novo.trim()}
        >
          <Icon name="plus" size={16} color="#FFFFFF" />
        </Pressable>
      </View>

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
            style={styles.supermarketItem}
          >
            <Text style={styles.supermarketName}>
              {item.name}
            </Text>
            <Icon name="chevron-right" size={14} color="#9CA3AF" />
          </Pressable>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Nenhum supermercado cadastrado.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  backButton: {
    padding: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
    marginLeft: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    marginTop: 8,
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#1F2937',
  },
  addButton: {
    marginLeft: 12,
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    padding: 14,
  },
  supermarketItem: {
    backgroundColor: 'white',
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  supermarketName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  emptyContainer: {
    marginTop: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
  },
});