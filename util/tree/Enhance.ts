
import * as query from "./QueryByExample"
import { clone } from "../misc/Utils"

/**
 * Interface mixed into enhanced objects.
 */
export interface Enhanced<T> {

    /**
     * Add a custom predicate string to this node
     */
    withCustomPredicate(predicate: string): EnhancedReturn<T>

    /**
     * Match either of these cases
     * @param a function to add examples to an object of this type
     * @param b function to add examples tp am pbkect of this type
     */
    optional(what: (T) => void): EnhancedReturn<T>

    /**
     * Specify that we should NOT match whatever state the specified function creates
     * @param what what we should not do: Invoke "with" or "add" methods
     */
    not(what: (T) => void): EnhancedReturn<T>

    or(a: (T) => void, b: (T) => void): EnhancedReturn<T>

}

export type EnhancedReturn<T> = T & Enhanced<T>

/*
    Mixin functions to add to nodes to 
    allow building more powerful queries.
*/

function withCustomPredicate(predicate: string) {
    if (!this.$predicate)
        this.$predicate = "";
    this.$predicate += predicate;
    return this;
}

export function customPredicate(a): string {
    return a.$predicate ? a.$predicate : ""
}

/*
    Our strategy for all these mixed-in methods is the same:
    Clone the existing object and run the user's function on it.
    The function should create additional predicates.
    Then manipulate the returned predicate as necesary.
*/

function optional<T>(what: (T) => void) {
    let shallowCopy = clone(this);
    what(shallowCopy);
    let rawPredicate = dropLeadingType(query.byExample(shallowCopy).expression);
    let optionalPredicate = rawPredicate + "?"
    this.withCustomPredicate(optionalPredicate);
    return this;
}

function not<T>(what: (T) => void) {
    let shallowCopy = clone(this);
    what(shallowCopy);
    let rawPredicate = dropLeadingType(query.byExample(shallowCopy).expression);
    let nottedPredicate = rawPredicate.replace("[", "[not ");
    this.withCustomPredicate(nottedPredicate);
    return this;
}

function or<T>(a: (T) => void, b: (T) => void) {
    let aCopy = clone(this);
    let bCopy = clone(this);
    a(aCopy);
    b(bCopy);
    let aPredicate = 
        dropLeadingType(query.byExample(aCopy).expression);
    let bPredicate = 
        dropLeadingType(query.byExample(bCopy).expression);
    let oredPredicate =
        aPredicate.replace("]", " or") + 
        bPredicate.replace("[", " ");
    this.withCustomPredicate(oredPredicate);
    return this;
}

function dropLeadingType(s: string): string {
    return s.substring(s.indexOf("["));
}

/**
 * Decorate a node with appropriate mixin functions
 * to add power to query by example.
 * @param a node to decorate
 */
export function enhance<T>(node): EnhancedReturn<T> {
    // Manually mix in the methods from the Enhanced interface
    node["optional"] = optional;
    node["withCustomPredicate"] = withCustomPredicate;
    node["not"] = not;
    node["or"] = or;
    return node;
}