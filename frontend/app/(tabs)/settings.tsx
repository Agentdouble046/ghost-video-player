import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../../src/utils/api';
import { AppSettings } from '../../src/types/media';
import ThemeCustomizer from '../../src/components/theme/ThemeCustomizer';
import MediaScanner from '../../src/components/media/MediaScanner';
import { useThemeStore } from '../../src/store/useThemeStore';

export default function SettingsScreen() {
  const { themeColor } = useThemeStore();
  const [showThemeCustomizer, setShowThemeCustomizer] = useState(false);
  const [showMediaScanner, setShowMediaScanner] = useState(false);
  const [settings, setSettings] = useState<AppSettings>({
    theme: 'dark',
    customThemeColor: '#2196F3',
    dynamicTheming: true,
    crossfadeDuration: 0,
    replayGain: false,
    skipSilence: false,
    showWaveform: true,
    minimumTrackDuration: 30,
    minimumFileSize: 0,
    excludedFolders: [],
    artistSeparators: [';', '/', ','],
    genreSeparators: [';', '/', ','],
    enableBackgroundPlay: true,
    alwaysBackgroundPlay: true,
    enableVideoPlayback: true,
    enableSubtitles: true,
    defaultPlaybackSpeed: 1.0,
    enableGestures: true,
    customBackground: null,
    backgroundType: 'color',
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await api.get('/settings');
      setSettings(data);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const updateSetting = async (key: keyof AppSettings, value: any) => {
    try {
      const updatedSettings = { ...settings, [key]: value };
      setSettings(updatedSettings);
      await api.patch('/settings', { [key]: value });
    } catch (error) {
      console.error('Error updating setting:', error);
    }
  };

  const SettingItem = ({
    icon,
    title,
    subtitle,
    value,
    onPress,
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    value?: string | number;
    onPress?: () => void;
  }) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
      <View style={styles.settingLeft}>
        <Ionicons name={icon as any} size={24} color="#2196F3" />
        <View style={styles.settingText}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      {value !== undefined && (
        <Text style={styles.settingValue}>{value}</Text>
      )}
      <Ionicons name="chevron-forward" size={20} color="#666" />
    </TouchableOpacity>
  );

  const SettingSwitch = ({
    icon,
    title,
    subtitle,
    value,
    onValueChange,
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
  }) => (
    <View style={styles.settingItem}>
      <View style={styles.settingLeft}>
        <Ionicons name={icon as any} size={24} color="#2196F3" />
        <View style={styles.settingText}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#3e3e3e', true: '#2196F3' }}
        thumbColor="#FFFFFF"
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Media Scanner */}
        <Text style={styles.sectionTitle}>Media Library</Text>
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => setShowMediaScanner(true)}
          >
            <View style={styles.settingLeft}>
              <Ionicons name='scan' size={24} color={themeColor} />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Scan Local Media</Text>
                <Text style={styles.settingSubtitle}>Find audio & video files on device</Text>
              </View>
            </View>
            <Ionicons name='chevron-forward' size={20} color='#666' />
          </TouchableOpacity>
        </View>

        {/* Appearance */}
        <Text style={styles.sectionTitle}>Appearance</Text>
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => setShowThemeCustomizer(true)}
          >
            <View style={styles.settingLeft}>
              <Ionicons name='color-palette' size={24} color={themeColor} />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Theme & Background</Text>
                <Text style={styles.settingSubtitle}>Customize colors and backgrounds</Text>
              </View>
            </View>
            <Ionicons name='chevron-forward' size={20} color='#666' />
          </TouchableOpacity>
          <SettingSwitch
            icon="color-palette"
            title="Dynamic Theming"
            subtitle="Extract colors from album artwork"
            value={settings.dynamicTheming}
            onValueChange={(value) => updateSetting('dynamicTheming', value)}
          />
          <SettingSwitch
            icon="analytics"
            title="Show Waveform"
            subtitle="Display waveform in player"
            value={settings.showWaveform}
            onValueChange={(value) => updateSetting('showWaveform', value)}
          />
        </View>

        <Text style={styles.sectionTitle}>Playback</Text>
        <View style={styles.section}>
          <SettingItem
            icon="timer"
            title="Crossfade Duration"
            subtitle="Fade between tracks"
            value={`${settings.crossfadeDuration}s`}
          />
          <SettingItem
            icon="speedometer"
            title="Default Playback Speed"
            value={`${settings.defaultPlaybackSpeed}x`}
          />
          <SettingSwitch
            icon="volume-high"
            title="Replay Gain"
            subtitle="Normalize audio volume"
            value={settings.replayGain}
            onValueChange={(value) => updateSetting('replayGain', value)}
          />
          <SettingSwitch
            icon="cut"
            title="Skip Silence"
            subtitle="Skip silent parts in audio"
            value={settings.skipSilence}
            onValueChange={(value) => updateSetting('skipSilence', value)}
          />
          <SettingSwitch
            icon="play-circle"
            title="Background Playback"
            subtitle="Continue playback when app is in background"
            value={settings.enableBackgroundPlay}
            onValueChange={(value) => updateSetting('enableBackgroundPlay', value)}
          />
          <SettingSwitch
            icon="infinite"
            title="Always Play in Background"
            subtitle="Never stop playback when minimizing app"
            value={settings.alwaysBackgroundPlay || false}
            onValueChange={(value) => updateSetting('alwaysBackgroundPlay', value)}
          />
        </View>

        <Text style={styles.sectionTitle}>Video</Text>
        <View style={styles.section}>
          <SettingSwitch
            icon="videocam"
            title="Enable Video Playback"
            value={settings.enableVideoPlayback}
            onValueChange={(value) => updateSetting('enableVideoPlayback', value)}
          />
          <SettingSwitch
            icon="text"
            title="Enable Subtitles"
            value={settings.enableSubtitles}
            onValueChange={(value) => updateSetting('enableSubtitles', value)}
          />
          <SettingSwitch
            icon="hand-left"
            title="Gesture Controls"
            subtitle="Swipe to control volume, seek, etc."
            value={settings.enableGestures}
            onValueChange={(value) => updateSetting('enableGestures', value)}
          />
        </View>

        <Text style={styles.sectionTitle}>Library</Text>
        <View style={styles.section}>
          <SettingItem
            icon="time"
            title="Minimum Track Duration"
            subtitle="Filter short tracks"
            value={`${settings.minimumTrackDuration}s`}
          />
          <SettingItem
            icon="document"
            title="Minimum File Size"
            subtitle="Filter small files"
            value={`${settings.minimumFileSize} KB`}
          />
          <SettingItem
            icon="folder"
            title="Excluded Folders"
            subtitle="Manage excluded folders"
            value={settings.excludedFolders.length.toString()}
          />
        </View>

        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.section}>
          <SettingItem
            icon="information-circle"
            title="App Version"
            value="1.0.0"
          />
          <SettingItem
            icon="help-circle"
            title="Help & Support"
          />
          <SettingItem
            icon="document-text"
            title="Terms of Service"
          />
          <SettingItem
            icon="shield-checkmark"
            title="Privacy Policy"
          />
        </View>

        <Text style={styles.sectionTitle}>Storage</Text>
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.dangerButton}
            onPress={() => {
              Alert.alert(
                'Clear Cache',
                'Are you sure you want to clear all cached data?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Clear', style: 'destructive', onPress: () => {} },
                ]
              );
            }}
          >
            <Ionicons name="trash" size={20} color="#FF3B30" />
            <Text style={styles.dangerButtonText}>Clear Cache</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Theme Customizer Modal */}
      <ThemeCustomizer 
        visible={showThemeCustomizer} 
        onClose={() => setShowThemeCustomizer(false)} 
      />

      {/* Media Scanner Modal */}
      {showMediaScanner && (
        <View style={styles.scannerModal}>
          <View style={styles.scannerHeader}>
            <TouchableOpacity onPress={() => setShowMediaScanner(false)}>
              <Ionicons name='close' size={28} color='#FFFFFF' />
            </TouchableOpacity>
            <Text style={styles.scannerTitle}>Media Scanner</Text>
            <View style={{ width: 28 }} />
          </View>
          <ScrollView style={styles.scannerContent}>
            <MediaScanner />
          </ScrollView>
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
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#B3B3B3',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 24,
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  section: {
    backgroundColor: '#181818',
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#282828',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 13,
    color: '#B3B3B3',
  },
  settingValue: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  dangerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3B30',
  },
  scannerModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000',
    zIndex: 1000,
  },
  scannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#282828',
  },
  scannerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  scannerContent: {
    flex: 1,
  },
});