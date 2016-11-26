/** @module */

import rbush from 'rbush'

/**
 * Topo definition
 *
 * @typedef {Object} Topo
 * @property {module:node~Node[]} nodes
 * @property {Object} nodesTree
 * @property {module:edge~Edge[]} edges
 * @property {Object} edgesTree
 * @property {module:face~Face[]} faces
 * @property {Object} facesTree
 * @property {module:face~Face} universe
 */

/**
 * Create topology.
 *
 * @param {string} name
 * @param {number} srid
 * @param {number} tolerance
 * @return {module:topo~Topo}
 */
export function create (name, srid, tolerance) {
  const nodes = []
  const nodesTree = rbush(16)
  const edges = []
  const edgesTree = rbush(16)
  const universe = { id: 0 }
  const faces = [universe]
  const facesTree = rbush(16)
  const topo = {
    name,
    srid,
    tolerance,
    nodes,
    nodesTree,
    edges,
    edgesTree,
    faces,
    facesTree,
    universe,
    observers: {
      'addface': [],
      'removeface': [],
      'addedge': [],
      'removeedge': [],
      'addnode': [],
      'removenode': []
    },
    on: (...args) => on(topo, ...args)
  }
  return topo
}

export function on (topo, name, callback) {
  topo.observers[name].push(callback)
}

export function un (topo, name, callback) {
  const i = topo.observers[name].indexOf(callback)
  topo.observers[name].splice(i, 1)
}

function trigger (topo, name, e) {
  topo.observers[name].forEach(o => o(e))
}

export function insertFace (topo, face) {
  const { faces } = topo
  face.id = faces.length
  faces.push(face)
  trigger(topo, 'addface', face)
}

export function deleteFace (topo, face) {
  // topo.facesTree.remove(face)
  delete topo.faces[topo.faces.indexOf(face)]
  trigger(topo, 'removeface', face)
}

export function insertEdge (topo, edge) {
  const { edges, edgesTree } = topo
  const xs = edge.coordinates.map(c => c[0])
  const ys = edge.coordinates.map(c => c[1])
  edge.id = edges.length + 1
  edge.minX = Math.min(...xs)
  edge.minY = Math.min(...ys)
  edge.maxX = Math.max(...xs)
  edge.maxY = Math.max(...ys)
  edgesTree.insert(edge)
  edges.push(edge)
  trigger(topo, 'addedge', edge)
}

export function deleteEdge (topo, edge) {
  topo.edgesTree.remove(edge)
  delete topo.edges[topo.edges.indexOf(edge)]
  trigger(topo, 'removeedge', edge)
}

export function insertNode (topo, node) {
  const { nodes, nodesTree } = topo

  const coordinate = node.coordinate

  node.id = nodes.length + 1
  node.minX = coordinate[0]
  node.minY = coordinate[1]
  node.maxX = coordinate[0]
  node.maxY = coordinate[1]

  nodesTree.insert(node)
  nodes.push(node)
  trigger(topo, 'addnode', node)
}

export function deleteNode (topo, node) {
  topo.nodesTree.remove(node)
  delete topo.nodes[topo.nodes.indexOf(node)]
  trigger(topo, 'removenode', node)
}
