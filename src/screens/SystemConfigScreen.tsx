import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useAppStore } from '../store/useAppStore';
import { CriteriaNode, EntryType, FormulaPreset, ImpactPreviewReport } from '../types';
import { FormulaEditorModal } from '../components/FormulaEditorModal';
import { ImpactWarningModal } from '../components/ImpactWarningModal';
import { normalizeWeights } from '../engine/calculator';

interface SystemConfigScreenProps {
  folderId: string;
  onBack: () => void;
}

export const SystemConfigScreen: React.FC<SystemConfigScreenProps> = ({ folderId, onBack }) => {
  const { folders, updateCriteriaTree, applyCriteriaTreeChange, updateFolder } = useAppStore();
  const folder = folders.find((f) => f.id === folderId);

  if (!folder) return null;

  const [selectedEntryTypeId, setSelectedEntryTypeId] = useState<string>(
    folder.entryTypes[0]?.id || ''
  );
  const currentEntryType = folder.entryTypes.find((et) => et.id === selectedEntryTypeId);

  const [draftTree, setDraftTree] = useState<CriteriaNode | null>(
    currentEntryType ? JSON.parse(JSON.stringify(currentEntryType.rootCriteriaTree)) : null
  );

  // Modals state
  const [editingFormulaNode, setEditingFormulaNode] = useState<CriteriaNode | null>(null);
  const [impactReport, setImpactReport] = useState<ImpactPreviewReport | null>(null);
  const [pendingSaveTree, setPendingSaveTree] = useState<CriteriaNode | null>(null);

  const handleSelectEntryType = (etId: string) => {
    setSelectedEntryTypeId(etId);
    const et = folder.entryTypes.find((item) => item.id === etId);
    if (et) {
      setDraftTree(JSON.parse(JSON.stringify(et.rootCriteriaTree)));
    }
  };

  const updateNodeInTree = (
    tree: CriteriaNode,
    nodeId: string,
    updater: (node: CriteriaNode) => void
  ): CriteriaNode => {
    if (tree.id === nodeId) {
      const copy = { ...tree };
      updater(copy);
      return copy;
    }
    return {
      ...tree,
      children: tree.children.map((child) => updateNodeInTree(child, nodeId, updater)),
    };
  };

  const handleAddChildNode = (parentId: string) => {
    if (!draftTree) return;
    const newNode: CriteriaNode = {
      id: `node-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: 'Kriteria Baru',
      type: 'VALUE_LEAF',
      weight: 0,
      scaleLeaf: 10,
      scaleTarget: 100,
      children: [],
    };

    const updated = updateNodeInTree(draftTree, parentId, (parent) => {
      parent.type = 'AGGREGATE_NODE';
      parent.children = normalizeWeights([...parent.children, newNode]);
    });
    setDraftTree(updated);
  };

  const handleDeleteNode = (parentId: string, childId: string) => {
    if (!draftTree) return;
    const updated = updateNodeInTree(draftTree, parentId, (parent) => {
      const remaining = parent.children.filter((c) => c.id !== childId);
      parent.children = normalizeWeights(remaining);
      if (parent.children.length === 0 && parent.id !== draftTree.id) {
        parent.type = 'VALUE_LEAF';
      }
    });
    setDraftTree(updated);
  };

  const handleSaveTree = () => {
    if (!draftTree || !currentEntryType) return;

    // Check impact before applying
    const report = updateCriteriaTree(folder.id, currentEntryType.id, draftTree);
    if (report.totalAffectedEntries > 0) {
      setImpactReport(report);
      setPendingSaveTree(draftTree);
    } else {
      // Direct save if 0 affected entries
      applyCriteriaTreeChange(folder.id, currentEntryType.id, draftTree);
      Alert.alert('Sukses', 'Struktur Kriteria berhasil disimpan.');
    }
  };

  const handleConfirmImpact = () => {
    if (pendingSaveTree && currentEntryType) {
      applyCriteriaTreeChange(folder.id, currentEntryType.id, pendingSaveTree);
      setImpactReport(null);
      setPendingSaveTree(null);
      Alert.alert('Sukses', 'Struktur Kriteria berhasil diperbarui dan direkalkulasi.');
    }
  };

  const renderNodeItem = (node: CriteriaNode, parentId?: string, depth = 0) => {
    const isRoot = depth === 0;
    const hasChildren = node.children && node.children.length > 0;

    return (
      <View key={node.id} style={[styles.nodeCard, { marginLeft: depth * 16 }]}>
        <View style={styles.nodeHeaderRow}>
          <Text style={styles.depthBadge}>L{depth + 1}</Text>
          <TextInput
            style={styles.nodeNameInput}
            value={node.name}
            onChangeText={(text) => {
              if (!draftTree) return;
              setDraftTree(
                updateNodeInTree(draftTree, node.id, (n) => {
                  n.name = text;
                })
              );
            }}
          />

          {!isRoot && (
            <View style={styles.weightBox}>
              <Text style={styles.weightLabel}>Bobot (%):</Text>
              <TextInput
                style={styles.weightInput}
                keyboardType="numeric"
                value={String(node.weight)}
                onChangeText={(text) => {
                  if (!draftTree) return;
                  const num = parseFloat(text) || 0;
                  setDraftTree(
                    updateNodeInTree(draftTree, node.id, (n) => {
                      n.weight = num;
                    })
                  );
                }}
              />
            </View>
          )}

          {hasChildren && (
            <TouchableOpacity
              style={styles.formulaButton}
              onPress={() => setEditingFormulaNode(node)}
            >
              <Text style={styles.formulaButtonText}>
                f(x): {node.formulaPreset || 'WEIGHTED_SUM'}
              </Text>
            </TouchableOpacity>
          )}

          {!isRoot && parentId && (
            <TouchableOpacity
              style={styles.deleteNodeButton}
              onPress={() => handleDeleteNode(parentId, node.id)}
            >
              <Text style={styles.deleteNodeText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Node Properties Row */}
        <View style={styles.nodePropsRow}>
          <Text style={styles.nodeTypeBadge}>
            Tipe: {node.type === 'RELATION_LEAF' ? 'RELASI' : hasChildren ? 'AGREGAT' : 'LEAF NILAI'}
          </Text>

          {!hasChildren && node.type !== 'RELATION_LEAF' && (
            <View style={styles.scaleContainer}>
              <Text style={styles.scaleText}>Skala Leaf:</Text>
              <TextInput
                style={styles.scaleInput}
                keyboardType="numeric"
                value={String(node.scaleLeaf || 10)}
                onChangeText={(t) => {
                  if (!draftTree) return;
                  setDraftTree(
                    updateNodeInTree(draftTree, node.id, (n) => {
                      n.scaleLeaf = parseFloat(t) || 10;
                    })
                  );
                }}
              />
              <Text style={styles.scaleText}>➔ Target:</Text>
              <TextInput
                style={styles.scaleInput}
                keyboardType="numeric"
                value={String(node.scaleTarget || 100)}
                onChangeText={(t) => {
                  if (!draftTree) return;
                  setDraftTree(
                    updateNodeInTree(draftTree, node.id, (n) => {
                      n.scaleTarget = parseFloat(t) || 100;
                    })
                  );
                }}
              />
            </View>
          )}

          <TouchableOpacity
            style={styles.addChildButton}
            onPress={() => handleAddChildNode(node.id)}
          >
            <Text style={styles.addChildText}>+ Sub-Kriteria</Text>
          </TouchableOpacity>
        </View>

        {/* Children Recursion */}
        {hasChildren && (
          <View style={styles.childrenContainer}>
            {node.children.map((child) => renderNodeItem(child, node.id, depth + 1))}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← Kembali</Text>
        </TouchableOpacity>
        <Text style={styles.topTitle}>Konfigurasi Sistem Kriteria</Text>
        <TouchableOpacity style={styles.saveTopButton} onPress={handleSaveTree}>
          <Text style={styles.saveTopText}>Simpan Struktur</Text>
        </TouchableOpacity>
      </View>

      {/* Entry Types Tab Bar */}
      <View style={styles.entryTypeBar}>
        <Text style={styles.entryTypeLabel}>Jenis Entri:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {folder.entryTypes.map((et) => (
            <TouchableOpacity
              key={et.id}
              style={[
                styles.entryTypeTab,
                selectedEntryTypeId === et.id && styles.entryTypeTabActive,
              ]}
              onPress={() => handleSelectEntryType(et.id)}
            >
              <Text
                style={[
                  styles.entryTypeTabText,
                  selectedEntryTypeId === et.id && styles.entryTypeTabTextActive,
                ]}
              >
                {et.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Main Criteria Tree Content */}
      <ScrollView style={styles.treeScroll} contentContainerStyle={styles.treeScrollContent}>
        {draftTree && renderNodeItem(draftTree)}
      </ScrollView>

      {/* Formula Editor Modal */}
      {editingFormulaNode && (
        <FormulaEditorModal
          isOpen={!!editingFormulaNode}
          node={editingFormulaNode}
          onClose={() => setEditingFormulaNode(null)}
          onSave={(preset, customFormula) => {
            if (!draftTree) return;
            setDraftTree(
              updateNodeInTree(draftTree, editingFormulaNode.id, (n) => {
                n.formulaPreset = preset;
                n.customFormula = customFormula;
              })
            );
          }}
        />
      )}

      {/* Impact Warning Modal */}
      {impactReport && (
        <ImpactWarningModal
          isOpen={!!impactReport}
          report={impactReport}
          onCancel={() => {
            setImpactReport(null);
            setPendingSaveTree(null);
          }}
          onConfirm={handleConfirmImpact}
        />
      )}
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
  backButtonText: { fontSize: 14, color: '#2563eb', fontWeight: '600' },
  topTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  saveTopButton: { backgroundColor: '#2563eb', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  saveTopText: { color: '#ffffff', fontWeight: '700', fontSize: 13 },
  entryTypeBar: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
  },
  entryTypeLabel: { fontSize: 13, fontWeight: '700', color: '#475569', marginRight: 8 },
  entryTypeTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    marginRight: 8,
  },
  entryTypeTabActive: { backgroundColor: '#2563eb' },
  entryTypeTabText: { fontSize: 13, fontWeight: '600', color: '#475569' },
  entryTypeTabTextActive: { color: '#ffffff' },
  treeScroll: { flex: 1 },
  treeScrollContent: { padding: 16, paddingBottom: 40 },
  nodeCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  nodeHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  depthBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  nodeNameInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 13,
    fontWeight: '600',
  },
  weightBox: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  weightLabel: { fontSize: 11, color: '#64748b' },
  weightInput: {
    width: 44,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 2,
    fontSize: 12,
    textAlign: 'center',
  },
  formulaButton: { backgroundColor: '#eff6ff', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  formulaButtonText: { fontSize: 11, color: '#2563eb', fontWeight: '700' },
  deleteNodeButton: { paddingHorizontal: 6, paddingVertical: 2 },
  deleteNodeText: { color: '#ef4444', fontWeight: '700', fontSize: 14 },
  nodePropsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  nodeTypeBadge: { fontSize: 11, color: '#64748b', fontWeight: '600' },
  scaleContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  scaleText: { fontSize: 11, color: '#64748b' },
  scaleInput: {
    width: 36,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 4,
    paddingHorizontal: 2,
    fontSize: 11,
    textAlign: 'center',
  },
  addChildButton: { backgroundColor: '#f0fdf4', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  addChildText: { fontSize: 11, color: '#16a34a', fontWeight: '700' },
  childrenContainer: { marginTop: 8, borderLeftWidth: 2, borderLeftColor: '#e2e8f0', paddingLeft: 8 },
});
