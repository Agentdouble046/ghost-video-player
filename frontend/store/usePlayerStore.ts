import { create } from 'zustand';
import { Track, PlayerState } from '../types/media';

interface PlayerStore extends PlayerState {
  queue: Track[];
  queueIndex: number;
  
  // Actions
  setCurrentTrack: (track: Track | null) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setPosition: (position: number) => void;
  setDuration: (duration: number) => void;
  setVolume: (volume: number) => void;
  setPlaybackSpeed: (speed: number) => void;
  setRepeatMode: (mode: 'off' | 'one' | 'all') => void;
  setShuffleMode: (shuffle: boolean) => void;
  setIsVideoMode: (isVideo: boolean) => void;
  setQueue: (tracks: Track[], startIndex?: number) => void;
  addToQueue: (track: Track) => void;
  removeFromQueue: (index: number) => void;
  nextTrack: () => void;
  previousTrack: () => void;
  playTrackAt: (index: number) => void;
  reset: () => void;
}

export const usePlayerStore = create<PlayerStore>((set, get) => ({
  // Initial state
  currentTrack: null,
  isPlaying: false,
  position: 0,
  duration: 0,
  volume: 1,
  playbackSpeed: 1,
  repeatMode: 'off',
  shuffleMode: false,
  isVideoMode: false,
  queue: [],
  queueIndex: -1,

  // Actions
  setCurrentTrack: (track) => set({ currentTrack: track }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setPosition: (position) => set({ position }),
  setDuration: (duration) => set({ duration }),
  setVolume: (volume) => set({ volume }),
  setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),
  setRepeatMode: (mode) => set({ repeatMode: mode }),
  setShuffleMode: (shuffle) => set({ shuffleMode: shuffle }),
  setIsVideoMode: (isVideo) => set({ isVideoMode: isVideo }),
  
  setQueue: (tracks, startIndex = 0) => {
    set({
      queue: tracks,
      queueIndex: startIndex,
      currentTrack: tracks[startIndex] || null,
    });
  },
  
  addToQueue: (track) => {
    const { queue } = get();
    set({ queue: [...queue, track] });
  },
  
  removeFromQueue: (index) => {
    const { queue, queueIndex } = get();
    const newQueue = queue.filter((_, i) => i !== index);
    const newIndex = index < queueIndex ? queueIndex - 1 : queueIndex;
    set({ queue: newQueue, queueIndex: newIndex });
  },
  
  nextTrack: () => {
    const { queue, queueIndex, repeatMode, shuffleMode } = get();
    
    if (queue.length === 0) return;
    
    if (repeatMode === 'one') {
      set({ position: 0 });
      return;
    }
    
    let nextIndex = queueIndex + 1;
    
    if (shuffleMode) {
      nextIndex = Math.floor(Math.random() * queue.length);
    } else if (nextIndex >= queue.length) {
      if (repeatMode === 'all') {
        nextIndex = 0;
      } else {
        set({ isPlaying: false });
        return;
      }
    }
    
    set({
      queueIndex: nextIndex,
      currentTrack: queue[nextIndex],
      position: 0,
    });
  },
  
  previousTrack: () => {
    const { queue, queueIndex, position } = get();
    
    if (queue.length === 0) return;
    
    // If more than 3 seconds have passed, restart current track
    if (position > 3) {
      set({ position: 0 });
      return;
    }
    
    let prevIndex = queueIndex - 1;
    
    if (prevIndex < 0) {
      prevIndex = queue.length - 1;
    }
    
    set({
      queueIndex: prevIndex,
      currentTrack: queue[prevIndex],
      position: 0,
    });
  },
  
  playTrackAt: (index) => {
    const { queue } = get();
    if (index >= 0 && index < queue.length) {
      set({
        queueIndex: index,
        currentTrack: queue[index],
        position: 0,
        isPlaying: true,
      });
    }
  },
  
  reset: () => set({
    currentTrack: null,
    isPlaying: false,
    position: 0,
    duration: 0,
    queue: [],
    queueIndex: -1,
  }),
}));
