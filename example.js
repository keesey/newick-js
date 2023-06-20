#!/usr/bin/env node
const { parse, write } = require("./dist")
const result = parse("(Pongo:15.76,(Gorilla:9.06,(Pan:6.65,Homo:6.65):2.41)Homininae:6.70)Hominidae:4.43;")
console.log(`Root: ${result.root.label}`)
console.log(`Root Weight: ${result.rootWeight}`)
const vertices = result.graph[0]
console.log(`Number of Vertices: ${vertices.size}`)
const arcs = result.graph[1]
console.log(`Number of Arcs: ${arcs.size}`)
console.log(write(result.graph, result.rootWeight))
