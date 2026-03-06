"use strict";
/* eslint-disable @typescript-eslint/no-explicit-any */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.focusAtom = void 0;
const vanilla_1 = require("jotai/vanilla");
const O = __importStar(require("optics-ts"));
const getCached = (c, m, k) => (m.has(k) ? m : m.set(k, c())).get(k);
const cache1 = new WeakMap();
const memo2 = (create, dep1, dep2) => {
    const cache2 = getCached(() => new WeakMap(), cache1, dep1);
    return getCached(create, cache2, dep2);
};
const isFunction = (x) => typeof x === 'function';
// Implementation
function focusAtom(baseAtom, callback) {
    return memo2(() => {
        const focus = callback(O.optic());
        const derivedAtom = (0, vanilla_1.atom)((get) => {
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
exports.focusAtom = focusAtom;
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
