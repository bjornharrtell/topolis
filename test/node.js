import expect from 'expect.js'

import { createTopology } from '../src/topo'

let topo

beforeEach(() => {
  topo = createTopology('test', 0, 0)
})

describe('node', () => {
  describe('addIsoNode', () => {
    it('should be able to add a single node to an empty topology', () => {
      const node = topo.addIsoNode([0, 0])
      expect(node).to.ok()
    })
    it('should refuse to add overlapping nodes to an empty topology', () => {
      const node = topo.addIsoNode([0, 0])
      expect(node).to.ok()
      expect(() => {
        topo.addIsoNode([0, 0])
      }).to.throwException(/^coincident node$/)
    })
  })
})
