"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __objRest = (source, exclude) => {
  var target = {};
  for (var prop in source)
    if (__hasOwnProp.call(source, prop) && exclude.indexOf(prop) < 0)
      target[prop] = source[prop];
  if (source != null && __getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(source)) {
      if (exclude.indexOf(prop) < 0 && __propIsEnum.call(source, prop))
        target[prop] = source[prop];
    }
  return target;
};
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  HydrateAtoms: () => HydrateAtoms,
  atomWithFn: () => atomWithFn,
  createAtomProvider: () => createAtomProvider,
  createAtomStore: () => createAtomStore,
  useAtomStore: () => useAtomStore,
  useAtomStoreSet: () => useAtomStoreSet,
  useAtomStoreState: () => useAtomStoreState,
  useAtomStoreValue: () => useAtomStoreValue,
  useHydrateStore: () => useHydrateStore,
  useStoreAtomState: () => useStoreAtomState,
  useStoreAtomValue: () => useStoreAtomValue,
  useStoreSetAtom: () => useStoreSetAtom,
  useSyncStore: () => useSyncStore
});
module.exports = __toCommonJS(src_exports);

// src/atomWithFn.ts
var import_jotai = require("jotai");
var wrapFn = (fnOrValue) => typeof fnOrValue === "function" ? { __fn: fnOrValue } : fnOrValue;
var unwrapFn = (wrappedFnOrValue) => wrappedFnOrValue && typeof wrappedFnOrValue === "object" && "__fn" in wrappedFnOrValue ? wrappedFnOrValue.__fn : wrappedFnOrValue;
var atomWithFn = (initialValue) => {
  const baseAtom = (0, import_jotai.atom)(wrapFn(initialValue));
  return (0, import_jotai.atom)(
    (get) => unwrapFn(get(baseAtom)),
    (_get, set, value) => set(baseAtom, wrapFn(value))
  );
};

// src/createAtomProvider.tsx
var import_react2 = __toESM(require("react"));
var import_vanilla = require("jotai/vanilla");

// src/useHydrateStore.ts
var import_react = __toESM(require("react"));
var import_jotai2 = require("jotai");
var import_utils = require("jotai/utils");
var useHydrateStore = (atoms, initialValues, options = {}) => {
  const values = [];
  for (const key of Object.keys(atoms)) {
    const initialValue = initialValues[key];
    if (initialValue !== void 0) {
      values.push([atoms[key], initialValue]);
    }
  }
  (0, import_utils.useHydrateAtoms)(values, options);
};
var useSyncStore = (atoms, values, { store } = {}) => {
  for (const key of Object.keys(atoms)) {
    const value = values[key];
    const atom2 = atoms[key];
    const set = (0, import_jotai2.useSetAtom)(atom2, { store });
    import_react.default.useEffect(() => {
      if (value !== void 0 && value !== null) {
        set(value);
      }
    }, [set, value]);
  }
};

