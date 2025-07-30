import PropTypes from 'prop-types';

// Thought object PropType
export const ThoughtPropType = PropTypes.shape({
  id: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  content: PropTypes.string.isRequired,
  connections: PropTypes.arrayOf(PropTypes.string).isRequired,
  createdAt: PropTypes.string.isRequired,
  updatedAt: PropTypes.string.isRequired,
});

// Graph node PropType
export const GraphNodePropType = PropTypes.shape({
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  x: PropTypes.number,
  y: PropTypes.number,
  fx: PropTypes.number,
  fy: PropTypes.number,
  val: PropTypes.number,
  color: PropTypes.string,
});

// Graph link PropType
export const GraphLinkPropType = PropTypes.shape({
  source: PropTypes.oneOfType([PropTypes.string, PropTypes.object]).isRequired,
  target: PropTypes.oneOfType([PropTypes.string, PropTypes.object]).isRequired,
  value: PropTypes.number,
});

// Graph data PropType
export const GraphDataPropType = PropTypes.shape({
  nodes: PropTypes.arrayOf(GraphNodePropType).isRequired,
  links: PropTypes.arrayOf(GraphLinkPropType).isRequired,
});

// Dimensions PropType
export const DimensionsPropType = PropTypes.shape({
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
});

// Common function PropTypes
export const FunctionPropTypes = {
  onThoughtSelect: PropTypes.func,
  onThoughtCreate: PropTypes.func,
  onThoughtUpdate: PropTypes.func,
  onThoughtDelete: PropTypes.func,
  onConnectionToggle: PropTypes.func,
  onSearchChange: PropTypes.func,
  onViewChange: PropTypes.func,
  onLayoutChange: PropTypes.func,
};
