// src/navigation/AppNavigator.tsx
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from '../screens/HomeScreen';
import SupermarketScreen from '../screens/SupermarketScreen';
import ProductScreen from '../screens/ProductScreen';
import BrandScreen from '../screens/BrandScreen';
import OverviewScreen from '../screens/OverviewScreen';
import ResultsScreen from '../screens/ResultsScreen';
import SplashScreen from '../components/SplashScreen';

export type RootStackParamList = {
  Splash: undefined;
  Home: undefined;
  Supermercados: undefined;
  Produtos: { supermarketId: number; supermarketName: string };
  Marcas: { supermarketId: number; productId: number; productName: string };
  'Visão Geral': { supermarketId: number; supermarketName: string };
  Resultados: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const [isLoading, setIsLoading] = useState(true);

  // Função chamada quando a animação do Splash terminar
  const handleSplashFinish = () => {
    setIsLoading(false);
  };

  if (isLoading) {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#F9FAFB' },
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Supermercados" component={SupermarketScreen} />
        <Stack.Screen name="Produtos" component={ProductScreen} />
        <Stack.Screen name="Marcas" component={BrandScreen} />
        <Stack.Screen name="Visão Geral" component={OverviewScreen} />
        <Stack.Screen name="Resultados" component={ResultsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
