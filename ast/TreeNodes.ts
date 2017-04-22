import { TextTreeNode } from "@atomist/rug/tree/PathExpression"

export class ContainerTreeNode implements TextTreeNode {

    constructor(
        private _nodeName: string, 
        private _children: TextTreeNode[] = [],
        private _nodeTags: string[] = []) {}

    value() { 
        return this._children.map(k => k.value()).join(""); 
    }

    update(newValue: string) { throw new Error("Update unsupported"); }

    formatInfo

    parent

    nodeName() { return this._nodeName; }

    nodeTags() { return this._nodeTags; }

    children() { return this._children; }

}

export class TerminalNode implements TextTreeNode {

    constructor(
        private _nodeName: string, 
        private _value: string,
        private _nodeTags: string[] = []) {}

    formatInfo

    parent

    value() { return this._value; }

    update(newValue: string) { this._value = newValue; }

    nodeName() { return this._nodeName; }

    nodeTags() { return this._nodeTags; }

    children() { return []; }
}

/**
 * Delegating tree node with different children
 */
export class DelegatingContainerTreeNode implements TextTreeNode {

    constructor(
        public delegate: TextTreeNode,
        private _children: TextTreeNode[]) {}

    value() { 
        return this._children.map(k => k.value()).join(""); 
    }

    update(newValue: string) { 
        throw new Error("Update unsupported"); 
    }

    formatInfo = this.delegate.formatInfo;

    parent = this.delegate.parent;

    nodeName() { return this.delegate.nodeName(); }

    nodeTags() { return this.delegate.nodeTags(); }

    children() { return this._children; }

}