import { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Fuse from 'fuse.js';

export const useThoughts = () => {
  const [thoughts, setThoughts] = useState([]);
  const [selectedThought, setSelectedThought] = useState(null);
  const [filteredThoughts, setFilteredThoughts] = useState([]);
  const autoSaveTimeoutRef = useRef(null);

  // Load thoughts from localStorage on mount
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
    }, 1000);

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [thoughts]);

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
    return newThought;
  };

  const updateThought = (thoughtId, updates) => {
    setThoughts(prev => prev.map(thought => 
      thought.id === thoughtId 
        ? { ...thought, ...updates, updatedAt: new Date().toISOString() }
        : thought
    ));
    
    if (selectedThought?.id === thoughtId) {
      setSelectedThought(prev => ({ ...prev, ...updates, updatedAt: new Date().toISOString() }));
    }
  };

  const deleteThought = (thoughtId) => {
    setThoughts(prev => prev
      .filter(thought => thought.id !== thoughtId)
      .map(thought => ({
        ...thought,
        connections: thought.connections.filter(connId => connId !== thoughtId)
      }))
    );
    
    if (selectedThought?.id === thoughtId) {
      setSelectedThought(null);
    }
  };

  const toggleConnection = (thoughtId1, thoughtId2) => {
    setThoughts(prev => prev.map(thought => {
      if (thought.id === thoughtId1) {
        const isConnected = thought.connections.includes(thoughtId2);
        return {
          ...thought,
          connections: isConnected 
            ? thought.connections.filter(id => id !== thoughtId2)
            : [...thought.connections, thoughtId2]
        };
      }
      if (thought.id === thoughtId2) {
        const isConnected = thought.connections.includes(thoughtId1);
        return {
          ...thought,
          connections: isConnected 
            ? thought.connections.filter(id => id !== thoughtId1)
            : [...thought.connections, thoughtId1]
        };
      }
      return thought;
    }));
  };

  return {
    thoughts,
    setThoughts,
    selectedThought,
    setSelectedThought,
    filteredThoughts,
    setFilteredThoughts,
    createNewThought,
    updateThought,
    deleteThought,
    toggleConnection
  };
};

export const useSearch = (thoughts) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredThoughts, setFilteredThoughts] = useState(thoughts);

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

  return { searchTerm, setSearchTerm, filteredThoughts };
};

export const useMentions = (thoughts) => {
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [mentionSuggestions, setMentionSuggestions] = useState([]);
  const [currentMentionQuery, setCurrentMentionQuery] = useState('');
  const [mentionStartIndex, setMentionStartIndex] = useState(-1);

  const detectMentions = (text, cursorPosition) => {
    const beforeCursor = text.substring(0, cursorPosition);
    const lastAtIndex = beforeCursor.lastIndexOf('@');
    
    if (lastAtIndex === -1) {
      setShowMentionSuggestions(false);
      return;
    }

    const afterAt = beforeCursor.substring(lastAtIndex + 1);
    
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

  const extractMentionsFromText = (text) => {
    const mentionRegex = /@"([^"]+)"|@([^\s@.,!?;:]+(?:\s+[^\s@.,!?;:]+)*?)(?=\s|$|[.,!?;:])/g;
    const mentions = [];
    let match;
    
    while ((match = mentionRegex.exec(text)) !== null) {
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

  return {
    showMentionSuggestions,
    setShowMentionSuggestions,
    mentionSuggestions,
    currentMentionQuery,
    mentionStartIndex,
    detectMentions,
    extractMentionsFromText
  };
};
