export function add (topology, coordinate) {
  const { nodes, nodesTree: tree } = topology

  const bounds = {
      minX: coordinate[0],
      minY: coordinate[1],
      maxX: coordinate[0],
      maxY: coordinate[1]
  }

  if (!tree.collides(bounds)) {
    tree.insert(coordinate)
    nodes.push(coordinate)
    return nodes.length
  } else {
    return -1
  }
}
