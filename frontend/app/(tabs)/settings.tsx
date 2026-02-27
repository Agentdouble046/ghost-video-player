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

export default function SettingsScreen() {
  const [settings, setSettings] = useState<AppSettings>({
    theme: 'dark',
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
    enableVideoPlayback: true,
    enableSubtitles: true,
    defaultPlaybackSpeed: 1.0,
    enableGestures: true,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await api.get('/settings') as AppSettings;
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
        <Ionicons name={icon as any} size={24} color="#1DB954" />
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
        <Ionicons name={icon as any} size={24} color="#1DB954" />
        <View style={styles.settingText}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#3e3e3e', true: '#1DB954' }}
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
        <Text style={styles.sectionTitle}>Appearance</Text>
        <View style={styles.section}>
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
});