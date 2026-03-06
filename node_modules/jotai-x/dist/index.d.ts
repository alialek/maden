import { WritableAtom, createStore, Atom } from 'jotai/vanilla';
import React, { PropsWithChildren } from 'react';
import { useHydrateAtoms } from 'jotai/utils';

/**
 * Jotai atoms don't allow functions as values by default. This function is a
 * drop-in replacement for `atom` that wraps functions in an object while
 * leaving non-functions unchanged. The wrapper object should be completely
 * invisible to consumers of the atom.
 */
declare const atomWithFn: <T>(initialValue: T) => WritableAtom<T, [T], void>;

type JotaiStore = ReturnType<typeof createStore>;
type UseAtomOptions = {
    scope?: string;
    store?: JotaiStore;
    delay?: number;
    warnIfNoStore?: boolean;
};
type UseAtomOptionsOrScope = UseAtomOptions | string;
type StoreAtomsWithoutExtend<T> = {
    [K in keyof T]: T[K] extends Atom<any> ? T[K] : SimpleWritableAtom<T[K]>;
};
type ValueTypesForAtoms<T> = {
    [K in keyof T]: T[K] extends Atom<infer V> ? V : never;
};
type StoreInitialValues<T> = ValueTypesForAtoms<StoreAtomsWithoutExtend<T>>;
type StoreAtoms<T, E> = StoreAtomsWithoutExtend<T> & E;
type SimpleWritableAtom<T> = WritableAtom<T, [T], void>;
type SimpleWritableAtomRecord<T> = {
    [K in keyof T]: SimpleWritableAtom<T[K]>;
};
type AtomRecord<O> = {
    [K in keyof O]: Atom<O[K]>;
};
type UseNameStore<N extends string = ''> = `use${Capitalize<N>}Store`;
type NameStore<N extends string = ''> = N extends '' ? 'store' : `${N}Store`;
type NameProvider<N extends string = ''> = `${Capitalize<N>}Provider`;
type UseKeyValue<K extends string = ''> = `use${Capitalize<K>}Value`;
type GetKey<K extends string = ''> = `get${Capitalize<K>}`;
type UseSetKey<K extends string = ''> = `useSet${Capitalize<K>}`;
type SetKey<K extends string = ''> = `set${Capitalize<K>}`;
type UseKeyState<K extends string = ''> = `use${Capitalize<K>}State`;
type SubscribeKey<K extends string = ''> = `subscribe${Capitalize<K>}`;
type UseHydrateAtoms<T> = (initialValues: Partial<Record<keyof T, any>>, options?: Parameters<typeof useHydrateAtoms>[1]) => void;
type UseSyncAtoms<T> = (values: Partial<Record<keyof T, any>>, options?: {
    store?: JotaiStore;
}) => void;
type StoreApi<T extends object, E extends AtomRecord<object>, N extends string = ''> = {
    atom: StoreAtoms<T, E>;
    name: N;
};
type UseValueOptions<V, S> = {
    selector?: (v: V, prevSelectorOutput?: S) => S;
    equalityFn?: (prev: S, next: S) => boolean;
} & UseAtomOptions;
type UseKeyValueApis<O> = {
    [K in keyof O as UseKeyValue<K & string>]: {
        (): O[K] extends Atom<infer V> ? V : never;
        <S>(selector: O[K] extends Atom<infer V> ? (v: V, prevSelectorOutput?: S) => S : never, deps?: unknown[]): S;
        <S>(selector: (O[K] extends Atom<infer V> ? (v: V, prevSelectorOutput?: S) => S : never) | undefined, equalityFn: (prevSelectorOutput: S, selectorOutput: S) => boolean, deps?: unknown[]): S;
    };
};
type GetKeyApis<O> = {
    [K in keyof O as GetKey<K & string>]: O[K] extends Atom<infer V> ? () => V : never;
};
type UseSetKeyApis<O> = {
    [K in keyof O as UseSetKey<K & string>]: O[K] extends WritableAtom<infer _V, infer A, infer R> ? () => (...args: A) => R : never;
};
type SetKeyApis<O> = {
    [K in keyof O as SetKey<K & string>]: O[K] extends WritableAtom<infer _V, infer A, infer R> ? (...args: A) => R : never;
};
type UseKeyStateApis<O> = {
    [K in keyof O as UseKeyState<K & string>]: O[K] extends WritableAtom<infer V, infer A, infer R> ? () => [V, (...args: A) => R] : never;
};
type SubscribeKeyApis<O> = {
    [K in keyof O as SubscribeKey<K & string>]: O[K] extends Atom<infer V> ? (callback: (newValue: V) => void) => () => void : never;
};
type UseParamKeyValueApi<O> = {
    <K extends keyof O>(key: K): O[K] extends Atom<infer V> ? V : never;
    <K extends keyof O, S>(key: K, selector: O[K] extends Atom<infer V> ? (v: V, prevSelectorOutput?: S) => S : never, deps?: unknown[]): S;
    <K extends keyof O, S>(key: K, selector: (O[K] extends Atom<infer V> ? (v: V, prevSelectorOutput?: S) => S : never) | undefined, equalityFn: (prevSelectorOutput: S, selectorOutput: S) => boolean, deps?: unknown[]): S;
};
type GetParamKeyApi<O> = <K extends keyof O>(key: K) => O[K] extends Atom<infer V> ? V : never;
type UseSetParamKeyApi<O> = <K extends keyof O>(key: K) => O[K] extends WritableAtom<infer _V, infer A, infer R> ? (...args: A) => R : never;
type SetParamKeyApi<O> = <K extends keyof O, A extends unknown[]>(key: K, ...args: A) => O[K] extends WritableAtom<infer _V, A, infer R> ? R : never;
type UseParamKeyStateApi<O> = <K extends keyof O>(key: K) => O[K] extends WritableAtom<infer V, infer A, infer R> ? [V, (...args: A) => R] : never;
type SubscribeParamKeyApi<O> = <K extends keyof O, V>(key: K, callback: (newValue: V) => void) => O[K] extends Atom<V> ? () => void : never;
type UseAtomParamValueApi = {
    <V>(atom: Atom<V>): V;
    <V, S = V>(atom: Atom<V>, selector: (v: V, prevSelectorOutput?: S) => S, deps?: unknown[]): S;
    <V, S = V>(atom: Atom<V>, selector: ((v: V, prevSelectorOutput?: S) => S) | undefined, equalityFn: (prevSelectorOutput: S, selectorOutput: S) => boolean, deps?: unknown[]): S;
};
type GetAtomParamApi = <V>(atom: Atom<V>) => V;
type UseSetAtomParamApi = <V, A extends unknown[], R>(atom: WritableAtom<V, A, R>) => (...args: A) => R;
type SetAtomParamApi = <V, A extends unknown[], R>(atom: WritableAtom<V, A, R>) => (...args: A) => R;
type UseAtomParamStateApi = <V, A extends unknown[], R>(atom: WritableAtom<V, A, R>) => [V, (...args: A) => R];
type SubscribeAtomParamApi = <V>(atom: Atom<V>) => (callback: (newValue: V) => void) => () => void;
type ReturnOfUseStoreApi<T, E> = UseKeyValueApis<StoreAtoms<T, E>> & GetKeyApis<StoreAtoms<T, E>> & UseSetKeyApis<StoreAtoms<T, E>> & SetKeyApis<StoreAtoms<T, E>> & UseKeyStateApis<StoreAtoms<T, E>> & SubscribeKeyApis<StoreAtoms<T, E>> & {
    /**
     * When providing `selector`, the atom value will be transformed using the selector function.
     * The selector and equalityFn MUST be memoized.
     *
     * @see https://jotai.org/docs/utilities/select#selectatom
     *
     * @example
     *   const store = useStore()
     *   // only rerenders when the first element of the array changes
     *   const arrayFirst = store.useValue('array', array => array[0], [])
     *   // only rerenders when the first element of the array changes, but returns the whole array
     *   const array = store.useValue('array', undefined, (prev, next) => prev[0] === next[0], [])
     *   // without dependency array, then you need to memoize the selector and equalityFn yourself
     *   const cb = useCallback((array) => array[n], [n])
     *   const arrayNth = store.useValue('array', cb)
     *
     * @param key The key of the atom
     * @param selector A function that takes the atom value and returns the value to be used. Defaults to identity function that returns the atom value.
     * @param equalityFnOrDeps Dependency array or a function that compares the previous selector output and the new selector output. Defaults to comparing outputs of the selector function.
     * @param deps Dependency array for the selector and equalityFn
     */
    useValue: UseParamKeyValueApi<StoreAtoms<T, E>>;
    get: GetParamKeyApi<StoreAtoms<T, E>>;
    useSet: UseSetParamKeyApi<StoreAtoms<T, E>>;
    set: SetParamKeyApi<StoreAtoms<T, E>>;
    useState: UseParamKeyStateApi<StoreAtoms<T, E>>;
    subscribe: SubscribeParamKeyApi<StoreAtoms<T, E>>;
    /**
     * When providing `selector`, the atom value will be transformed using the selector function.
     * The selector and equalityFn MUST be memoized.
     *
     * @see https://jotai.org/docs/utilities/select#selectatom
     *
     * @example
     *   const store = useStore()
     *   // only rerenders when the first element of the array changes
     *   const arrayFirst = store.useAtomValue(arrayAtom, array => array[0])
     *   // only rerenders when the first element of the array changes, but returns the whole array
     *   const array = store.useAtomValue(arrayAtom, undefined, (prev, next) => prev[0] === next[0])
     *   // without dependency array, then you need to memoize the selector and equalityFn yourself
     *  const cb = useCallback((array) => array[n], [n])
     * const arrayNth = store.useAtomValue(arrayAtom, cb)
     *
     * @param atom The atom to use
     * @param selector A function that takes the atom value and returns the value to be used. Defaults to identity function that returns the atom value.
     * @param equalityFn Dependency array or a function that compares the previous selector output and the new selector output. Defaults to comparing outputs of the selector function.
     * @param deps Dependency array for the selector and equalityFn
     */
    useAtomValue: UseAtomParamValueApi;
    getAtom: GetAtomParamApi;
    useSetAtom: UseSetAtomParamApi;
    setAtom: SetAtomParamApi;
    useAtomState: UseAtomParamStateApi;
    subscribeAtom: SubscribeAtomParamApi;
    store: JotaiStore | undefined;
};
type UseKeyStateUtil<T, E> = <K extends keyof StoreAtoms<T, E>>(key: K, options?: UseAtomOptionsOrScope) => StoreAtoms<T, E>[K] extends WritableAtom<infer V, infer A, infer R> ? [V, (...args: A) => R] : never;
type UseKeyValueUtil<T, E> = <K extends keyof StoreAtoms<T, E>, S = StoreAtoms<T, E>[K] extends Atom<infer V> ? V : never>(key: K, options?: UseValueOptions<StoreAtoms<T, E>[K] extends Atom<infer V> ? V : never, S>, deps?: unknown[]) => S;
type UseKeySetUtil<T, E> = <K extends keyof StoreAtoms<T, E>>(key: K, options?: UseAtomOptionsOrScope) => StoreAtoms<T, E>[K] extends WritableAtom<infer _V, infer A, infer R> ? (...args: A) => R : never;
type AtomStoreApi<T extends object, E extends AtomRecord<object>, N extends string = ''> = {
    name: N;
} & {
    [key in keyof Record<NameProvider<N>, object>]: React.FC<ProviderProps<StoreInitialValues<T>>>;
} & {
    [key in keyof Record<NameStore<N>, object>]: StoreApi<T, E, N>;
} & {
    [key in keyof Record<UseNameStore<N>, object>]: UseStoreApi<T, E>;
} & {
    [key in keyof Record<`use${Capitalize<N>}State`, object>]: UseKeyStateUtil<T, E>;
} & {
    [key in keyof Record<`use${Capitalize<N>}Value`, object>]: UseKeyValueUtil<T, E>;
} & {
    [key in keyof Record<`use${Capitalize<N>}Set`, object>]: UseKeySetUtil<T, E>;
};
type UseStoreApi<T, E> = (options?: UseAtomOptionsOrScope) => ReturnOfUseStoreApi<T, E>;
interface CreateAtomStoreOptions<T extends object, E extends AtomRecord<object>, N extends string> {
    name: N;
    delay?: UseAtomOptions['delay'];
    effect?: React.FC;
    extend?: (atomsWithoutExtend: StoreAtomsWithoutExtend<T>) => E;
    suppressWarnings?: boolean;
}
/**
 * Create an atom store from an initial value.
 * Each property will have a getter and setter.
 *
 * @example
 * const { exampleStore, useExampleStore, useExampleValue, useExampleState, useExampleSet } = createAtomStore({ count: 1, say: 'hello' }, { name: 'example' as const })
 * const [count, setCount] = useExampleState()
 * const say = useExampleValue('say')
 * const setSay = useExampleSet('say')
 * setSay('world')
 * const countAtom = exampleStore.atom.count
 */