// src/createAtomProvider.tsx
var getFullyQualifiedScope = (storeName, scope) => {
  return `${storeName}:${scope}`;
};
var PROVIDER_SCOPE = "provider";
var AtomStoreContext = import_react2.default.createContext(
  /* @__PURE__ */ new Map()
);
var useAtomStore = (storeName, scope = PROVIDER_SCOPE, warnIfUndefined = true) => {
  var _a;
  const storeContext = import_react2.default.useContext(AtomStoreContext);
  const store = (_a = storeContext.get(getFullyQualifiedScope(storeName, scope))) != null ? _a : storeContext.get(getFullyQualifiedScope(storeName, PROVIDER_SCOPE));
  if (!store && warnIfUndefined) {
    console.warn(
      `Tried to access jotai store '${storeName}' outside of a matching provider.`
    );
  }
  return store;
};
var HydrateAtoms = (_a) => {
  var _b = _a, {
    initialValues,
    children,
    store,
    atoms
  } = _b, props = __objRest(_b, [
    "initialValues",
    "children",
    "store",
    "atoms"
  ]);
  useHydrateStore(atoms, __spreadValues(__spreadValues({}, initialValues), props), {
    store
  });
  useSyncStore(atoms, props, {
    store
  });
  return /* @__PURE__ */ import_react2.default.createElement(import_react2.default.Fragment, null, children);
};
var createAtomProvider = (storeScope, atoms, options = {}) => {
  const Effect = options.effect;
  return (_a) => {
    var _b = _a, { store, scope, children, resetKey } = _b, props = __objRest(_b, ["store", "scope", "children", "resetKey"]);
    const [storeState, setStoreState] = import_react2.default.useState((0, import_vanilla.createStore)());
    import_react2.default.useEffect(() => {
      if (resetKey) {
        setStoreState((0, import_vanilla.createStore)());
      }
    }, [resetKey]);
    const previousStoreContext = import_react2.default.useContext(AtomStoreContext);
    const storeContext = import_react2.default.useMemo(() => {
      const newStoreContext = new Map(previousStoreContext);
      if (scope) {
        newStoreContext.set(
          getFullyQualifiedScope(storeScope, scope),
          storeState
        );
      }
      newStoreContext.set(
        getFullyQualifiedScope(storeScope, PROVIDER_SCOPE),
        storeState
      );
      return newStoreContext;
    }, [previousStoreContext, scope, storeState]);
    return /* @__PURE__ */ import_react2.default.createElement(AtomStoreContext.Provider, { value: storeContext }, /* @__PURE__ */ import_react2.default.createElement(HydrateAtoms, __spreadValues({ store: storeState, atoms }, props), !!Effect && /* @__PURE__ */ import_react2.default.createElement(Effect, null), children));
  };
};

