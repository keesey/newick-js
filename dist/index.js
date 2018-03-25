"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function parse(s) {
    if (typeof s !== "string") {
        throw new Error(`Not a string: ${s}`);
    }
    const minLength = /;$/.test(s) ? 2 : 1;
    if (s.length < minLength) {
        throw new Error(`Not long enough to be a Newick string: "${s}".`);
    }
    const graph = [new Set(), new Set()];
    const buffer = new CharBuffer(s);
    const root = readVertex(buffer, graph);
    return {
        graph,
        root,
        rootWeight: readRootWeight(buffer),
    };
}
exports.parse = parse;
function write(graph) {
    if (!Array.isArray(graph)) {
        throw new Error(`Not an array: ${String(graph) || "<empty>"}`);
    }
    if (graph.length < 2 || graph.slice(0, 2).some(element => !(element instanceof Set))) {
        throw new Error(`Not a graph: [${graph.join(", ")}]`);
    }
    if (Array.from(graph[0]).some(vertex => typeof vertex !== "object")) {
        throw new Error("Invalid vertex set.");
    }
    if (Array.from(graph[1]).some(arc => !Array.isArray(arc) || arc.length < 3 || typeof arc[0] !== "object" || typeof arc[1] !== "object" || typeof arc[2] !== "number")) {
        throw new Error("Invalid arc set.");
    }
    return new GraphWriter(graph).write();
}
exports.write = write;
class CharBuffer {
    constructor(string = "") {
        this.string = string;
        this.pos = 0;
        this.length = this.string.length;
    }
    get rest() {
        if (this.atEnd()) {
            throw new Error("End of buffer reached.");
        }
        return this.string.substr(this.pos);
    }
    atEnd() {
        return this.pos >= this.length;
    }
    back() {
        if (this.pos <= 0) {
            throw new Error("At start of buffer.");
        }
        this.pos--;
    }
    read() {
        if (this.atEnd()) {
            throw new Error("End of buffer reached.");
        }
        return this.string.charAt(this.pos++);
    }
}
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
function findVertexWithLabel(label, vertices) {
    for (let vertex of vertices) {
        if (vertex.label === label) {
            return vertex;
        }
    }
    return null;
}
function readRootWeight(buffer) {
    if (!buffer.atEnd()) {
        if (buffer.read() === ":") {
            const weight = readWeight(buffer);
            if (buffer.atEnd()) {
                return weight;
            }
        }
        else {
            buffer.back();
        }
        throw new Error(`Extra content beyond end of Newick tree: "${buffer.rest}".`);
    }
    return NaN;
}
function readVertex(buffer, graph) {
    let token;
    do {
        token = buffer.read();
    } while (/\s/.test(token));
    const children = [];
    const weights = [];
    if (token === "(") {
        do {
            children.push(readVertex(buffer, graph));
            token = buffer.read();
            if (token === ":") {
                weights.push(readWeight(buffer));
                token = buffer.read();
            }
            else {
                weights.push(NaN);
            }
            if (token === ")") {
                break;
            }
            if (token != ",") {
                throw new Error(`Unexpected character "${token}" in Newick tree string at position ${buffer.pos - 1}.`);
            }
        } while (true);
    }
    else {
        buffer.back();
    }
    const vertex = readVertexLabel(buffer, graph[0]);
    graph[0].add(vertex);
    while (children.length) {
        graph[1].add([
            vertex,
            children.pop(),
            weights.pop(),
        ]);
    }
    return vertex;
}
function readVertexLabel(buffer, vertices) {
    let label = "";
    let quoted = false;
    while (!buffer.atEnd()) {
        const token = buffer.read();
        if (token === "'") {
            if (!quoted && label.length > 0) {
                label += token;
            }
            quoted = !quoted;
        }
        else if (quoted) {
            label += token;
        }
        else {
            if (token === ")" || token === "," || token === ":" || token === "(") {
                buffer.back();
                break;
            }
            if (label.length !== 0 || !(/\s/.test(token))) {
                label += token;
            }
        }
    }
    if (label.length === 0) {
        return {};
    }
    label = label
        .trim()
        .replace(/;$/, "")
        .replace(/\s+$/, "")
        .replace(/\s/g, " ");
    if (label.length === 0) {
        return {};
    }
    return findVertexWithLabel(label, vertices) || { label };
}
function readWeight(buffer) {
    let s = "";
    while (!buffer.atEnd()) {
        const token = buffer.read();
        if (token === ")" || token === ",") {
            buffer.back();
            break;
        }
        s += token;
    }
    return parseFloat(s);
}
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
