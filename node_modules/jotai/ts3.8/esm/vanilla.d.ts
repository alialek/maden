export { atom } from './vanilla/atom';
export type { Atom, WritableAtom, PrimitiveAtom } from './vanilla/atom';
import * as store from './vanilla/store';
type CreateStore = typeof store.createStore;
type GetDefaultStore = typeof store.getDefaultStore;
export declare const createStore: CreateStore;
export declare const getDefaultStore: GetDefaultStore;
export type { Getter, Setter, ExtractAtomValue, ExtractAtomArgs, ExtractAtomResult, SetStateAction, } from './vanilla/typeUtils';
declare type Awaited<T> = T extends Promise<infer V> ? V : T;