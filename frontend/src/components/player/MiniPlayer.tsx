import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  Animated,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio, AVPlaybackStatus, InterruptionModeAndroid } from 'expo-av';
import Slider from '@react-native-community/slider';
import { usePlayerStore } from '../../store/usePlayerStore';
import { formatDuration } from '../../utils/formatters';
import api from '../../utils/api';

const { width, height } = Dimensions.get('window');

export default function MiniPlayer() {
  const {
    currentTrack,
    isPlaying,
    position,
    duration,
    volume,
    playbackSpeed,
    repeatMode,
    shuffleMode,
    setIsPlaying,
    setPosition,
    setDuration,
    nextTrack,
    previousTrack,
    setRepeatMode,
    setShuffleMode,
  } = usePlayerStore();

  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [showFullPlayer, setShowFullPlayer] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    configureAudio();
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  useEffect(() => {
    if (currentTrack) {
      loadSound();
      incrementPlayCount();
    }
  }, [currentTrack]);

  useEffect(() => {
    if (sound) {
      if (isPlaying) {
        sound.playAsync();
      } else {
        sound.pauseAsync();
      }
    }
  }, [isPlaying, sound]);

  const configureAudio = async () => {
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: false,
        staysActiveInBackground: true,
        interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
    } catch (error) {
      console.error('Error configuring audio:', error);
    }
  };

  const loadSound = async () => {
    try {
      if (sound) {
        await sound.unloadAsync();
      }

      if (!currentTrack?.uri) return;

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: currentTrack.uri },
        { shouldPlay: true },
        onPlaybackStatusUpdate
      );

      setSound(newSound);
      setIsPlaying(true);
    } catch (error) {
      console.error('Error loading sound:', error);
    }
  };

  const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;

    setPosition(status.positionMillis / 1000);
    setDuration(status.durationMillis ? status.durationMillis / 1000 : 0);

    if (status.didJustFinish && !status.isLooping) {
      handleTrackEnd();
    }
  };

  const handleTrackEnd = () => {
    if (repeatMode === 'one') {
      sound?.replayAsync();
    } else {
      nextTrack();
    }
  };

  const incrementPlayCount = async () => {
    if (currentTrack) {
      try {
        await api.post(`/tracks/${currentTrack.id}/play`, {});
      } catch (error) {
        console.error('Error incrementing play count:', error);
      }
    }
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleSeek = async (value: number) => {
    if (sound) {
      await sound.setPositionAsync(value * 1000);
    }
  };

  const handlePrevious = () => {
    if (position > 3) {
      sound?.replayAsync();
    } else {
      previousTrack();
    }
  };

  const handleNext = () => {
    nextTrack();
  };

  const toggleRepeat = () => {
    const modes: Array<'off' | 'one' | 'all'> = ['off', 'one', 'all'];
    const currentIndex = modes.indexOf(repeatMode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    setRepeatMode(nextMode);
  };

  const toggleShuffle = () => {
    setShuffleMode(!shuffleMode);
  };

  if (!currentTrack) {
    return null;
  }

  return (
    <>
      {/* Mini Player Bar */}
      <TouchableOpacity
        style={styles.miniPlayerContainer}
        onPress={() => setShowFullPlayer(true)}
        activeOpacity={0.9}
      >
        <View style={styles.miniPlayerContent}>
          {currentTrack.artwork ? (
            <Image source={{ uri: currentTrack.artwork }} style={styles.miniArtwork} />
          ) : (
            <View style={[styles.miniArtwork, styles.placeholderArtwork]}>
              <Ionicons name="musical-note" size={20} color="#FFFFFF" />
            </View>
          )}

          <View style={styles.miniTrackInfo}>
            <Text style={styles.miniTrackTitle} numberOfLines={1}>
              {currentTrack.metadata.title}
            </Text>
            <Text style={styles.miniTrackArtist} numberOfLines={1}>
              {currentTrack.metadata.artist || 'Unknown Artist'}
            </Text>
          </View>

          <TouchableOpacity onPress={togglePlayPause} style={styles.miniPlayButton}>
            <Ionicons
              name={isPlaying ? 'pause' : 'play'}
              size={28}
              color="#FFFFFF"
            />
          </TouchableOpacity>
        </View>

        {/* Progress Bar */}
        <View style={styles.miniProgressBar}>
          <View
            style={[
              styles.miniProgressFill,
              { width: `${(position / duration) * 100 || 0}%` },
            ]}
          />
        </View>
      </TouchableOpacity>

      {/* Full Player Modal */}
      <Modal
        visible={showFullPlayer}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowFullPlayer(false)}
      >
        <View style={styles.fullPlayerContainer}>
          {/* Header */}
          <View style={styles.fullPlayerHeader}>
            <TouchableOpacity onPress={() => setShowFullPlayer(false)}>
              <Ionicons name="chevron-down" size={28} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.fullPlayerHeaderTitle}>Now Playing</Text>
            <TouchableOpacity>
              <Ionicons name="ellipsis-vertical" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Album Artwork */}
          <View style={styles.artworkContainer}>
            {currentTrack.artwork ? (
              <Image source={{ uri: currentTrack.artwork }} style={styles.fullArtwork} />
            ) : (
              <View style={[styles.fullArtwork, styles.placeholderArtwork]}>
                <Ionicons name="musical-note" size={120} color="#FFFFFF" />
              </View>
            )}
          </View>

          {/* Track Info */}
          <View style={styles.trackInfoContainer}>
            <Text style={styles.fullTrackTitle} numberOfLines={1}>
              {currentTrack.metadata.title}
            </Text>
            <Text style={styles.fullTrackArtist} numberOfLines={1}>
              {currentTrack.metadata.artist || 'Unknown Artist'}
            </Text>
          </View>

          {/* Progress Slider */}
          <View style={styles.progressContainer}>
            <Slider
              style={styles.progressSlider}
              value={position}
              minimumValue={0}
              maximumValue={duration || 1}
              onSlidingComplete={handleSeek}
              minimumTrackTintColor="#1DB954"
              maximumTrackTintColor="#404040"
              thumbTintColor="#FFFFFF"
            />
            <View style={styles.timeContainer}>
              <Text style={styles.timeText}>{formatDuration(position)}</Text>
              <Text style={styles.timeText}>{formatDuration(duration)}</Text>
            </View>
          </View>

          {/* Controls */}
          <View style={styles.controlsContainer}>
            <TouchableOpacity onPress={toggleShuffle} style={styles.controlButton}>
              <Ionicons
                name="shuffle"
                size={24}
                color={shuffleMode ? '#1DB954' : '#B3B3B3'}
              />
            </TouchableOpacity>

            <TouchableOpacity onPress={handlePrevious} style={styles.controlButton}>
              <Ionicons name="play-skip-back" size={36} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity onPress={togglePlayPause} style={styles.playPauseButton}>
              <Ionicons
                name={isPlaying ? 'pause' : 'play'}
                size={40}
                color="#000000"
              />
            </TouchableOpacity>

            <TouchableOpacity onPress={handleNext} style={styles.controlButton}>
              <Ionicons name="play-skip-forward" size={36} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity onPress={toggleRepeat} style={styles.controlButton}>
              <Ionicons
                name={repeatMode === 'one' ? 'repeat-outline' : 'repeat'}
                size={24}
                color={repeatMode !== 'off' ? '#1DB954' : '#B3B3B3'}
              />
            </TouchableOpacity>
          </View>

          {/* Additional Controls */}
          <View style={styles.additionalControls}>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="heart-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="add-circle-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="share-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  // Mini Player Styles
  miniPlayerContainer: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    backgroundColor: '#181818',
    borderTopWidth: 1,
    borderTopColor: '#282828',
  },
  miniPlayerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    gap: 12,
  },
  miniArtwork: {
    width: 48,
    height: 48,
    borderRadius: 4,
  },
  placeholderArtwork: {
    backgroundColor: '#282828',
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniTrackInfo: {
    flex: 1,
  },
  miniTrackTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  miniTrackArtist: {
    fontSize: 12,
    color: '#B3B3B3',
  },
  miniPlayButton: {
    padding: 8,
  },
  miniProgressBar: {
    height: 2,
    backgroundColor: '#404040',
  },
  miniProgressFill: {
    height: '100%',
    backgroundColor: '#1DB954',
  },

  // Full Player Styles
  fullPlayerContainer: {
    flex: 1,
    backgroundColor: '#000',
    paddingHorizontal: 24,
  },
  fullPlayerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 20,
  },
  fullPlayerHeaderTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  artworkContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 40,
  },
  fullArtwork: {
    width: width - 80,
    height: width - 80,
    borderRadius: 8,
  },
  trackInfoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  fullTrackTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  fullTrackArtist: {
    fontSize: 16,
    color: '#B3B3B3',
    textAlign: 'center',
  },
  progressContainer: {
    marginBottom: 32,
  },
  progressSlider: {
    width: '100%',
    height: 40,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  timeText: {
    fontSize: 12,
    color: '#B3B3B3',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 32,
  },
  controlButton: {
    padding: 12,
  },
  playPauseButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  additionalControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  iconButton: {
    padding: 12,
  },
});
