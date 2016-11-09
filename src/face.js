import { calcWindingNumber } from './utils'
import { sid } from './edge'

function getNodeByFace (topology, face) {
  // TODO: only within face mbr
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
  const faces = topology.faces
  const universe = topology.faces[0]

  const sedges = getRingEdges(topology, edge, dir, 0)

  if (sedges.length === 0) {
    throw new Error('no ring edges for edge' + edge.id)
  }

  console.debug(`getRingEdges returned ${sedges.length} edges`)

  if (sedges.some(se => se.edge === edge && se.dir === !dir)) {
    console.debug('not a ring')
    return 0
  }

  console.debug(`Edge ${edge.id} split face ${face.id} (mbr_only:${mbrOnly})`)

  const newFace = {
    id: faces.length
  }

  // const ringEdges = sedges.map(se => se.edge).filter((elem, pos, arr) => arr.indexOf(elem) === pos)

  sedges.forEach((e, i) => {
    console.debug(`Edge ${i} in ring of edge ${sid(edge, dir)} is edge ${sid(e.edge, e.dir)}`)
  })

  const shell = sedges
    .map(e => e.dir ? e.edge.coordinates : e.edge.coordinates.slice().reverse())
    .reduce((a, b) => a.concat(b), [])

  const isccw = signedArea(shell) <= 0
  console.debug(`Ring of edge ${edge.id} is ${isccw ? 'counter' : ''}clockwise`)

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
    let found = 0
    sedges.every(se => {
      if (e === se.edge) {
        if (se.dir) {
          console.debug(`Edge ${e.id} is a forward edge of the new ring`)
          e.leftFace = newFace
        } else {
          console.debug(`Edge ${e.id} is a backward edge of the new ring`)
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
        console.debug(`Edge ${e.id} contained in an hole of the new face`)
        return
      }
    } else {
      if (!contains) {
        console.debug(`Edge ${e.id} not contained in the face shell`)
        return
      }
    }

    if (e.leftFace === face) {
      console.debug(`Edge ${e.id} has new face on the left side`)
      e.leftFace = newFace
    }

    if (e.rightFace === face) {
      console.debug(`Edge ${e.id} has new face on the right side`)
      e.rightFace = newFace
    }
  })

  const nodes = getNodeByFace(topology, face)

  nodes.forEach(n => {
    const contains = calcWindingNumber(n.coordinate, shell) !== 0
    console.debug(`Node ${n.id} is ${contains ? '' : 'not '}contained in new ring, newface is ${newFaceIsOutside ? 'outside' : 'inside'}`)
    if (newFaceIsOutside) {
      if (contains) {
        console.debug(`Node ${n.id} contained in an hole of the new face`)
        return
      }
    } else {
      if (!contains) {
        console.debug(`Node ${n.id} contained in the face shell`)
        return
      }
    }
    n.face = newFace
  })

  return newFace
}
