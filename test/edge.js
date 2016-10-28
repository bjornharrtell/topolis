import expect from 'expect.js'

import { create as createTopology } from 'topology'
import { add as addNode } from 'node'
import { add } from 'edge'

let topology

beforeEach(() => {
  topology = createTopology('test', 0, 0)
})

describe('edge', () => {
  describe('add', () => {
    it('be able to add a edge node to an empty topology', () => {
      const start = addNode(topology, [0, 0])
      const end = addNode(topology, [1, 1])
      const id = add(topology, start, end, [[0, 0], [1, 1]])
      expect(id).to.equal(1)
    })
  })
})
