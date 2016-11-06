import { calcWindingNumber } from './utils'

function getNodeByFace (topology, face) {
  return topology.nodes.filter(n => n.face === face)
}

function getRingEdges (topology, edge, dir, limit, foundEdges) {
  foundEdges = foundEdges || []
  foundEdges.push({ edge, dir })

  edge = dir ? edge.nextLeft : edge.nextRight
  dir = dir ? edge.nextLeftDir : edge.nextRightDir

  if (!foundEdges.some(fe => fe.edge === edge && fe.dir === dir)) {
    return getRingEdges(topology, edge, dir, 0, foundEdges)
  }

  return foundEdges
}

function getEdgeByFace (topology, face, mbr) {
  return topology.edges.filter(e => e.leftFace === face || e.rightFace === face)
  // TODO: include within mbr
}

function signedArea (shell) {
  if (shell.length < 3) {
    return 0
  }
  let sum = 0
  let x
  let y1
  let y2
  let p1 = shell[0]
  let p2 = shell[1]
  const x0 = p1[0]
  for (let i = 2; i < shell.length; i++) {
    let p3 = shell[i]
    x = p2[0] - x0
    y1 = p3[1]
    y2 = p1[1]
    sum += x * (y2 - y1)
    p1 = p2
    p2 = p3
  }
  return sum / 2
}

function getInteriorEdgePoint (coordinates) {
  // TODO: too naive
  return coordinates[1]
}

export function addFaceSplit (topology, edge, dir, face, mbrOnly) {
  const eid = topology.edges.indexOf(edge)
  const fid = topology.faces.indexOf(face)
  const universe = topology.faces[0]

  const edges = getRingEdges(topology, edge, dir, 0)

  if (edges.length === 0) {
    throw new Error('no ring edges for edge')
  }

  console.debug(`getRingEdges returned ${edges.length} edges`)

  if (edges.some(se => se.edge === edge && se.dir === !dir)) {
    console.debug('not a ring')
    return 0
  }

  console.debug(`Edge ${eid} (${dir}) split face ${fid} (mbr_only:${mbrOnly})`)

  const newFace = { }

  const shell = edges
    .map(e => e.edge.coordinates)
    .reduce((a, b) => a.concat(b), [])

  if (!dir) {
    shell.reverse()
  }

  const isccw = signedArea(shell) <= 0
  console.debug(`Ring of edge ${eid} is ${isccw ? 'counter' : ''}clockwise`)

  if (face === universe) {
    if (!isccw) {
      console.debug('The left face of this clockwise ring is the universe, will not create a new face there.')
      return -1
    }
  }

  if (mbrOnly && face !== universe) {
    if (isccw) {
      // TODO: update mbr for face
    }
    return -1
  }

  if (face !== universe && !isccw) {
    // TODO: newFace mbr shuld be same as face
  } else {
    // TODO: newFace mbr shuld be shellbox
  }

  topology.faces.push(newFace)

  const newFaceIsOutside = face !== universe && !isccw

  if (newFaceIsOutside) {
    console.debug('New face is on the outside of the ring, updating rings in former shell')
  } else {
    console.debug('New face is on the inside of the ring, updating forward edges in new ring')
  }

  const faceEdges = getEdgeByFace(topology, face, newFace)
  faceEdges.forEach(e => {
    const eid = topology.edges.indexOf(e)
    let found = 0
    edges.every(se => {
      if (e === se.edge) {
        if (se.dir) {
          e.leftFace = newFace
        } else {
          e.rightFace = newFace
        }
        found++
        if (found === 2) {
          return false
        }
      }
      return true
    })
    if (found > 0) {
      return
    }

    const ep = getInteriorEdgePoint(edge.coordinates)
    const contains = calcWindingNumber(ep, shell) !== 0

    if (newFaceIsOutside) {
      if (contains) {
        console.debug(`Edge ${eid} contained in an hole of the new face`)
        return
      }
    } else {
      if (!contains) {
        console.debug(`Edge ${eid} not contained in the face shell`)
        return
      }
    }

    if (e.leftFace === face) {
      console.debug(`Edge ${eid} has new face on the left side`)
      e.leftFace = newFace
    }

    if (e.rightFace === face) {
      console.debug(`Edge ${eid} has new face on the right side`)
      e.rightFace = newFace
    }
  })

  const nodes = getNodeByFace(topology, face)

  nodes.forEach(n => {
    const nid = topology.nodes.indexOf(n)
    const contains = calcWindingNumber(n.coordinate, shell) !== 0
    console.debug(`Node ${nid} is ${contains ? '' : 'not '}contained in new ring, newface is ${newFaceIsOutside ? 'outside' : 'inside'}`)
    if (newFaceIsOutside) {
      if (contains) {
        console.debug(`Node ${nid} contained in an hole of the new face`)
        return
      }
    } else {
      if (!contains) {
        console.debug(`Node ${nid} contained in the face shell`)
        return
      }
    }
    n.face = newFace
  })

  return newFace
}
