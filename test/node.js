import { expect } from 'chai'

import { createTopology } from '../src/topo'

let topo

beforeEach(() => {
  topo = createTopology('test', 0, 0)
})

describe('node', () => {
  describe('addIsoNode', () => {
    it('should be able to add a single node to an empty topology', () => {
      const node = topo.addIsoNode([0, 0])
      expect(node).to.exist
    })
    it('should refuse to add overlapping nodes to an empty topology', () => {
      const node = topo.addIsoNode([0, 0])
      expect(node).to.exist
      expect(() => {
        topo.addIsoNode([0, 0])
      }).to.throw(/^coincident node$/)
    })
  })
})
