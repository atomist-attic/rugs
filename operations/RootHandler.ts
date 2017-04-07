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

import { HandleEvent, Plan } from "@atomist/rug/operations/Handlers";
import { GraphNode, Match } from "@atomist/rug/tree/PathExpression";

/**
 * Convenient event handler superclass when we're only interested in the root
 * match. This is the commonest case.
 */
export abstract class RootHandler<R extends GraphNode> implements HandleEvent<R, R> {

    public handle(m: Match<R, R>): Plan {
        return this.onMatch(m.root());
    }

    /**
     * Handle the given root match
     * @param root root node of the match
     */
    public abstract onMatch(root: R): Plan;

}
