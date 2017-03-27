

import { suite, test, slow, timeout, skip, only } from "mocha-typescript";

import {hello} from "../util/First"

@suite class Hello {
    @test "world"() {
      console.log(hello("Rod"))
    }
}
