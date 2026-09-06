import { calculateEntryScores, detectRelationCycle, evaluateCustomFormula, calculateImpactReport } from '../engine/calculator';
import { CriteriaNode, Entry, Folder } from '../types';

describe('Rubah Assessment Engine Tests', () => {
  const sampleTree: CriteriaNode = {
    id: 'root',
    name: 'Nilai Utama',
    type: 'AGGREGATE_NODE',
    weight: 100,
    formulaPreset: 'WEIGHTED_SUM',
    children: [
      {
        id: 'c1',
        name: 'Teknik Dasar',
        type: 'VALUE_LEAF',
        weight: 60,
        scaleLeaf: 10,
        scaleTarget: 100,
        children: [],
      },
      {
        id: 'c2',
        name: 'Fisik',
        type: 'VALUE_LEAF',
        weight: 40,
        scaleLeaf: 10,
        scaleTarget: 100,
        children: [],
      },
    ],
  };

  const sampleFolder: Folder = {
    id: 'f1',
    name: 'Tim Sepakbola',
    evaluatorMode: 'SINGLE',
    entryTypes: [
      {
        id: 'et1',
        name: 'Pemain',
        folderId: 'f1',
        rootCriteriaTree: sampleTree,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const sampleEntry: Entry = {
    id: 'e1',
    folderId: 'f1',
    entryTypeId: 'et1',
    objectName: 'Pemain #1',
    leafValues: {
      c1: 8,
      c2: 9,
    },
    relations: {},
    historyLogs: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  test('calculates weighted sum and scale conversion correctly', () => {
    const result = calculateEntryScores(sampleEntry, sampleTree, {
      folder: sampleFolder,
      allEntries: [sampleEntry],
    });

    expect(result.childrenResults[0].normalizedScore).toBe(80);
    expect(result.childrenResults[1].normalizedScore).toBe(90);
    expect(result.normalizedScore).toBe(84);
  });

  test('evaluates custom conditional IF expression formula correctly', () => {
    const customFormula = 'IF(child_1 > 75, child_1 * 1.1, child_1)';
    const valPass = evaluateCustomFormula(customFormula, { child_1: 80 });
    const valFail = evaluateCustomFormula(customFormula, { child_1: 70 });

    expect(valPass).toBe(88);
    expect(valFail).toBe(70);
  });

  test('detects circular references in multi-entry relations', () => {
    const entryA: Entry = {
      id: 'A',
      folderId: 'f1',
      entryTypeId: 'et1',
      objectName: 'Entry A',
      leafValues: {},
      relations: { rel1: ['B'] },
      historyLogs: [],
      createdAt: '',
      updatedAt: '',
    };

    const entryB: Entry = {
      id: 'B',
      folderId: 'f1',
      entryTypeId: 'et1',
      objectName: 'Entry B',
      leafValues: {},
      relations: { rel1: ['C'] },
      historyLogs: [],
      createdAt: '',
      updatedAt: '',
    };

    const entryC: Entry = {
      id: 'C',
      folderId: 'f1',
      entryTypeId: 'et1',
      objectName: 'Entry C',
      leafValues: {},
      relations: { rel1: ['A'] },
      historyLogs: [],
      createdAt: '',
      updatedAt: '',
    };

    const allEntries = [entryA, entryB, entryC];

    const isCycle = detectRelationCycle('C', 'A', allEntries);
    expect(isCycle).toBe(true);

    const isNotCycle = detectRelationCycle('A', 'B', [entryA, entryB]);
    expect(isNotCycle).toBe(false);
  });

  test('calculates impact report deltas', () => {
    const newTree: CriteriaNode = {
      ...sampleTree,
      children: [
        sampleTree.children[0],
        {
          id: 'c3',
          name: 'Akurasi Umpan',
          type: 'VALUE_LEAF',
          weight: 40,
          children: [],
        },
      ],
    };

    const report = calculateImpactReport(sampleTree, newTree, [sampleEntry]);
    expect(report.totalAffectedEntries).toBe(1);
    expect(report.addedNodeNames).toContain('Akurasi Umpan');
    expect(report.deletedNodeNames).toContain('Fisik');
  });
});
