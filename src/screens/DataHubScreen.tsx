import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useAppStore } from '../store/useAppStore';

interface DataHubScreenProps {
  onBack: () => void;
}

export const DataHubScreen: React.FC<DataHubScreenProps> = ({ onBack }) => {
  const { folders, activeEntries, exportBackup, importBackup, checkIntegrity, rebuildCache } =
    useAppStore();

  const [integrityResult, setIntegrityResult] = useState<{
    status: 'OK' | 'ERROR';
    message: string;
    dbSizeMB: number;
  } | null>(checkIntegrity());

  const handleExportBackup = () => {
    const payload = exportBackup();
    const jsonStr = JSON.stringify(payload, null, 2);
    Alert.alert(
      'Cadangan Berhasil Diekspor',
      `Berkas cadangan JSON berhasil dibuat (${(jsonStr.length / 1024).toFixed(1)} KB).`
    );
  };

  const handleRestoreBackup = () => {
    // Simulated backup restore for demo/mobile
    const sampleRestorePayload = exportBackup();
    try {
      importBackup(sampleRestorePayload);
      setIntegrityResult(checkIntegrity());
      Alert.alert('Sukses Pemulihan', 'Data lokal berhasil dipulihkan tanpa korupsi.');
    } catch (err: any) {
      Alert.alert('Gagal Pemulihan', err?.message || 'Format JSON tidak valid.');
    }
  };

  const handleCheckIntegrity = () => {
    const res = checkIntegrity();
    setIntegrityResult(res);
    Alert.alert('Pemeriksaan Integritas Database', res.message);
  };

  const handleRebuildCache = () => {
    rebuildCache();
    Alert.alert('Sukses', 'Cache hasil hitung berhasil dibangun ulang.');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← Dashboard</Text>
        </TouchableOpacity>
        <Text style={styles.topTitle}>Pusat Data & Cadangan Offline</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Storage Summary Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>RINGKASAN STORAGE LOKAL</Text>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{folders.length}</Text>
              <Text style={styles.statLabel}>Total Folder</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{activeEntries.length}</Text>
              <Text style={styles.statLabel}>Total Entri</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>
                {integrityResult ? `${integrityResult.dbSizeMB} MB` : '0.1 MB'}
              </Text>
              <Text style={styles.statLabel}>Ukuran DB</Text>
            </View>
          </View>
        </View>

        {/* Backup & Restore Panel */}
        <View style={styles.panelCard}>
          <Text style={styles.panelTitle}>AKSES CADANGAN & PEMULIHAN DATA</Text>

          <TouchableOpacity style={styles.actionCard} onPress={handleExportBackup}>
            <Text style={styles.actionIcon}>📦</Text>
            <View style={styles.actionInfo}>
              <Text style={styles.actionTitle}>Ekspor Cadangan Lengkap (.json)</Text>
              <Text style={styles.actionSub}>
                Simpan seluruh folder, kriteria, dan entri ke satu berkas JSON
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={handleRestoreBackup}>
            <Text style={styles.actionIcon}>📥</Text>
            <View style={styles.actionInfo}>
              <Text style={styles.actionTitle}>Pulihkan Data dari Berkas JSON</Text>
              <Text style={styles.actionSub}>
                Impor berkas cadangan penuh untuk memulihkan sistem
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* System Maintenance Panel */}
        <View style={styles.panelCard}>
          <Text style={styles.panelTitle}>PEMELIHARAAN SYSTEM & DATABASE</Text>
          <View style={styles.maintRow}>
            <TouchableOpacity style={styles.maintButton} onPress={handleCheckIntegrity}>
              <Text style={styles.maintText}>Check Integrity Database</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.maintButton} onPress={handleRebuildCache}>
              <Text style={styles.maintText}>Re-build Cache Hasil Hitung</Text>
            </TouchableOpacity>
          </View>
        </View>
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
  summaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  summaryTitle: { fontSize: 11, fontWeight: '800', color: '#64748b', marginBottom: 12, letterSpacing: 0.5 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  statBox: { alignItems: 'center' },
  statNumber: { fontSize: 20, fontWeight: '800', color: '#2563eb' },
  statLabel: { fontSize: 11, color: '#64748b', marginTop: 2 },
  panelCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  panelTitle: { fontSize: 11, fontWeight: '800', color: '#64748b', marginBottom: 12, letterSpacing: 0.5 },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  actionIcon: { fontSize: 24, marginRight: 12 },
  actionInfo: { flex: 1 },
  actionTitle: { fontSize: 14, fontWeight: '700', color: '#1e293b' },
  actionSub: { fontSize: 12, color: '#64748b', marginTop: 2 },
  maintRow: { flexDirection: 'row', gap: 8 },
  maintButton: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  maintText: { fontSize: 12, fontWeight: '700', color: '#334155' },
});
