import React from 'react';
import { Search, Plus, Upload, Download, Users } from 'lucide-react';

const Sidebar = ({
  searchTerm,
  setSearchTerm,
  quickThought,
  setQuickThought,
  handleQuickThoughtChange,
  handleQuickThoughtKeyPress,
  showMentionSuggestions,
  mentionSuggestions,
  insertMention,
  createNewThought,
  filteredThoughts,
  selectedThought,
  selectThought,
  saveToJSON,
  fileInputRef,
  loadFromJSON
}) => {
  return (
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
      </div>

      <div className="notes-section">
        <div className="quick-thought-container">
          <div className="quick-thought-wrapper">
            <textarea
              className="quick-thought-input"
              placeholder="Quick thought... (Press Enter to save, use @ to mention thoughts)"
              value={quickThought}
              onChange={handleQuickThoughtChange}
              onKeyPress={handleQuickThoughtKeyPress}
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
  );
};

export default Sidebar;
