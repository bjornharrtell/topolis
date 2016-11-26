/** @module */

import rbush from 'rbush'

import * as node from './node'
import * as edge from './edge'
import * as face from './face'

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
export function createTopology (name, srid, tolerance) {
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
    getNodeByPoint: (...args) => node.getNodeByPoint(topo, ...args),
    addIsoNode: (...args) => node.addIsoNode(topo, ...args),
    getEdgeByPoint: (...args) => edge.getEdgeByPoint(topo, ...args),
    getEdgesByLine: (...args) => edge.getEdgesByLine(topo, ...args),
    addIsoEdge: (...args) => edge.addIsoEdge(topo, ...args),
    addEdgeNewFaces: (...args) => edge.addEdgeNewFaces(topo, ...args),
    addEdgeModFace: (...args) => edge.addEdgeModFace(topo, ...args),
    remEdgeNewFace: (...args) => edge.remEdgeNewFace(topo, ...args),
    remEdgeModFace: (...args) => edge.remEdgeModFace(topo, ...args),
    newEdgesSplit: (...args) => edge.newEdgesSplit(topo, ...args),
    modEdgeSplit: (...args) => edge.modEdgeSplit(topo, ...args),
    newEdgeHeal: (...args) => edge.newEdgeHeal(topo, ...args),
    modEdgeHeal: (...args) => edge.modEdgeHeal(topo, ...args),
    getRingEdges: (...args) => face.getRingEdges(topo, ...args),
    getFaceGeometry: (...args) => face.getFaceGeometry(topo, ...args),
    observers: {
      'addface': [],
      'modface': [],
      'removeface': [],
      'addedge': [],
      'modedge': [],
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

export function trigger (topo, name, e) {
  topo.observers[name].forEach(o => o(e))
}

export function insertFace (topo, face) {
  const { faces } = topo
  face.id = faces.length
  faces.push(face)
}

export function deleteFace (topo, face) {
  const { faces } = topo
  // topo.facesTree.remove(face)
  delete faces[faces.indexOf(face)]
  // faces.splice(faces.indexOf(face), 1)
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
}

export function deleteEdge (topo, edge) {
  const { edges, edgesTree } = topo
  edgesTree.remove(edge)
  delete edges[edges.indexOf(edge)]
  // edges.splice(edges.indexOf(edge), 1)
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
}

export function deleteNode (topo, node) {
  const { nodes, nodesTree } = topo
  nodesTree.remove(node)
  delete nodes[nodes.indexOf(node)]
  // nodes.splice(nodes.indexOf(node), 1)
}
