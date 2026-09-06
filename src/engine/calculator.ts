import {
  CriteriaNode,
  Entry,
  Folder,
  ComputedNodeResult,
  EvaluationContext,
} from '../types';

/**
 * Normalizes node weights among children under a parent to sum to 100%.
 */
export function normalizeWeights(children: CriteriaNode[]): CriteriaNode[] {
  if (children.length === 0) return children;
  const totalWeight = children.reduce((sum, child) => sum + (child.weight || 0), 0);

  if (totalWeight === 0) {
    const equalWeight = Number((100 / children.length).toFixed(2));
    return children.map((child) => ({ ...child, weight: equalWeight }));
  }

  return children.map((child) => ({
    ...child,
    weight: Number(((child.weight / totalWeight) * 100).toFixed(2)),
  }));
}

/**
 * Detects circular references in relation dependencies across entries.
 * Returns true if a cycle is detected starting from entryId.
 */
export function detectRelationCycle(
  startEntryId: string,
  targetEntryId: string,
  allEntries: Entry[]
): boolean {
  if (startEntryId === targetEntryId) return true;

  const entryMap = new Map<string, Entry>();
  allEntries.forEach((e) => entryMap.set(e.id, e));

  const visited = new Set<string>();
  const stack = [targetEntryId];

  while (stack.length > 0) {
    const currentId = stack.pop()!;
    if (currentId === startEntryId) return true;

    if (!visited.has(currentId)) {
      visited.add(currentId);
      const currentEntry = entryMap.get(currentId);
      if (currentEntry && currentEntry.relations) {
        Object.values(currentEntry.relations).forEach((relTargetIds) => {
          relTargetIds.forEach((tId) => stack.push(tId));
        });
      }
    }
  }

  return false;
}

/**
 * Evaluates custom arithmetic and conditional expressions safely.
 */
export function evaluateCustomFormula(
  expression: string,
  variables: Record<string, number>
): number {
  let expr = expression;

  const keys = Object.keys(variables).sort((a, b) => b.length - a.length);
  for (const key of keys) {
    const val = variables[key] ?? 0;
    const regex = new RegExp(`\\b${escapeRegExp(key)}\\b`, 'g');
    expr = expr.replace(regex, val.toString());
  }

  expr = transformIfStatements(expr);

  expr = expr.replace(/\bMIN\(([^)]+)\)/gi, (_, args) => `Math.min(${args})`);
  expr = expr.replace(/\bMAX\(([^)]+)\)/gi, (_, args) => `Math.max(${args})`);
  expr = expr.replace(/\bAVG\(([^)]+)\)/gi, (_, args) => {
    const nums = args.split(',').map((s: string) => s.trim());
    return `((${nums.join('+')})/${nums.length})`;
  });

  try {
    const sanitized = expr.replace(/[^0-9\.\+\-\*\/\%\(\)\?\:\>\<\=\!\&\|\sMath\.minmax]/g, '');
    const func = new Function(`"use strict"; return (${sanitized});`);
    const result = func();
    return typeof result === 'number' && !isNaN(result) && isFinite(result) ? result : 0;
  } catch {
    return 0;
  }
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function transformIfStatements(expr: string): string {
  let result = expr;
  const ifRegex = /\bIF\s*\(([^,]+),([^,]+),([^)]+)\)/gi;
  while (ifRegex.test(result)) {
    result = result.replace(ifRegex, '(($1) ? ($2) : ($3))');
  }
  return result;
}

/**
 * Calculates bottom-up computed results for an entry based on its criteria tree and folder context.
 */
