/** @module */

import { insertNode, deleteNode, trigger } from './topo'
import { getFaceByPoint } from './face'
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
  if (result.length === 0) return
  if (result.length === 1) return result[0]
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
  const { nodesTree: tree, faces } = topo

  const containingFaces = getFaceByPoint(topo, coordinate, 0)

  const node = {
    id: topo.nodesSeq,
    face: containingFaces.length === 0 ? faces[0] : containingFaces[0],
    coordinate,
    minX: coordinate[0],
    minY: coordinate[1],
    maxX: coordinate[0],
    maxY: coordinate[1]
  }

  if (!tree.collides(node)) {
    insertNode(topo, node)
    trigger(topo, 'addnode', node)
    return node
  } else {
    throw new SpatialError('coincident node')
  }
}

export function removeIsoNode (topo, node) {
  if (!node.face) throw new SpatialError('not isolated node')
  deleteNode(topo, node)
  trigger(topo, 'removenode', node)
}
