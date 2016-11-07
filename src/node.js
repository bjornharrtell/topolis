import SpatialError from './SpatialError'

export function addIsoNode (topology, coordinate) {
  const { nodes, nodesTree: tree, faces } = topology

  // TODO: determine true face
  const face = faces[0]

  const node = {
    id: nodes.length + 1,
    face,
    coordinate,
    equals (other) {
      return
    }
  }

  const bounds = {
    minX: coordinate[0],
    minY: coordinate[1],
    maxX: coordinate[0],
    maxY: coordinate[1],
    node
  }

  if (!tree.collides(bounds)) {
    tree.insert(bounds)
    nodes.push(node)
    return node
  } else {
    throw new SpatialError('coincident node')
  }
}
