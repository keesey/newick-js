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
	return new GraphWriter(graph).write();
}
class CharBuffer {
	constructor(private readonly string = "") {
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
	private readonly length: number;
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
			} else {
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
	} else {
		buffer.back();
	}
	const vertex: Vertex = readVertexLabel(buffer, graph[0]);
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
		} else if (quoted) {
			label += token;
		} else {
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
