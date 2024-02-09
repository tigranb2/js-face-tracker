
// Function to get the edges of a triangle given its index.
// Input: Triangle index (integer).
// Output: Array of three integers representing edge indices.
function edgesOfTriangle(t) { return [3 * t, 3 * t + 1, 3 * t + 2]; }


// Function to find the triangle that a given edge belongs to.
// Input: Edge index (integer).
// Output: Triangle index (integer).
function triangleOfEdge(e)  { return Math.floor(e / 3); }


// Function to find the next/previous halfedge in the sequence.
// Input: Edge index (integer).
// Output: Next edge index in the sequence (integer).
function nextHalfedge(e) { return (e % 3 === 2) ? e - 2 : e + 1; }
function prevHalfedge(e) { return (e % 3 === 0) ? e + 2 : e - 1; }


// Iterates over each edge of the triangles and applies a callback function.
// Inputs: 
// - points: Array of points (each point is an array of two numbers [x, y]).
// - delaunay: Object containing 'triangles' and 'halfedges' arrays.
// - callback: Function to apply to each edge.
function forEachTriangleEdge(points, delaunay, callback) {
    for (let e = 0; e < delaunay.triangles.length; e++) {
        if (e > delaunay.halfedges[e]) {
            const p = points[delaunay.triangles[e]];
            const q = points[delaunay.triangles[nextHalfedge(e)]];
            callback(e, p, q);
        }
    }
}
    
// Function to get the point indices of a triangle.
// Input: 
// - delaunay: Object containing 'triangles' array.
// - t: Triangle index (integer).
// Output: Array of three integers representing point indices of the triangle vertices.
function pointsOfTriangle(delaunay, t) {
    return edgesOfTriangle(t)
        .map(e => delaunay.triangles[e]);
}

// Iterates over each triangle and applies a callback function.
// Inputs: 
// - points: Array of points (each point is an array of two numbers [x, y]).
// - delaunay: Object containing 'triangles' array.
// - callback: Function to apply to each triangle.
function forEachTriangle(points, delaunay, callback) {
    for (let t = 0; t < delaunay.triangles.length / 3; t++) {
        callback(t, pointsOfTriangle(delaunay, t).map(p => points[p]));
    }
}
    
// Function to find triangles adjacent to a given triangle.
// Input: 
// - delaunay: Object containing 'triangles' and 'halfedges' arrays.
// - t: Triangle index (integer).
// Output: Array of integers representing indices of adjacent triangles.
function trianglesAdjacentToTriangle(delaunay, t) {
    const adjacentTriangles = [];
    for (const e of edgesOfTriangle(t)) {
        const opposite = delaunay.halfedges[e];
        if (opposite >= 0) {
            adjacentTriangles.push(triangleOfEdge(opposite));
        }
    }
    return adjacentTriangles;
}

// Function to calculate the circumcenter of a triangle.
// Inputs: Three points (each is an array of two numbers [x, y]).
// Output: Array of two numbers representing the circumcenter coordinates.
function circumcenter(a, b, c) {
    const ad = a[0] * a[0] + a[1] * a[1];
    const bd = b[0] * b[0] + b[1] * b[1];
    const cd = c[0] * c[0] + c[1] * c[1];
    const D = 2 * (a[0] * (b[1] - c[1]) + b[0] * (c[1] - a[1]) + c[0] * (a[1] - b[1]));
    return [
        1 / D * (ad * (b[1] - c[1]) + bd * (c[1] - a[1]) + cd * (a[1] - b[1])),
        1 / D * (ad * (c[0] - b[0]) + bd * (a[0] - c[0]) + cd * (b[0] - a[0])),
    ];
}
    
// Function to find the center of a triangle given its index.
// Inputs: 
// - points: Array of points (each point is an array of two numbers [x, y]).
// - delaunay: Object containing 'triangles' array.
// - t: Triangle index (integer).
// Output: Array of two numbers representing the center coordinates.
function triangleCenter(points, delaunay, t) {
    const vertices = pointsOfTriangle(delaunay, t).map(p => points[p]);
    return circumcenter(vertices[0], vertices[1], vertices[2]);
}

// Iterates over Voronoi edges and applies a callback function.
// Inputs: 
// - points: Array of points (each point is an array of two numbers [x, y]).
// - delaunay: Object containing 'triangles' and 'halfedges' arrays.
// - callback: Function to apply to each Voronoi edge.
function forEachVoronoiEdge(points, delaunay, callback) {
    for (let e = 0; e < delaunay.triangles.length; e++) {
        if (e < delaunay.halfedges[e]) {
            const p = triangleCenter(points, delaunay, triangleOfEdge(e));
            const q = triangleCenter(points, delaunay, triangleOfEdge(delaunay.halfedges[e]));
            callback(e, p, q);
        }
    }
}

// Function to get edges around a given point.
// Inputs: 
// - delaunay: Object containing 'triangles' and 'halfedges' arrays.
// - start: Starting edge index (integer).
// Output: Array of integers representing edge indices around the point.
function edgesAroundPoint(delaunay, start) {
    const result = [];
    let incoming = start;
    do {
        result.push(incoming);
        const outgoing = nextHalfedge(incoming);
        incoming = delaunay.halfedges[outgoing];
    } while (incoming !== -1 && incoming !== start);
    return result;
}
    
// Iterates over Voronoi cells and applies a callback function.
// Inputs: 
// - points: Array of points (each point is an array of two numbers [x, y]).
// - delaunay: Object containing 'triangles' and 'halfedges' arrays.
// - callback: Function to apply to each Voronoi cell.
function forEachVoronoiCell(points, delaunay, callback) {
    const seen = new Set();  // of point ids
    for (let e = 0; e < delaunay.triangles.length; e++) {
        const p = delaunay.triangles[nextHalfedge(e)];
        if (!seen.has(p)) {
            seen.add(p);
            const edges = edgesAroundPoint(delaunay, e);
            const triangles = edges.map(triangleOfEdge);
            const vertices = triangles.map(t => triangleCenter(points, delaunay, t));
            callback(p, vertices);
        }
    }
}