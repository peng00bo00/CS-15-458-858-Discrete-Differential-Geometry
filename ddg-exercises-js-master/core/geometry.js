"use strict";

class Geometry {
	/**
	 * This class represents the geometry of a {@link module:Core.Mesh Mesh}. This includes information such
	 * as the position of vertices as well as methods to compute edge lengths, corner
	 * angles, face area, normals, discrete curvatures etc.
	 * @constructor module:Core.Geometry
	 * @param {module:Core.Mesh} mesh The mesh this class describes the geometry of.
	 * @param {module:LinearAlgebra.Vector[]} positions An array containing the position of each vertex in a mesh.
	 * @param {boolean} normalizePositions flag to indicate whether positions should be normalized. Default value is true.
	 * @property {module:Core.Mesh} mesh The mesh this class describes the geometry of.
	 * @property {Object} positions A dictionary mapping each vertex to a normalized position.
	 */
	constructor(mesh, positions, normalizePositions = true) {
		this.mesh = mesh;
		this.positions = {};
		for (let i = 0; i < positions.length; i++) {
			let v = this.mesh.vertices[i];
			let p = positions[i];

			this.positions[v] = p;
		}

		if (normalizePositions) {
			normalize(this.positions, mesh.vertices);
		}
	}

	/**
	 * Computes the vector along a halfedge.
	 * @method module:Core.Geometry#vector
	 * @param {module:Core.Halfedge} h The halfedge along which the vector needs to be computed.
	 * @returns {module:LinearAlgebra.Vector}
	 */
	vector(h) {
		let a = this.positions[h.vertex];
		let b = this.positions[h.next.vertex];

		return b.minus(a);
	}

	/**
	 * Computes the length of an edge.
	 * @method module:Core.Geometry#length
	 * @param {module:Core.Edge} e The edge whose length needs to be computed.
	 * @returns {number}
	 */
	length(e) {
		return this.vector(e.halfedge).norm();
	}

	/**
	 * Computes the midpoint of an edge.
	 * @method module:Core.Geometry#midpoint
	 * @param {module:Core.Edge} e The edge whose midpoint needs to be computed.
	 * @returns {number}
	 */
	midpoint(e) {
		let h = e.halfedge;
		let a = this.positions[h.vertex];
		let b = this.positions[h.twin.vertex];

		return (a.plus(b)).over(2);
	}

	/**
	 * Computes the mean edge length of all the edges in a mesh.
	 * @method module:Core.Geometry#meanEdgeLength
	 * @returns {number}
	 */
	meanEdgeLength() {
		let sum = 0;
		let edges = this.mesh.edges;
		for (let e of edges) {
			sum += this.length(e);
		}

		return sum / edges.length;
	}

	/**
	 * Computes the area of a face.
	 * @method module:Core.Geometry#area
	 * @param {module:Core.Face} f The face whose area needs to be computed.
	 * @returns {number}
	 */
	area(f) {
		if (f.isBoundaryLoop()) return 0.0;

		let u = this.vector(f.halfedge);
		let v = this.vector(f.halfedge.prev).negated();

		return 0.5 * u.cross(v).norm();
	}

	/**
	 * Computes the total surface area of a mesh.
	 * @method module:Core.Geometry#totalArea
	 * @returns {number}
	 */
	totalArea() {
		let sum = 0.0;
		for (let f of this.mesh.faces) {
			sum += this.area(f);
		}

		return sum;
	}

	/**
	 * Computes the normal of a face.
	 * @method module:Core.Geometry#faceNormal
	 * @param {module:Core.Face} f The face whose normal needs to be computed.
	 * @returns {module:LinearAlgebra.Vector}
	 */
	faceNormal(f) {
		if (f.isBoundaryLoop()) return undefined;

		let u = this.vector(f.halfedge);
		let v = this.vector(f.halfedge.prev).negated();

		return u.cross(v).unit();
	}

