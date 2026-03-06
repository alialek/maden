import * as zustand from 'zustand';
import { StoreMutatorIdentifier, StateCreator } from 'zustand';
import { T as TState, A as AnyFunction, a as TBaseStateApi, b as TCreatedStoreType, c as TEqualityChecker, d as TSelectorBuilder, e as TActionBuilder, f as TBaseStoreOptions, D as DefaultMutators, M as MiddlewareOption } from './extendActions-Qc-AX3wu.js';
export { s as ArrayElement, g as DevtoolsOptions, I as ImmerOptions, h as MutativeOptions, P as PersistOptions, R as RemoveNever, q as TBaseStateApiForBuilder, r as TCreatedStoreMutateType, j as TExtractMutatorFromMiddleware, k as TFlattenMiddlewares, l as TMiddleware, n as TStoreApiGet, o as TStoreApiSet, p as TStoreApiSubscribe, t as extendActions, i as immerMiddleware, m as mutativeMiddleware } from './extendActions-Qc-AX3wu.js';
export { devtools as devToolsMiddleware, persist as persistMiddleware } from 'zustand/middleware';
import 'mutative';
import 'immer';
import 'zustand/traditional';

type TStateApi<StateType extends TState, Mutators extends [StoreMutatorIdentifier, unknown][], TActions extends Record<string, AnyFunction> = {}, TSelectors extends Record<string, AnyFunction> = {}> = Omit<TBaseStateApi<StateType, Mutators, TActions, TSelectors>, 'extendActions' | 'extendSelectors'> & {
    store: TCreatedStoreType<StateType, Mutators>;
    useStore: TCreatedStoreType<StateType, Mutators>;
    useValue: {
        <K extends keyof StateType>(key: K): StateType[K];
        <K extends keyof TSelectors>(key: K, ...args: Parameters<TSelectors[K]>): ReturnType<TSelectors[K]>;
        (key: 'state'): ReturnType<TCreatedStoreType<StateType, Mutators>['getState']>;
        <K extends keyof StateType>(key: K, equalityFn?: TEqualityChecker<StateType[K]>): StateType[K];
        <K extends keyof TSelectors>(key: K, ...args: [
            ...Parameters<TSelectors[K]>,
            TEqualityChecker<ReturnType<TSelectors[K]>>?
        ]): ReturnType<TSelectors[K]>;
    };
    useState: {
        <K extends keyof StateType>(key: K, equalityFn?: TEqualityChecker<StateType[K]>): [StateType[K], (value: StateType[K]) => void];
    };
    useTracked: <K extends keyof StateType>(key: K) => StateType[K];
    useTrackedStore: () => StateType;
    extendSelectors<SelectorBuilder extends TSelectorBuilder<StateType, Mutators, TActions, TSelectors>>(builder: SelectorBuilder): TStateApi<StateType, Mutators, TActions, TSelectors & ReturnType<SelectorBuilder>>;
    extendActions<ActionBuilder extends TActionBuilder<StateType, Mutators, TActions, TSelectors>>(builder: ActionBuilder): TStateApi<StateType, Mutators, TActions & ReturnType<ActionBuilder>, TSelectors>;
};
type TStateApiForBuilder<StateType extends TState, Mutators extends [StoreMutatorIdentifier, unknown][], TActions extends Record<string, AnyFunction> = {}, TSelectors extends Record<string, AnyFunction> = {}> = Omit<TStateApi<StateType, Mutators, TActions, TSelectors>, 'extendActions' | 'extendSelectors'>;

/**
 * Creates zustand store with additional selectors and actions.
 *
 * @param {StateType | StateCreator<StateType, Mps, Mcs>} initializer - A function or object that initializes the state.
 * @param {TBaseStoreOptions<StateType>} options - store create options.
 */
declare const createStore: <StateType extends object, Mps extends [keyof zustand.StoreMutators<unknown, unknown>, unknown][] = [], Mcs extends [keyof zustand.StoreMutators<unknown, unknown>, unknown][] = [], CreateStoreOptions extends TBaseStoreOptions<StateType> = TBaseStoreOptions<StateType>>(initializer: StateType | StateCreator<StateType, Mps, Mcs>, options: CreateStoreOptions) => TStateApi<StateType, [...DefaultMutators<StateType, CreateStoreOptions>, ...Mcs], {}, {}>;
declare const createZustandStore: <StateType extends object, Mps extends [keyof zustand.StoreMutators<unknown, unknown>, unknown][] = [], Mcs extends [keyof zustand.StoreMutators<unknown, unknown>, unknown][] = [], CreateStoreOptions extends TBaseStoreOptions<StateType> = TBaseStoreOptions<StateType>>(initializer: StateType | StateCreator<StateType, Mps, Mcs>, options: CreateStoreOptions) => TStateApi<StateType, [...DefaultMutators<StateType, CreateStoreOptions>, ...Mcs], {}, {}>;

