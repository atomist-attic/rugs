import { suite, test, slow, timeout, skip, only } from "mocha-typescript";

import {expect} from "chai"

import {hello} from "../../../util/First"

import {PathExpression} from "@atomist/rug/tree/PathExpression"

@suite class QueryByExample {

    @test "path expression should contain string"() {
      let myString = "my/path"
      let pe = new PathExpression(myString)
      console.log(pe)
      expect(pe.expression).to.equal(myString)
    }
}
