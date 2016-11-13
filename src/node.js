/** @module */

import SpatialError from './SpatialError'

/**
 * @param {object} topo
 * @param {number[]} coordinate
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
 * @param {object} topo
 * @param {number[]} coordinate
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
    tree.insert(node)
    nodes.push(node)
    return node
  } else {
    throw new SpatialError('coincident node')
  }
}
