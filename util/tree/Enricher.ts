import * as query from "./QueryByExample"

//type EnricherReturn<T> = Enriched<T> & T

/**
 * Mixin that adds the ability to perform
 * logical operations and add custom predicates to nodes
 */
export class Enriched<T> {

  $predicate: string = "";

  constructor(private $target) {}

  addPredicate(predicate: string): Enriched<T> & T {
    console.log(`Added predicate ${predicate} to ${JSON.stringify(this.$target)}`);
    this.$predicate += predicate;
    return this as any;
  }

  not(what: (T) => void): Enriched<T> & T {
      let clone = enhance(this.$target);
      what(clone);
      let pred = query.byExampleString(clone);
      this.addPredicate(pred.replace("[", "[not "));
      return this as any;
  }

  or(l: (T) => void, r: (T) => void): Enriched<T> & T {
      let leftClone = enhance(this.$target);
      let rightClone = enhance(this.$target);
      l(leftClone);
      r(rightClone);
      let pred = 
        query.byExampleString(leftClone).replace("]", " or ") + 
        query.byExampleString(rightClone).replace("[", "");
      console.log(`Predicate is [${pred}]`);
      this.addPredicate(pred);
      return this as any;
  }
  
}

/**
 * Return a proxy wrapping the given node to return
 * a mixin proxy.
 * @param base target
 */
export function enhance<T>(base): Enriched<T> & T {
   let enricher = new Enriched(base) as any;
    for (let id in base) {
        enricher[id] = base[id];
    }
    return enricher;
}