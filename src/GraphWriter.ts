import { Arc } from "./Arc";
import { Graph } from "./Graph";
import { Vertex } from "./Vertex";
export default class GraphWriter {
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
