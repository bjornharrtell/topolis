import SpatialError from './SpatialError'
import { isSimple, relate, equals, azimuth } from './utils'
import { addFaceSplit } from './face'

console.debug = console.log
// console.debug = function () {}

export function addIsoEdge (topology, start, end, coordinates) {
  const { edges, edgesTree } = topology

  const xs = coordinates.map(c => c[0])
  const ys = coordinates.map(c => c[1])

  const edge = {
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
    const id = topology.edges.indexOf(e1)
    if (e1 === e2) {
      return
    }
    const im = relate(e1.coordinates, e2.coordinates)
    if (im.matches('1FFF*FFF2')) {
      throw new SpatialError('coincident edge ' + id)
    }
    if (im.matches('1********')) {
      throw new SpatialError('geometry intersects edge ' + id)
    }
    if (im.matches('T********')) {
      throw new SpatialError('geometry crosses edge ' + id)
    }
  }
  topology.edgesTree.search(edge).forEach(e => check(e, edge))
}

function getEdgesByNode (topology, node) {
  return topology.edges.filter(e => e.start === node || e.end === node)
}

function findAdjacentEdges (topology, node, data, other, edge) {
  const nid = topology.nodes.indexOf(node)

  data.nextCW = data.nextCCW = undefined
  data.cwFace = data.ccwFace = undefined

  let minaz, maxaz, azdif

  if (other) {
    azdif = other.az - data.az
    if (azdif < 0) azdif += 2 * Math.PI
    minaz = maxaz = azdif
    console.debug(`Other edge end has cwFace=${topology.faces.indexOf(other.cwFace)} and ccwFace=${topology.faces.indexOf(other.ccwFace)}`)
  }

  console.debug(`Looking for edges incident to node ${nid} and adjacent to azimuth ${data.az}`)

  const edges = getEdgesByNode(topology, node)

  console.debug(`getEdgeByNode returned ${edges.length} edges, minaz=${minaz}, maxaz=${maxaz}`)

  edges.forEach(e => {
    const eid = topology.edges.indexOf(e)

    if (e === edge) {
      return
    }

    if (e.coordinates.length < 2) {
      throw new Error(`corrupted topology: edge ${eid} does not have two distinct points`)
    }

    if (e.start === node) {
      const p1 = e.coordinates[0]
      const p2 = e.coordinates[1]
      console.debug(`edge ${eid} starts on node ${nid}, edgeend is ${p1[0]},${p1[1]}-${p2[0]},${p2[1]}`)
      const az = azimuth(p1, p2)
      azdif = az - data.az
      console.debug(`azimuth of edge ${eid}: ${az} (diff: ${azdif})`)
      if (azdif < 0) azdif += 2 * Math.PI
      if (minaz === undefined) {
        minaz = maxaz = azdif
        data.nextCW = data.nextCCW = e
        data.nextCWDir = data.nextCCWDir = true
        data.cwFace = e.leftFace
        data.ccwFace = e.rightFace
        console.debug(`new nextCW and nextCCW edge is ${eid}, outgoing, with face_left ${topology.faces.indexOf(e.leftFace)} and face_right ${topology.faces.indexOf(e.rightFace)} (face_right is new ccwFace, face_left is new cwFace)`)
      } else {
        if (azdif < minaz) {
          data.nextCW = e
          data.nextCWDir = true
          data.cwFace = e.leftFace
          console.debug(`new nextCW edge is ${eid}, outgoing, with face_left ${topology.faces.indexOf(e.leftFace)} and face_right ${topology.faces.indexOf(e.rightFace)} (previous had minaz=${minaz}, face_left is new cwFace)`)
          minaz = azdif
        } else if (azdif > maxaz) {
          data.nextCCW = e
          data.nextCCWDir = true
          data.ccwFace = e.rightFace
          console.debug(`new nextCCW edge is ${eid}, outgoing, with face_left ${topology.faces.indexOf(e.leftFace)} and face_right ${topology.faces.indexOf(e.rightFace)} (previous had maxaz=${maxaz}, face_right is new ccwFace)`)
          maxaz = azdif
        }
      }
    }

    if (e.end === node) {
      const p1 = e.coordinates[e.coordinates.length - 1]
      const p2 = e.coordinates[e.coordinates.length - 2]
      console.debug(`edge ${eid} starts on node ${nid}, edgeend is ${p1[0]},${p1[1]}-${p2[0]},${p2[1]}`)
      const az = azimuth(p1, p2)
      azdif = az - data.az
      console.debug(`azimuth of edge ${eid}: ${az} (diff: ${azdif})`)
      if (azdif < 0) azdif += 2 * Math.PI
      if (minaz === undefined) {
        minaz = maxaz = azdif
        data.nextCW = data.nextCCW = e
        data.nextCWDir = data.nextCCWDir = false
        data.cwFace = e.rightFace
        data.ccwFace = e.leftFace
        console.debug(`new nextCW and nextCCW edge is ${eid}, incoming, with face_left ${topology.faces.indexOf(e.leftFace)} and face_right ${topology.faces.indexOf(e.rightFace)} (face_right is new cwFace, face_left is new ccwFace)`)
      } else {
        if (azdif < minaz) {
          data.nextCW = e
          data.nextCWDir = false
          data.cwFace = e.rightFace
          console.debug(`new nextCW edge is ${eid}, incoming, with face_left ${topology.faces.indexOf(e.leftFace)} and face_right ${topology.faces.indexOf(e.rightFace)} (previous had minaz=${minaz}, face_right is new cwFace)`)
          minaz = azdif
        } else if (azdif > maxaz) {
          data.nextCCW = e
          data.nextCCWDir = false
          data.ccwFace = e.leftFace
          console.debug(`new nextCCW edge is ${eid}, outgoing, from start point, with face_left ${topology.faces.indexOf(e.leftFace)} and face_right ${topology.faces.indexOf(e.rightFace)} (previous had maxaz=${maxaz}, face_left is new ccwFace)`)
          maxaz = azdif
        }
      }
    }
  })

  console.debug(`edges adjacent to azimuth ${data.az} (incident to node ${nid}): CW:${topology.edges.indexOf(data.nextCW)} (${data.nextCWDir} ${minaz}) CCW:${topology.edges.indexOf(data.nextCCW)} (${data.nextCWWDir} ${maxaz})`)

  if (!edge && edges.length > 0 && data.cwFace !== data.ccwFace) {
    throw new Error(`Corrupted topology: adjacent edges ${data.nextCW} and ${data.nextCCW} bind different face (${data.cwFace} and ${data.ccwFace})`)
  }

  return edges
}

