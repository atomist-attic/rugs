
/*
    Mixin functions to add to nodes to 
    allow building more powerful queries.
*/

export function withCustomPredicate(predicate: string) {
    if (!this.$predicate)
        this.$predicate = "";
    this.$predicate += predicate;
    return this;
}

export function customPredicate(a): string {
    return a.$predicate ? a.$predicate : ""
}

export function optional(n) {
    n.$optional = true;
    return n;
}

export function isOptional(n): boolean {
    return n.$optional === true;
}
/**
 * Decorate a node with appropriate mixin functions
 * to add power to query by example.
 * @param a node to decorate
 */
export function enhance(node) {
    node["withCustomPredicate"] = withCustomPredicate;
    return node;
}