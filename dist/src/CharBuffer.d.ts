export default class CharBuffer {
    private readonly string;
    constructor(string?: string);
    atEnd(): boolean;
    back(): void;
    read(): string;
    rest(): string;
    pos: number;
    private readonly length;
    private checkAtEnd();
}
