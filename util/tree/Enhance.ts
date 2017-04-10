import * as query from "./QueryByExample"

type EnricherReturn<T> = Enriched<T> & T

/**
 * Mixin that adds the ability to perform
 * logical operations and add custom predicates to nodes
 */
export class Enriched<T> {

  private $customPredicate: string = "";

  constructor(private $target) {}
  
  addPredicate(predicate: string): EnricherReturn<T> {
    //console.log(`Added predicate ${predicate} to ${JSON.stringify(this.$target)}`);
    this.$customPredicate += predicate;
    return this as any;
  }

  // We handle NOT and OR by cloning the present node
  // and running functions to get branches we can add as custom predicates

  not(what: (T) => void): EnricherReturn<T> {
      let clone = enhance(this.$target);
      what(clone);
      let pred = query.byExampleString(clone);
      this.addPredicate(pred.replace("[", "[not "));
      return this as any;
  }

  or(l: (T) => void, r: (T) => void): EnricherReturn<T> {
      let leftClone = enhance(this.$target);
      let rightClone = enhance(this.$target);
      l(leftClone);
      r(rightClone);
      let pred = 
        query.byExampleString(leftClone).replace("]", " or ") + 
        query.byExampleString(rightClone).replace("[", "");
      this.addPredicate(pred);
      return this as any;
  }
  
}

/**
 * Return a proxy wrapping the given node to return
 * a mixin proxy.
 * @param base target
 */
export function enhance<T>(base): EnricherReturn<T> {
   let enricher = new Enriched(base) as any;
    for (let id in base) {
        enricher[id] = base[id];
    }
    return enricher;
}