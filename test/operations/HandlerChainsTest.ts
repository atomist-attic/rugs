import { HandlerContext, Response } from "@atomist/rug/operations/Handlers";
import { assert, expect } from "chai";
import {
    only,
    skip,
    slow,
    suite,
    test,
    timeout,
} from "mocha-typescript";
import {
    ChainedInstruction,
    GeneratedCommandResponseHandler,
    HandlerChainDescriptor,
    ResponseChainingCommandHandler,
} from "../../operations/HandlerChains";

@suite class HandlerChainsTest {
    @test public "we can generate simple handler chains for on success"() {
        const testFlow: HandlerChainDescriptor = {
            handle: (r: Response<any>): ChainedInstruction => {
                return new ChainedInstruction(
                    {
                        kind: "execute",
                        name: "test",
                    },
                );
            },
        };
        const main = new SimpleCommandHandler(testFlow).buildHandlerChain();
        const com = main[1];
        if (com instanceof SimpleCommandHandler) {
            const plan = com.handle(null);
            expect(plan.instructions.length).to.equals(1);

            assert.deepEqual(plan.instructions[0].instruction, {
                kind: "execute",
                name: "http",
            });
            expect(plan.instructions[0].onSuccess).to.eql({
                kind: "respond",
                name: "RootSuccessHandler",
                parameters: {
                    owner: "testowner",
                },
            });
            expect(plan.instructions[0].onError).to.eql(undefined);
        } else {
            throw Error(`Expecting to find a command handler`);
        }
        const res = main[0];
        if (res instanceof GeneratedCommandResponseHandler) {
            // tslint:disable-next-line:no-string-literal
            assert.equal(res["__name"], "RootSuccessHandler");
            // tslint:disable-next-line:no-string-literal
            assert.equal(res["__kind"], "response-handler");
            // tslint:disable-next-line:no-string-literal
            assert.equal(res["__parameters"], undefined);
        } else {
            throw new Error(`Expecting to find a GeneratedCommandResponseHandler`);
        }
    }
    @test public "onAny populates success/error handlers"() {
        const testFlow: HandlerChainDescriptor = {
            handle: (r: Response<any>): ChainedInstruction => {
                return new ChainedInstruction(
                    {
                        kind: "execute",
                        name: "test",
                    },
                );
            },
            onError: {
                handle: (r: Response<any>): ChainedInstruction => {
                    return new ChainedInstruction(
                        {
                            kind: "execute",
                            name: "https",
                        },
                    );
                },
            },
        };
        const main = new SimpleCommandHandler(undefined, undefined, testFlow).buildHandlerChain();
        assert.equal(main.length, 4);
        const com = main[3];
        if (com instanceof SimpleCommandHandler) {
            const plan = com.handle(null);
            expect(plan.instructions[0].onSuccess).to.eql({
                kind: "respond",
                name: "RootSuccessHandler",
                parameters: {
                    owner: "testowner",
                },
            });
        } else {
            throw Error(`Expecting to find a command handler`);
        }
        const resErr = main[1];
        if (resErr instanceof GeneratedCommandResponseHandler) {
            assert.equal(resErr.impl, testFlow.handle);
        } else {
            throw new Error("Expected a response handler");
        }
        const resSuc = main[0];
        if (resSuc instanceof GeneratedCommandResponseHandler) {
            assert.equal(resSuc.impl, testFlow.handle);
        } else {
            throw new Error("Expected a response handler");
        }
        const resErr2 = main[2];
        if (resErr2 instanceof GeneratedCommandResponseHandler) {
            assert.equal(resErr2.impl, testFlow.onError.handle);
        } else {
            throw new Error("Expected a response handler");
        }
    }

    @test public "defaultHandler is used if specified"() {
        const testFlow: HandlerChainDescriptor = {
            handle: (r: Response<any>): ChainedInstruction => {
                return new ChainedInstruction(
                    {
                        kind: "execute",
                        name: "test",
                    },
                );
            },
            onSuccess: {
                handle: (r: Response<any>): ChainedInstruction => {
                    return new ChainedInstruction(
                        {
                            kind: "execute",
                            name: "https",
                        },
                    );
                },
            },
        };
        const defaultHandler = (r: Response<any>): ChainedInstruction => {
            return new ChainedInstruction(
                {
                    kind: "execute",
                    name: "default",
                },
            );
        };
        const main =
            new SimpleCommandHandler(undefined, undefined, testFlow)
                .withDefaultErrorHandler(defaultHandler)
                .buildHandlerChain();
        assert.equal(main.length, 5);
        const err = main[0];
        if (err instanceof GeneratedCommandResponseHandler) {
            assert.equal(err.impl, defaultHandler);
        } else {
            throw new Error("Expected a response handler");
        }
    }
}

class SimpleCommandHandler extends ResponseChainingCommandHandler {

    public init(ctx: HandlerContext): ChainedInstruction {
        return new ChainedInstruction(
            {
                kind: "execute",
                name: "http",
            }
            , { owner: "testowner" });
    }
}
