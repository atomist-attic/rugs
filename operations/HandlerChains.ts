import {
    CommandPlan,
    CommandRespondable,
    HandleCommand,
    HandlerContext,
    HandleResponse,
    Instruction,
    Response,
} from "@atomist/rug/operations/Handlers";

export type ChainedResponseHandler =
    (response?: Response<any>, params?: {}) => ChainedInstruction;

export interface HandlerChainDescriptor {
    handle: ChainedResponseHandler;
    onAny?: HandlerChainDescriptor;
    onSuccess?: HandlerChainDescriptor;
    onError?: HandlerChainDescriptor;
}

export class HandlerChain {
    private any: HandlerChain;
    private success: HandlerChain;
    private error: HandlerChain;
    constructor(private handle: ChainedResponseHandler) { }

    public onAny(builder: HandlerChain): this {
        this.any = builder;
        return this;
    }
    public onSuccess(builder: HandlerChain): this {
        this.success = builder;
        return this;
    }
    public onError(builder: HandlerChain): this {
        this.error = builder;
        return this;
    }
    public build(): HandlerChainDescriptor {
        const chain: HandlerChainDescriptor = { handle: this.handle };
        if (this.any !== undefined) {
            chain.onAny = this.any.build();
        }
        if (this.success !== undefined) {
            chain.onSuccess = this.success.build();
        }
        if (this.error !== undefined) {
            chain.onError = this.error.build();
        }
        return chain;
    }
}
export class ChainedInstruction {
    constructor(public instruction: Instruction<any>, public params?: {}) { }
}

export abstract class ResponseChainingCommandHandler
    implements HandleCommand {

    private rootSuccessName: string = `RootSuccessHandler`;
    private rootErrorName: string = `RootErrorHandler`;
    private defaultErrorHandlerName: string = `DefaultErrorHandler`;
    private defaultErrorHandler: ChainedResponseHandler;
    private handlers: Array<HandleResponse<any> | HandleCommand> = [];

    public constructor(
        protected onSuccess?: HandlerChainDescriptor,
        protected onError?: HandlerChainDescriptor,
        protected onAny?: HandlerChainDescriptor) {
    }

    public withDefaultErrorHandler(defaultErrorHandler: ChainedResponseHandler): this {
        this.defaultErrorHandler = defaultErrorHandler;
        const handler = new GeneratedCommandResponseHandler(this.defaultErrorHandler, undefined, undefined);
        // tslint:disable-next-line:max-line-length
        const decorated = declareResponseHandler(handler, "Generated Default Error Handler", this.defaultErrorHandlerName);
        this.handlers.push(decorated);
        return this;
    }

    public handle(ctx: HandlerContext): CommandPlan {
        const plan = new CommandPlan();
        const root: ChainedInstruction = this.init(ctx);
        const respondable: CommandRespondable<any> = {
            instruction: root.instruction,
        };

        if (this.onSuccess !== undefined || this.onAny !== undefined) {
            respondable.onSuccess = {
                kind: "respond",
                name: this.rootSuccessName,
                parameters: root.params,
            };
        }

        if (this.onError !== undefined || this.onAny !== undefined) {
            respondable.onError = {
                kind: "respond",
                name: this.rootErrorName,
                parameters: root.params,
            };
        }
        if (respondable.onError === undefined && this.onAny !== undefined && this.defaultErrorHandler !== undefined) {
            respondable.onError = {
                kind: "respond",
                name: this.defaultErrorHandlerName,
                parameters: root.params,
            };
        }
        plan.add(respondable);
        return plan;
    }
    public abstract init(ctx: HandlerContext): ChainedInstruction;

    public buildHandlerChain(): Array<HandleResponse<any> | HandleCommand> {

        if (this.onAny !== undefined && (this.onSuccess !== undefined || this.onError !== undefined)) {
            throw new Error("onAny and an onSuccess/onError handler have been defined");
        }

        // walk the three trees
        this.walk(this.onAny, this.rootSuccessName, this.rootErrorName);
        this.walk(this.onError, undefined, this.rootErrorName);
        this.walk(this.onSuccess, this.rootSuccessName, undefined);

        // make sure this handler itself is registered
        this.handlers.push(this);
        return this.handlers;
    }

    private walk(
        chain: HandlerChainDescriptor,
        onSuccess?: string,
        onError?: string) {

        let nextOnSuccess: string;
        let nextOnError: string;

        if (chain === undefined) {
            return;
        }

        if (chain.onSuccess !== undefined || chain.onAny !== undefined) {
            nextOnSuccess = `GeneratedSuccessResponseHandler-${this.handlers.length}`;
        }

        if (chain.onError !== undefined || chain.onAny !== undefined) {
            nextOnError = `GeneratedErrorResponseHandler-${this.handlers.length}`;
        } else if (this.defaultErrorHandler !== undefined) {
            nextOnError = this.defaultErrorHandlerName;
        }

        if (onSuccess !== undefined) {
            const handler = new GeneratedCommandResponseHandler(chain.handle, nextOnSuccess, nextOnError);
            const decorated = declareResponseHandler(handler, "Generated Command Response Handler", onSuccess);
            this.handlers.push(decorated);
        }

        if (onError !== undefined) {
            const handler = new GeneratedCommandResponseHandler(chain.handle, nextOnSuccess, nextOnError);
            const decorated = declareResponseHandler(handler, "Generated Command Response Handler", onError);
            this.handlers.push(decorated);
        }

        this.walk(chain.onSuccess, nextOnSuccess, undefined);
        this.walk(chain.onError, undefined, nextOnError);
        this.walk(chain.onAny, nextOnSuccess, nextOnError);
    }
}

