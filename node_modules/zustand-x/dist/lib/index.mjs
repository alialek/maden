import {
  buildStateCreator,
  createBaseApi,
  extendActions,
  extendSelectors,
  storeFactory
} from "../chunk-LOQBMPXN.mjs";

// src/lib/createVanillaStore.ts
import { createStore as createStoreVanilla } from "zustand/vanilla";
var createVanillaStore = (initializer, options) => {
  const builder = buildStateCreator(initializer, options);
  const store = createStoreVanilla(builder.stateCreator);
  const baseApi = createBaseApi(store, {
    name: builder.name,
    isMutative: builder.isMutative
  });
  return storeFactory(baseApi);
};
export {
  createVanillaStore,
  extendActions,
  extendSelectors
};
//# sourceMappingURL=index.mjs.map