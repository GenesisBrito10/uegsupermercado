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
      <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />
      
      <View style={styles.header}>
        <Image
          source={require('../../assets/images/logo.png')}
          style={{
            width: 150,
            height: 150,
            resizeMode: 'contain',
            marginBottom: 20,
          }}
        />
        <Text style={styles.title}>UEG Supermercado</Text>
        <Text style={styles.subtitle}>Monitoramento de preços</Text>
      </View>
      
      <View style={styles.menuContainer}>
        <Pressable 
          style={styles.menuItem}
          onPress={() => navigation.navigate('Supermercados' as never)}
        >
          <View style={[styles.iconContainer, { backgroundColor: '#4A90E2' }]}>
            <Icon name="shopping-cart" size={30} color="#fff" />
          </View>
          <Text style={styles.menuItemText}>Coletor</Text>
          <Text style={styles.menuItemDescription}>
            Cadastre supermercados, produtos, marcas e preços
          </Text>
          <Icon name="chevron-right" size={16} color="#A0A0A0" style={styles.arrowIcon} />
        </Pressable>
        
        <Pressable 
          style={styles.menuItem}
          onPress={() => navigation.navigate('Resultados' as never)}
        >
          <View style={[styles.iconContainer, { backgroundColor: '#50C878' }]}>
            <Icon name="chart-bar" size={30} color="#fff" />
          </View>
          <Text style={styles.menuItemText}>Resultados</Text>
          <Text style={styles.menuItemDescription}>
            Visualize os valores da cesta básica
          </Text>
          <Icon name="chevron-right" size={16} color="#A0A0A0" style={styles.arrowIcon} />
        </Pressable>
      </View>
      
      <Text style={styles.footer}>Universidade Estadual de Goiás</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
    padding: 20,
  },
  header: {
    marginTop: 40,
    marginBottom: 60,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  menuContainer: {
    gap: 20,
  },
  menuItem: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  menuItemText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  menuItemDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  arrowIcon: {
    position: 'absolute',
    right: 20,
    top: 20,
  },
  footer: {
    marginTop: 'auto',
    textAlign: 'center',
    color: '#9CA3AF',
    paddingVertical: 20,
    fontStyle: 'italic',
  },
});

