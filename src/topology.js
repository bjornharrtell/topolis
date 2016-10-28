import rbush from 'rbush'

export function create (name, srid, tolerance) {
  const nodes = []
  const nodesTree = rbush(16, ['[0]', '[1]', '[0]', '[1]'])
  const edges = []
  const edgesTree = rbush(16)
  const topology = {
    name,
    srid,
    tolerance,
    nodes,
    nodesTree,
    edges,
    edgesTree
  }
  return topology
}
