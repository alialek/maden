import {
  buildStateCreator,
  createBaseApi,
  devtools,
  extendActions,
  extendSelectors,
  getOptions,
  immerMiddleware,
  mutativeMiddleware,
  persist,
  storeFactory
} from "./chunk-LOQBMPXN.mjs";

// src/createStore.ts
import { createTrackedSelector } from "react-tracked";
import { createWithEqualityFn as createStoreZustand } from "zustand/traditional";

// src/utils/extendSelectors.ts
var extendSelectors2 = (builder, api) => {
  return extendSelectors(builder, api, {
    selectWithStore: (selector, equalityFn) => api.useStore(selector, equalityFn)
  });
};

// src/utils/storeFactory.ts
var storeFactory2 = (api) => {
  return storeFactory(api, {
    extendSelectors: (builder, baseApi) => extendSelectors2(builder, baseApi),
    extendActions: (builder, baseApi) => extendActions(builder, baseApi)
  });
};

// src/createStore.ts
var createStore = (initializer, options) => {
  const builder = buildStateCreator(initializer, options);
  const store = createStoreZustand(builder.stateCreator);
  const useTrackedStore2 = createTrackedSelector(store);
  const useTracked2 = (key) => {
    return useTrackedStore2()[key];
  };
  const baseApi = createBaseApi(store, {
    name: builder.name,
    isMutative: builder.isMutative
  });
  const useValue = (key, equalityFn) => {
    return store((state) => state[key], equalityFn);
  };
  const useState = (key, equalityFn) => {
    const value = useValue(key, equalityFn);
    return [value, (val) => baseApi.set(key, val)];
  };
  const apiInternal = {
    ...baseApi,
    store,
    useStore: store,
    useValue,
    useState,
    useTracked: useTracked2,
    useTrackedStore: useTrackedStore2
  };
  return storeFactory2(apiInternal);
};
var createZustandStore = createStore;

// src/useStore.ts
function useStoreValue(store, key, ...args) {
  return store.useValue(key, ...args);
}
function useStoreState(store, key, equalityFn) {
  return store.useState(key, equalityFn);
}
function useTrackedStore(store) {
  return store.useTrackedStore();
}
function useTracked(store, key) {
  return store.useTracked(key);
}
var useStoreSelect = (store, selector, equalityFn) => {
  return store.useStore(selector, equalityFn);
};
export {
  createStore,
  createZustandStore,
  devtools as devToolsMiddleware,
  extendActions,
  extendSelectors2 as extendSelectors,
  getOptions,
  immerMiddleware,
  mutativeMiddleware,
  persist as persistMiddleware,
  storeFactory2 as storeFactory,
  useStoreSelect,
  useStoreState,
  useStoreValue,
  useTracked,
  useTrackedStore
};
//# sourceMappingURL=index.mjs.map