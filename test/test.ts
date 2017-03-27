

import { suite, test, slow, timeout, skip, only } from "mocha-typescript";

import {expect} from "chai"

import {hello} from "../util/First"

import {PathExpression} from "@atomist/rug/tree/PathExpression"

@suite class Hello {
    @test "world"() {
      console.log(hello("Rod"))
    }

    @test "path expression"() {
      let myString = "my/path"
      let pe = new PathExpression(myString)
      console.log(pe)
      expect(pe.expression).to.equal(myString)
    }
}
