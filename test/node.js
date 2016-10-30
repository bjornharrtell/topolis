import expect from 'expect.js'

import { create as createTopology } from '../src/topology'
import { add } from '../src/node'

let topology

beforeEach(() => {
  topology = createTopology('test', 0, 0)
})

describe('node', () => {
  describe('add', () => {
    it('should be able to add a single node to an empty topology', () => {
      const node = add(topology, [0, 0])
      expect(node).to.ok()
    })
    it('should refuse to add overlapping nodes to an empty topology', () => {
      const node = add(topology, [0, 0])
      expect(node).to.ok()
      expect(() => {
        add(topology, [0, 0])
      }).to.throwException(/^coincident node$/)
    })
  })
})
