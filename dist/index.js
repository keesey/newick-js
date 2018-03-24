"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function parse(s) {
    if (typeof s !== "string") {
        throw new Error(`Not a string: ${s}`);
    }
    if (s.length < 2) {
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
    const vertex = readVertexLabel(buffer);
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
function readVertexLabel(buffer) {
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
        else if (!quoted) {
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
    return { label };
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
