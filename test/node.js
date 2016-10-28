import expect from 'expect.js'

import { create as createTopology } from 'topology'
import { add } from 'node'

let topology

beforeEach(() => {
  topology = createTopology('test', 0, 0)
})

describe('node', () => {
  describe('add', () => {
    it('be able to add a single node to an empty topology', () => {
      const id = add(topology, [0, 0])
      expect(id).to.equal(1)
    })
    it('refuse to add overlapping nodes to an empty topology', () => {
      const id1 = add(topology, [0, 0])
      expect(id1).to.equal(1)
      const id2 = add(topology, [0, 0])
      expect(id2).to.equal(-1)
    })
  })
})
