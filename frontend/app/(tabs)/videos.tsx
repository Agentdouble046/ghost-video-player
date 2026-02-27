import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLibraryStore } from '../../store/useLibraryStore';
import { usePlayerStore } from '../../store/usePlayerStore';
import api from '../../utils/api';
import { Track } from '../../types/media';
import { formatDuration } from '../../utils/formatters';

const { width } = Dimensions.get('window');
const VIDEO_WIDTH = (width - 48) / 2;

export default function VideosScreen() {
  const { tracks, setTracks } = useLibraryStore();
  const { setQueue, setIsVideoMode } = usePlayerStore();
  const [videos, setVideos] = useState<Track[]>([]);

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    try {
      const data = await api.get('/tracks?filter_type=video') as Track[];
      setVideos(data);
    } catch (error) {
      console.error('Error loading videos:', error);
    }
  };

  const playVideo = (video: Track) => {
    setIsVideoMode(true);
    const index = videos.findIndex(v => v.id === video.id);
    setQueue(videos, index);
  };

  const renderVideoItem = ({ item }: { item: Track }) => (
    <TouchableOpacity style={styles.videoCard} onPress={() => playVideo(item)}>
      {item.artwork ? (
        <Image source={{ uri: item.artwork }} style={styles.videoThumbnail} />
      ) : (
        <View style={[styles.videoThumbnail, styles.placeholderThumbnail]}>
          <Ionicons name="videocam" size={48} color="#FFFFFF" />
        </View>
      )}
      <View style={styles.videoDurationBadge}>
        <Text style={styles.videoDurationText}>
          {formatDuration(item.metadata.duration || 0)}
        </Text>
      </View>
      <View style={styles.playIconOverlay}>
        <Ionicons name="play-circle" size={48} color="rgba(255,255,255,0.9)" />
      </View>
      <View style={styles.videoInfo}>
        <Text style={styles.videoTitle} numberOfLines={2}>
          {item.metadata.title}
        </Text>
        <Text style={styles.videoArtist} numberOfLines={1}>
          {item.metadata.artist || 'Unknown'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Videos</Text>
        <TouchableOpacity style={styles.iconButton}>
          <Ionicons name="download-outline" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {videos.length > 0 ? (
        <FlatList
          data={videos}
          renderItem={renderVideoItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.gridContent}
          columnWrapperStyle={styles.columnWrapper}
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="videocam-outline" size={80} color="#666" />
          <Text style={styles.emptyStateTitle}>No videos yet</Text>
          <Text style={styles.emptyStateText}>
            Add videos to your library to watch them here
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  iconButton: {
    padding: 8,
  },
  gridContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  videoCard: {
    width: VIDEO_WIDTH,
    marginBottom: 24,
  },
  videoThumbnail: {
    width: VIDEO_WIDTH,
    height: VIDEO_WIDTH * 0.56, // 16:9 aspect ratio
    borderRadius: 8,
    marginBottom: 8,
  },
  placeholderThumbnail: {
    backgroundColor: '#282828',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoDurationBadge: {
    position: 'absolute',
    bottom: 16,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  videoDurationText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  playIconOverlay: {
    position: 'absolute',
    top: '25%',
    left: '35%',
  },
  videoInfo: {
    marginTop: 4,
  },
  videoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  videoArtist: {
    fontSize: 12,
    color: '#B3B3B3',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#B3B3B3',
    textAlign: 'center',
  },
});