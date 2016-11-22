import expect from 'expect.js'

import { create as createTopology } from '../src/topo'
import { addIsoNode } from '../src/node'
import { e2s, addIsoEdge, addEdgeNewFaces, modEdgeSplit, remEdgeNewFace } from '../src/edge'

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
      const edge = addEdgeNewFaces(topology, node, node, [[0, 0], [0, 1], [1, 1], [0, 0]]).edge

      expect(e2s(edge)).to.be('1|1|1|1|-1|0|1')

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
      const edge1 = addEdgeNewFaces(topology, node1, node2, [[0, 0], [0, 1], [1, 1]]).edge
      const edge2 = addEdgeNewFaces(topology, node2, node1, [[1, 1], [1, 0], [0, 0]]).edge

      expect(e2s(edge1)).to.be('1|1|2|2|-2|0|1')
      expect(e2s(edge2)).to.be('2|2|1|1|-1|0|1')

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

      expect(e2s(edge1)).to.be('1|1|2|2|3|0|3')
      expect(e2s(edge2)).to.be('2|2|1|1|-3|0|2')
      expect(e2s(edge3)).to.be('3|1|2|-1|-2|3|2')

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

    it('should be able to add six edges forming three faces', () => {
      const node1 = addIsoNode(topology, [0, 0])
      const node2 = addIsoNode(topology, [0, 1])
      const node3 = addIsoNode(topology, [1, 1])
      const node4 = addIsoNode(topology, [1, 0])
      const edge1 = addEdgeNewFaces(topology, node1, node2, [[0, 0], [0, 1]]).edge
      const edge2 = addEdgeNewFaces(topology, node2, node3, [[0, 1], [1, 1]]).edge
      const edge3 = addEdgeNewFaces(topology, node3, node4, [[1, 1], [1, 0]]).edge
      const edge4 = addEdgeNewFaces(topology, node4, node1, [[1, 0], [0, 0]]).edge
      const edge5 = addEdgeNewFaces(topology, node1, node3, [[0, 0], [1, 1]]).edge
      const edge6 = addEdgeNewFaces(topology, node1, node2, [[0, 0], [0.25, 0.5], [0, 1]]).edge

      expect(e2s(edge1)).to.be('1|1|2|2|6|0|5')
      expect(e2s(edge2)).to.be('2|2|3|3|-6|0|4')
      expect(e2s(edge3)).to.be('3|3|4|4|-5|0|2')
      expect(e2s(edge4)).to.be('4|4|1|1|-3|0|2')
      expect(e2s(edge5)).to.be('5|1|3|-2|-4|4|2')
      expect(e2s(edge6)).to.be('6|1|2|-1|5|5|4')

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
      select st_addedgenewfaces('topo5', 1, 2, ST_GeomFromText('LINESTRING(0 0, 0.25 0.5, 0 1)'));
      */
    })

    it('should be able to add two edges forming two faces', () => {
      const node1 = addIsoNode(topology, [0, 0])
      const edge1 = addEdgeNewFaces(topology, node1, node1, [[0, 0], [0, 1], [1, 1], [0, 0]]).edge
      const edge2 = addEdgeNewFaces(topology, node1, node1, [[0, 0], [0, -1], [-1, -1], [0, 0]]).edge

      expect(e2s(edge1)).to.be('1|1|1|2|-1|0|1')
      expect(e2s(edge2)).to.be('2|1|1|1|-2|0|2')

      /*
      select droptopology('topo5');
      select createtopology('topo5', 0, 0);
      select st_addisonode('topo5', 0, ST_GeomFromText('POINT(0 0)'));
      select st_addedgenewfaces('topo5', 1, 1, ST_GeomFromText('LINESTRING(0 0, 0 1, 1 1, 0 0)'));
      select st_addedgenewfaces('topo5', 1, 1, ST_GeomFromText('LINESTRING(0 0, 0 -1, -1 -1, 0 0)'));
      */
    })
  })

  describe('modEdgeSplit', () => {
    it('should split a middle edge into two edges', () => {
      const node1 = addIsoNode(topology, [0, 0])
      const node2 = addIsoNode(topology, [1, 1])
      const edge1 = addEdgeNewFaces(topology, node1, node2, [[0, 0], [0, 1], [1, 1]]).edge
      const edge2 = addEdgeNewFaces(topology, node2, node1, [[1, 1], [1, 0], [0, 0]]).edge
      const edge3 = addEdgeNewFaces(topology, node1, node2, [[0, 0], [1, 1]]).edge
      const node3 = modEdgeSplit(topology, edge3, [0.5, 0.5])
      const edge4 = edge3.nextLeft

      expect(e2s(edge1)).to.be('1|1|2|2|3|0|3')
      expect(e2s(edge2)).to.be('2|2|1|1|-4|0|2')
      expect(e2s(edge3)).to.be('3|1|3|4|-2|3|2')
      expect(e2s(edge4)).to.be('4|3|2|-1|-3|3|2')
      expect(node3.coordinate).to.eql([0.5, 0.5])

      /* equivalent postgis topo
      select droptopology('topo5');
      select createtopology('topo5', 0, 0);
      select st_addisonode('topo5', 0, ST_GeomFromText('POINT(0 0)'));
      select st_addisonode('topo5', 0, ST_GeomFromText('POINT(1 1)'));
      select st_addedgenewfaces('topo5', 1, 2, ST_GeomFromText('LINESTRING(0 0, 0 1, 1 1)'));
      select st_addedgenewfaces('topo5', 2, 1, ST_GeomFromText('LINESTRING(1 1, 1 0, 0 0)'));
      select st_addedgenewfaces('topo5', 1, 2, ST_GeomFromText('LINESTRING(0 0, 1 1)'));
      select st_modedgesplit('topo5', 3, ST_GeomFromText('POINT(0.5 0.5)'));
      */
    })
  })

  describe('modEdgeSplit', () => {
    it('should split two edges and one face into five edges and two faces', () => {
      const node1 = addIsoNode(topology, [0, 0])
      const node2 = addIsoNode(topology, [1, 1])
      const edge1 = addEdgeNewFaces(topology, node1, node2, [[0, 0], [0, 1], [1, 1]]).edge
      const edge2 = addEdgeNewFaces(topology, node2, node1, [[1, 1], [1, 0], [0, 0]]).edge
      const node3 = modEdgeSplit(topology, edge1, [0, 1])
      const edge3 = edge1.nextLeft
      const node4 = modEdgeSplit(topology, edge2, [1, 0])
      const edge4 = edge2.nextLeft
      const edge5 = addEdgeNewFaces(topology, node3, node4, [[0, 1], [1, 0]]).edge

      expect(e2s(edge1)).to.be('1|1|3|3|-4|0|2')
      expect(e2s(edge2)).to.be('2|2|4|4|-3|0|3')
      expect(e2s(edge3)).to.be('3|3|2|2|5|0|3')
      expect(e2s(edge4)).to.be('4|4|1|1|-5|0|2')
      expect(e2s(edge5)).to.be('5|3|4|-2|-1|3|2')
      expect(node3.coordinate).to.eql([0, 1])
      expect(node4.coordinate).to.eql([1, 0])

      /*
      expect(e2s(edge)).to.be('3|1|3|4|-2|3|2')
      expect(edge.coordinates).to.eql([ [ 0, 0 ], [ 0.5, 0.5 ] ])
      expect(e2s(edge.nextLeft)).to.be('4|3|2|-1|-3|3|2')
      expect(edge.nextLeft.coordinates).to.eql([ [ 0.5, 0.5 ], [ 1, 1 ] ])
      expect(node.id).to.be(3)
      */

      /* equivalent postgis topo
      select droptopology('topo5');
      select createtopology('topo5', 0, 0);
      select st_addisonode('topo5', 0, ST_GeomFromText('POINT(0 0)'));
      select st_addisonode('topo5', 0, ST_GeomFromText('POINT(1 1)'));
      select st_addedgenewfaces('topo5', 1, 2, ST_GeomFromText('LINESTRING(0 0, 0 1, 1 1)'));
      select st_addedgenewfaces('topo5', 2, 1, ST_GeomFromText('LINESTRING(1 1, 1 0, 0 0)'));
      select st_modedgesplit('topo5', 1, ST_GeomFromText('POINT(0 1)'));
      select st_modedgesplit('topo5', 2, ST_GeomFromText('POINT(1 0)'));
      select st_addedgenewfaces('topo5', 3, 4, ST_GeomFromText('LINESTRING(0 1, 1 0)'));
      */
    })
  })

  describe('remEdgeNewFaces', () => {
    it('should be able to remove a single edge/face', () => {
      const node = addIsoNode(topology, [0, 0])
      const edge = addEdgeNewFaces(topology, node, node, [[0, 0], [0, 1], [1, 1], [0, 0]]).edge
      expect(e2s(edge)).to.be('1|1|1|1|-1|0|1')
      remEdgeNewFace(topology, edge)
      expect(e2s(edge)).to.be('1|1|1|1|-1|0|0')
    })

    it('should be able to remove a single edge and merge tree faces into two', () => {
      const node1 = addIsoNode(topology, [0, 0])
      const node2 = addIsoNode(topology, [1, 1])
      const edge1 = addEdgeNewFaces(topology, node1, node2, [[0, 0], [0, 1], [1, 1]]).edge
      const edge2 = addEdgeNewFaces(topology, node2, node1, [[1, 1], [1, 0], [0, 0]]).edge
      const edge3 = addEdgeNewFaces(topology, node1, node2, [[0, 0], [1, 1]]).edge

      expect(e2s(edge1)).to.be('1|1|2|2|3|0|3')
      expect(e2s(edge2)).to.be('2|2|1|1|-3|0|2')
      expect(e2s(edge3)).to.be('3|1|2|-1|-2|3|2')

      remEdgeNewFace(topology, edge3)

      // topology.edges.forEach(e => console.log(e2s(e)))
      // topology.faces.forEach(f => console.log(f))

      expect(e2s(edge1)).to.be('1|1|2|2|-2|0|4')
      expect(e2s(edge2)).to.be('2|2|1|1|-1|0|4')

      /* equivalent postgis topo
      select droptopology('topo5');
      select createtopology('topo5', 0, 0);
      select st_addisonode('topo5', 0, ST_GeomFromText('POINT(0 0)'));
      select st_addisonode('topo5', 0, ST_GeomFromText('POINT(1 1)'));
      select st_addedgenewfaces('topo5', 1, 2, ST_GeomFromText('LINESTRING(0 0, 0 1, 1 1)'));
      select st_addedgenewfaces('topo5', 2, 1, ST_GeomFromText('LINESTRING(1 1, 1 0, 0 0)'));
      select st_addedgenewfaces('topo5', 1, 2, ST_GeomFromText('LINESTRING(0 0, 1 1)'));
      select st_remedgenewface('topo5', 3);
      */
    })
  })
})
