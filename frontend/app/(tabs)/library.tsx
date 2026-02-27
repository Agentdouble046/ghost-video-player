import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Image,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLibraryStore } from '../../src/store/useLibraryStore';
import { usePlayerStore } from '../../src/store/usePlayerStore';
import api from '../../src/utils/api';
import { Track, Album, Artist, Genre, Playlist } from '../../src/types/media';
import { formatDuration } from '../../src/utils/formatters';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';

type LibraryTab = 'tracks' | 'albums' | 'artists' | 'genres' | 'playlists' | 'folders';

export default function LibraryScreen() {
  const { tracks, albums, artists, genres, playlists, setTracks, setAlbums, setArtists, setGenres, setPlaylists } = useLibraryStore();
  const { setQueue } = usePlayerStore();
  const [activeTab, setActiveTab] = useState<LibraryTab>('tracks');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('title');

  useEffect(() => {
    loadLibraryData();
  }, [activeTab]);

  const loadLibraryData = async () => {
    try {
      if (activeTab === 'tracks') {
        const data = await api.get(`/tracks?sort_by=${sortBy}`) as Track[];
        setTracks(data);
      } else if (activeTab === 'albums') {
        const data = await api.get('/albums') as Album[];
        setAlbums(data);
      } else if (activeTab === 'artists') {
        const data = await api.get('/artists') as Artist[];
        setArtists(data);
      } else if (activeTab === 'genres') {
        const data = await api.get('/genres') as Genre[];
        setGenres(data);
      } else if (activeTab === 'playlists') {
        const data = await api.get('/playlists') as Playlist[];
        setPlaylists(data);
      }
    } catch (error) {
      console.error('Error loading library data:', error);
    }
  };

  const pickAudioFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['audio/*', 'video/*'],
        copyToCacheDirectory: true,
        multiple: true,
      });

      if (!result.canceled && result.assets) {
        for (const asset of result.assets) {
          const base64 = await FileSystem.readAsStringAsync(asset.uri, {
            encoding: 'base64',
          });

          const trackData = {
            uri: `data:audio/mpeg;base64,${base64}`,
            type: asset.mimeType?.includes('video') ? 'video' : 'audio',
            metadata: {
              title: asset.name,
              artist: 'Unknown Artist',
              album: 'Unknown Album',
              duration: 0,
              fileSize: asset.size || 0,
            },
          };

          await api.post('/tracks', trackData);
        }

        await loadLibraryData();
      }
    } catch (error) {
      console.error('Error picking file:', error);
    }
  };

  const playTrack = (track: Track) => {
    setQueue([track], 0);
  };

  const playAllTracks = () => {
    if (tracks.length > 0) {
      setQueue(tracks, 0);
    }
  };

  const filteredTracks = tracks.filter((track) =>
    track.metadata.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    track.metadata.artist?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    track.metadata.album?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderTrackItem = ({ item }: { item: Track }) => (
    <TouchableOpacity style={styles.trackItem} onPress={() => playTrack(item)}>
      {item.artwork ? (
        <Image source={{ uri: item.artwork }} style={styles.trackThumbnail} />
      ) : (
        <View style={[styles.trackThumbnail, styles.placeholderThumbnail]}>
          <Ionicons name="musical-note" size={24} color="#FFFFFF" />
        </View>
      )}
      <View style={styles.trackInfo}>
        <Text style={styles.trackTitle} numberOfLines={1}>
          {item.metadata.title}
        </Text>
        <Text style={styles.trackArtist} numberOfLines={1}>
          {item.metadata.artist || 'Unknown Artist'}
        </Text>
      </View>
      <View style={styles.trackMeta}>
        <Text style={styles.trackDuration}>{formatDuration(item.metadata.duration || 0)}</Text>
        <TouchableOpacity style={styles.trackMenuButton}>
          <Ionicons name="ellipsis-vertical" size={20} color="#B3B3B3" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderAlbumItem = ({ item }: { item: Album }) => (
    <TouchableOpacity style={styles.albumItem}>
      {item.artwork ? (
        <Image source={{ uri: item.artwork }} style={styles.albumCover} />
      ) : (
        <View style={[styles.albumCover, styles.placeholderThumbnail]}>
          <Ionicons name="albums" size={40} color="#FFFFFF" />
        </View>
      )}
      <View style={styles.albumInfo}>
        <Text style={styles.albumTitle} numberOfLines={1}>
          {item._id || 'Unknown Album'}
        </Text>
        <Text style={styles.albumArtist} numberOfLines={1}>
          {item.artist || 'Unknown Artist'}
        </Text>
        <Text style={styles.albumTrackCount}>
          {item.trackCount} {item.trackCount === 1 ? 'track' : 'tracks'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Library</Text>
        <TouchableOpacity style={styles.addButton} onPress={pickAudioFile}>
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#B3B3B3" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search your library..."
          placeholderTextColor="#B3B3B3"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsContainer}
        contentContainerStyle={styles.tabsContent}
      >
        <TouchableOpacity
          style={[styles.tab, activeTab === 'tracks' && styles.activeTab]}
          onPress={() => setActiveTab('tracks')}
        >
          <Text style={[styles.tabText, activeTab === 'tracks' && styles.activeTabText]}>
            Tracks
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'albums' && styles.activeTab]}
          onPress={() => setActiveTab('albums')}
        >
          <Text style={[styles.tabText, activeTab === 'albums' && styles.activeTabText]}>
            Albums
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'artists' && styles.activeTab]}
          onPress={() => setActiveTab('artists')}
        >
          <Text style={[styles.tabText, activeTab === 'artists' && styles.activeTabText]}>
            Artists
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'genres' && styles.activeTab]}
          onPress={() => setActiveTab('genres')}
        >
          <Text style={[styles.tabText, activeTab === 'genres' && styles.activeTabText]}>
            Genres
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'playlists' && styles.activeTab]}
          onPress={() => setActiveTab('playlists')}
        >
          <Text style={[styles.tabText, activeTab === 'playlists' && styles.activeTabText]}>
            Playlists
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'folders' && styles.activeTab]}
          onPress={() => setActiveTab('folders')}
        >
          <Text style={[styles.tabText, activeTab === 'folders' && styles.activeTabText]}>
            Folders
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.content}>
        {activeTab === 'tracks' && (
          <>
            {filteredTracks.length > 0 && (
              <TouchableOpacity style={styles.playAllButton} onPress={playAllTracks}>
                <Ionicons name="play" size={20} color="#FFFFFF" />
                <Text style={styles.playAllText}>Play All</Text>
              </TouchableOpacity>
            )}
            <FlatList
              data={filteredTracks}
              renderItem={renderTrackItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
            />
          </>
        )}

        {activeTab === 'albums' && (
          <FlatList
            data={albums}
            renderItem={renderAlbumItem}
            keyExtractor={(item, index) => `${item._id}-${index}`}
            contentContainerStyle={styles.listContent}
          />
        )}

        {activeTab === 'artists' && (
          <FlatList
            data={artists}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.listItem}>
                <View style={styles.artistAvatar}>
                  <Ionicons name="person" size={32} color="#FFFFFF" />
                </View>
                <View style={styles.listItemInfo}>
                  <Text style={styles.listItemTitle}>{item._id || 'Unknown Artist'}</Text>
                  <Text style={styles.listItemSubtitle}>
                    {item.trackCount} {item.trackCount === 1 ? 'track' : 'tracks'}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
            keyExtractor={(item, index) => `${item._id}-${index}`}
            contentContainerStyle={styles.listContent}
          />
        )}

        {activeTab === 'genres' && (
          <FlatList
            data={genres}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.genreItem}>
                <Text style={styles.genreTitle}>{item._id || 'Unknown Genre'}</Text>
                <Text style={styles.genreCount}>
                  {item.trackCount} {item.trackCount === 1 ? 'track' : 'tracks'}
                </Text>
              </TouchableOpacity>
            )}
            keyExtractor={(item, index) => `${item._id}-${index}`}
            contentContainerStyle={styles.listContent}
            numColumns={2}
          />
        )}

        {activeTab === 'playlists' && (
          <FlatList
            data={playlists}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.playlistItem}>
                {item.artwork ? (
                  <Image source={{ uri: item.artwork }} style={styles.playlistCover} />
                ) : (
                  <View style={[styles.playlistCover, styles.placeholderThumbnail]}>
                    <Ionicons name="list" size={32} color="#FFFFFF" />
                  </View>
                )}
                <View style={styles.playlistInfo}>
                  <Text style={styles.playlistTitle}>{item.name}</Text>
                  <Text style={styles.playlistCount}>
                    {item.trackCount} {item.trackCount === 1 ? 'track' : 'tracks'}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>
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
  addButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#282828',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    color: '#FFFFFF',
    fontSize: 14,
  },
  tabsContainer: {
    maxHeight: 48,
  },
  tabsContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#282828',
    marginRight: 8,
  },
  activeTab: {
    backgroundColor: '#2196F3',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#B3B3B3',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    marginTop: 16,
  },
  playAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2196F3',
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
  },
  playAllText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  listContent: {
    paddingBottom: 100,
  },
  trackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  trackThumbnail: {
    width: 56,
    height: 56,
    borderRadius: 4,
    marginRight: 12,
  },
  placeholderThumbnail: {
    backgroundColor: '#282828',
    justifyContent: 'center',
    alignItems: 'center',
  },
  trackInfo: {
    flex: 1,
  },
  trackTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  trackArtist: {
    fontSize: 13,
    color: '#B3B3B3',
  },
  trackMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  trackDuration: {
    fontSize: 13,
    color: '#B3B3B3',
  },
  trackMenuButton: {
    padding: 4,
  },
  albumItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  albumCover: {
    width: 80,
    height: 80,
    borderRadius: 4,
    marginRight: 12,
  },
  albumInfo: {
    flex: 1,
  },
  albumTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  albumArtist: {
    fontSize: 14,
    color: '#B3B3B3',
    marginBottom: 4,
  },
  albumTrackCount: {
    fontSize: 12,
    color: '#666',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  artistAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#282828',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  listItemInfo: {
    flex: 1,
  },
  listItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  listItemSubtitle: {
    fontSize: 13,
    color: '#B3B3B3',
  },
  genreItem: {
    flex: 1,
    margin: 8,
    padding: 20,
    backgroundColor: '#282828',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  genreTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
    textAlign: 'center',
  },
  genreCount: {
    fontSize: 12,
    color: '#B3B3B3',
  },
  playlistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  playlistCover: {
    width: 72,
    height: 72,
    borderRadius: 4,
    marginRight: 12,
  },
  playlistInfo: {
    flex: 1,
  },
  playlistTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  playlistCount: {
    fontSize: 13,
    color: '#B3B3B3',
  },
});