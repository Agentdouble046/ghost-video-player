import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../utils/api';
import { useThemeStore } from '../../store/useThemeStore';

interface VideoInfo {
  id: string;
  title: string;
  thumbnail: string;
  duration: number;
  description: string;
  channel: string;
  formats: Array<{
    format_id: string;
    ext: string;
    quality: number;
    filesize: number;
  }>;
}

export default function YouTubeDownloader() {
  const { themeColor } = useThemeStore();
  const [url, setUrl] = useState('');
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [downloadType, setDownloadType] = useState<'audio' | 'video'>('video');
  const [selectedQuality, setSelectedQuality] = useState('best');

  const fetchVideoInfo = async () => {
    if (!url.trim()) {
      Alert.alert('Error', 'Please enter a valid YouTube URL');
      return;
    }

    setIsLoading(true);
    try {
      const info = await api.get(`/youtube/info?url=${encodeURIComponent(url)}`);
      setVideoInfo(info as VideoInfo);
    } catch (error) {
      console.error('Error fetching video info:', error);
      Alert.alert('Error', 'Failed to fetch video information. Please check the URL.');
    } finally {
      setIsLoading(false);
    }
  };

  const startDownload = async () => {
    if (!videoInfo) return;

    setIsLoading(true);
    try {
      const response = await api.post('/youtube/download', {
        url,
        format_type: downloadType,
        quality: selectedQuality,
      });

      Alert.alert(
        'Download Started',
        `${videoInfo.title} is being downloaded. Check Downloads tab for progress.`,
        [{ text: 'OK' }]
      );
      
      // Reset form
      setUrl('');
      setVideoInfo(null);
    } catch (error) {
      console.error('Error starting download:', error);
      Alert.alert('Error', 'Failed to start download. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return 'Unknown size';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name='logo-youtube' size={48} color='#FF0000' />
        <Text style={styles.title}>YouTube Downloader</Text>
        <Text style={styles.subtitle}>Download videos and audio from YouTube</Text>
      </View>

      {/* URL Input */}
      <View style={styles.inputSection}>
        <Text style={styles.label}>YouTube URL</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder='https://www.youtube.com/watch?v=...'
            placeholderTextColor='#666'
            value={url}
            onChangeText={setUrl}
            autoCapitalize='none'
            autoCorrect={false}
          />
          {url.length > 0 && (
            <TouchableOpacity onPress={() => setUrl('')} style={styles.clearButton}>
              <Ionicons name='close-circle' size={20} color='#666' />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[styles.fetchButton, { backgroundColor: themeColor }]}
          onPress={fetchVideoInfo}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color='#FFFFFF' />
          ) : (
            <>
              <Ionicons name='information-circle' size={20} color='#FFFFFF' />
              <Text style={styles.fetchButtonText}>Get Video Info</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Download Type Selection */}
      <View style={styles.typeSection}>
        <Text style={styles.label}>Download Type</Text>
        <View style={styles.typeButtons}>
          <TouchableOpacity
            style={[
              styles.typeButton,
              downloadType === 'video' && { backgroundColor: themeColor },
            ]}
            onPress={() => setDownloadType('video')}
          >
            <Ionicons
              name='videocam'
              size={24}
              color={downloadType === 'video' ? '#FFFFFF' : '#666'}
            />
            <Text
              style={[
                styles.typeButtonText,
                downloadType === 'video' && styles.typeButtonTextActive,
              ]}
            >
              Video
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.typeButton,
              downloadType === 'audio' && { backgroundColor: themeColor },
            ]}
            onPress={() => setDownloadType('audio')}
          >
            <Ionicons
              name='musical-note'
              size={24}
              color={downloadType === 'audio' ? '#FFFFFF' : '#666'}
            />
            <Text
              style={[
                styles.typeButtonText,
                downloadType === 'audio' && styles.typeButtonTextActive,
              ]}
            >
              Audio Only
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Quality Selection */}
      <View style={styles.qualitySection}>
        <Text style={styles.label}>Quality</Text>
        <View style={styles.qualityButtons}>
          {['best', 'high', 'medium', 'low'].map((quality) => (
            <TouchableOpacity
              key={quality}
              style={[
                styles.qualityButton,
                selectedQuality === quality && { backgroundColor: themeColor },
              ]}
              onPress={() => setSelectedQuality(quality)}
            >
              <Text
                style={[
                  styles.qualityButtonText,
                  selectedQuality === quality && styles.qualityButtonTextActive,
                ]}
              >
                {quality.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Video Info Display */}
      {videoInfo && (
        <View style={styles.videoInfo}>
          <Text style={styles.videoTitle}>{videoInfo.title}</Text>
          <View style={styles.videoMeta}>
            <View style={styles.metaItem}>
              <Ionicons name='person' size={16} color='#B3B3B3' />
              <Text style={styles.metaText}>{videoInfo.channel}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name='time' size={16} color='#B3B3B3' />
              <Text style={styles.metaText}>{formatDuration(videoInfo.duration)}</Text>
            </View>
          </View>

          {downloadType === 'video' && videoInfo.formats && (
            <View style={styles.formatsContainer}>
              <Text style={styles.formatsTitle}>Available Formats:</Text>
              {videoInfo.formats.slice(0, 3).map((format, index) => (
                <View key={index} style={styles.formatItem}>
                  <Text style={styles.formatText}>
                    {format.ext.toUpperCase()} • {formatFileSize(format.filesize)}
                  </Text>
                </View>
              ))}
            </View>
          )}

          <TouchableOpacity
            style={[styles.downloadButton, { backgroundColor: '#4CAF50' }]}
            onPress={startDownload}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color='#FFFFFF' />
            ) : (
              <>
                <Ionicons name='download' size={24} color='#FFFFFF' />
                <Text style={styles.downloadButtonText}>
                  Download {downloadType === 'audio' ? 'Audio' : 'Video'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Quick Tips */}
      <View style={styles.tipsContainer}>
        <Text style={styles.tipsTitle}>💡 Quick Tips</Text>
        <Text style={styles.tipText}>• Audio downloads are saved as MP3 (192kbps)</Text>
        <Text style={styles.tipText}>• Video downloads include audio</Text>
        <Text style={styles.tipText}>• Best quality may result in larger file sizes</Text>
        <Text style={styles.tipText}>• Downloads appear in Library after completion</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 12,
  },
  subtitle: {
    fontSize: 14,
    color: '#B3B3B3',
    marginTop: 4,
  },
  inputSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#282828',
    borderRadius: 8,
    marginBottom: 12,
  },
  input: {
    flex: 1,
    padding: 12,
    color: '#FFFFFF',
    fontSize: 14,
  },
  clearButton: {
    padding: 8,
  },
  fetchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 8,
    gap: 8,
  },
  fetchButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  typeSection: {
    marginBottom: 24,
  },
  typeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#282828',
    borderRadius: 8,
    gap: 8,
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  typeButtonTextActive: {
    color: '#FFFFFF',
  },
  qualitySection: {
    marginBottom: 24,
  },
  qualityButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  qualityButton: {
    flex: 1,
    padding: 12,
    backgroundColor: '#282828',
    borderRadius: 8,
    alignItems: 'center',
  },
  qualityButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  qualityButtonTextActive: {
    color: '#FFFFFF',
  },
  videoInfo: {
    backgroundColor: '#181818',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  videoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  videoMeta: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#B3B3B3',
  },
  formatsContainer: {
    marginBottom: 16,
  },
  formatsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#B3B3B3',
    marginBottom: 8,
  },
  formatItem: {
    padding: 8,
    backgroundColor: '#282828',
    borderRadius: 4,
    marginBottom: 4,
  },
  formatText: {
    fontSize: 12,
    color: '#FFFFFF',
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 8,
    gap: 8,
  },
  downloadButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  tipsContainer: {
    backgroundColor: '#1A237E',
    borderRadius: 8,
    padding: 16,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#BBDEFB',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 12,
    color: '#BBDEFB',
    marginBottom: 4,
    lineHeight: 18,
  },
});
