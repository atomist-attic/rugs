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
