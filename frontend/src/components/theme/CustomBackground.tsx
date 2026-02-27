import React from 'react';
import { View, StyleSheet, ImageBackground } from 'react-native';
import { useThemeStore } from '../../store/useThemeStore';

interface CustomBackgroundProps {
  children: React.ReactNode;
}

export default function CustomBackground({ children }: CustomBackgroundProps) {
  const { customBackground, backgroundType } = useThemeStore();

  if (!customBackground || backgroundType === 'color') {
    return <View style={styles.container}>{children}</View>;
  }

  return (
    <ImageBackground
      source={{ uri: customBackground }}
      style={styles.container}
      resizeMode='cover'
      blurRadius={2}
    >
      <View style={styles.overlay}>{children}</View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
});
