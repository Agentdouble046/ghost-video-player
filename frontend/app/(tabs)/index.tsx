import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLibraryStore } from '../../src/store/useLibraryStore';
import { usePlayerStore } from '../../src/store/usePlayerStore';
import api from '../../src/utils/api';
import { Track, Album } from '../../src/types/media';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const { tracks, albums, playlists, setTracks, setAlbums, setPlaylists } = useLibraryStore();
  const { setQueue } = usePlayerStore();
  const [recentTracks, setRecentTracks] = useState<Track[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    loadData();
    updateGreeting();
  }, []);

  const updateGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  };

  const loadData = async () => {
    try {
      const [tracksData, albumsData, playlistsData] = await Promise.all([
        api.get('/tracks?sort_by=dateAdded') as Promise<Track[]>,
        api.get('/albums') as Promise<Album[]>,
        api.get('/playlists'),
      ]);

      setTracks(tracksData);
      setAlbums(albumsData);
      setPlaylists(playlistsData);
      setRecentTracks(tracksData.slice(0, 10));
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const playAlbum = (album: Album) => {
    if (album.tracks && album.tracks.length > 0) {
      setQueue(album.tracks, 0);
    }
  };

  const playTrack = (track: Track, allTracks: Track[]) => {
    const index = allTracks.findIndex(t => t.id === track.id);
    setQueue(allTracks, index);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2196F3" />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>{greeting}</Text>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="notifications-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="musical-notes" size={32} color="#2196F3" />
            <Text style={styles.statNumber}>{tracks.length}</Text>
            <Text style={styles.statLabel}>Tracks</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="albums" size={32} color="#2196F3" />
            <Text style={styles.statNumber}>{albums.length}</Text>
            <Text style={styles.statLabel}>Albums</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="list" size={32} color="#2196F3" />
            <Text style={styles.statNumber}>{playlists.length}</Text>
            <Text style={styles.statLabel}>Playlists</Text>
          </View>
        </View>

        {/* Recently Added */}
        {recentTracks.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recently Added</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {recentTracks.map((track) => (
                <TouchableOpacity
                  key={track.id}
                  style={styles.trackCard}
                  onPress={() => playTrack(track, recentTracks)}
                >
                  {track.artwork ? (
                    <Image source={{ uri: track.artwork }} style={styles.trackArtwork} />
                  ) : (
                    <View style={[styles.trackArtwork, styles.placeholderArtwork]}>
                      <Ionicons name="musical-note" size={40} color="#FFFFFF" />
                    </View>
                  )}
                  <Text style={styles.trackTitle} numberOfLines={1}>
                    {track.metadata.title}
                  </Text>
                  <Text style={styles.trackArtist} numberOfLines={1}>
                    {track.metadata.artist || 'Unknown Artist'}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Albums */}
        {albums.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Albums</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {albums.slice(0, 10).map((album, index) => (
                <TouchableOpacity
                  key={`${album._id}-${index}`}
                  style={styles.albumCard}
                  onPress={() => playAlbum(album)}
                >
                  {album.artwork ? (
                    <Image source={{ uri: album.artwork }} style={styles.albumArtwork} />
                  ) : (
                    <View style={[styles.albumArtwork, styles.placeholderArtwork]}>
                      <Ionicons name="albums" size={50} color="#FFFFFF" />
                    </View>
                  )}
                  <Text style={styles.albumTitle} numberOfLines={1}>
                    {album._id || 'Unknown Album'}
                  </Text>
                  <Text style={styles.albumArtist} numberOfLines={1}>
                    {album.artist || 'Unknown Artist'}
                  </Text>
                  <Text style={styles.albumTrackCount}>
                    {album.trackCount} {album.trackCount === 1 ? 'track' : 'tracks'}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Playlists */}
        {playlists.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Playlists</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {playlists.map((playlist) => (
                <TouchableOpacity key={playlist.id} style={styles.playlistCard}>
                  {playlist.artwork ? (
                    <Image source={{ uri: playlist.artwork }} style={styles.playlistArtwork} />
                  ) : (
                    <View style={[styles.playlistArtwork, styles.placeholderArtwork]}>
                      <Ionicons name="list" size={50} color="#FFFFFF" />
                    </View>
                  )}
                  <Text style={styles.playlistTitle} numberOfLines={1}>
                    {playlist.name}
                  </Text>
                  <Text style={styles.playlistTrackCount}>
                    {playlist.trackCount} {playlist.trackCount === 1 ? 'track' : 'tracks'}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Empty State */}
        {tracks.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="musical-notes-outline" size={80} color="#666" />
            <Text style={styles.emptyStateTitle}>No music yet</Text>
            <Text style={styles.emptyStateText}>
              Add some music to your library to get started
            </Text>
            <TouchableOpacity style={styles.addButton}>
              <Ionicons name="add" size={24} color="#FFFFFF" />
              <Text style={styles.addButtonText}>Add Music</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  iconButton: {
    padding: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#181818',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#B3B3B3',
    marginTop: 4,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  trackCard: {
    width: 140,
    marginLeft: 16,
  },
  trackArtwork: {
    width: 140,
    height: 140,
    borderRadius: 8,
    marginBottom: 8,
  },
  placeholderArtwork: {
    backgroundColor: '#282828',
    justifyContent: 'center',
    alignItems: 'center',
  },
  trackTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  trackArtist: {
    fontSize: 12,
    color: '#B3B3B3',
  },
  albumCard: {
    width: 160,
    marginLeft: 16,
  },
  albumArtwork: {
    width: 160,
    height: 160,
    borderRadius: 8,
    marginBottom: 8,
  },
  albumTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  albumArtist: {
    fontSize: 12,
    color: '#B3B3B3',
    marginBottom: 4,
  },
  albumTrackCount: {
    fontSize: 11,
    color: '#666',
  },
  playlistCard: {
    width: 160,
    marginLeft: 16,
  },
  playlistArtwork: {
    width: 160,
    height: 160,
    borderRadius: 8,
    marginBottom: 8,
  },
  playlistTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  playlistTrackCount: {
    fontSize: 12,
    color: '#B3B3B3',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
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
    marginBottom: 24,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2196F3',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
