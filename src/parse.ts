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
function addVertexWithChildren(vertices: Set<Vertex>, arcs: Set<Arc>, vertex: Vertex, children: Vertex[], weights: number[]): void {
	vertices.add(vertex);
	while (children.length) {
		arcs.add([
			vertex,
			children.pop() as Vertex,
			weights.pop() as number,
		]);
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
function readVertex(buffer: CharBuffer, vertices: Set<Vertex>, arcs: Set<Arc>): Vertex {
	let token = readFirstNonSpaceToken(buffer);
	const children: Vertex[] = [];
	const weights: number[] = [];
	if (token === "(") {
		do {
			children.push(readVertex(buffer, vertices, arcs));
			token = buffer.read();
			if (token === ":") {
				weights.push(readWeight(buffer));
				token = buffer.read();
			} else {
				weights.push(NaN);
			}
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
	const vertex = readVertexFromLabel(buffer, vertices);
	addVertexWithChildren(vertices, arcs, vertex, children, weights);
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
			if (!quoted && label.length > 0) {
				label += token;
			}
			quoted = !quoted;
		} else if (quoted) {
			label += token;
		} else {
			if (token === ")" || token === "," || token === ":" || token === "(") {
				buffer.back();
				break;
			}
			if (label.length !== 0 || !(/\s/.test(token))) {
				label += token;
			}
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