declare function useStoreValue<StateType extends TState, Mutators extends [StoreMutatorIdentifier, unknown][], TActions extends Record<string, AnyFunction> = {}, TSelectors extends Record<string, AnyFunction> = {}, K extends keyof StateType = keyof StateType>(store: TStateApi<StateType, Mutators, TActions, TSelectors>, key: K): StateType[K];
declare function useStoreValue<StateType extends TState, Mutators extends [StoreMutatorIdentifier, unknown][], TActions extends Record<string, AnyFunction> = {}, TSelectors extends Record<string, AnyFunction> = {}, K extends keyof TSelectors = keyof TSelectors>(store: TStateApi<StateType, Mutators, TActions, TSelectors>, key: K, ...args: Parameters<TSelectors[K]>): ReturnType<TSelectors[K]>;
declare function useStoreValue<StateType extends TState, Mutators extends [StoreMutatorIdentifier, unknown][], TActions extends Record<string, AnyFunction> = {}, TSelectors extends Record<string, AnyFunction> = {}>(store: TStateApi<StateType, Mutators, TActions, TSelectors>, key: 'state'): StateType;
declare function useStoreValue<StateType extends TState, Mutators extends [StoreMutatorIdentifier, unknown][], TActions extends Record<string, AnyFunction> = {}, TSelectors extends Record<string, AnyFunction> = {}, K extends keyof StateType = keyof StateType>(store: TStateApi<StateType, Mutators, TActions, TSelectors>, key: K, equalityFn?: TEqualityChecker<StateType[K]>): StateType[K];
declare function useStoreValue<StateType extends TState, Mutators extends [StoreMutatorIdentifier, unknown][], TActions extends Record<string, AnyFunction> = {}, TSelectors extends Record<string, AnyFunction> = {}, K extends keyof TSelectors = keyof TSelectors>(store: TStateApi<StateType, Mutators, TActions, TSelectors>, key: K, ...args: [
    ...Parameters<TSelectors[K]>,
    TEqualityChecker<ReturnType<TSelectors[K]>>?
]): ReturnType<TSelectors[K]>;
declare function useStoreState<StateType extends TState, Mutators extends [StoreMutatorIdentifier, unknown][], TActions extends Record<string, AnyFunction> = {}, TSelectors extends Record<string, AnyFunction> = {}, K extends keyof StateType = keyof StateType>(store: TStateApi<StateType, Mutators, TActions, TSelectors>, key: K, equalityFn?: TEqualityChecker<StateType[K]>): [StateType[K], (value: StateType[K]) => void];
declare function useTrackedStore<StateType extends TState, Mutators extends [StoreMutatorIdentifier, unknown][], TActions extends Record<string, AnyFunction> = {}, TSelectors extends Record<string, AnyFunction> = {}>(store: TStateApi<StateType, Mutators, TActions, TSelectors>): StateType;
declare function useTracked<StateType extends TState, Mutators extends [StoreMutatorIdentifier, unknown][], TActions extends Record<string, AnyFunction> = {}, TSelectors extends Record<string, AnyFunction> = {}, K extends keyof StateType = keyof StateType>(store: TStateApi<StateType, Mutators, TActions, TSelectors>, key: K): StateType[K];
/**
 * Use zustand store selector with optional equality function.
 * @example
 * const name = useStoreSelect(store, (state) => state.name, equalityFn)
 */
declare const useStoreSelect: <StateType extends object, Mutators extends [keyof zustand.StoreMutators<unknown, unknown>, unknown][], TActions extends Record<string, AnyFunction> = {}, TSelectors extends Record<string, AnyFunction> = {}, U = StateType>(store: TStateApi<StateType, Mutators, TActions, TSelectors>, selector: (state: StateType) => U, equalityFn?: ((a: U, b: U) => boolean) | undefined) => U;

declare const extendSelectors: <StateType extends object, Mutators extends [keyof zustand.StoreMutators<unknown, unknown>, unknown][], TActions extends Record<string, AnyFunction>, TSelectors extends Record<string, AnyFunction>, Builder extends TSelectorBuilder<StateType, Mutators, TActions, TSelectors>>(builder: Builder, api: TStateApiForBuilder<StateType, Mutators, TActions, TSelectors>) => TStateApiForBuilder<StateType, Mutators, TActions, TSelectors & ReturnType<Builder>>;

declare const getOptions: <T extends MiddlewareOption<object> | undefined>(option: T, fallbackEnabled?: boolean) => {
    enabled: boolean;
} & Omit<Exclude<T, boolean | undefined>, "enabled">;

declare const storeFactory: <StateType extends object, Mutators extends [keyof zustand.StoreMutators<unknown, unknown>, unknown][] = [], TActions extends Record<string, AnyFunction> = {}, TSelectors extends Record<string, AnyFunction> = {}>(api: TStateApiForBuilder<StateType, Mutators, TActions, TSelectors>) => TStateApi<StateType, Mutators, TActions, TSelectors>;

export { AnyFunction, DefaultMutators, MiddlewareOption, TActionBuilder, TBaseStateApi, TBaseStoreOptions, TCreatedStoreType, TEqualityChecker, TSelectorBuilder, TState, type TStateApi, type TStateApiForBuilder, createStore, createZustandStore, extendSelectors, getOptions, storeFactory, useStoreSelect, useStoreState, useStoreValue, useTracked, useTrackedStore };
