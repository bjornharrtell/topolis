import Coordinate from '../node_modules/jsts/src/org/locationtech/jts/geom/Coordinate'
import GeometryFactory from '../node_modules/jsts/src/org/locationtech/jts/geom/GeometryFactory'
import IsSimpleOp from '../node_modules/jsts/src/org/locationtech/jts/operation/IsSimpleOp'
import RelateOp from '../node_modules/jsts/src/org/locationtech/jts/operation/relate/RelateOp'

const factory = new GeometryFactory()
const isSimpleOp = new IsSimpleOp()

function toLineString (coordinates) {
  return factory.createLineString(coordinates.map(c => new Coordinate(c[0], c[1])))
}

export function isSimple (coordinates) {
  const lineString = toLineString(coordinates)
  return isSimpleOp.isSimpleLinearGeometry(lineString)
}

export function intersects (cs1, cs2) {
  const ls1 = toLineString(cs1)
  const ls2 = toLineString(cs1)
  return RelateOp.intersects(ls1, ls2)
}