// src/createAtomStore.ts
var import_react3 = __toESM(require("react"));
var import_jotai3 = require("jotai");
var import_utils2 = require("jotai/utils");
var capitalizeFirstLetter = (str = "") => str.length > 0 ? str[0].toUpperCase() + str.slice(1) : "";
var isAtom = (possibleAtom) => !!possibleAtom && typeof possibleAtom === "object" && "read" in possibleAtom && typeof possibleAtom.read === "function";
var convertScopeShorthand = (optionsOrScope = {}) => typeof optionsOrScope === "string" ? { scope: optionsOrScope } : optionsOrScope;
var useConvertScopeShorthand = (optionsOrScope) => {
  const convertedOptions = convertScopeShorthand(optionsOrScope);
  return (0, import_react3.useMemo)(() => convertedOptions, Object.values(convertedOptions));
};
var identity = (x) => x;
var createAtomStore = (initialState, {
  name,
  delay: delayRoot,
  effect,
  extend,
  suppressWarnings
}) => {
  const atomsWithoutExtend = {};
  const writableAtomsWithoutExtend = {};
  const atomIsWritable = {};
  function UseStoreApiFactory(options, store) {
    this.options = options;
    this.store = store;
  }
  for (const [key, atomOrValue] of Object.entries(initialState)) {
    const atomConfig = isAtom(atomOrValue) ? atomOrValue : atomWithFn(atomOrValue);
    atomsWithoutExtend[key] = atomConfig;
    const writable = "write" in atomConfig;
    atomIsWritable[key] = writable;
    if (writable) {
      writableAtomsWithoutExtend[key] = atomConfig;
    }
  }
  const atoms = __spreadValues({}, atomsWithoutExtend);
  if (extend) {
    const extendedAtoms = extend(atomsWithoutExtend);
    for (const [key, atomConfig] of Object.entries(extendedAtoms)) {
      atoms[key] = atomConfig;
      atomIsWritable[key] = "write" in atomConfig;
    }
  }
  const useStore = (optionsOrScope = {}) => {
    const {
      scope,
      store,
      warnIfNoStore = !suppressWarnings
    } = convertScopeShorthand(optionsOrScope);
    const contextStore = useAtomStore(name, scope, !store && warnIfNoStore);
    return store != null ? store : contextStore;
  };
  const useAtomValueWithStore = (atomConfig, store, optionsOrScope, selector = identity, equalityFnOrDeps, deps) => {
    var _a, _b;
    const options = convertScopeShorthand(optionsOrScope);
    const equalityFn = typeof equalityFnOrDeps === "function" ? equalityFnOrDeps : void 0;
    deps = (_a = typeof equalityFnOrDeps === "function" ? deps : equalityFnOrDeps) != null ? _a : [selector, equalityFn];
    const [memoizedSelector, memoizedEqualityFn] = import_react3.default.useMemo(
      () => [selector, equalityFn],
      // eslint-disable-next-line react-compiler/react-compiler
      deps
    );
    const selectorAtom = (0, import_utils2.selectAtom)(
      atomConfig,
      memoizedSelector,
      memoizedEqualityFn
    );
    return (0, import_jotai3.useAtomValue)(selectorAtom, {
      store,
      delay: (_b = options.delay) != null ? _b : delayRoot
    });
  };
  const getAtomWithStore = (atomConfig, store, _optionsOrScope) => {
    return (store != null ? store : (0, import_jotai3.getDefaultStore)()).get(atomConfig);
  };
  const useSetAtomWithStore = (atomConfig, store, _optionsOrScope) => {
    return (0, import_jotai3.useSetAtom)(atomConfig, { store });
  };
  const setAtomWithStore = (atomConfig, store, _optionsOrScope) => {
    return (...args) => (store != null ? store : (0, import_jotai3.getDefaultStore)()).set(
      atomConfig,
      ...args
    );
  };
  const useAtomStateWithStore = (atomConfig, store, optionsOrScope) => {
    const { delay = delayRoot } = convertScopeShorthand(optionsOrScope);
    return (0, import_jotai3.useAtom)(atomConfig, { store, delay });
  };
  const subscribeAtomWithStore = (atomConfig, store, _optionsOrScope) => {
    return (callback) => {
      store != null ? store : store = (0, import_jotai3.getDefaultStore)();
      const unsubscribe = store.sub(atomConfig, () => {
        callback(store.get(atomConfig));
      });
      return () => unsubscribe();
    };
  };
  for (const key of Object.keys(atoms)) {
    const atomConfig = atoms[key];
    const isWritable = atomIsWritable[key];
    const capitalizedKey = capitalizeFirstLetter(key);
    UseStoreApiFactory.prototype[`use${capitalizedKey}Value`] = function(selector, equalityFnOrDeps, deps) {
      return useAtomValueWithStore(
        atomConfig,
        this.store,
        this.options,
        selector,
        equalityFnOrDeps,
        deps
      );
    };
    UseStoreApiFactory.prototype[`get${capitalizedKey}`] = function() {
      return getAtomWithStore(atomConfig, this.store, this.options);
    };
    UseStoreApiFactory.prototype[`subscribe${capitalizedKey}`] = function(callback) {
      return subscribeAtomWithStore(
        atomConfig,
        this.store,
        this.options
      )(callback);
    };
    if (isWritable) {
      UseStoreApiFactory.prototype[`useSet${capitalizedKey}`] = function() {
        return useSetAtomWithStore(atomConfig, this.store, this.options);
      };
      UseStoreApiFactory.prototype[`set${capitalizedKey}`] = function(...args) {
        return setAtomWithStore(
          atomConfig,
          this.store,
          this.options
        )(...args);
      };
      UseStoreApiFactory.prototype[`use${capitalizedKey}State`] = function() {
        return useAtomStateWithStore(
          atomConfig,
          this.store,
          this.options
        );
      };
    }
  }
  const defineUseStoreApiMethod = (methodNameWithKey, methodNameWithAtomConfig, fnWithKey, fnWithAtomConfig = fnWithKey) => {
    UseStoreApiFactory.prototype[methodNameWithKey] = function(key, ...args) {
      const atomConfig = atoms[key];
      return fnWithKey(atomConfig, this.store, this.options, ...args);
    };
    UseStoreApiFactory.prototype[methodNameWithAtomConfig] = function(atomConfig, ...args) {
      return fnWithAtomConfig(atomConfig, this.store, this.options, ...args);
    };
  };
  defineUseStoreApiMethod("useValue", "useAtomValue", useAtomValueWithStore);
  defineUseStoreApiMethod("get", "getAtom", getAtomWithStore);
  defineUseStoreApiMethod("useSet", "useSetAtom", useSetAtomWithStore);
  defineUseStoreApiMethod(
    "set",
    "setAtom",
    (atomConfig, store, options, ...args) => setAtomWithStore(atomConfig, store, options)(...args),
    setAtomWithStore
  );
  defineUseStoreApiMethod("useState", "useAtomState", useAtomStateWithStore);
  defineUseStoreApiMethod(
    "subscribe",
    "subscribeAtom",
    (atomConfig, store, options, callback) => subscribeAtomWithStore(atomConfig, store, options)(callback),
    subscribeAtomWithStore
  );
  const Provider = createAtomProvider(name, writableAtomsWithoutExtend, {
    effect
  });
  const storeApi = {
    atom: atoms,
    name
  };
  const useStoreApi = (options = {}) => {
    const convertedOptions = useConvertScopeShorthand(options);
    const store = useStore(convertedOptions);
    return (0, import_react3.useMemo)(
      () => new UseStoreApiFactory(convertedOptions, store),
      [store, convertedOptions]
    );
  };
  const useNameState = (key, options) => {
    var _a;
    const store = (_a = useStore(options)) != null ? _a : (0, import_jotai3.getDefaultStore)();
    return useAtomStateWithStore(atoms[key], store, options);
  };
  const useNameValue = (key, _a = {}, deps) => {
    var _b = _a, {
      equalityFn,
      selector
    } = _b, options = __objRest(_b, [
      "equalityFn",
      "selector"
    ]);
    var _a2;
    const store = (_a2 = useStore(options)) != null ? _a2 : (0, import_jotai3.getDefaultStore)();
    return useAtomValueWithStore(
      atoms[key],
      store,
      options,
      selector,
      equalityFn != null ? equalityFn : deps,
      equalityFn && deps
    );
  };
  const useNameSet = (key, options) => {
    var _a;
    const store = (_a = useStore(options)) != null ? _a : (0, import_jotai3.getDefaultStore)();
    return useSetAtomWithStore(atoms[key], store, options);
  };
  const capitalizedName = capitalizeFirstLetter(name);
  const storeApiIndex = name.length === 0 ? "store" : `${name}Store`;
  return {
    [`${capitalizedName}Provider`]: Provider,
    [storeApiIndex]: storeApi,
    [`use${capitalizedName}Store`]: useStoreApi,
    [`use${capitalizedName}State`]: useNameState,
    [`use${capitalizedName}Value`]: useNameValue,
    [`use${capitalizedName}Set`]: useNameSet,
    name
  };
};
function useAtomStoreValue(store, key, selector, equalityFnOrDeps, deps) {
  return store.useValue(key, selector, equalityFnOrDeps, deps);
}
function useAtomStoreSet(store, key) {
  return store.useSet(key);
}
function useAtomStoreState(store, key) {
  return store.useState(key);
}
function useStoreAtomValue(store, atom2, selector, equalityFnOrDeps, deps) {
  return store.useAtomValue(atom2, selector, equalityFnOrDeps, deps);
}
function useStoreSetAtom(store, atom2) {
  return store.useSetAtom(atom2);
}
function useStoreAtomState(store, atom2) {
  return store.useAtomState(atom2);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  HydrateAtoms,
  atomWithFn,
  createAtomProvider,
  createAtomStore,
  useAtomStore,
  useAtomStoreSet,
  useAtomStoreState,
  useAtomStoreValue,
  useHydrateStore,
  useStoreAtomState,
  useStoreAtomValue,
  useStoreSetAtom,
  useSyncStore
});
//# sourceMappingURL=index.js.map