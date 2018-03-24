# newick-js

A [Node.js](https://nodejs.org) module that parses strings into graphs according to the [Newick tree format](http://evolution.genetics.washington.edu/phylip/newicktree.html).

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

### Javascript
```javascript
const { parse } = require("newick-js");
const result = parse("(Pongo:15.76,(Gorilla:9.06,(Pan:6.65,Homo:6.65):2.41)Homininae:6.70)Hominidae;");
const root = result.root;
console.log(`Root: ${result.root.label}`);
const vertices = result.graph[0];
console.log(`Number of Vertices: ${vertices.size}`);
const arcs = result.graph[1];
const arcList = Array.from(arcs.values());
console.log(arcList.map(arc => `${arc[0].label || "[unnamed]"} => ${arc[1].label || "[unnamed]"} (weight: ${arc[2]})`).join("\n"));
```

Output:
```sh
> Root: Hominidae
> Number of Vertices: 7
> [unnamed] => Homo (weight: 6.65)
  [unnamed] => Pan (weight: 6.65)
  Homininae => [unnamed] (weight: 2.41)
  Homininae => Gorilla (weight: 9.06)
  Hominidae => Homininae (weight: 6.7)
  Hominidae => Pongo (weight: 15.76)
```

### TypeScript
```javascript
import { parse } from "newick-js";
const result = parse("(Pongo:15.76,(Gorilla:9.06,(Pan:6.65,Homo:6.65):2.41)Homininae:6.70)Hominidae;");
const root = result.root;
console.log(`Root: ${result.root.label}`);
const vertices = result.graph[0];
console.log(`Number of Vertices: ${vertices.size}`);
const arcs = result.graph[1];
const arcList = Array.from(arcs.values());
console.log(arcList.map(arc => `${arc[0].label || "[unnamed]"} => ${arc[1].label || "[unnamed]"} (weight: ${arc[2]})`).join("\n"));
```

Output:
```sh
> Root: Hominidae
> Number of Vertices: 7
> [unnamed] => Homo (weight: 6.65)
  [unnamed] => Pan (weight: 6.65)
  Homininae => [unnamed] (weight: 2.41)
  Homininae => Gorilla (weight: 9.06)
  Hominidae => Homininae (weight: 6.7)
  Hominidae => Pongo (weight: 15.76)
```

### AMD
```javascript
define(function(require, exports, module) {
  var parse = require('newickJS').parse;
});
```

## Test 
```sh
yarn test
```
