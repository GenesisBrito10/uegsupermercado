import React, { useEffect, useRef } from 'react';
import { 
  View, 
  Image, 
  StyleSheet, 
  Animated, 
  Dimensions,
  Easing // 👈 1. Importar o Easing
} from 'react-native';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
  onFinish: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  // Animações de opacidade e escala (zoom)
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current; // 👈 2. Valor animado para a escala

  useEffect(() => {
    // A sequência de animações
    Animated.sequence([
      // 🎬 Início: A imagem aparece com um zoom sutil simultaneamente
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 1800, // Duração um pouco maior para suavidade
          useNativeDriver: true,
          easing: Easing.out(Easing.ease), // Curva de aceleração suave
        }),
        Animated.timing(scaleAnim, {
          toValue: 1.05, // Zoom de 5% para criar profundidade
          duration: 2500, // Duração maior para um movimento lento
          useNativeDriver: true,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1), // Curva personalizada
        }),
      ]),

      // ⏸️ Pausa: Mantém a imagem visível por um momento
      Animated.delay(500),

      // 🎬 Fim: A imagem desaparece (fade out)
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
        easing: Easing.in(Easing.ease),
      }),
    ]).start(() => {
      // Chama o callback de finalização após a conclusão
      onFinish();
    });
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View 
        style={[
          styles.imageContainer, 
          { 
            opacity: opacityAnim, // Aplicar opacidade
            transform: [{ scale: scaleAnim }] // 👈 3. Aplicar a transformação de escala
          }
        ]}
      >
        <Image 
          source={require('../../assets/images/image.png')} 
          style={styles.image}
          resizeMode="cover"
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000', // Um fundo preto pode dar mais destaque à imagem
  },
  imageContainer: {
    width: width,
    height: height,
    position: 'absolute',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});

export default SplashScreen;