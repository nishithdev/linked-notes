import React from 'react';
import { Network, FileText, Search, Zap } from 'lucide-react';

export const LoadingSpinner = ({ size = 'medium', message = 'Loading...' }) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12'
  };

  return (
    <div className="loading-container">
      <div className={`loading-spinner ${sizeClasses[size]}`}></div>
      {message && <p className="loading-message">{message}</p>}
    </div>
  );
};

export const EmptyGraphState = ({ onCreateThought }) => (
  <div className="empty-state">
    <div className="empty-icon">
      <Network size={64} />
    </div>
    <h2>No Thoughts Yet</h2>
    <p>Your knowledge graph is waiting to be born</p>
    <div className="empty-actions">
      <button className="primary-btn" onClick={onCreateThought}>
        <Zap size={16} />
        Create Your First Thought
      </button>
    </div>
    <div className="empty-tips">
      <h4>💡 Tips to get started:</h4>
      <ul>
        <li>Use the quick thought box to capture ideas fast</li>
        <li>Use @ to mention and connect thoughts</li>
        <li>Try different graph layouts to explore connections</li>
      </ul>
    </div>
  </div>
);

export const EmptySearchState = ({ searchTerm, onClearSearch }) => (
  <div className="empty-state">
    <div className="empty-icon">
      <Search size={48} />
    </div>
    <h3>No thoughts found</h3>
    <p>No thoughts match "{searchTerm}"</p>
    <button className="secondary-btn" onClick={onClearSearch}>
      Clear Search
    </button>
  </div>
);

export const EmptyEditorState = () => (
  <div className="empty-state">
    <div className="empty-icon">
      <FileText size={48} />
    </div>
    <h3>Select a Thought</h3>
    <p>Choose a thought from the sidebar to explore or edit</p>
    <div className="empty-suggestions">
      <p>Or create a new thought to get started</p>
    </div>
  </div>
);

export const NoConnectionsState = () => (
  <div className="no-connections">
    <p>This thought has no connections yet</p>
    <small>Use the Connect button or @ mentions to link thoughts</small>
  </div>
);
