
import { TextTreeNode } from "@atomist/rug/tree/PathExpression"

/**
 * Deem these nodes equivalent for our present purposes. 
 */
export type DeemEquivalent = (a: TextTreeNode, b: TextTreeNode) => Boolean

function no(a: TextTreeNode, b: TextTreeNode): Boolean {
    return false;
}

export function ifNamed(names: string[]): DeemEquivalent {
    return (a, b) => a.nodeName() === b.nodeName() && 
        names.indexOf(a.nodeName()) != -1;
}

/**
 * Check whether two nodes are structurally equivalent
 */
export function structurallyEquivalent(a: TextTreeNode, b: TextTreeNode,
            deemEquivalent: DeemEquivalent = no): boolean {
    if (a.nodeName() !== b.nodeName())
        return false;

    if (a.children().length != b.children().length)
        return false;

    if (a.value() === b.value()) {
        console.log(`${a} and ${b} have equal value of [${a.value()}]`)
        return true;
    }

    if (deemEquivalent(a, b)) {
        console.log(`${a} and ${b} deemed equivalent by ${deemEquivalent}`)
        return true;
    }

    for (let i = 0; i < a.children().length; i++) {
        const ax = a.children()[i] as TextTreeNode;
        const bx = b.children()[i] as TextTreeNode;
        if (!structurallyEquivalent(ax, bx, deemEquivalent)) {
            console.log(`Not equal at ${ax} and ${bx}`)
            return false;
        }
    }
    return true;
}