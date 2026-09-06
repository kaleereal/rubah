import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  Modal,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { useAppStore } from '../store/useAppStore';
import { Folder } from '../types';

interface FolderDashboardScreenProps {
  onSelectFolder: (folderId: string) => void;
  onOpenDataHub: () => void;
}

export const FolderDashboardScreen: React.FC<FolderDashboardScreenProps> = ({
  onSelectFolder,
  onOpenDataHub,
}) => {
  const { folders, createFolder, deleteFolder, importBackup } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderDesc, setNewFolderDesc] = useState('');
  const [evaluatorMode, setEvaluatorMode] = useState<'SINGLE' | 'MULTI'>('SINGLE');

  const filteredFolders = folders.filter(
    (f) =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.description && f.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    const created = createFolder(newFolderName.trim(), newFolderDesc.trim(), evaluatorMode);
    setNewFolderName('');
    setNewFolderDesc('');
    setIsCreateModalOpen(false);
    onSelectFolder(created.id);
  };

  const handleImportBackupJson = () => {
    // Simulated JSON file picker import for demo/mobile
    const mockImportPayload = {
      appVersion: '1.0.0',
      exportedAt: new Date().toISOString(),
      folders: [
        {
          id: `imported-folder-${Date.now()}`,
          name: 'Hasil Impor - Sistem Penilaian Baru',
          description: 'Folder diimpor dari berkas JSON luar',
          evaluatorMode: 'SINGLE',
          pdfExportConfig: {
            showRootScore: true,
            showBreakdownTree: true,
            showHistoryLogs: true,
            showConnectedRelations: true,
            mode: 'FULL',
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          entryTypes: [
            {
              id: `imported-type-${Date.now()}`,
              folderId: `imported-folder-${Date.now()}`,
              name: 'Penilaian Impor',
              rootCriteriaTree: {
                id: `root-${Date.now()}`,
                name: 'Nilai Utama Impor',
                type: 'AGGREGATE_NODE',
                weight: 100,
                children: [
                  {
                    id: `leaf-1-${Date.now()}`,
                    name: 'Indikator A',
                    type: 'VALUE_LEAF',
                    weight: 100,
                    scaleLeaf: 10,
                    scaleTarget: 100,
                    children: [],
                  },
                ],
              },
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
        },
      ],
      criteriaStructures: [],
      entries: [],
    };

    importBackup(mockImportPayload as any);
    Alert.alert('Sukses Impor', 'Folder baru berhasil dibuat dari berkas JSON.');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Bar */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Dashboard Folder Assessment</Text>
          <Text style={styles.subtitle}>Pilih atau buat sistem penilaian baru</Text>
        </View>
        <TouchableOpacity style={styles.dataHubButton} onPress={onOpenDataHub}>
          <Text style={styles.dataHubButtonText}>⚙️ Data Hub</Text>
        </TouchableOpacity>
      </View>

      {/* Action Bar & Search */}
      <View style={styles.actionRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Cari folder..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => setIsCreateModalOpen(true)}
        >
          <Text style={styles.createButtonText}>+ Folder Baru</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.importButton}
          onPress={handleImportBackupJson}
        >
          <Text style={styles.importButtonText}>📥 Impor JSON</Text>
        </TouchableOpacity>
      </View>

      {/* Folder List */}
      <FlatList
        data={filteredFolders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.folderCard}
            onPress={() => onSelectFolder(item.id)}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.folderName}>{item.name}</Text>
              <View style={styles.modeBadge}>
                <Text style={styles.modeBadgeText}>{item.evaluatorMode}</Text>
              </View>
            </View>
            <Text style={styles.folderDesc} numberOfLines={2}>
              {item.description || 'Tidak ada deskripsi'}
            </Text>
            <View style={styles.cardFooter}>
              <Text style={styles.footerText}>
                Jenis Entri: {item.entryTypes.length} | Diperbarui:{' '}
                {new Date(item.updatedAt).toLocaleDateString()}
              </Text>
              <TouchableOpacity
                onPress={() => deleteFolder(item.id)}
                style={styles.deleteButton}
              >
                <Text style={styles.deleteButtonText}>Hapus</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Belum ada folder assessment.</Text>
            <Text style={styles.emptySubtext}>
              Klik "+ Folder Baru" atau "Impor JSON" untuk memulai.
            </Text>
          </View>
        }
      />

      {/* Create Folder Modal */}
      <Modal visible={isCreateModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Buat Folder Assessment Baru</Text>

            <Text style={styles.inputLabel}>Nama Folder / Proyek *</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Contoh: Evaluasi Kinerja Karyawan Q3"
              value={newFolderName}
              onChangeText={setNewFolderName}
            />

            <Text style={styles.inputLabel}>Deskripsi Singkat</Text>
            <TextInput
              style={[styles.modalInput, { height: 60 }]}
              placeholder="Sistem penilaian internal..."
              multiline
              value={newFolderDesc}
              onChangeText={setNewFolderDesc}
            />

            <Text style={styles.inputLabel}>Mode Penilai</Text>
            <View style={styles.modeToggleRow}>
              <TouchableOpacity
                style={[
                  styles.modeOption,
                  evaluatorMode === 'SINGLE' && styles.modeOptionActive,
                ]}
                onPress={() => setEvaluatorMode('SINGLE')}
              >
                <Text
                  style={[
                    styles.modeOptionText,
                    evaluatorMode === 'SINGLE' && styles.modeOptionTextActive,
                  ]}
                >
                  Single-Penilai
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modeOption,
                  evaluatorMode === 'MULTI' && styles.modeOptionActive,
                ]}
                onPress={() => setEvaluatorMode('MULTI')}
              >
                <Text
                  style={[
                    styles.modeOptionText,
                    evaluatorMode === 'MULTI' && styles.modeOptionTextActive,
                  ]}
                >
                  Multi-Penilai
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelModalButton}
                onPress={() => setIsCreateModalOpen(false)}
              >
                <Text style={styles.cancelModalButtonText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveModalButton}
                onPress={handleCreateFolder}
              >
                <Text style={styles.saveModalButtonText}>Simpan & Buka</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { fontSize: 20, fontWeight: '700', color: '#0f172a' },
  subtitle: { fontSize: 13, color: '#64748b', marginTop: 2 },
  dataHubButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
  },
  dataHubButtonText: { fontSize: 13, fontWeight: '600', color: '#334155' },
  actionRow: {
    padding: 16,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    height: 40,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  createButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 14,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
  },
  createButtonText: { color: '#ffffff', fontWeight: '600', fontSize: 13 },
  importButton: {
    backgroundColor: '#059669',
    paddingHorizontal: 12,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
  },
  importButtonText: { color: '#ffffff', fontWeight: '600', fontSize: 13 },
  listContent: { paddingHorizontal: 16, paddingBottom: 24 },
  folderCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  folderName: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  modeBadge: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  modeBadgeText: { fontSize: 11, fontWeight: '700', color: '#2563eb' },
  folderDesc: { fontSize: 13, color: '#64748b', marginVertical: 8 },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 8,
  },
  footerText: { fontSize: 12, color: '#94a3b8' },
  deleteButton: { padding: 4 },
  deleteButtonText: { color: '#ef4444', fontSize: 12, fontWeight: '600' },
  emptyContainer: { alignItems: 'center', marginTop: 40 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#64748b' },
  emptySubtext: { fontSize: 13, color: '#94a3b8', marginTop: 4 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a', marginBottom: 16 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#334155', marginTop: 8, marginBottom: 4 },
  modalInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  modeToggleRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  modeOption: {
    flex: 1,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    alignItems: 'center',
  },
  modeOptionActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  modeOptionText: { fontSize: 13, fontWeight: '600', color: '#334155' },
  modeOptionTextActive: { color: '#ffffff' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 20 },
  cancelModalButton: { paddingVertical: 10, paddingHorizontal: 16 },
  cancelModalButtonText: { color: '#64748b', fontWeight: '600' },
  saveModalButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  saveModalButtonText: { color: '#ffffff', fontWeight: '600' },
});
