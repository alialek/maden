import { DevtoolsOptions as DevtoolsOptions$1, PersistOptions as PersistOptions$1, devtools, persist } from 'zustand/middleware';
import * as zustand from 'zustand';
import { StateCreator, StoreMutatorIdentifier, Mutate, StoreApi } from 'zustand';
import { Draft as Draft$1, PatchesOptions, Options as Options$2 } from 'mutative';
import { Draft } from 'immer';
import { UseBoundStoreWithEqualityFn } from 'zustand/traditional';

type TExtractMutatorFromMiddleware<M> = M extends (initializer: StateCreator<any, any, any, any>, ...rest: any[]) => StateCreator<any, any, infer Mutators, any> ? Mutators extends [infer Mutator, ...unknown[]] ? Mutator extends [StoreMutatorIdentifier, unknown] ? Mutator : never : never : never;
type TFlattenMiddlewares<Middlewares extends TMiddleware[]> = {
    [K in keyof Middlewares]: TExtractMutatorFromMiddleware<Middlewares[K]>;
};
type TMiddleware = (initializer: StateCreator<any, any, any>, ...rest: any[]) => StateCreator<any, any, any>;

type DevtoolsOptions = MiddlewareOption<Partial<DevtoolsOptions$1>>;

declare module 'zustand' {
    interface StoreMutators<S, A> {
        ['zustand/immer-x']: WithImmer<S>;
    }
}
type Write$1<T, U> = Omit<T, keyof U> & U;
type SkipTwo$1<T> = T extends {
    length: 0;
} ? [] : T extends {
    length: 1;
} ? [] : T extends {
    length: 0 | 1;
} ? [] : T extends [unknown, unknown, ...infer A] ? A : T extends [unknown, unknown?, ...infer A] ? A : T extends [unknown?, unknown?, ...infer A] ? A : never;
type SetStateType$1<T extends unknown[]> = Exclude<T[0], AnyFunction>;
type WithImmer<S> = Write$1<S, StoreImmer<S>>;
type StoreImmer<S> = S extends {
    setState: infer SetState;
} ? SetState extends {
    (...a: infer A1): infer Sr1;
    (...a: infer A2): infer Sr2;
} ? {
    setState(nextStateOrUpdater: SetStateType$1<A1> | Partial<SetStateType$1<A1>> | ((state: Draft<Partial<SetStateType$1<A1>>>) => void), shouldReplace?: true, ...a: SkipTwo$1<A1>): Sr1;
    setState(nextStateOrUpdater: SetStateType$1<A2> | ((state: Draft<Partial<SetStateType$1<A2>>>) => void), shouldReplace: false, ...a: SkipTwo$1<A2>): Sr2;
} : never : never;
type Options$1 = {
    enableMapSet?: boolean;
    enabledAutoFreeze?: boolean;
};
type Immer = <T, Mps extends [StoreMutatorIdentifier, unknown][] = [], Mcs extends [StoreMutatorIdentifier, unknown][] = []>(initializer: StateCreator<T, [...Mps, ['zustand/immer-x', never]], Mcs>, options?: Options$1) => StateCreator<T, Mps, [['zustand/immer-x', never], ...Mcs]>;
declare const immerMiddleware: Immer;
type ImmerOptions = MiddlewareOption<Options$1>;

declare module 'zustand/vanilla' {
    interface StoreMutators<S, A> {
        ['zustand/mutative-x']: WithMutative<S>;
    }
}
type SetStateType<T extends unknown[]> = Exclude<T[0], AnyFunction>;
type WithMutative<S> = Write<S, StoreMutative<S>>;
type Write<T, U> = Omit<T, keyof U> & U;
type SkipTwo<T> = T extends {
    length: 0;
} ? [] : T extends {
    length: 1;
} ? [] : T extends {
    length: 0 | 1;
} ? [] : T extends [unknown, unknown, ...infer A] ? A : T extends [unknown, unknown?, ...infer A] ? A : T extends [unknown?, unknown?, ...infer A] ? A : never;
type StoreMutative<S> = S extends {
    setState: infer SetState;
} ? SetState extends {
    (...a: infer A1): infer Sr1;
    (...a: infer A2): infer Sr2;
} ? {
    setState(nextStateOrUpdater: SetStateType<A1> | Partial<SetStateType<A1>> | ((state: Draft$1<Partial<SetStateType<A1>>>) => void), shouldReplace?: true, ...a: SkipTwo<A1>): Sr1;
    setState(nextStateOrUpdater: SetStateType<A2> | ((state: Draft$1<Partial<SetStateType<A2>>>) => void), shouldReplace: false, ...a: SkipTwo<A2>): Sr2;
} : never : never;
type Options<O extends PatchesOptions, F extends boolean> = Omit<Options$2<O, F>, 'enablePatches'>;
type Mutative = <T, Mps extends [StoreMutatorIdentifier, unknown][] = [], Mcs extends [StoreMutatorIdentifier, unknown][] = [], F extends boolean = false>(initializer: StateCreator<T, [...Mps, ['zustand/mutative-x', never]], Mcs>, options?: Options<false, F>) => StateCreator<T, Mps, [['zustand/mutative-x', never], ...Mcs]>;
declare const mutativeMiddleware: Mutative;
type MutativeOptions<F extends boolean = false> = MiddlewareOption<Options<false, F>>;

