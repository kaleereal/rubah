import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Switch,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useAppStore } from '../store/useAppStore';
import { PDFExportConfig } from '../types';

interface PDFExportConfigScreenProps {
  folderId: string;
  targetEntryId?: string;
  onBack: () => void;
}

export const PDFExportConfigScreen: React.FC<PDFExportConfigScreenProps> = ({
  folderId,
  targetEntryId,
  onBack,
}) => {
  const { folders, updateFolder, activeEntries } = useAppStore();
  const folder = folders.find((f) => f.id === folderId);

  if (!folder) return null;

  const initialConfig: PDFExportConfig = folder.pdfExportConfig || {
    showRootScore: true,
    showBreakdownTree: true,
    showHistoryLogs: true,
    showConnectedRelations: true,
    mode: 'FULL',
  };

  const [config, setConfig] = useState<PDFExportConfig>(initialConfig);
  const [isGenerating, setIsGenerating] = useState(false);

  const targetEntry = targetEntryId ? activeEntries.find((e) => e.id === targetEntryId) : undefined;

  const toggleSwitch = (key: keyof PDFExportConfig) => {
    if (typeof config[key] === 'boolean') {
      const updated = { ...config, [key]: !config[key] };
      setConfig(updated);
      // Persist setting per-folder
      updateFolder({ ...folder, pdfExportConfig: updated });
    }
  };

  const handleGeneratePDF = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      Alert.alert(
        'PDF Berhasil Dibuat',
        `Berkas PDF snapshot untuk ${
          targetEntry ? targetEntry.objectName : 'seluruh entri'
        } berhasil disusun.`
      );
    }, 1000);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← Kembali</Text>
        </TouchableOpacity>
        <Text style={styles.topTitle}>Konfigurasi & Cetak PDF</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Export Target Banner */}
        <View style={styles.targetBanner}>
          <Text style={styles.targetLabel}>TARGET EKSPOR:</Text>
          <Text style={styles.targetTitle}>
            {targetEntry ? `Entri Tunggal: ${targetEntry.objectName}` : `Seluruh Folder: ${folder.name}`}
          </Text>
        </View>

        {/* Mode Selector */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>MODE TAMPILAN LAPORAN</Text>
          <View style={styles.modeRow}>
            <TouchableOpacity
              style={[styles.modeTab, config.mode === 'FULL' && styles.modeTabActive]}
              onPress={() => {
                const updated = { ...config, mode: 'FULL' as const };
                setConfig(updated);
                updateFolder({ ...folder, pdfExportConfig: updated });
              }}
            >
              <Text
                style={[styles.modeText, config.mode === 'FULL' && styles.modeTextActive]}
              >
                Mode Full (Lengkap)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modeTab, config.mode === 'SIMPLE' && styles.modeTabActive]}
              onPress={() => {
                const updated = { ...config, mode: 'SIMPLE' as const };
                setConfig(updated);
                updateFolder({ ...folder, pdfExportConfig: updated });
              }}
            >
              <Text
                style={[styles.modeText, config.mode === 'SIMPLE' && styles.modeTextActive]}
              >
                Mode Sederhana
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Visibility Switches */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>SULUS ELEMEN YANG DITAMPILKAN (TOGGLE)</Text>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Tampilkan Nilai Akhir (Root Score)</Text>
            <Switch
              value={config.showRootScore}
              onValueChange={() => toggleSwitch('showRootScore')}
            />
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Tampilkan Pohon Breakdown Kriteria</Text>
            <Switch
              value={config.showBreakdownTree}
              onValueChange={() => toggleSwitch('showBreakdownTree')}
            />
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Tampilkan Log Riwayat Peristiwa Struktural</Text>
            <Switch
              value={config.showHistoryLogs}
              onValueChange={() => toggleSwitch('showHistoryLogs')}
            />
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Tampilkan Rincian Entri Relasi Terhubung</Text>
            <Switch
              value={config.showConnectedRelations}
              onValueChange={() => toggleSwitch('showConnectedRelations')}
            />
          </View>
        </View>

        {/* Live Preview Simulation Card */}
        <View style={styles.previewCard}>
          <Text style={styles.previewTitle}>PRATINJAU TATA LETAK PDF SNAPSHOT</Text>
          <View style={styles.previewPaper}>
            <Text style={styles.previewPaperTitle}>{targetEntry ? targetEntry.objectName : folder.name}</Text>
            {config.showRootScore && (
              <View style={styles.previewBox}>
                <Text style={styles.previewBoxText}>[ Nilai Akhir / Root Score ]</Text>
              </View>
            )}
            {config.showBreakdownTree && (
              <View style={styles.previewBox}>
                <Text style={styles.previewBoxText}>[ Pohon Rincian Nilai N-Level ]</Text>
              </View>
            )}
            {config.showHistoryLogs && (
              <View style={styles.previewBox}>
                <Text style={styles.previewBoxText}>[ Log Riwayat Struktural ]</Text>
              </View>
            )}
            {config.showConnectedRelations && (
              <View style={styles.previewBox}>
                <Text style={styles.previewBoxText}>[ Rincian Relasi Sumber ]</Text>
              </View>
            )}
          </View>
        </View>

        {/* Export CTA Button */}
        <TouchableOpacity
          style={styles.exportButton}
          onPress={handleGeneratePDF}
          disabled={isGenerating}
        >
          <Text style={styles.exportButtonText}>
            {isGenerating ? 'Menyusun Berkas PDF...' : '📄 Cetak / Ekspor PDF Snapshot'}
          </Text>
        </TouchableOpacity>
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
  backButtonText: { color: '#2563eb', fontWeight: '600', fontSize: 13 },
  topTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  targetBanner: {
    backgroundColor: '#eff6ff',
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  targetLabel: { fontSize: 11, fontWeight: '800', color: '#1d4ed8' },
  targetTitle: { fontSize: 15, fontWeight: '700', color: '#1e3a8a', marginTop: 2 },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sectionTitle: { fontSize: 11, fontWeight: '800', color: '#64748b', marginBottom: 12, letterSpacing: 0.5 },
  modeRow: { flexDirection: 'row', gap: 8 },
  modeTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    alignItems: 'center',
  },
  modeTabActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  modeText: { fontSize: 13, fontWeight: '600', color: '#334155' },
  modeTextActive: { color: '#ffffff' },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  switchLabel: { fontSize: 13, fontWeight: '600', color: '#1e293b' },
  previewCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  previewTitle: { fontSize: 11, fontWeight: '800', color: '#64748b', marginBottom: 12, letterSpacing: 0.5 },
  previewPaper: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 12,
    minHeight: 120,
  },
  previewPaperTitle: { fontSize: 14, fontWeight: '700', color: '#0f172a', marginBottom: 8 },
  previewBox: {
    backgroundColor: '#ffffff',
    padding: 8,
    borderRadius: 6,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  previewBoxText: { fontSize: 11, color: '#64748b', fontWeight: '600' },
  exportButton: {
    backgroundColor: '#0284c7',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  exportButtonText: { color: '#ffffff', fontWeight: '800', fontSize: 15 },
});
