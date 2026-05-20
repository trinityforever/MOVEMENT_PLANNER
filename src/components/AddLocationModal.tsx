import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { COLORS, BORDER_RADIUS, SPACING } from '../constants/Theme';
import { CustomLocation } from '../models/types';

interface AddLocationModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (location: CustomLocation) => void;
}

const GEOCODE_URL = 'https://nominatim.openstreetmap.org/search';

async function geocode(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const url = `${GEOCODE_URL}?q=${encodeURIComponent(address)}&format=json&limit=1`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'MovementPlanningApp/1.0' },
    });
    const data = await res.json();
    if (data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
      };
    }
    return null;
  } catch {
    return null;
  }
}

export default function AddLocationModal({ visible, onClose, onAdd }: AddLocationModalProps) {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAdd = async () => {
    if (!name.trim() || !address.trim()) return;
    setLoading(true);
    setError(null);
    const coords = await geocode(address.trim() + ', Detroit, MI');
    if (!coords) {
      setError("Couldn't find that address. Try including city and state.");
      setLoading(false);
      return;
    }
    onAdd({
      id: `custom-${Date.now()}`,
      name: name.trim(),
      address: address.trim(),
      coordinates: { latitude: coords.lat, longitude: coords.lng },
    });
    setName('');
    setAddress('');
    setError(null);
    setLoading(false);
    onClose();
  };

  const handleClose = () => {
    setName('');
    setAddress('');
    setError(null);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.centered}
        >
          <TouchableOpacity style={styles.modal} activeOpacity={1}>
            <Text style={styles.title}>Add Custom Location</Text>

            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g. My Hotel"
              placeholderTextColor={COLORS.textSecondary}
              autoFocus
            />

            <Text style={styles.label}>Address</Text>
            <TextInput
              style={styles.input}
              value={address}
              onChangeText={setAddress}
              placeholder="e.g. 123 Main St"
              placeholderTextColor={COLORS.textSecondary}
            />

            {error && <Text style={styles.error}>{error}</Text>}

            <View style={styles.buttons}>
              <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.addButton, (!name.trim() || !address.trim()) && { opacity: 0.5 }]}
                onPress={handleAdd}
                disabled={!name.trim() || !address.trim() || loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.addText}>Add Location</Text>
                )}
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centered: {
    width: '100%',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    width: '85%',
    maxWidth: 400,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: SPACING.lg,
  },
  label: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.xs,
  },
  input: {
    backgroundColor: '#2A2A2A',
    color: COLORS.textPrimary,
    fontSize: 16,
    padding: 12,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
  },
  error: {
    color: '#EF4444',
    fontSize: 14,
    marginBottom: SPACING.md,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: SPACING.sm,
  },
  cancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: '#444',
    alignItems: 'center',
  },
  cancelText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  addButton: {
    flex: 1,
    padding: 14,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.customLocation,
    alignItems: 'center',
  },
  addText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
