import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useAppStore } from '../store/useAppStore';

interface DataEntryListScreenProps {
  folderId: string;
  onOpenConfig: () => void;
  onOpenNewEntry: (entryTypeId: string) => void;
  onOpenEditEntry: (entryId: string) => void;
  onOpenEntryDetail: (entryId: string) => void;
  onOpenExportPdf: (entryId?: string) => void;
  onBack: () => void;
}

export const DataEntryListScreen: React.FC<DataEntryListScreenProps> = ({
  folderId,
  onOpenConfig,
  onOpenNewEntry,
  onOpenEditEntry,
  onOpenEntryDetail,
  onOpenExportPdf,
  onBack,
}) => {
  const { folders, activeEntries, getComputedEntryScore, deleteEntry } = useAppStore();
  const folder = folders.find((f) => f.id === folderId);

  if (!folder) return null;

  const [selectedEntryTypeId, setSelectedEntryTypeId] = useState<string>(
    folder.entryTypes[0]?.id || ''
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'SCORE_DESC' | 'SCORE_ASC' | 'DATE_DESC'>('SCORE_DESC');

  const filteredEntries = activeEntries
    .filter(
      (e) =>
        e.entryTypeId === selectedEntryTypeId &&
        e.objectName.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .map((e) => ({
      ...e,
      computedScore: getComputedEntryScore(e.id),
    }));

  if (sortBy === 'SCORE_DESC') {
    filteredEntries.sort((a, b) => b.computedScore - a.computedScore);
  } else if (sortBy === 'SCORE_ASC') {
    filteredEntries.sort((a, b) => a.computedScore - b.computedScore);
  } else {
    filteredEntries.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← Dashboard</Text>
        </TouchableOpacity>
        <Text style={styles.folderTitle}>{folder.name}</Text>
        <TouchableOpacity style={styles.configButton} onPress={onOpenConfig}>
          <Text style={styles.configButtonText}>⚙️ Konfigurasi</Text>
        </TouchableOpacity>
      </View>

      {/* Entry Type Selector Tabs */}
      <View style={styles.tabContainer}>
        {folder.entryTypes.map((et) => (
          <TouchableOpacity
            key={et.id}
            style={[styles.typeTab, selectedEntryTypeId === et.id && styles.typeTabActive]}
            onPress={() => setSelectedEntryTypeId(et.id)}
          >
            <Text
              style={[
                styles.typeTabText,
                selectedEntryTypeId === et.id && styles.typeTabTextActive,
              ]}
            >
              {et.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Search & Action Row */}
      <View style={styles.actionRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Cari nama entri..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity
          style={styles.newEntryButton}
          onPress={() => onOpenNewEntry(selectedEntryTypeId)}
        >
          <Text style={styles.newEntryButtonText}>+ Entri Baru</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.pdfAllButton}
          onPress={() => onOpenExportPdf()}
        >
          <Text style={styles.pdfAllButtonText}>📄 PDF</Text>
        </TouchableOpacity>
      </View>

      {/* Sort Bar */}
      <View style={styles.sortRow}>
        <Text style={styles.sortLabel}>Urutkan:</Text>
        <TouchableOpacity
          style={[styles.sortChip, sortBy === 'SCORE_DESC' && styles.sortChipActive]}
          onPress={() => setSortBy('SCORE_DESC')}
        >
          <Text style={styles.sortChipText}>Nilai ➔ Rendah</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sortChip, sortBy === 'DATE_DESC' && styles.sortChipActive]}
          onPress={() => setSortBy('DATE_DESC')}
        >
          <Text style={styles.sortChipText}>Terbaru</Text>
        </TouchableOpacity>
      </View>

      {/* Entry List */}
      <FlatList
        data={filteredEntries}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.entryCard}>
            <TouchableOpacity
              style={styles.cardMain}
              onPress={() => onOpenEntryDetail(item.id)}
            >
              <View style={styles.cardInfo}>
                <Text style={styles.objectName}>{item.objectName}</Text>
                <Text style={styles.dateText}>
                  Diperbarui: {new Date(item.updatedAt).toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.scoreBadge}>
                <Text style={styles.scoreValue}>{item.computedScore.toFixed(1)}</Text>
                <Text style={styles.scoreLabel}>Nilai Akhir</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.cardActions}>
              <TouchableOpacity
                style={styles.actionItem}
                onPress={() => onOpenEditEntry(item.id)}
              >
                <Text style={styles.actionText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionItem}
                onPress={() => onOpenExportPdf(item.id)}
              >
                <Text style={styles.actionText}>Cetak PDF</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionItem}
                onPress={() => deleteEntry(item.id)}
              >
                <Text style={[styles.actionText, { color: '#ef4444' }]}>Hapus</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Belum ada data entri tersimpan.</Text>
            <TouchableOpacity
              style={styles.emptyCTA}
              onPress={() => onOpenNewEntry(selectedEntryTypeId)}
            >
              <Text style={styles.emptyCTAText}>+ Buat Entri Pertama</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  topBar: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: { padding: 4 },
  backButtonText: { color: '#2563eb', fontWeight: '600', fontSize: 13 },
  folderTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  configButton: { backgroundColor: '#f1f5f9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  configButtonText: { fontSize: 12, fontWeight: '600', color: '#334155' },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  typeTab: { paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  typeTabActive: { borderBottomColor: '#2563eb' },
  typeTabText: { fontSize: 14, fontWeight: '600', color: '#64748b' },
  typeTabTextActive: { color: '#2563eb', fontWeight: '700' },
  actionRow: { padding: 16, flexDirection: 'row', gap: 8 },
  searchInput: {
    flex: 1,
    height: 40,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 13,
  },
  newEntryButton: { backgroundColor: '#2563eb', paddingHorizontal: 12, height: 40, borderRadius: 8, justifyContent: 'center' },
  newEntryButtonText: { color: '#ffffff', fontWeight: '600', fontSize: 13 },
  pdfAllButton: { backgroundColor: '#0284c7', paddingHorizontal: 10, height: 40, borderRadius: 8, justifyContent: 'center' },
  pdfAllButtonText: { color: '#ffffff', fontWeight: '600', fontSize: 13 },
  sortRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 12, gap: 8 },
  sortLabel: { fontSize: 12, color: '#64748b', fontWeight: '600' },
  sortChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, backgroundColor: '#e2e8f0' },
  sortChipActive: { backgroundColor: '#2563eb' },
  sortChipText: { fontSize: 11, fontWeight: '600', color: '#334155' },
  listContent: { paddingHorizontal: 16, paddingBottom: 24 },
  entryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardMain: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardInfo: { flex: 1 },
  objectName: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  dateText: { fontSize: 12, color: '#94a3b8', marginTop: 4 },
  scoreBadge: {
    backgroundColor: '#eff6ff',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center',
  },
  scoreValue: { fontSize: 18, fontWeight: '800', color: '#2563eb' },
  scoreLabel: { fontSize: 10, color: '#3b82f6', fontWeight: '600' },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  actionItem: { paddingVertical: 2 },
  actionText: { fontSize: 12, fontWeight: '600', color: '#2563eb' },
  emptyContainer: { alignItems: 'center', marginTop: 40 },
  emptyText: { fontSize: 15, color: '#64748b', fontWeight: '600' },
  emptyCTA: { marginTop: 12, backgroundColor: '#2563eb', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  emptyCTAText: { color: '#ffffff', fontWeight: '700', fontSize: 13 },
});
