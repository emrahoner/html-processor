import { Attr } from "./attr";

export class NamedNodeMap {
    private _namedNodes: Map<string, Attr>;
    constructor(namedNodes?: Attr[]) {
        this._namedNodes = new Map<string, Attr>(namedNodes?.map(x => [x.name, x]));
        this._createNamedIndexes(namedNodes);
    }

    get length() {
        return this._namedNodes.size;
    }

    item(index: number): Attr {
        return Array.from(this._namedNodes.values())[index]
    }

    getNamedItem(name: string): Attr {
        return this._namedNodes[name];
    }

    setNamedItem(attr: Attr): void {
        this._namedNodes.set(attr.name, attr);
        this[attr.name] = attr;
    }

    removeNamedItem(name: string): void {
        this._namedNodes.delete(name);
        delete this[name];
    }


    private _createNamedIndexes(namedNodes: Attr[]): void {
        if (!namedNodes || !namedNodes.length)
            return;
        for (let i = 0; i < namedNodes.length; i++) {
            const namedNode = namedNodes[i];
            this[namedNode.name] = namedNode;
        }
    }
}
