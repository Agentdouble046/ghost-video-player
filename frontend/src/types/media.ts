export interface TrackMetadata {
  title: string;
  artist?: string;
  album?: string;
  genre?: string;
  year?: number;
  duration?: number;
  bitrate?: number;
  sampleRate?: number;
  fileSize?: number;
  format?: string;
  lyrics?: string;
  comment?: string;
}

export interface Track {
  id: string;
  uri: string;
  type: 'audio' | 'video';
  metadata: TrackMetadata;
  artwork?: string;
  folder?: string;
  dateAdded: string;
  playCount: number;
  lastPlayed?: string;
  isFavorite: boolean;
  rating?: number;
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  artwork?: string;
  trackIds: string[];
  createdAt: string;
  updatedAt: string;
  trackCount: number;
}

export interface QueueItem {
  trackId: string;
  position: number;
  addedAt: string;
}

export interface Queue {
  id: string;
  name: string;
  items: QueueItem[];
  currentIndex: number;
  createdAt: string;
  updatedAt: string;
}

export interface Album {
  _id: string;
  artist: string;
  artwork?: string;
  trackCount: number;
  tracks: Track[];
}

export interface Artist {
  _id: string;
  trackCount: number;
  albums: string[];
}

export interface Genre {
  _id: string;
  trackCount: number;
}

export interface Download {
  id: string;
  url: string;
  title: string;
  type: 'audio' | 'video';
  status: 'pending' | 'downloading' | 'completed' | 'failed';
  progress: number;
  filePath?: string;
  metadata?: any;
  createdAt: string;
  completedAt?: string;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'auto';
  customThemeColor: string;
  dynamicTheming: boolean;
  crossfadeDuration: number;
  replayGain: boolean;
  skipSilence: boolean;
  showWaveform: boolean;
  minimumTrackDuration: number;
  minimumFileSize: number;
  excludedFolders: string[];
  artistSeparators: string[];
  genreSeparators: string[];
  enableBackgroundPlay: boolean;
  alwaysBackgroundPlay: boolean;
  enableVideoPlayback: boolean;
  enableSubtitles: boolean;
  defaultPlaybackSpeed: number;
  enableGestures: boolean;
  customBackground: string | null;
  backgroundType: 'color' | 'image' | 'gif';
}

export interface PlayerState {
  currentTrack: Track | null;
  isPlaying: boolean;
  position: number;
  duration: number;
  volume: number;
  playbackSpeed: number;
  repeatMode: 'off' | 'one' | 'all';
  shuffleMode: boolean;
  isVideoMode: boolean;
}