declare const createAtomStore: <T extends object, E extends AtomRecord<object>, N extends string = "">(initialState: T, { name, delay: delayRoot, effect, extend, suppressWarnings, }: CreateAtomStoreOptions<T, E, N>) => AtomStoreApi<T, E, N>;
declare function useAtomStoreValue<T, E, K extends keyof StoreAtoms<T, E>>(store: ReturnOfUseStoreApi<T, E>, key: K): StoreAtoms<T, E>[K] extends Atom<infer V> ? V : never;
declare function useAtomStoreValue<T, E, K extends keyof StoreAtoms<T, E>, S>(store: ReturnOfUseStoreApi<T, E>, key: K, selector: StoreAtoms<T, E>[K] extends Atom<infer V> ? (v: V, prevSelectorOutput?: S) => S : never, deps?: unknown[]): S;
declare function useAtomStoreValue<T, E, K extends keyof StoreAtoms<T, E>, S>(store: ReturnOfUseStoreApi<T, E>, key: K, selector: StoreAtoms<T, E>[K] extends Atom<infer V> ? ((v: V, prevSelectorOutput?: S) => S) | undefined : never, equalityFn: (prevSelectorOutput: S, selectorOutput: S) => boolean, deps?: unknown[]): S;
declare function useAtomStoreSet<T, E, K extends keyof StoreAtoms<T, E>>(store: ReturnOfUseStoreApi<T, E>, key: K): StoreAtoms<T, E>[K] extends WritableAtom<infer _V, infer A extends unknown[], infer R> ? (...args: A) => R : never;
declare function useAtomStoreState<T, E, K extends keyof StoreAtoms<T, E>>(store: ReturnOfUseStoreApi<T, E>, key: K): StoreAtoms<T, E>[K] extends WritableAtom<infer V, infer A extends unknown[], infer R> ? [V, (...args: A) => R] : never;
declare function useStoreAtomValue<T, E, V>(store: ReturnOfUseStoreApi<T, E>, atom: Atom<V>): V;
declare function useStoreAtomValue<T, E, V, S>(store: ReturnOfUseStoreApi<T, E>, atom: Atom<V>, selector: (v: V, prevSelectorOutput?: S) => S, deps?: unknown[]): S;
declare function useStoreAtomValue<T, E, V, S>(store: ReturnOfUseStoreApi<T, E>, atom: Atom<V>, selector: ((v: V, prevSelectorOutput?: S) => S) | undefined, equalityFn: (prevSelectorOutput: S, selectorOutput: S) => boolean, deps?: unknown[]): S;
declare function useStoreSetAtom<T, E, V, A extends unknown[], R>(store: ReturnOfUseStoreApi<T, E>, atom: WritableAtom<V, A, R>): (...args: A) => R;
declare function useStoreAtomState<T, E, V, A extends unknown[], R>(store: ReturnOfUseStoreApi<T, E>, atom: WritableAtom<V, A, R>): [V, (...args: A) => R];

