import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { usePlayerStore } from '../../src/store/usePlayerStore';
import api from '../../src/utils/api';
import { Track } from '../../src/types/media';
import { formatDuration } from '../../src/utils/formatters';

export default function SearchScreen() {
  const { setQueue } = usePlayerStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);

    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await api.get(`/search?q=${encodeURIComponent(query)}`);
      setSearchResults(response.tracks || []);
    } catch (error) {
      console.error('Error searching:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const playTrack = (track: Track) => {
    const index = searchResults.findIndex(t => t.id === track.id);
    setQueue(searchResults, index);

    if (!recentSearches.includes(searchQuery)) {
      setRecentSearches([searchQuery, ...recentSearches.slice(0, 9)]);
    }
  };

  const selectRecentSearch = (query: string) => {
    handleSearch(query);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
  };

  const renderTrackItem = ({ item }: { item: Track }) => (
    <TouchableOpacity style={styles.trackItem} onPress={() => playTrack(item)}>
      {item.artwork ? (
        <Image source={{ uri: item.artwork }} style={styles.trackThumbnail} />
      ) : (
        <View style={[styles.trackThumbnail, styles.placeholderThumbnail]}>
          <Ionicons name={item.type === 'video' ? 'videocam' : 'musical-note'} size={24} color="#FFFFFF" />
        </View>
      )}
      <View style={styles.trackInfo}>
        <Text style={styles.trackTitle} numberOfLines={1}>
          {item.metadata.title}
        </Text>
        <Text style={styles.trackArtist} numberOfLines={1}>
          {item.metadata.artist || 'Unknown Artist'}
        </Text>
        {item.metadata.album && (
          <Text style={styles.trackAlbum} numberOfLines={1}>
            {item.metadata.album}
          </Text>
        )}
      </View>
      <View style={styles.trackMeta}>
        <Text style={styles.trackDuration}>{formatDuration(item.metadata.duration || 0)}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#B3B3B3" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search songs, albums, artists..."
            placeholderTextColor="#B3B3B3"
            value={searchQuery}
            onChangeText={handleSearch}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color="#B3B3B3" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.content}>
        {isSearching ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1DB954" />
          </View>
        ) : searchResults.length > 0 ? (
          <>
            <Text style={styles.resultCount}>
              {searchResults.length} {searchResults.length === 1 ? 'result' : 'results'} found
            </Text>
            <FlatList
              data={searchResults}
              renderItem={renderTrackItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
            />
          </>
        ) : searchQuery.length > 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={80} color="#666" />
            <Text style={styles.emptyStateTitle}>No results found</Text>
            <Text style={styles.emptyStateText}>
              Try searching with different keywords
            </Text>
          </View>
        ) : (
          <View style={styles.recentSearchesContainer}>
            {recentSearches.length > 0 && (
              <>
                <View style={styles.recentHeader}>
                  <Text style={styles.recentTitle}>Recent Searches</Text>
                  <TouchableOpacity onPress={() => setRecentSearches([])}>
                    <Text style={styles.clearAllText}>Clear all</Text>
                  </TouchableOpacity>
                </View>
                {recentSearches.map((search, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.recentItem}
                    onPress={() => selectRecentSearch(search)}
                  >
                    <Ionicons name="time-outline" size={20} color="#B3B3B3" />
                    <Text style={styles.recentText}>{search}</Text>
                    <TouchableOpacity
                      onPress={() => setRecentSearches(recentSearches.filter((_, i) => i !== index))}
                      style={styles.removeRecentButton}
                    >
                      <Ionicons name="close" size={18} color="#666" />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
              </>
            )}

            <View style={styles.searchTipsContainer}>
              <Text style={styles.searchTipsTitle}>Search Tips</Text>
              <View style={styles.tipItem}>
                <Ionicons name="musical-note" size={16} color="#1DB954" />
                <Text style={styles.tipText}>Search by song title</Text>
              </View>
              <View style={styles.tipItem}>
                <Ionicons name="person" size={16} color="#1DB954" />
                <Text style={styles.tipText}>Search by artist name</Text>
              </View>
              <View style={styles.tipItem}>
                <Ionicons name="albums" size={16} color="#1DB954" />
                <Text style={styles.tipText}>Search by album name</Text>
              </View>
              <View style={styles.tipItem}>
                <Ionicons name="text" size={16} color="#1DB954" />
                <Text style={styles.tipText}>Search by lyrics</Text>
              </View>
            </View>
          </View>
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
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#282828',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 48,
    color: '#FFFFFF',
    fontSize: 16,
  },
  clearButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultCount: {
    fontSize: 14,
    color: '#B3B3B3',
    paddingHorizontal: 16,
    paddingVertical: 12,
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
    marginBottom: 2,
  },
  trackAlbum: {
    fontSize: 12,
    color: '#666',
  },
  trackMeta: {
    marginLeft: 12,
  },
  trackDuration: {
    fontSize: 13,
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
  recentSearchesContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  recentTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  clearAllText: {
    fontSize: 14,
    color: '#1DB954',
    fontWeight: '600',
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  recentText: {
    flex: 1,
    fontSize: 15,
    color: '#FFFFFF',
  },
  removeRecentButton: {
    padding: 4,
  },
  searchTipsContainer: {
    marginTop: 32,
    padding: 16,
    backgroundColor: '#181818',
    borderRadius: 12,
  },
  searchTipsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  tipText: {
    fontSize: 14,
    color: '#B3B3B3',
  },
});