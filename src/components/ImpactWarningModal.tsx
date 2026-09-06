import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { ImpactPreviewReport } from '../types';

interface ImpactWarningModalProps {
  isOpen: boolean;
  report: ImpactPreviewReport;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ImpactWarningModal: React.FC<ImpactWarningModalProps> = ({
  isOpen,
  report,
  onConfirm,
  onCancel,
}) => {
  return (
    <Modal visible={isOpen} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.icon}>⚠️</Text>
            <Text style={styles.title}>PERINGATAN PERUBAHAN STRUKTUR KRITERIA</Text>
          </View>

          <Text style={styles.subtitle}>
            Anda akan mengubah Struktur Kriteria pada folder ini.
          </Text>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>ESTIMASI DAMPAK PERUBAHAN:</Text>
            <Text style={styles.bullet}>
              • Total Entri Terpengaruh: <Text style={styles.bold}>{report.totalAffectedEntries} Entri</Text>
            </Text>
            {report.deletedNodeNames.length > 0 && (
              <Text style={styles.bullet}>
                • Kriteria Dihapus: <Text style={styles.bold}>{report.deletedNodeNames.join(', ')}</Text>
              </Text>
            )}
            {report.addedNodeNames.length > 0 && (
              <Text style={styles.bullet}>
                • Kriteria Ditambahkan: <Text style={styles.bold}>{report.addedNodeNames.join(', ')}</Text>
              </Text>
            )}
          </View>

          <Text style={styles.explanationNote}>
            Catatan: Nilai entri lama pada kriteria yang dihapus akan dipindah ke Riwayat, dan kriteria
            baru akan bernilai 0 sampai diisi.
          </Text>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
              <Text style={styles.cancelText}>Batal Perubahan</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmButton} onPress={onConfirm}>
              <Text style={styles.confirmText}>
                Yakin & Recalculate ({report.totalAffectedEntries})
              </Text>
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
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#fcd34d',
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  icon: { fontSize: 20 },
  title: { fontSize: 15, fontWeight: '800', color: '#b45309' },
  subtitle: { fontSize: 13, color: '#334155', marginBottom: 12 },
  summaryCard: {
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  summaryTitle: { fontSize: 12, fontWeight: '700', color: '#92400e', marginBottom: 6 },
  bullet: { fontSize: 13, color: '#78350f', marginBottom: 4 },
  bold: { fontWeight: '700' },
  explanationNote: { fontSize: 12, color: '#64748b', fontStyle: 'italic', marginBottom: 16 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  cancelText: { color: '#475569', fontWeight: '600', fontSize: 13 },
  confirmButton: {
    backgroundColor: '#d97706',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  confirmText: { color: '#ffffff', fontWeight: '700', fontSize: 13 },
});
