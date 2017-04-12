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

import { GraphNode, PathExpression } from "@atomist/rug/tree/PathExpression";
import * as enhancer from "./Enhance";
import { match }  from "./Enhance";
import { enhance }  from "./Enhance";
import { isFunction, isArray, isPrimitive } from "../misc/Utils"

export { enhance };
export { match };

/**
 * Create a query for this node graph, matching either the root or leaf nodes
 * marked with the _match property. Works through navigating public functions
 * or properties that return other GraphNodes, or simple values (for simple predicates).
 * Doesn't insist on a GraphNode parameter as it could be a JSON structure with the required
 * properties instead
 * @type R type of root
 * @type L type of leaf (may be the same)
 */
export function byExample<R extends GraphNode, L extends GraphNode>(g: any): PathExpression<R, L> {
    const pathExpression = `/${queryByExampleString(g).path}`;
    return new PathExpression<R, L>(pathExpression);
}

/**
 * Query for the given root node. All other paths
 * will be expressed as predicates.
 * Should be passed to scala-style queries.
 * @param g root node
 */
export function forRoot<R extends GraphNode>(g: any): PathExpression<R, R> {
    return byExample<R, R>(g);
}

/**
 * The path into a subgraph, along with whether it's to be treated as a match
 * or as a predicate.
 */
class Branch {
    constructor(public path: string, public match: boolean) { }
}

/**
 * Internal state of query string generation
 */
class PathBuilderState {

    private isMatch: boolean;
    private simplePredicates = "";
    private complexPredicates = "";
    private rootExpression: string;

    constructor(private root: any) {
        this.isMatch = enhancer.isMatch(root);
        this.rootExpression = typeToAddress(root);
    }

    public addSimplePredicate(pred: string) {
        this.simplePredicates += pred;
    }

    public addComplexPredicate(pred: string) {
        this.complexPredicates += pred;
    }

    /**
     * Mark this branch as a match branch, not a predicate?
     */
    public markAsMatch() {
        this.isMatch = true;
    }

    /**
     * The branch built from the state we've built up.
     * This is the ultimate objective.
     */
    public branch() {
        return new Branch(
            this.rootExpression + 
                this.simplePredicates + 
                this.complexPredicates + 
                enhancer.customPredicate(this.root),
            this.isMatch);
    }
}

/**
 * If we're going down a branch that we need a match in,
 * return the branch NOT as a predicate.
 */
function queryByExampleString(g: any): Branch {
    const state = new PathBuilderState(g);
    for (const id in g) {
        let value: any = null;
        if (isRelevantPropertyName(id)) {
            try {
                value = g[id];
            } catch (e) {
                // Let value stay undefined
            }
        }
        // Ignore undefined values
        if (value) {
            handleAny(g, state, id, value);
        }
    }
    return state.branch();
}

function handleAny(root: any, state: PathBuilderState, id: string, value) {
    if (value == null) {
        throw new Error("What to do with explicit null?");
    } else if (value === root) {
        const e = `Cycle detected processing property [${id}] returning ${JSON.stringify(value)} with state ${state}`;
        throw new Error(e);
    } else if (isArray(value)) {
        handleArray(state, id, value);
    } else if (isGraphNode(value)) {
        handleGraphNode(state, id, value);
    } else if (isPrimitive(value) !== -1) {
        handlePrimitive(state, id, value);
    } else {
        // console.log(`Don't know what to do with unfamiliar result of invoking [${id}] was [${value}]`);
    }
}

function handlePrimitive(state: PathBuilderState, id: string, value) {
    state.addSimplePredicate(`[@${id}='${value}']`);
}

function handleArray(state: PathBuilderState, id: string, values: any[]) {
    values.forEach((v) => {
        handleAny(values, state, id, v);
    });
}

function handleGraphNode(state: PathBuilderState, id: string, value: GraphNode) {
    const branch = queryByExampleString(value);
    if (branch.match) {
        state.markAsMatch();
    }
    const step = `/${id}::${branch.path}`;
    state.addComplexPredicate(branch.match ? 
        step : 
        `[${step}]`
    );
}

function typeToAddress(g: any): string {
    // TODO fragile. Or is this a convention we can rely on?
    return isFunction(g.nodeTags) ? `${g.nodeTags()[0]}()` : `${g.nodeTags[0]}()`;
}

function isGraphNode(obj) {
    // Simple test for whether an object is a GraphNode
    return obj.nodeTags && obj.nodeName;
}

/**
 * Is this a property we care about? That is, it's not one of our well-known properties
 * and isn't prefixed with _, our convention for holding our internal state
 */
function isRelevantPropertyName(id: string): boolean {
    return ["nodeTags", "nodeName"].indexOf(id) === -1 &&
        id.indexOf("_") !== 0 &&
        id.indexOf("$") !== 0;
}
