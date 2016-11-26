/** @module */

import { insertNode } from './topo'
import SpatialError from './SpatialError'

/**
 * Node definition
 *
 * @typedef {Object} Node
 * @property {number} id Node ID
 * @property {object} face Containing face
 * @property {number[]} coordinate Coordinate
 * @property {number} minX Minimum X of bounds
 * @property {number} maxY Maximum Y of bounds
 * @property {number} minX Minimum X of bounds
 * @property {number} maxY Maximum Y of bounds
 */

/**
 * Find the node at a point location.
 *
 * @param {module:topo~Topo} topo
 * @param {number[]} coordinate
 * @return {module:node~Node}
 */
export function getNodeByPoint (topo, coordinate) {
  const result = topo.nodesTree.search({
    minX: coordinate[0],
    minY: coordinate[1],
    maxX: coordinate[0],
    maxY: coordinate[1]
  })
  if (result.length === 0) {
    return 0
  }
  if (result.length === 1) {
    return result[0]
  }
  throw Error('getNodeByPoint: unexpected search result')
}

/**
 * Adds an isolated node to a face in a topology and returns the new node. If face is null, the node is still created.
 *
 * @param {module:topo~Topo} topo
 * @param {number[]} coordinate
 * @return {module:node~Node}
 */
export function addIsoNode (topo, coordinate) {
  const { nodes, nodesTree: tree, faces } = topo

  // TODO: determine true face
  const face = faces[0]

  const node = {
    id: nodes.length + 1,
    face,
    coordinate,
    minX: coordinate[0],
    minY: coordinate[1],
    maxX: coordinate[0],
    maxY: coordinate[1]
  }

  if (!tree.collides(node)) {
    insertNode(topo, node)
    return node
  } else {
    throw new SpatialError('coincident node')
  }
}
