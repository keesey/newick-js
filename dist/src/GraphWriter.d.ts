import { Graph } from "./Graph";
export default class GraphWriter {
    private readonly graph;
    constructor(graph: Graph);
    write(): string;
    private compareVertices(a, b);
    private getSort(vertex);
    private getSortCached(vertex);
    private writeVertex(vertex, visited, weight?);
    private writeWithOutgoing(vertex, vertexString, visited);
    private readonly outgoing;
    private readonly root;
    private readonly sortMap;
}
