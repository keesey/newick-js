export default class CharBuffer {
	constructor(private readonly string = "") {
		this.length = this.string.length;
	}
	public atEnd() {
		return this.pos >= this.length;
	}
	public back() {
		if (this.pos <= 0) {
			throw new Error("At start of buffer.");
		}
		this.pos--;
	}
	public read() {
		this.checkAtEnd();
		return this.string.charAt(this.pos++);
	}
	public rest() {
		this.checkAtEnd();
		return this.string.substr(this.pos);
	}
	public pos = 0;
	private readonly length: number;
	private checkAtEnd() {
		if (this.atEnd()) {
			throw new Error("End of buffer reached.");
		}
	}
}