/**
 * Tries to find a store in each of the following places, in order:
 * 1. The store context, matching the store name and scope
 * 2. The store context, matching the store name and 'provider' scope
 * 3. Otherwise, return undefined
 */
declare const useAtomStore: (storeName: string, scope?: string, warnIfUndefined?: boolean) => JotaiStore | undefined;
type ProviderProps<T extends object> = Partial<T> & PropsWithChildren<{
    store?: JotaiStore;
    scope?: string;
    initialValues?: Partial<T>;
    resetKey?: any;
}>;
declare const HydrateAtoms: <T extends object>({ initialValues, children, store, atoms, ...props }: Omit<ProviderProps<T>, "scope"> & {
    atoms: SimpleWritableAtomRecord<T>;
}) => React.JSX.Element;
/**
 * Creates a generic provider for a jotai store.
 * - `initialValues`: Initial values for the store.
 * - `props`: Dynamic values for the store.
 */
declare const createAtomProvider: <T extends object, N extends string = "">(storeScope: N, atoms: SimpleWritableAtomRecord<T>, options?: {
    effect?: React.FC;
}) => ({ store, scope, children, resetKey, ...props }: ProviderProps<T>) => React.JSX.Element;

/**
 * Hydrate atoms with initial values for SSR.
 */
declare const useHydrateStore: (atoms: SimpleWritableAtomRecord<any>, initialValues: Parameters<UseHydrateAtoms<any>>[0], options?: Parameters<UseHydrateAtoms<any>>[1]) => void;
/**
 * Update atoms with new values on changes.
 */
