import { Arc } from "./Arc";
import { Vertex } from "./Vertex";
export type Graph = Readonly<[ReadonlySet<Vertex>, ReadonlySet<Arc>]>;
