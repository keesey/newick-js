"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CharBuffer_1 = require("./CharBuffer");
function parse(s) {
    if (typeof s !== "string") {
        throw new Error(`Not a string: ${s}`);
    }
    const minLength = /;$/.test(s) ? 2 : 1;
    if (s.length < minLength) {
        throw new Error(`Not long enough to be a Newick string: "${s}".`);
    }
    const vertices = new Set();
    const arcs = new Set();
    const buffer = new CharBuffer_1.default(s);
    const root = readVertex(buffer, vertices, arcs);
    return {
        "graph": [vertices, arcs],
        root,
        rootWeight: readRootWeight(buffer),
    };
}
exports.parse = parse;
const END_TOKENS = {
    ")": true,
    ",": true,
    ":": true,
    "(": true,
};
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
        throw new Error(`Extra content beyond end of Newick tree: "${buffer.rest()}".`);
    }
    return NaN;
}
function addChildArcs(arcs, vertex, children) {
    let child;
    while (child = children.pop()) {
        arcs.add([vertex, child[0], child[1]]);
    }
}
function readFirstNonSpaceToken(buffer) {
    let token;
    do {
        token = buffer.read();
    } while (/\s/.test(token));
    return token;
}
function readVertexChildren(buffer, vertices, arcs) {
    let token = readFirstNonSpaceToken(buffer);
    const children = new Array();
    if (token === "(") {
        do {
            const vertex = readVertex(buffer, vertices, arcs);
            let weight = NaN;
            token = buffer.read();
            if (token === ":") {
                weight = readWeight(buffer);
                token = buffer.read();
            }
            children.push([vertex, weight]);
            if (token === ")") {
                break;
            }
            if (token !== ",") {
                throw new Error(`Unexpected character "${token}" in Newick tree string at position ${buffer.pos - 1}.`);
            }
        } while (true);
    }
    else {
        buffer.back();
    }
    return children;
}
function readVertex(buffer, vertices, arcs) {
    const children = readVertexChildren(buffer, vertices, arcs);
    const vertex = readVertexFromLabel(buffer, vertices);
    vertices.add(vertex);
    addChildArcs(arcs, vertex, children);
    return vertex;
}
function normalizeVertexLabel(label) {
    return label
        .replace(/;\s*$/, "")
        .trim()
        .replace(/\s+/g, " ");
}
function findVertexWithLabel(label, vertices) {
    for (let vertex of vertices) {
        if (vertex.label === label) {
            return vertex;
        }
    }
    return null;
}
function getVertexForLabel(label, vertices) {
    if (label.length === 0) {
        return {};
    }
    return findVertexWithLabel(label, vertices) || { label };
}
function readVertexLabel(buffer) {
    let label = "";
    let quoted = false;
    while (!buffer.atEnd()) {
        const token = buffer.read();
        if (token === "'") {
            if (!quoted && label.length) {
                label += token;
            }
            quoted = !quoted;
        }
        else if (quoted) {
            label += token;
        }
        else if (END_TOKENS[token]) {
            buffer.back();
            break;
        }
        else if (label.length || !(/\s/.test(token))) {
            label += token;
        }
    }
    return label;
}
function readVertexFromLabel(buffer, vertices) {
    return getVertexForLabel(normalizeVertexLabel(readVertexLabel(buffer)), vertices);
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
