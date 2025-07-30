// Application constants
export const APP_CONFIG = {
  AUTO_SAVE_DELAY: 1000,
  DEFAULT_GRAPH_DIMENSIONS: { width: 800, height: 600 },
  MINIMAP_DIMENSIONS: { width: 200, height: 150 },
  SEARCH_THRESHOLD: 0.3,
  MAX_MENTION_SUGGESTIONS: 5,
  STORAGE_KEY: 'thoughts-graph-data'
};

export const GRAPH_LAYOUTS = {
  FORCE: 'force',
  TREE: 'tree',
  CIRCULAR: 'circular',
  TIMELINE: 'timeline'
};

export const VIEW_MODES = {
  GRAPH: 'graph',
  EDITOR: 'editor'
};

export const REGEX_PATTERNS = {
  MENTIONS: /@"([^"]+)"|@([^\s@.,!?;:]+(?:\s+[^\s@.,!?;:]+)*?)(?=\s|$|[.,!?;:])/g,
  MENTION_CLEANUP: /@"[^"]+"|@[^\s@.,!?;:]+(?:\s+[^\s@.,!?;:]+)*?(?=\s|$|[.,!?;:])/g
};

export const GRAPH_SETTINGS = {
  FORCE_LAYOUT: {
    cooldownTicks: 100,
    d3AlphaDecay: 0.0228,
    d3VelocityDecay: 0.4
  },
  STATIC_LAYOUT: {
    cooldownTicks: 0,
    d3AlphaDecay: 1,
    d3VelocityDecay: 1
  }
};

export const COLORS = {
  PRIMARY: '#ff3232',
  SECONDARY: '#667eea',
  BACKGROUND: 'rgba(0,0,0,0.8)',
  NODE_DEFAULT: '#333333',
  NODE_SELECTED: '#ff3232',
  LINK_DEFAULT: 'rgba(255, 50, 50, 0.6)'
};