declare const useSyncStore: (atoms: SimpleWritableAtomRecord<any>, values: any, { store }?: Parameters<UseSyncAtoms<any>>[1]) => void;

export { type AtomRecord, type AtomStoreApi, type CreateAtomStoreOptions, type GetAtomParamApi, type GetKeyApis, type GetParamKeyApi, HydrateAtoms, type JotaiStore, type ProviderProps, type ReturnOfUseStoreApi, type SetAtomParamApi, type SetKeyApis, type SetParamKeyApi, type SimpleWritableAtom, type SimpleWritableAtomRecord, type StoreApi, type SubscribeAtomParamApi, type SubscribeKeyApis, type SubscribeParamKeyApi, type UseAtomOptions, type UseAtomParamStateApi, type UseAtomParamValueApi, type UseHydrateAtoms, type UseKeyStateApis, type UseKeyValueApis, type UseParamKeyStateApi, type UseParamKeyValueApi, type UseSetAtomParamApi, type UseSetKeyApis, type UseSetParamKeyApi, type UseStoreApi, type UseSyncAtoms, atomWithFn, createAtomProvider, createAtomStore, useAtomStore, useAtomStoreSet, useAtomStoreState, useAtomStoreValue, useHydrateStore, useStoreAtomState, useStoreAtomValue, useStoreSetAtom, useSyncStore };
