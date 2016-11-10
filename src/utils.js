import Coordinate from '../node_modules/jsts/src/org/locationtech/jts/geom/Coordinate'
import GeometryFactory from '../node_modules/jsts/src/org/locationtech/jts/geom/GeometryFactory'
import IsSimpleOp from '../node_modules/jsts/src/org/locationtech/jts/operation/IsSimpleOp'
import RelateOp from '../node_modules/jsts/src/org/locationtech/jts/operation/relate/RelateOp'
import Polygonizer from '../node_modules/jsts/src/org/locationtech/jts/operation/polygonize/Polygonizer'
import BoundaryNodeRule from '../node_modules/jsts/src/org/locationtech/jts/algorithm/BoundaryNodeRule'

const factory = new GeometryFactory()
const isSimpleOp = new IsSimpleOp()

function toLineString (coordinates) {
  return factory.createLineString(coordinates.map(c => new Coordinate(c[0], c[1])))
}

function toPoint (c) {
  return factory.createPoint(new Coordinate(c[0], c[1]))
}

function toPolygon (coordinates) {
  return factory.createPolygon(coordinates.map(c => new Coordinate(c[0], c[1])))
}

function polyToCoordss (poly) {
  return [lineStringToCoords(poly.getExteriorRing())]
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

function isLeft (c0, c1, c2) {
  return ((c1[0] - c0[0]) * (c2[1] - c0[1])) - ((c2[0] - c0[0]) * (c1[1] - c0[1]))
}

export function pointInPoly (c, shell) {
  const point = toPoint(c)
  const polygon = toPolygon(shell)
  console.log(polygon.shell.points.coordinates)
  return RelateOp.contains(polygon, point)
}

export function calcWindingNumber (c, shell) {
  let wn = 0
  for (let i = 0; i < shell.length - 1; i++) {
    const va = shell[i]
    if (va[1] <= c[1]) {
      const vb = shell[i + 1]
      if (vb[1] > c[1]) {
        if (isLeft(va, vb, c) > 0) {
          wn++
        }
      }
    } else {
      const vb = shell[i + 1]
      if (vb[1] <= c[1]) {
        if (isLeft(va, vb, c) < 0) {
          wn--
        }
      }
    }
  }
  return wn
}