	/**
	 * Computes the centroid of a face.
	 * @method module:Core.Geometry#centroid
	 * @param {module:Core.Face} f The face whose centroid needs to be computed.
	 * @returns {module:LinearAlgebra.Vector}
	 */
	centroid(f) {
		let h = f.halfedge;
		let a = this.positions[h.vertex];
		let b = this.positions[h.next.vertex];
		let c = this.positions[h.prev.vertex];

		if (f.isBoundaryLoop()) return a.plus(b).over(2);

		return a.plus(b).plus(c).over(3);
	}

	/**
	 * Computes the circumcenter of a face.
	 * @method module:Core.Geometry#circumcenter
	 * @param {module:Core.Face} f The face whose circumcenter needs to be computed.
	 * @returns {module:LinearAlgebra.Vector}
	 */
	circumcenter(f) {
		let h = f.halfedge;
		let a = this.positions[h.vertex];
		let b = this.positions[h.next.vertex];
		let c = this.positions[h.prev.vertex];

		if (f.isBoundaryLoop()) return a.plus(b).over(2);

		let ac = c.minus(a);
		let ab = b.minus(a);
		let w = ab.cross(ac);

		let u = (w.cross(ab)).times(ac.norm2());
		let v = (ac.cross(w)).times(ab.norm2());
		let x = (u.plus(v)).over(2 * w.norm2());

		return x.plus(a);
	}

	/**
	 * Computes an orthonormal bases for a face.
	 * @method module:Core.Geometry#orthonormalBases
	 * @param {module:Core.Face} f The face on which the orthonormal bases needs to be computed.
	 * @returns {module:LinearAlgebra.Vector[]} An array containing two orthonormal vectors tangent to the face.
	 */
	orthonormalBases(f) {
		let e1 = this.vector(f.halfedge).unit();

		let normal = this.faceNormal(f);
		let e2 = normal.cross(e1);

		return [e1, e2];
	}

	/**
	 * Computes the angle (in radians) at a corner.
	 * @method module:Core.Geometry#angle
	 * @param {module:Core.Corner} c The corner at which the angle needs to be computed.
	 * @returns {number} The angle clamped between 0 and π.
	 */
	angle(c) {
		// TODO

		let h = c.halfedge;
		let v1 = this.vector(h.next.twin);
		let v2 = this.vector(h.next.next);

		let dot = v1.dot(v2);
		let cos = dot / (v1.norm() * v2.norm());
		let rad = Math.acos(cos);

		return rad; // placeholder
	}

	/**
	 * Computes the cotangent of the angle opposite to a halfedge.
	 * @method module:Core.Geometry#cotan
	 * @param {module:Core.Halfedge} h The halfedge opposite to the angle whose cotangent needs to be computed.
	 * @returns {number}
	 */
	cotan(h) {
		// TODO
		if (h.onBoundary) return 0.0;

		let u = this.vector(h.prev);
		let v = this.vector(h.next).negated();

		return u.dot(v) / u.cross(v).norm();
	}

	/**
	 * Computes the signed angle (in radians) between two adjacent faces.
	 * @method module:Core.Geometry#dihedralAngle
	 * @param {module:Core.Halfedge} h The halfedge (shared by the two adjacent faces) on which
	 * the dihedral angle is computed.
	 * @returns {number} The dihedral angle.
	 */
	dihedralAngle(h) {
		// TODO

		let f1 = h.face;
		let f2 = h.twin.face;

		let N1 = this.faceNormal(f1);
		let N2 = this.faceNormal(f2);
		
		let edge = this.vector(h);
		let cross = N1.cross(N2);

		let x = edge.dot(cross) / (edge.norm());
		let y = N1.dot(N2);

		return Math.atan2(x, y); // placeholder
	}

