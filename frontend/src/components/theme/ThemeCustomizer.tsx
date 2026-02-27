import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { useThemeStore } from '../../store/useThemeStore';

interface ThemeCustomizerProps {
  visible: boolean;
  onClose: () => void;
}

const PRESET_COLORS = [
  { name: 'Blue', color: '#2196F3' },
  { name: 'Green', color: '#4CAF50' },
  { name: 'Purple', color: '#9C27B0' },
  { name: 'Red', color: '#F44336' },
  { name: 'Orange', color: '#FF9800' },
  { name: 'Pink', color: '#E91E63' },
  { name: 'Cyan', color: '#00BCD4' },
  { name: 'Teal', color: '#009688' },
  { name: 'Indigo', color: '#3F51B5' },
  { name: 'Amber', color: '#FFC107' },
];

export default function ThemeCustomizer({ visible, onClose }: ThemeCustomizerProps) {
  const { themeColor, customBackground, backgroundType, setThemeColor, setCustomBackground, resetToDefault } = useThemeStore();
  const [customColorInput, setCustomColorInput] = useState(themeColor);

  const handleColorSelect = (color: string) => {
    setThemeColor(color);
    setCustomColorInput(color);
  };

  const handleCustomColorSubmit = () => {
    if (customColorInput.match(/^#[0-9A-Fa-f]{6}$/)) {
      setThemeColor(customColorInput);
    } else {
      Alert.alert('Invalid Color', 'Please enter a valid hex color (e.g., #2196F3)');
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'We need camera roll permissions to set custom backgrounds');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [9, 16],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const base64 = await FileSystem.readAsStringAsync(asset.uri, {
        encoding: 'base64',
      });
      const imageUri = `data:image/jpeg;base64,${base64}`;
      setCustomBackground(imageUri, 'image');
    }
  };

  const pickGif = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'We need camera roll permissions to set custom backgrounds');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      if (asset.uri.toLowerCase().endsWith('.gif')) {
        const base64 = await FileSystem.readAsStringAsync(asset.uri, {
          encoding: 'base64',
        });
        const gifUri = `data:image/gif;base64,${base64}`;
        setCustomBackground(gifUri, 'gif');
      } else {
        Alert.alert('Invalid Format', 'Please select a GIF file');
      }
    }
  };

  const removeBackground = () => {
    setCustomBackground(null, 'color');
  };

  const handleReset = () => {
    Alert.alert(
      'Reset Theme',
      'Are you sure you want to reset to default blue theme?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reset', 
          style: 'destructive',
          onPress: () => {
            resetToDefault();
            setCustomColorInput('#2196F3');
          }
        },
      ]
    );
  };

  return (
    <Modal visible={visible} animationType='slide' presentationStyle='pageSheet' onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name='close' size={28} color='#FFFFFF' />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Theme Customizer</Text>
          <TouchableOpacity onPress={handleReset}>
            <Ionicons name='refresh' size={24} color='#FFFFFF' />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
          {/* Theme Colors */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Theme Color</Text>
            <Text style={styles.sectionSubtitle}>Choose your app accent color</Text>
            
            <View style={styles.colorGrid}>
              {PRESET_COLORS.map((preset) => (
                <TouchableOpacity
                  key={preset.color}
                  style={[
                    styles.colorOption,
                    { backgroundColor: preset.color },
                    themeColor === preset.color && styles.selectedColor,
                  ]}
                  onPress={() => handleColorSelect(preset.color)}
                >
                  {themeColor === preset.color && (
                    <Ionicons name='checkmark' size={24} color='#FFFFFF' />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.customColorSection}>
              <Text style={styles.label}>Custom Hex Color</Text>
              <View style={styles.customColorInput}>
                <TextInput
                  style={styles.textInput}
                  value={customColorInput}
                  onChangeText={setCustomColorInput}
                  placeholder='#2196F3'
                  placeholderTextColor='#666'
                  maxLength={7}
                />
                <TouchableOpacity style={styles.applyButton} onPress={handleCustomColorSubmit}>
                  <Text style={styles.applyButtonText}>Apply</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Background Options */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Background</Text>
            <Text style={styles.sectionSubtitle}>Customize your app background</Text>
            
            <View style={styles.backgroundOptions}>
              <TouchableOpacity style={styles.backgroundButton} onPress={pickImage}>
                <Ionicons name='image' size={32} color={themeColor} />
                <Text style={styles.backgroundButtonText}>Set Image</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.backgroundButton} onPress={pickGif}>
                <Ionicons name='images' size={32} color={themeColor} />
                <Text style={styles.backgroundButtonText}>Set GIF</Text>
              </TouchableOpacity>

              {customBackground && (
                <TouchableOpacity style={styles.backgroundButton} onPress={removeBackground}>
                  <Ionicons name='trash' size={32} color='#F44336' />
                  <Text style={[styles.backgroundButtonText, { color: '#F44336' }]}>Remove</Text>
                </TouchableOpacity>
              )}
            </View>

            {customBackground && (
              <View style={styles.currentBackground}>
                <Text style={styles.label}>Current Background</Text>
                <Text style={styles.backgroundTypeText}>
                  Type: {backgroundType.toUpperCase()}
                </Text>
              </View>
            )}
          </View>

          {/* Preview */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Preview</Text>
            <View style={[styles.previewContainer, { borderColor: themeColor }]}>
              <View style={[styles.previewAccent, { backgroundColor: themeColor }]} />
              <Text style={styles.previewText}>Your custom theme color</Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
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
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#282828',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#282828',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#B3B3B3',
    marginBottom: 16,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  colorOption: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedColor: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  customColorSection: {
    marginTop: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  customColorInput: {
    flexDirection: 'row',
    gap: 8,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#282828',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: '#FFFFFF',
    fontSize: 16,
  },
  applyButton: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  backgroundOptions: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  backgroundButton: {
    flex: 1,
    minWidth: 100,
    backgroundColor: '#282828',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  backgroundButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  currentBackground: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#282828',
    borderRadius: 8,
  },
  backgroundTypeText: {
    color: '#B3B3B3',
    fontSize: 12,
    marginTop: 4,
  },
  previewContainer: {
    backgroundColor: '#181818',
    borderRadius: 12,
    padding: 20,
    borderWidth: 2,
    alignItems: 'center',
  },
  previewAccent: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
  },
  previewText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
});
