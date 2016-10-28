export function add (topology, start, end, coordinates) {
  const { nodes, nodesTree, edges, edgesTree } = topology

  const xs = coordinates.map(c => c[0])
  const ys = coordinates.map(c => c[1])

  const edge = {
    start,
    end,
    coordinates
  }

  const bounds = {
      minX: Math.min(...xs),
      minY: Math.min(...ys),
      maxX: Math.max(...xs),
      maxY: Math.max(...ys),
      edge
  }

  if (!edgesTree.collides(bounds)) {
    // TODO: need to check for line intersections
    edgesTree.insert(bounds)
    edges.push(edge)
    return edges.length
  } else {
    return -1
  }
}
