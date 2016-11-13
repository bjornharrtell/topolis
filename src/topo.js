/** @module */

import rbush from 'rbush'

/**
 * Create topology.
 *
 * @param {string} name
 * @param {number} srid
 * @param {number} tolerance
 * @return {object} Topology data structure
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
    universe
  }
  return topo
}
