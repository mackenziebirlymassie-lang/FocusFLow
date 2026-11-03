import { TimeBlock, VisualBlock } from '../types';

/**
 * Packs concurrent and overlapping time blocks into distinct visual columns.
 * Guaranteed zero visual collisions.
 */
export function computeVisualColumns(blocks: TimeBlock[]): VisualBlock[] {
  if (blocks.length === 0) return [];

  // 1. Sort by start time ascending, then longer duration first
  const sorted = [...blocks].sort((a, b) => {
    if (a.startMinutes !== b.startMinutes) {
      return a.startMinutes - b.startMinutes;
    }
    return b.durationMinutes - a.durationMinutes;
  });

  const visualBlocks: VisualBlock[] = [];

  // 2. Identify connected overlap clusters
  let currentCluster: TimeBlock[] = [];
  let clusterEnd = -1;

  const processCluster = (cluster: TimeBlock[]) => {
    if (cluster.length === 0) return;

    // Track column end minutes
    const colEnds: number[] = [];
    const assignments: { block: TimeBlock; colIndex: number }[] = [];

    for (const block of cluster) {
      const blockStart = block.startMinutes;
      const blockEnd = block.startMinutes + block.durationMinutes;

      // Find first column that is free at blockStart
      let placedCol = -1;
      for (let i = 0; i < colEnds.length; i++) {
        if (colEnds[i] <= blockStart) {
          placedCol = i;
          colEnds[i] = blockEnd;
          break;
        }
      }

      if (placedCol === -1) {
        placedCol = colEnds.length;
        colEnds.push(blockEnd);
      }

      assignments.push({ block, colIndex: placedCol });
    }

    const totalCols = Math.max(1, colEnds.length);
    for (const item of assignments) {
      visualBlocks.push({
        ...item.block,
        colIndex: item.colIndex,
        colCount: totalCols,
      });
    }
  };

  for (const block of sorted) {
    const blockStart = block.startMinutes;
    const blockEnd = block.startMinutes + block.durationMinutes;

    if (currentCluster.length === 0) {
      currentCluster.push(block);
      clusterEnd = blockEnd;
    } else if (blockStart < clusterEnd) {
      currentCluster.push(block);
      clusterEnd = Math.max(clusterEnd, blockEnd);
    } else {
      processCluster(currentCluster);
      currentCluster = [block];
      clusterEnd = blockEnd;
    }
  }

  processCluster(currentCluster);

  return visualBlocks;
}
