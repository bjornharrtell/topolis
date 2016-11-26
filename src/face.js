/** @module */

import { signedArea, pointInPoly, polygonize } from './utils'
import { insertFace, trigger } from './topo'
import { sid } from './edge'

/**
 * Face definition
 *
 * @typedef {Object} Face
 * @property {number} id Face ID
 */

function getNodeByFace (topo, face) {
  // TODO: only within face mbr
  return topo.nodes.filter(n => n.face === face)
}

/**
 * Returns the ordered set of signed edge identifiers met by walking on an a given edge side.
 */
export function getRingEdges (topo, edge, dir, limit, foundEdges) {
  foundEdges = foundEdges || []
  foundEdges.push({ edge, dir })

  const nextEdge = dir ? edge.nextLeft : edge.nextRight
  const nextDir = dir ? edge.nextLeftDir : edge.nextRightDir

  if (!foundEdges.some(fe => fe.edge === nextEdge && fe.dir === nextDir)) {
    return getRingEdges(topo, nextEdge, nextDir, 0, foundEdges)
  }

  return foundEdges
}

function getEdgeByFace (topo, face, mbr) {
  return topo.edges.filter(e => e.leftFace === face || e.rightFace === face)
  // TODO: include within mbr
}

/**
 * Returns the polygon in the given topology with the specified face.
 * @param {module:topo~Topo} topo
 * @param {module:face~Face} face
 * @return {number[][][]}
 */
export function getFaceGeometry (topo, face) {
  const edges = getEdgeByFace(topo, face, false)
  if (edges.length === 0) {
    return []
  } else {
    const css = edges.map(e => e.coordinates)
    return polygonize(css)
  }
}

function getInteriorEdgePoint (coordinates) {
  // TODO: too naive
  return coordinates[1]
}

/**
 * @param {module:topo~Topo} topo
 * @param {module:edge~Edge} edge
 * @param {boolean} dir
 * @param {module:face~Face} face
 * @param {boolean} mbrOnly
 * @return {module:face~Face}
 * @private
 */
export function addFaceSplit (topo, edge, dir, face, mbrOnly) {
  console.debug(`addFaceSplit called on edge ${sid(edge, dir)} and face ${face.id}`)

  const universe = topo.faces[0]

  const sedges = getRingEdges(topo, edge, dir, 0)

  sedges.forEach((se, i) => console.debug(`Component ${i} in ring of edge ${edge.id} is edge ${sid(se.edge, se.dir)}`))

  if (sedges.length === 0) {
    throw new Error('no ring edges for edge' + edge.id)
  }

  console.debug(`getRingEdges returned ${sedges.length} edges`)

  if (sedges.some(se => se.edge === edge && se.dir === !dir)) {
    console.debug('not a ring')
    return 0
  }

  console.debug(`Edge ${sid(edge, dir)} split face ${face.id} (mbr_only:${mbrOnly})`)

  const newFace = {
    id: topo.facesSeq
  }

  // const ringEdges = sedges.map(se => se.edge).filter((elem, pos, arr) => arr.indexOf(elem) === pos)

  sedges.forEach((se, i) => {
    console.debug(`Edge ${i} in ring of edge ${sid(edge, dir)} is edge ${sid(se.edge, se.dir)}`)
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

  const newFaceIsOutside = face !== universe && !isccw

  if (newFaceIsOutside) {
    console.debug('New face is on the outside of the ring, updating rings in former shell')
  } else {
    console.debug('New face is on the inside of the ring, updating forward edges in new ring')
  }

  const faceEdges = getEdgeByFace(topo, face, newFace)

  console.debug(`getEdgeByFace returned ${faceEdges.length} edges`)

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
    const contains = pointInPoly(ep, shell)

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

  const nodes = getNodeByFace(topo, face)

  nodes.forEach(n => {
    const contains = pointInPoly(n.coordinate, shell)
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

  insertFace(topo, newFace)

  trigger(topo, 'addface', newFace)

  return newFace
}
