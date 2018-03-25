"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function parse(s) {
    if (typeof s !== "string") {
        throw new Error(`Not a string: ${s}`);
    }
    s = s.trim();
    const minLength = /;$/.test(s) ? 2 : 1;
    if (s.length < minLength) {
        throw new Error(`Not long enough to be a Newick string: "${s}".`);
    }
    const graph = [new Set(), new Set()];
    const root = readVertex(new CharBuffer(s), graph);
    return {
        graph,
        root,
    };
}
exports.parse = parse;
function write(graph) {
    return new GraphWriter(graph).write();
}
exports.write = write;
class CharBuffer {
    constructor(string = "") {
        this.string = string;
        this.pos = 0;
        this.length = this.string.length;
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
            if (label.length !== 0 || !(/^\s$/.test(token))) {
                label += token;
            }
        }
    }
    if (label.length === 0) {
        return {};
    }
    label = label
        .replace(/;$/, '')
        .replace(/^\s+/, '')
        .replace(/\s+$/, '')
        .replace(/\s\s+/g, ' ');
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