	/**
	 * Computes the barycentric dual area of a vertex.
	 * @method module:Core.Geometry#barycentricDualArea
	 * @param {module:Core.Vertex} v The vertex whose barycentric dual area needs to be computed.
	 * @returns {number}
	 */
	barycentricDualArea(v) {
		// TODO
		let area = 0.0;

		for (let f of v.adjacentFaces()) {
			area += this.area(f) / 3;
		}

		// return 0.0; // placeholder
		return area;
	}

	/**
	 * Computes the circumcentric dual area of a vertex.
	 * @see {@link http://www.cs.cmu.edu/~kmcrane/Projects/Other/TriangleAreasCheatSheet.pdf}
	 * @method module:Core.Geometry#circumcentricDualArea
	 * @param {module:Core.Vertex} v The vertex whose circumcentric dual area needs to be computed.
	 * @returns {number}
	 */
	circumcentricDualArea(v) {
		// TODO
		let area = 0.0;

		for (let c of v.adjacentCorners()) {
			let h = c.halfedge;
			let h1 = h.next;
			let h2 = h.next.next;

			let v1 = this.vector(h1);
			let v2 = this.vector(h2);

			area += v1.norm2() * this.cotan(h1);
			area += v2.norm2() * this.cotan(h2);
		}

		return area / 8; // placeholder
	}

	/**
	 * Computes the normal at a vertex using the "equally weighted" method.
	 * @method module:Core.Geometry#vertexNormalEquallyWeighted
	 * @param {module:Core.Vertex} v The vertex on which the normal needs to be computed.
	 * @returns {module:LinearAlgebra.Vector}
	 */
	vertexNormalEquallyWeighted(v) {
		let n = new Vector();
		for (let f of v.adjacentFaces()) {
			let normal = this.faceNormal(f);

			n.incrementBy(normal);
		}

		n.normalize();

		return n;
	}

	/**
	 * Computes the normal at a vertex using the "face area weights" method.
	 * @method module:Core.Geometry#vertexNormalAreaWeighted
	 * @param {module:Core.Vertex} v The vertex on which the normal needs to be computed.
	 * @returns {module:LinearAlgebra.Vector}
	 */
	vertexNormalAreaWeighted(v) {
		// TODO
		let n = new Vector();
		for (let f of v.adjacentFaces()) {
			let area = this.area(f);
			let normal = this.faceNormal(f).times(area);

			n.incrementBy(normal);
		}

		n.normalize();

		return n;
	}

	/**
	 * Computes the normal at a vertex using the "tip angle weights" method.
	 * @method module:Core.Geometry#vertexNormalAngleWeighted
	 * @param {module:Core.Vertex} v The vertex on which the normal needs to be computed.
	 * @returns {module:LinearAlgebra.Vector}
	 */
	vertexNormalAngleWeighted(v) {
		// TODO
		let n = new Vector();
		for (let c of v.adjacentCorners()) {
			let f = c.face;
			let angle = this.angle(c);
			let normal = this.faceNormal(f).times(angle);

			n.incrementBy(normal);
		}

		n.normalize();

		return n;
	}

	/**
	 * Computes the normal at a vertex using the "gauss curvature" method.
	 * @method module:Core.Geometry#vertexNormalGaussCurvature
	 * @param {module:Core.Vertex} v The vertex on which the normal needs to be computed.
	 * @returns {module:LinearAlgebra.Vector}
	 */
	vertexNormalGaussCurvature(v) {
		// TODO
		let K = new Vector();

		for (let h of v.adjacentHalfedges()) {
			let v = this.vector(h);
			let weight = 0.5 * this.dihedralAngle(h) / this.length(h.edge);

			K.incrementBy(v.times(weight));
		}

		K.normalize();

		return K; // placeholder
	}

