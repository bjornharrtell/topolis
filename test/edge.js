import expect from 'expect.js'

import { create as createTopology } from '../src/topology'
import { addIsoNode } from '../src/node'
import { addIsoEdge } from '../src/edge'

let topology

beforeEach(() => {
  topology = createTopology('test', 0, 0)
})

describe('edge', () => {
  describe('add', () => {
    it('should be able to add an edge to an empty topology', () => {
      const start = addIsoNode(topology, [0, 0])
      const end = addIsoNode(topology, [1, 1])
      const edge = addIsoEdge(topology, start, end, [[0, 0], [1, 1]])
      expect(edge).to.be.ok()
    })
    it('should refuse to add a duplicate edge', () => {
      const start = addIsoNode(topology, [0, 0])
      const end = addIsoNode(topology, [1, 1])
      const edge1 = addIsoEdge(topology, start, end, [[0, 0], [1, 1]])
      expect(edge1).to.be.ok()
      expect(() => {
        addIsoEdge(topology, start, end, [[0, 0], [1, 1]])
      }).to.throwException(/^not isolated node$/)
    })
    it('should refuse to add non-simple input', () => {
      const start = addIsoNode(topology, [0, 0])
      const end = addIsoNode(topology, [1, 0])
      expect(() => {
        addIsoEdge(topology, start, end, [[0, 0], [1, 1], [0, 1], [1, 0]])
      }).to.throwException(/^curve not simple$/)
    })
    it('should refuse to add a intersecting edge', () => {
      const start1 = addIsoNode(topology, [0, 0])
      const end1 = addIsoNode(topology, [1, 1])
      const edge1 = addIsoEdge(topology, start1, end1, [[0, 0], [1, 1]])
      expect(edge1).to.be.ok()
      const start2 = addIsoNode(topology, [0, 1])
      const end2 = addIsoNode(topology, [1, 0])
      expect(() => {
        addIsoEdge(topology, start2, end2, [[0, 1], [1, 0]])
      }).to.throwException(/^geometry crosses edge 0$/)
    })
  })
})
