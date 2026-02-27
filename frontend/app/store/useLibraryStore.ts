import { create } from 'zustand';
import { Track, Album, Artist, Genre, Playlist } from '../types/media';

interface LibraryStore {
  tracks: Track[];
  albums: Album[];
  artists: Artist[];
  genres: Genre[];
  playlists: Playlist[];
  
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setTracks: (tracks: Track[]) => void;
  setAlbums: (albums: Album[]) => void;
  setArtists: (artists: Artist[]) => void;
  setGenres: (genres: Genre[]) => void;
  setPlaylists: (playlists: Playlist[]) => void;
  addTrack: (track: Track) => void;
  removeTrack: (trackId: string) => void;
  updateTrack: (trackId: string, updates: Partial<Track>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useLibraryStore = create<LibraryStore>((set) => ({
  tracks: [],
  albums: [],
  artists: [],
  genres: [],
  playlists: [],
  isLoading: false,
  error: null,
  
  setTracks: (tracks) => set({ tracks }),
  setAlbums: (albums) => set({ albums }),
  setArtists: (artists) => set({ artists }),
  setGenres: (genres) => set({ genres }),
  setPlaylists: (playlists) => set({ playlists }),
  
  addTrack: (track) => set((state) => ({
    tracks: [...state.tracks, track],
  })),
  
  removeTrack: (trackId) => set((state) => ({
    tracks: state.tracks.filter((t) => t.id !== trackId),
  })),
  
  updateTrack: (trackId, updates) => set((state) => ({
    tracks: state.tracks.map((t) => 
      t.id === trackId ? { ...t, ...updates } : t
    ),
  })),
  
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
}));