/**
 * Walk the chain, creating and linking all the response handlers
 */

export class GeneratedCommandResponseHandler implements HandleResponse<any> {

    constructor(
        public impl: ChainedResponseHandler,
        public onSuccess?: string,
        public onError?: string) { }

    public handle(response: Response<any>): CommandPlan {
        const plan = new CommandPlan();

        // filter out stuff from this that aren't parameters
        const params: { [index: string]: string } = {};
        const that = this as any;
        // tslint:disable-next-line:forin
        for (const k in this) {
            if (that.hasOwnProperty(k)) {
                params[k] = that[k];
            }
        }
        const chainedInstruction = this.impl.call(this, response, params) as ChainedInstruction;
        const respondable = {
            instruction: chainedInstruction.instruction,
        } as CommandRespondable<any>;

        if (this.onSuccess !== undefined) {
            respondable.onSuccess = {
                kind: "respond",
                name: this.onSuccess,
                parameters: chainedInstruction.params,
            };
        }

        if (this.onError !== undefined) {
            respondable.onError = {
                kind: "respond",
                name: this.onError,
                parameters: chainedInstruction.params,
            };
        }

        plan.add(respondable);
        return plan;
    }
}

// copied from rug master until it's released

export function declareResponseHandler(
    obj: HandleResponse<any>, description: string, name?: string): HandleResponse<any> {
    declareRug(obj, "response-handler", description, name);
    return obj;
}

type RugKind = "editor" | "generator" | "command-handler" | "response-handler" | "event-handler";

function declareRug(obj: any, kind: RugKind, description: string, name?: string) {
    if (name === undefined) {
        set_metadata(obj, "__description", description);
    } else {
        set_metadata(obj, "__description", description);
        set_metadata(obj, "__name", name);
    }
    set_metadata(obj, "__kind", kind);
}
function set_metadata(obj: any, key: string, value: any) {
    let target = obj;
    if (obj.prototype !== undefined) {
        // should only be true for class Decorators
        target = obj.prototype;
    }
    Object.defineProperty(target, key,
        {
            value,
            writable: false,
            enumerable: false,
            configurable: false,
        });
}

// end: copied from rug master until it's released
