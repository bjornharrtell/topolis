export function add (topology, coordinate) {
  const { nodes, nodesTree: tree } = topology

  // TODO: determine face
  const face = undefined

  const node = {
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
    return -1
  }
}
