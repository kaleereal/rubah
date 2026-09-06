import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useAppStore } from '../store/useAppStore';
import { ComputedNodeResult } from '../types';
import { calculateEntryScores } from '../engine/calculator';

interface EntryDetailScreenProps {
  entryId: string;
  onEditEntry: (entryId: string) => void;
  onExportPdf: (entryId: string) => void;
  onBack: () => void;
}

export const EntryDetailScreen: React.FC<EntryDetailScreenProps> = ({
  entryId,
  onEditEntry,
  onExportPdf,
  onBack,
}) => {
  const { folders, activeEntries } = useAppStore();
  const entry = activeEntries.find((e) => e.id === entryId);

  if (!entry) return null;

  const folder = folders.find((f) => f.id === entry.folderId);
  const entryType = folder?.entryTypes.find((et) => et.id === entry.entryTypeId);

  if (!folder || !entryType) return null;

  const [activeTab, setActiveTab] = useState<'BREAKDOWN' | 'HISTORY' | 'RELATIONS'>('BREAKDOWN');

  const computedResult = calculateEntryScores(entry, entryType.rootCriteriaTree, {
    folder,
    allEntries: activeEntries,
  });

  const renderBreakdownTree = (nodeResult: ComputedNodeResult, depth = 0) => {
    return (
      <View key={nodeResult.nodeId} style={[styles.treeCard, { marginLeft: depth * 14 }]}>
        <View style={styles.treeHeader}>
          <Text style={styles.treeName}>{nodeResult.name}</Text>
          <View style={styles.scorePill}>
            <Text style={styles.scorePillText}>
              {nodeResult.normalizedScore.toFixed(1)} / 100
            </Text>
          </View>
        </View>

        <View style={styles.treeMetaRow}>
          <Text style={styles.treeMetaText}>
            Bobot: {nodeResult.weight}% | Kontribusi: {nodeResult.weightedContribution.toFixed(1)} pt
          </Text>
          <Text style={styles.treeMetaText}>Tipe: {nodeResult.type}</Text>
        </View>

        {nodeResult.relationDetails && nodeResult.relationDetails.length > 0 && (
          <View style={styles.relBox}>
            <Text style={styles.relBoxTitle}>
              Kontribusi dari {nodeResult.relationDetails.length} Entri Terhubung:
            </Text>
            {nodeResult.relationDetails.map((rel) => (
              <Text key={rel.entryId} style={styles.relBoxItem}>
                • {rel.objectName}: Skor {rel.score.toFixed(1)}
              </Text>
            ))}
          </View>
        )}

        {nodeResult.childrenResults && nodeResult.childrenResults.length > 0 && (
          <View style={styles.treeChildren}>
            {nodeResult.childrenResults.map((child) => renderBreakdownTree(child, depth + 1))}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← Daftar Entri</Text>
        </TouchableOpacity>
        <Text style={styles.topTitle}>{entry.objectName}</Text>
        <TouchableOpacity style={styles.editTopButton} onPress={() => onEditEntry(entry.id)}>
          <Text style={styles.editTopText}>Edit Entri</Text>
        </TouchableOpacity>
      </View>

      {/* Root Summary Score Banner */}
      <View style={styles.summaryBanner}>
        <View>
          <Text style={styles.bannerTitle}>NILAI AKHIR ENTRI</Text>
          <Text style={styles.bannerSub}>Jenis Entri: {entryType.name}</Text>
        </View>
        <View style={styles.scoreCircle}>
          <Text style={styles.scoreCircleValue}>{computedResult.normalizedScore.toFixed(1)}</Text>
        </View>
      </View>

      {/* Segmented Tabs */}
      <View style={styles.segmentedRow}>
        <TouchableOpacity
          style={[styles.segmentTab, activeTab === 'BREAKDOWN' && styles.segmentTabActive]}
          onPress={() => setActiveTab('BREAKDOWN')}
        >
          <Text
            style={[styles.segmentText, activeTab === 'BREAKDOWN' && styles.segmentTextActive]}
          >
            Rincian Nilai
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentTab, activeTab === 'HISTORY' && styles.segmentTabActive]}
          onPress={() => setActiveTab('HISTORY')}
        >
          <Text
            style={[styles.segmentText, activeTab === 'HISTORY' && styles.segmentTextActive]}
          >
            Riwayat ({entry.historyLogs.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentTab, activeTab === 'RELATIONS' && styles.segmentTabActive]}
          onPress={() => setActiveTab('RELATIONS')}
        >
          <Text
            style={[styles.segmentText, activeTab === 'RELATIONS' && styles.segmentTextActive]}
          >
            Relasi
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      <ScrollView style={styles.contentScroll} contentContainerStyle={styles.contentPadding}>
        {activeTab === 'BREAKDOWN' && (
          <View>
            <Text style={styles.sectionHeaderTitle}>
              POHON BREAKDOWN N-LEVEL (BOTTOM-UP TRANSPARENCY)
            </Text>
            {renderBreakdownTree(computedResult)}
          </View>
        )}

        {activeTab === 'HISTORY' && (
          <View>
            <Text style={styles.sectionHeaderTitle}>LOG RIWAYAT PERISTIWA STRUKTURAL</Text>
            {entry.historyLogs.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>
                  Belum ada perubahan struktur kriteria pada entri ini.
                </Text>
              </View>
            ) : (
              entry.historyLogs.map((log) => (
                <View key={log.id} style={styles.logCard}>
                  <Text style={styles.logEventType}>
                    {log.eventType === 'NODE_DELETED'
                      ? '🗑️ Kriteria Dihapus'
                      : '➕ Kriteria Ditambahkan'}
                  </Text>
                  <Text style={styles.logNodeName}>Nama Kriteria: "{log.nodeNameAtTime}"</Text>
                  <Text style={styles.logDate}>
                    Waktu: {new Date(log.timestamp).toLocaleString()}
                  </Text>
                </View>
              ))
            )}
          </View>
        )}

        {activeTab === 'RELATIONS' && (
          <View>
            <Text style={styles.sectionHeaderTitle}>DAFTAR ENTRI SUMBER TERHUBUNG</Text>
            {Object.keys(entry.relations).length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>Belum ada relasi terhubung pada entri ini.</Text>
              </View>
            ) : (
              Object.entries(entry.relations).map(([nodeId, targetIds]) => (
                <View key={nodeId} style={styles.relCard}>
                  <Text style={styles.relNodeTitle}>Node Relasi ID: {nodeId}</Text>
                  {targetIds.map((tId) => {
                    const targetObj = activeEntries.find((e) => e.id === tId);
                    return (
                      <Text key={tId} style={styles.relTargetItem}>
                        • {targetObj ? targetObj.objectName : tId}
                      </Text>
                    );
                  })}
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* Floating Export Action Bar */}
      <View style={styles.floatingFooter}>
        <TouchableOpacity
          style={styles.exportPdfButton}
          onPress={() => onExportPdf(entry.id)}
        >
          <Text style={styles.exportPdfText}>📄 Ekspor PDF SnapShot</Text>
        </TouchableOpacity>
      </View>
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
  topTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  editTopButton: { backgroundColor: '#f1f5f9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  editTopText: { fontSize: 12, fontWeight: '600', color: '#334155' },
  summaryBanner: {
    backgroundColor: '#1e293b',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bannerTitle: { color: '#94a3b8', fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  bannerSub: { color: '#ffffff', fontSize: 14, fontWeight: '700', marginTop: 2 },
  scoreCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreCircleValue: { color: '#ffffff', fontSize: 18, fontWeight: '800' },
  segmentedRow: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  segmentTab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  segmentTabActive: { borderBottomColor: '#2563eb' },
  segmentText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  segmentTextActive: { color: '#2563eb', fontWeight: '700' },
  contentScroll: { flex: 1 },
  contentPadding: { padding: 16, paddingBottom: 80 },
  sectionHeaderTitle: { fontSize: 11, fontWeight: '800', color: '#64748b', marginBottom: 12, letterSpacing: 0.5 },
  treeCard: { backgroundColor: '#ffffff', borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  treeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  treeName: { fontSize: 14, fontWeight: '700', color: '#1e293b' },
  scorePill: { backgroundColor: '#eff6ff', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  scorePillText: { fontSize: 12, fontWeight: '700', color: '#2563eb' },
  treeMetaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  treeMetaText: { fontSize: 11, color: '#64748b' },
  relBox: { backgroundColor: '#f8fafc', padding: 8, borderRadius: 6, marginTop: 8 },
  relBoxTitle: { fontSize: 11, fontWeight: '700', color: '#334155' },
  relBoxItem: { fontSize: 11, color: '#475569', marginTop: 2 },
  treeChildren: { marginTop: 8, borderLeftWidth: 2, borderLeftColor: '#cbd5e1', paddingLeft: 6 },
  logCard: { backgroundColor: '#ffffff', borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  logEventType: { fontSize: 13, fontWeight: '700', color: '#0f172a' },
  logNodeName: { fontSize: 12, color: '#334155', marginTop: 2 },
  logDate: { fontSize: 11, color: '#94a3b8', marginTop: 4 },
  emptyCard: { backgroundColor: '#ffffff', padding: 20, borderRadius: 10, alignItems: 'center' },
  emptyText: { color: '#94a3b8', fontSize: 13 },
  relCard: { backgroundColor: '#ffffff', borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  relNodeTitle: { fontSize: 13, fontWeight: '700', color: '#1e293b', marginBottom: 4 },
  relTargetItem: { fontSize: 12, color: '#475569' },
  floatingFooter: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#ffffff', borderTopWidth: 1, borderTopColor: '#e2e8f0', padding: 12 },
  exportPdfButton: { backgroundColor: '#0284c7', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  exportPdfText: { color: '#ffffff', fontWeight: '700', fontSize: 14 },
});
