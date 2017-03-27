
import {PathExpression} from "@atomist/rug/tree/PathExpression"

export function hello(s: string) {
  let myString = "my/path"
  let pe = new PathExpression(myString)
  
  return "hello" + s
}
