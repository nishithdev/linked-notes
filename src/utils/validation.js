// Data validation schemas and utilities
export const ThoughtSchema = {
  id: { type: 'string', required: true },
  title: { type: 'string', required: true },
  content: { type: 'string', required: true },
  connections: { type: 'array', required: true },
  createdAt: { type: 'string', required: true },
  updatedAt: { type: 'string', required: true }
};

export const validateThought = (thought) => {
  const errors = [];

  if (!thought || typeof thought !== 'object') {
    return ['Thought must be an object'];
  }

  Object.entries(ThoughtSchema).forEach(([key, schema]) => {
    const value = thought[key];
    
    if (schema.required && (value === undefined || value === null)) {
      errors.push(`Missing required field: ${key}`);
      return;
    }

    if (value !== undefined && value !== null) {
      const expectedType = schema.type;
      const actualType = Array.isArray(value) ? 'array' : typeof value;
      
      if (actualType !== expectedType) {
        errors.push(`Field '${key}' should be ${expectedType}, got ${actualType}`);
      }

      // Additional validations
      if (key === 'id' && typeof value === 'string' && value.trim() === '') {
        errors.push('ID cannot be empty');
      }

      if (key === 'connections' && Array.isArray(value)) {
        const invalidConnections = value.filter(conn => typeof conn !== 'string');
        if (invalidConnections.length > 0) {
          errors.push('All connections must be strings (thought IDs)');
        }
      }

      if ((key === 'createdAt' || key === 'updatedAt') && typeof value === 'string') {
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          errors.push(`Field '${key}' must be a valid ISO date string`);
        }
      }
    }
  });

  return errors;
};

export const validateThoughtsArray = (thoughts) => {
  if (!Array.isArray(thoughts)) {
    return { isValid: false, errors: ['Data must be an array of thoughts'] };
  }

  const allErrors = [];
  const validThoughts = [];

  thoughts.forEach((thought, index) => {
    const errors = validateThought(thought);
    if (errors.length === 0) {
      validThoughts.push(thought);
    } else {
      allErrors.push(`Thought at index ${index}: ${errors.join(', ')}`);
    }
  });

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
    validThoughts,
    validCount: validThoughts.length,
    totalCount: thoughts.length
  };
};

export const sanitizeThought = (thought) => {
  try {
    return {
      id: String(thought.id || '').trim(),
      title: String(thought.title || '').trim(),
      content: String(thought.content || '').trim(),
      connections: Array.isArray(thought.connections) 
        ? thought.connections.filter(conn => typeof conn === 'string' && conn.trim())
        : [],
      createdAt: thought.createdAt || new Date().toISOString(),
      updatedAt: thought.updatedAt || new Date().toISOString()
    };
  } catch (error) {
    throw new Error(`Failed to sanitize thought: ${error.message}`);
  }
};

export const repairThoughtsData = (thoughts) => {
  try {
    const repairedThoughts = thoughts.map(sanitizeThought);
    
    // Remove orphaned connections (connections to non-existent thoughts)
    const existingIds = new Set(repairedThoughts.map(t => t.id));
    
    repairedThoughts.forEach(thought => {
      thought.connections = thought.connections.filter(connId => 
        existingIds.has(connId) && connId !== thought.id
      );
    });

    return repairedThoughts;
  } catch (error) {
    throw new Error(`Failed to repair thoughts data: ${error.message}`);
  }
};
