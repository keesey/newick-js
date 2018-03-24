export declare type Arc = [Vertex, Vertex, number];
export declare type Graph = [Set<Vertex>, Set<Arc>];
export interface ParseResult {
    graph: Graph;
    root: Vertex;
}
export interface Vertex {
    label?: string;
}
export declare function parse(s: string): ParseResult;
export declare function write(graph: Graph): string;
