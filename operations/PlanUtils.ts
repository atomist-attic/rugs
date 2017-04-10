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

import { Project } from "@atomist/rug/model/Project";
import { Edit, Execute, HandleCommand, Instruction, Respondable } from "@atomist/rug/operations/Handlers";
import { EditProject, ProjectEditor } from "@atomist/rug/operations/ProjectEditor";

/**
 * Build a plan instruction for the given decorated
 * editor, extracting its present property values, which
 * follow a convention, with names like __name
 * @param p project or name of project to edit
 * @param ed editor to use
 */
export function editWith(p: Project | string, ed: EditProject | ProjectEditor): Edit {
    const obj = instruction(ed, "edit");
    const proj = p as any;
    const projectKey = "project";
    obj[projectKey] = proj.name ? proj.name() : p;
    return obj as Edit;
}

export function handleCommand(ed: HandleCommand): Instruction<"command"> {
    return instruction(ed, "command");
}

/**
 * Emit an instruction for the given decorated operation type
 * @param op operation to emit instruction for
 * @param kind kind of the instruction, such as "edit"
 */
function instruction(op, kind) {
    const params = {};
    for (const param of op.__parameters) {
        params[param.name] = op[param.name];
    }
    return {
        kind,
        name: op.__name,
        parameters: params,
    };
}
/**
 * Build an 'execute' Rug Function
 * @param name Rug Function to call
 * @param params any params, if any
 */
export function execute(name: string, params?: any): Respondable<Execute> {
    return { instruction: { kind: "execute", name, parameters: params } };
}
