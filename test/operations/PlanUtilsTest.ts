import { suite, test, slow, timeout, skip, only } from "mocha-typescript";

import {expect} from "chai"

import * as ut from "../../operations/PlanUtils"

import {UpgradeVersion} from "./UpgradeVersion"

import {PathExpression} from "@atomist/rug/tree/PathExpression"
import {Edit} from "@atomist/rug/operations/Handlers"

@suite class PlanUtilsTest {

   @test "edit with simple"() {
     let uv = new UpgradeVersion
     let projectName = "myproject"
     uv.group = "Beatles"
     uv.artifact = "foobar"
     uv.desiredVersion = "3.0.4"
      let e: Edit = ut.editWith(projectName, uv)
      expect(e.kind).to.equal("edit")
      expect(e.name).to.equal("UpgradeVersion")
      expect(e.project).to.equal(projectName)
      let params = e.parameters as any
      expect(params.group).to.equal(uv.group)
      expect(params.artifact).to.equal(uv.artifact)
      expect(params.desiredVersion).to.equal(uv.desiredVersion)
    }
}
