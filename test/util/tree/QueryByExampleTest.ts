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

  @test "node with related node"() {
    let b = new Build().withProvider("mybuild").withRepo(new Repo())
    let pathExpression = query.byExample(b)
    expect(pathExpression.expression).to.equal(
      `/Build()[@provider='${b.provider}'][/repo::Repo()]`)
  }

  @test "node with related node and simple custom predicate"() {
    let b = query.enhance(new Build())
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
    let b = new Build().withProvider("mybuild")
      .withRepo(query.optional(new Repo()))
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