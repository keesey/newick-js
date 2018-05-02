import { Graph } from "./Graph";
import { Vertex } from "./Vertex";
export interface ParseResult {
    graph: Graph;
    root: Vertex;
    rootWeight: number;
}
export declare function parse(s: string): ParseResult;
