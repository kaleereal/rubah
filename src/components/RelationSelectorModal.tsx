import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  Modal,
  StyleSheet,
  Alert,
} from 'react-native';
import { useAppStore } from '../store/useAppStore';
import { detectRelationCycle } from '../engine/calculator';

interface RelationSelectorModalProps {
  isOpen: boolean;
  folderId: string;
  sourceEntryId: string;
  relationNodeId: string;
  initialSelectedIds: string[];
  onClose: () => void;
  onApply: (selectedIds: string[]) => void;
}

export const RelationSelectorModal: React.FC<RelationSelectorModalProps> = ({
  isOpen,
  folderId,
  sourceEntryId,
  relationNodeId,
  initialSelectedIds,
  onClose,
  onApply,
}) => {
  const { folders, activeEntries, saveEntry } = useAppStore();
  const folder = folders.find((f) => f.id === folderId);

  const [selectedIds, setSelectedIds] = useState<string[]>(initialSelectedIds || []);
  const [searchQuery, setSearchQuery] = useState('');
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickAddName, setQuickAddName] = useState('');

  if (!folder) return null;

  // Filter available entries in folder
  const availableEntries = activeEntries.filter((e) =>
    e.objectName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleSelect = (targetId: string) => {
    if (selectedIds.includes(targetId)) {
      setSelectedIds(selectedIds.filter((id) => id !== targetId));
    } else {
      // Check circular reference before allowing link
      const isCycle = detectRelationCycle(sourceEntryId, targetId, activeEntries);
      if (isCycle) {
        Alert.alert(
          'Deteksi Siklus Relasi (Circular Reference)',
          'Sistem menolak relasi ini karena akan membentuk rantai relasi melingkar (Circular Reference).'
        );
        return;
      }
      setSelectedIds([...selectedIds, targetId]);
    }
  };

  const handleQuickAdd = () => {
    if (!quickAddName.trim()) return;

    // Default target entry type
    const defaultType = folder.entryTypes[0];
    if (!defaultType) return;

    const newTargetId = `entry-${Date.now()}`;
    const newEntry = {
      id: newTargetId,
      folderId,
      entryTypeId: defaultType.id,
      objectName: quickAddName.trim(),
      leafValues: {},
      relations: {},
      historyLogs: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveEntry(newEntry);
    setSelectedIds([...selectedIds, newTargetId]);
    setQuickAddName('');
    setIsQuickAddOpen(false);
  };

  const handleApply = () => {
    onApply(selectedIds);
    onClose();
  };

  return (
    <Modal visible={isOpen} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Hubungkan Relasi Entri Sumber</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>
            Arah Relasi: Multi-Select pemicu dari Entri Sumber (seperti mengisi absen).
          </Text>

          {/* Search & Quick Add */}
          <View style={styles.searchRow}>
            <TextInput
              style={styles.searchInput}
              placeholder="Cari entri target..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <TouchableOpacity
              style={styles.quickAddButton}
              onPress={() => setIsQuickAddOpen(true)}
            >
              <Text style={styles.quickAddText}>+ Buat Baru</Text>
            </TouchableOpacity>
          </View>

          {/* Target List */}
          <FlatList
            data={availableEntries}
            keyExtractor={(item) => item.id}
            style={styles.list}
            renderItem={({ item }) => {
              const isSelected = selectedIds.includes(item.id);
              const isCycle =
                !isSelected && detectRelationCycle(sourceEntryId, item.id, activeEntries);

              return (
                <TouchableOpacity
                  style={[
                    styles.itemRow,
                    isSelected && styles.itemRowSelected,
                    isCycle && styles.itemRowDisabled,
                  ]}
                  onPress={() => !isCycle && toggleSelect(item.id)}
                >
                  <Text style={styles.checkboxText}>{isSelected ? '☑' : '☐'}</Text>
                  <View style={styles.itemInfo}>
                    <Text style={[styles.itemTitle, isCycle && styles.textDisabled]}>
                      {item.objectName}
                    </Text>
                    {isCycle && (
                      <Text style={styles.cycleWarningText}>⚠️ Siklus Relasi Terdeteksi</Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Belum ada entri target tersedia.</Text>
              </View>
            }
          />

          {/* Summary Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerSummary}>{selectedIds.length} Entri Terpilih</Text>
            <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
              <Text style={styles.applyText}>Terapkan Relasi</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Add Sub-Modal */}
        {isQuickAddOpen && (
          <Modal visible={isQuickAddOpen} transparent animationType="fade">
            <View style={styles.subOverlay}>
              <View style={styles.subModal}>
                <Text style={styles.subTitle}>Buat Entri Target Cepat</Text>
                <TextInput
                  style={styles.subInput}
                  placeholder="Nama Objek Target..."
                  value={quickAddName}
                  onChangeText={setQuickAddName}
                />
                <View style={styles.subActions}>
                  <TouchableOpacity onPress={() => setIsQuickAddOpen(false)}>
                    <Text style={styles.subCancel}>Batal</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.subSaveButton} onPress={handleQuickAdd}>
                    <Text style={styles.subSaveText}>Simpan & Pilih</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    width: '100%',
    maxWidth: 520,
    maxHeight: '85%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  closeText: { fontSize: 18, color: '#64748b', fontWeight: '700' },
  subtitle: { fontSize: 12, color: '#64748b', marginTop: 4, marginBottom: 12 },
  searchRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  searchInput: {
    flex: 1,
    height: 38,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 13,
  },
  quickAddButton: {
    backgroundColor: '#059669',
    paddingHorizontal: 12,
    height: 38,
    borderRadius: 8,
    justifyContent: 'center',
  },
  quickAddText: { color: '#ffffff', fontWeight: '700', fontSize: 12 },
  list: { flex: 1, marginVertical: 8 },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 6,
  },
  itemRowSelected: { backgroundColor: '#eff6ff', borderColor: '#2563eb' },
  itemRowDisabled: { backgroundColor: '#f1f5f9', opacity: 0.6 },
  checkboxText: { fontSize: 18, marginRight: 10, color: '#2563eb' },
  itemInfo: { flex: 1 },
  itemTitle: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
  textDisabled: { color: '#94a3b8' },
  cycleWarningText: { fontSize: 11, color: '#ef4444', marginTop: 2, fontWeight: '600' },
  emptyContainer: { alignItems: 'center', padding: 20 },
  emptyText: { color: '#94a3b8', fontSize: 13 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 12,
    marginTop: 8,
  },
  footerSummary: { fontSize: 13, fontWeight: '700', color: '#334155' },
  applyButton: { backgroundColor: '#2563eb', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  applyText: { color: '#ffffff', fontWeight: '700', fontSize: 13 },
  subOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  subModal: { width: '100%', maxWidth: 380, backgroundColor: '#ffffff', borderRadius: 12, padding: 16 },
  subTitle: { fontSize: 15, fontWeight: '700', color: '#0f172a', marginBottom: 12 },
  subInput: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 13 },
  subActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 16, alignItems: 'center' },
  subCancel: { color: '#64748b', fontWeight: '600' },
  subSaveButton: { backgroundColor: '#059669', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  subSaveText: { color: '#ffffff', fontWeight: '700', fontSize: 12 },
});
