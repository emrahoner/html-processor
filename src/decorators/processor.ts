function Processor(name: string) {
    return function (constructor: Function) {
        constructor.prototype.processor = name;
    }
}

export default Processor