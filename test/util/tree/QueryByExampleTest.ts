import { suite, test, slow, timeout, skip, only } from "mocha-typescript"

import { expect } from "chai"

import * as query from "../../../util/tree/QueryByExample"

import { Build } from "@atomist/cortex/stub/Build"
import { Repo } from "@atomist/cortex/stub/Repo"
import { PullRequest } from "@atomist/cortex/stub/PullRequest"
import { Commit } from "@atomist/cortex/stub/Commit"

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

    @test "node with two simple property predicates"() {
      let b = new Build().withType("mybuild").withStatus("failed")
      let pathExpression = query.byExample(b)
      expect(pathExpression.expression).to.equal(`/Build()[@status='${b.status()}'][@type='${b.type()}']`)
    }

    @test "node with related node"() {
      let b = new Build().withType("mybuild").withOn(new Repo())
      let pathExpression = query.byExample(b)
      expect(pathExpression.expression).to.equal(`/Build()[@type='${b.type()}'][/on::Repo()]`)
    }

    @test "node with related node but in match"() {
      let b = new Build().withType("mybuild").withOn(query.match(new Repo()))
      let pathExpression = query.byExample(b)
      expect(pathExpression.expression).to.equal(
        `/Build()[@type='${b.type()}']/on::Repo()`)
    }

    @test "node with related node in array"() {
      let message = "Fixed all the bugs"
      let pr = new PR2().addContains(new Commit().withMessage(message));
      let pathExpression = query.byExample(pr)
      expect(pathExpression.expression).to.equal(
        `/PullRequest()[/contains::Commit()[@message='${message}']]`)
    }
}

// TODO this can go when we use latest version of stubs
class PR2 extends PullRequest {

  addContains(c: Commit): PullRequest {
    if (this.contains() === undefined) {
      return this.withContains([ c ]);
    }
    else {
      return this.withContains(this.contains().concat( [ c ]));
    }
  }

}