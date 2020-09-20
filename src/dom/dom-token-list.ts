import { Attr } from "./attr";

export class DOMTokenList {
    private _tokens: Map<string, string>;
    private _attr: Attr;
    constructor(attr: Attr) {
        this._attr = attr;
        this._tokens = new Map(attr.value.split(' ').filter(x => x).map(x => [x, x]));
    }

    get length() {
        return this._tokens.size;
    }

    add(...tokens: string[]): void {
        tokens.forEach(token => {
            this._tokens.set(token, token);
        });
        this._setAttrValue();
    }

    remove(...tokens: string[]): void {
        tokens.forEach(token => {
            this._tokens.delete(token);
        });
        this._setAttrValue();
    }

    contains(token: string): boolean {
        return this._tokens.has(token);
    }

    replace(oldToken: string, newToken: string) {
        this._tokens.delete(oldToken);
        this._tokens.set(newToken, newToken);
        this._setAttrValue();
    }


    private _setAttrValue(): void {
        this._attr.value = Array.from(this._tokens.values()).join(' ');
    }
}
