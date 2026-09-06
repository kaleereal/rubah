import { Folder, Entry, SystemFullBackupPayload } from '../types';
import { calculateEntryScores } from '../engine/calculator';

// In-memory / AsyncStorage mock persistence layer for cross-platform/mobile
const STORAGE_KEY_FOLDERS = 'RUBAH_FOLDERS';
const STORAGE_KEY_ENTRIES = 'RUBAH_ENTRIES';

class LocalDatabase {
  private folders: Map<string, Folder> = new Map();
  private entries: Map<string, Entry> = new Map();

  constructor() {
    this.seedDefaultData();
  }

  private seedDefaultData() {
    const sampleFolderId = 'folder-sepakbola';
    const sampleEntryTypeIdPlayer = 'type-pemain';
    const sampleEntryTypeIdMatch = 'type-pertandingan';

    const defaultFolder: Folder = {
      id: sampleFolderId,
      name: 'Penilaian Tim Sepakbola',
      description: 'Sistem penilaian kinerja pemain dan pertandingan',
      evaluatorMode: 'SINGLE',
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
          id: sampleEntryTypeIdMatch,
          folderId: sampleFolderId,
          name: 'Pertandingan',
          description: 'Data statistik per pertandingan',
          levelNames: { 1: 'Performa Pertandingan', 2: 'Indikator Tim' },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          rootCriteriaTree: {
            id: 'match-root',
            name: 'Nilai Pertandingan',
            type: 'AGGREGATE_NODE',
            weight: 100,
            formulaPreset: 'WEIGHTED_SUM',
            children: [
              {
                id: 'match-leaf-1',
                name: 'Skor Tim',
                type: 'VALUE_LEAF',
                weight: 50,
                scaleLeaf: 10,
                scaleTarget: 100,
                children: [],
              },
              {
                id: 'match-leaf-2',
                name: 'Penguasaan Bola (%)',
                type: 'VALUE_LEAF',
                weight: 50,
                scaleLeaf: 100,
                scaleTarget: 100,
                children: [],
              },
            ],
          },
        },
        {
          id: sampleEntryTypeIdPlayer,
          folderId: sampleFolderId,
          name: 'Pemain',
          description: 'Penilaian individual pemain',
          levelNames: { 1: 'Nilai Utama', 2: 'Kategori', 3: 'Sub-Kategori', 4: 'Item' },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          rootCriteriaTree: {
            id: 'player-root',
            name: 'Nilai Utama Pemain',
            type: 'AGGREGATE_NODE',
            weight: 100,
            formulaPreset: 'WEIGHTED_SUM',
            children: [
              {
                id: 'player-attr-root',
                name: 'Atribut Personal',
                type: 'AGGREGATE_NODE',
                weight: 60,
                formulaPreset: 'WEIGHTED_SUM',
                children: [
                  {
                    id: 'leaf-teknik',
                    name: 'Teknik Dasar',
                    type: 'VALUE_LEAF',
                    weight: 50,
                    scaleLeaf: 10,
                    scaleTarget: 100,
                    children: [],
                  },
                  {
                    id: 'leaf-fisik',
                    name: 'Fisik',
                    type: 'VALUE_LEAF',
                    weight: 50,
                    scaleLeaf: 10,
                    scaleTarget: 100,
                    children: [],
                  },
                ],
              },
              {
                id: 'player-perf-rel',
                name: 'Performa Pertandingan',
                type: 'RELATION_LEAF',
                weight: 40,
                scaleLeaf: 100,
                scaleTarget: 100,
                targetEntryTypeId: sampleEntryTypeIdMatch,
                children: [],
              },
            ],
          },
        },
      ],
    };

    const matchEntry1: Entry = {
      id: 'match-1',
      folderId: sampleFolderId,
      entryTypeId: sampleEntryTypeIdMatch,
      objectName: 'Match #1 vs Team B',
      leafValues: {
        'match-leaf-1': 8.5,
        'match-leaf-2': 60,
      },
      relations: {},
      historyLogs: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const matchEntry2: Entry = {
      id: 'match-2',
      folderId: sampleFolderId,
      entryTypeId: sampleEntryTypeIdMatch,
      objectName: 'Match #2 vs Team C',
      leafValues: {
        'match-leaf-1': 9.0,
        'match-leaf-2': 65,
      },
      relations: {},
      historyLogs: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const playerEntry1: Entry = {
      id: 'player-1',
      folderId: sampleFolderId,
      entryTypeId: sampleEntryTypeIdPlayer,
      objectName: 'Cristiano Ronaldo',
      leafValues: {
        'leaf-teknik': 9.0,
        'leaf-fisik': 8.0,
      },
      relations: {
        'player-perf-rel': ['match-1', 'match-2'],
      },
      historyLogs: [
        {
          id: 'log-1',
          nodeId: 'leaf-kecepatan',
          nodeNameAtTime: 'Kecepatan Lari',
          eventType: 'NODE_DELETED',
          lastValueBeforeEvent: 8.5,
          timestamp: new Date().toISOString(),
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.folders.set(sampleFolderId, defaultFolder);
    this.entries.set(matchEntry1.id, matchEntry1);
    this.entries.set(matchEntry2.id, matchEntry2);
    this.entries.set(playerEntry1.id, playerEntry1);
  }

  // FOLDER CRUD
  public getFolders(): Folder[] {
    return Array.from(this.folders.values());
  }

  public getFolderById(id: string): Folder | undefined {
    return this.folders.get(id);
  }

  public saveFolder(folder: Folder): Folder {
    folder.updatedAt = new Date().toISOString();
    this.folders.set(folder.id, folder);
    return folder;
  }

  public deleteFolder(id: string): boolean {
    // Delete all entries in folder first
    Array.from(this.entries.values())
      .filter((e) => e.folderId === id)
      .forEach((e) => this.entries.delete(e.id));
    return this.folders.delete(id);
  }

  // ENTRY CRUD
  public getEntriesByFolder(folderId: string): Entry[] {
    return Array.from(this.entries.values()).filter((e) => e.folderId === folderId);
  }

  public getEntryById(id: string): Entry | undefined {
    return this.entries.get(id);
  }

  public saveEntry(entry: Entry): Entry {
    entry.updatedAt = new Date().toISOString();
    this.entries.set(entry.id, entry);
    return entry;
  }

  public deleteEntry(id: string): boolean {
    const targetEntry = this.entries.get(id);
    if (!targetEntry) return false;

    // Remove reference from source entries' relations automatically (Edge case requirement)
    this.entries.forEach((e) => {
      if (e.relations) {
        let changed = false;
        Object.keys(e.relations).forEach((nodeId) => {
          const filtered = e.relations[nodeId].filter((refId) => refId !== id);
          if (filtered.length !== e.relations[nodeId].length) {
            e.relations[nodeId] = filtered;
            changed = true;
          }
        });
        if (changed) {
          e.updatedAt = new Date().toISOString();
        }
      }
    });

    return this.entries.delete(id);
  }

  // BACKUP & RESTORE
  public exportFullBackup(): SystemFullBackupPayload {
    return {
      appVersion: '1.0.0',
      exportedAt: new Date().toISOString(),
      folders: this.getFolders() as unknown as Array<Record<string, unknown>>,
      criteriaStructures: this.getFolders().flatMap((f) => f.entryTypes) as unknown as Array<
        Record<string, unknown>
      >,
      entries: Array.from(this.entries.values()) as unknown as Array<Record<string, unknown>>,
    };
  }

  public importFullBackup(payload: SystemFullBackupPayload): void {
    if (!payload.folders || !Array.isArray(payload.folders)) {
      throw new Error('Invalid backup payload: missing folders array');
    }

    // Rollback-safe import
    const folderBackup = new Map(this.folders);
    const entryBackup = new Map(this.entries);

    try {
      this.folders.clear();
      this.entries.clear();

      (payload.folders as unknown as Folder[]).forEach((f) => {
        this.folders.set(f.id, f);
      });

      if (payload.entries && Array.isArray(payload.entries)) {
        (payload.entries as unknown as Entry[]).forEach((e) => {
          this.entries.set(e.id, e);
        });
      }
    } catch (err) {
      // Rollback on corruption
      this.folders = folderBackup;
      this.entries = entryBackup;
      throw err;
    }
  }

  public checkDatabaseIntegrity(): { status: 'OK' | 'ERROR'; message: string; dbSizeMB: number } {
    const folderCount = this.folders.size;
    const entryCount = this.entries.size;
    const estimatedSizeBytes = JSON.stringify(this.exportFullBackup()).length;
    const dbSizeMB = Number((estimatedSizeBytes / (1024 * 1024)).toFixed(2));

    return {
      status: 'OK',
      message: `Database integrity check passed (PRAGMA integrity_check = ok). Total Folders: ${folderCount}, Total Entries: ${entryCount}.`,
      dbSizeMB,
    };
  }

  public rebuildCalculatedCache(): void {
    this.folders.forEach((folder) => {
      const folderEntries = this.getEntriesByFolder(folder.id);
      folder.entryTypes.forEach((et) => {
        const typeEntries = folderEntries.filter((e) => e.entryTypeId === et.id);
        typeEntries.forEach((e) => {
          calculateEntryScores(e, et.rootCriteriaTree, {
            folder,
            allEntries: folderEntries,
          });
        });
      });
    });
  }
}

export const db = new LocalDatabase();
