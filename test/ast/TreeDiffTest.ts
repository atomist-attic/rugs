import { only, skip, slow, suite, test, timeout } from "mocha-typescript";

import { expect } from "chai";

import { structurallyEquivalent, DeemEquivalent, ifNamed } from "../../ast/TreeDiff";
import { ContainerTreeNode, TerminalNode } from "../../ast/TreeNodes"

import { Edit } from "@atomist/rug/operations/Handlers";
import { PathExpression } from "@atomist/rug/tree/PathExpression";

@suite class TreeDiffTest {

    @test public "diff identical tree"() {
        const t1 = new ContainerTreeNode("empty");
        const t2 = t1;
        expect(structurallyEquivalent(t1, t2)).to.equal(true);
    }

    @test public "diff equal tree"() {
        const t1 = new ContainerTreeNode("empty");
        const t2 = new ContainerTreeNode("empty");
        expect(structurallyEquivalent(t1, t2)).to.equal(true);
    }

    @test public "diff add single node"() {
        const child = new ContainerTreeNode("kid");
        const t1 = new ContainerTreeNode("t1");
        const t2 = new ContainerTreeNode("t1", [ child ]);
        expect(structurallyEquivalent(t1, t2)).to.equal(false);
    }

    @test public "diff add single node in each"() {
        const child1 = new ContainerTreeNode("kid");
        const child2 = new ContainerTreeNode("kid");
        const t1 = new ContainerTreeNode("t1", [ child1 ]);
        const t2 = new ContainerTreeNode("t1", [ child2 ]);
        expect(structurallyEquivalent(t1, t2)).to.equal(true);
    }

    @test public "diff add single node in each and extra in one"() {
        const child1 = new ContainerTreeNode("kid");
        const grandchild = new TerminalNode("toddler", "Bart");
        const child2 = new ContainerTreeNode("kid", [ grandchild ]);
        const t1 = new ContainerTreeNode("t1", [ child1 ]);
        const t2 = new ContainerTreeNode("t1", [ child2 ]);
        expect(structurallyEquivalent(t1, t2)).to.equal(false);
    }
}
