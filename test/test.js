"use strict";
const expect = require("chai").expect;
const { parse, write } = require("../dist/index.js");
const arcMatchesDescription = (arc, description) => {
    if (arc[0].label !== description[0]) {
        return false;
    }
    if (arc[1].label !== description[1]) {
        return false;
    }
    if (isNaN(arc[2]) && !isNaN(description[2])) {
        return false;
    }
    return arc[2] === description[2];
}
const expectSetsEqual = (a, b) => {
    if (!(a instanceof Set)) {
        throw new Error("First argument is not a set.");
    }
    if (!(b instanceof Set)) {
        throw new Error("Second argument is not a set.");
    }
    if (a.size !== b.size) {
        throw new Error("Sets are different sizes.");
    }
    for (let member of a) {
        if (!b.has(member)) {
            throw new Error("Sets are not identical.");
        }
    }
}
const testIncorrect = string => {
    describe(`(${typeof string === "string" ? `"${string}"` : string})`, () => {
        it("should throw an error", () => {
            expect(() => parse(s)).to.throw;
        });
    });
};
const testNewick = ({
    expectedArcCount,
    expectedRootLabel,
    expectedVertexCount,
    expectedWritten,
    string,
}) => {
    if (!expectedArcCount) {
        expectedArcCount = expectedVertexCount - 1;
    }
    if (!expectedWritten) {
        expectedWritten = string;
    }
    describe(`("${string}")`, () => {
        let result;
        beforeEach(() => result = parse(string));
        it("should have a graph object", () => {
            expect(result.graph).to.be.an("array");
        });
        it("should have a graph with 2 members", () => {
            expect(result.graph).to.have.length(2);
        });
        it("should have a graph with vertices", () => {
            expect(result.graph[0]).to.be.a("Set");
        });
        it("should have a graph with arcs", () => {
            expect(result.graph[1]).to.be.a("Set");
        });
        it(`should have a graph with ${expectedVertexCount} vert${expectedVertexCount == 1 ? "ex" : "ices"}`, () => {
            expect(result.graph[0].size).to.equal(expectedVertexCount);
        });
        it(`should have a graph with ${expectedArcCount} arc${expectedArcCount == 1 ? "" : "s"}`, () => {
            expect(result.graph[1].size).to.equal(expectedArcCount);
        });
        it("should have a root", () => {
            expect(result.root).to.be.an("object");
        });
        if (typeof expectedRootLabel === "undefined") {
            it("should have an unlabeled root", () => {
                expect(result.root.label).to.be.undefined;
            });
        } else {
            it("should have the expected root label", () => {
                expect(result.root.label).to.equal(expectedRootLabel);
            });
        }
        it("should include the root in the vertices", () => {
            expect(result.graph[0].has(result.root)).to.be.true;
        });
        if (expectedVertexCount === 1) {
            it("should have a single vertex (the root)", () => {
                const expectedVertices = new Set();
                expectedVertices.add(result.root);
                expectSetsEqual(result.graph[0], expectedVertices);
            });
        }
        else {
            it("should have all of the vertices from the arcs, and only those vertices", () => {
                const expectedVertices = new Set();
                for (let arc of result.graph[1]) {
                    expectedVertices
                        .add(arc[0])
                        .add(arc[1]);
                }
                expectSetsEqual(result.graph[0], expectedVertices);
            });
        }
        it("should write as the expected string", () => {
            expect(write(result.graph)).to.equal(expectedWritten);
        });
        it("should rewrite as the expected string", () => {
            expect(write(parse(write(result.graph)).graph)).to.equal(expectedWritten);
        });
    });
    if (/;$/.test(string)) {
        testNewick({
            expectedArcCount,
            expectedRootLabel,
            expectedVertexCount,
            expectedWritten,
            string: string.substr(0, string.length - 1),
        });
    }
};
describe("The Newick string parser", () => {
    describe("when using an example from the specification", () => {
        testNewick({
            expectedVertexCount: 14,
            expectedWritten: "((((cat:47.14069,monkey:100.8593):20.59201,weasel:18.87953):2.0946,(sea_lion:11.997,seal:12.003):7.52973):3.87382,(bear:6.80041,raccoon:19.19959):0.846,dog:25.46154);",
            string: "((raccoon:19.19959,bear:6.80041):0.84600,((sea_lion:11.99700, seal:12.00300):7.52973,((monkey:100.85930,cat:47.14069):20.59201, weasel:18.87953):2.09460):3.87382,dog:25.46154);",
        });
        testNewick({
            expectedVertexCount: 12,
            expectedWritten: "(((((Chimp:0.19268,Human:0.11927):0.08386,Gorilla:0.17147):0.06124,Orang:0.33636):0.15057,Gibbon:0.36079):0.54939,Bovine:0.69395,Mouse:1.2146);",
            string: "(Bovine:0.69395,(Gibbon:0.36079,(Orang:0.33636,(Gorilla:0.17147,(Chimp:0.19268, Human:0.11927):0.08386):0.06124):0.15057):0.54939,Mouse:1.21460):0.10;",
        });
        testNewick({
            expectedVertexCount: 12,
            expectedWritten: "(((((H._sapiens:0.11927,P._paniscus:0.19268):0.08386,G._Gorilla:0.17147):0.06124,Pongo:0.33636):0.15057,Hylobates:0.36079):0.54939,Bovine:0.69395,Rodent:1.2146);",
            string: "(Bovine:0.69395,(Hylobates:0.36079,(Pongo:0.33636,(G._Gorilla:0.17147, (P._paniscus:0.19268,H._sapiens:0.11927):0.08386):0.06124):0.15057):0.54939, Rodent:1.21460);",
        });
        testNewick({
            expectedRootLabel: "A",
            expectedVertexCount: 1,
            string: "A;",
        });
        testNewick({
            expectedVertexCount: 7,
            string: "((A,B),(C,D));",
        });
        testNewick({
            expectedVertexCount: 10,
            expectedWritten: "(,,,,Alpha,Beta,Delta,Epsilon,Gamma);",
            string: "(Alpha,Beta,Gamma,Delta,,Epsilon,,,);",
        });
    });
    describe("when using the example from the `README`", () => {
        testNewick({
            expectedRootLabel: "Hominidae",
            expectedVertexCount: 7,
            expectedWritten: "(((Homo:6.65,Pan:6.65):2.41,Gorilla:9.06)Homininae:6.7,Pongo:15.76)Hominidae;",
            string: "(Pongo:15.76,(Gorilla:9.06,(Pan:6.65,Homo:6.65):2.41)Homininae:6.70)Hominidae;",
        });
    });
    describe("when using trees with with excessive whitespace", () => {
        testNewick({
            expectedVertexCount: 7,
            expectedWritten: "((A,B),(C,D));",
            string: " \n (    (  \n\nA\t,\tB   )\n\n,\r\r(\t   C,    D)   \n\n   )    ;\t\t   \t",
        });
    });
    describe("when using a large tree", () => {
        testNewick({
            expectedVertexCount: 142,
            expectedWritten: "((((((((((((((Macaca fuscata:0,Macaca mulatta:5):1,(Papio:4,Theropithecus:2):15,Macaca fascicularis:2):2,Erythrocebus:0):1,Cercopithecus:1):8,Presbytis:1):6,((((Homo:22,Pan:1):2,Gorilla:2):6,Pongo:1):2,Hylobates:6):5):9,(((Aotus:6,Callithrix:9):3,Atelinae:5):3,Cebus:10):18):22,Tarsius:15):10,((Galago:16,Nycticebus:27):10,Lemuridae:46):8):13,((((((Mesocricetus:32,Ondatra:27):27,(Mus:19,Rattus:71):15):20,Spalax:23):8,Spermophilus:29):12,Caviomorpha:107):15,(Ochotona:7,Oryctolagus:54):4):11):9,((((((((Mustelidae:22,Procyonidae:12):9,(Phocidae:19,Zalophus:17):7):5,(Canis:37,Ursidae:12):4):17,(Felis:13,Leo:7):32):13,Manis:5):3,((Erinaceus:58,Suncus:24):6,Talpa:24):4):10,Tupaia:43):6,Chiroptera:27):8):12,((((((((Alces:9,Cervus:8):11,(Antilocapra:13,Giraffa:14):7):2,(Capra:8,Ovis:9):19):9,(((Bison:5,Bos taurus:15):7,Bos grunniens:6):11,Tragelaphinae:6):6):47,Hippopotamus:31):10,(Camelus:24,Lama:10):31):19,Sus:50):18,(((Balaenoptera:36,Eschrichtius:2):8,(Phocoena:4,Tursiops:17):5):29,(('Equus (Asinus)':6,Equus caballus:31):24,(Rhinocerotidae:23,Tapirus:19):11):22):12):12):16,(((Elephas:18,Loxodonta:5):55,Procavia:29):10,(Orycteropus:12,Trichechus:43):1):15):55,Edentata:55);",
            string: "(Edentata:55, (((Orycteropus:12, Trichechus:43):1, (Procavia:29, (Elephas:18, Loxodonta:5):55):10):15, (((Chiroptera:27, (Tupaia:43, ((Talpa:24, (Suncus:24, Erinaceus:58):6):4, (Manis:5, ((Felis:13, Leo:7):32, ((Canis:37, Ursidae:12):4, ((Phocidae:19, Zalophus:17):7, (Procyonidae:12, Mustelidae:22):9):5):17):13):3):10):6):8, (((Lemuridae:46, (Galago:16, Nycticebus:27):10):8, (Tarsius:15, ((Cebus:10, (Atelinae:5, (Aotus:6, Callithrix:9):3):3):18, ((Hylobates:6, (Pongo:1, (Gorilla:2, (Homo:22, Pan:1):2):6):2):5, (Presbytis:1, (Cercopithecus:1, (Erythrocebus:0, ('Macaca fascicularis':2, ('Macaca mulatta':5, 'Macaca fuscata':0):1, (Theropithecus:2, Papio:4):15):2):1):8):6):9):22):10):13, ((Ochotona:7, Oryctolagus:54):4, (Caviomorpha:107, (Spermophilus:29, (Spalax:23, ((Rattus:71, Mus:19):15, (Ondatra:27, Mesocricetus:32):27):20):8):12):15):11):9):12, ((Sus:50, ((Lama:10, Camelus:24):31, (Hippopotamus:31, (((Ovis:9, Capra:8):19, ((Antilocapra:13, Giraffa:14):7, (Cervus:8, Alces:9):11):2):9, (Tragelaphinae:6, ('Bos grunniens':6, (Bison:5, 'Bos taurus':15):7):11):6):47):10):19):18, ((('Equus (Asinus)':6, 'Equus caballus':31):24, (Tapirus:19, Rhinocerotidae:23):11):22, ((Phocoena:4, Tursiops:17):5, (Balaenoptera:36, Eschrichtius:2):8):29):12):12):16):55);",
        })
    });
    describe("when using trees with multiple incoming arcs", () => {
        testNewick({
            expectedArcCount: 6,
            expectedVertexCount: 6,
            string: "((A,B),(A,C));",
        })
        testNewick({
            expectedArcCount: 6,
            expectedVertexCount: 6,
            expectedWritten: "(((A,B)C,D),C);",
            string: "((A,B)C,(C,D));",
        })
    });
    describe("when using non-string or strings that do not adhere to the Newick tree format", () => {
        testIncorrect(undefined);
        testIncorrect(null);
        testIncorrect({});
        testIncorrect("");
        testIncorrect("A,B");
        testIncorrect("\t\t\t");
        testIncorrect("-");
        testIncorrect(":39");
        testIncorrect(";");
        testIncorrect("(A,B");
        testIncorrect("A,B)");
        testIncorrect("(A,(B)");
        testIncorrect("(A(B,C))");
    });
});