export function calculateEntryScores(
  entry: Entry,
  tree: CriteriaNode,
  context: EvaluationContext,
  visitedEntryIds: Set<string> = new Set()
): ComputedNodeResult {
  if (visitedEntryIds.has(entry.id)) {
    return {
      nodeId: tree.id,
      name: tree.name,
      type: tree.type,
      rawScore: 0,
      normalizedScore: 0,
      weight: tree.weight,
      weightedContribution: 0,
      isUnassigned: true,
      childrenResults: [],
    };
  }

  const isLeaf = !tree.children || tree.children.length === 0;

  // 1. LEAF VALUE
  if (tree.type === 'VALUE_LEAF' || (isLeaf && tree.type !== 'RELATION_LEAF')) {
    const leafVals = entry.leafValues || {};
    const rawValue = leafVals[tree.id];
    const isUnassigned = rawValue === undefined || rawValue === null;
    const rawScore = isUnassigned ? 0 : Number(rawValue);

    let normalizedScore = rawScore;
    if (tree.scaleLeaf && tree.scaleTarget && tree.scaleLeaf > 0) {
      normalizedScore = (rawScore / tree.scaleLeaf) * tree.scaleTarget;
    }

    return {
      nodeId: tree.id,
      name: tree.name,
      type: tree.type,
      rawScore,
      normalizedScore,
      weight: tree.weight,
      weightedContribution: Number(((normalizedScore * tree.weight) / 100).toFixed(2)),
      isUnassigned,
      childrenResults: [],
    };
  }

  // 2. LEAF RELATION
  if (tree.type === 'RELATION_LEAF') {
    const entryRels = entry.relations || {};
    const targetIds = entryRels[tree.id] || [];
    const relationDetails: Array<{ entryId: string; objectName: string; score: number }> = [];

    const nextVisitedEntries = new Set(visitedEntryIds);
    nextVisitedEntries.add(entry.id);

    if (targetIds.length > 0) {
      targetIds.forEach((tId) => {
        const targetEntry = context.allEntries.find((e) => e.id === tId);
        if (targetEntry) {
          const targetEntryType = context.folder.entryTypes.find(
            (et) => et.id === targetEntry.entryTypeId
          );
          if (targetEntryType) {
            const targetResult = calculateEntryScores(
              targetEntry,
              targetEntryType.rootCriteriaTree,
              context,
              nextVisitedEntries
            );
            relationDetails.push({
              entryId: targetEntry.id,
              objectName: targetEntry.objectName,
              score: targetResult.normalizedScore,
            });
          }
        }
      });
    }

    const rawScore =
      relationDetails.length > 0
        ? relationDetails.reduce((sum, r) => sum + r.score, 0) / relationDetails.length
        : 0;

    let normalizedScore = rawScore;
    if (tree.scaleLeaf && tree.scaleTarget && tree.scaleLeaf > 0) {
      normalizedScore = (rawScore / tree.scaleLeaf) * tree.scaleTarget;
    }

    return {
      nodeId: tree.id,
      name: tree.name,
      type: tree.type,
      rawScore,
      normalizedScore,
      weight: tree.weight,
      weightedContribution: Number(((normalizedScore * tree.weight) / 100).toFixed(2)),
      isUnassigned: relationDetails.length === 0,
      childrenResults: [],
      relationDetails,
    };
  }

  // 3. AGGREGATE / PARENT NODE
  const childrenResults = (tree.children || []).map((child) =>
    calculateEntryScores(entry, child, context, visitedEntryIds)
  );

  let rawScore = 0;
  const preset = tree.formulaPreset || 'WEIGHTED_SUM';

  if (preset === 'WEIGHTED_SUM') {
    const totalWeight = childrenResults.reduce((sum, c) => sum + c.weight, 0);
    if (totalWeight > 0) {
      rawScore = childrenResults.reduce(
        (sum, c) => sum + (c.normalizedScore * c.weight) / totalWeight,
        0
      );
    }
  } else if (preset === 'AVERAGE') {
    rawScore =
      childrenResults.length > 0
        ? childrenResults.reduce((sum, c) => sum + c.normalizedScore, 0) / childrenResults.length
        : 0;
  } else if (preset === 'SUM') {
    rawScore = childrenResults.reduce((sum, c) => sum + c.normalizedScore, 0);
  } else if (preset === 'MIN') {
    rawScore =
      childrenResults.length > 0
        ? Math.min(...childrenResults.map((c) => c.normalizedScore))
        : 0;
  } else if (preset === 'MAX') {
    rawScore =
      childrenResults.length > 0
        ? Math.max(...childrenResults.map((c) => c.normalizedScore))
        : 0;
  } else if (preset === 'CUSTOM' && tree.customFormula) {
    const vars: Record<string, number> = {};
    childrenResults.forEach((child, idx) => {
      vars[child.nodeId] = child.normalizedScore;
      vars[child.name] = child.normalizedScore;
      vars[`child_${idx + 1}`] = child.normalizedScore;
    });
    rawScore = evaluateCustomFormula(tree.customFormula, vars);
  }

  const normalizedScore = Number(rawScore.toFixed(2));

  return {
    nodeId: tree.id,
    name: tree.name,
    type: tree.type,
    rawScore: normalizedScore,
    normalizedScore,
    weight: tree.weight,
    weightedContribution: Number(((normalizedScore * tree.weight) / 100).toFixed(2)),
    childrenResults,
  };
}

/**
 * Calculates impact report when modifying a criteria tree compared to old tree and existing entries.
 */
export function calculateImpactReport(
  oldTree: CriteriaNode,
  newTree: CriteriaNode,
  entries: Entry[]
): {
  totalAffectedEntries: number;
  addedNodeNames: string[];
  deletedNodeNames: string[];
  reweightedNodeNames: string[];
} {
  const getNodesMap = (node: CriteriaNode, map = new Map<string, CriteriaNode>()) => {
    map.set(node.id, node);
    if (node.children) {
      node.children.forEach((c) => getNodesMap(c, map));
    }
    return map;
  };

  const oldMap = getNodesMap(oldTree);
  const newMap = getNodesMap(newTree);

  const addedNodeNames: string[] = [];
  const deletedNodeNames: string[] = [];
  const reweightedNodeNames: string[] = [];

  newMap.forEach((node, id) => {
    if (!oldMap.has(id)) {
      addedNodeNames.push(node.name);
    } else if (oldMap.get(id)!.weight !== node.weight) {
      reweightedNodeNames.push(node.name);
    }
  });

  oldMap.forEach((node, id) => {
    if (!newMap.has(id)) {
      deletedNodeNames.push(node.name);
    }
  });

  const totalAffectedEntries = entries.length;

  return {
    totalAffectedEntries,
    addedNodeNames,
    deletedNodeNames,
    reweightedNodeNames,
  };
}
