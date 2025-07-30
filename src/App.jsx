import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, Eye, Network, Save, Trash2, Link, X, Users, Download, Upload, GitBranch, RotateCcw, Calendar, ZoomIn, Map } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import Fuse from 'fuse.js';
import ForceGraph2D from 'react-force-graph-2d';
import { hierarchy, tree, cluster } from 'd3-hierarchy';
import { parseISO, differenceInDays } from 'date-fns';

const App = () => {
  const [thoughts, setThoughts] = useState([]);
  const [selectedThought, setSelectedThought] = useState(null);
  const [view, setView] = useState('graph'); // 'graph' or 'editor'
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredThoughts, setFilteredThoughts] = useState([]);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [editingThought, setEditingThought] = useState({ title: '', content: '' });
  const [quickThought, setQuickThought] = useState('');
  const [graphLayout, setGraphLayout] = useState('force'); // 'force', 'tree', 'circular', 'timeline'
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [mentionSuggestions, setMentionSuggestions] = useState([]);
  const [currentMentionQuery, setCurrentMentionQuery] = useState('');
  const [mentionStartIndex, setMentionStartIndex] = useState(-1);
  // New state for minimap and zoom functionality
  const [showMinimap, setShowMinimap] = useState(true);
  const [minimapDimensions] = useState({ width: 200, height: 150 });
  const fileInputRef = useRef(null);
  const autoSaveTimeoutRef = useRef(null);
  const graphRef = useRef(null);
  const minimapRef = useRef(null);

  // Handle window resize and calculate dimensions
  useEffect(() => {
    const updateDimensions = () => {
      const sidebarWidth = 400;
      const headerHeight = 80;
      const width = window.innerWidth - sidebarWidth;
      const height = window.innerHeight - headerHeight;
      setDimensions({ width, height });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // JSON file management functions
  const saveToJSON = () => {
    const dataStr = JSON.stringify(thoughts, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `thoughts-backup-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const loadFromJSON = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedThoughts = JSON.parse(e.target.result);
          setThoughts(importedThoughts);
          setFilteredThoughts(importedThoughts);
          localStorage.setItem('thoughts-graph-data', JSON.stringify(importedThoughts));
        } catch (error) {
          alert('Error importing file. Please make sure it\'s a valid JSON file.');
        }
      };
      reader.readAsText(file);
    }
  };

  // Load thoughts from localStorage on component mount
  useEffect(() => {
    const savedThoughts = localStorage.getItem('thoughts-graph-data');
    if (savedThoughts) {
      try {
        const parsedThoughts = JSON.parse(savedThoughts);
        setThoughts(parsedThoughts);
        setFilteredThoughts(parsedThoughts);
      } catch (error) {
        console.error('Error parsing saved thoughts:', error);
      }
    }
  }, []);

  // Auto-save thoughts to localStorage with debouncing
  useEffect(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    
    autoSaveTimeoutRef.current = setTimeout(() => {
      localStorage.setItem('thoughts-graph-data', JSON.stringify(thoughts));
    }, 1000); // Auto-save after 1 second of inactivity

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [thoughts]);

  // Search functionality using Fuse.js
  useEffect(() => {
    if (!searchTerm) {
      setFilteredThoughts(thoughts);
      return;
    }

    const fuse = new Fuse(thoughts, {
      keys: ['title', 'content'],
      threshold: 0.3,
      includeScore: true,
    });

    const results = fuse.search(searchTerm);
    setFilteredThoughts(results.map(result => result.item));
  }, [searchTerm, thoughts]);

  // Mention detection and suggestions
  const detectMentions = (text, cursorPosition) => {
    const beforeCursor = text.substring(0, cursorPosition);
    const lastAtIndex = beforeCursor.lastIndexOf('@');
    
    if (lastAtIndex === -1) {
      setShowMentionSuggestions(false);
      return;
    }

    const afterAt = beforeCursor.substring(lastAtIndex + 1);
    
    // Check if there's a space after @ (which would end the mention)
    if (afterAt.includes(' ')) {
      setShowMentionSuggestions(false);
      return;
    }

    const query = afterAt.toLowerCase();
    const suggestions = thoughts.filter(thought => 
      thought.title.toLowerCase().includes(query)
    ).slice(0, 5);

    setCurrentMentionQuery(query);
    setMentionStartIndex(lastAtIndex);
    setMentionSuggestions(suggestions);
    setShowMentionSuggestions(suggestions.length > 0);
  };

  const insertMention = (thought) => {
    const beforeMention = quickThought.substring(0, mentionStartIndex);
    const afterMention = quickThought.substring(mentionStartIndex + currentMentionQuery.length + 1);
    
    // Use quotes for multi-word thoughts
    const mentionText = thought.title.includes(' ') ? `@"${thought.title}"` : `@${thought.title}`;
    const newText = beforeMention + mentionText + afterMention;
    
    setQuickThought(newText);
    setShowMentionSuggestions(false);
    setCurrentMentionQuery('');
    setMentionStartIndex(-1);
  };

  const extractMentionsFromText = (text) => {
    // Updated regex to handle multi-word mentions with quotes or until space/punctuation
    const mentionRegex = /@"([^"]+)"|@([^\s@.,!?;:]+(?:\s+[^\s@.,!?;:]+)*?)(?=\s|$|[.,!?;:])/g;
    const mentions = [];
    let match;
    
    while ((match = mentionRegex.exec(text)) !== null) {
      // Get the mention text (either quoted or unquoted)
      const mentionedTitle = match[1] || match[2];
      const mentionedThought = thoughts.find(t => 
        t.title.toLowerCase() === mentionedTitle.toLowerCase()
      );
      if (mentionedThought) {
        mentions.push(mentionedThought.id);
      }
    }
    
    return mentions;
  };

  const createQuickThought = () => {
    if (!quickThought.trim()) return;

    // Extract mentions and get their IDs
    const mentionedThoughtIds = extractMentionsFromText(quickThought);

    // Remove @mentions from the title after extracting connections
    const cleanTitle = quickThought.replace(/@"[^"]+"|@[^\s@.,!?;:]+(?:\s+[^\s@.,!?;:]+)*?(?=\s|$|[.,!?;:])/g, '').trim();

    const newThought = {
      id: uuidv4(),
      title: cleanTitle || 'Quick Thought', // Use cleaned title or fallback
      content: '', // Keep content empty for quick thoughts
      connections: mentionedThoughtIds, // Connect to mentioned thoughts
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Add bidirectional connections
    const updatedThoughts = thoughts.map(thought => {
      if (mentionedThoughtIds.includes(thought.id)) {
        return {
          ...thought,
          connections: [...thought.connections, newThought.id]
        };
      }
      return thought;
    });

    setThoughts([newThought, ...updatedThoughts]);
    setQuickThought('');
    setShowMentionSuggestions(false);
  };

  const handleQuickThoughtKeyPress = (e) => {
    if (showMentionSuggestions) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        // Handle suggestion navigation if needed
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        // Handle suggestion navigation if needed
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowMentionSuggestions(false);
        return;
      }
      if (e.key === 'Tab' && mentionSuggestions.length > 0) {
        e.preventDefault();
        insertMention(mentionSuggestions[0]);
        return;
      }
    }
    
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      createQuickThought();
    }
  };

  const handleQuickThoughtChange = (e) => {
    const newValue = e.target.value;
    const cursorPosition = e.target.selectionStart;
    
    setQuickThought(newValue);
    detectMentions(newValue, cursorPosition);
  };

  const createNewThought = () => {
    const newThought = {
      id: uuidv4(),
      title: 'New Thought',
      content: '',
      connections: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setThoughts(prev => [...prev, newThought]);
    setSelectedThought(newThought);
    setEditingThought({ title: newThought.title, content: newThought.content });
    setView('editor');
  };

  const selectThought = (thought) => {
    setSelectedThought(thought);
    setEditingThought({ title: thought.title, content: thought.content });
    setView('editor');
  };

  const saveThought = () => {
    if (!selectedThought) return;

    // Extract mentions from both title and content
    const titleMentions = extractMentionsFromText(editingThought.title);
    const contentMentions = extractMentionsFromText(editingThought.content);
    const allMentionedIds = [...new Set([...titleMentions, ...contentMentions])];

    // Remove @mentions from title and content after extracting connections
    const mentionRegex = /@"[^"]+"|@[^\s@.,!?;:]+(?:\s+[^\s@.,!?;:]+)*?(?=\s|$|[.,!?;:])/g;
    const cleanTitle = editingThought.title.replace(mentionRegex, '').trim();
    const cleanContent = editingThought.content.replace(mentionRegex, '').trim();

    // Combine existing connections with new mentions (remove duplicates)
    const existingConnections = selectedThought.connections.filter(id => 
      !allMentionedIds.includes(id) // Remove old mentions that might have been deleted
    );
    const newConnections = [...new Set([...existingConnections, ...allMentionedIds])];

    const updatedThought = {
      ...selectedThought,
      title: cleanTitle || 'Untitled Thought',
      content: cleanContent,
      connections: newConnections,
      updatedAt: new Date().toISOString(),
    };

    // Update all thoughts with bidirectional connections
    setThoughts(prev => prev.map(thought => {
      if (thought.id === selectedThought.id) {
        return updatedThought;
      }
      
      // Add bidirectional connections for newly mentioned thoughts
      if (allMentionedIds.includes(thought.id) && !thought.connections.includes(selectedThought.id)) {
        return {
          ...thought,
          connections: [...thought.connections, selectedThought.id]
        };
      }
      
      // Remove connections for thoughts that are no longer mentioned
      if (!newConnections.includes(thought.id) && thought.connections.includes(selectedThought.id)) {
        return {
          ...thought,
          connections: thought.connections.filter(id => id !== selectedThought.id)
        };
      }
      
      return thought;
    }));
    
    setSelectedThought(updatedThought);
    setEditingThought({ title: updatedThought.title, content: updatedThought.content });
  };

  const deleteThought = () => {
    if (!selectedThought) return;

    // Remove connections to this thought from other thoughts
    setThoughts(prev => prev
      .filter(thought => thought.id !== selectedThought.id)
      .map(thought => ({
        ...thought,
        connections: thought.connections.filter(connId => connId !== selectedThought.id)
      }))
    );
    
    setSelectedThought(null);
    setEditingThought({ title: '', content: '' });
    setView('graph');
  };

  const toggleConnection = (targetThoughtId) => {
    if (!selectedThought) return;

    const isConnected = selectedThought.connections.includes(targetThoughtId);
    
    setThoughts(prev => prev.map(thought => {
      if (thought.id === selectedThought.id) {
        return {
          ...thought,
          connections: isConnected 
            ? thought.connections.filter(id => id !== targetThoughtId)
            : [...thought.connections, targetThoughtId]
        };
      }
      if (thought.id === targetThoughtId) {
        return {
          ...thought,
          connections: isConnected 
            ? thought.connections.filter(id => id !== selectedThought.id)
            : [...thought.connections, selectedThought.id]
        };
      }
      return thought;
    }));

    // Update selected thought
    setSelectedThought(prev => ({
      ...prev,
      connections: isConnected 
        ? prev.connections.filter(id => id !== targetThoughtId)
        : [...prev.connections, targetThoughtId]
    }));
  };

  const removeConnection = (targetThoughtId) => {
    toggleConnection(targetThoughtId);
  };

  // Layout calculation functions
  const calculateTreeLayout = (thoughts) => {
    if (thoughts.length === 0) return { nodes: [], links: [] };

    // Find root nodes (nodes with no incoming connections)
    const incomingConnections = new Set();
    thoughts.forEach(thought => {
      thought.connections.forEach(connId => {
        incomingConnections.add(connId);
      });
    });

    const rootNodes = thoughts.filter(thought => !incomingConnections.has(thought.id));
    if (rootNodes.length === 0) {
      // If no clear root, use the most connected node
      const mostConnected = thoughts.reduce((max, thought) => 
        thought.connections.length > max.connections.length ? thought : max
      );
      rootNodes.push(mostConnected);
    }

    // Build hierarchy for each root
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

    // Create tree layout
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
          val: Math.max(1, node.data.data.content.length / 100),
          color: selectedThought?.id === node.data.id ? '#ff3232' : '#333333',
        });
      }
    });

    // Add original connections as links
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

  const calculateCircularLayout = (thoughts) => {
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
        val: Math.max(1, thought.content.length / 100),
        color: selectedThought?.id === thought.id ? '#ff3232' : '#333333',
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

  const calculateTimelineLayout = (thoughts) => {
    if (thoughts.length === 0) return { nodes: [], links: [] };

    // Sort thoughts by creation date
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
      
      // Distribute vertically to avoid overlap
      const yPosition = (margin + (index % 5) * ((height - 2 * margin) / 5)) - (height / 2);

      return {
        id: thought.id,
        name: thought.title,
        x: xPosition,
        y: yPosition,
        fx: xPosition,
        fy: yPosition,
        val: Math.max(1, thought.content.length / 100),
        color: selectedThought?.id === thought.id ? '#ff3232' : '#333333',
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

  // Prepare graph data
  const getGraphData = () => {
    switch (graphLayout) {
      case 'tree':
        return calculateTreeLayout(thoughts);
      case 'circular':
        return calculateCircularLayout(thoughts);
      case 'timeline':
        return calculateTimelineLayout(thoughts);
      default: // 'force'
        const nodes = thoughts.map(thought => ({
          id: thought.id,
          name: thought.title,
          val: Math.max(1, thought.content.length / 100),
          color: selectedThought?.id === thought.id ? '#ff3232' : '#333333',
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
    }
  };

  // Zoom to fit selected thought's neighborhood
  const zoomToNeighborhood = (thoughtId) => {
    if (!graphRef.current) return;

    const thought = thoughts.find(t => t.id === thoughtId);
    if (!thought) return;

    // Get all connected thoughts (1-hop neighborhood)
    const neighborhoodIds = new Set([thoughtId, ...thought.connections]);
    const graphData = getGraphData();
    const neighborhoodNodes = graphData.nodes.filter(node => neighborhoodIds.has(node.id));

    if (neighborhoodNodes.length === 0) return;

    // Calculate bounding box of neighborhood
    const xCoords = neighborhoodNodes.map(node => node.x || 0);
    const yCoords = neighborhoodNodes.map(node => node.y || 0);
    
    const minX = Math.min(...xCoords);
    const maxX = Math.max(...xCoords);
    const minY = Math.min(...yCoords);
    const maxY = Math.max(...yCoords);

    // Add padding
    const padding = 100;
    const boundingBox = {
      x: minX - padding,
      y: minY - padding,
      width: maxX - minX + 2 * padding,
      height: maxY - minY + 2 * padding
    };

    // Calculate zoom level to fit the bounding box
    const zoomX = dimensions.width / boundingBox.width;
    const zoomY = dimensions.height / boundingBox.height;
    const zoom = Math.min(zoomX, zoomY, 3); // Cap at 3x zoom

    // Center coordinates
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    // Apply zoom and pan
    graphRef.current.zoom(zoom);
    graphRef.current.centerAt(centerX, centerY, 1000); // 1000ms transition
  };

  // Get minimap graph data (simplified version)
  const getMinimapData = () => {
    const graphData = getGraphData();
    const scale = 0.1; // Scale down for minimap
    
    return {
      nodes: graphData.nodes.map(node => ({
        ...node,
        x: (node.x || 0) * scale,
        y: (node.y || 0) * scale,
        val: 1, // Smaller nodes for minimap
      })),
      links: graphData.links
    };
  };

  const handleNodeClick = (node) => {
    const thought = thoughts.find(t => t.id === node.id);
    if (thought) {
      selectThought(thought);
    }
  };

  const getConnectedThoughts = () => {
    if (!selectedThought) return [];
    return selectedThought.connections
      .map(connId => thoughts.find(thought => thought.id === connId))
      .filter(Boolean);
  };

  const getLinkableThoughts = () => {
    if (!selectedThought) return [];
    return thoughts.filter(thought => 
      thought.id !== selectedThought.id && 
      !selectedThought.connections.includes(thought.id)
    );
  };

  // Helper function to highlight @-mentions in text
  const highlightMentions = (text) => {
    const mentionRegex = /@"([^"]+)"|@([^\s@.,!?;:]+(?:\s+[^\s@.,!?;:]+)*?)(?=\s|$|[.,!?;:])/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = mentionRegex.exec(text)) !== null) {
      // Add text before the mention
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      
      // Get the mention text (either quoted or unquoted)
      const mentionedTitle = match[1] || match[2];
      const mentionedThought = thoughts.find(t => 
        t.title.toLowerCase() === mentionedTitle.toLowerCase()
      );
      
      if (mentionedThought) {
        parts.push(
          <span 
            key={match.index} 
            className="mention-highlight"
            title={`Will connect to: ${mentionedThought.title}`}
          >
            {match[0]}
          </span>
        );
      } else {
        parts.push(
          <span 
            key={match.index} 
            className="mention-not-found"
            title="Thought not found"
          >
            {match[0]}
          </span>
        );
      }
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }
    
    return parts.length > 1 ? parts : text;
  };

  // Helper function to render text with highlighted @-mentions
  const renderTextWithMentions = (text) => {
    const mentionRegex = /@([^@\s]+)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = mentionRegex.exec(text)) !== null) {
      // Add text before the mention
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      
      // Add the mention as a styled element
      const mentionedTitle = match[1];
      const mentionedThought = thoughts.find(t => 
        t.title.toLowerCase() === mentionedTitle.toLowerCase()
      );
      
      if (mentionedThought) {
        parts.push(
          <span 
            key={match.index} 
            className="mention-link"
            onClick={() => selectThought(mentionedThought)}
          >
            @{mentionedTitle}
          </span>
        );
      } else {
        parts.push(`@${mentionedTitle}`);
      }
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }
    
    return parts.length > 1 ? parts : text;
  };

  return (
    <div className="app">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <h1>Thought Graph</h1>
          <p>Connect and explore your thoughts visually</p>
        </div>

        <div className="search-section">
          <div className="search-container">
            <Search className="search-icon" size={16} />
            <input
              type="text"
              placeholder="Search thoughts..."
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="import-export-buttons">
            <button className="import-btn" onClick={() => fileInputRef.current?.click()}>
              <Upload size={14} />
              Import
            </button>
            <button className="export-btn" onClick={saveToJSON}>
              <Download size={14} />
              Export
            </button>
          </div>
          
          <input
            type="file"
            ref={fileInputRef}
            onChange={loadFromJSON}
            accept=".json"
            style={{ display: 'none' }}
          />
        </div>          <div className="notes-section">
          <div className="quick-thought-container">
            <div className="quick-thought-wrapper">
              <textarea
                className="quick-thought-input"
                placeholder="Quick thought... (Press Enter to save, use @ to mention thoughts)"
                value={quickThought}
                onChange={handleQuickThoughtChange}
                onKeyPress={handleQuickThoughtKeyPress}
                onKeyDown={(e) => {
                  // Handle cursor position for mention detection on key navigation
                  setTimeout(() => {
                    if (e.target.selectionStart !== undefined) {
                      detectMentions(e.target.value, e.target.selectionStart);
                    }
                  }, 0);
                }}
                rows={3}
              />
              {showMentionSuggestions && (
                <div className="mention-suggestions">
                  {mentionSuggestions.map(thought => (
                    <div
                      key={thought.id}
                      className="mention-suggestion-item"
                      onClick={() => insertMention(thought)}
                    >
                      <div className="mention-suggestion-title">{thought.title}</div>
                      <div className="mention-suggestion-preview">
                        {thought.content.slice(0, 50)}...
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="quick-thought-help">
                💡 Tip: Use @ to mention and link to existing thoughts
              </div>
            </div>
          </div>
          
          <button className="add-note-btn secondary" onClick={createNewThought}>
            <Plus size={16} />
            Detailed Thought
          </button>

          <div className="notes-list">
            {filteredThoughts.map(thought => (
              <div
                key={thought.id}
                className={`note-item ${selectedThought?.id === thought.id ? 'selected' : ''}`}
                onClick={() => selectThought(thought)}
              >
                <div className="note-title">
                  {thought.title || 'Untitled Thought'}
                </div>
                <div className="note-preview">
                  {thought.content || 'No content yet...'}
                </div>
                <div className="note-meta">
                  <span>{new Date(thought.updatedAt).toLocaleDateString()}</span>
                  <div className="note-connections">
                    <Users size={12} />
                    <span>{thought.connections.length}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div className="content-header">
          <div className="view-toggle">
            <button
              className={`view-btn ${view === 'graph' ? 'active' : ''}`}
              onClick={() => setView('graph')}
            >
              <Network size={16} />
              Graph View
            </button>
            <button
              className={`view-btn ${view === 'editor' ? 'active' : ''}`}
              onClick={() => setView('editor')}
              disabled={!selectedThought}
            >
              <Eye size={16} />
              Thought Details
            </button>
          </div>
          
          {view === 'graph' && (
            <div className="graph-controls">
              <div className="layout-toggle">
                <button
                  className={`layout-btn ${graphLayout === 'force' ? 'active' : ''}`}
                  onClick={() => setGraphLayout('force')}
                  title="Force-directed layout"
                >
                  <Network size={16} />
                  Force
                </button>
                <button
                  className={`layout-btn ${graphLayout === 'tree' ? 'active' : ''}`}
                  onClick={() => setGraphLayout('tree')}
                  title="Hierarchical tree layout"
                >
                  <GitBranch size={16} />
                  Tree
                </button>
                <button
                  className={`layout-btn ${graphLayout === 'circular' ? 'active' : ''}`}
                  onClick={() => setGraphLayout('circular')}
                  title="Circular layout"
                >
                  <RotateCcw size={16} />
                  Circular
                </button>
                <button
                  className={`layout-btn ${graphLayout === 'timeline' ? 'active' : ''}`}
                  onClick={() => setGraphLayout('timeline')}
                  title="Timeline layout"
                >
                  <Calendar size={16} />
                  Timeline
                </button>
              </div>
              
              <div className="graph-actions">
                <button
                  className="action-btn"
                  onClick={() => setShowMinimap(!showMinimap)}
                  title={showMinimap ? "Hide minimap" : "Show minimap"}
                >
                  <Map size={16} />
                  {showMinimap ? 'Hide' : 'Show'} Minimap
                </button>
                {selectedThought && (
                  <button
                    className="action-btn"
                    onClick={() => zoomToNeighborhood(selectedThought.id)}
                    title="Zoom to selected thought's neighborhood"
                  >
                    <ZoomIn size={16} />
                    Zoom to Focus
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="content-body">
          {view === 'graph' ? (
            <div className="graph-container">
              {thoughts.length > 0 ? (
                <>
                  <ForceGraph2D
                    graphData={getGraphData()}
                    nodeLabel="name"
                    nodeAutoColorBy="color"
                    nodeCanvasObject={(node, ctx, globalScale) => {
                      const label = node.name;
                      const fontSize = 12/globalScale;
                      ctx.font = `${fontSize}px Sans-Serif`;
                      const textWidth = ctx.measureText(label).width;
                      const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2);

                      ctx.fillStyle = node.color;
                      ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y - bckgDimensions[1] / 2, ...bckgDimensions);

                      ctx.textAlign = 'center';
                      ctx.textBaseline = 'middle';
                      ctx.fillStyle = 'white';
                      ctx.fillText(label, node.x, node.y);

                      // Add date label for timeline layout
                      if (graphLayout === 'timeline' && node.date) {
                        const dateLabel = node.date.toLocaleDateString();
                        const dateFontSize = 8/globalScale;
                        ctx.font = `${dateFontSize}px Sans-Serif`;
                        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
                        ctx.fillText(dateLabel, node.x, node.y + bckgDimensions[1] / 2 + dateFontSize + 2);
                      }
                    }}
                    onNodeClick={handleNodeClick}
                    linkColor={() => 'rgba(255, 50, 50, 0.6)'}
                    linkWidth={2}
                    backgroundColor="rgba(0,0,0,0.8)"
                    width={dimensions.width}
                    height={dimensions.height}
                    enableNodeDrag={graphLayout === 'force'}
                    enableZoomInteraction={true}
                    enablePanInteraction={true}
                    cooldownTicks={graphLayout === 'force' ? 100 : 0}
                    d3AlphaDecay={graphLayout === 'force' ? 0.0228 : 1}
                    d3VelocityDecay={graphLayout === 'force' ? 0.4 : 1}
                  ref={graphRef}
                  onEngineStop={() => {
                    if (graphLayout !== 'force') {
                      // Re-center fixed layouts
                      const graphData = getGraphData();
                      graphData.nodes.forEach(node => {
                        if (typeof node.fx !== 'undefined') {
                          node.fx = node.x;
                          node.fy = node.y;
                        }
                      });
                    }
                  }}
                />
                
                {showMinimap && (
                  <div className="minimap-container">
                    <div className="minimap-header">
                      <span>Minimap</span>
                      <button className="minimap-toggle" onClick={() => setShowMinimap(false)}>
                        <X size={14} />
                      </button>
                    </div>
                    <div className="minimap-body">
                      <ForceGraph2D
                        ref={minimapRef}
                        graphData={getMinimapData()}
                        nodeLabel=""
                        nodeCanvasObject={(node, ctx, globalScale) => {
                          const radius = 3;
                          ctx.beginPath();
                          ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
                          ctx.fillStyle = node.color;
                          ctx.fill();
                          
                          // Highlight selected node
                          if (selectedThought?.id === node.id) {
                            ctx.strokeStyle = '#ff3232';
                            ctx.lineWidth = 2;
                            ctx.stroke();
                          }
                        }}
                        onNodeClick={(node) => {
                          // Sync main graph view with minimap click
                          const thought = thoughts.find(t => t.id === node.id);
                          if (thought) {
                            selectThought(thought);
                            // Center main graph on clicked node
                            if (graphRef.current) {
                              const graphData = getGraphData();
                              const mainNode = graphData.nodes.find(n => n.id === node.id);
                              if (mainNode) {
                                graphRef.current.centerAt(mainNode.x, mainNode.y, 500);
                              }
                            }
                          }
                        }}
                        linkColor={() => 'rgba(255, 50, 50, 0.4)'}
                        linkWidth={1}
                        backgroundColor="rgba(0,0,0,0.9)"
                        width={minimapDimensions.width}
                        height={minimapDimensions.height}
                        enableNodeDrag={false}
                        enableZoomInteraction={false}
                        enablePanInteraction={false}
                        cooldownTicks={0}
                        d3AlphaDecay={1}
                        d3VelocityDecay={1}
                      />
                    </div>
                  </div>
                )}
                </>
              ) : (
                <div className="empty-state">
                  <h2>No Thoughts Yet</h2>
                  <p>Capture your first thought to start building your knowledge graph</p>
                </div>
              )}
            </div>
          ) : selectedThought ? (
            <div className="note-editor">
              <div className="editor-header">
                <div className="editor-title-row">
                  <input
                    type="text"
                    value={editingThought.title}
                    onChange={(e) => {
                      setEditingThought(prev => ({ ...prev, title: e.target.value }));
                      detectMentions(e.target.value, e.target.selectionStart);
                    }}
                    className="editor-title-input"
                    placeholder="What's on your mind? Use @ to mention other thoughts"
                    onKeyUp={(e) => detectMentions(e.target.value, e.target.selectionStart)}
                  />
                  <div className="editor-actions">
                    <button className="action-btn save-btn" onClick={saveThought}>
                      <Save size={16} />
                      Save
                    </button>
                    <button className="action-btn link-btn" onClick={() => setShowLinkModal(true)}>
                      <Link size={16} />
                      Connect
                    </button>
                    <button className="action-btn delete-btn" onClick={deleteThought}>
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </div>
                </div>
                {(editingThought.title.includes('@') || editingThought.content.includes('@')) && (
                  <div className="mention-preview">
                    <div className="mention-preview-label">📝 Preview after save:</div>
                    <div className="mention-preview-content">
                      <strong>Title:</strong> {highlightMentions(editingThought.title)}<br/>
                      <strong>Content:</strong> {highlightMentions(editingThought.content)}
                    </div>
                  </div>
                )}
              </div>

              <div className="editor-content">
                <div className="editor-textarea-wrapper">
                  <textarea
                    value={editingThought.content}
                    onChange={(e) => {
                      setEditingThought(prev => ({ ...prev, content: e.target.value }));
                      detectMentions(e.target.value, e.target.selectionStart);
                    }}
                    className="editor-textarea"
                    placeholder="Expand on this thought... What connections do you see? What ideas does this spark? Use @ to mention other thoughts."
                    onKeyUp={(e) => detectMentions(e.target.value, e.target.selectionStart)}
                  />
                  {showMentionSuggestions && (
                    <div className="mention-suggestions editor-mentions">
                      {mentionSuggestions.map(thought => (
                        <div
                          key={thought.id}
                          className="mention-suggestion-item"
                          onClick={() => {
                            const beforeMention = editingThought.content.substring(0, mentionStartIndex);
                            const afterMention = editingThought.content.substring(mentionStartIndex + currentMentionQuery.length + 1);
                            const mentionText = thought.title.includes(' ') ? `@"${thought.title}"` : `@${thought.title}`;
                            const newContent = beforeMention + mentionText + afterMention;
                            setEditingThought(prev => ({ ...prev, content: newContent }));
                            setShowMentionSuggestions(false);
                          }}
                        >
                          <div className="mention-suggestion-title">{thought.title}</div>
                          <div className="mention-suggestion-preview">
                            {thought.content.slice(0, 50)}...
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {showMentionSuggestions && (
                <div className="mention-suggestions">
                  {mentionSuggestions.map(thought => (
                    <div
                      key={thought.id}
                      className="mention-suggestion"
                      onClick={() => insertMention(thought)}
                    >
                      {thought.title}
                    </div>
                  ))}
                </div>
              )}

              {getConnectedThoughts().length > 0 && (
                <div className="connections-section">
                  <div className="connections-title">
                    <Link size={16} />
                    Connected Thoughts ({getConnectedThoughts().length})
                  </div>
                  <div className="connections-list">
                    {getConnectedThoughts().map(thought => (
                      <div key={thought.id} className="connection-tag" onClick={() => selectThought(thought)}>
                        {thought.title}
                        <button
                          className="remove-connection"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeConnection(thought.id);
                          }}
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="empty-state">
              <h2>Select a Thought</h2>
              <p>Choose a thought from the sidebar to explore or capture a new one</p>
            </div>
          )}
        </div>
      </div>

      {/* Link Modal */}
      {showLinkModal && (
        <div className="modal-overlay" onClick={() => setShowLinkModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Connect Thoughts</h3>
              <button className="modal-close" onClick={() => setShowLinkModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="linkable-notes">
              {getLinkableThoughts().map(thought => (
                <div
                  key={thought.id}
                  className="linkable-note"
                  onClick={() => {
                    toggleConnection(thought.id);
                    setShowLinkModal(false);
                  }}
                >
                  <div className="linkable-note-title">{thought.title}</div>
                  <div className="linkable-note-preview">{thought.content}</div>
                </div>
              ))}
              {getLinkableThoughts().length === 0 && (
                <p style={{ textAlign: 'center', color: '#718096', padding: '20px' }}>
                  No thoughts available to connect
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
