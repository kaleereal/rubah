import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Modal, StyleSheet } from 'react-native';
import { CriteriaNode, FormulaPreset } from '../types';

interface FormulaEditorModalProps {
  isOpen: boolean;
  node: CriteriaNode | null;
  onClose: () => void;
  onSave: (preset: FormulaPreset, customFormula?: string) => void;
}

export const FormulaEditorModal: React.FC<FormulaEditorModalProps> = ({
  isOpen,
  node,
  onClose,
  onSave,
}) => {
  if (!node) return null;

  const [preset, setPreset] = useState<FormulaPreset>(node.formulaPreset || 'WEIGHTED_SUM');
  const [customFormula, setCustomFormula] = useState<string>(node.customFormula || '');

  const handleSave = () => {
    onSave(preset, customFormula);
    onClose();
  };

  return (
    <Modal visible={isOpen} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Editor Rumus Node: {node.name}</Text>
          <Text style={styles.subtitle}>
            Atur bagaimana nilai anak-anak ({node.children.length} node) digabungkan.
          </Text>

          <Text style={styles.sectionTitle}>PILIH METODE AGREGASI (PRESET):</Text>
          <View style={styles.presetGrid}>
            {(
              [
                ['WEIGHTED_SUM', 'Rata-Rata Terbobot (Weight × Nilai)'],
                ['AVERAGE', 'Rata-Rata Sederhana (Jumlah ÷ N)'],
                ['SUM', 'Penjumlahan Total (Sum)'],
                ['MIN', 'Nilai Minimum (Min)'],
                ['MAX', 'Nilai Maksimum (Max)'],
                ['CUSTOM', 'Rumus Kustom / Ekspresi Kondisional'],
              ] as const
            ).map(([pKey, pLabel]) => (
              <TouchableOpacity
                key={pKey}
                style={[styles.presetOption, preset === pKey && styles.presetOptionActive]}
                onPress={() => setPreset(pKey as FormulaPreset)}
              >
                <Text
                  style={[
                    styles.presetOptionText,
                    preset === pKey && styles.presetOptionTextActive,
                  ]}
                >
                  {pLabel}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {preset === 'CUSTOM' && (
            <View style={styles.customContainer}>
              <Text style={styles.inputLabel}>Ekspresi Rumus Kustom / Logika Kondisional</Text>
              <TextInput
                style={styles.formulaInput}
                multiline
                placeholder="Contoh: IF(child_1 > 80, child_1 * 1.1, child_1 * 0.9 + child_2 * 0.1)"
                value={customFormula}
                onChangeText={setCustomFormula}
              />
              <Text style={styles.helperText}>
                Variabel yang dapat digunakan: child_1, child_2, atau ID node anak.
                Fungsi didukung: IF(cond, trueVal, falseVal), MIN(), MAX(), AVG().
              </Text>
            </View>
          )}

          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelText}>Batal</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveText}>Terapkan Rumus</Text>
            </TouchableOpacity>
          </View>
        </View>
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
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
  },
  title: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  subtitle: { fontSize: 13, color: '#64748b', marginTop: 4, marginBottom: 16 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: '#475569', marginBottom: 8 },
  presetGrid: { gap: 8 },
  presetOption: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
  },
  presetOptionActive: { backgroundColor: '#eff6ff', borderColor: '#2563eb' },
  presetOptionText: { fontSize: 13, color: '#334155', fontWeight: '500' },
  presetOptionTextActive: { color: '#2563eb', fontWeight: '700' },
  customContainer: { marginTop: 12 },
  inputLabel: { fontSize: 12, fontWeight: '600', color: '#334155', marginBottom: 4 },
  formulaInput: {
    height: 70,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
    backgroundColor: '#f8fafc',
  },
  helperText: { fontSize: 11, color: '#64748b', marginTop: 4 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 20 },
  cancelButton: { paddingVertical: 10, paddingHorizontal: 16 },
  cancelText: { color: '#64748b', fontWeight: '600' },
  saveButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  saveText: { color: '#ffffff', fontWeight: '600' },
});
