// src/navigation/AppNavigator.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SupermarketScreen        from '../screens/SupermarketScreen';
import ProductScreen            from '../screens/ProductScreen';
import BrandScreen              from '../screens/BrandScreen';
import SupermarketDetailScreen  from '../screens/SupermarketDetailScreen';

export type RootStackParamList = {
  Supermercados: undefined;
  Produtos: {
    supermarketId: number;
    supermarketName: string;
    supermarketLocation: string;
  };
  Marcas: {
    supermarketId: number;
    productId: number;
    productName: string;
  };
  'Visão Geral': {
    supermarketId: number;
    supermarketName: string;
    supermarketLocation: string;
  };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerTitleAlign: 'center' }}>
        <Stack.Screen name="Supermercados" component={SupermarketScreen} />
        <Stack.Screen name="Produtos"      component={ProductScreen} />
        <Stack.Screen name="Marcas"        component={BrandScreen} />
        <Stack.Screen
          name="Visão Geral"
          component={SupermarketDetailScreen}
          options={({ route }) => ({ title: route.params.supermarketName })}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
