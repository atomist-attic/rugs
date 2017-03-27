import { suite, test, slow, timeout, skip, only } from "mocha-typescript";

import {expect} from "chai"

import * as query from "../../../util/tree/QueryByExample"

import {Build} from "@atomist/cortex/stub/Build"
import {Repo} from "@atomist/cortex/stub/Repo"

import {PathExpression} from "@atomist/rug/tree/PathExpression"

@suite class QueryByExample {

   @test "simple node"() {
      let b = new Build
      let pathExpression = query.byExample(b)
      expect(pathExpression.expression).to.equal("/Build()")
    }

    @test "node with simple property predicate"() {
      let b = new Build().withBuildType("mybuild")
      let pathExpression = query.byExample(b)
      expect(pathExpression.expression).to.equal(`/Build()[@buildType='${b.buildType()}']`)
    }

    @test "node with two simple property predicates"() {
      let b = new Build().withBuildType("mybuild").withStatus("failed")
      let pathExpression = query.byExample(b)
      expect(pathExpression.expression).to.equal(`/Build()[@buildType='${b.buildType()}'][@status='${b.status()}']`)
    }

    @test "node with related node"() {
      let b = new Build().withBuildType("mybuild").withOn(new Repo())
      let pathExpression = query.byExample(b)
      expect(pathExpression.expression).to.equal(`/Build()[@buildType='${b.buildType()}'][/on::Repo()]`)
    }

    @test "node with related node but in match"() {
      let b = new Build().withBuildType("mybuild").withOn(query.match(new Repo()))
      let pathExpression = query.byExample(b)
      expect(pathExpression.expression).to.equal(`/Build()[@buildType='${b.buildType()}']/on::Repo()`)
    }
}
