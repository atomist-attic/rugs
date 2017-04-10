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
    let b = new Build().withType("mybuild")
    let pathExpression = query.byExample(b)
    expect(pathExpression.expression).to.equal(`/Build()[@type='${b.type()}']`)
  }

  @test "node with custom predicate"() {
    let pred = "[@foo='bar']"
    let b = query.enhance<Build>(new Build())
      .addPredicate(pred)
      .withType("mybuild")

    // Get past visibility rules by detyping
    expect((<any>b).$customPredicate).to.equal(pred)
    let pathExpression = query.byExample(b)
    expect(pathExpression.expression).to.equal(
      `/Build()[@type='${b.type()}']${pred}`
    )
  }

  @test "node with not simple property predicate"() {
    let b = query.enhance<Build>(new Build())
      .withType("mybuild")
      .not(b => b.withStatus("failed"))
    let pathExpression = query.byExample(b)
    expect(pathExpression.expression).to.equal(
      `/Build()[@type='mybuild'][not @status='failed']`)
  }

  @test "node with not complex property predicate"() {
    let b = query.enhance<Build>(new Build())
      .withType("mybuild")
      .not(b => b.withOn(new Repo()))
      
    let pathExpression = query.byExample(b)
    expect(pathExpression.expression).to.equal(
      `/Build()[@type='mybuild'][not /on::Repo()]`)
  }

  @test "node with two simple property predicates"() {
    let b = new Build().withType("mybuild").withStatus("failed")
    let pathExpression = query.byExample(b)
    expect(pathExpression.expression).to.equal(
      `/Build()[@status='${b.status()}'][@type='${b.type()}']`)
  }

  @test "node with two ORed simple property predicates"() {
    let b = query.enhance(new Build()).
      or(b => b.withType("mybuild"), b => b.withStatus("failed"))
    let pathExpression = query.byExample(b)
    expect(pathExpression.expression).to.equal(
      `/Build()[@type='mybuild' or @status='failed']`)
  }

  @test "node with two ORed simple property predicates and NOT complex structure"() {
    let b = query.enhance(new Build())
      .or(b => b.withType("mybuild"), b => b.withStatus("failed"))
      .not(b => b.withOn(new Repo().withName("rugs")))
    let pathExpression = query.byExample(b)
    expect(pathExpression.expression).to.equal(
      `/Build()[@type='mybuild' or @status='failed'][not /on::Repo()[@name='rugs']]`)
  }

  @test "node with two ORed simple property predicates and NOT complex structure and simple property"() {
    let b = query.enhance<Build>(new Build())
      .or(b => b.withType("mybuild"), b => b.withStatus("failed"))
      .not(b => b.withOn(new Repo().withName("rugs")))
      .withBuildUrl("foobar")
    let pathExpression = query.byExample(b)
    expect(pathExpression.expression).to.equal(
      `/Build()[@buildUrl='foobar'][@type='mybuild' or @status='failed'][not /on::Repo()[@name='rugs']]`)
  }

  @test "node with related node"() {
    let b = new Build().withType("mybuild").withOn(new Repo())
    let pathExpression = query.byExample(b)
    expect(pathExpression.expression).to.equal(`/Build()[@type='${b.type()}'][/on::Repo()]`)
  }

  @test "node with related node conditional"() {
    let b = query.enhance<Build>(new Build())
      .withType("mybuild")
      .optional(b => b.withOn(new Repo()))
    let pathExpression = query.byExample(b)
    expect(pathExpression.expression).to.equal(`/Build()[@type='${b.type()}'][/on::Repo()]?`)
  }

  @test "node with related node but in match"() {
    let b = new Build().withType("mybuild").withOn(query.match(new Repo()))
    let pathExpression = query.byExample(b)
    expect(pathExpression.expression).to.equal(
      `/Build()[@type='${b.type()}']/on::Repo()`)
  }

  @test "node with related node in array"() {
    let message = "Fixed all the bugs"
    let pr = new PullRequest().addContains(new Commit().withMessage(message));
    let pathExpression = query.byExample(pr)
    expect(pathExpression.expression).to.equal(
      `/PullRequest()[/contains::Commit()[@message='${message}']]`)
  }

  @test "handle externalized branch"() {
    let pathExpression = query.forRoot(
      new Commit()
        .addIncludes(new Delta())
        .withOn(FleshedOutRepo)
    )
    expect(pathExpression.expression).to.equal(
      `/Commit()[/includes::Delta()][/on::Repo()[/ownedBy::Org()]]`)
  }
}

// Example of using external function to build
const FleshedOutRepo =
  new Repo()
    .withOwnedBy(
    new Org()
    );


