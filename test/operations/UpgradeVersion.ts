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

import {ProjectEditor,EditProject} from '@atomist/rug/operations/ProjectEditor'
import {Project, Xml} from '@atomist/rug/model/Core'
import { Pattern, RugOperation } from '@atomist/rug/operations/RugOperation'
import {PathExpression,PathExpressionEngine,TextTreeNode} from '@atomist/rug/tree/PathExpression'
import { Editor, Tags, Parameter } from '@atomist/rug/operations/Decorators'

@Editor("UpgradeVersion", "Find and upgrade POM version")
export class UpgradeVersion implements EditProject {

    @Parameter({pattern: Pattern.group_id, description: "Group to match"})
    group: string

    @Parameter({pattern: Pattern.artifact_id, description: "Artifact to match"})
    artifact: string

    @Parameter({pattern: Pattern.semantic_version, description: "Version to upgrade to"})
    desiredVersion: string
    
    edit(project: Project) {    

        let eng: PathExpressionEngine = project.context.pathExpressionEngine;
        let search = "some/path/expression"
        eng.with<TextTreeNode>(project, search, version => {
            if (version.value() != this.desiredVersion) {
                version.update(this.desiredVersion)
            }
        })
    }
}

export const uv = new UpgradeVersion();