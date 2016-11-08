import SpatialError from './SpatialError'
import { isSimple, relate, equals, azimuth } from './utils'
import { addFaceSplit } from './face'

console.debug = console.log
console.debug = function () {}

export function sid (e, d) {
  return d ? e.id : -e.id
}

export function e2s (e) {
  const nl = sid(e, e.nextLeftDir)
  const nr = sid(e, e.nextRightDir)
  return `ID: ${e.id} NL: ${nl} NR: ${nr} LF: ${e.leftFace.id} RF: ${e.rightFace.id}`
}

export function addIsoEdge (topology, start, end, coordinates) {
  const { edges, edgesTree } = topology

  const xs = coordinates.map(c => c[0])
  const ys = coordinates.map(c => c[1])

  const edge = {
    id: edges.length + 1,
    start,
    end,
    coordinates,
    minX: Math.min(...xs),
    minY: Math.min(...ys),
    maxX: Math.max(...xs),
    maxY: Math.max(...ys)
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

  checkEdgeCrossing(topology, start, end, edge)

  edge.leftFace = end.face
  edge.nextLeft = edge
  edge.nextLeftDir = false
  edge.nextRight = edge
  edge.nextRightDir = true

  delete start.face
  delete end.face

  edgesTree.insert(edge)
  edges.push(edge)
  return edge
}

function checkEdgeCrossing (topology, start, end, edge) {
  const check = (e1, e2) => {
    if (e1 === e2) {
      return
    }
    const im = relate(e1.coordinates, e2.coordinates)
    if (im.matches('1FFF*FFF2')) {
      throw new SpatialError('coincident edge ' + e1.id)
    }
    if (im.matches('1********')) {
      throw new SpatialError('geometry intersects edge ' + e1.id)
    }
    if (im.matches('T********')) {
      throw new SpatialError('geometry crosses edge ' + e1.id)
    }
  }
  topology.edgesTree.search(edge).forEach(e => check(e, edge))
}

function getEdgesByNode (topology, node) {
  return topology.edges.filter(e => e.start === node || e.end === node)
}

function findAdjacentEdges (topology, node, data, other, edge) {
  data.nextCW = data.nextCCW = { id: 0 }
  data.cwFace = data.ccwFace = { id: -1 }

  let minaz, maxaz, azdif

  if (other) {
    azdif = other.az - data.az
    if (azdif < 0) azdif += 2 * Math.PI
    minaz = maxaz = azdif
    console.debug(`Other edge end has cwFace=${other.cwFace.id} and ccwFace=${other.ccwFace.id}`)
  } else {
    minaz = maxaz = -1
  }

  console.debug(`Looking for edges incident to node ${node.id} and adjacent to azimuth ${data.az}`)

  const edges = getEdgesByNode(topology, node)

  console.debug(`getEdgeByNode returned ${edges.length} edges, minaz=${minaz}, maxaz=${maxaz}`)

  edges.forEach(e => {
    if (e === edge) {
      return
    }

    if (e.coordinates.length < 2) {
      throw new Error(`corrupted topology: edge ${e.id} does not have two distinct points`)
    }

    if (e.start === node) {
      const p1 = e.coordinates[0]
      const p2 = e.coordinates[1]
      console.debug(`edge ${e.id} starts on node ${node.id}, edgeend is ${p1[0]},${p1[1]}-${p2[0]},${p2[1]}`)
      const az = azimuth(p1, p2)
      azdif = az - data.az
      console.debug(`azimuth of edge ${e.id}: ${az} (diff: ${azdif})`)
      if (azdif < 0) azdif += 2 * Math.PI
      if (minaz === -1) {
        minaz = maxaz = azdif
        data.nextCW = data.nextCCW = e
        data.nextCWDir = data.nextCCWDir = true
        data.cwFace = e.leftFace
        data.ccwFace = e.rightFace
        console.debug(`new nextCW and nextCCW edge is ${e.id}, outgoing, with face_left ${e.leftFace.id} and face_right ${e.rightFace.id} (face_right is new ccwFace, face_left is new cwFace)`)
      } else {
        if (azdif < minaz) {
          data.nextCW = e
          data.nextCWDir = true
          data.cwFace = e.leftFace
          console.debug(`new nextCW edge is ${e.id}, outgoing, with face_left ${e.leftFace.id} and face_right ${e.rightFace.id} (previous had minaz=${minaz}, face_left is new cwFace)`)
          minaz = azdif
        } else if (azdif > maxaz) {
          data.nextCCW = e
          data.nextCCWDir = true
          data.ccwFace = e.rightFace
          console.debug(`new nextCCW edge is ${e.id}, outgoing, with face_left ${e.leftFace.id} and face_right ${e.rightFace.id} (previous had maxaz=${maxaz}, face_right is new ccwFace)`)
          maxaz = azdif
        }
      }
    }

    if (e.end === node) {
      const p1 = e.coordinates[e.coordinates.length - 1]
      const p2 = e.coordinates[e.coordinates.length - 2]
      console.debug(`edge ${e.id} starts on node ${node.id}, edgeend is ${p1[0]},${p1[1]}-${p2[0]},${p2[1]}`)
      const az = azimuth(p1, p2)
      azdif = az - data.az
      console.debug(`azimuth of edge ${e.id}: ${az} (diff: ${azdif})`)
      if (azdif < 0) azdif += 2 * Math.PI
      if (minaz === -1) {
        minaz = maxaz = azdif
        data.nextCW = data.nextCCW = e
        data.nextCWDir = data.nextCCWDir = false
        data.cwFace = e.rightFace
        data.ccwFace = e.leftFace
        console.debug(`new nextCW and nextCCW edge is ${e.id}, incoming, with face_left ${e.leftFace.id} and face_right ${e.rightFace.id} (face_right is new cwFace, face_left is new ccwFace)`)
      } else {
        if (azdif < minaz) {
          data.nextCW = e
          data.nextCWDir = false
          data.cwFace = e.rightFace
          console.debug(`new nextCW edge is ${e.id}, incoming, with face_left ${e.leftFace.id} and face_right ${e.rightFace.id} (previous had minaz=${minaz}, face_right is new cwFace)`)
          minaz = azdif
        } else if (azdif > maxaz) {
          data.nextCCW = e
          data.nextCCWDir = false
          data.ccwFace = e.leftFace
          console.debug(`new nextCCW edge is ${e.id}, outgoing, from start point, with face_left ${e.leftFace.id} and face_right ${e.rightFace.id} (previous had maxaz=${maxaz}, face_left is new ccwFace)`)
          maxaz = azdif
        }
      }
    }
  })

  console.debug(`edges adjacent to azimuth ${data.az} (incident to node ${node.id}): CW:${sid(data.nextCW, data.nextCWDir)} (${minaz}) CCW:${sid(data.nextCCW, data.nextCCWDir)} (${maxaz})`)

  if (!edge && edges.length > 0 && data.cwFace !== data.ccwFace) {
    throw new Error(`Corrupted topology: adjacent edges ${data.nextCW.id} and ${data.nextCCW.id} bind different face (${data.cwFace} and ${data.ccwFace})`)
  }

  return edges
}

function addEdge (topology, start, end, coordinates, modFace) {
  const { edges, edgesTree } = topology

  if (!isSimple(coordinates)) {
    throw new SpatialError('curve not simple')
  }

  const xs = coordinates.map(c => c[0])
  const ys = coordinates.map(c => c[1])

  const edge = {
    id: edges.length + 1,
    start,
    end,
    coordinates,
    leftFace: { id: -1 },
    rightFace: { id: -1 },
    minX: Math.min(...xs),
    minY: Math.min(...ys),
    maxX: Math.max(...xs),
    maxY: Math.max(...ys)
  }

  // TODO: remove repeated points
  // TODO: check that we haave at least two points left

  const span = {
    cwFace: { id: -1 },
    ccwFace: { id: -1 },
    az: azimuth(coordinates[0], coordinates[1])
  }

  const epan = {
    cwFace: { id: -1 },
    ccwFace: { id: -1 },
    az: azimuth(coordinates[coordinates.length - 1], coordinates[coordinates.length - 2])
  }

  const nodes = start !== end ? [start, end] : [start]

  nodes.forEach(node => {
    if (node.face.id !== -1) {
      if (edge.leftFace.id === -1) {
        edge.leftFace = edge.rightFace = node.face
      } else if (edge.leftFace !== node.face) {
        throw new SpatialError(`geometry crosses an edge (endnodes in faces ${edge.leftFace.id} and ${node.face.id})`)
      }
    }
  })

  if (!equals(start.coordinate, coordinates[0])) {
    throw new SpatialError('start node not geometry start point')
  }

  if (!equals(end.coordinate, coordinates[coordinates.length - 1])) {
    throw new SpatialError('end node not geometry end point')
  }

  checkEdgeCrossing(topology, start, end, edge)

  const isClosed = start === end
  const foundStart = findAdjacentEdges(topology, start, span, isClosed ? epan : undefined, undefined)

  let prevLeft
  let prevLeftDir

  if (foundStart.length > 0) {
    span.wasIsolated = false
    if (span.nextCW) {
      edge.nextRight = span.nextCW
      edge.nextRightDir = span.nextCWDir
    } else {
      edge.nextRight = edge
      edge.nextRightDir = false
    }
    if (span.nextCCW) {
      prevLeft = span.nextCCW
      prevLeftDir = !span.nextCCWDir
    } else {
      prevLeft = edge
      prevLeftDir = true
    }
    console.debug(`New edge is connected on start node, next_right is ${sid(edge.nextRight, edge.nextRightDir)}, prev_left is ${sid(prevLeft, prevLeftDir)}`)
    console.log('Edge: ' + e2s(edge))
    if (edge.rightFace.id === -1) {
      edge.rightFace = span.cwFace
    }
    console.log('Edge: ' + e2s(edge))
    if (!edge.leftFace.id === -1) {
      edge.leftFace = span.ccwFace
    }
  } else {
    span.wasIsolated = true
    edge.nextRight = edge
    edge.nextRightDir = !isClosed
    prevLeft = edge
    prevLeftDir = isClosed
    console.debug(`New edge is isolated on start node, next_right is ${sid(edge.nextRight, edge.nextRightDir)}, prev_left is ${sid(prevLeft, prevLeftDir)}`)
  }

  const foundEnd = findAdjacentEdges(topology, end, epan, isClosed ? span : undefined, undefined)

  let prevRight
  let prevRightDir

  if (foundEnd.length > 0) {
    epan.wasIsolated = false
    if (epan.nextCW) {
      edge.nextLeft = epan.nextCW
      edge.nextLeftDir = epan.nextCWDir
    } else {
      edge.nextLeft = edge
      edge.nextLeftDir = true
    }
    if (epan.nextCCW) {
      prevRight = epan.nextCCW
      prevRightDir = !epan.nextCCWDir
    } else {
      prevRight = edge
      prevRightDir = false
    }
    console.debug(`New edge is connected on end node, next_left is ${sid(edge.nextLeft, edge.nextLeftDir)}, prev_right is ${sid(prevRight, prevRightDir)}`)
    console.log('Edge: ' + e2s(edge))
    if (edge.rightFace.id === -1) {
      edge.rightFace = span.ccwFace
    } else if (edge.rightFace !== epan.ccwFace) {
      throw new Error(`Side-location conflict: new edge starts in face ${edge.rightFace.id} and ends in face ${epan.ccwFace.id}`)
    }
    console.log('Edge: ' + e2s(edge))
    if (edge.leftFace.id === -1) {
      edge.leftFace = span.cwFace
    } else if (edge.leftFace !== epan.cwFace) {
      throw new Error(`Side-location conflict: new edge starts in face ${edge.leftFace.id} and ends in face ${epan.cwFace.id}`)
    }
  } else {
    span.wasIsolated = true
    edge.nextLeft = edge
    edge.nextLeftDir = isClosed
    prevRight = edge
    prevRightDir = !isClosed
    console.debug(`New edge is isolated on end node, next_left is ${sid(edge.nextLeft, edge.nextLeftDir)}, prev_right is ${sid(prevRight, prevRightDir)}`)
  }

  if (edge.leftFace !== edge.rightFace) {
    throw new Error('faces mismatch: invalid topology')
  } else if (edge.leftFace.id === -1) {
    throw new Error('Could not derive edge face from linked primitives: invalid topology ?')
  }

  edgesTree.insert(edge)
  edges.push(edge)

  if (prevLeft !== edge) {
    if (prevLeftDir) {
      prevLeft.nextLeft = edge
      prevLeft.nextLeftDir = true
    } else {
      prevLeft.nextRight = edge
      prevLeft.nextRightDir = true
    }
  }

  if (prevRight !== edge) {
    if (prevRightDir) {
      prevRight.nextLeft = edge
      prevRight.nextLeftDir = false
    } else {
      prevRight.nextRight = edge
      prevRight.nextRightDir = false
    }
  }

  if (span.wasIsolated) {
    start.face = { id: -1 }
  }
  if (epan.wasIsolated) {
    end.face = { id: -1 }
  }

  if (!isClosed && (epan.wasIsolated || span.wasIsolated)) {
    return edge
  }

  let newface1

  if (!modFace) {
    newface1 = addFaceSplit(topology, edge, false, edge.leftFace, false)
    if (newface1 === 0) {
      console.debug('New edge does not split any face')
      return edge
    }
  }

  let newface = addFaceSplit(topology, edge, true, edge.leftFace, false)

  if (modFace) {
    if (newface === 0) {
      console.debug('New edge does not split any face')
      return edge
    }

    if (newface < 0) {
      newface = addFaceSplit(topology, edge, false, edge.leftFace, false)
      if (newface < 0) {
        return edge
      }
    } else {
      addFaceSplit(topology, edge, false, edge.leftFace, true)
    }
  }

  return edge
}

export function addEdgeNewFaces (topology, start, end, coordinates) {
  return addEdge(topology, start, end, coordinates, false)
}
