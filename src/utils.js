import Coordinate from '../node_modules/jsts/src/org/locationtech/jts/geom/Coordinate'
import GeometryFactory from '../node_modules/jsts/src/org/locationtech/jts/geom/GeometryFactory'
import IsSimpleOp from '../node_modules/jsts/src/org/locationtech/jts/operation/IsSimpleOp'
import RelateOp from '../node_modules/jsts/src/org/locationtech/jts/operation/relate/RelateOp'
import DistanceOp from '../node_modules/jsts/src/org/locationtech/jts/operation/distance/DistanceOp'
import Polygonizer from '../node_modules/jsts/src/org/locationtech/jts/operation/polygonize/Polygonizer'
import BoundaryNodeRule from '../node_modules/jsts/src/org/locationtech/jts/algorithm/BoundaryNodeRule'
import LengthIndexedLine from '../node_modules/jsts/src/org/locationtech/jts/linearref/LengthIndexedLine'

const factory = new GeometryFactory()
const isSimpleOp = new IsSimpleOp()

function toLineString (coordinates) {
  return factory.createLineString(coordinates.map(c => new Coordinate(c[0], c[1])))
}

function toCoordinate (c) {
  return new Coordinate(c[0], c[1])
}

function toPoint (c) {
  return factory.createPoint(new Coordinate(c[0], c[1]))
}

function toPolygon (coordinates) {
  return factory.createPolygon(coordinates.map(c => new Coordinate(c[0], c[1])))
}

function polyToCoordss (poly) {
  const cs = lineStringToCoords(poly.getExteriorRing())
  return [cs]
}

function lineStringToCoords (ls) {
  return ls.getCoordinates().map(c => [c.x, c.y])
}

export function isSimple (coordinates) {
  const lineString = toLineString(coordinates)
  return isSimpleOp.isSimpleLinearGeometry(lineString)
}

export function relate (cs1, cs2) {
  const ls1 = toLineString(cs1)
  const ls2 = toLineString(cs2)
  return RelateOp.relate(ls1, ls2, BoundaryNodeRule.ENDPOINT_BOUNDARY_RULE)
}

export function equals (c1, c2) {
  return c1[0] === c2[0] && c1[1] === c2[1]
}

export function signedArea (shell) {
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

export function azimuth (a, b) {
  let d

  if (a[0] === b[0]) {
    if (a[1] < b[1]) d = 0.0
    else if (a[1] > b[1]) d = Math.PI
    else throw new Error('same coordinate')
    return d
  }

  if (a[1] === b[1]) {
    if (a[0] < b[0]) d = Math.PI / 2
    else if (a[0] > b[0]) d = Math.PI + (Math.PI / 2)
    else throw new Error('same coordinate')
    return d
  }

  if (a[0] < b[0]) {
    if (a[1] < b[1]) {
      d = Math.atan(Math.abs(a[0] - b[0]) / Math.abs(a[1] - b[1]))
    } else {
      d = Math.atan(Math.abs(a[1] - b[1]) / Math.abs(a[0] - b[0])) + (Math.PI / 2)
    }
  } else {
    if (a[1] > b[1]) {
      d = Math.atan(Math.abs(a[0] - b[0]) / Math.abs(a[1] - b[1])) + Math.PI
    } else {
      d = Math.atan(Math.abs(a[1] - b[1]) / Math.abs(a[0] - b[0])) + (Math.PI + (Math.PI / 2))
    }
  }

  return d
}

export function polygonize (css) {
  const lss = css.map(toLineString)
  const polygonizer = new Polygonizer()
  lss.forEach(ls => polygonizer.add(ls))
  const polys = polygonizer.getPolygons()
  return polyToCoordss(polys.get(0))
}

export function split (coordinates, coordinate) {
  const ls = toLineString(coordinates)
  const c = toCoordinate(coordinate)
  const lil = new LengthIndexedLine(ls)
  const splitIndex = lil.project(c)
  const ls1 = lil.extractLine(lil.getStartIndex(), splitIndex)
  const ls2 = lil.extractLine(splitIndex, lil.getEndIndex())
  const cs1 = lineStringToCoords(ls1)
  const cs2 = lineStringToCoords(ls2)
  return [cs1, cs2]
}

function isLeft (c0, c1, c2) {
  return ((c1[0] - c0[0]) * (c2[1] - c0[1])) - ((c2[0] - c0[0]) * (c1[1] - c0[1]))
}

export function distance (c, cs) {
  const point = toPoint(c)
  const lineString = toLineString(cs)
  return DistanceOp.distance(point, lineString)
}

export function pointInPoly (c, shell) {
  // return calcWindingNumber(c, shell) !== 0
  const point = toPoint(c)
  const polygon = toPolygon(shell)
  return RelateOp.contains(polygon, point)
}

export function calcWindingNumber (c, shell) {
  let wn = 0
  for (let i = 0; i < shell.length - 1; i++) {
    const va = shell[i]
    if (va[1] <= c[1]) {
      const vb = shell[i + 1]
      if (vb[1] > c[1]) {
        const l = isLeft(va, vb, c)
        if (l > 0) {
          wn++
        } else if (l === 0) {
          return 0
        }
      }
    } else {
      const vb = shell[i + 1]
      if (vb[1] <= c[1]) {
        const l = isLeft(va, vb, c)
        if (l < 0) {
          wn--
        } else if (l === 0) {
          return 0
        }
      }
    }
  }
  return wn
}
