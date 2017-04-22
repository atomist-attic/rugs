import { only, skip, slow, suite, test, timeout } from "mocha-typescript";

import { expect } from "chai";

import { structurallyEquivalent, DeemEquivalent, ifNamed } from "../../ast/TreeDiff";
import { ContainerTreeNode, TerminalNode } from "../../ast/TreeNodes"
import * as filter from "../../ast/TreeFilter"
import * as select from "../../ast/NodeFilter"


import { Edit } from "@atomist/rug/operations/Handlers";
import { PathExpression } from "@atomist/rug/tree/PathExpression";

@suite class TreeFilterTest {

    @test public "filter empty tree"() {
        const t1 = new ContainerTreeNode("empty");
        const t2 = filter.filter(t1, select.named([ "thing"]));
        expect(structurallyEquivalent(t1, t2)).to.equal(true);
    }

    @test public "filter out single node"() {
        const child = new TerminalNode("kid", "content");
        const t1 = new ContainerTreeNode("t1", [ child ]);
        const empty = new ContainerTreeNode("t1");

        const filtered = filter.filter(t1, select.named([ "t1"]));
        expect(structurallyEquivalent(t1, filtered)).to.equal(false);
        expect(structurallyEquivalent(empty, filtered)).to.equal(true);
    }

    @test public "not filter out single node"() {
        const child = new TerminalNode("kid", "content");
        const t1 = new ContainerTreeNode("t1", [ child ]);
        const empty = new ContainerTreeNode("t1");
        const filtered = filter.filter(t1, select.named([ "t1", "kid"]));
        expect(structurallyEquivalent(t1, filtered)).to.equal(true);
    }

    @test public "filter out great grandkids"() {
        const grandchild = new TerminalNode("grandkid", "content1");
        const child = new ContainerTreeNode("kid", [ grandchild ]);
        const t1 = new ContainerTreeNode("t1", [ child ]);
        const filtered = filter.filter(t1, select.named([ "t1", "kid"]));
        //console.log(`Result=${JSON.stringify(filtered)}`);
        expect(structurallyEquivalent(t1, filtered)).to.equal(false);
    }

    @test public "not filter out great grandkids"() {
        const grandchild = new TerminalNode("grandkid", "grandkid_content");
        const child = new ContainerTreeNode("kid", [ grandchild ]);
        const t1 = new ContainerTreeNode("t1", [ child ]);
        const filtered = filter.filter(t1, select.named([ "t1", "kid", "grandkid"]));
        expect(structurallyEquivalent(t1, filtered)).to.equal(true);
    }

}
