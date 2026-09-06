import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useAppStore } from '../store/useAppStore';
import { CriteriaNode, Entry } from '../types';
import { calculateEntryScores } from '../engine/calculator';

interface FormEntryFillingScreenProps {
  folderId: string;
  entryTypeId: string;
  existingEntryId?: string;
  onOpenRelationPicker: (
    nodeId: string,
    currentTargetIds: string[],
    onApplySelected: (selectedIds: string[]) => void
  ) => void;
  onBack: () => void;
}

export const FormEntryFillingScreen: React.FC<FormEntryFillingScreenProps> = ({
  folderId,
  entryTypeId,
  existingEntryId,
  onOpenRelationPicker,
  onBack,
}) => {
  const { folders, saveEntry, activeEntries } = useAppStore();
  const folder = folders.find((f) => f.id === folderId);
  const entryType = folder?.entryTypes.find((et) => et.id === entryTypeId);

  if (!folder || !entryType) return null;

  const existingEntry = existingEntryId
    ? activeEntries.find((e) => e.id === existingEntryId)
    : undefined;

  const [objectName, setObjectName] = useState(existingEntry?.objectName || '');
  const [leafValues, setLeafValues] = useState<Record<string, number | null>>(
    existingEntry ? { ...existingEntry.leafValues } : {}
  );
  const [relations, setRelations] = useState<Record<string, string[]>>(
    existingEntry ? { ...existingEntry.relations } : {}
  );

  const tempEntry: Entry = {
    id: existingEntryId || `temp-${Date.now()}`,
    folderId,
    entryTypeId,
    objectName: objectName || 'Baru',
    leafValues,
    relations,
    historyLogs: existingEntry?.historyLogs || [],
    createdAt: existingEntry?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const computedResult = calculateEntryScores(tempEntry, entryType.rootCriteriaTree, {
    folder,
    allEntries: activeEntries,
  });

  const handleSave = () => {
    if (!objectName.trim()) return;

    const saved: Entry = {
      ...tempEntry,
      objectName: objectName.trim(),
      updatedAt: new Date().toISOString(),
    };

    saveEntry(saved);
    onBack();
  };

  const renderFormTreeNode = (node: CriteriaNode, depth = 0) => {
    const isLeafValue =
      node.type === 'VALUE_LEAF' ||
      ((!node.children || node.children.length === 0) && node.type !== 'RELATION_LEAF');
    const isRelationLeaf = node.type === 'RELATION_LEAF';

    return (
      <View key={node.id} style={[styles.formNodeCard, { marginLeft: depth * 12 }]}>
        <View style={styles.formNodeHeader}>
          <Text style={styles.formNodeTitle}>{node.name}</Text>
          {node.faqHint && <Text style={styles.faqBadge}>ℹ️ {node.faqHint}</Text>}
        </View>

        {isLeafValue && (
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>Nilai Input (Skala 0-{node.scaleLeaf || 10}):</Text>
            <TextInput
              style={styles.leafInput}
              keyboardType="numeric"
              placeholder="0"
              value={
                leafValues[node.id] !== undefined && leafValues[node.id] !== null
                  ? String(leafValues[node.id])
                  : ''
              }
              onChangeText={(text) => {
                const val = text.trim() === '' ? null : parseFloat(text);
                setLeafValues((prev) => ({ ...prev, [node.id]: val }));
              }}
            />
          </View>
        )}

        {isRelationLeaf && (
          <View style={styles.relationRow}>
            <Text style={styles.relationLabel}>
              Entri Terhubung ({relations[node.id]?.length || 0}):
            </Text>
            <TouchableOpacity
              style={styles.relationPickerButton}
              onPress={() =>
                onOpenRelationPicker(node.id, relations[node.id] || [], (selectedIds) => {
                  setRelations((prev) => ({ ...prev, [node.id]: selectedIds }));
                })
              }
            >
              <Text style={styles.relationPickerText}>
                {relations[node.id] && relations[node.id].length > 0
                  ? `Pilih (${relations[node.id].length} Terpilih)`
                  : '🔗 [Pilih Relasi]'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {node.children && node.children.length > 0 && (
          <View style={styles.childrenWrapper}>
            {node.children.map((child) => renderFormTreeNode(child, depth + 1))}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>✕ Batal</Text>
        </TouchableOpacity>
        <Text style={styles.topTitle}>
          {existingEntryId ? 'Edit Entri' : 'Buat Entri Baru'}: {entryType.name}
        </Text>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Simpan Data</Text>
        </TouchableOpacity>
      </View>

      {/* Live Calculated Root Score Banner */}
      <View style={styles.liveScoreBanner}>
        <View style={styles.liveScoreLeft}>
          <Text style={styles.liveScoreLabel}>LIVE COMPUTED RESULT</Text>
          <Text style={styles.liveScoreSub}>Diperbarui otomatis secara real-time</Text>
        </View>
        <View style={styles.liveScoreBadge}>
          <Text style={styles.liveScoreNumber}>{computedResult.normalizedScore.toFixed(1)}</Text>
          <Text style={styles.liveScoreTarget}>/ 100</Text>
        </View>
      </View>

      {/* Main Form Fields */}
      <ScrollView style={styles.formScroll} contentContainerStyle={styles.formScrollContent}>
        <View style={styles.sectionCard}>
          <Text style={styles.fieldLabel}>Nama Objek / Subjek *</Text>
          <TextInput
            style={styles.objectNameInput}
            placeholder="Contoh: Cristiano Ronaldo atau Pertandingan #1"
            value={objectName}
            onChangeText={setObjectName}
          />
        </View>

        <Text style={styles.sectionHeaderTitle}>PENGISIAN KRITERIA PENILAIAN</Text>
        {renderFormTreeNode(entryType.rootCriteriaTree)}
      </ScrollView>
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
  backButtonText: { color: '#64748b', fontWeight: '600', fontSize: 13 },
  topTitle: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  saveButton: { backgroundColor: '#2563eb', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  saveButtonText: { color: '#ffffff', fontWeight: '700', fontSize: 13 },
  liveScoreBanner: {
    backgroundColor: '#1e293b',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  liveScoreLeft: { flex: 1 },
  liveScoreLabel: { color: '#38bdf8', fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  liveScoreSub: { color: '#94a3b8', fontSize: 12, marginTop: 2 },
  liveScoreBadge: { flexDirection: 'row', alignItems: 'baseline', backgroundColor: '#0f172a', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  liveScoreNumber: { fontSize: 22, fontWeight: '800', color: '#38bdf8' },
  liveScoreTarget: { fontSize: 12, color: '#64748b', marginLeft: 2 },
  formScroll: { flex: 1 },
  formScrollContent: { padding: 16, paddingBottom: 40 },
  sectionCard: { backgroundColor: '#ffffff', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  fieldLabel: { fontSize: 13, fontWeight: '700', color: '#334155', marginBottom: 6 },
  objectNameInput: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14 },
  sectionHeaderTitle: { fontSize: 12, fontWeight: '800', color: '#64748b', marginBottom: 8, letterSpacing: 0.5 },
  formNodeCard: { backgroundColor: '#ffffff', borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  formNodeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  formNodeTitle: { fontSize: 14, fontWeight: '700', color: '#1e293b' },
  faqBadge: { fontSize: 11, color: '#2563eb' },
  inputRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  inputLabel: { fontSize: 12, color: '#475569' },
  leafInput: { width: 70, borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, textAlign: 'center', fontSize: 13, fontWeight: '700' },
  relationRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  relationLabel: { fontSize: 12, color: '#475569' },
  relationPickerButton: { backgroundColor: '#eff6ff', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  relationPickerText: { color: '#2563eb', fontWeight: '700', fontSize: 12 },
  childrenWrapper: { marginTop: 8, borderLeftWidth: 2, borderLeftColor: '#e2e8f0', paddingLeft: 6 },
});
