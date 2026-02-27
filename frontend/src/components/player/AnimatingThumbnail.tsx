import React, { useEffect } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

interface AnimatingThumbnailProps {
  artwork: string;
  audioPeak: number;
  size?: number;
}

export default function AnimatingThumbnail({ artwork, audioPeak, size = 200 }: AnimatingThumbnailProps) {
  const scale = useSharedValue(1);
  const rotate = useSharedValue(0);

  useEffect(() => {
    // Pulse effect based on audio peaks
    scale.value = withSpring(1 + audioPeak * 0.15, {
      damping: 10,
      stiffness: 100,
    });

    // Subtle rotation
    rotate.value = withTiming(audioPeak * 5, {
      duration: 200,
    });
  }, [audioPeak]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotate.value}deg` },
    ],
  }));

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Animated.View style={[styles.imageContainer, animatedStyle]}>
        {artwork ? (
          <Image source={{ uri: artwork }} style={styles.image} />
        ) : (
          <View style={styles.placeholder} />
        )}
      </Animated.View>
      
      {/* Glow effect */}
      <Animated.View 
        style={[
          styles.glow,
          { width: size * 1.2, height: size * 1.2 },
          animatedStyle,
        ]} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageContainer: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#282828',
  },
  glow: {
    position: 'absolute',
    borderRadius: 12,
    backgroundColor: '#2196F3',
    opacity: 0.2,
    zIndex: -1,
  },
});
