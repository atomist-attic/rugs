
import { TextTreeNode } from "@atomist/rug/tree/PathExpression"

export type NodeSelector = (TextTreeNode) => boolean

/**
 * Returns true if the node should stay.
 * Supports logical operations
 */
export class NodeFilter {

    constructor(private ff: NodeSelector) {}

    keep(n: TextTreeNode): boolean {
        return this.ff(n);
    }

    and(that: NodeFilter): NodeFilter {
        return new NodeFilter(n => this.keep(n) && that.keep(n));
    }

    or(that: NodeFilter): NodeFilter {
        return new NodeFilter(n => this.keep(n) || that.keep(n));
    }
}

export function named(namesToKeep: string[]): NodeFilter {
    return new NodeFilter(n => namesToKeep.indexOf(n.nodeName()) != -1);
}
