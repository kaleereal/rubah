import { create, StoreApi, UseBoundStore } from 'zustand';
import {
  Folder,
  Entry,
  CriteriaNode,
  ImpactPreviewReport,
  SystemFullBackupPayload,
} from '../types';
import { db } from '../storage/database';
import { calculateImpactReport, calculateEntryScores } from '../engine/calculator';

export interface AppState {
  folders: Folder[];
  activeFolder: Folder | null;
  activeEntries: Entry[];

  // Actions
  loadFolders: () => void;
  setActiveFolder: (folderId: string | null) => void;
  createFolder: (name: string, description?: string, evaluatorMode?: 'SINGLE' | 'MULTI') => Folder;
  updateFolder: (folder: Folder) => void;
  deleteFolder: (folderId: string) => void;

  // Criteria Tree Actions
  updateCriteriaTree: (
    folderId: string,
    entryTypeId: string,
    newTree: CriteriaNode
  ) => ImpactPreviewReport;
  applyCriteriaTreeChange: (folderId: string, entryTypeId: string, newTree: CriteriaNode) => void;

  // Entry Actions
  saveEntry: (entry: Entry) => void;
  deleteEntry: (entryId: string) => void;
  getComputedEntryScore: (entryId: string) => number;

  // Backup & System Actions
  exportBackup: () => SystemFullBackupPayload;
  importBackup: (payload: SystemFullBackupPayload) => void;
  checkIntegrity: () => { status: 'OK' | 'ERROR'; message: string; dbSizeMB: number };
  rebuildCache: () => void;
}

export const useAppStore: UseBoundStore<StoreApi<AppState>> = create<AppState>((set, get) => ({
  folders: db.getFolders(),
  activeFolder: db.getFolders()[0] || null,
  activeEntries: db.getFolders()[0] ? db.getEntriesByFolder(db.getFolders()[0].id) : [],

  loadFolders: () => {
    const folders = db.getFolders();
    const currentActive = get().activeFolder;
    const activeFolder = currentActive
      ? folders.find((f) => f.id === currentActive.id) || folders[0] || null
      : folders[0] || null;
    const activeEntries = activeFolder ? db.getEntriesByFolder(activeFolder.id) : [];

    set({ folders, activeFolder, activeEntries });
  },

  setActiveFolder: (folderId: string | null) => {
    if (!folderId) {
      set({ activeFolder: null, activeEntries: [] });
      return;
    }
    const folder = db.getFolderById(folderId) || null;
    const activeEntries = folder ? db.getEntriesByFolder(folder.id) : [];
    set({ activeFolder: folder, activeEntries });
  },

  createFolder: (name: string, description?: string, evaluatorMode: 'SINGLE' | 'MULTI' = 'SINGLE') => {
    const newFolderId = `folder-${Date.now()}`;
    const defaultEntryTypeId = `type-${Date.now()}`;

    const newFolder: Folder = {
      id: newFolderId,
      name,
      description,
      evaluatorMode,
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
          id: defaultEntryTypeId,
          folderId: newFolderId,
          name: 'Penilaian Utama',
          description: 'Jenis entri standar',
          levelNames: { 1: 'Nilai Utama', 2: 'Kategori', 3: 'Sub-Kategori', 4: 'Item' },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          rootCriteriaTree: {
            id: `root-${Date.now()}`,
            name: 'Nilai Utama',
            type: 'AGGREGATE_NODE',
            weight: 100,
            formulaPreset: 'WEIGHTED_SUM',
            children: [
              {
                id: `leaf-${Date.now()}-1`,
                name: 'Kriteria 1',
                type: 'VALUE_LEAF',
                weight: 50,
                scaleLeaf: 10,
                scaleTarget: 100,
                children: [],
              },
              {
                id: `leaf-${Date.now()}-2`,
                name: 'Kriteria 2',
                type: 'VALUE_LEAF',
                weight: 50,
                scaleLeaf: 10,
                scaleTarget: 100,
                children: [],
              },
            ],
          },
        },
      ],
    };

    db.saveFolder(newFolder);
    get().loadFolders();
    get().setActiveFolder(newFolderId);
    return newFolder;
  },

  updateFolder: (folder: Folder) => {
    db.saveFolder(folder);
    get().loadFolders();
  },

  deleteFolder: (folderId: string) => {
    db.deleteFolder(folderId);
    get().loadFolders();
  },

  updateCriteriaTree: (folderId: string, entryTypeId: string, newTree: CriteriaNode) => {
    const folder = db.getFolderById(folderId);
    if (!folder) throw new Error('Folder not found');

    const entryType = folder.entryTypes.find((et) => et.id === entryTypeId);
    if (!entryType) throw new Error('Entry type not found');

    const existingEntries = db.getEntriesByFolder(folderId).filter((e) => e.entryTypeId === entryTypeId);
    return calculateImpactReport(entryType.rootCriteriaTree, newTree, existingEntries);
  },

  applyCriteriaTreeChange: (folderId: string, entryTypeId: string, newTree: CriteriaNode) => {
    const folder = db.getFolderById(folderId);
    if (!folder) return;

    const entryType = folder.entryTypes.find((et) => et.id === entryTypeId);
    if (!entryType) return;

    const oldTree = entryType.rootCriteriaTree;
    entryType.rootCriteriaTree = newTree;
    entryType.updatedAt = new Date().toISOString();
    db.saveFolder(folder);

    const impact = calculateImpactReport(
      oldTree,
      newTree,
      db.getEntriesByFolder(folderId).filter((e) => e.entryTypeId === entryTypeId)
    );

    if (impact.deletedNodeNames.length > 0) {
      const folderEntries = db.getEntriesByFolder(folderId).filter((e) => e.entryTypeId === entryTypeId);
      folderEntries.forEach((e) => {
        impact.deletedNodeNames.forEach((deletedName) => {
          e.historyLogs.push({
            id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            nodeId: 'deleted-node',
            nodeNameAtTime: deletedName,
            eventType: 'NODE_DELETED',
            lastValueBeforeEvent: null,
            timestamp: new Date().toISOString(),
          });
        });
        db.saveEntry(e);
      });
    }

    db.rebuildCalculatedCache();
    get().loadFolders();
  },

  saveEntry: (entry: Entry) => {
    db.saveEntry(entry);
    get().loadFolders();
  },

  deleteEntry: (entryId: string) => {
    db.deleteEntry(entryId);
    get().loadFolders();
  },

  getComputedEntryScore: (entryId: string) => {
    const entry = db.getEntryById(entryId);
    if (!entry) return 0;

    const folder = db.getFolderById(entry.folderId);
    if (!folder) return 0;

    const entryType = folder.entryTypes.find((et) => et.id === entry.entryTypeId);
    if (!entryType) return 0;

    const allEntries = db.getEntriesByFolder(entry.folderId);
    const result = calculateEntryScores(entry, entryType.rootCriteriaTree, { folder, allEntries });
    return result.normalizedScore;
  },

  exportBackup: () => {
    return db.exportFullBackup();
  },

  importBackup: (payload: SystemFullBackupPayload) => {
    db.importFullBackup(payload);
    get().loadFolders();
  },

  checkIntegrity: () => {
    return db.checkDatabaseIntegrity();
  },

  rebuildCache: () => {
    db.rebuildCalculatedCache();
    get().loadFolders();
  },
}));
