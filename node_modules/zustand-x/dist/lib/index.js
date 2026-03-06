"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/lib/index.ts
var lib_exports = {};
__export(lib_exports, {
  createVanillaStore: () => createVanillaStore,
  extendActions: () => extendActions,
  extendSelectors: () => extendSelectors
});
module.exports = __toCommonJS(lib_exports);

// src/lib/createVanillaStore.ts
var import_vanilla = require("zustand/vanilla");

// src/internal/buildStateCreator.ts
var import_middleware3 = require("zustand/middleware");

// src/middlewares/devtools.ts
var import_middleware = require("zustand/middleware");

// src/middlewares/immer.ts
var import_immer = require("immer");
var immerImpl = (initializer) => (set, get, store) => {
  store.setState = (updater, replace, ...a) => {
    const nextState = typeof updater === "function" ? (0, import_immer.produce)(updater) : updater;
    return set(
      nextState,
      typeof replace === "boolean" ? replace : true,
      ...a
    );
  };
  return initializer(store.setState, get, store);
};
var immerMiddleware = immerImpl;

// src/middlewares/mutative.ts
var import_mutative = require("mutative");
var mutativeImpl = (initializer, options) => (set, get, store) => {
  store.setState = (updater, replace, ...a) => {
    const nextState = typeof updater === "function" ? (0, import_mutative.create)(
      updater,
      options ? { ...options, enablePatches: false } : options
    ) : updater;
    return set(
      nextState,
      typeof replace === "boolean" ? replace : true,
      ...a
    );
  };
  return initializer(store.setState, get, store);
};
var mutativeMiddleware = mutativeImpl;

// src/middlewares/persist.ts
var import_middleware2 = require("zustand/middleware");

// src/utils/helpers.ts
var getOptions = (option, fallbackEnabled = false) => {
  const isBooleanValue = typeof option === "boolean";
  const { enabled, ...config } = isBooleanValue ? {} : option || {};
  const isValueProvided = isBooleanValue ? option : enabled;
  return {
    enabled: isValueProvided ?? fallbackEnabled,
    ...config
  };
};

// src/internal/buildStateCreator.ts
var buildStateCreator = (initializer, options) => {
  const {
    name,
    devtools: devtoolsOptions,
    immer: immerOptions,
    mutative: mutativeOptions,
    persist: persistOptions,
    isMutativeState
  } = options;
  const middlewares = [];
  const devtoolsConfig = getOptions(devtoolsOptions);
  if (devtoolsConfig.enabled) {
    middlewares.push(
      (config) => (0, import_middleware.devtools)(config, {
        ...devtoolsConfig,
        name: devtoolsConfig?.name ?? name
      })
    );
  }
  const persistConfig = getOptions(persistOptions);
  if (persistConfig.enabled) {
    middlewares.push(
      (config) => (0, import_middleware2.persist)(config, {
        ...persistConfig,
        name: persistConfig.name ?? name
      })
    );
  }
  const immerConfig = getOptions(immerOptions);
  if (immerConfig.enabled) {
    middlewares.push((config) => immerMiddleware(config, immerConfig));
  }
  const mutativeConfig = getOptions(mutativeOptions);
  if (mutativeConfig.enabled) {
    middlewares.push((config) => mutativeMiddleware(config, mutativeConfig));
  }
  const stateCreator = middlewares.reverse().reduce(
    (creator, middleware) => middleware(creator),
    typeof initializer === "function" ? initializer : () => initializer
  );
  const isMutative = isMutativeState || immerConfig.enabled || mutativeConfig.enabled;
  return {
    stateCreator: (0, import_middleware3.subscribeWithSelector)(stateCreator),
    isMutative,
    name
  };
};

