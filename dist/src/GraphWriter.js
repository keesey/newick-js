"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class GraphWriter {
    constructor(graph) {
        this.graph = graph;
        this.outgoing = new Map();
        this.sortMap = new Map();
        const rootCandidates = new Set(graph[0]);
        for (let vertex of graph[0]) {
            this.outgoing.set(vertex, new Set());
        }
        for (let arc of graph[1]) {
            rootCandidates.delete(arc[1]);
            this.outgoing.get(arc[0])
                .add(arc.slice(1, 3));
        }
        if (rootCandidates.size !== 1) {
            throw new Error("Cannot determine root.");
        }
        this.root = Array.from(rootCandidates)[0];
    }
    write() {
        return `${this.writeVertex(this.root, new Set())};`;
    }
    compareVertices(a, b) {
        if (a === b) {
            return 0;
        }
        const aSort = this.getSortCached(a);
        const bSort = this.getSortCached(b);
        return aSort < bSort ? -1 : (aSort > bSort ? 1 : 0);
    }
    getSort(vertex) {
        if (vertex.label) {
            return vertex.label;
        }
        const children = Array
            .from(this.outgoing.get(vertex))
            .map(([vertex]) => this.getSortCached(vertex))
            .sort()
            .join(",");
        return `(${children})`;
    }
    getSortCached(vertex) {
        if (this.sortMap.has(vertex)) {
            return this.sortMap.get(vertex);
        }
        const sort = this.getSort(vertex);
        this.sortMap.set(vertex, sort);
        return sort;
    }
    writeVertex(vertex, visited, weight = NaN) {
        let vertexString = writeLabel(vertex.label);
        if (!isNaN(weight)) {
            vertexString += `:${weight}`;
        }
        if (vertex.label) {
            if (visited.has(vertex)) {
                return vertexString;
            }
            visited.add(vertex);
        }
        return this.writeWithOutgoing(vertex, vertexString, visited);
    }
    writeWithOutgoing(vertex, vertexString, visited) {
        const outgoing = this.outgoing.get(vertex);
        if (!outgoing.size) {
            return vertexString;
        }
        const children = Array.from(outgoing)
            .sort((a, b) => this.compareVertices(a[0], b[0]))
            .map(([child, weight]) => this.writeVertex(child, visited, weight));
        return `(${children.join(",")})${vertexString}`;
    }
}
exports.default = GraphWriter;
function writeLabel(label) {
    if (!label) {
        return "";
    }
    if (/'/.test(label)) {
        throw new Error("Vertex labels cannot contain apostrophes (').");
    }
    if (/[(),:]/.test(label)) {
        return `'${label}'`;
    }
    return label;
}
