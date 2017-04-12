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

import { suite, test, slow, timeout, skip, only } from "mocha-typescript"

import { expect } from "chai"

import * as query from "../../../util/tree/QueryByExample"

import { Build } from "@atomist/cortex/stub/Build"
import { Repo } from "@atomist/cortex/stub/Repo"
import { PullRequest } from "@atomist/cortex/stub/PullRequest"
import { Commit } from "@atomist/cortex/stub/Commit"
import { Delta } from "@atomist/cortex/stub/Delta"
import { Org } from "@atomist/cortex/stub/Org"

import { PathExpression } from "@atomist/rug/tree/PathExpression"

@suite class QueryByExample {

  @test "simple node"() {
    let b = new Build
    let pathExpression = query.byExample(b)
    expect(pathExpression.expression).to.equal("/Build()")
  }

  @test "node with simple property predicate"() {
    let b = new Build().withProvider("mybuild")
    let pathExpression = query.byExample(b)
    expect(pathExpression.expression).to.equal(
      `/Build()[@provider='${b.provider}']`)
  }

  @test "node with two simple property predicates"() {
    let b = new Build().withProvider("mybuild").withStatus("failed")
    let pathExpression = query.byExample(b)
    expect(pathExpression.expression).to.equal(
      `/Build()[@provider='${b.provider}'][@status='${b.status}']`)
  }

  @test "node with two ORed simple property predicates"() {
    let b = query.enhance(new Build())
      .or(b => b.withProvider("mybuild"), b => b.withStatus("failed"))
    let pathExpression = query.byExample(b)
    expect(pathExpression.expression).to.equal(
      `/Build()[@provider='mybuild' or @status='failed']`)
  }

  @test "node with related node"() {
    let b = new Build().withProvider("mybuild").withRepo(new Repo())
    let pathExpression = query.byExample(b)
    expect(pathExpression.expression).to.equal(
      `/Build()[@provider='${b.provider}'][/repo::Repo()]`)
  }

  @test "node with simple property predicate NOT"() {
    let b = query.enhance(new Build())
      .not(b => b.withProvider("mybuild"))
    let pathExpression = query.byExample(b)
    expect(pathExpression.expression).to.equal(
      `/Build()[not @provider='mybuild']`)
  }

  @test "node with NOT used twice"() {
    let b = query.enhance<Build>(new Build())
      .not(b => b.withProvider("mybuild"))
      .not(b => b.withCompareUrl("froggies"))
    let pathExpression = query.byExample(b)
    expect(pathExpression.expression).to.equal(
      `/Build()[not @provider='mybuild'][not @compareUrl='froggies']`)
  }

  @test "node with related node and simple custom predicate"() {
    let b = query.enhance<Build>(new Build())
      .withProvider("mybuild").withRepo(new Repo())
      .withCustomPredicate("[@name='amy']")
    let pathExpression = query.byExample(b)
    expect(pathExpression.expression).to.equal(
      `/Build()[@provider='${b.provider}'][/repo::Repo()][@name='amy']`)
  }

  @test "node with related node but in match"() {
    let b = new Build().withProvider("mybuild")
      .withRepo(query.match(new Repo()))
    let pathExpression = query.byExample(b)
    expect(pathExpression.expression).to.equal(
      `/Build()[@provider='${b.provider}']/repo::Repo()`)
  }

  @test "node with related node but optional"() {
    let b = query.enhance<Build>(new Build())
      .withProvider("mybuild")
      .optional(b => b.withRepo(new Repo()))
    let pathExpression = query.byExample(b)
    expect(pathExpression.expression).to.equal(
      `/Build()[@provider='${b.provider}'][/repo::Repo()]?`)
  }

  @test "node with related node in array"() {
    let message = "Fixed all the bugs"
    let pr = new PullRequest().addCommits(new Commit().withMessage(message));
    let pathExpression = query.byExample(pr)
    expect(pathExpression.expression).to.equal(
      `/PullRequest()[/commits::Commit()[@message='${message}']]`)
  }

  @test "handle externalized branch"() {
    let pathExpression = query.forRoot(
      new Commit()
        .addDeltas(new Delta())
        .withRepo(FleshedOutRepo)
    )
    expect(pathExpression.expression).to.equal(
      `/Commit()[/deltas::Delta()][/repo::Repo()[/org::Org()]]`)
  }
}

// Example of using external function to build
const FleshedOutRepo =
  new Repo()
    .withOrg(new Org());