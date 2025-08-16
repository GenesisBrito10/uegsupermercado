import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome5';

export default function HomeScreen() {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />
      
      <View style={styles.header}>
        <Image
          source={require('../../assets/images/logo.png')}
          style={styles.logo}
        />
        <Text style={styles.title}>NEPE Coletor</Text>
        <Text style={styles.subtitle}>Monitoramento de Preços da Cesta Básica</Text>
      </View>
      
      <View style={styles.menuContainer}>
        <Pressable 
          style={styles.menuItem}
          onPress={() => navigation.navigate('Supermercados' as never)}
        >
          <View style={styles.menuItemContent}>
            <View style={[styles.iconContainer, { backgroundColor: '#EFF6FF' }]}>
              <Icon name="shopping-basket" size={22} color="#3B82F6" />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuItemText}>Coletor de Preços</Text>
              <Text style={styles.menuItemDescription}>
                Cadastre supermercados, produtos e preços
              </Text>
            </View>
          </View>
          <Icon name="chevron-right" size={16} color="#9CA3AF" />
        </Pressable>
        
        <Pressable 
          style={styles.menuItem}
          onPress={() => navigation.navigate('Resultados' as never)}
        >
          <View style={styles.menuItemContent}>
            <View style={[styles.iconContainer, { backgroundColor: '#F0FDF4' }]}>
              <Icon name="chart-pie" size={22} color="#22C55E" />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuItemText}>Resultados</Text>
              <Text style={styles.menuItemDescription}>
                Visualize os relatórios da cesta básica
              </Text>
            </View>
          </View>
          <Icon name="chevron-right" size={16} color="#9CA3AF" />
        </Pressable>
      </View>
      
      <Text style={styles.footer}>Universidade Estadual de Goiás</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 40,
  },
  logo: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  menuContainer: {
    gap: 16,
  },
  menuItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  menuItemDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 12,
  },
});