/** @module */

import RBush from 'rbush'

import * as node from './node'
import * as edge from './edge'
import { getRingEdges, getFaceGeometry } from './face'

/**
 * Topology structure
 *
 * @typedef {Object} Topo
 * @property {module:node~Node[]} nodes
 * @property {Object} nodesTree
 * @property {module:edge~Edge[]} edges
 * @property {Object} edgesTree
 * @property {module:face~Face[]} faces
 * @property {Object} facesTree
 * @property {module:face~Face} universe
 * @property {function} getNodeByPoint Calls {@link module:node.getNodeByPoint} in the context of this object
 * @property {function} addIsoNode Calls {@link module:node.addIsoNode} in the context of this object
 * @property {function} removeIsoNode Calls {@link module:node.removeIsoNode} in the context of this object
 * @property {function} getEdgeByPoint Calls {@link module:edge.getEdgeByPoint} in the context of this object
 * @property {function} getEdgesByLine Calls {@link module:edge.getEdgesByLine} in the context of this object
 * @property {function} addIsoEdge Calls {@link module:edge.addIsoEdge} in the context of this object
 * @property {function} addEdgeNewFaces Calls {@link module:edge.addEdgeNewFaces} in the context of this object
 * @property {function} addEdgeModFace Calls {@link module:edge.addEdgeModFace} in the context of this object
 * @property {function} remEdgeNewFace Calls {@link module:edge.remEdgeNewFace} in the context of this object
 * @property {function} remEdgeModFace Calls {@link module:edge.remEdgeModFace} in the context of this object
 * @property {function} newEdgesSplit Calls {@link module:edge.newEdgesSplit} in the context of this object
 * @property {function} modEdgeSplit Calls {@link module:edge.modEdgeSplit} in the context of this object
 * @property {function} newEdgeHeal Calls {@link module:edge.newEdgeHeal} in the context of this object
 * @property {function} getRingEdges Calls {@link module:face.getRingEdges} in the context of this object
 * @property {function} getFaceGeometry Calls {@link module:face.getFaceGeometry} in the context of this object
 * @property {function} on Calls {@link module:topo.on} in the context of this object
 * @property {function} un Calls {@link module:topo.un} in the context of this object
 * @fires module:topo~addface
 * @fires module:topo~removeface
 * @fires module:topo~addedge
 * @fires module:topo~modedge
 * @fires module:topo~removeedge
 * @fires module:topo~addnode
 * @fires module:topo~removenode
 */

/**
 * Emitted when a face has been added to the topology.
 * @event module:topo~addface
 * @type {module:face~Face}
 */

/**
 * Emitted when a face has been removed from the topology.
 * @event module:topo~removeface
 * @type {module:face~Face}
 */

/**
 * Emitted when an edge has been added to the topology.
 * @event module:topo~addedge
 * @type {module:edge~Edge}
 */

/**
 * Emitted when an edge has been modified.
 * @event module:topo~modedge
 * @type {module:edge~Edge}
 */

/**
 * Emitted when an edge has been removed from the topology.
 * @event module:topo~removeedge
 * @type {module:edge~Edge}
 */

/**
 * Emitted when a node has been added to the topology.
 * @event module:topo~addnode
 * @type {module:node~Node}
 */

/**
 * Emitted when a node has been removed from the topology.
 * @event module:topo~removenode
 * @type {module:node~Node}
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
  const nodesTree = new RBush(16)
  const edges = []
  const edgesTree = new RBush(16)
  const universe = { id: 0 }
  const faces = [universe]
  const facesTree = new RBush(16)
  const topo = {
    name,
    srid,
    tolerance,
    nodes,
    nodesSeq: 1,
    nodesTree,
    edges,
    edgesSeq: 1,
    edgesTree,
    faces,
    facesSeq: 1,
    facesTree,
    universe,
    getNodeByPoint: (...args) => node.getNodeByPoint(topo, ...args),
    addIsoNode: (...args) => node.addIsoNode(topo, ...args),
    removeIsoNode: (...args) => node.removeIsoNode(topo, ...args),
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
    getRingEdges: (...args) => getRingEdges(topo, ...args),
    getFaceGeometry: (...args) => getFaceGeometry(topo, ...args),
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
    on: (...args) => on(topo, ...args),
    un: (...args) => un(topo, ...args)
  }
  return topo
}

/**
 * Registers a callback for a named event
 * @param {module:topo~Topo} topo Topology instance.
 * @param {string} name Event name.
 * @param {function} callback Callback function.
 */
export function on (topo, name, callback) {
  topo.observers[name].push(callback)
}

/**
 * Unregisters a callback for a named event
 * @param {module:topo~Topo} topo Topology instance.
 * @param {string} name Event name.
 * @param {function} callback Callback function.
 */
export function un (topo, name, callback) {
  const i = topo.observers[name].indexOf(callback)
  topo.observers[name].splice(i, 1)
}

export function trigger (topo, name, e) {
  topo.observers[name].forEach(o => o(e))
}

export function insertFace (topo, face) {
  const { faces } = topo
  face.id = topo.facesSeq++
  faces.push(face)
}

export function updateFaceTree (topo, face) {
  const { facesTree } = topo
  const coordinates = getFaceGeometry(topo, face)
  const xs = coordinates[0].map(c => c[0])
  const ys = coordinates[0].map(c => c[1])
  face.minX = Math.min(...xs)
  face.minY = Math.min(...ys)
  face.maxX = Math.max(...xs)
  face.maxY = Math.max(...ys)
  facesTree.insert(face)
}

export function deleteFace (topo, face) {
  const { faces, facesTree } = topo
  facesTree.remove(face)
  // delete faces[faces.indexOf(face)]
  faces.splice(faces.indexOf(face), 1)
}

export function insertEdge (topo, edge) {
  const { edges, edgesTree } = topo
  const xs = edge.coordinates.map(c => c[0])
  const ys = edge.coordinates.map(c => c[1])
  edge.id = topo.edgesSeq++
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
  // delete edges[edges.indexOf(edge)]
  edges.splice(edges.indexOf(edge), 1)
}

export function insertNode (topo, node) {
  const { nodes, nodesTree } = topo

  const coordinate = node.coordinate

  node.id = topo.nodesSeq++
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
  // delete nodes[nodes.indexOf(node)]
  nodes.splice(nodes.indexOf(node), 1)
}
