import React, { useRef, useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity, Text } from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { useKeepAwake } from 'expo-keep-awake';

const { width, height } = Dimensions.get('window');

interface VideoPlayerProps {
  uri: string;
  onClose?: () => void;
}

export default function VideoPlayer({ uri, onClose }: VideoPlayerProps) {
  useKeepAwake();
  const videoRef = useRef<Video>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [status, setStatus] = useState<AVPlaybackStatus | null>(null);
  const [showControls, setShowControls] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const brightness = useSharedValue(0.5);
  const volume = useSharedValue(1);
  const controlsOpacity = useSharedValue(1);
  const scale = useSharedValue(1);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (showControls) {
      timeout = setTimeout(() => {
        setShowControls(false);
        controlsOpacity.value = withTiming(0, { duration: 300 });
      }, 3000);
    }
    return () => clearTimeout(timeout);
  }, [showControls]);

  const toggleControls = () => {
    setShowControls(!showControls);
    controlsOpacity.value = withTiming(showControls ? 0 : 1, { duration: 300 });
  };

  const togglePlayPause = async () => {
    if (videoRef.current) {
      if (isPlaying) {
        await videoRef.current.pauseAsync();
      } else {
        await videoRef.current.playAsync();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const seekForward = async () => {
    if (videoRef.current && status?.isLoaded) {
      const newPosition = status.positionMillis + 10000;
      await videoRef.current.setPositionAsync(newPosition);
    }
  };

  const seekBackward = async () => {
    if (videoRef.current && status?.isLoaded) {
      const newPosition = Math.max(0, status.positionMillis - 10000);
      await videoRef.current.setPositionAsync(newPosition);
    }
  };

  const changeSpeed = () => {
    const speeds = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
    const currentIndex = speeds.indexOf(playbackSpeed);
    const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
    setPlaybackSpeed(nextSpeed);
    videoRef.current?.setRateAsync(nextSpeed, true);
  };

  // Gesture for volume control (vertical swipe on right)
  const volumeGesture = Gesture.Pan()
    .onUpdate((event) => {
      const delta = -event.translationY / height;
      const newVolume = Math.max(0, Math.min(1, volume.value + delta));
      volume.value = newVolume;
      videoRef.current?.setVolumeAsync(newVolume);
    });

  // Gesture for brightness control (vertical swipe on left)
  const brightnessGesture = Gesture.Pan()
    .onUpdate((event) => {
      const delta = -event.translationY / height;
      brightness.value = Math.max(0, Math.min(1, brightness.value + delta));
    });

  // Double tap to seek
  const doubleTapLeft = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      seekBackward();
    });

  const doubleTapRight = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      seekForward();
    });

  // Pinch to zoom/fullscreen
  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      scale.value = Math.max(0.5, Math.min(3, event.scale));
    })
    .onEnd(() => {
      if (scale.value > 1.5) {
        setIsFullscreen(true);
      } else if (scale.value < 0.8) {
        setIsFullscreen(false);
      }
      scale.value = withSpring(1);
    });

  // Long press for 2x speed
  const longPressGesture = Gesture.LongPress()
    .minDuration(500)
    .onStart(() => {
      videoRef.current?.setRateAsync(2.0, true);
    })
    .onEnd(() => {
      videoRef.current?.setRateAsync(playbackSpeed, true);
    });

  const composedGesture = Gesture.Race(
    doubleTapLeft,
    doubleTapRight,
    pinchGesture,
    longPressGesture
  );

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: withTiming(1 - brightness.value, { duration: 100 }),
  }));

  const controlsStyle = useAnimatedStyle(() => ({
    opacity: controlsOpacity.value,
  }));

  return (
    <View style={styles.container}>
      <GestureDetector gesture={composedGesture}>
        <TouchableOpacity 
          activeOpacity={1} 
          onPress={toggleControls}
          style={styles.videoContainer}
        >
          <Video
            ref={videoRef}
            source={{ uri }}
            style={[styles.video, isFullscreen && styles.fullscreen]}
            resizeMode={ResizeMode.CONTAIN}
            shouldPlay
            isLooping={false}
            onPlaybackStatusUpdate={setStatus}
          />
          
          {/* Brightness overlay */}
          <Animated.View style={[styles.overlay, overlayStyle]} pointerEvents="none" />
        </TouchableOpacity>
      </GestureDetector>

      {/* Controls Overlay */}
      <Animated.View style={[styles.controls, controlsStyle]} pointerEvents={showControls ? 'auto' : 'none'}>
        {/* Top Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={onClose} style={styles.iconButton}>
            <Ionicons name="close" size={28} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity onPress={changeSpeed} style={styles.speedButton}>
            <Text style={styles.speedText}>{playbackSpeed}x</Text>
          </TouchableOpacity>
        </View>

        {/* Center Controls */}
        <View style={styles.centerControls}>
          <TouchableOpacity onPress={seekBackward} style={styles.seekButton}>
            <Ionicons name="play-back" size={40} color="#FFF" />
            <Text style={styles.seekText}>10s</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={togglePlayPause} style={styles.playButton}>
            <Ionicons 
              name={isPlaying ? 'pause' : 'play'} 
              size={56} 
              color="#FFF" 
            />
          </TouchableOpacity>

          <TouchableOpacity onPress={seekForward} style={styles.seekButton}>
            <Ionicons name="play-forward" size={40} color="#FFF" />
            <Text style={styles.seekText}>10s</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Bar */}
        <View style={styles.bottomBar}>
          <Text style={styles.timeText}>
            {status?.isLoaded 
              ? `${Math.floor(status.positionMillis / 60000)}:${Math.floor((status.positionMillis % 60000) / 1000).toString().padStart(2, '0')}`
              : '0:00'
            }
          </Text>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${status?.isLoaded ? (status.positionMillis / status.durationMillis!) * 100 : 0}%` }
              ]} 
            />
          </View>
          <Text style={styles.timeText}>
            {status?.isLoaded && status.durationMillis
              ? `${Math.floor(status.durationMillis / 60000)}:${Math.floor((status.durationMillis % 60000) / 1000).toString().padStart(2, '0')}`
              : '0:00'
            }
          </Text>
        </View>
      </Animated.View>

      {/* Gesture Hints */}
      <View style={styles.hints}>
        <View style={styles.hintLeft}>
          <Ionicons name="sunny" size={20} color="rgba(255,255,255,0.5)" />
        </View>
        <View style={styles.hintRight}>
          <Ionicons name="volume-high" size={20} color="rgba(255,255,255,0.5)" />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  videoContainer: {
    flex: 1,
  },
  video: {
    width: '100%',
    height: '100%',
  },
  fullscreen: {
    width: width,
    height: height,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  controls: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
  },
  iconButton: {
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 24,
  },
  speedButton: {
    padding: 8,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 24,
  },
  speedText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  centerControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 40,
  },
  seekButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 40,
    padding: 16,
  },
  seekText: {
    color: '#FFF',
    fontSize: 12,
    marginTop: 4,
  },
  playButton: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 50,
    padding: 20,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 30,
    gap: 12,
  },
  timeText: {
    color: '#FFF',
    fontSize: 13,
    minWidth: 45,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2196F3',
    borderRadius: 2,
  },
  hints: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    justifyContent: 'space-between',
    pointerEvents: 'none',
  },
  hintLeft: {
    width: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hintRight: {
    width: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
