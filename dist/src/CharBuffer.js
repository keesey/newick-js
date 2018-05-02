"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class CharBuffer {
    constructor(string = "") {
        this.string = string;
        this.pos = 0;
        this.length = this.string.length;
    }
    atEnd() {
        return this.pos >= this.length;
    }
    back() {
        if (this.pos <= 0) {
            throw new Error("At start of buffer.");
        }
        this.pos--;
    }
    read() {
        this.checkAtEnd();
        return this.string.charAt(this.pos++);
    }
    rest() {
        this.checkAtEnd();
        return this.string.substr(this.pos);
    }
    checkAtEnd() {
        if (this.atEnd()) {
            throw new Error("End of buffer reached.");
        }
    }
}
exports.default = CharBuffer;