type PersistOptions<StateType> = MiddlewareOption<Partial<PersistOptions$1<StateType, Partial<StateType>>>>;

type TState = object;
type TEqualityChecker<StateType> = (state: StateType, newState: StateType) => boolean;
type TCreatedStoreMutateType<StateType extends TState, Mutators extends [StoreMutatorIdentifier, unknown][]> = Mutate<StoreApi<StateType>, Mutators>;
type TCreatedStoreType<StateType extends TState, Mutators extends [StoreMutatorIdentifier, unknown][]> = UseBoundStoreWithEqualityFn<TCreatedStoreMutateType<StateType, Mutators>>;
type MiddlewareOption<T> = boolean | (T & {
    enabled?: boolean;
});
type ArrayElement<T> = T extends (infer E)[] ? E : never;
type RemoveNever<T> = T extends [infer First, ...infer Rest] ? [First] extends [never] ? RemoveNever<Rest> : [First, ...RemoveNever<Rest>] : [];

type TBaseStoreOptions<StateType extends TState> = {
    name: string;
    /**
     * Devtools middleware options.
     * https://zustand.docs.pmnd.rs/middlewares/devtools
     */
    devtools?: DevtoolsOptions;
    /**
     * Immer middleware options.
     * https://zustand.docs.pmnd.rs/middlewares/immer
     */
    immer?: ImmerOptions;
    /**
     * Mutative middleware options.
     * https://www.npmjs.com/package/mutative
     */
    mutative?: MutativeOptions;
    /**
     * Persist middleware options.
     * https://zustand.docs.pmnd.rs/middlewares/persist
     */
    persist?: PersistOptions<StateType>;
    /**
     * If you're using custom middleware like `immer` and `mutative`
     * and no need to return new state then set this value to `true`.
     */
    isMutativeState?: boolean;
};

type ConditionalMiddleware<T, Middleware extends TMiddleware, IsDefault extends boolean = false> = T extends {
    enabled: true;
} | true ? Middleware : IsDefault extends true ? T extends {
    enabled: false;
} | false ? never : Middleware : never;
type DefaultMutators<StateType extends TState, CreateStoreOptions extends TBaseStoreOptions<StateType>> = RemoveNever<TFlattenMiddlewares<[
    ConditionalMiddleware<CreateStoreOptions['devtools'], typeof devtools>,
    ConditionalMiddleware<CreateStoreOptions['persist'], typeof persist<StateType>>,
    ConditionalMiddleware<CreateStoreOptions['immer'], typeof immerMiddleware>,
    ConditionalMiddleware<CreateStoreOptions['mutative'], typeof mutativeMiddleware>
]>>;

