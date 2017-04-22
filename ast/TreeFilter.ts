
import { TextTreeNode } from "@atomist/rug/tree/PathExpression"

import { NodeFilter } from "./NodeFilter"

import * as node from "./TreeNodes"

/**
 * Keep the nodes that match the filter
 * @param tn 
 * @param nodeFilter 
 */
export function filter(tn: TextTreeNode, nodeFilter: NodeFilter): TextTreeNode {
    const filteredChildren =
        tn.children()
        .filter(n => nodeFilter.keep(n as TextTreeNode))
        .map(n => filter(n as TextTreeNode, nodeFilter));
    return new node.DelegatingContainerTreeNode(tn, filteredChildren as TextTreeNode[]);
}