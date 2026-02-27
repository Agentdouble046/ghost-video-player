import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Svg, Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const AnimatedPath = Animated.createAnimatedComponent(Path);

interface WaveformSeekbarProps {
  waveform: number[];
  progress: number;
  duration: number;
  color?: string;
}

export default function WaveformSeekbar({
  waveform,
  progress,
  duration,
  color = '#2196F3'
}: WaveformSeekbarProps) {
  const barWidth = width / waveform.length;
  const maxHeight = 60;
  const progressValue = useSharedValue(0);

  useEffect(() => {
    progressValue.value = withTiming(progress / duration, {
      duration: 100,
    });
  }, [progress, duration]);

  const generateWavePath = () => {
    let path = 'M 0 30 ';
    waveform.forEach((height, index) => {
      const x = index * barWidth;
      const h = (height / 100) * maxHeight;
      path += `L ${x} ${30 - h / 2} L ${x} ${30 + h / 2} `;
    });
    path += 'Z';
    return path;
  };

  return (
    <View style={styles.container}>
      <Svg height={maxHeight} width={width}>
        <Defs>
          <LinearGradient id="waveGradient" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0%" stopColor={color} stopOpacity="1" />
            <Stop offset="100%" stopColor={color} stopOpacity="0.3" />
          </LinearGradient>
        </Defs>
        
        {/* Background waveform */}
        <Path
          d={generateWavePath()}
          fill="rgba(255,255,255,0.2)"
          stroke="none"
        />
        
        {/* Progress waveform */}
        <AnimatedPath
          d={generateWavePath()}
          fill="url(#waveGradient)"
          stroke="none"
          clipPath={`inset(0 ${(1 - progress / duration) * 100}% 0 0)`}
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 60,
    justifyContent: 'center',
  },
});
