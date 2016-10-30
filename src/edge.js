import SpatialError from './SpatialError'
import { isSimple, intersects, equals } from './utils'

export function add (topology, start, end, coordinates) {
  const { edges, edgesTree } = topology

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

  if (start === end) {
    throw new SpatialError('start and end node cannot be the same as it would not construct an isolated edge')
  }

  if (!start.face || !end.face) {
    throw new SpatialError('not isolated node')
  }

  if (start.face !== end.face) {
    throw new SpatialError('nodes in different faces')
  }

  if (!equals(start.coordinate, coordinates[0]) ||
      !equals(end.coordinate, coordinates[coordinates.length - 1])) {
    throw new SpatialError('end node not geometry end point')
  }

  if (!isSimple(coordinates)) {
    throw new SpatialError('curve not simple')
  }

  const result = edgesTree.search(bounds)
  const crossingResult = result.find(r => intersects(r.edge.coordinates, coordinates))

  if (crossingResult) {
    throw new SpatialError('geometry crosses edge ' + edges.indexOf(crossingResult.edge))
  }

  edgesTree.insert(bounds)
  edges.push(edge)
  return edge
}
