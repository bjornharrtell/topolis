import SpatialError from './SpatialError'
import { isSimple, intersects, equals, azimuth } from './utils'

export function addIsoEdge (topology, start, end, coordinates) {
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

  if (!equals(start.coordinate, coordinates[0])) {
    throw new SpatialError('start node not geometry start point')
  }

  if (!equals(end.coordinate, coordinates[coordinates.length - 1])) {
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

  edge.face_left = end.face
  edge.next_left = edge
  edge.next_left_dir = false
  edge.next_right = edge
  edge.next_right_dir = true

  delete start.face
  delete end.face

  edgesTree.insert(bounds)
  edges.push(edge)
  return edge
}

function findAdjacentEdges () {

}

function addEdge (topology, start, end, coordinates, modFace) {
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

  edge.face_left = end.face
  edge.next_left = edge
  edge.next_left_dir = false
  edge.next_right = edge
  edge.next_right_dir = true

  const span = {
    cwFace: -1,
    ccwFace: -1,
    az: azimuth(coordinates[0], coordinates[1])
  }

  const epan = {
    cwFace: -1,
    ccwFace: -1,
    az: azimuth(coordinates[coordinates.length - 1], coordinates[coordinates.length - 2])
  }

  // TODO: check 'geometry crosses an edge'

  if (!equals(start.coordinate, coordinates[0])) {
    throw new SpatialError('start node not geometry start point')
  }

  if (!equals(end.coordinate, coordinates[coordinates.length - 1])) {
    throw new SpatialError('end node not geometry end point')
  }

  const result = edgesTree.search(bounds)
  const crossingResult = result.find(r => intersects(r.edge.coordinates, coordinates))

  if (crossingResult) {
    throw new SpatialError('geometry crosses edge ' + edges.indexOf(crossingResult.edge))
  }

  const isClosed = start === end
  const foundStart = findAdjacentEdges(topology, start, span, isClosed ? epan : null, -1)

  if (foundStart) {
    // TODO: handle span stuff
  }

  const foundEnd = findAdjacentEdges(topology, start, span, isClosed ? epan : null, -1)

  if (foundEnd) {
    // TODO: handle epan stuff
  }

  // TODO...

  edgesTree.insert(bounds)
  edges.push(edge)
  return edge
}

export function addEdgeNewFaces (topology, start, end, coordinates) {
  addEdge(topology, start, end, coordinates, false)
}
