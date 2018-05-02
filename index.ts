export type Arc = [Vertex, Vertex, number];
export type Graph = [Set<Vertex>, Set<Arc>];
export interface ParseResult {
	graph: Graph;
	root: Vertex;
	rootWeight: number;
}
export interface Vertex {
	label?: string;
}
export function parse(s: string): ParseResult {
	if (typeof s !== "string") {
		throw new Error(`Not a string: ${s}`);
	}
	const minLength = /;$/.test(s) ? 2 : 1;
	if (s.length < minLength) {
		throw new Error(`Not long enough to be a Newick string: "${s}".`);
	}
	const graph: Graph = [new Set<Vertex>(), new Set<Arc>()];
	const buffer = new CharBuffer(s);
	const root = readVertex(buffer, graph);
	return {
		graph,
		root,
		rootWeight: readRootWeight(buffer),
	};
}
function checkArray(graph: Graph): void {
	if (!Array.isArray(graph)) {
		throw new Error(`Not an array: ${String(graph) || "<empty>"}`);
	}
}
function checkGraph(graph: Graph): void {
	if (graph.length < 2 || graph.slice(0, 2).some(element => !(element instanceof Set))) {
		throw new Error(`Not a graph: [${graph.join(", ")}]`);
	}
}
function checkVertexSet(graph: Graph): void {
	if (Array.from(graph[0]).some(vertex => typeof vertex !== "object")) {
		throw new Error("Invalid vertex set.");
	}
}
function checkArcSet(graph: Graph): void {
	if (Array.from(graph[1]).some(arc => !Array.isArray(arc) || arc.length < 3 || typeof arc[0] !== "object" || typeof arc[1] !== "object" || typeof arc[2] !== "number")) {
		throw new Error("Invalid arc set.");
	}
}
export function write(graph: Graph): string {
	checkArray(graph);
	checkGraph(graph);
	checkVertexSet(graph);
	checkArcSet(graph);
	return new GraphWriter(graph).write();
}
class CharBuffer {
	constructor(private readonly string = "") {
		this.length = this.string.length;
	}
	public atEnd() {
		return this.pos >= this.length;
	}
	public back() {
		if (this.pos <= 0) {
			throw new Error("At start of buffer.");
		}
		this.pos--;
	}
	public read() {
		this.checkAtEnd();
		return this.string.charAt(this.pos++);
	}
	public rest() {
		this.checkAtEnd();
		return this.string.substr(this.pos);
	}
	public pos = 0;
	private readonly length: number;
	private checkAtEnd() {
		if (this.atEnd()) {
			throw new Error("End of buffer reached.");
		}
	}
}
class GraphWriter {
	constructor(private readonly graph: Graph) {
		const rootCandidates = new Set<Vertex>(graph[0]);
		for (let vertex of graph[0]) {
			this.outgoing.set(vertex, new Set<[Vertex, number]>());
		}
		for (let arc of graph[1]) {
			rootCandidates.delete(arc[1]);
			(this.outgoing.get(arc[0]) as Set<[Vertex, number]>)
				.add(arc.slice(1, 3) as [Vertex, number]);
		}
		if (rootCandidates.size !== 1) {
			throw new Error("Cannot determine root.");
		}
		this.root = Array.from(rootCandidates)[0];
	}
	public write(): string {
		return `${this.writeVertex(this.root, new Set<Vertex>())};`;
	}
	private compareVertices(a: Vertex, b: Vertex): number {
		if (a === b) {
			return 0;
		}
		const aSort = this.getSortCached(a);
		const bSort = this.getSortCached(b);
		return aSort < bSort ? -1 : (aSort > bSort ? 1 : 0);
	}
	private getSort(vertex: Vertex): string {
		if (vertex.label) {
			return vertex.label;
		}
		const children = Array
			.from((this.outgoing.get(vertex) as Set<[Vertex, number]>))
			.map(([vertex]) => this.getSortCached(vertex))
			.sort()
			.join(",");
		return `(${children})`;	
	}
	private getSortCached(vertex: Vertex): string {
		if (this.sortMap.has(vertex)) {
			return this.sortMap.get(vertex) as string;
		}
		const sort = this.getSort(vertex);
		this.sortMap.set(vertex, sort);
		return sort;
	}
	private writeVertex(vertex: Vertex, visited: Set<Vertex>, weight = NaN): string {
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
	private writeWithOutgoing(vertex: Vertex, vertexString: string, visited: Set<Vertex>): string {
		const outgoing = this.outgoing.get(vertex) as Set<[Vertex, number]>;
		if (!outgoing.size) {
			return vertexString;
		}
		const children = Array.from(outgoing)
			.sort((a, b) => this.compareVertices(a[0], b[0]))
			.map(([child, weight]) => this.writeVertex(child, visited, weight));
		return `(${children.join(",")})${vertexString}`;
	}
	private readonly outgoing = new Map<Vertex, Set<[Vertex, number]>>();
	private readonly root: Vertex;
	private readonly sortMap = new Map<Vertex, string>();
}
function findVertexWithLabel(label: string, vertices: Set<Vertex>) {
	for (let vertex of vertices) {
		if (vertex.label === label) {
			return vertex;
		}
	}
	return null;
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
function addVertexWithChildren(graph: Graph, vertex: Vertex, children: Vertex[], weights: number[]): void {
	graph[0].add(vertex);
	while (children.length) {
		graph[1].add([
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
function readVertex(buffer: CharBuffer, graph: Graph): Vertex {
	let token = readFirstNonSpaceToken(buffer);
	const children: Vertex[] = [];
	const weights: number[] = [];
	if (token === "(") {
		do {
			children.push(readVertex(buffer, graph));
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
	const vertex = readVertexFromLabel(buffer, graph[0]);
	addVertexWithChildren(graph, vertex, children, weights);
	return vertex;
}
function normalizeVertexLabel(label: string): string {
	return label
		.replace(/;\s*$/, "")
		.trim()
		.replace(/\s+/g, " ");
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
function writeLabel(label: string | undefined): string
{
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
