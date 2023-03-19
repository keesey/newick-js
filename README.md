# newick-js

A [Node.js](https://nodejs.org) module that parses strings into graphs according to the [Newick tree format](http://evolution.genetics.washington.edu/phylip/newicktree.html), and writes graphs as Newick tree strings.

## Requirements

This module minimally requires ECMAScript 2015 (ES6), since it uses `Set` objects.

## Installation

### npm

```sh
npm install newick-js --save
```

### yarn

```sh
yarn add newick-js
```

## Usage

### JavaScript and TypeScript

#### Importing the Functions

To import the functions in JavaScript:

```javascript
const { parse, write } = require("newick-js")
```

To import the functions in TypeScript:

```typescript
import { parse, write } from "newick-js"
```

To import separately (minimizing file size for tree-shaking):

```typescript
import { parse } from "newick-js/dist/src/parse"
import { write } from "newick-js/dist/src/write"
```

#### Interface

(The type declarations are written in TypeScript.)

##### Vertices

A **vertex** is a plain object with an optional `label` field.

```typescript
interface Vertex {
    label?: string
}
```

##### Arcs

An **arc** is an array which includes, in order:

1. a head vertex (the parent),
2. a tail vertex (the child), and
3. a weight (a number, possibly `NaN`).

```typescript
type Arc = [Vertex, Vertex, number]
```

##### Graphs

A **graph** is an array which includes, in order:

1. a set of vertices, and
2. a set of arcs.

```typescript
type Graph = [Set<Vertex>, Set<Arc>]
```

##### Functions

The `parse()` function takes a string and yields a **parse result**, including a graph, a root vertex, and a weight for the root vertex (possibly `NaN`).

```typescript
declare function parse(s: string): ParseResult
interface ParseResult {
    graph: Graph
    root: Vertex
    rootWeight: number
}
```

The `write()` method takes a graph and yields a Newick tree string.

```typescript
declare function write(graph: Graph): string
```

#### Example Usage

(JavaScript or TypeScript, after importing the functions)

```javascript
const result = parse("(Pongo:15.76,(Gorilla:9.06,(Pan:6.65,Homo:6.65):2.41)Homininae:6.70)Hominidae:4.43;")
const root = result.root
console.log(`Root: ${result.root.label}`)
console.log(`Root Weight: ${result.rootWeight}`)
const vertices = result.graph[0]
console.log(`Number of Vertices: ${vertices.size}`)
const arcs = result.graph[1]
console.log(`Number of Arcs: ${arcs.size}`)
console.log(write(result.graph))
```

Output:

```sh
> Root: Hominidae
> Root Weight: 4.43
> Number of Vertices: 7
> Number of Arcs: 6
> ((Homo:6.65,Pan:6.65):2.41,Gorilla:9.06)Homininae:6.7,(Pongo:15.76)Hominidae;
```

See `test/test.js` for further examples.

### AMD

```javascript
define(function (require, exports, module) {
    var newick = require("newick-js")
})
```

## Testing

```sh
yarn test
```
