import { db } from '../storage/database';
import { useAppStore } from '../store/useAppStore';

describe('Database & Persistence Layer Tests', () => {
  test('seed default data is present', () => {
    const folders = db.getFolders();
    expect(folders.length).toBeGreaterThan(0);
    const defaultFolder = folders[0];
    expect(defaultFolder.name).toContain('Sepakbola');

    const entries = db.getEntriesByFolder(defaultFolder.id);
    expect(entries.length).toBeGreaterThan(0);
  });

  test('calculates root score for seeded Cristiano Ronaldo entry', () => {
    const store = useAppStore.getState();
    const ronaldoScore = store.getComputedEntryScore('player-1');
    expect(ronaldoScore).toBeGreaterThan(0);
  });

  test('exports and imports full JSON backup', () => {
    const backup = db.exportFullBackup();
    expect(backup.folders.length).toBeGreaterThan(0);
    expect(backup.entries.length).toBeGreaterThan(0);

    db.importFullBackup(backup);
    const check = db.checkDatabaseIntegrity();
    expect(check.status).toBe('OK');
  });

  test('handles entry deletion and relation cascade cleanup', () => {
    const match1 = db.getEntryById('match-1');
    expect(match1).toBeDefined();

    db.deleteEntry('match-1');
    const player1 = db.getEntryById('player-1');
    expect(player1?.relations['player-perf-rel']).not.toContain('match-1');
  });
});
