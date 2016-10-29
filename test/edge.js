import expect from 'expect.js'

import { create as createTopology } from '../src/topology'
import { add as addNode } from '../src/node'
import { add } from '../src/edge'

let topology

beforeEach(() => {
  topology = createTopology('test', 0, 0)
})

describe('edge', () => {
  describe('add', () => {
    it('should be able to add an edge to an empty topology', () => {
      const start = addNode(topology, [0, 0])
      const end = addNode(topology, [1, 1])
      const id = add(topology, start, end, [[0, 0], [1, 1]])
      expect(id).to.equal(1)
    })
    it('should refuse to add a duplicate edge', () => {
      const start = addNode(topology, [0, 0])
      const end = addNode(topology, [1, 1])
      const id1 = add(topology, start, end, [[0, 0], [1, 1]])
      expect(id1).to.equal(1)
      expect(() => {
        add(topology, start, end, [[0, 0], [1, 1]])
      }).to.throwException(/^geometry crosses edge 0$/)
    })
    it('should refuse to add non-simple input', () => {
      const start = addNode(topology, [0, 0])
      const end = addNode(topology, [1, 1])
      expect(() => {
        add(topology, start, end, [[0, 0], [1, 1], [0, 1], [1, 0]])
      }).to.throwException(/^curve not simple$/)
    })
  })
})
