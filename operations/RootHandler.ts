
import { Match, GraphNode } from "@atomist/rug/tree/PathExpression";
import { Plan, Message, HandleEvent } from "@atomist/rug/operations/Handlers";

/**
 * Convenient event handler superclass when we're only interested in the root
 * match
 */
export abstract class RootHandler<R extends GraphNode> implements HandleEvent<R,R> {

     handle(m: Match<R,R>): Plan | Message {
        return this.onMatch(m.root());
      }

      abstract onMatch(root: R): Plan | Message;

}
