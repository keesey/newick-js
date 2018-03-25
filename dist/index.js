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
    return `${writeVertex(findRoot(graph), NaN, graph, new Set(), graphToChildrenMap(graph))};`;
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
function compareVertices(a, b, childrenMap) {
    if (a === b) {
        return 0;
    }
    const aSort = getVertexSortLabel(a, childrenMap);
    const bSort = getVertexSortLabel(b, childrenMap);
    return aSort < bSort ? -1 : aSort > bSort ? 1 : 0;
}
function findRoot(graph) {
    const candidates = new Set(graph[0]);
    graph[1].forEach(arc => candidates.delete(arc[1]));
    if (candidates.size > 1) {
        throw new Error("Cannot determine root.");
    }
    for (let member of candidates) {
        return member;
    }
    throw new Error("No root element found.");
}
function findVertexWithLabel(label, vertices) {
    for (let vertex of vertices) {
        if (vertex.label === label) {
            return vertex;
        }
    }
    return null;
}
function getVertexSortLabel(vertex, childrenMap) {
    if (vertex.label) {
        return vertex.label;
    }
    const children = Array
        .from(childrenMap.get(vertex))
        .map(child => getVertexSortLabel(child, childrenMap))
        .sort()
        .join(",");
    return `(${children})`;
}
function graphToChildrenMap(graph) {
    const children = new Map();
    for (let vertex of graph[0]) {
        children.set(vertex, new Set());
    }
    for (let arc of graph[1]) {
        children.get(arc[0]).add(arc[1]);
    }
    return children;
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
    if (!children.length) {
    }
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
    let s = '';
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
function writeVertex(vertex, weight, graph, visited, childrenMap) {
    const parts = new Array(1);
    parts[0] = writeLabel(vertex.label);
    if (!isNaN(weight)) {
        parts.push(weight);
    }
    const vertexString = parts.join(":");
    if (vertex.label) {
        if (visited.has(vertex)) {
            return vertexString;
        }
        visited.add(vertex);
    }
    const outgoing = new Set();
    for (let arc of graph[1]) {
        if (arc[0] === vertex) {
            outgoing.add(arc);
        }
    }
    if (!outgoing.size) {
        return vertexString;
    }
    const children = Array.from(outgoing.values())
        .sort((a, b) => compareVertices(a[1], b[1], childrenMap))
        .map(arc => writeVertex(arc[1], arc[2], graph, visited, childrenMap));
    return `(${children.join(",")})${vertexString}`;
}
