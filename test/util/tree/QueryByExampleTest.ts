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

import { only, skip, slow, suite, test, timeout } from "mocha-typescript";

import { expect } from "chai";

import * as query from "../../../util/tree/QueryByExample";

import { Build } from "@atomist/cortex/stub/Build";
import { Commit } from "@atomist/cortex/stub/Commit";
import { Delta } from "@atomist/cortex/stub/Delta";
import { Org } from "@atomist/cortex/stub/Org";
import { PullRequest } from "@atomist/cortex/stub/PullRequest";
import { Repo } from "@atomist/cortex/stub/Repo";

import { PathExpression } from "@atomist/rug/tree/PathExpression";

@suite class QueryByExample {

    @test public "simple node"() {
        const b = new Build();
        const pathExpression = query.byExample(b);
        expect(pathExpression.expression).to.equal("/Build()");
    }

    @test public "node with simple property predicate"() {
        const b = new Build().withProvider("mybuild");
        const pathExpression = query.byExample(b);
        expect(pathExpression.expression).to.equal(
            `/Build()[@provider='${b.provider}']`);
    }

    @test public "node with two simple property predicates"() {
        const b = new Build().withProvider("mybuild").withStatus("failed");
        const pathExpression = query.byExample(b);
        expect(pathExpression.expression).to.equal(
            `/Build()[@provider='${b.provider}'][@status='${b.status}']`);
    }

    @test public "node with two ORed simple property predicates"() {
        const b = query.enhance(new Build())
            .or((bp) => bp.withProvider("mybuild"), (bs) => bs.withStatus("failed"));
        const pathExpression = query.byExample(b);
        expect(pathExpression.expression).to.equal(
            `/Build()[@provider='mybuild' or @status='failed']`);
    }

    @test public "node with related node"() {
        const b = new Build().withProvider("mybuild").withRepo(new Repo());
        const pathExpression = query.byExample(b);
        expect(pathExpression.expression).to.equal(
            `/Build()[@provider='${b.provider}'][/repo::Repo()]`);
    }

    @test public "node with simple property predicate NOT"() {
        const b = query.enhance(new Build())
            .not((bp) => bp.withProvider("mybuild"));
        const pathExpression = query.byExample(b);
        expect(pathExpression.expression).to.equal(
            `/Build()[not @provider='mybuild']`);
    }

    @test public "node with NOT used twice"() {
        const b = query.enhance<Build>(new Build())
            .not((bp) => bp.withProvider("mybuild"))
            .not((bc) => bc.withCompareUrl("froggies"));
        const pathExpression = query.byExample(b);
        expect(pathExpression.expression).to.equal(
            `/Build()[not @provider='mybuild'][not @compareUrl='froggies']`);
    }

    @test public "node with related node and simple custom predicate"() {
        const b = query.enhance<Build>(new Build())
            .withProvider("mybuild").withRepo(new Repo())
            .withCustomPredicate("[@name='amy']");
        const pathExpression = query.byExample(b);
        expect(pathExpression.expression).to.equal(
            `/Build()[@provider='${b.provider}'][/repo::Repo()][@name='amy']`);
    }

    @test public "node with related node but in match"() {
        const b = new Build().withProvider("mybuild")
            .withRepo(query.match(new Repo()));
        const pathExpression = query.byExample(b);
        expect(pathExpression.expression).to.equal(
            `/Build()[@provider='${b.provider}']/repo::Repo()`);
    }

    @test public "node with related node but optional"() {
        const b = query.enhance<Build>(new Build())
            .withProvider("mybuild")
            .optional((br) => br.withRepo(new Repo()));
        const pathExpression = query.byExample(b);
        expect(pathExpression.expression).to.equal(
            `/Build()[@provider='${b.provider}'][/repo::Repo()]?`);
    }

    @test public "node with related node in array"() {
        const message = "Fixed all the bugs";
        const pr = new PullRequest().addCommits(new Commit().withMessage(message));
        const pathExpression = query.byExample(pr);
        expect(pathExpression.expression).to.equal(
            `/PullRequest()[/commits::Commit()[@message='${message}']]`);
    }

    @test public "handle externalized branch"() {
        const pathExpression = query.forRoot(
            new Commit()
                .addDeltas(new Delta())
                .withRepo(FleshedOutRepo),
        );
        expect(pathExpression.expression).to.equal(
            `/Commit()[/deltas::Delta()][/repo::Repo()[/org::Org()]]`);
    }
}

// Example of using external function to build
const FleshedOutRepo =
    new Repo()
        .withOrg(new Org());