	/**
	 * Computes the normal at a vertex using the "mean curvature" method (same as the "area gradient" method).
	 * @method module:Core.Geometry#vertexNormalMeanCurvature
	 * @param {module:Core.Vertex} v The vertex on which the normal needs to be computed.
	 * @returns {module:LinearAlgebra.Vector}
	 */
	vertexNormalMeanCurvature(v) {
		// TODO
		let H = new Vector();

		for (let h of v.adjacentHalfedges()) {
			let v = this.vector(h);
			let weight = 0.5 * (this.cotan(h) + this.cotan(h.twin));

			H.incrementBy(v.times(weight));
		}

		H.normalize();

		return H; // placeholder
	}

	/**
	 * Computes the normal at a vertex using the "inscribed sphere" method.
	 * @method module:Core.Geometry#vertexNormalSphereInscribed
	 * @param {module:Core.Vertex} v The vertex on which the normal needs to be computed.
	 * @returns {module:LinearAlgebra.Vector}
	 */
	vertexNormalSphereInscribed(v) {
		// TODO
		let n = new Vector();
		for (let c of v.adjacentCorners()) {
			let h = c.halfedge;
			let h1 = h.next.twin;
			let h2 = h.next.next;

			let v1 = this.vector(h1);
			let v2 = this.vector(h2);

			let cross = v2.cross(v1);
			let normal = cross.over(v1.norm2() * v2.norm2());

			n.incrementBy(normal);
		}

		n.normalize();

		return n;
	}

	/**
	 * Computes the angle defect at a vertex (= 2π minus the sum of incident angles
	 * at an interior vertex or π minus the sum of incident angles at a boundary vertex).
	 * @method module:Core.Geometry#angleDefect
	 * @param {module:Core.Vertex} v The vertex whose angle defect needs to be computed.
	 * @returns {number}
	 */
	angleDefect(v) {
		// TODO
		let angle = v.onBoundary() ?  Math.PI : 2 * Math.PI;

		for (let c of v.adjacentCorners()) {
			angle -= this.angle(c);
		}

		return angle; // placeholder
	}

	/**
	 * Computes the (integrated) scalar gauss curvature at a vertex.
	 * @method module:Core.Geometry#scalarGaussCurvature
	 * @param {module:Core.Vertex} v The vertex whose gauss curvature needs to be computed.
	 * @returns {number}
	 */
	scalarGaussCurvature(v) {
		return this.angleDefect(v);
	}

	/**
	 * Computes the (integrated) scalar mean curvature at a vertex.
	 * @method module:Core.Geometry#scalarMeanCurvature
	 * @param {module:Core.Vertex} v The vertex whose mean curvature needs to be computed.
	 * @returns {number}
	 */
	scalarMeanCurvature(v) {
		// TODO
		let H = 0.0;

		for (let h of v.adjacentHalfedges()) {
			let v = this.vector(h);
			H += v.norm() * this.dihedralAngle(h);
		}

		return 0.5*H; // placeholder
	}

	/**
	 * Computes the total angle defect (= 2π times the euler characteristic of the mesh).
	 * @method module:Core.Geometry#totalAngleDefect
	 * @returns {number}
	 */
	totalAngleDefect() {
		let totalDefect = 0.0;
		for (let v of this.mesh.vertices) {
			totalDefect += this.angleDefect(v);
		}

		return totalDefect;
	}

	/**
	 * Computes the (pointwise) minimum and maximum principal curvature values at a vertex.
	 * @method module:Core.Geometry#principalCurvatures
	 * @param {module:Core.Vertex} v The vertex on which the principal curvatures need to be computed.
	 * @returns {number[]} An array containing the minimum and maximum principal curvature values at a vertex.
	 */
	principalCurvatures(v) {
		// TODO
		let A = this.circumcentricDualArea(v);
		let H = this.scalarMeanCurvature(v) / A;
		let K = this.scalarGaussCurvature(v) / A;

		let delta = Math.sqrt(H * H - K);

		return [H-delta, H+delta]; // placeholder
	}

