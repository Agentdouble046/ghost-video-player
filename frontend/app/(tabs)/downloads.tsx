import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../../src/utils/api';
import { Download } from '../../src/types/media';
import { formatDate } from '../../src/utils/formatters';

export default function DownloadsScreen() {
  const [downloads, setDownloads] = useState<Download[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDownloads();
    // Poll for updates every 5 seconds
    const interval = setInterval(loadDownloads, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadDownloads = async () => {
    try {
      const data = await api.get('/downloads');
      setDownloads(data as Download[]);
    } catch (error) {
      console.error('Error loading downloads:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDownloads();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <Ionicons name='checkmark-circle' size={24} color='#4CAF50' />;
      case 'downloading':
        return <ActivityIndicator size='small' color='#2196F3' />;
      case 'failed':
        return <Ionicons name='close-circle' size={24} color='#F44336' />;
      default:
        return <Ionicons name='time' size={24} color='#FFC107' />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'downloading':
        return 'Downloading...';
      case 'failed':
        return 'Failed';
      default:
        return 'Pending';
    }
  };

  const renderDownloadItem = ({ item }: { item: Download }) => (
    <View style={styles.downloadItem}>
      <View style={styles.downloadIcon}>
        {getStatusIcon(item.status)}
      </View>
      
      <View style={styles.downloadInfo}>
        <Text style={styles.downloadTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.downloadType}>
          {item.type.toUpperCase()} • {getStatusText(item.status)}
        </Text>
        {item.status === 'downloading' && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[styles.progressFill, { width: `${item.progress}%` }]}
              />
            </View>
            <Text style={styles.progressText}>{Math.round(item.progress)}%</Text>
          </View>
        )}
        {item.completedAt && (
          <Text style={styles.downloadDate}>
            {formatDate(item.completedAt)}
          </Text>
        )}
      </View>

      <TouchableOpacity style={styles.menuButton}>
        <Ionicons name='ellipsis-vertical' size={20} color='#B3B3B3' />
      </TouchableOpacity>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color='#2196F3' />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Downloads</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
          <Ionicons name='refresh' size={24} color='#FFFFFF' />
        </TouchableOpacity>
      </View>

      {downloads.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name='download-outline' size={80} color='#666' />
          <Text style={styles.emptyStateTitle}>No downloads yet</Text>
          <Text style={styles.emptyStateText}>
            Downloaded media will appear here
          </Text>
        </View>
      ) : (
        <FlatList
          data={downloads}
          renderItem={renderDownloadItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
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
  refreshButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 100,
  },
  downloadItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#282828',
  },
  downloadIcon: {
    marginRight: 12,
  },
  downloadInfo: {
    flex: 1,
  },
  downloadTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  downloadType: {
    fontSize: 12,
    color: '#B3B3B3',
    marginBottom: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#404040',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2196F3',
  },
  progressText: {
    fontSize: 11,
    color: '#B3B3B3',
    minWidth: 35,
  },
  downloadDate: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
  },
  menuButton: {
    padding: 4,
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
