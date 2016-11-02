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

  edge.leftFace = end.face
  edge.nextLeft = edge
  edge.nextLeftDir = false
  edge.nextRight = edge
  edge.nextRightDir = true

  delete start.face
  delete end.face

  edgesTree.insert(bounds)
  edges.push(edge)
  return edge
}

function getEdgesByNode (topology, node) {
  return topology.edges.filter(e => e.start !== node && e.end !== node)
}

function findAdjacentEdges (topology, node, data, other, edge) {
  data.nextCW = data.nextCCW = 0
  data.cwFace = data.ccwFace = -1

  let minaz, maxaz, azdif

  if (other) {
    azdif = other.az - data.az
    if (azdif < 0) azdif += 2 * Math.PI
    minaz = maxaz = azdif
  }

  const edges = getEdgesByNode(topology, node)

  edges.forEach(e => {
    if (e === edge) {
      return
    }

    if (e.coordinates.length < 2) {
      // TODO: throw
    }

    if (e.start === node) {
      const az = azimuth(e.coordinates[0], e.coordinates[1])
      azdif = az - data.az
      if (azdif < 0) azdif += 2 * Math.PI
      if (!minaz) {
        minaz = maxaz = azdif
        data.nextCW = data.nextCCW = e
        data.nextCWDir = data.nextCCWDir = true
        data.cwFace = e.leftFace
        data.ccwFace = e.rightFace
      } else {
        if (azdif < minaz) {
          data.nextCW = e
          data.nextCWDir = true
          data.cwFace = e.leftFace
          minaz = azdif
        } else if (azdif > maxaz) {
          data.nextCCW = e
          data.nextCCWDir = true
          data.ccwFace = e.rightFace
          maxaz = azdif
        }
      }
    }

    if (e.end === node) {
      const az = azimuth(e.coordinates[e.coordinates.length - 1], e.coordinates[e.coordinates.length - 2])
      azdif = az - data.az
      if (azdif < 0) azdif += 2 * Math.PI
      if (!minaz) {
        minaz = maxaz = azdif
        data.nextCW = data.nextCCW = e
        data.nextCWDir = data.nextCCWDir = false
        data.cwFace = e.leftFace
        data.ccwFace = e.rightFace
      } else {
        if (azdif < minaz) {
          data.nextCW = e
          data.nextCWDir = false
          data.cwFace = e.leftFace
          minaz = azdif
        } else if (azdif > maxaz) {
          data.nextCCW = e
          data.nextCCWDir = false
          data.ccwFace = e.rightFace
          maxaz = azdif
        }
      }
    }
  })

  return edges
}

function addFaceSplit () {
  // TODO: implement
  // TODO: need to know edge direction
  return 0
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

  edge.leftFace = undefined
  edge.rightFace = undefined
  edge.nextLeft = edge
  edge.nextLeftDir = true
  edge.nextRight = edge
  edge.nextRightDir = true

  const span = {
    cwFace: undefined,
    ccwFace: undefined,
    az: azimuth(coordinates[0], coordinates[1])
  }

  const epan = {
    cwFace: undefined,
    ccwFace: undefined,
    az: azimuth(coordinates[coordinates.length - 1], coordinates[coordinates.length - 2])
  }

  // TODO: check 'geometry crosses an edge'
  const nodes = start !== end ? [start, end] : [start]

  nodes.forEach(node => {
    if (node.face) {
      if (!edge.leftFace) {
        edge.leftFace = edge.rightFace = node.face
      } else if (edge.leftFace !== node.face) {
        console.log(edge.leftFace)
        console.log(node.face)
        throw new SpatialError('geometry crosses an edge (endnodes in faces ...)')
      }
    }
  })

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

  let prevLeft
  let prevLeftDir = true

  if (foundStart) {
    span.wasIsolated = false
    if (span.nextCW) {
      edge.nextRight = span.nextCW
      prevLeft = span.nextCCW
      prevLeftDir = !span.nextCCWDir
    } else {
      edge.nextRight = edge
      edge.nextRightDir = false
      prevLeft = edge
    }
    if (!edge.rightFace) {
      edge.rightFace = span.cwFace
    }
    if (!edge.leftFace) {
      edge.leftFace = span.ccwFace
    }
  } else {
    span.wasIsolated = true
    edge.nextRight = edge
    edge.nextRightDir = !isClosed
    prevLeft = edge
    prevLeftDir = isClosed
  }

  const foundEnd = findAdjacentEdges(topology, start, span, isClosed ? epan : null, -1)

  let prevRight
  let prevRightDir = true

  if (foundEnd) {
    epan.wasIsolated = false
    if (epan.nextCW) {
      edge.nextRight = epan.nextCW
      edge.nextRightDir = epan.nextCWDir
      prevRight = epan.nextCCW
    } else {
      edge.nextRight = edge
      prevRight = edge
      prevRightDir = false
    }
    if (!edge.rightFace) {
      edge.rightFace = epan.cwFace
    }
    if (!edge.leftFace) {
      edge.leftFace = epan.ccwFace
    }
  } else {
    span.wasIsolated = true
    edge.nextRight = edge
    edge.nextRightDir = isClosed
    prevRight = edge
    prevRightDir = !isClosed
  }

  // TODO: check "faces mismatch: invalid topology"

  if (prevLeft !== edge) {
    if (prevLeftDir) {
      prevLeft.nextLeft = edge
    } else {
      prevLeft.nextRight = edge
    }
  }

  if (prevRight !== edge) {
    if (prevRightDir) {
      prevRight.nextLeft = edge
    } else {
      prevRight.nextRight = edge
    }
  }

  // TODO: set containing_face = null for start_node and end_node

  edgesTree.insert(bounds)
  edges.push(edge)

  if (!isClosed && (epan.wasIsolated || span.wasIsolated)) {
    return edge
  }

  let newface1

  if (!modFace) {
    newface1 = addFaceSplit(topology, edge, edge.leftFace, 0)
    if (newface1 === 0) {
      return edge
    }
  }

  let newface = addFaceSplit(topology, edge, edge.leftFace, 0)

  if (modFace) {
    if (newface === 0) {
      return edge
    }

    if (newface < 0) {
      newface = addFaceSplit(topology, edge, edge.leftFace, 0)
      if (newface === 0) {
        return edge
      }
    } else {
      addFaceSplit(topology, edge, edge.leftFace, 1)
    }
  }

  return edge
}

export function addEdgeNewFaces (topology, start, end, coordinates) {
  return addEdge(topology, start, end, coordinates, false)
}
