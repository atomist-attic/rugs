import { suite, test, slow, timeout, skip, only } from "mocha-typescript";

import {expect} from "chai"

import * as query from "../../util/tree/QueryByExample"

import {PathExpression} from "@atomist/rug/tree/PathExpression"

@suite class PlanUtilsTest {

   @test "plan utils"() {
      let myString = "my/path"
      let pe = new PathExpression(myString)
      expect(pe.expression).to.equal(myString)
    }
}
