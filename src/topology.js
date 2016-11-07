import rbush from 'rbush'

export function create (name, srid, tolerance) {
  const nodes = []
  const nodesTree = rbush(16)
  const edges = []
  const edgesTree = rbush(16)
  const faces = [{ id: 0 }]
  const facesTree = rbush(16)
  const topology = {
    name,
    srid,
    tolerance,
    nodes,
    nodesTree,
    edges,
    edgesTree,
    faces,
    facesTree
  }
  return topology
}
