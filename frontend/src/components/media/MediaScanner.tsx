import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import { useLibraryStore } from '../../store/useLibraryStore';
import api from '../../utils/api';

export default function MediaScanner() {
  const { addTrack } = useLibraryStore();
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState({ current: 0, total: 0 });
  const [scannedFiles, setScannedFiles] = useState<string[]>([]);

  const requestPermissions = async () => {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'We need media library access to scan your files');
      return false;
    }
    return true;
  };

  const scanLocalMedia = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    setIsScanning(true);
    setScanProgress({ current: 0, total: 0 });
    setScannedFiles([]);

    try {
      // Get all audio assets
      const audioAssets = await MediaLibrary.getAssetsAsync({
        mediaType: 'audio',
        first: 10000,
      });

      // Get all video assets
      const videoAssets = await MediaLibrary.getAssetsAsync({
        mediaType: 'video',
        first: 10000,
      });

      const allAssets = [...audioAssets.assets, ...videoAssets.assets];
      setScanProgress({ current: 0, total: allAssets.length });

      const imported = [];

      for (let i = 0; i < allAssets.length; i++) {
        const asset = allAssets[i];
        
        try {
          // Get asset info
          const assetInfo = await MediaLibrary.getAssetInfoAsync(asset.id);
          
          if (!assetInfo.localUri) continue;

          // Read file as base64
          const base64 = await FileSystem.readAsStringAsync(assetInfo.localUri, {
            encoding: FileSystem.EncodingType.Base64,
          });

          const mimeType = asset.mediaType === 'audio' ? 'audio/mpeg' : 'video/mp4';
          const uri = `data:${mimeType};base64,${base64}`;

          // Create track data
          const trackData = {
            uri,
            type: asset.mediaType === 'audio' ? 'audio' : 'video',
            metadata: {
              title: asset.filename,
              artist: 'Unknown Artist',
              album: 'Unknown Album',
              duration: asset.duration || 0,
              fileSize: assetInfo.fileSize || 0,
            },
          };

          // Upload to backend
          const response = await api.post('/tracks', trackData);
          addTrack(response as any);
          imported.push(asset.filename);

          setScanProgress({ current: i + 1, total: allAssets.length });
        } catch (error) {
          console.error(`Error importing ${asset.filename}:`, error);
        }
      }

      setScannedFiles(imported);
      Alert.alert(
        'Scan Complete',
        `Successfully imported ${imported.length} out of ${allAssets.length} files`
      );
    } catch (error) {
      console.error('Error scanning media:', error);
      Alert.alert('Scan Error', 'Failed to scan media library');
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name='scan' size={48} color='#2196F3' />
        <Text style={styles.title}>Media Scanner</Text>
        <Text style={styles.subtitle}>
          Scan your device for music and videos
        </Text>
      </View>

      {isScanning ? (
        <View style={styles.scanningContainer}>
          <ActivityIndicator size='large' color='#2196F3' />
          <Text style={styles.scanningText}>
            Scanning... {scanProgress.current} / {scanProgress.total}
          </Text>
          {scanProgress.total > 0 && (
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${(scanProgress.current / scanProgress.total) * 100}%` },
                ]}
              />
            </View>
          )}
        </View>
      ) : (
        <TouchableOpacity style={styles.scanButton} onPress={scanLocalMedia}>
          <Ionicons name='search' size={24} color='#FFFFFF' />
          <Text style={styles.scanButtonText}>Start Scanning</Text>
        </TouchableOpacity>
      )}

      {scannedFiles.length > 0 && (
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>Recently Scanned</Text>
          <ScrollView style={styles.resultsList}>
            {scannedFiles.slice(0, 10).map((file, index) => (
              <View key={index} style={styles.resultItem}>
                <Ionicons name='musical-note' size={16} color='#2196F3' />
                <Text style={styles.resultText} numberOfLines={1}>
                  {file}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      <View style={styles.infoBox}>
        <Ionicons name='information-circle' size={20} color='#2196F3' />
        <Text style={styles.infoText}>
          This will scan your entire device for audio and video files. Large libraries may take
          several minutes to process.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
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
    textAlign: 'center',
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2196F3',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 16,
  },
  scanButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  scanningContainer: {
    alignItems: 'center',
    padding: 24,
  },
  scanningText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginTop: 16,
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#404040',
    borderRadius: 2,
    marginTop: 16,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2196F3',
  },
  resultsContainer: {
    marginTop: 16,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  resultsList: {
    maxHeight: 200,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 8,
  },
  resultText: {
    flex: 1,
    fontSize: 14,
    color: '#B3B3B3',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#1A237E',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#BBDEFB',
    lineHeight: 18,
  },
});
