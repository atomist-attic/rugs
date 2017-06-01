import {
    CommandPlan,
    CommandRespondable,
    HandleCommand,
    HandlerContext,
    HandleResponse,
    Instruction,
    Response,
} from "@atomist/rug/operations/Handlers";

import {
    declareResponseHandler,
    setScope,
} from "@atomist/rug/operations/Decorators";

/**
 * Implements the body of a generated Response Handler
 */
export type ChainedResponseHandler =
    (response?: Response<any>, params?: {}) => ChainedInstruction;

/**
 * A datastructure that describes how Handler Instructions and Response Handlers
 * can be chained together automatically by instances of the
 * ResponseChainingCommandHandler
 */
export interface HandlerChainDescriptor {
    handle: ChainedResponseHandler;
    onAny?: HandlerChainDescriptor;
    onSuccess?: HandlerChainDescriptor;
    onError?: HandlerChainDescriptor;
}

/**
 * Builder Pattern implementation to generate the
 * HandlerChainDescriptor datastructure
 */
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

/**
 * Wrapper around a normal Handler Instruction and any parameters to be passed
 * downstream any Response Handlers (if any)
 */
export class ChainedInstruction {
    constructor(public instruction: Instruction<any>, public params?: {}) { }
}

/**
 * Extend this class to have Instructions and Response Handlers automatically
 * generated from a HandlerChainDescriptor that describes your workflow.
 *
 * Currently only Instructions can be added to the CommandPlan, and only Response
 * Handlers can be used to respond to their success or failure. Message sending
 * is currently not supported.
 */
export abstract class ResponseChainingCommandHandler
    implements HandleCommand {

    private rootSuccessName: string = `RootSuccessHandler`;
    private rootErrorName: string = `RootErrorHandler`;
    private defaultErrorHandlerName: string = `DefaultErrorHandler`;
    private defaultErrorHandler: ChainedResponseHandler;
    private handlers: any[] = [];

    /**
     * In general, onSuccess or onAny should be passed in to make this Handler
     * useful.
     *
     * @param onSuccess handler chain to run if the root Instruction is successful
     * @param onError handler chain to run if the root Instruction fails
     * @param onAny handler chain to run onSuccess and on Error
     */
    public constructor(
        protected onSuccess?: HandlerChainDescriptor,
        protected onError?: HandlerChainDescriptor,
        protected onAny?: HandlerChainDescriptor) {
    }

    /**
     * Configure a default onError Response Handler to use if none already
     * set for that node in the workflow
     * @param defaultErrorHandler a ChainedResponseHandler to use onError
     */
    public withDefaultErrorHandler(defaultErrorHandler: ChainedResponseHandler): this {
        this.defaultErrorHandler = defaultErrorHandler;
        const handler = new GeneratedCommandResponseHandler(this.defaultErrorHandler, undefined, undefined);
        // tslint:disable-next-line:max-line-length
        const decorated = declareResponseHandler(handler, "Generated Default Error Handler", this.defaultErrorHandlerName);
        // hide from the CLI/Bot
        setScope(decorated, "archive");
        this.handlers.push(decorated);
        return this;
    }

    /**
     * Called by Rug to handle a command. It delegates to `init`
     * so that sub-classes can configure an initial Instruction to run
     * to kick of the workflow
     * @param ctx same context passed to all Command Handlers
     */
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

    /**
     * Implement this to start the handler chain
     * @param ctx same context passed to 'handle'
     */
    public abstract init(ctx: HandlerContext): ChainedInstruction;

    /**
     * Walks the HandlerChainDescriptor and generates an array of handlers
     * that can be exported and picked up by the Rug.
     */
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
    /**
     * Guts of the tree walking.
     * Currently we do _not_ use a cache to ensure
     * we don't generate duplicate response handlers.
     */
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
            setScope(decorated, "archive");
            this.handlers.push(decorated);
        }

        if (onError !== undefined) {
            const handler = new GeneratedCommandResponseHandler(chain.handle, nextOnSuccess, nextOnError);
            const decorated = declareResponseHandler(handler, "Generated Command Response Handler", onError);
            setScope(decorated, "archive");
            this.handlers.push(decorated);
        }

        this.walk(chain.onSuccess, nextOnSuccess, undefined);
        this.walk(chain.onError, undefined, nextOnError);
        this.walk(chain.onAny, nextOnSuccess, nextOnError);
    }
}

/**
 * Instances of this class are created by ResponseChainingCommandHandler
 * and wired up with the appropriate Instructions.
 *
 * In general, they are named in an automated way and are hidden from
 * the CLI/Bot
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
