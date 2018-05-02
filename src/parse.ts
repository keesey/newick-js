import { Arc } from "./Arc";
import CharBuffer from "./CharBuffer";
import { Graph } from "./Graph";
import { Vertex } from "./Vertex";
export interface ParseResult {
	graph: Graph;
	root: Vertex;
	rootWeight: number;
}
export function parse(s: string): ParseResult {
	if (typeof s !== "string") {
		throw new Error(`Not a string: ${s}`);
	}
	const minLength = /;$/.test(s) ? 2 : 1;
	if (s.length < minLength) {
		throw new Error(`Not long enough to be a Newick string: "${s}".`);
    }
    const vertices = new Set<Vertex>();
    const arcs = new Set<Arc>();
	const buffer = new CharBuffer(s);
	const root = readVertex(buffer, vertices, arcs);
	return {
		"graph": [vertices, arcs],
		root,
		rootWeight: readRootWeight(buffer),
	};
}
const END_TOKENS: Record<string, true> = {
    ")": true,
    ",": true,
    ":": true,
    "(": true,
};
function readRootWeight(buffer: CharBuffer): number {
	if (!buffer.atEnd()) {
		if (buffer.read() === ":") {
			const weight = readWeight(buffer);
			if (buffer.atEnd()) {
				return weight;
			}
		} else {
			buffer.back();
		}
		throw new Error(`Extra content beyond end of Newick tree: "${buffer.rest()}".`);
	}
	return NaN;
}
function addChildArcs(arcs: Set<Arc>, vertex: Vertex, children: Array<[Vertex, number]>): void {
    let child: [Vertex, number] | undefined;
	while (child = children.pop()) {
		arcs.add([vertex, child[0], child[1]]);
	}
}
function readFirstNonSpaceToken(buffer: CharBuffer): string {
	let token: string;
	do {
		token = buffer.read();
	}
	while (/\s/.test(token));
	return token;
}
function readVertexChildren(buffer: CharBuffer, vertices: Set<Vertex>, arcs: Set<Arc>): Array<[Vertex, number]> {
    let token = readFirstNonSpaceToken(buffer);
	const children = new Array<[Vertex, number]>();
	if (token === "(") {
		do {
            const vertex = readVertex(buffer, vertices, arcs);
            let weight = NaN;
			token = buffer.read();
			if (token === ":") {
				weight = readWeight(buffer);
            }
            children.push([vertex, weight]);
			if (token === ")") {
				break;
			}
			if (token !== ",") {
				throw new Error(`Unexpected character "${token}" in Newick tree string at position ${buffer.pos - 1}.`);
			}
		}
		while (true);
	} else {
		buffer.back();
    }
    return children;
}
function readVertex(buffer: CharBuffer, vertices: Set<Vertex>, arcs: Set<Arc>): Vertex {
    const children = readVertexChildren(buffer, vertices, arcs);
	const vertex = readVertexFromLabel(buffer, vertices);
	vertices.add(vertex);
	addChildArcs(arcs, vertex, children);
	return vertex;
}
function normalizeVertexLabel(label: string): string {
	return label
		.replace(/;\s*$/, "")
		.trim()
		.replace(/\s+/g, " ");
}
function findVertexWithLabel(label: string, vertices: ReadonlySet<Vertex>) {
	for (let vertex of vertices) {
		if (vertex.label === label) {
			return vertex;
		}
	}
	return null;
}
function getVertexForLabel(label: string, vertices: Set<Vertex>): Vertex {
	if (label.length === 0) {
		return {};
	}
	return findVertexWithLabel(label, vertices) || { label };
}
function readVertexLabel(buffer: CharBuffer, vertices: Set<Vertex>): string {
	let label = "";
	let quoted = false;
	while (!buffer.atEnd()) {
		const token = buffer.read();
		if (token === "'") {
			if (!quoted && label.length) {
				label += token;
			}
			quoted = !quoted;
		} else if (quoted) {
			label += token;
		} else if (END_TOKENS[token]) {
            buffer.back();
            break;
        } else if (label.length || !(/\s/.test(token))) {
            label += token;
		}
	}
	return label;
}
function readVertexFromLabel(buffer: CharBuffer, vertices: Set<Vertex>): Vertex {
	return getVertexForLabel(
		normalizeVertexLabel(readVertexLabel(buffer, vertices)),
		vertices,
	);
}
function readWeight(buffer: CharBuffer): number {
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
