// Types for Rubah Assessment System

export type EvaluatorMode = 'SINGLE' | 'MULTI';

export type NodeType = 'VALUE_LEAF' | 'RELATION_LEAF' | 'AGGREGATE_NODE';

export type FormulaPreset = 'WEIGHTED_SUM' | 'AVERAGE' | 'SUM' | 'MIN' | 'MAX' | 'CUSTOM';

export interface LevelNameConfig {
  [level: number]: string;
}

export interface CriteriaNode {
  id: string;
  name: string;
  description?: string;
  faqHint?: string;
  type: NodeType;
  weight: number;
  scaleTarget?: number;
  scaleLeaf?: number;
  formulaPreset?: FormulaPreset;
  customFormula?: string;
  targetEntryTypeId?: string;
  children: CriteriaNode[];
}

export interface EntryType {
  id: string;
  folderId: string;
  name: string;
  description?: string;
  rootCriteriaTree: CriteriaNode;
  levelNames?: LevelNameConfig;
  createdAt: string;
  updatedAt: string;
}

export interface Folder {
  id: string;
  name: string;
  description?: string;
  evaluatorMode: EvaluatorMode;
  entryTypes: EntryType[];
  pdfExportConfig?: PDFExportConfig;
  createdAt: string;
  updatedAt: string;
}

export interface LeafValue {
  nodeId: string;
  value: number | null;
  isExplicitZero?: boolean;
}

export interface RelationLink {
  nodeId: string;
  targetEntryIds: string[];
}

export interface StructuralHistoryLog {
  id: string;
  nodeId: string;
  nodeNameAtTime: string;
  eventType: 'NODE_ADDED' | 'NODE_DELETED' | 'STRUCTURE_REORDERED' | 'FORMULA_CHANGED';
  lastValueBeforeEvent: number | null;
  timestamp: string;
}

export interface Entry {
  id: string;
  folderId: string;
  entryTypeId: string;
  objectName: string;
  leafValues: Record<string, number | null>;
  explicitZeros?: Record<string, boolean>;
  relations: Record<string, string[]>;
  evaluatorId?: string;
  historyLogs: StructuralHistoryLog[];
  createdAt: string;
  updatedAt: string;
}

export interface PDFExportConfig {
  showRootScore: boolean;
  showBreakdownTree: boolean;
  showHistoryLogs: boolean;
  showConnectedRelations: boolean;
  mode: 'FULL' | 'SIMPLE';
}

export interface ImpactPreviewReport {
  totalAffectedEntries: number;
  addedNodeNames: string[];
  deletedNodeNames: string[];
  reweightedNodeNames: string[];
}

export interface SystemFullBackupPayload {
  appVersion: string;
  exportedAt: string;
  folders: Array<Record<string, unknown>>;
  criteriaStructures: Array<Record<string, unknown>>;
  entries: Array<Record<string, unknown>>;
}

export interface EvaluationContext {
  folder: Folder;
  allEntries: Entry[];
}

export interface ComputedNodeResult {
  nodeId: string;
  name: string;
  type: NodeType;
  rawScore: number;
  normalizedScore: number;
  weight: number;
  weightedContribution: number;
  isUnassigned?: boolean;
  childrenResults: ComputedNodeResult[];
  relationDetails?: Array<{
    entryId: string;
    objectName: string;
    score: number;
  }>;
}
