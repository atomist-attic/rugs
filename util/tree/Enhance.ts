/*
 * Copyright © 2017 Atomist, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as query from "./QueryByExample"
import { clone } from "../misc/Utils"

/**
 * Mark this object as a match that will be
 * returned as a leaf (match node)
 * @param a object to mark as a match
 */
export function match(a) {
    a.$match = true;
    return a;
}

export function isMatch(a) {
    return a.$match === true;
}

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

/**
 * Drop the leading type, e.g. Build() from a path expression such as
 * Build()[@status='passed']
 * Used to extract predicates.
 * @param s path expression
 */
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