type AnyFunction = (...args: any[]) => any;
type TSelectorBuilder<StateType extends TState, Mutators extends [StoreMutatorIdentifier, unknown][], TActions extends Record<string, AnyFunction> = {}, TSelectors extends Record<string, AnyFunction> = {}> = (api: TBaseStateApiForBuilder<StateType, Mutators, TActions, TSelectors>) => Record<string, AnyFunction>;
type TActionBuilder<StateType extends TState, Mutators extends [StoreMutatorIdentifier, unknown][], TActions extends Record<string, AnyFunction> = {}, TSelectors extends Record<string, AnyFunction> = {}> = (api: TBaseStateApiForBuilder<StateType, Mutators, TActions, TSelectors>) => Record<string, AnyFunction>;
type TStoreApiGet<StateType extends TState, Mutators extends [StoreMutatorIdentifier, unknown][], TSelectors extends Record<string, AnyFunction> = {}> = {
    <K extends keyof StateType>(key: K): StateType[K];
    <K extends keyof TSelectors>(key: K, ...args: Parameters<TSelectors[K]>): ReturnType<TSelectors[K]>;
    (key: 'state'): ReturnType<TCreatedStoreMutateType<StateType, Mutators>['getState']>;
};
type TStoreApiSet<StateType extends TState, Mutators extends [StoreMutatorIdentifier, unknown][], TActions extends Record<string, AnyFunction> = {}> = {
    <K extends keyof StateType>(key: K, value: StateType[K]): void;
    <K extends keyof TActions>(key: K, ...args: Parameters<TActions[K]>): ReturnType<TActions[K]>;
    <K extends keyof StateType>(key: K, callback: (prevVal: StateType[K]) => StateType[K]): void;
    (key: 'state', value: Parameters<TCreatedStoreMutateType<StateType, Mutators>['setState']>[0]): void;
};
type TStoreApiSubscribe<StateType extends TState, Mutators extends [StoreMutatorIdentifier, unknown][], TSelectors extends Record<string, AnyFunction> = {}> = {
    <K extends keyof StateType>(key: K, listener: (state: StateType[K], previousState: StateType[K]) => void): () => void;
    <K extends keyof StateType, S = StateType[K]>(key: K, selector: (state: StateType[K]) => S, listener: (state: S, previousState: S) => void, options?: {
        equalityFn?: TEqualityChecker<S>;
        fireImmediately?: boolean;
    }): () => void;
    <K extends keyof TSelectors>(key: K, ...args: [
        ...Parameters<TSelectors[K]>,
        listener: (state: ReturnType<TSelectors[K]>, previousState: ReturnType<TSelectors[K]>) => void
    ]): () => void;
    <K extends keyof TSelectors, S = ReturnType<TSelectors[K]>>(key: K, ...args: [
        ...Parameters<TSelectors[K]>,
        selector: (state: ReturnType<TSelectors[K]>) => S,
        listener: (state: S, previousState: S) => void,
        options?: {
            equalityFn?: TEqualityChecker<S>;
            fireImmediately?: boolean;
        }
    ]): () => void;
    (key: 'state', listener: (state: ReturnType<TCreatedStoreMutateType<StateType, Mutators>['getState']>, previousState: ReturnType<TCreatedStoreMutateType<StateType, Mutators>['getState']>) => void): () => void;
    <S = ReturnType<TCreatedStoreMutateType<StateType, Mutators>['getState']>>(key: 'state', selector: (state: ReturnType<TCreatedStoreMutateType<StateType, Mutators>['getState']>) => S, listener: (state: S, previousState: S) => void, options?: {
        equalityFn?: TEqualityChecker<S>;
        fireImmediately?: boolean;
    }): () => void;
};
type TBaseStateApi<StateType extends TState, Mutators extends [StoreMutatorIdentifier, unknown][], TActions extends Record<string, AnyFunction> = {}, TSelectors extends Record<string, AnyFunction> = {}> = {
    name: string;
    get: TStoreApiGet<StateType, Mutators, TSelectors>;
    set: TStoreApiSet<StateType, Mutators, TActions>;
    subscribe: TStoreApiSubscribe<StateType, Mutators, TSelectors>;
    actions: TActions;
    selectors: TSelectors;
    store: TCreatedStoreMutateType<StateType, Mutators>;
    extendSelectors<SelectorBuilder extends TSelectorBuilder<StateType, Mutators, TActions, TSelectors>>(builder: SelectorBuilder): TBaseStateApi<StateType, Mutators, TActions, TSelectors & ReturnType<SelectorBuilder>>;
    extendActions<ActionBuilder extends TActionBuilder<StateType, Mutators, TActions, TSelectors>>(builder: ActionBuilder): TBaseStateApi<StateType, Mutators, TActions & ReturnType<ActionBuilder>, TSelectors>;
};
type TBaseStateApiForBuilder<StateType extends TState, Mutators extends [StoreMutatorIdentifier, unknown][], TActions extends Record<string, AnyFunction> = {}, TSelectors extends Record<string, AnyFunction> = {}> = Omit<TBaseStateApi<StateType, Mutators, TActions, TSelectors>, 'extendActions' | 'extendSelectors'>;

declare const extendActions: <StateType extends object, Mutators extends [keyof zustand.StoreMutators<unknown, unknown>, unknown][], TActions extends Record<string, AnyFunction>, TSelectors extends Record<string, AnyFunction>, Builder extends TActionBuilder<StateType, Mutators, TActions, TSelectors>>(builder: Builder, api: TBaseStateApiForBuilder<StateType, Mutators, TActions, TSelectors>) => TBaseStateApiForBuilder<StateType, Mutators, TActions & ReturnType<Builder>, TSelectors>;

export { type AnyFunction as A, type DefaultMutators as D, type ImmerOptions as I, type MiddlewareOption as M, type PersistOptions as P, type RemoveNever as R, type TState as T, type TBaseStateApi as a, type TCreatedStoreType as b, type TEqualityChecker as c, type TSelectorBuilder as d, type TActionBuilder as e, type TBaseStoreOptions as f, type DevtoolsOptions as g, type MutativeOptions as h, immerMiddleware as i, type TExtractMutatorFromMiddleware as j, type TFlattenMiddlewares as k, type TMiddleware as l, mutativeMiddleware as m, type TStoreApiGet as n, type TStoreApiSet as o, type TStoreApiSubscribe as p, type TBaseStateApiForBuilder as q, type TCreatedStoreMutateType as r, type ArrayElement as s, extendActions as t };
