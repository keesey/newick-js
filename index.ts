export type Arc = [Vertex, Vertex, number];
export type Graph = [Set<Vertex>, Set<Arc>];
export interface ParseResult {
	graph: Graph;
	root: Vertex;
}
export interface Vertex
{
	label?: string;
}
export function parse(s: string): ParseResult
{
	if (typeof s !== "string") {
		throw new Error(`Not a string: ${s}`);
	}
	if (s.length < 2) {
		throw new Error(`Not long enough to be a Newick string: "${s}".`);
	}
	const graph: Graph = [new Set<Vertex>(), new Set<Arc>()];
	const root = readVertex(new CharBuffer(s), graph);
	return {
		graph,
		root,
	};
}
class CharBuffer
{
	constructor(readonly string = "")
	{
		this.length = this.string.length;
	}
	atEnd()
	{
		return this.pos >= this.length;
	}
	back()
	{
		if (this.pos <= 0) {
			throw new Error("At start of buffer.");
		}
		this.pos--;
	}
	read()
	{
		if (this.atEnd()) {
			throw new Error("End of buffer reached.");
		}
		return this.string.charAt(this.pos++);
	}
	public pos = 0;
	readonly length: number;
}
function readVertex(buffer: CharBuffer, graph: Graph): Vertex
{
	let token: string;
	do
	{
		token = buffer.read();
	}
	while (/\s/.test(token));
	const children: Vertex[] = [];
	const weights: number[] = [];
	if (token === "(")
	{
		do
		{
			children.push(readVertex(buffer, graph));
			token = buffer.read();
			if (token === ":")
			{
				weights.push(readWeight(buffer));
				token = buffer.read();
			}
			else
			{
				weights.push(NaN);
			}
			if (token === ")")
			{
				break;
			}
			if (token != ",")
			{
				throw new Error(`Unexpected character "${token}" in Newick tree string at position ${buffer.pos - 1}.`);
			}
		}
		while (true);
	}
	else
	{
		buffer.back();
	}
	const vertex: Vertex = readVertexLabel(buffer);
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
function readVertexLabel(buffer: CharBuffer): Vertex
{
	let label = "";
	let quoted = false;
	while (!buffer.atEnd())
	{
		const token = buffer.read();
		if (token === "'")
		{
			if (!quoted && label.length > 0) {
				label += token;
			}
			quoted = !quoted;
		}
		else if (!quoted)
		{
			if (token === ")" || token === "," || token === ":" || token === "(")
			{
				buffer.back();
				break;
			}
			if (label.length !== 0 || !(/^\s$/.test(token)))
			{
				label += token;
			}
		}
	}
	if (label.length === 0)
	{
		return {};
	}
	label = label
		.replace(/;$/, '')
		.replace(/^\s+/, '')
		.replace(/\s+$/, '')
		.replace(/\s\s+/g, ' ');
	if (label.length === 0)
	{
		return {};
	}
	return { label };
}
function readWeight(buffer: CharBuffer): number
{
	let s = '';
	while (!buffer.atEnd())
	{
		const token = buffer.read();
		if (token === ")" || token === ",")
		{
			buffer.back();
			break;
		}
		s += token;
	}
	return parseFloat(s);
}
