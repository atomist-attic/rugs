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

import { Parameter, ResponseHandler, Tags } from "@atomist/rug/operations/Decorators";
import { HandlerContext, HandleResponse, Message, Plan, Respondable, Response } from "@atomist/rug/operations/Handlers";
import { renderError, renderSuccess } from "./messages/MessageRendering";

@ResponseHandler("GenericErrorHandler", "Displays an error in chat")
@Tags("errors")
class GenericErrorHandler implements HandleResponse<any> {

    @Parameter({ description: "Error prefix", pattern: "@any", required: false })
    public msg: string;

    @Parameter({ description: "Correlation ID", pattern: "@any", required: false })
    public corrid: string;

    public handle(response: Response<any>): Plan {
        const body = response.body() != null ? "(" + response.body() + ")" : "";
        const msg = this.msg === undefined ? "" : this.msg;
        return new Plan().add(new Message(renderError(`${msg}${response.msg()}${body}`, this.corrid)));
    }
}

export function handleErrors(res: Respondable<any>, params?: any): Respondable<any> {
    res.onError = { kind: "respond", name: "GenericErrorHandler", parameters: params };
    return res;
}

@ResponseHandler("GenericSuccessHandler", "Displays a success message in chat")
@Tags("success")
class GenericSuccessHandler implements HandleResponse<any> {

    @Parameter({ description: "Success msg", pattern: "@any" })
    public msg: string;

    public handle(response: Response<any>): Plan {
        // TODO - render the body?
        return new Plan().add(new Message(renderSuccess(`${this.msg}`)));
    }
}

export function handleSuccess(res: Respondable<any>, msg: string): Respondable<any> {
    res.onSuccess = { kind: "respond", name: "GenericSuccessHandler", parameters: { msg } };
    return res;
}

/**
 * Wrap with error and/or success handlers.
 */
export function wrap(res: Respondable<any>, success: string, params?: any): Respondable<any> {
    const withErrors = handleErrors(res, params);
    return handleSuccess(withErrors, success);
}

export { GenericErrorHandler, GenericSuccessHandler };
