import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useAppStore } from './src/store/useAppStore';
import { FolderDashboardScreen } from './src/screens/FolderDashboardScreen';
import { SystemConfigScreen } from './src/screens/SystemConfigScreen';
import { DataEntryListScreen } from './src/screens/DataEntryListScreen';
import { FormEntryFillingScreen } from './src/screens/FormEntryFillingScreen';
import { EntryDetailScreen } from './src/screens/EntryDetailScreen';
import { PDFExportConfigScreen } from './src/screens/PDFExportConfigScreen';
import { DataHubScreen } from './src/screens/DataHubScreen';
import { RelationSelectorModal } from './src/components/RelationSelectorModal';

export default function App() {
  const { activeFolder, setActiveFolder } = useAppStore();

  type ScreenState =
    | { name: 'DASHBOARD' }
    | { name: 'DATA_HUB' }
    | { name: 'SYSTEM_CONFIG'; folderId: string }
    | { name: 'ENTRY_LIST'; folderId: string }
    | { name: 'FORM_ENTRY'; folderId: string; entryTypeId: string; existingEntryId?: string }
    | { name: 'ENTRY_DETAIL'; entryId: string }
    | { name: 'PDF_EXPORT'; folderId: string; targetEntryId?: string };

  const [currentScreen, setCurrentScreen] = useState<ScreenState>({ name: 'DASHBOARD' });

  // Relation Picker Modal State
  const [relationPickerState, setRelationPickerState] = useState<{
    isOpen: boolean;
    folderId: string;
    sourceEntryId: string;
    relationNodeId: string;
    initialSelectedIds: string[];
    onApplyCallback?: (selectedIds: string[]) => void;
  } | null>(null);

  const handleSelectFolder = (folderId: string) => {
    setActiveFolder(folderId);
    setCurrentScreen({ name: 'ENTRY_LIST', folderId });
  };

  return (
    <View style={styles.container}>
      {currentScreen.name === 'DASHBOARD' && (
        <FolderDashboardScreen
          onSelectFolder={handleSelectFolder}
          onOpenDataHub={() => setCurrentScreen({ name: 'DATA_HUB' })}
        />
      )}

      {currentScreen.name === 'DATA_HUB' && (
        <DataHubScreen onBack={() => setCurrentScreen({ name: 'DASHBOARD' })} />
      )}

      {currentScreen.name === 'ENTRY_LIST' && (
        <DataEntryListScreen
          folderId={currentScreen.folderId}
          onOpenConfig={() =>
            setCurrentScreen({ name: 'SYSTEM_CONFIG', folderId: currentScreen.folderId })
          }
          onOpenNewEntry={(entryTypeId) =>
            setCurrentScreen({
              name: 'FORM_ENTRY',
              folderId: currentScreen.folderId,
              entryTypeId,
            })
          }
          onOpenEditEntry={(entryId) => {
            const entry = useAppStore
              .getState()
              .activeEntries.find((e) => e.id === entryId);
            if (entry) {
              setCurrentScreen({
                name: 'FORM_ENTRY',
                folderId: currentScreen.folderId,
                entryTypeId: entry.entryTypeId,
                existingEntryId: entryId,
              });
            }
          }}
          onOpenEntryDetail={(entryId) => setCurrentScreen({ name: 'ENTRY_DETAIL', entryId })}
          onOpenExportPdf={(entryId) =>
            setCurrentScreen({
              name: 'PDF_EXPORT',
              folderId: currentScreen.folderId,
              targetEntryId: entryId,
            })
          }
          onBack={() => setCurrentScreen({ name: 'DASHBOARD' })}
        />
      )}

      {currentScreen.name === 'SYSTEM_CONFIG' && (
        <SystemConfigScreen
          folderId={currentScreen.folderId}
          onBack={() => setCurrentScreen({ name: 'ENTRY_LIST', folderId: currentScreen.folderId })}
        />
      )}

      {currentScreen.name === 'FORM_ENTRY' && (
        <FormEntryFillingScreen
          folderId={currentScreen.folderId}
          entryTypeId={currentScreen.entryTypeId}
          existingEntryId={currentScreen.existingEntryId}
          onOpenRelationPicker={(nodeId, currentTargetIds, onApplySelected) => {
            setRelationPickerState({
              isOpen: true,
              folderId: currentScreen.folderId,
              sourceEntryId: currentScreen.existingEntryId || 'new',
              relationNodeId: nodeId,
              initialSelectedIds: currentTargetIds,
              onApplyCallback: onApplySelected,
            });
          }}
          onBack={() => setCurrentScreen({ name: 'ENTRY_LIST', folderId: currentScreen.folderId })}
        />
      )}

      {currentScreen.name === 'ENTRY_DETAIL' && (
        <EntryDetailScreen
          entryId={currentScreen.entryId}
          onEditEntry={(entryId) => {
            const entry = useAppStore
              .getState()
              .activeEntries.find((e) => e.id === entryId);
            if (entry) {
              setCurrentScreen({
                name: 'FORM_ENTRY',
                folderId: entry.folderId,
                entryTypeId: entry.entryTypeId,
                existingEntryId: entryId,
              });
            }
          }}
          onExportPdf={(entryId) => {
            const entry = useAppStore
              .getState()
              .activeEntries.find((e) => e.id === entryId);
            if (entry) {
              setCurrentScreen({
                name: 'PDF_EXPORT',
                folderId: entry.folderId,
                targetEntryId: entryId,
              });
            }
          }}
          onBack={() => {
            if (activeFolder) {
              setCurrentScreen({ name: 'ENTRY_LIST', folderId: activeFolder.id });
            } else {
              setCurrentScreen({ name: 'DASHBOARD' });
            }
          }}
        />
      )}

      {currentScreen.name === 'PDF_EXPORT' && (
        <PDFExportConfigScreen
          folderId={currentScreen.folderId}
          targetEntryId={currentScreen.targetEntryId}
          onBack={() => setCurrentScreen({ name: 'ENTRY_LIST', folderId: currentScreen.folderId })}
        />
      )}

      {/* Global Relation Picker Modal */}
      {relationPickerState && relationPickerState.isOpen && (
        <RelationSelectorModal
          isOpen={relationPickerState.isOpen}
          folderId={relationPickerState.folderId}
          sourceEntryId={relationPickerState.sourceEntryId}
          relationNodeId={relationPickerState.relationNodeId}
          initialSelectedIds={relationPickerState.initialSelectedIds}
          onClose={() => setRelationPickerState(null)}
          onApply={(selectedIds) => {
            if (relationPickerState.onApplyCallback) {
              relationPickerState.onApplyCallback(selectedIds);
            }
            setRelationPickerState(null);
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
});
