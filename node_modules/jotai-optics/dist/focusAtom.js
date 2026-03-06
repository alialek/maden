/* eslint-disable @typescript-eslint/no-explicit-any */
import { atom } from 'jotai/vanilla';
import * as O from 'optics-ts';
const getCached = (c, m, k) => (m.has(k) ? m : m.set(k, c())).get(k);
const cache1 = new WeakMap();
const memo2 = (create, dep1, dep2) => {
    const cache2 = getCached(() => new WeakMap(), cache1, dep1);
    return getCached(create, cache2, dep2);
};
const isFunction = (x) => typeof x === 'function';
// Implementation
export function focusAtom(baseAtom, callback) {
    return memo2(() => {
        const focus = callback(O.optic());
        const derivedAtom = atom((get) => {
            const base = get(baseAtom);
            return base instanceof Promise
                ? base.then((v) => getValueUsingOptic(focus, v))
                : getValueUsingOptic(focus, base);
        }, (get, set, update) => {
            const newValueProducer = isFunction(update)
                ? O.modify(focus)(update)
                : O.set(focus)(update);
            const base = get(baseAtom);
            return set(baseAtom, (base instanceof Promise
                ? base.then(newValueProducer)
                : newValueProducer(base)));
        });
        return derivedAtom;
    }, baseAtom, callback);
}
const getValueUsingOptic = (focus, bigValue) => {
    if (focus._tag === 'Traversal') {
        const values = O.collect(focus)(bigValue);
        return values;
    }
    if (focus._tag === 'Prism') {
        const value = O.preview(focus)(bigValue);
        return value;
    }
    const value = O.get(focus)(bigValue);
    return value;
};