	/**
	 * Builds a sparse laplace matrix. The laplace operator is negative semidefinite;
	 * instead we build a positive definite matrix by multiplying the entries of the
	 * laplace matrix by -1 and shifting the diagonal elements by a small constant (e.g. 1e-8).
	 * @method module:Core.Geometry#laplaceMatrix
	 * @param {Object} vertexIndex A dictionary mapping each vertex of a mesh to a unique index.
	 * @returns {module:LinearAlgebra.SparseMatrix}
	 */
	laplaceMatrix(vertexIndex) {
		// TODO
		let V = this.mesh.vertices.length;
		let L = new Triplet(V, V);

		for (let v of this.mesh.vertices) {
			let i = vertexIndex[v];
			let sum = 1e-8;

			for (let h of v.adjacentHalfedges()) {
				let j = vertexIndex[h.twin.vertex];
				let cot = 0.5 * (this.cotan(h) + this.cotan(h.twin));
				sum += cot;

				L.addEntry(-cot, i, j)
			}

			L.addEntry(sum, i, i);
		}

		return SparseMatrix.fromTriplet(L); // placeholder
	}

	/**
	 * Builds a sparse diagonal mass matrix containing the barycentric dual area of each vertex
	 * of a mesh.
	 * @method module:Core.Geometry#massMatrix
	 * @param {Object} vertexIndex A dictionary mapping each vertex of a mesh to a unique index.
	 * @returns {module:LinearAlgebra.SparseMatrix}
	 */
	massMatrix(vertexIndex) {
		// TODO
		let V = this.mesh.vertices.length;
		let M = new Triplet(V, V);

		for (let v of this.mesh.vertices) {
			let i = vertexIndex[v];

			M.addEntry(this.barycentricDualArea(v), i, i);
		}

		return SparseMatrix.fromTriplet(M); // placeholder
	}

	/**
	 * Builds a sparse complex laplace matrix. The laplace operator is negative semidefinite;
	 * instead we build a positive definite matrix by multiplying the entries of the
	 * laplace matrix by -1 and shifting the diagonal elements by a small constant (e.g. 1e-8).
	 * @method module:Core.Geometry#complexLaplaceMatrix
	 * @param {Object} vertexIndex A dictionary mapping each vertex of a mesh to a unique index.
	 * @returns {module:LinearAlgebra.ComplexSparseMatrix}
	 */
	complexLaplaceMatrix(vertexIndex) {
		// TODO
		let V = this.mesh.vertices.length;
		let L = new ComplexTriplet(V, V);

		for (let v of this.mesh.vertices) {
			let i = vertexIndex[v];
			let sum = 1e-8;

			for (let h of v.adjacentHalfedges()) {
				let j = vertexIndex[h.twin.vertex];
				let cot = 0.5 * (this.cotan(h) + this.cotan(h.twin));
				sum += cot;

				L.addEntry(new Complex(-cot, 0.0), i, j)
			}

			L.addEntry(new Complex(sum, 0.0), i, i);
		}

		return ComplexSparseMatrix.fromTriplet(L); // placeholder
	}
}

/**
 * Centers a mesh about the origin and rescales it to unit radius.
 * @global
 * @function module:Core.normalize
 * @param {module:LinearAlgebra.Vector[]} positions The position of each vertex in the vertices array.
 * @param {module:Core.Vertex[]} vertices The vertices of a mesh.
 * @param {boolean} rescale A flag indicating whether mesh positions should be scaled to a unit radius.
 */
function normalize(positions, vertices, rescale = true) {
	// compute center of mass
	let N = vertices.length;
	let cm = new Vector();
	for (let v of vertices) {
		let p = positions[v];

		cm.incrementBy(p);
	}
	cm.divideBy(N);

	// translate to origin and determine radius
	let radius = -1;
	for (let v of vertices) {
		let p = positions[v];

		p.decrementBy(cm);
		radius = Math.max(radius, p.norm());
	}

	// rescale to unit radius
	if (rescale) {
		for (let v of vertices) {
			let p = positions[v];

			p.divideBy(radius);
		}
	}
}