// src/internal/createBaseApi.ts
var createBaseApi = (store, {
  name,
  isMutative
}) => {
  const get = (key) => {
    if (key === "state") {
      return store.getState();
    }
    return store.getState()[key];
  };
  const set = (key, value) => {
    if (key === "state") {
      return store.setState(value);
    }
    const typedKey = key;
    const prevValue = store.getState()[typedKey];
    const shouldInvokeUpdater = typeof value === "function" && prevValue !== void 0 && prevValue !== null && typeof prevValue !== "function";
    if (shouldInvokeUpdater) {
      value = value(prevValue);
    }
    if (prevValue === value)
      return;
    const actionKey = key.replace(/^\S/, (s) => s.toUpperCase());
    const debugLog = name ? `@@${name}/set${actionKey}` : void 0;
    store.setState(
      isMutative ? (draft) => {
        draft[typedKey] = value;
      } : { [typedKey]: value },
      void 0,
      debugLog
    );
  };
  const subscribe = (key, selectorOrListener, listener, options) => {
    if (key === "state") {
      if (!listener) {
        return store.subscribe(selectorOrListener);
      }
      return store.subscribe(
        selectorOrListener,
        listener,
        options
      );
    }
    let wrappedSelector;
    let wrappedListener;
    let subscribeOptions;
    if (listener) {
      wrappedSelector = (state) => selectorOrListener(state[key]);
      wrappedListener = listener;
      subscribeOptions = options;
    } else {
      wrappedSelector = (state) => state[key];
      wrappedListener = selectorOrListener;
      subscribeOptions = options;
    }
    return store.subscribe(
      wrappedSelector,
      wrappedListener,
      subscribeOptions
    );
  };
  return {
    get,
    set,
    subscribe,
    store,
    name,
    actions: {},
    selectors: {}
  };
};

// src/internal/extendActions.ts
var extendActions = (builder, api) => {
  const newActions = builder(api);
  const actions = {
    ...api.actions,
    ...newActions
  };
  return {
    ...api,
    actions,
    set: (key, ...args) => {
      if (key in actions) {
        const action = actions[key];
        return action?.(...args);
      }
      return api.set(key, args[0]);
    }
  };
};

// src/internal/extendSelectors.ts
var identity = (arg) => arg;
var extendSelectors = (builder, api, options) => {
  const baseGet = api.get.bind(api);
  const baseSubscribe = api.subscribe.bind(api);
  const newSelectors = builder(api);
  const selectors = {
    ...api.selectors,
    ...newSelectors
  };
  const extendedApi = {
    ...api,
    selectors,
    get: (key, ...args) => {
      if (key in selectors) {
        const selector = selectors[key];
        return selector?.(...args);
      }
      return baseGet(key);
    },
    subscribe: (key, ...args) => {
      if (key in selectors) {
        const params = [...args];
        let optionsArg;
        let selectorArg = identity;
        const maybeOptions = params.at(-1);
        if (typeof maybeOptions !== "function") {
          optionsArg = params.pop();
        }
        const listener = params.pop();
        const maybeSelector = params.at(-1);
        if (typeof maybeSelector === "function") {
          selectorArg = params.pop();
        }
        const selectorArgs = params;
        return baseSubscribe(
          "state",
          () => selectorArg(
            selectors[key](...selectorArgs)
          ),
          listener,
          optionsArg
        );
      }
      return baseSubscribe(key, ...args);
    }
  };
  if (options?.selectWithStore) {
    const selectWithStore = options.selectWithStore;
    extendedApi.useValue = (key, ...args) => {
      if (key in selectors) {
        const selector = selectors[key];
        const maybeEqualityFn = args.at(-1);
        const equalityFn = typeof maybeEqualityFn === "function" ? maybeEqualityFn : void 0;
        const selectorArgs = equalityFn ? args.slice(0, -1) : args;
        return selectWithStore(
          () => selector?.(...selectorArgs),
          equalityFn
        );
      }
      return api.useValue?.(key, ...args);
    };
  }
  return extendedApi;
};

// src/internal/storeFactory.ts
var storeFactory = (api, overrides) => {
  const extendSelectorsImpl = overrides?.extendSelectors ?? extendSelectors;
  const extendActionsImpl = overrides?.extendActions ?? extendActions;
  return {
    ...api,
    actions: api.actions || {},
    extendSelectors: (builder) => storeFactory(
      extendSelectorsImpl(builder, api),
      overrides
    ),
    extendActions: (builder) => storeFactory(extendActionsImpl(builder, api), overrides)
  };
};

// src/lib/createVanillaStore.ts
var createVanillaStore = (initializer, options) => {
  const builder = buildStateCreator(initializer, options);
  const store = (0, import_vanilla.createStore)(builder.stateCreator);
  const baseApi = createBaseApi(store, {
    name: builder.name,
    isMutative: builder.isMutative
  });
  return storeFactory(baseApi);
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  createVanillaStore,
  extendActions,
  extendSelectors
});
//# sourceMappingURL=index.js.map