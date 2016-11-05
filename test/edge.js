import expect from 'expect.js'

import { create as createTopology } from '../src/topology'
import { addIsoNode } from '../src/node'
import { addIsoEdge, addEdgeNewFaces } from '../src/edge'

let topology

beforeEach(() => {
  topology = createTopology('test', 0, 0)
})

describe('edge', () => {
  describe('addIsoEdge', () => {
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
      /* equivalent postgis topo
      select droptopology('topo5');
      select createtopology('topo5', 0, 0);
      select st_addisonode('topo5', 0, ST_GeomFromText('POINT(0 0)'));
      select st_addisonode('topo5', 0, ST_GeomFromText('POINT(1 1)'));
      select st_addisoedge('topo5', 1, 2, ST_GeomFromText('LINESTRING(0 0, 1 1)'));
      select st_addisonode('topo5', 0, ST_GeomFromText('POINT(0 1)'));
      select st_addisonode('topo5', 0, ST_GeomFromText('POINT(1 0)'));
      select st_addisoedge('topo5', 3, 4, ST_GeomFromText('LINESTRING(0 1, 1 0)'));
      */
    })
  })

  describe('addEdgeNewFaces', () => {
    it('should be able to add a closed edge to an empty topology', () => {
      const node = addIsoNode(topology, [0, 0])
      const edge = addEdgeNewFaces(topology, node, node, [[0, 0], [0, 1], [1, 1], [0, 0]])

      const universe = topology.faces[0]
      const newFace = topology.faces[1]

      expect(edge.start).to.eql(node)
      expect(edge.end).to.eql(node)
      expect(edge.nextLeft).to.eql(edge)
      expect(edge.nextLeftDir).to.be(true)
      expect(edge.nextRight).to.eql(edge)
      expect(edge.nextRightDir).to.be(false)
      expect(edge.leftFace).to.eql(universe)
      expect(edge.rightFace).to.eql(newFace)

      /* equivalent postgis topo
      select createtopology('topo4', 0, 0)
      select st_addisonode('topo4', 0, ST_GeomFromText('POINT(0 0)'))
      select st_addedgenewfaces('topo4', 1, 1, ST_GeomFromText('LINESTRING(0 0, 0 1, 1 1, 0 0)'))
      */
    })

    it('should be able to add two edges forming a face to an empty topology', () => {
      const node1 = addIsoNode(topology, [0, 0])
      const node2 = addIsoNode(topology, [1, 1])
      const edge1 = addEdgeNewFaces(topology, node1, node2, [[0, 0], [0, 1], [1, 1]])
      const edge2 = addEdgeNewFaces(topology, node2, node1, [[1, 1], [1, 0], [0, 0]])

      const universe = topology.faces[0]
      const newFace = topology.faces[1]

      expect(edge1.start).to.eql(node1)
      expect(edge1.end).to.eql(node2)
      expect(edge1.nextLeft).to.eql(edge2)
      expect(edge1.nextLeftDir).to.be(true)
      expect(edge1.nextRight).to.eql(edge2)
      expect(edge1.nextRightDir).to.be(false)
      expect(edge1.leftFace).to.eql(universe)
      expect(edge1.rightFace).to.eql(newFace)

      expect(edge2.start).to.eql(node2)
      expect(edge2.end).to.eql(node1)
      expect(edge2.nextLeft).to.eql(edge1)
      expect(edge2.nextLeftDir).to.be(true)
      expect(edge2.nextRight).to.eql(edge1)
      expect(edge2.nextRightDir).to.be(false)
      expect(edge2.leftFace).to.eql(universe)
      expect(edge2.rightFace).to.eql(newFace)

      /* equivalent postgis topo
      select droptopology('topo5');
      select createtopology('topo5', 0, 0);
      select st_addisonode('topo5', 0, ST_GeomFromText('POINT(0 0)'));
      select st_addisonode('topo5', 0, ST_GeomFromText('POINT(1 1)'));
      select st_addedgenewfaces('topo5', 1, 2, ST_GeomFromText('LINESTRING(0 0, 0 1, 1 1)'));
      select st_addedgenewfaces('topo5', 2, 1, ST_GeomFromText('LINESTRING(1 1, 1 0, 0 0)'));
      */
    })
  })
})
