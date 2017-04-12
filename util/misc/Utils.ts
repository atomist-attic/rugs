

/**
 * Clone an object, without ES6.
 * @param a 
 */
export function clone(a): any {
    var cloneObj = new a.constructor();
    for (var attribut in this) {
        if (typeof this[attribut] === "object") {
            cloneObj[attribut] = this.clone();
        } 
        else {
            cloneObj[attribut] = this[attribut];
        }
    }
    return cloneObj;
}