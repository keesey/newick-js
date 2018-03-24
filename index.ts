export type Arc = [Vertex, Vertex, number];
export type Graph = [Set<Vertex>, Set<Arc>];
export interface ParseResult {
	graph: Graph;
	root: Vertex;
}
export interface Vertex {
	label?: string;
}
export function parse(s: string): ParseResult {
	if (typeof s !== "string") {
		throw new Error(`Not a string: ${s}`);
	}
	s = s.trim();
	const minLength = /;$/.test(s) ? 2 : 1;
	if (s.length < minLength) {
		throw new Error(`Not long enough to be a Newick string: "${s}".`);
	}
	const graph: Graph = [new Set<Vertex>(), new Set<Arc>()];
	const root = readVertex(new CharBuffer(s), graph);
	return {
		graph,
		root,
	};
}
export function write(graph: Graph): string {
	return `${writeVertex(findRoot(graph), NaN, graph, new Set<Vertex>())};`;
}
class CharBuffer {
	constructor(readonly string = "") {
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
	public pos = 0;
	readonly length: number;
}
function findRoot(graph: Graph): Vertex {
	const candidates = new Set<Vertex>(graph[0]);
	graph[1].forEach(arc => candidates.delete(arc[1]));
	if (candidates.size > 1) {
		throw new Error("Cannot determine root.");
	}
	for (let member of candidates) {
		return member;
	}
	throw new Error("No root element found.");
}
function findVertexWithLabel(label: string, vertices: Set<Vertex>) {
	for (let vertex of vertices) {
		if (vertex.label === label) {
			return vertex;
		}
	}
	return null;
}
function readVertex(buffer: CharBuffer, graph: Graph): Vertex {
	let token: string;
	do {
		token = buffer.read();
	}
	while (/\s/.test(token));
	const children: Vertex[] = [];
	const weights: number[] = [];
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
		}
		while (true);
	}
	else {
		buffer.back();
	}
	const vertex: Vertex = readVertexLabel(buffer, graph[0]);
	if (!children.length) {

	}
	graph[0].add(vertex);
	while (children.length) {
		graph[1].add([
			vertex,
			children.pop() as Vertex,
			weights.pop() as number,
		]);
	}
	return vertex;
}
function readVertexLabel(buffer: CharBuffer, vertices: Set<Vertex>): Vertex {
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
	return findVertexWithLabel(label, vertices) || { label };
}
function readWeight(buffer: CharBuffer): number {
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
function writeVertex(vertex: Vertex, weight: number, graph: Graph, visited: Set<Vertex>): string {
	const parts = new Array(1);
	parts[0] = vertex.label || "";
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
	const outgoing = new Set<Arc>();
	for (let arc of graph[1]) {
		if (arc[0] === vertex) {
			outgoing.add(arc);
		}
	}
	if (!outgoing.size) {
		return vertexString;
	}
	const children = Array.from(outgoing.values())
		.map(arc => writeVertex(arc[1], arc[2], graph, visited))
		.sort();
	return `(${children.join(",")})${vertexString}`;
}