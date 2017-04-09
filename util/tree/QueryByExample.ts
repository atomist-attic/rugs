import { GraphNode, PathExpression } from "@atomist/rug/tree/PathExpression"

/**
 * Mark this object as a match that will be
 * returned as a leaf (match node)
 * @param a object to mark as a match
 */
export function match(a) {
    a.$match = true
    return a
}

/**
 * Create a query for this node graph, matching either the root or leaf nodes
 * marked with the $match property. Works through navigating public functions
 * or properties that return other GraphNodes, or simple values (for simple predicates).
 * Doesn't insist on a GraphNode parameter as it could be a JSON structure with the required
 * properties instead
 * @type R type of root
 * @type L type of leaf (may be the same)
 */
export function byExample<R extends GraphNode, L extends GraphNode>(g: any): PathExpression<R, L> {
    let pathExpression = `/${queryByExampleString(g).path}`
    console.log(`Created path expression [${pathExpression}] for ${JSON.stringify(g)}`)
    return new PathExpression<R, L>(pathExpression)
}

/**
 * Query for the given root node. All other paths
 * will be expressed as predicates.
 * Should be passed to scala-style queries.
 * @param g root node
 */
export function forRoot<R extends GraphNode>(g: any): PathExpression<R, R> {
    return byExample<R, R>(g)
}

/**
 * The path into a subgraph, along with whether it's to be treated as a match
 * or as a predicate.
 */
class Branch {
    constructor(public path: string, public match: boolean) { }
}

// Internal state of query string generation
class PathBuilderState {

    private isMatch: boolean
    private simplePredicates = ""
    private complexPredicates = ""
    private rootExpression: string

    constructor(g: any) {
        this.isMatch = g.$match && g.$match === true
        this.rootExpression = typeToAddress(g)
    }

    addSimplePredicate(pred: string) {
        this.simplePredicates += pred
    }

    addComplexPredicate(pred: string) {
        this.complexPredicates += pred
    }

    /**
     * Mark this branch as a match branch, not a predicate?
     */
    markAsMatch() {
        this.isMatch = true
    }

    /**
     * The branch built from the state we've built up.
     * This is the ultimate objective.
     */
    branch() {
        return new Branch(
            this.rootExpression + this.simplePredicates + this.complexPredicates,
            this.isMatch)
    }
}

/**
 * If we're going down a branch that we need a match in, 
 * return the branch NOT as a predicate.
 */
function queryByExampleString(g: any): Branch {
    let state = new PathBuilderState(g)

    // TODO will only need properties. Not starting with _, either
    for (let id in g) {
        let propOrFun = g[id]
        let value: any = null
        if (isRelevantFunction(id, propOrFun)) {
            try {
                value = g[id]()
            }
            catch(e) {
                // Let value stay undefined
            }
        }
        else if (isRelevantProperty(id, propOrFun)) {
            value = g[id]
        }
        // Ignore undefined values
        if (value) { 
            handleAny(g, state, id, value)
        }
    }

    // Add custom predicate
    if (g.$predicate) {
        state.addComplexPredicate(g.$predicate)
    }
    return state.branch()
}

function handleAny(root: any, state: PathBuilderState, id: string, value) {
    if (value == null) {
        throw new Error("What to do with explicit null?")
    }
    else if (value === root) {
        throw new Error(`Cycle detected processing property [${id}] returning ${JSON.stringify(value)} with state ${state}`)
    }
    else if (isArray(value)) {
        handleArray(state, id, value)
    }
    else if (isGraphNode(value)) {
        handleGraphNode(state, id, value)
    }
    else if (isPrimitive(value) != -1) {
        handlePrimitive(state, id, value)
    }
    else {
        //console.log(`Don't know what to do with unfamiliar result of invoking [${id}] was [${value}]`)
    }
}

function handlePrimitive(state: PathBuilderState, id: string, value) {
    //console.log(`Non graph node result of invoking ${id} was [${value}]`)
    state.addSimplePredicate(`[@${id}='${value}']`)
}

function handleArray(state: PathBuilderState, id: string, values: any[]) {
    values.forEach(v => {
        handleAny(values, state, id, v)
    })
}

function handleGraphNode(state: PathBuilderState, id: string, value: GraphNode) {
    let branch = queryByExampleString(value)
    if (branch.match) {
        state.markAsMatch()
    }
    let step = `/${id}::${branch.path}`
    state.addComplexPredicate(branch.match ? step : `[${step}]`)
}

function typeToAddress(g: any): string {
    // TODO fragile. Or is this a convention we can rely on?
    return isFunction(g.nodeTags) ? `${g.nodeTags()[0]}()` : `${g.nodeTags[0]}()`
}

function isGraphNode(obj) {
    // Simple test for whether an object is a GraphNode
    return obj.nodeTags && obj.nodeName
}

function isPrimitive(obj) {
    return ["string", "number", "boolean"].indexOf(typeof obj)
}

/**
 * Is this a function we care about? That is, it's not one of our well-known functions
 * and isn't a builder function whose name starts with "with" or "add"
 */
function isRelevantFunction(id: string, f): boolean {
    return isFunction(f) && 
        [ "nodeTags", "nodeName", "address", 
            "constructor", "navigatedFrom"].indexOf(id) == -1 &&
        id.indexOf("with") != 0 &&
        id.indexOf("add") != 0;
}

/**
 * Is this a property we care about? That is, it's not one of our well-known properties
 * and isn't prefixed with _, our convention for holding our internal state
 */
function isRelevantProperty(id: string, p): boolean {
    return !isFunction(p) && 
        [ "or", "not", "nodeTags", "nodeName"].indexOf(id) == -1 &&
        id.indexOf("_") != 0 &&
        id.indexOf("$") != 0;
}

function isFunction(obj) {
    return !!(obj && obj.constructor && obj.call && obj.apply);
}

function isArray(obj) {
    return obj.constructor === Array
}


/**
 * Mixin that adds the ability to perform
 * logical operations and add custom predicates to nodes
 */
export class Enriched<T> {

  $predicate: string = "";

  constructor(public $target) {}

  addPredicate(predicate: string) {
    console.log(`Added predicate ${predicate} to ${JSON.stringify(this.$target)}`);
    this.$predicate += predicate;
    return this;
  }
  
}

/**
 * Return a proxy wrapping the given node to return
 * a mixin proxy.
 * @param base target
 */
export function enhance(base) {
   let enricher = new Enriched(base) as any;
    for (let id in base) {
        enricher[id] = base[id];
    }
    return enricher;
}