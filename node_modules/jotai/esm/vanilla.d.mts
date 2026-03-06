export { atom } from './vanilla/atom.mjs';
export type { Atom, WritableAtom, PrimitiveAtom } from './vanilla/atom.mjs';
import * as store from './vanilla/store.mjs';
type CreateStore = typeof store.createStore;
type GetDefaultStore = typeof store.getDefaultStore;
export declare const createStore: CreateStore;
export declare const getDefaultStore: GetDefaultStore;
export type { Getter, Setter, ExtractAtomValue, ExtractAtomArgs, ExtractAtomResult, SetStateAction, } from './vanilla/typeUtils.mjs';
