import expect from 'expect.js'

import { create as createTopology } from '../src/topo'
import { addIsoNode } from '../src/node'
import { addIsoEdge, addEdgeNewFaces } from '../src/edge'

let topology

/*
function unit() { }
*/

beforeEach(() => {
  topology = createTopology('test', 0, 0)
})

describe('edge', () => {
  describe('addIsoEdge', () => {
    it('should be able to add an edge', () => {
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
      }).to.throwException(/^geometry crosses edge 1$/)
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
    it('should be able to add a closed edge', () => {
      const node = addIsoNode(topology, [0, 0])
      const result = addEdgeNewFaces(topology, node, node, [[0, 0], [0, 1], [1, 1], [0, 0]])
      const edge = result.edge

      const universe = topology.faces[0]
      const newFace = topology.faces[1]

      expect(edge.start).to.be(node)
      expect(edge.end).to.be(node)
      expect(edge.nextLeft).to.be(edge)
      expect(edge.nextLeftDir).to.be(true)
      expect(edge.nextRight).to.be(edge)
      expect(edge.nextRightDir).to.be(false)
      expect(edge.leftFace).to.be(universe)
      expect(edge.rightFace).to.be(newFace)

      /* equivalent postgis topo
      select droptopology('topo4');
      select createtopology('topo4', 0, 0);
      select st_addisonode('topo4', 0, ST_GeomFromText('POINT(0 0)'));
      select st_addedgenewfaces('topo4', 1, 1, ST_GeomFromText('LINESTRING(0 0, 0 1, 1 1, 0 0)'));
      */
    })

    it('should be able to add two edges forming a face', () => {
      const node1 = addIsoNode(topology, [0, 0])
      const node2 = addIsoNode(topology, [1, 1])
      const result1 = addEdgeNewFaces(topology, node1, node2, [[0, 0], [0, 1], [1, 1]])
      const edge1 = result1.edge
      const result2 = addEdgeNewFaces(topology, node2, node1, [[1, 1], [1, 0], [0, 0]])
      const edge2 = result2.edge

      const universe = topology.faces[0]
      const newFace = topology.faces[1]

      expect(edge1.start).to.be(node1)
      expect(edge1.end).to.be(node2)
      expect(edge1.nextLeft).to.be(edge2)
      expect(edge1.nextLeftDir).to.be(true)
      expect(edge1.nextRight).to.be(edge2)
      expect(edge1.nextRightDir).to.be(false)
      expect(edge1.leftFace).to.be(universe)
      expect(edge1.rightFace).to.be(newFace)

      expect(edge2.start).to.be(node2)
      expect(edge2.end).to.be(node1)
      expect(edge2.nextLeft).to.be(edge1)
      expect(edge2.nextLeftDir).to.be(true)
      expect(edge2.nextRight).to.be(edge1)
      expect(edge2.nextRightDir).to.be(false)
      expect(edge2.leftFace).to.be(universe)
      expect(edge2.rightFace).to.be(newFace)

      /* equivalent postgis topo
      select droptopology('topo5');
      select createtopology('topo5', 0, 0);
      select st_addisonode('topo5', 0, ST_GeomFromText('POINT(0 0)'));
      select st_addisonode('topo5', 0, ST_GeomFromText('POINT(1 1)'));
      select st_addedgenewfaces('topo5', 1, 2, ST_GeomFromText('LINESTRING(0 0, 0 1, 1 1)'));
      select st_addedgenewfaces('topo5', 2, 1, ST_GeomFromText('LINESTRING(1 1, 1 0, 0 0)'));
      */
    })

    it('should be able to add three edges forming two faces', () => {
      const node1 = addIsoNode(topology, [0, 0])
      const node2 = addIsoNode(topology, [1, 1])
      const edge1 = addEdgeNewFaces(topology, node1, node2, [[0, 0], [0, 1], [1, 1]]).edge
      const edge2 = addEdgeNewFaces(topology, node2, node1, [[1, 1], [1, 0], [0, 0]]).edge
      const edge3 = addEdgeNewFaces(topology, node1, node2, [[0, 0], [1, 1]]).edge

      const universe = topology.faces[0]
      const face2 = topology.faces[2]
      const face3 = topology.faces[3]

      expect(edge1.start).to.be(node1)
      expect(edge1.end).to.be(node2)
      expect(edge1.nextLeft).to.be(edge2)
      expect(edge1.nextLeftDir).to.be(true)
      expect(edge1.nextRight).to.be(edge3)
      expect(edge1.nextRightDir).to.be(true)
      expect(edge1.leftFace).to.be(universe)
      expect(edge1.rightFace).to.be(face3)

      expect(edge2.start).to.be(node2)
      expect(edge2.end).to.be(node1)
      expect(edge2.nextLeft).to.be(edge1)
      expect(edge2.nextLeftDir).to.be(true)
      expect(edge2.nextRight).to.be(edge3)
      expect(edge2.nextRightDir).to.be(false)
      expect(edge2.leftFace).to.be(universe)
      expect(edge2.rightFace).to.be(face2)

      expect(edge3.start).to.be(node1)
      expect(edge3.end).to.be(node2)
      expect(edge3.nextLeft).to.be(edge1)
      expect(edge3.nextLeftDir).to.be(false)
      expect(edge3.nextRight).to.be(edge2)
      expect(edge3.nextRightDir).to.be(false)
      expect(edge3.leftFace).to.be(face3)
      expect(edge3.rightFace).to.be(face2)

      /* equivalent postgis topo
      select droptopology('topo5');
      select createtopology('topo5', 0, 0);
      select st_addisonode('topo5', 0, ST_GeomFromText('POINT(0 0)'));
      select st_addisonode('topo5', 0, ST_GeomFromText('POINT(1 1)'));
      select st_addedgenewfaces('topo5', 1, 2, ST_GeomFromText('LINESTRING(0 0, 0 1, 1 1)'));
      select st_addedgenewfaces('topo5', 2, 1, ST_GeomFromText('LINESTRING(1 1, 1 0, 0 0)'));
      select st_addedgenewfaces('topo5', 1, 2, ST_GeomFromText('LINESTRING(0 0, 1 1)'));
      */
    })

    it('should be able to add five edges forming two faces', () => {
      const node1 = addIsoNode(topology, [0, 0])
      const node2 = addIsoNode(topology, [0, 1])
      const node3 = addIsoNode(topology, [1, 1])
      const node4 = addIsoNode(topology, [1, 0])
      const edge1 = addEdgeNewFaces(topology, node1, node2, [[0, 0], [0, 1]]).edge
      const edge2 = addEdgeNewFaces(topology, node2, node3, [[0, 1], [1, 1]]).edge
      const edge3 = addEdgeNewFaces(topology, node3, node4, [[1, 1], [1, 0]]).edge
      const edge4 = addEdgeNewFaces(topology, node4, node1, [[1, 0], [0, 0]]).edge
      const edge5 = addEdgeNewFaces(topology, node1, node3, [[0, 0], [1, 1]]).edge

      const universe = topology.faces[0]
      const face2 = topology.faces[2]
      const face3 = topology.faces[3]

      expect(edge1.start).to.be(node1)
      expect(edge1.end).to.be(node2)
      expect(edge1.nextLeft).to.be(edge2)
      expect(edge1.nextLeftDir).to.be(true)
      expect(edge1.nextRight).to.be(edge5)
      expect(edge1.nextRightDir).to.be(true)
      expect(edge1.leftFace).to.be(universe)
      expect(edge1.rightFace).to.be(face3)

      expect(edge2.start).to.be(node2)
      expect(edge2.end).to.be(node3)
      expect(edge2.nextLeft).to.be(edge3)
      expect(edge2.nextLeftDir).to.be(true)
      expect(edge2.nextRight).to.be(edge1)
      expect(edge2.nextRightDir).to.be(false)
      expect(edge2.leftFace).to.be(universe)
      expect(edge2.rightFace).to.be(face3)

      expect(edge3.start).to.be(node3)
      expect(edge3.end).to.be(node4)
      expect(edge3.nextLeft).to.be(edge4)
      expect(edge3.nextLeftDir).to.be(true)
      expect(edge3.nextRight).to.be(edge5)
      expect(edge3.nextRightDir).to.be(false)
      expect(edge3.leftFace).to.be(universe)
      expect(edge3.rightFace).to.be(face2)

      expect(edge4.start).to.be(node4)
      expect(edge4.end).to.be(node1)
      expect(edge4.nextLeft).to.be(edge1)
      expect(edge4.nextLeftDir).to.be(true)
      expect(edge4.nextRight).to.be(edge3)
      expect(edge4.nextRightDir).to.be(false)
      expect(edge4.leftFace).to.be(universe)
      expect(edge4.rightFace).to.be(face2)

      expect(edge5.start).to.be(node1)
      expect(edge5.end).to.be(node3)
      expect(edge5.nextLeft).to.be(edge2)
      expect(edge5.nextLeftDir).to.be(false)
      expect(edge5.nextRight).to.be(edge4)
      expect(edge5.nextRightDir).to.be(false)
      expect(edge5.leftFace).to.be(face3)
      expect(edge5.rightFace).to.be(face2)

      /* equivalent postgis topo
      select droptopology('topo5');
      select createtopology('topo5', 0, 0);
      select st_addisonode('topo5', 0, ST_GeomFromText('POINT(0 0)'));
      select st_addisonode('topo5', 0, ST_GeomFromText('POINT(0 1)'));
      select st_addisonode('topo5', 0, ST_GeomFromText('POINT(1 1)'));
      select st_addisonode('topo5', 0, ST_GeomFromText('POINT(1 0)'));
      select st_addedgenewfaces('topo5', 1, 2, ST_GeomFromText('LINESTRING(0 0, 0 1)'));
      select st_addedgenewfaces('topo5', 2, 3, ST_GeomFromText('LINESTRING(0 1, 1 1)'));
      select st_addedgenewfaces('topo5', 3, 4, ST_GeomFromText('LINESTRING(1 1, 1 0)'));
      select st_addedgenewfaces('topo5', 4, 1, ST_GeomFromText('LINESTRING(1 0, 0 0)'));
      select st_addedgenewfaces('topo5', 1, 3, ST_GeomFromText('LINESTRING(0 0, 1 1)'));
      */
    })
  })
})
