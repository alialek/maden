import * as zustand from 'zustand';
import { StateCreator, StoreMutatorIdentifier } from 'zustand';
import { f as TBaseStoreOptions, a as TBaseStateApi, D as DefaultMutators, T as TState, A as AnyFunction, d as TSelectorBuilder, q as TBaseStateApiForBuilder } from '../extendActions-Qc-AX3wu.js';
export { e as TActionBuilder, j as TExtractMutatorFromMiddleware, k as TFlattenMiddlewares, l as TMiddleware, n as TStoreApiGet, o as TStoreApiSet, p as TStoreApiSubscribe, t as extendActions } from '../extendActions-Qc-AX3wu.js';
import 'zustand/middleware';
import 'mutative';
import 'immer';
import 'zustand/traditional';

declare const createVanillaStore: <StateType extends object, Mps extends [keyof zustand.StoreMutators<unknown, unknown>, unknown][] = [], Mcs extends [keyof zustand.StoreMutators<unknown, unknown>, unknown][] = [], CreateStoreOptions extends TBaseStoreOptions<StateType> = TBaseStoreOptions<StateType>>(initializer: StateType | StateCreator<StateType, Mps, Mcs>, options: CreateStoreOptions) => TBaseStateApi<StateType, [...DefaultMutators<StateType, CreateStoreOptions>, ...Mcs], {}, {}>;
type TCreateVanillaStoreReturn<StateType extends TState, Mutators extends [StoreMutatorIdentifier, unknown][] = [], TActions extends Record<string, (...args: any[]) => any> = {}, TSelectors extends Record<string, (...args: any[]) => any> = {}> = TBaseStateApi<StateType, Mutators, TActions, TSelectors>;

type ExtendSelectorOptions<StateType> = {
    selectWithStore?: <Result>(selector: (state: StateType) => Result, equalityFn?: (a: Result, b: Result) => boolean) => Result;
};
declare const extendSelectors: <StateType extends object, Mutators extends [keyof zustand.StoreMutators<unknown, unknown>, unknown][], TActions extends Record<string, AnyFunction>, TSelectors extends Record<string, AnyFunction>, Builder extends TSelectorBuilder<StateType, Mutators, TActions, TSelectors>>(builder: Builder, api: TBaseStateApiForBuilder<StateType, Mutators, TActions, TSelectors>, options?: ExtendSelectorOptions<StateType> | undefined) => TBaseStateApiForBuilder<StateType, Mutators, TActions, TSelectors & ReturnType<Builder>>;

export { AnyFunction, DefaultMutators, TBaseStateApi, TBaseStateApiForBuilder, TBaseStoreOptions, type TCreateVanillaStoreReturn, TSelectorBuilder, createVanillaStore, extendSelectors };
