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
const { parse, write } = require("newick-js");
const result = parse("(Pongo:15.76,(Gorilla:9.06,(Pan:6.65,Homo:6.65):2.41)Homininae:6.70)Hominidae;");
const root = result.root;
console.log(`Root: ${result.root.label}`);
const vertices = result.graph[0];
console.log(`Number of Vertices: ${vertices.size}`);
const arcs = result.graph[1];
console.log(`Number of Arcs: ${arcs.size}`);
console.log(write(result.graph));
```

Output:
```sh
> Root: Hominidae
> Number of Vertices: 7
> Number of Arcs: 6
> ((Homo:6.65,Pan:6.65):2.41,Gorilla:9.06)Homininae:6.7,(Pongo:15.76)Hominidae;
```

### TypeScript
```javascript
import { parse, write } from "newick-js";
const result = parse("(Pongo:15.76,(Gorilla:9.06,(Pan:6.65,Homo:6.65):2.41)Homininae:6.70)Hominidae;");
const root = result.root;
console.log(`Root: ${result.root.label}`);
const vertices = result.graph[0];
console.log(`Number of Vertices: ${vertices.size}`);
const arcs = result.graph[1];
console.log(`Number of Arcs: ${arcs.size}`);
console.log(write(result.graph));
```

Output:
```sh
> Root: Hominidae
> Number of Vertices: 7
> Number of Arcs: 6
> ((Homo:6.65,Pan:6.65):2.41,Gorilla:9.06)Homininae:6.7,(Pongo:15.76)Hominidae;
```

### AMD
```javascript
define(function(require, exports, module) {
  var newick = require('newick-js');
});
```

## Test 
```sh
yarn test
```