function addEdge (topology, start, end, coordinates, modFace) {
  const { edges, edgesTree, faces } = topology

  if (!isSimple(coordinates)) {
    throw new SpatialError('curve not simple')
  }

  const xs = coordinates.map(c => c[0])
  const ys = coordinates.map(c => c[1])

  const edge = {
    start,
    end,
    coordinates,
    leftFace: undefined,
    rightFace: undefined,
    minX: Math.min(...xs),
    minY: Math.min(...ys),
    maxX: Math.max(...xs),
    maxY: Math.max(...ys)
  }

  // TODO: remove repeated points
  // TODO: check that we haave at least two points left

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

  const nodes = start !== end ? [start, end] : [start]

  nodes.forEach(node => {
    if (node.face) {
      if (!edge.leftFace) {
        edge.leftFace = edge.rightFace = node.face
      } else if (edge.leftFace !== node.face) {
        const id1 = faces.indexOf(edge.leftFace)
        const id2 = faces.indexOf(node.face)
        throw new SpatialError(`geometry crosses an edge (endnodes in faces ${id1} and ${id2})`)
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
    console.debug(`New edge is connected on start node, next_right is ${topology.edges.indexOf(edge.nextRight)} (${edge.nextRightDir}), prev_left is ${topology.edges.indexOf(prevLeft)} (${prevLeftDir})`)
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
    console.debug(`New edge is isolated on start node, next_right is ${topology.edges.indexOf(edge.nextRight)} (${edge.nextRightDir}), prev_left is ${topology.edges.indexOf(prevLeft)} (${prevLeftDir})`)
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
    console.debug(`New edge is connected on end node, next_left is ${topology.edges.indexOf(edge.nextLeft)} (${edge.nextLeftDir}), prev_right is ${topology.edges.indexOf(prevRight)} (${prevRightDir})`)
    if (!edge.rightFace) {
      edge.rightFace = span.ccwFace
    } else if (edge.rightFace !== epan.ccwFace) {
      const id1 = topology.faces.indexOf(edge.rightFace)
      const id2 = topology.faces.indexOf(epan.ccwFace)
      throw new Error(`Side-location conflict: new edge starts in face ${id1} and ends in face ${id2}`)
    }
    if (!edge.leftFace) {
      edge.leftFace = span.cwFace
    } else if (edge.leftFace !== epan.cwFace) {
      const id1 = topology.faces.indexOf(edge.leftFace)
      const id2 = topology.faces.indexOf(epan.cwFace)
      throw new Error(`Side-location conflict: new edge starts in face ${id1} and ends in face ${id2}`)
    }
  } else {
    span.wasIsolated = true
    edge.nextLeft = edge
    edge.nextLeftDir = isClosed
    prevRight = edge
    prevRightDir = !isClosed
    console.debug(`New edge is isolated on end node, next_left is ${topology.edges.indexOf(edge.nextLeft)} (${edge.nextLeftDir}), prev_right is ${topology.edges.indexOf(prevRight)} (${prevRightDir})`)
  }

  if (edge.leftFace !== edge.rightFace) {
    throw new Error('faces mismatch: invalid topology')
  } else if (!edge.leftFace) {
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
    delete start.face
  }
  if (epan.wasIsolated) {
    delete epan.face
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
