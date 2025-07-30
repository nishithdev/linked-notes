import { useMemo, useCallback } from 'react';
import { GRAPH_LAYOUTS, COLORS } from '../constants/config';
import { 
  calculateNodeSize, 
  getNodeColor, 
  findRootNodes 
} from '../utils/helpers';
import { hierarchy, tree, cluster } from 'd3-hierarchy';
import { parseISO, differenceInDays } from 'date-fns';

export const useGraphData = (thoughts, selectedThought, graphLayout, dimensions) => {
  const graphData = useMemo(() => {
    if (thoughts.length === 0) return { nodes: [], links: [] };

    switch (graphLayout) {
      case GRAPH_LAYOUTS.TREE:
        return calculateTreeLayout(thoughts, selectedThought, dimensions);
      case GRAPH_LAYOUTS.CIRCULAR:
        return calculateCircularLayout(thoughts, selectedThought, dimensions);
      case GRAPH_LAYOUTS.TIMELINE:
        return calculateTimelineLayout(thoughts, selectedThought, dimensions);
      default: // FORCE
        return calculateForceLayout(thoughts, selectedThought);
    }
  }, [thoughts, selectedThought, graphLayout, dimensions]);

  const minimapData = useMemo(() => {
    const scale = 0.1;
    return {
      nodes: graphData.nodes.map(node => ({
        ...node,
        x: (node.x || 0) * scale,
        y: (node.y || 0) * scale,
        val: 1,
      })),
      links: graphData.links
    };
  }, [graphData]);

  return { graphData, minimapData };
};

const calculateForceLayout = (thoughts, selectedThought) => {
  const nodes = thoughts.map(thought => ({
    id: thought.id,
    name: thought.title,
    val: calculateNodeSize(thought.content),
    color: getNodeColor(thought.id, selectedThought?.id, COLORS.NODE_DEFAULT, COLORS.NODE_SELECTED),
  }));

  const links = [];
  thoughts.forEach(thought => {
    thought.connections.forEach(connId => {
      if (thoughts.find(t => t.id === connId)) {
        links.push({
          source: thought.id,
          target: connId,
          value: 1,
        });
      }
    });
  });

  return { nodes, links };
};

const calculateTreeLayout = (thoughts, selectedThought, dimensions) => {
  if (thoughts.length === 0) return { nodes: [], links: [] };

  const rootNodes = findRootNodes(thoughts);
  
  const buildHierarchy = (nodeId, visited = new Set()) => {
    if (visited.has(nodeId)) return null;
    visited.add(nodeId);

    const thought = thoughts.find(t => t.id === nodeId);
    if (!thought) return null;

    const children = thought.connections
      .filter(connId => !visited.has(connId))
      .map(connId => buildHierarchy(connId, new Set(visited)))
      .filter(Boolean);

    return {
      id: thought.id,
      data: thought,
      children: children.length > 0 ? children : undefined
    };
  };

  const hierarchyData = {
    id: 'root',
    children: rootNodes.map(root => buildHierarchy(root.id))
  };

  const root = hierarchy(hierarchyData);
  const treeLayout = tree().size([dimensions.width * 0.8, dimensions.height * 0.8]);
  treeLayout(root);

  const nodes = [];
  const links = [];

  root.each(node => {
    if (node.data.id !== 'root') {
      nodes.push({
        id: node.data.id,
        name: node.data.data.title,
        x: node.x - (dimensions.width * 0.4),
        y: node.y - (dimensions.height * 0.4),
        fx: node.x - (dimensions.width * 0.4),
        fy: node.y - (dimensions.height * 0.4),
        val: calculateNodeSize(node.data.data.content),
        color: getNodeColor(node.data.id, selectedThought?.id, COLORS.NODE_DEFAULT, COLORS.NODE_SELECTED),
      });
    }
  });

  thoughts.forEach(thought => {
    thought.connections.forEach(connId => {
      if (thoughts.find(t => t.id === connId)) {
        links.push({
          source: thought.id,
          target: connId,
          value: 1,
        });
      }
    });
  });

  return { nodes, links };
};

const calculateCircularLayout = (thoughts, selectedThought, dimensions) => {
  const radius = Math.min(dimensions.width, dimensions.height) * 0.3;
  const centerX = 0;
  const centerY = 0;

  const nodes = thoughts.map((thought, index) => {
    const angle = (2 * Math.PI * index) / thoughts.length;
    return {
      id: thought.id,
      name: thought.title,
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
      fx: centerX + radius * Math.cos(angle),
      fy: centerY + radius * Math.sin(angle),
      val: calculateNodeSize(thought.content),
      color: getNodeColor(thought.id, selectedThought?.id, COLORS.NODE_DEFAULT, COLORS.NODE_SELECTED),
    };
  });

  const links = [];
  thoughts.forEach(thought => {
    thought.connections.forEach(connId => {
      if (thoughts.find(t => t.id === connId)) {
        links.push({
          source: thought.id,
          target: connId,
          value: 1,
        });
      }
    });
  });

  return { nodes, links };
};

const calculateTimelineLayout = (thoughts, selectedThought, dimensions) => {
  if (thoughts.length === 0) return { nodes: [], links: [] };

  const sortedThoughts = [...thoughts].sort((a, b) => 
    new Date(a.createdAt) - new Date(b.createdAt)
  );

  const startDate = new Date(sortedThoughts[0].createdAt);
  const endDate = new Date(sortedThoughts[sortedThoughts.length - 1].createdAt);
  const totalDays = Math.max(1, differenceInDays(endDate, startDate));

  const width = dimensions.width * 0.8;
  const height = dimensions.height * 0.6;
  const margin = 50;

  const nodes = sortedThoughts.map((thought, index) => {
    const thoughtDate = new Date(thought.createdAt);
    const daysSinceStart = differenceInDays(thoughtDate, startDate);
    const xPosition = (margin + (daysSinceStart / totalDays) * (width - 2 * margin)) - (width / 2);
    const yPosition = (margin + (index % 5) * ((height - 2 * margin) / 5)) - (height / 2);

    return {
      id: thought.id,
      name: thought.title,
      x: xPosition,
      y: yPosition,
      fx: xPosition,
      fy: yPosition,
      val: calculateNodeSize(thought.content),
      color: getNodeColor(thought.id, selectedThought?.id, COLORS.NODE_DEFAULT, COLORS.NODE_SELECTED),
      date: thoughtDate,
    };
  });

  const links = [];
  thoughts.forEach(thought => {
    thought.connections.forEach(connId => {
      if (thoughts.find(t => t.id === connId)) {
        links.push({
          source: thought.id,
          target: connId,
          value: 1,
        });
      }
    });
  });

  return { nodes, links };
};
