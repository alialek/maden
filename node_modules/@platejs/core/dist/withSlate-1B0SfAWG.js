import { ElementApi, IS_FIREFOX, NodeApi, OperationApi, PathApi, PointApi, RangeApi, TextApi, assignLegacyApi, assignLegacyTransforms, combineMatchOptions, createEditor, queryNode, syncLegacyMethods, withHistory } from "@platejs/slate";
import { nanoid } from "nanoid";
import { bindFirst, isDefined } from "@udecode/utils";
import merge from "lodash/merge.js";
import { createVanillaStore } from "zustand-x/vanilla";
import mergeWith from "lodash/mergeWith.js";
import defaults from "lodash/defaults.js";
import kebabCase from "lodash/kebabCase.js";
import pick from "lodash/pick.js";
import castArray from "lodash/castArray.js";
import { Path as Path$1 } from "slate";
import isEqual from "lodash/isEqual.js";
import isUndefined from "lodash/isUndefined.js";
import omitBy from "lodash/omitBy.js";
import { jsx } from "slate-hyperscript";
import cloneDeep from "lodash/cloneDeep.js";

//#region src/internal/utils/isFunction.ts
function isFunction(value) {
	return typeof value === "function";
}

//#endregion
//#region src/internal/utils/mergePlugins.ts
function mergePlugins(basePlugin, ...sourcePlugins) {
	return mergeWith({}, basePlugin, ...sourcePlugins, (objValue, srcValue, key) => {
		if (Array.isArray(srcValue)) return srcValue;
		if (key === "options") return {
			...objValue,
			...srcValue
		};
	});
}

//#endregion
//#region src/lib/plugin/createSlatePlugin.ts
/**
* Creates a new Plate plugin with the given configuration.
*
* @remarks
*   - The plugin's key is required and specified by the K generic.
*   - The `__extensions` array stores functions to be applied when `resolvePlugin`
*       is called with an editor.
*   - The `extend` method adds new extensions to be applied later.
*   - The `extendPlugin` method extends an existing plugin (including nested
*       plugins) or adds a new one if not found.
*
* @example
*   const myPlugin = createSlatePlugin<
*     'myPlugin',
*     MyOptions,
*     MyApi,
*     MyTransforms
*   >({
*     key: 'myPlugin',
*     options: { someOption: true },
*     transforms: { someTransform: () => {} },
*   });
*
*   const extendedPlugin = myPlugin.extend({
*     options: { anotherOption: false },
*   });
*
*   const pluginWithNestedExtension = extendedPlugin.extendPlugin(
*     nestedPlugin,
*     { options: { nestedOption: true } }
*   );
*
* @template K - The literal type of the plugin key.
* @template O - The type of the plugin options.
* @template A - The type of the plugin utilities.
* @template T - The type of the plugin transforms.
* @template S - The type of the plugin storage.
* @param {Partial<SlatePlugin<K, O, A, T, S>>} config - The configuration
*   object for the plugin.
* @returns {SlatePlugin<K, O, A, T, S>} A new Plate plugin instance with the
*   following properties and methods:
*
*   - All properties from the input config, merged with default values.
*   - `configure`: A method to create a new plugin instance with updated options.
*   - `extend`: A method to create a new plugin instance with additional
*       configuration.
*   - `extendPlugin`: A method to extend an existing plugin (including nested
*       plugins) or add a new one if not found.
*/
function createSlatePlugin(config = {}) {
	let baseConfig;
	let initialExtension;
	if (isFunction(config)) {
		baseConfig = { key: "" };
		initialExtension = (editor) => config(editor);
	} else baseConfig = config;
	const key = baseConfig.key ?? "";
	const plugin = mergePlugins({
		key,
		__apiExtensions: [],
		__configuration: null,
		__extensions: initialExtension ? [initialExtension] : [],
		__selectorExtensions: [],
		api: {},
		dependencies: [],
		editor: {},
		handlers: {},
		inject: {},
		node: { type: key },
		options: {},
		override: {},
		parser: {},
		parsers: {},
		plugins: [],
		priority: 100,
		render: {},
		rules: {},
		shortcuts: {},
		transforms: {}
	}, config);
	if (plugin.node.isLeaf && !isDefined(plugin.node.isDecoration)) plugin.node.isDecoration = true;
	plugin.configure = (config$1) => {
		const newPlugin = { ...plugin };
		newPlugin.__configuration = (ctx) => isFunction(config$1) ? config$1(ctx) : config$1;
		return createSlatePlugin(newPlugin);
	};
	plugin.configurePlugin = (p, config$1) => {
		const newPlugin = { ...plugin };
		const configureNestedPlugin = (plugins) => {
			let found = false;
			const updatedPlugins = plugins.map((nestedPlugin) => {
				if (nestedPlugin.key === p.key) {
					found = true;
					return createSlatePlugin({
						...nestedPlugin,
						__configuration: (ctx) => isFunction(config$1) ? config$1(ctx) : config$1
					});
				}
				if (nestedPlugin.plugins && nestedPlugin.plugins.length > 0) {
					const result = configureNestedPlugin(nestedPlugin.plugins);
					if (result.found) {
						found = true;
						return {
							...nestedPlugin,
							plugins: result.plugins
						};
					}
				}
				return nestedPlugin;
			});
			return {
				found,
				plugins: updatedPlugins
			};
		};
		newPlugin.plugins = configureNestedPlugin(newPlugin.plugins).plugins;
		return createSlatePlugin(newPlugin);
	};
	plugin.extendEditorApi = (extension) => {
		const newPlugin = { ...plugin };
		newPlugin.__apiExtensions = [...newPlugin.__apiExtensions, {
			extension,
			isPluginSpecific: false
		}];
		return createSlatePlugin(newPlugin);
	};
	plugin.extendSelectors = (extension) => {
		const newPlugin = { ...plugin };
		newPlugin.__selectorExtensions = [...newPlugin.__selectorExtensions, extension];
		return createSlatePlugin(newPlugin);
	};
	plugin.extendApi = (extension) => {
		const newPlugin = { ...plugin };
		newPlugin.__apiExtensions = [...newPlugin.__apiExtensions, {
			extension,
			isPluginSpecific: true
		}];
		return createSlatePlugin(newPlugin);
	};
	plugin.extendEditorTransforms = (extension) => {
		const newPlugin = { ...plugin };
		newPlugin.__apiExtensions = [...newPlugin.__apiExtensions, {
			extension,
			isPluginSpecific: false,
			isTransform: true
		}];
		return createSlatePlugin(newPlugin);
	};
	plugin.extendTransforms = (extension) => {
		const newPlugin = { ...plugin };
		newPlugin.__apiExtensions = [...newPlugin.__apiExtensions, {
			extension,
			isPluginSpecific: true,
			isTransform: true
		}];
		return createSlatePlugin(newPlugin);
	};
	plugin.overrideEditor = (extension) => {
		const newPlugin = { ...plugin };
		newPlugin.__apiExtensions = [...newPlugin.__apiExtensions, {
			extension,
			isOverride: true,
			isPluginSpecific: false,
			isTransform: true
		}];
		return createSlatePlugin(newPlugin);
	};
	plugin.extend = (extendConfig) => {
		let newPlugin = { ...plugin };
		if (isFunction(extendConfig)) newPlugin.__extensions = [...newPlugin.__extensions, extendConfig];
		else newPlugin = mergePlugins(newPlugin, extendConfig);
		return createSlatePlugin(newPlugin);
	};
	plugin.clone = () => mergePlugins(plugin);
	plugin.extendPlugin = (p, extendConfig) => {
		const newPlugin = { ...plugin };
		const extendNestedPlugin = (plugins) => {
			let found = false;
			const updatedPlugins = plugins.map((nestedPlugin) => {
				if (nestedPlugin.key === p.key) {
					found = true;
					return createSlatePlugin({
						...nestedPlugin,
						__extensions: [...nestedPlugin.__extensions, (ctx) => isFunction(extendConfig) ? extendConfig(ctx) : extendConfig]
					});
				}
				if (nestedPlugin.plugins && nestedPlugin.plugins.length > 0) {
					const result$1 = extendNestedPlugin(nestedPlugin.plugins);
					if (result$1.found) {
						found = true;
						return {
							...nestedPlugin,
							plugins: result$1.plugins
						};
					}
				}
				return nestedPlugin;
			});
			return {
				found,
				plugins: updatedPlugins
			};
		};
		const result = extendNestedPlugin(newPlugin.plugins);
		newPlugin.plugins = result.plugins;
		if (!result.found) newPlugin.plugins.push(createSlatePlugin({
			key: p.key,
			__extensions: [(ctx) => isFunction(extendConfig) ? extendConfig(ctx) : extendConfig]
		}));
		return createSlatePlugin(newPlugin);
	};
	plugin.withComponent = (component) => plugin.extend({
		node: { component },
		render: { node: component }
	});
	return plugin;
}
/**
* Explicitly typed version of `createSlatePlugin`.
*
* @remarks
*   While `createSlatePlugin` uses type inference, this function requires an
*   explicit type parameter. Use this when you need precise control over the
*   plugin's type structure or when type inference doesn't provide the desired
*   result.
*/
function createTSlatePlugin(config = {}) {
	return createSlatePlugin(config);
}

//#endregion
//#region src/lib/plugin/getEditorPlugin.ts
function getEditorPlugin(editor, p) {
	const plugin = editor.getPlugin(p);
	return {
		api: editor.api,
		editor,
		plugin,
		setOption: ((keyOrOptions, value) => editor.setOption(plugin, keyOrOptions, value)),
		setOptions: ((options) => editor.setOptions(plugin, options)),
		tf: editor.transforms,
		type: plugin.node.type,
		getOption: (key, ...args) => editor.getOption(plugin, key, ...args),
		getOptions: () => editor.getOptions(plugin)
	};
}

//#endregion
//#region src/internal/plugin/resolvePlugin.ts
/**
* Resolves and finalizes a plugin configuration for use in a Plate editor.
*
* This function processes a given plugin configuration, applying any extensions
* and resolving nested plugins. It prepares the plugin for integration into the
* Plate editor system by:
*
* 1. Cloning the plugin to avoid mutating the original
* 2. Applying all stored extensions to the plugin
* 3. Clearing the extensions array after application
*
* @example
*   const plugin = createSlatePlugin({ key: 'myPlugin', ...otherOptions }).extend(...);
*   const resolvedPlugin = resolvePlugin(editor, plugin);
*/
const resolvePlugin = (editor, _plugin) => {
	let plugin = mergePlugins({}, _plugin);
	plugin.__resolved = true;
	if (plugin.__configuration) {
		const configResult = plugin.__configuration(getEditorPlugin(editor, plugin));
		plugin = mergePlugins(plugin, configResult);
		plugin.__configuration = void 0;
	}
	if (plugin.__extensions && plugin.__extensions.length > 0) {
		for (const extension of plugin.__extensions) plugin = mergePlugins(plugin, extension(getEditorPlugin(editor, plugin)));
		plugin.__extensions = [];
	}
	const targetPluginToInject = plugin.inject?.targetPluginToInject;
	const targetPlugins = plugin.inject?.targetPlugins;
	if (targetPluginToInject && targetPlugins && targetPlugins.length > 0) {
		plugin.inject = plugin.inject || {};
		plugin.inject.plugins = merge({}, plugin.inject.plugins, Object.fromEntries(targetPlugins.map((targetPlugin) => {
			return [targetPlugin, targetPluginToInject({
				...getEditorPlugin(editor, plugin),
				targetPlugin
			})];
		})));
	}
	if (plugin.node?.component) plugin.render.node = plugin.node.component;
	if (plugin.render?.node) plugin.node.component = plugin.render.node;
	validatePlugin(editor, plugin);
	return plugin;
};
const validatePlugin = (editor, plugin) => {
	if (!plugin.__extensions) editor.api.debug.error(`Invalid plugin '${plugin.key}', you should use createSlatePlugin.`, "USE_CREATE_PLUGIN");
	if (plugin.node.isElement && plugin.node.isLeaf) editor.api.debug.error(`Plugin ${plugin.key} cannot be both an element and a leaf.`, "PLUGIN_NODE_TYPE");
};

//#endregion
//#region src/lib/plugin/getSlatePlugin.ts
/** Get editor plugin by key or plugin object. */
function getSlatePlugin(editor, p) {
	let plugin = p;
	const editorPlugin = editor.plugins[p.key];
	if (!editorPlugin) {
		if (!plugin.node) plugin = createSlatePlugin(plugin);
		return plugin.__resolved ? plugin : resolvePlugin(editor, plugin);
	}
	return editorPlugin;
}
/** Get editor plugin type by key or plugin object. */
function getPluginType(editor, key) {
	const p = editor.getPlugin({ key });
	return p.node.type ?? p.key ?? "";
}
/** Get editor plugin types by key. */
const getPluginTypes = (editor, keys) => keys.map((key) => editor.getType(key));
const getPluginKey = (editor, type) => editor.meta.pluginCache.node.types[type];
const getPluginKeys = (editor, types) => types.map((type) => {
	return getPluginKey(editor, type) ?? type;
}).filter(Boolean);
const getPluginByType = (editor, type) => {
	const key = getPluginKey(editor, type);
	if (!key) return null;
	return editor.getPlugin({ key });
};
const getContainerTypes = (editor) => getPluginTypes(editor, editor.meta.pluginCache.node.isContainer);

//#endregion
//#region src/internal/plugin/resolvePlugins.ts
const resolvePlugins = (editor, plugins = [], createStore = createVanillaStore) => {
	editor.plugins = {};
	editor.meta.pluginList = [];
	editor.meta.shortcuts = {};
	editor.meta.components = {};
	editor.meta.pluginCache = {
		decorate: [],
		handlers: {
			onChange: [],
			onNodeChange: [],
			onTextChange: []
		},
		inject: { nodeProps: [] },
		node: {
			isContainer: [],
			isLeaf: [],
			isText: [],
			leafProps: [],
			textProps: [],
			types: {}
		},
		normalizeInitialValue: [],
		render: {
			aboveEditable: [],
			aboveNodes: [],
			aboveSlate: [],
			afterContainer: [],
			afterEditable: [],
			beforeContainer: [],
			beforeEditable: [],
			belowNodes: [],
			belowRootNodes: []
		},
		rules: { match: [] },
		useHooks: []
	};
	const resolvedPlugins = resolveAndSortPlugins(editor, plugins);
	applyPluginsToEditor(editor, resolvedPlugins);
	resolvePluginOverrides(editor);
	resolvePluginStores(editor, createStore);
	editor.meta.pluginList.forEach((plugin) => {
		if (plugin.extendEditor) {
			editor = plugin.extendEditor(getEditorPlugin(editor, plugin));
			syncLegacyMethods(editor);
		}
		resolvePluginMethods(editor, plugin);
		if (plugin.node?.isContainer) editor.meta.pluginCache.node.isContainer.push(plugin.key);
		editor.meta.pluginCache.node.types[plugin.node.type] = plugin.key;
		if (plugin.inject?.nodeProps) editor.meta.pluginCache.inject.nodeProps.push(plugin.key);
		if (plugin.render?.node) editor.meta.components[plugin.key] = plugin.render.node;
		if (plugin.node?.isLeaf && (plugin.node?.isDecoration === true || plugin.render.leaf)) editor.meta.pluginCache.node.isLeaf.push(plugin.key);
		if (plugin.node.isLeaf && plugin.node.isDecoration === false) editor.meta.pluginCache.node.isText.push(plugin.key);
		if (plugin.node?.leafProps) editor.meta.pluginCache.node.leafProps.push(plugin.key);
		if (plugin.node.textProps) editor.meta.pluginCache.node.textProps.push(plugin.key);
		if (plugin.render.aboveEditable) editor.meta.pluginCache.render.aboveEditable.push(plugin.key);
		if (plugin.render.aboveSlate) editor.meta.pluginCache.render.aboveSlate.push(plugin.key);
		if (plugin.render.afterEditable) editor.meta.pluginCache.render.afterEditable.push(plugin.key);
		if (plugin.render.beforeEditable) editor.meta.pluginCache.render.beforeEditable.push(plugin.key);
		if (plugin.rules?.match) editor.meta.pluginCache.rules.match.push(plugin.key);
		if (plugin.render.afterContainer) editor.meta.pluginCache.render.afterContainer.push(plugin.key);
		if (plugin.render.beforeContainer) editor.meta.pluginCache.render.beforeContainer.push(plugin.key);
		if (plugin.render.belowRootNodes) editor.meta.pluginCache.render.belowRootNodes.push(plugin.key);
		if (plugin.normalizeInitialValue) editor.meta.pluginCache.normalizeInitialValue.push(plugin.key);
		if (plugin.decorate) editor.meta.pluginCache.decorate.push(plugin.key);
		if (plugin.render.aboveNodes) editor.meta.pluginCache.render.aboveNodes.push(plugin.key);
		if (plugin.render.belowNodes) editor.meta.pluginCache.render.belowNodes.push(plugin.key);
		if (plugin.useHooks) editor.meta.pluginCache.useHooks.push(plugin.key);
		if (plugin.handlers?.onChange) editor.meta.pluginCache.handlers.onChange.push(plugin.key);
		if (plugin.handlers?.onNodeChange) editor.meta.pluginCache.handlers.onNodeChange.push(plugin.key);
		if (plugin.handlers?.onTextChange) editor.meta.pluginCache.handlers.onTextChange.push(plugin.key);
	});
	resolvePluginShortcuts(editor);
	return editor;
};
const resolvePluginStores = (editor, createStore) => {
	editor.meta.pluginList.forEach((plugin) => {
		let store = createStore(plugin.options, {
			mutative: true,
			name: plugin.key
		});
		if (plugin.__selectorExtensions && plugin.__selectorExtensions.length > 0) plugin.__selectorExtensions.forEach((extension) => {
			const extendedOptions = extension(getEditorPlugin(editor, plugin));
			store = store.extendSelectors(() => extendedOptions);
		});
		plugin.optionsStore = store;
	});
};
const resolvePluginMethods = (editor, plugin) => {
	Object.entries(plugin.api).forEach(([apiKey, apiFunction]) => {
		editor.api[apiKey] = apiFunction;
	});
	if (plugin.__apiExtensions && plugin.__apiExtensions.length > 0) {
		plugin.__apiExtensions.forEach(({ extension, isOverride, isPluginSpecific, isTransform }) => {
			const newExtensions = extension(getEditorPlugin(editor, plugin));
			if (isOverride) {
				if (newExtensions.api) {
					merge(editor.api, newExtensions.api);
					merge(plugin.api, newExtensions.api);
					assignLegacyApi(editor, editor.api);
				}
				if (newExtensions.transforms) {
					merge(editor.transforms, newExtensions.transforms);
					merge(plugin.transforms, newExtensions.transforms);
					assignLegacyTransforms(editor, newExtensions.transforms);
				}
			} else if (isTransform) if (isPluginSpecific) {
				if (!editor.transforms[plugin.key]) editor.transforms[plugin.key] = {};
				if (!plugin.transforms[plugin.key]) plugin.transforms[plugin.key] = {};
				merge(editor.transforms[plugin.key], newExtensions);
				merge(plugin.transforms[plugin.key], newExtensions);
			} else {
				merge(editor.transforms, newExtensions);
				merge(plugin.transforms, newExtensions);
				assignLegacyTransforms(editor, newExtensions);
			}
			else if (isPluginSpecific) {
				if (!editor.api[plugin.key]) editor.api[plugin.key] = {};
				if (!plugin.api[plugin.key]) plugin.api[plugin.key] = {};
				merge(editor.api[plugin.key], newExtensions);
				merge(plugin.api[plugin.key], newExtensions);
			} else {
				merge(editor.api, newExtensions);
				merge(plugin.api, newExtensions);
				assignLegacyApi(editor, editor.api);
			}
		});
		plugin.__apiExtensions = void 0;
	}
};
const resolvePluginShortcuts = (editor) => {
	editor.meta.shortcuts = {};
	editor.meta.pluginList.forEach((plugin) => {
		Object.entries(plugin.shortcuts).forEach(([originalKey, hotkey]) => {
			const namespacedKey = `${plugin.key}.${originalKey}`;
			if (hotkey === null) delete editor.meta.shortcuts[namespacedKey];
			else if (hotkey && typeof hotkey === "object") {
				const resolvedHotkey = { ...hotkey };
				if (!resolvedHotkey.handler) {
					const pluginSpecificTransforms = plugin.transforms?.[plugin.key];
					const pluginSpecificApi = plugin.api?.[plugin.key];
					if (pluginSpecificTransforms?.[originalKey]) resolvedHotkey.handler = () => pluginSpecificTransforms[originalKey]();
					else if (pluginSpecificApi?.[originalKey]) resolvedHotkey.handler = () => pluginSpecificApi[originalKey]();
				}
				resolvedHotkey.priority = resolvedHotkey.priority ?? plugin.priority;
				editor.meta.shortcuts[namespacedKey] = resolvedHotkey;
			}
		});
	});
};
const flattenAndResolvePlugins = (editor, plugins) => {
	const pluginMap = /* @__PURE__ */ new Map();
	const processPlugin = (plugin) => {
		const resolvedPlugin = resolvePlugin(editor, plugin);
		if (resolvedPlugin.key) {
			const existingPlugin = pluginMap.get(resolvedPlugin.key);
			if (existingPlugin) pluginMap.set(resolvedPlugin.key, mergePlugins(existingPlugin, resolvedPlugin));
			else pluginMap.set(resolvedPlugin.key, resolvedPlugin);
		}
		if (resolvedPlugin.plugins && resolvedPlugin.plugins.length > 0) resolvedPlugin.plugins.forEach(processPlugin);
	};
	plugins.forEach(processPlugin);
	return pluginMap;
};
const resolveAndSortPlugins = (editor, plugins) => {
	const pluginMap = flattenAndResolvePlugins(editor, plugins);
	const enabledPlugins = Array.from(pluginMap.values()).filter((plugin) => plugin.enabled !== false);
	enabledPlugins.sort((a, b) => b.priority - a.priority);
	const orderedPlugins = [];
	const visited = /* @__PURE__ */ new Set();
	const visit = (plugin) => {
		if (visited.has(plugin.key)) return;
		visited.add(plugin.key);
		plugin.dependencies?.forEach((depKey) => {
			const depPlugin = pluginMap.get(depKey);
			if (depPlugin) visit(depPlugin);
			else editor.api.debug.warn(`Plugin "${plugin.key}" depends on missing plugin "${depKey}"`, "PLUGIN_DEPENDENCY_MISSING");
		});
		orderedPlugins.push(plugin);
	};
	enabledPlugins.forEach(visit);
	return orderedPlugins;
};
const applyPluginsToEditor = (editor, plugins) => {
	editor.meta.pluginList = plugins;
	editor.plugins = Object.fromEntries(plugins.map((plugin) => [plugin.key, plugin]));
};
const resolvePluginOverrides = (editor) => {
	const applyOverrides = (plugins) => {
		let overriddenPlugins = [...plugins];
		const enabledOverrides = {};
		const componentOverrides = {};
		const pluginOverrides = {};
		for (const plugin of plugins) {
			if (plugin.override.enabled) Object.assign(enabledOverrides, plugin.override.enabled);
			if (plugin.override.components) Object.entries(plugin.override.components).forEach(([key, component]) => {
				if (!componentOverrides[key] || plugin.priority > componentOverrides[key].priority) componentOverrides[key] = {
					component,
					priority: plugin.priority
				};
			});
			if (plugin.override.plugins) Object.entries(plugin.override.plugins).forEach(([key, value]) => {
				pluginOverrides[key] = mergePlugins(pluginOverrides[key], value);
				if (value.enabled !== void 0) enabledOverrides[key] = value.enabled;
			});
		}
		overriddenPlugins = overriddenPlugins.map((p) => {
			let updatedPlugin = { ...p };
			if (pluginOverrides[p.key]) updatedPlugin = mergePlugins(updatedPlugin, pluginOverrides[p.key]);
			if (componentOverrides[p.key] && (!p.render.node && !p.node.component || componentOverrides[p.key].priority > p.priority)) {
				updatedPlugin.render.node = componentOverrides[p.key].component;
				updatedPlugin.node.component = componentOverrides[p.key].component;
			}
			const enabled = enabledOverrides[p.key] ?? updatedPlugin.enabled;
			if (isDefined(enabled)) updatedPlugin.enabled = enabled;
			return updatedPlugin;
		});
		return overriddenPlugins.filter((p) => p.enabled !== false).map((plugin) => ({
			...plugin,
			plugins: applyOverrides(plugin.plugins || [])
		}));
	};
	editor.meta.pluginList = applyOverrides(editor.meta.pluginList);
	editor.plugins = Object.fromEntries(editor.meta.pluginList.map((plugin) => [plugin.key, plugin]));
};

//#endregion
//#region src/lib/plugins/AstPlugin.ts
/**
* Enables support for deserializing inserted content from Slate Ast format to
* Slate format while apply a small bug fix.
*/
const AstPlugin = createSlatePlugin({
	key: "ast",
	parser: {
		format: "application/x-slate-fragment",
		deserialize: ({ data }) => {
			const decoded = decodeURIComponent(window.atob(data));
			let parsed;
			try {
				parsed = JSON.parse(decoded);
			} catch {}
			return parsed;
		}
	}
});

//#endregion
//#region src/lib/plugins/HistoryPlugin.ts
const withPlateHistory = ({ editor }) => withHistory(editor);
/** @see {@link withHistory} */
const HistoryPlugin = createSlatePlugin({
	key: "history",
	extendEditor: withPlateHistory
});

//#endregion
//#region src/lib/plugins/paragraph/BaseParagraphPlugin.ts
const BaseParagraphPlugin = createSlatePlugin({
	key: "p",
	node: { isElement: true },
	parsers: { html: { deserializer: {
		rules: [{ validNodeName: "P" }],
		query: ({ element }) => element.style.fontFamily !== "Consolas"
	} } },
	rules: { merge: { removeEmpty: true } }
});

//#endregion
//#region src/lib/plugins/override/withBreakRules.ts
const withBreakRules = (ctx) => {
	const { editor, tf: { insertBreak } } = ctx;
	const checkMatchRulesOverride = (rule, blockNode, blockPath) => {
		const matchRulesKeys = editor.meta.pluginCache.rules.match;
		for (const key of matchRulesKeys) {
			const overridePlugin = editor.getPlugin({ key });
			if (overridePlugin.rules?.break && overridePlugin.rules?.match?.({
				...ctx,
				node: blockNode,
				path: blockPath,
				rule
			})) return overridePlugin.rules.break;
		}
		return null;
	};
	const executeBreakAction = (action, blockPath) => {
		if (action === "reset") {
			editor.tf.resetBlock({ at: blockPath });
			return true;
		}
		if (action === "exit") {
			editor.tf.insertExitBreak();
			return true;
		}
		if (action === "deleteExit") {
			editor.tf.deleteBackward("character");
			editor.tf.insertExitBreak();
			return true;
		}
		if (action === "lineBreak") {
			editor.tf.insertSoftBreak();
			return true;
		}
		return false;
	};
	return { transforms: { insertBreak() {
		if (editor.selection && editor.api.isCollapsed()) {
			const block = editor.api.block();
			if (block) {
				const [blockNode, blockPath] = block;
				const breakRules = getPluginByType(editor, blockNode.type)?.rules.break;
				if (editor.api.isEmpty(editor.selection, { block: true })) {
					const emptyAction = (checkMatchRulesOverride("break.empty", blockNode, blockPath) || breakRules)?.empty;
					if (executeBreakAction(emptyAction, blockPath)) return;
				}
				if (!editor.api.isEmpty(editor.selection, { block: true }) && editor.api.isAt({ end: true })) {
					const range = editor.api.range("before", editor.selection);
					if (range) {
						if (editor.api.string(range) === "\n") {
							const emptyLineEndAction = (checkMatchRulesOverride("break.emptyLineEnd", blockNode, blockPath) || breakRules)?.emptyLineEnd;
							if (executeBreakAction(emptyLineEndAction, blockPath)) return;
						}
					}
				}
				const defaultAction = (checkMatchRulesOverride("break.default", blockNode, blockPath) || breakRules)?.default;
				if (executeBreakAction(defaultAction, blockPath)) return;
				if (checkMatchRulesOverride("break.splitReset", blockNode, blockPath)?.splitReset ?? breakRules?.splitReset) {
					const isAtStart = editor.api.isAt({ start: true });
					insertBreak();
					editor.tf.resetBlock({ at: isAtStart ? blockPath : PathApi.next(blockPath) });
					return;
				}
			}
		}
		insertBreak();
	} } };
};

//#endregion
//#region src/lib/plugins/override/withDeleteRules.ts
const withDeleteRules = (ctx) => {
	const { editor, tf: { deleteBackward, deleteForward, deleteFragment } } = ctx;
	const resetMarks = () => {
		if (editor.api.isAt({ start: true })) editor.tf.removeMarks();
	};
	const checkMatchRulesOverride = (rule, blockNode, blockPath) => {
		const matchRulesKeys = editor.meta.pluginCache.rules.match;
		for (const key of matchRulesKeys) {
			const overridePlugin = editor.getPlugin({ key });
			if (overridePlugin.rules?.delete && overridePlugin.rules?.match?.({
				...ctx,
				node: blockNode,
				path: blockPath,
				rule
			})) return overridePlugin.rules.delete;
		}
		return null;
	};
	const executeDeleteAction = (action, blockPath) => {
		if (action === "reset") {
			editor.tf.resetBlock({ at: blockPath });
			return true;
		}
		return false;
	};
	return { transforms: {
		deleteBackward(unit) {
			if (editor.selection && editor.api.isCollapsed()) {
				const block = editor.api.block();
				if (block) {
					const [blockNode, blockPath] = block;
					const deleteRules = getPluginByType(editor, blockNode.type)?.rules.delete;
					if (editor.api.isAt({ start: true })) {
						const startAction = (checkMatchRulesOverride("delete.start", blockNode, blockPath) || deleteRules)?.start;
						if (executeDeleteAction(startAction, blockPath)) return;
					}
					if (editor.api.isEmpty(editor.selection, { block: true })) {
						const emptyAction = (checkMatchRulesOverride("delete.empty", blockNode, blockPath) || deleteRules)?.empty;
						if (executeDeleteAction(emptyAction, blockPath)) return;
					}
				}
				if (PointApi.equals(editor.selection.anchor, editor.api.start([]))) {
					editor.tf.resetBlock({ at: [0] });
					return;
				}
			}
			deleteBackward(unit);
			resetMarks();
		},
		deleteForward(unit) {
			deleteForward(unit);
			resetMarks();
		},
		deleteFragment(options) {
			if (editor.selection && RangeApi.equals(editor.selection, editor.api.range([]))) {
				editor.tf.reset({
					children: true,
					select: true
				});
				return;
			}
			deleteFragment(options);
			resetMarks();
		}
	} };
};

//#endregion
//#region src/lib/plugins/override/withMergeRules.ts
const withMergeRules = (ctx) => {
	const { editor, tf: { removeNodes } } = ctx;
	const checkMatchRulesOverride = (rule, blockNode, blockPath) => {
		const matchRulesKeys = editor.meta.pluginCache.rules.match;
		for (const key of matchRulesKeys) {
			const overridePlugin = editor.getPlugin({ key });
			if (overridePlugin.rules.merge && overridePlugin.rules?.match?.({
				...ctx,
				node: blockNode,
				path: blockPath,
				rule
			})) return overridePlugin.rules.merge;
		}
		return null;
	};
	return {
		api: { shouldMergeNodes(prevNodeEntry, nextNodeEntry, { reverse } = {}) {
			const [prevNode, prevPath] = prevNodeEntry;
			const [, nextPath] = nextNodeEntry;
			const [curNode, curPath] = reverse ? prevNodeEntry : nextNodeEntry;
			const [targetNode, targetPath] = reverse ? nextNodeEntry : prevNodeEntry;
			if (TextApi.isText(prevNode) && prevNode.text === "" && prevPath.at(-1) !== 0) {
				editor.tf.removeNodes({ at: prevPath });
				return false;
			}
			const shouldRemove = (node, path) => {
				const plugin = getPluginByType(editor, node.type);
				if (!plugin) return true;
				if (!plugin.rules.merge?.removeEmpty) return false;
				if (checkMatchRulesOverride("merge.removeEmpty", node, path)?.removeEmpty === false) return false;
				return true;
			};
			if (ElementApi.isElement(targetNode) && editor.api.isVoid(targetNode)) {
				if (shouldRemove(targetNode, targetPath)) editor.tf.removeNodes({ at: prevPath });
				else if (ElementApi.isElement(curNode) && editor.api.isEmpty(curNode)) editor.tf.removeNodes({ at: curPath });
				return false;
			}
			if (ElementApi.isElement(prevNode) && editor.api.isEmpty(prevNode) && PathApi.isSibling(prevPath, nextPath) && shouldRemove(prevNode, prevPath)) {
				editor.tf.removeNodes({ at: prevPath });
				return false;
			}
			return true;
		} },
		transforms: { removeNodes(options = {}) {
			if (options.event?.type === "mergeNodes" && options.at) {
				const nodeEntry = editor.api.node(options.at);
				if (nodeEntry) {
					const [node, path] = nodeEntry;
					if (ElementApi.isElement(node)) {
						const plugin = getPluginByType(editor, node.type);
						if (plugin) {
							const mergeRules = plugin.rules.merge;
							if (checkMatchRulesOverride("merge.removeEmpty", node, path)?.removeEmpty === false || mergeRules?.removeEmpty === false) return;
						}
					}
				}
			}
			removeNodes(options);
		} }
	};
};

//#endregion
//#region src/lib/plugins/override/withNormalizeRules.ts
const withNormalizeRules = (ctx) => {
	const { editor, tf: { normalizeNode } } = ctx;
	const checkMatchRulesOverride = (rule, node, path) => {
		const matchRulesKeys = editor.meta.pluginCache.rules.match;
		for (const key of matchRulesKeys) {
			const overridePlugin = editor.getPlugin({ key });
			if (overridePlugin.rules?.normalize && overridePlugin.rules?.match?.({
				...ctx,
				node,
				path,
				rule
			})) return overridePlugin.rules.normalize;
		}
		return null;
	};
	return { transforms: { normalizeNode([node, path]) {
		if (ElementApi.isElement(node) && node.type) {
			const normalizeRules = getPluginByType(editor, node.type)?.rules.normalize;
			if ((checkMatchRulesOverride("normalize.removeEmpty", node, path) || normalizeRules)?.removeEmpty && editor.api.isEmpty(node)) {
				editor.tf.removeNodes({ at: path });
				return;
			}
		}
		normalizeNode([node, path]);
	} } };
};

//#endregion
//#region src/lib/plugins/override/OverridePlugin.ts
/**
* Merge and register all the inline types and void types from the plugins and
* options, using `editor.api.isInline`, `editor.api.markableVoid` and
* `editor.api.isVoid`
*/
const withOverrides = ({ api: { isInline, isSelectable, isVoid, markableVoid }, editor }) => {
	return { api: {
		create: { block: (node) => ({
			children: [{ text: "" }],
			type: editor.getType(BaseParagraphPlugin.key),
			...node
		}) },
		isInline(element) {
			return getPluginByType(editor, element.type)?.node.isInline ? true : isInline(element);
		},
		isSelectable(element) {
			return getPluginByType(editor, element.type)?.node.isSelectable === false ? false : isSelectable(element);
		},
		isVoid(element) {
			return getPluginByType(editor, element.type)?.node.isVoid ? true : isVoid(element);
		},
		markableVoid(element) {
			return getPluginByType(editor, element.type)?.node.isMarkableVoid ? true : markableVoid(element);
		}
	} };
};
/** Override the editor api and transforms based on the plugins. */
const OverridePlugin = createSlatePlugin({ key: "override" }).overrideEditor(withOverrides).overrideEditor(withBreakRules).overrideEditor(withDeleteRules).overrideEditor(withMergeRules).overrideEditor(withNormalizeRules);

//#endregion
//#region src/internal/plugin/pipeInsertFragment.ts
/** Pipe preInsert then insertFragment. */
const pipeInsertFragment = (editor, injectedPlugins, { fragment, ...options }) => {
	editor.tf.withoutNormalizing(() => {
		injectedPlugins.some((p) => p.parser?.preInsert?.({
			...getEditorPlugin(editor, p),
			fragment,
			...options
		}) === true);
		editor.tf.insertFragment(fragment);
	});
};

//#endregion
//#region src/internal/plugin/pipeTransformData.ts
/** Pipe editor.tf.insertData.transformData */
const pipeTransformData = (editor, plugins, { data, ...options }) => {
	plugins.forEach((p) => {
		const transformData = p.parser?.transformData;
		if (!transformData) return;
		data = transformData({
			...getEditorPlugin(editor, p),
			data,
			...options
		});
	});
	return data;
};

//#endregion
//#region src/internal/plugin/pipeTransformFragment.ts
/** Pipe editor.tf.insertData.transformFragment */
const pipeTransformFragment = (editor, plugins, { fragment, ...options }) => {
	plugins.forEach((p) => {
		const transformFragment = p.parser?.transformFragment;
		if (!transformFragment) return;
		fragment = transformFragment({
			fragment,
			...options,
			...getEditorPlugin(editor, p)
		});
	});
	return fragment;
};

//#endregion
//#region src/lib/utils/applyDeepToNodes.ts
/** Recursively apply an operation to children nodes with a query. */
const applyDeepToNodes = ({ apply, node, path = [], query, source }) => {
	if (queryNode([node, path], query)) if (typeof source === "function") apply(node, source());
	else apply(node, source);
	if (!NodeApi.isAncestor(node)) return;
	node.children.forEach((child, index) => {
		applyDeepToNodes({
			apply,
			node: child,
			path: path.concat([index]),
			query,
			source
		});
	});
};

//#endregion
//#region src/lib/utils/checkUtils.ts
const isSlateVoid = (element) => element.dataset.slateVoid === "true";
const isSlateElement = (element) => element.dataset.slateNode === "element";
const isSlateText = (element) => element.dataset.slateNode === "text";
const isSlateString = (element) => element.dataset.slateString === "true";
const isSlateLeaf = (element) => element.dataset.slateLeaf === "true";
const isSlateEditor = (element) => element.dataset.slateEditor === "true";
const isSlateNode = (element) => isSlateLeaf(element) || isSlateElement(element) || isSlateVoid(element) || isSlateString(element) || isSlateText(element);
const isSlatePluginElement = (element, pluginKey) => element.dataset.slateNode === "element" && element.classList.contains(`slate-${pluginKey}`);
const isSlatePluginNode = (element, pluginKey) => element.classList.contains(`slate-${pluginKey}`);
const getSlateElements = (element) => Array.from(element.querySelectorAll("[data-slate-node=\"element\"]"));

//#endregion
//#region src/lib/utils/defaultsDeepToNodes.ts
/** Recursively merge a source object to children nodes with a query. */
const defaultsDeepToNodes = (options) => {
	applyDeepToNodes({
		...options,
		apply: defaults
	});
};

//#endregion
//#region src/lib/utils/getInjectMatch.ts
const getInjectMatch = (editor, plugin) => {
	return (node, path) => {
		const { inject: { excludeBelowPlugins, excludePlugins, isBlock: _isBlock, isElement: _isElement, isLeaf, maxLevel, targetPlugins } } = plugin;
		const element = ElementApi.isElement(node) ? node : void 0;
		if (_isElement && !element) return false;
		if (_isBlock && (!element || !editor.api.isBlock(element))) return false;
		if (isLeaf && element) return false;
		if (element?.type) {
			if (excludePlugins?.includes(getPluginKey(editor, element.type))) return false;
			if (targetPlugins && !targetPlugins.includes(getPluginKey(editor, element.type))) return false;
		}
		if (excludeBelowPlugins || maxLevel) {
			if (maxLevel && path.length > maxLevel) return false;
			if (excludeBelowPlugins) {
				const excludeTypes = getPluginKeys(editor, excludeBelowPlugins);
				if (editor.api.above({
					at: path,
					match: (n) => ElementApi.isElement(n) && excludeTypes.includes(n.type)
				})) return false;
			}
		}
		return true;
	};
};

//#endregion
//#region src/lib/utils/getInjectedPlugins.ts
/**
* Get all plugins having a defined `inject.plugins[plugin.key]`. It includes
* `plugin` itself.
*/
const getInjectedPlugins = (editor, plugin) => {
	const injectedPlugins = [];
	[...editor.meta.pluginList].reverse().forEach((p) => {
		const injectedPlugin = p.inject.plugins?.[plugin.key];
		if (injectedPlugin) injectedPlugins.push(injectedPlugin);
	});
	return [plugin, ...injectedPlugins];
};

//#endregion
//#region src/lib/utils/getNodeDataAttributeKeys.ts
const getNodeDataAttributeKeys = (node) => Object.keys(node).filter((key) => typeof node[key] !== "object" && (!TextApi.isText(node) || key !== "text")).map((key) => keyToDataAttribute(key));
const keyToDataAttribute = (key) => `data-slate-${kebabCase(key)}`;

//#endregion
//#region src/lib/utils/getPluginNodeProps.ts
const getPluginNodeProps = ({ attributes: nodeAttributes, node, plugin, props }) => {
	const newProps = {
		...props,
		attributes: { ...props.attributes }
	};
	if (plugin?.node.props) {
		const pluginNodeProps = (typeof plugin.node.props === "function" ? plugin.node.props(newProps) : plugin.node.props) ?? {};
		newProps.attributes = {
			...newProps.attributes,
			...pluginNodeProps
		};
	}
	if (nodeAttributes && plugin) newProps.attributes = {
		...newProps.attributes,
		...pick(
			nodeAttributes,
			/**
			* WARNING: Improper use of `dangerouslyAllowAttributes` WILL make your
			* application vulnerable to cross-site scripting (XSS) or information
			* exposure attacks.
			*
			* @see {@link BasePluginNode.dangerouslyAllowAttributes}
			*/
			...plugin.node.dangerouslyAllowAttributes ?? [],
			[...node ? getNodeDataAttributeKeys(node) : []]
		)
	};
	Object.keys(newProps.attributes).forEach((key) => {
		if (newProps.attributes?.[key] === void 0) delete newProps.attributes?.[key];
	});
	return newProps;
};

//#endregion
//#region src/lib/utils/getSlateClass.ts
/** Get slate class name: slate-<type> */
const getSlateClass = (type) => type ? `slate-${type}` : "";

//#endregion
//#region src/lib/utils/mergeDeepToNodes.ts
/** Recursively merge a source object to children nodes with a query. */
const mergeDeepToNodes = (options) => {
	applyDeepToNodes({
		...options,
		apply: merge
	});
};

//#endregion
//#region src/lib/plugins/affinity/queries/getEdgeNodes.ts
/**
* When the cursor is at a mark edge, this function returns the inward node and
* the outward node (if any). If the cursor is at the start of the text, then
* the node before the text is returned. If the cursor is at the end of the
* text, then the node after the text is returned. Otherwise, null is returned.
*/
const getEdgeNodes = (editor) => {
	if (!editor.api.isCollapsed()) return null;
	const cursor = editor.selection.anchor;
	const textRange = editor.api.range(cursor.path);
	if (!textRange) return null;
	const edge = editor.api.isStart(cursor, textRange) ? "start" : editor.api.isEnd(cursor, textRange) ? "end" : null;
	if (!edge) return null;
	const parent = NodeApi.parent(editor, cursor.path) ?? null;
	/** Inline elements */
	const isAffinityInlineElement = (() => {
		if (!parent || !ElementApi.isElement(parent)) return false;
		const parentAffinity = getPluginByType(editor, parent.type)?.rules.selection?.affinity;
		return parentAffinity === "hard" || parentAffinity === "directional";
	})();
	const nodeEntry = isAffinityInlineElement ? [parent, PathApi.parent(cursor.path)] : [NodeApi.get(editor, cursor.path), cursor.path];
	if (edge === "start" && cursor.path.at(-1) === 0 && !isAffinityInlineElement) return [null, nodeEntry];
	const siblingPath = edge === "end" ? Path$1.next(nodeEntry[1]) : Path$1.previous(nodeEntry[1]);
	const siblingNode = NodeApi.get(editor, siblingPath);
	const siblingEntry = siblingNode ? [siblingNode, siblingPath] : null;
	return edge === "end" ? [nodeEntry, siblingEntry] : [siblingEntry, nodeEntry];
};

//#endregion
//#region src/lib/plugins/affinity/queries/getMarkBoundaryAffinity.ts
const getMarkBoundaryAffinity = (editor, markBoundary) => {
	const { marks, selection } = editor;
	if (!selection) return;
	const marksMatchLeaf = (leaf) => marks && isEqual(NodeApi.extractProps(leaf), marks) && Object.keys(marks).length > 1;
	const [backwardLeafEntry, forwardLeafEntry] = markBoundary;
	if (!backwardLeafEntry || !forwardLeafEntry) {
		const leafEntry = backwardLeafEntry || forwardLeafEntry;
		if (!marks || marksMatchLeaf(leafEntry[0])) return leafEntry === backwardLeafEntry ? "backward" : "forward";
		return;
	}
	const marksDirection = marks && (() => {
		if (backwardLeafEntry && marksMatchLeaf(backwardLeafEntry[0])) return "backward";
		if (forwardLeafEntry && marksMatchLeaf(forwardLeafEntry[0])) return "forward";
		return null;
	})();
	const selectionDirection = selection.anchor.offset === 0 ? "forward" : "backward";
	if (selectionDirection === "backward" && marksDirection === "forward") return "forward";
	if (IS_FIREFOX && selectionDirection === "forward" && marksDirection !== "backward") return "forward";
	return "backward";
};

//#endregion
//#region src/lib/plugins/affinity/queries/isNodeAffinity.ts
const isNodeAffinity = (editor, node, affinity) => {
	const marks = Object.keys(NodeApi.extractProps(node));
	return (ElementApi.isElement(node) ? [node.type] : marks).some((type) => getPluginByType(editor, type)?.rules.selection?.affinity === affinity);
};
const isNodesAffinity = (editor, edgeNodes, affinity) => {
	const [backwardLeafEntry, forwardLeafEntry] = edgeNodes;
	return backwardLeafEntry && isNodeAffinity(editor, backwardLeafEntry[0], affinity) || forwardLeafEntry && isNodeAffinity(editor, forwardLeafEntry[0], affinity);
};

//#endregion
//#region src/lib/plugins/affinity/transforms/setAffinitySelection.ts
const setAffinitySelection = (editor, edgeNodes, affinity) => {
	const setMarks = (marks) => {
		editor.marks = marks;
		editor.api.onChange();
	};
	const select = (point) => {
		editor.tf.setSelection({
			anchor: point,
			focus: point
		});
	};
	const [before, after] = edgeNodes;
	if (affinity === "backward") {
		if (before === null) {
			setMarks({});
			return;
		}
		const beforeEnd = editor.api.end(before[1]);
		if (beforeEnd) select(beforeEnd);
		if (ElementApi.isElement(before[0])) return;
		setMarks(null);
		return;
	}
	if (before === null) {
		setMarks(null);
		return;
	}
	if (after === null) {
		setMarks({});
		return;
	}
	select(editor.api.end(before[1]));
	if (ElementApi.isElement(after[0])) return;
	setMarks(NodeApi.extractProps(after[0]));
};

//#endregion
//#region src/lib/plugins/affinity/AffinityPlugin.ts
const AffinityPlugin = createTSlatePlugin({ key: "affinity" }).overrideEditor(({ editor, tf: { deleteBackward, insertText, move } }) => ({ transforms: {
	deleteBackward: (unit) => {
		const apply = () => {
			if (unit === "character" && editor.api.isCollapsed()) {
				const [start] = getEdgeNodes(editor) ?? [null];
				const startText = start && (TextApi.isText(start[0]) ? start[0].text : NodeApi.string(start[0]));
				deleteBackward(unit);
				const edgeNodes = getEdgeNodes(editor);
				if (edgeNodes && isNodesAffinity(editor, edgeNodes, "directional") && !hasElement(edgeNodes)) setAffinitySelection(editor, edgeNodes, startText && startText.length > 1 ? "backward" : "forward");
				return true;
			}
		};
		if (apply()) return;
		deleteBackward(unit);
	},
	insertText(text, options) {
		/** This will be computed only for text nodes with marks. */
		const applyOutwardAffinity = () => {
			if (!editor.selection || editor.api.isExpanded()) return;
			const textPath = editor.selection.focus.path;
			const textNode = NodeApi.get(editor, textPath);
			if (!textNode) return;
			const outwardMarks = Object.keys(NodeApi.extractProps(textNode)).filter((type) => getPluginByType(editor, type)?.rules.selection?.affinity === "outward");
			if (!outwardMarks.length || !editor.api.isEnd(editor.selection.focus, textPath)) return;
			const nextPoint = editor.api.start(textPath, { next: true });
			const marksToRemove = [];
			let nextTextNode = null;
			if (nextPoint) {
				const nextTextPath = nextPoint.path;
				nextTextNode = NodeApi.get(editor, nextTextPath) || null;
			}
			for (const markKey of outwardMarks) {
				if (!textNode[markKey]) continue;
				if (!nextTextNode?.[markKey]) marksToRemove.push(markKey);
			}
			if (marksToRemove.length > 0) editor.tf.removeMarks(marksToRemove);
		};
		applyOutwardAffinity();
		return insertText(text, options);
	},
	move: (options) => {
		const apply = () => {
			const { distance = 1, reverse = false, unit = "character" } = options || {};
			if (unit === "character" && distance === 1 && editor.api.isCollapsed()) {
				const preEdgeNodes = getEdgeNodes(editor);
				if (preEdgeNodes && isNodesAffinity(editor, preEdgeNodes, "hard")) {
					if (preEdgeNodes && preEdgeNodes[reverse ? 0 : 1] === null && getMarkBoundaryAffinity(editor, preEdgeNodes) === (reverse ? "forward" : "backward")) {
						setAffinitySelection(editor, preEdgeNodes, reverse ? "backward" : "forward");
						return true;
					}
					move({
						...options,
						unit: "offset"
					});
					return true;
				}
				move(options);
				const postEdgeNodes = getEdgeNodes(editor);
				/**
				* If the move places the cursor at a mark boundary, then the affinity
				* should be set to the direction the cursor came from.
				*/
				if (postEdgeNodes && isNodesAffinity(editor, postEdgeNodes, "directional") && !hasElement(postEdgeNodes)) setAffinitySelection(editor, postEdgeNodes, reverse ? "forward" : "backward");
				return true;
			}
		};
		if (apply()) return;
		move(options);
	}
} }));
const hasElement = (edgeNodes) => {
	const [before, after] = edgeNodes;
	return before && ElementApi.isElement(before[0]) || after && ElementApi.isElement(after[0]);
};

//#endregion
//#region src/lib/plugins/chunking/withChunking.ts
const withChunking = ({ editor, getOptions }) => {
	const { chunkSize, query } = getOptions();
	editor.getChunkSize = (ancestor) => query(ancestor) ? chunkSize : null;
	return {};
};

//#endregion
//#region src/lib/plugins/chunking/ChunkingPlugin.ts
const ChunkingPlugin = createTSlatePlugin({
	key: "chunking",
	options: {
		chunkSize: 1e3,
		contentVisibilityAuto: true,
		query: NodeApi.isEditor
	}
}).overrideEditor(withChunking);

//#endregion
//#region src/lib/plugins/debug/DebugPlugin.ts
var PlateError = class extends Error {
	type;
	constructor(message, type = "DEFAULT") {
		super(`[${type}] ${message}`);
		this.name = "PlateError";
		this.type = type;
	}
};
const DebugPlugin = createTSlatePlugin({
	key: "debug",
	options: {
		isProduction: process.env.NODE_ENV === "production",
		logger: {
			error: (message, type, details) => console.error(`${type ? `[${type}] ` : ""}${message}`, details),
			info: (message, type, details) => console.info(`${type ? `[${type}] ` : ""}${message}`, details),
			log: (message, type, details) => console.log(`${type ? `[${type}] ` : ""}${message}`, details),
			warn: (message, type, details) => console.warn(`${type ? `[${type}] ` : ""}${message}`, details)
		},
		logLevel: process.env.NODE_ENV === "production" ? "error" : "log",
		throwErrors: true
	}
}).extendEditorApi(({ getOptions }) => {
	const logLevels = [
		"error",
		"warn",
		"info",
		"log"
	];
	const log = (level, message, type, details) => {
		if (process.env.NODE_ENV === "production") return;
		const options = getOptions();
		if (options.isProduction && level === "log") return;
		if (logLevels.indexOf(level) <= logLevels.indexOf(options.logLevel)) {
			if (level === "error" && options.throwErrors) throw new PlateError(message, type);
			options.logger[level]?.(message, type, details);
		}
	};
	return { debug: {
		error: (message, type, details) => log("error", message, type, details),
		info: (message, type, details) => log("info", message, type, details),
		log: (message, type, details) => log("log", message, type, details),
		warn: (message, type, details) => log("warn", message, type, details)
	} };
});

//#endregion
//#region src/lib/plugins/dom/withScrolling.ts
const withScrolling = (editor, fn, options) => {
	const prevOptions = editor.getOptions(DOMPlugin);
	const prevAutoScroll = AUTO_SCROLL.get(editor) ?? false;
	if (options) {
		const ops = {
			...prevOptions,
			...omitBy(options, isUndefined)
		};
		editor.setOptions(DOMPlugin, ops);
	}
	AUTO_SCROLL.set(editor, true);
	fn();
	AUTO_SCROLL.set(editor, prevAutoScroll);
	editor.setOptions(DOMPlugin, prevOptions);
};

//#endregion
//#region src/lib/plugins/dom/DOMPlugin.ts
const AUTO_SCROLL = /* @__PURE__ */ new WeakMap();
/**
* Placeholder plugin for DOM interaction, that could be replaced with
* ReactPlugin.
*/
const DOMPlugin = createTSlatePlugin({
	key: "dom",
	options: {
		scrollMode: "last",
		scrollOperations: {
			insert_node: true,
			insert_text: true
		},
		scrollOptions: { scrollMode: "if-needed" }
	}
}).extendEditorApi(({ editor }) => ({ isScrolling: () => AUTO_SCROLL.get(editor) ?? false })).extendEditorTransforms(({ editor }) => ({ withScrolling: bindFirst(withScrolling, editor) })).overrideEditor(({ api, editor, getOption, tf: { apply } }) => ({ transforms: { apply(operation) {
	if (api.isScrolling()) {
		apply(operation);
		const scrollOperations = getOption("scrollOperations");
		if (!scrollOperations[operation.type]) return;
		const matched = editor.operations.filter((op) => !!scrollOperations[op.type]);
		if (matched.length === 0) return;
		const targetOp = getOption("scrollMode") === "first" ? matched[0] : matched.at(-1);
		if (!targetOp) return;
		const { offset, path } = targetOp.path ? targetOp : {};
		if (!path) return;
		const scrollOptions = getOption("scrollOptions");
		const scrollTarget = {
			offset: offset ?? 0,
			path
		};
		api.scrollIntoView(scrollTarget, scrollOptions);
		return;
	}
	return apply(operation);
} } })).overrideEditor(({ editor, tf: { apply } }) => ({ transforms: { apply(operation) {
	if (operation.type === "set_selection") {
		const { properties } = operation;
		editor.dom.prevSelection = properties;
		apply(operation);
		editor.dom.currentKeyboardEvent = null;
		return;
	}
	apply(operation);
} } }));

//#endregion
//#region src/lib/plugins/html/utils/isHtmlElement.ts
const isHtmlElement = (node) => node.nodeType === Node.ELEMENT_NODE;

//#endregion
//#region src/lib/plugins/html/utils/isHtmlText.ts
const isHtmlText = (node) => node.nodeType === Node.TEXT_NODE;

//#endregion
//#region src/lib/plugins/html/utils/inlineTagNames.ts
/**
* # Methodology
*
* ## Step 1. Get the list of all standard tag names
*
* Go to https://developer.mozilla.org/en-US/docs/Web/HTML/Element and run the
* following in the console to generate a JSON array of tag names:
*
* ```js
* JSON.stringify(
*   Array.from(document.querySelectorAll('article table td:first-child'))
*     .map((td) => {
*       const body = document.createElement('body');
*       body.innerHTML = td.textContent;
*       return body.firstChild?.tagName;
*     })
*     .filter((tagName) => tagName)
* );
* ```
*
* Output (as of 2023-11-06):
*
* ```json
* '["BASE","LINK","META","STYLE","TITLE","ADDRESS","ARTICLE","ASIDE","FOOTER","HEADER","H1","HGROUP","MAIN","NAV","SECTION","SEARCH","BLOCKQUOTE","DD","DIV","DL","DT","FIGCAPTION","FIGURE","HR","LI","MENU","OL","P","PRE","UL","A","ABBR","B","BDI","BDO","BR","CITE","CODE","DATA","DFN","EM","I","KBD","MARK","Q","RP","RT","RUBY","S","SAMP","SMALL","SPAN","STRONG","SUB","SUP","TIME","U","VAR","WBR","AREA","AUDIO","IMG","MAP","TRACK","VIDEO","EMBED","IFRAME","OBJECT","PICTURE","PORTAL","SOURCE","svg","math","CANVAS","NOSCRIPT","SCRIPT","DEL","INS","TABLE","BUTTON","DATALIST","FIELDSET","FORM","INPUT","LABEL","LEGEND","METER","OPTGROUP","OPTION","OUTPUT","PROGRESS","SELECT","TEXTAREA","DETAILS","DIALOG","SUMMARY","SLOT","TEMPLATE","ACRONYM","BIG","CENTER","CONTENT","DIR","FONT","IMG","MARQUEE","MENUITEM","NOBR","NOEMBED","NOFRAMES","PARAM","PLAINTEXT","RB","RTC","SHADOW","STRIKE","TT","XMP"]'
* ```
*
* ## Step 2. For each tag name, determine the default browser style
*
* Open an empty HTML file in the browser and run the following in the console:
*
* ```js
* const tagNames = JSON.parse(<JSON string from step 1>);
*
* JSON.stringify(
*   tagNames.filter((tagName) => {
*     const element = document.createElement(tagName);
*     document.body.appendChild(element);
*     const display = window.getComputedStyle(element).display;
*     element.remove();
*     return display.startsWith('inline');
*   })
* );
* ```
*
* Place the result in the array below (accurate as of 2023-11-06).
*/
const inlineTagNames = new Set([
	"A",
	"ABBR",
	"ACRONYM",
	"B",
	"BDI",
	"BDO",
	"BIG",
	"BR",
	"BUTTON",
	"CANVAS",
	"CITE",
	"CODE",
	"CONTENT",
	"DATA",
	"DEL",
	"DFN",
	"EM",
	"EMBED",
	"FONT",
	"I",
	"IFRAME",
	"IMG",
	"IMG",
	"INPUT",
	"INS",
	"KBD",
	"LABEL",
	"MAP",
	"MARK",
	"MARQUEE",
	"math",
	"MENUITEM",
	"METER",
	"NOBR",
	"OBJECT",
	"OUTPUT",
	"PICTURE",
	"PORTAL",
	"PROGRESS",
	"Q",
	"S",
	"SAMP",
	"SELECT",
	"SHADOW",
	"SMALL",
	"SOURCE",
	"SPAN",
	"STRIKE",
	"STRONG",
	"SUB",
	"SUP",
	"svg",
	"TEXTAREA",
	"TIME",
	"TRACK",
	"TT",
	"U",
	"VAR",
	"VIDEO",
	"WBR"
]);

//#endregion
//#region src/lib/plugins/html/utils/isHtmlInlineElement.ts
const isHtmlInlineElement = (node) => {
	if (!isHtmlElement(node)) return false;
	const element = node;
	const tagNameIsInline = inlineTagNames.has(element.tagName);
	/**
	* Valid display values include 'inline flow'. We only care about the first
	* part.
	*/
	const displayProperty = element.style.display.split(" ")[0];
	if (displayProperty === "") return tagNameIsInline;
	if (displayProperty.startsWith("inline")) return true;
	if (displayProperty === "inherit" && element.parentElement) return isHtmlInlineElement(element.parentElement);
	/**
	* Handle all special values manually, so that any unhandled values can be
	* assumed to be block.
	*
	* Note: Ideally, content inside `display: none` elements should not be
	* parsed. However, if such elements are parsed, it's best for their inline or
	* block status to be left unchanged.
	*/
	if ([
		"contents",
		"initial",
		"none",
		"revert",
		"revert-layer",
		"unset"
	].includes(displayProperty)) return tagNameIsInline;
	return false;
};

//#endregion
//#region src/lib/plugins/html/utils/isHtmlBlockElement.ts
const isHtmlBlockElement = (node) => {
	if (!isHtmlElement(node)) return false;
	return !isHtmlInlineElement(node);
};

//#endregion
//#region src/lib/plugins/html/utils/collapse-white-space/collapseString.ts
const LEADING_WHITESPACE_REGEX = /^\s+/;
const TRAILING_NEWLINE_REGEX = /\n$/;
const collapseString = (text, { shouldCollapseWhiteSpace = true, trimEnd = "collapse", trimStart = "collapse", whiteSpaceIncludesNewlines = true } = {}) => {
	let result = text;
	if (trimStart === "all") result = result.replace(LEADING_WHITESPACE_REGEX, "");
	if (trimEnd === "single-newline") result = result.replace(TRAILING_NEWLINE_REGEX, "");
	if (shouldCollapseWhiteSpace) if (whiteSpaceIncludesNewlines) result = result.replaceAll(/\s+/g, " ");
	else {
		result = result.replaceAll(/[^\S\n\r]+/g, " ");
		/**
		* Trim horizontal whitespace from the start and end of lines (behavior of
		* pre-line).
		*/
		result = result.replaceAll(/^[^\S\n\r]+/gm, "");
		result = result.replaceAll(/[^\S\n\r]+$/gm, "");
	}
	return result;
};

//#endregion
//#region src/lib/plugins/html/utils/collapse-white-space/isLastNonEmptyTextOfInlineFormattingContext.ts
const isLastNonEmptyTextOfInlineFormattingContext = (initialText) => {
	let currentNode = initialText;
	while (true) {
		if (currentNode.nextSibling) currentNode = currentNode.nextSibling;
		else {
			currentNode = currentNode.parentElement;
			if (currentNode && isHtmlBlockElement(currentNode)) return true;
			currentNode = currentNode?.nextSibling || null;
		}
		if (!currentNode) return true;
		if (isHtmlBlockElement(currentNode)) return true;
		if ((currentNode.textContent || "").length > 0) return false;
	}
};

//#endregion
//#region src/lib/plugins/html/utils/collapse-white-space/stateTransforms.ts
const upsertInlineFormattingContext = (state) => {
	if (state.inlineFormattingContext) state.inlineFormattingContext.atStart = false;
	else state.inlineFormattingContext = {
		atStart: true,
		lastHasTrailingWhiteSpace: false
	};
};
const endInlineFormattingContext = (state) => {
	state.inlineFormattingContext = null;
};

//#endregion
//#region src/lib/plugins/html/utils/collapse-white-space/collapseWhiteSpaceText.ts
const collapseWhiteSpaceText = (text, state) => {
	const textContent = text.textContent || "";
	const isWhiteSpaceOnly = textContent.trim() === "";
	/**
	* Do not start an inline formatting context with a text node containing only
	* white space.
	*/
	if (state.inlineFormattingContext || !isWhiteSpaceOnly) upsertInlineFormattingContext(state);
	const { whiteSpaceRule } = state;
	/**
	* Note: Due to the way HTML strings are parsed in htmlStringToDOMNode, up to
	* one newline is already trimmed from the start of text nodes inside <pre>
	* elements. If we do so again here, we may remove too many newlines. This
	* only applies to actual <pre> elements, not elements with the white-space
	* CSS property.
	*/
	const trimStart = (() => {
		if (whiteSpaceRule !== "normal") return "collapse";
		if (!state.inlineFormattingContext || state.inlineFormattingContext.atStart || state.inlineFormattingContext.lastHasTrailingWhiteSpace) return "all";
		return "collapse";
	})();
	const trimEnd = (() => {
		if (whiteSpaceRule === "normal") return "collapse";
		if (isLastNonEmptyTextOfInlineFormattingContext(text)) return "single-newline";
		return "collapse";
	})();
	const shouldCollapseWhiteSpace = {
		normal: true,
		pre: false,
		"pre-line": true
	}[whiteSpaceRule];
	const collapsedTextContent = collapseString(textContent || "", {
		shouldCollapseWhiteSpace,
		trimEnd,
		trimStart,
		whiteSpaceIncludesNewlines: whiteSpaceRule !== "pre-line"
	});
	if (state.inlineFormattingContext && shouldCollapseWhiteSpace) state.inlineFormattingContext.lastHasTrailingWhiteSpace = collapsedTextContent.endsWith(" ");
	text.textContent = collapsedTextContent;
};

//#endregion
//#region src/lib/plugins/html/utils/collapse-white-space/collapseWhiteSpaceNode.ts
const collapseWhiteSpaceNode = (node, state) => {
	if (isHtmlElement(node)) {
		collapseWhiteSpaceElement(node, state);
		return;
	}
	if (isHtmlText(node)) {
		collapseWhiteSpaceText(node, state);
		return;
	}
	collapseWhiteSpaceChildren(node, state);
};

//#endregion
//#region src/lib/plugins/html/utils/collapse-white-space/collapseWhiteSpaceChildren.ts
const collapseWhiteSpaceChildren = (node, state) => {
	const childNodes = Array.from(node.childNodes);
	for (const childNode of childNodes) collapseWhiteSpaceNode(childNode, state);
};

//#endregion
//#region src/lib/plugins/html/utils/collapse-white-space/inferWhiteSpaceRule.ts
const inferWhiteSpaceRule = (element) => {
	const whiteSpaceProperty = element.style.whiteSpace;
	switch (whiteSpaceProperty) {
		case "break-spaces":
		case "pre":
		case "pre-wrap": return "pre";
		case "normal":
		case "nowrap": return "normal";
		case "pre-line": return "pre-line";
	}
	if (element.tagName === "PRE") return "pre";
	if (whiteSpaceProperty === "initial") return "normal";
	return null;
};

//#endregion
//#region src/lib/plugins/html/utils/collapse-white-space/collapseWhiteSpaceElement.ts
/**
* Note: We do not want to start an inline formatting context until we encounter
* a text node.
*/
const collapseWhiteSpaceElement = (element, state) => {
	const isInlineElement = isHtmlInlineElement(element);
	const previousWhiteSpaceRule = state.whiteSpaceRule;
	const inferredWhiteSpaceRule = inferWhiteSpaceRule(element);
	if (inferredWhiteSpaceRule) state.whiteSpaceRule = inferredWhiteSpaceRule;
	if (!isInlineElement) endInlineFormattingContext(state);
	collapseWhiteSpaceChildren(element, state);
	if (!isInlineElement) endInlineFormattingContext(state);
	state.whiteSpaceRule = previousWhiteSpaceRule;
};

//#endregion
//#region src/lib/plugins/html/utils/collapse-white-space/collapseWhiteSpace.ts
const collapseWhiteSpace = (element) => {
	const clonedElement = element.cloneNode(true);
	collapseWhiteSpaceElement(clonedElement, {
		inlineFormattingContext: null,
		whiteSpaceRule: "normal"
	});
	return clonedElement;
};

//#endregion
//#region src/lib/plugins/html/utils/deserializeHtmlNodeChildren.ts
const deserializeHtmlNodeChildren = (editor, node, isSlateParent = false) => Array.from(node.childNodes).flatMap((child) => {
	if (child.nodeType === 1 && !isSlateNode(child) && isSlateParent) return deserializeHtmlNodeChildren(editor, child, isSlateParent);
	return deserializeHtmlNode(editor)(child);
});

//#endregion
//#region src/lib/plugins/html/utils/htmlBodyToFragment.ts
/** Deserialize HTML body element to Fragment. */
const htmlBodyToFragment = (editor, element) => {
	if (element.nodeName === "BODY") return jsx("fragment", {}, deserializeHtmlNodeChildren(editor, element));
};

//#endregion
//#region src/lib/plugins/html/utils/htmlBrToNewLine.ts
/** Deserialize HTML to break line. */
const htmlBrToNewLine = (node) => {
	if (node.nodeName === "BR") return "\n";
};

//#endregion
//#region src/lib/plugins/html/utils/getDataNodeProps.ts
const getDefaultNodeProps = ({ element, type }) => {
	if (!isSlatePluginNode(element, type) && !isSlateLeaf(element)) return;
	const dataAttributes = {};
	Object.entries(element.dataset).forEach(([key, value]) => {
		if (key.startsWith("slate") && value && ![
			"slateInline",
			"slateLeaf",
			"slateNode",
			"slateVoid"
		].includes(key)) {
			const attributeKey = key.slice(5).charAt(0).toLowerCase() + key.slice(6);
			if (value === void 0) return;
			let parsedValue = value;
			if (value === "true") parsedValue = true;
			else if (value === "false") parsedValue = false;
			else if (!Number.isNaN(Number(value))) parsedValue = Number(value);
			dataAttributes[attributeKey] = parsedValue;
		}
	});
	if (Object.keys(dataAttributes).length > 0) return dataAttributes;
};
const getDataNodeProps = ({ editor, element, plugin }) => {
	const toNodeProps = plugin.parsers.html?.deserializer?.toNodeProps;
	const defaultNodeProps = plugin.parsers.html?.deserializer?.disableDefaultNodeProps ?? false ? {} : getDefaultNodeProps({
		...getEditorPlugin(editor, plugin),
		element
	});
	if (!toNodeProps) return defaultNodeProps;
	const customNodeProps = toNodeProps({
		...getEditorPlugin(editor, plugin),
		element
	}) ?? {};
	return {
		...defaultNodeProps,
		...customNodeProps
	};
};

//#endregion
//#region src/lib/plugins/html/utils/pluginDeserializeHtml.ts
/**
* Get a deserializer and add default rules for deserializing plate static
* elements
*/
const getDeserializedWithStaticRules = (plugin) => {
	let deserializer = plugin.parsers?.html?.deserializer;
	const rules = deserializer?.rules ?? [];
	const staticRules = rules.some((rule) => rule.validClassName?.includes(`slate-${plugin.key}`)) ? rules : [{
		validClassName: `slate-${plugin.key}`,
		validNodeName: "*"
	}, ...rules];
	if (!deserializer) deserializer = { rules: staticRules };
	deserializer.rules = staticRules;
	return deserializer;
};
/** Get a deserializer by type, node names, class names and styles. */
const pluginDeserializeHtml = (editor, plugin, { deserializeLeaf, element: el }) => {
	const { node: { isElement: isElementRoot, isLeaf: isLeafRoot } } = plugin;
	const deserializer = getDeserializedWithStaticRules(plugin);
	if (!deserializer) return;
	const { attributeNames, isElement: isElementRule, isLeaf: isLeafRule, query, rules } = deserializer;
	let { parse } = deserializer;
	const isElement = isElementRule || isElementRoot;
	const isLeaf = isLeafRule || isLeafRoot;
	if (!deserializeLeaf && !isElement) return;
	if (deserializeLeaf && !isLeaf) return;
	if (rules) {
		if (!rules.some(({ validAttribute, validClassName, validNodeName = "*", validStyle }) => {
			if (validNodeName) {
				const validNodeNames = castArray(validNodeName);
				if (validNodeNames.length > 0 && !validNodeNames.includes(el.nodeName) && validNodeName !== "*") return false;
			}
			if (validClassName && !el.classList.contains(validClassName)) return false;
			if (validStyle) for (const [key, value] of Object.entries(validStyle)) {
				if (!castArray(value).includes(el.style[key]) && value !== "*") return false;
				if (value === "*" && !el.style[key]) return false;
				const defaultNodeValue = plugin.inject.nodeProps?.defaultNodeValue;
				if (defaultNodeValue && defaultNodeValue === el.style[key]) return false;
			}
			if (validAttribute) if (typeof validAttribute === "string") {
				if (!el.getAttributeNames().includes(validAttribute)) return false;
			} else for (const [attributeName, attributeValue] of Object.entries(validAttribute)) {
				const attributeValues = castArray(attributeValue);
				const elAttribute = el.getAttribute(attributeName);
				if (!isDefined(elAttribute) || !attributeValues.includes(elAttribute)) return false;
			}
			return true;
		})) return;
	}
	if (query && !query({
		...getEditorPlugin(editor, plugin),
		element: el
	})) return;
	if (!parse) if (isElement) parse = ({ type }) => ({ type });
	else if (isLeaf) parse = ({ type }) => ({ [type]: true });
	else return;
	const parsedNode = (() => {
		if (isSlateNode(el)) return {};
		return parse({
			...getEditorPlugin(editor, plugin),
			element: el,
			node: {}
		}) ?? {};
	})();
	const dataNodeProps = getDataNodeProps({
		editor,
		element: el,
		plugin
	});
	let node = {
		...parsedNode,
		...dataNodeProps
	};
	if (Object.keys(node).length === 0) return;
	getInjectedPlugins(editor, plugin).forEach((injectedPlugin) => {
		const res = injectedPlugin.parsers?.html?.deserializer?.parse?.({
			...getEditorPlugin(editor, plugin),
			element: el,
			node
		});
		if (res && !isSlateNode(el)) node = {
			...node,
			...res
		};
	});
	if (attributeNames) {
		const elementAttributes = {};
		const elementAttributeNames = el.getAttributeNames();
		for (const elementAttributeName of elementAttributeNames) if (attributeNames.includes(elementAttributeName)) elementAttributes[elementAttributeName] = el.getAttribute(elementAttributeName);
		if (Object.keys(elementAttributes).length > 0) node.attributes = elementAttributes;
	}
	return {
		...deserializer,
		node
	};
};

//#endregion
//#region src/lib/plugins/html/utils/pipeDeserializeHtmlElement.ts
const pipeDeserializeHtmlElement = (editor, element) => {
	let result;
	[...editor.meta.pluginList].reverse().some((plugin) => {
		result = pluginDeserializeHtml(editor, plugin, { element });
		return !!result;
	});
	return result;
};

//#endregion
//#region src/lib/plugins/html/utils/htmlElementToElement.ts
/** Deserialize HTML to Element. */
const htmlElementToElement = (editor, element, isSlate = false) => {
	const deserialized = pipeDeserializeHtmlElement(editor, element);
	if (deserialized) {
		const { node, withoutChildren } = deserialized;
		let descendants = node.children ?? deserializeHtmlNodeChildren(editor, element, isSlate);
		if (descendants.length === 0 || withoutChildren || isSlateVoid(element)) descendants = [{ text: "" }];
		return jsx("element", node, descendants);
	}
};

//#endregion
//#region src/lib/plugins/html/utils/pipeDeserializeHtmlLeaf.ts
const pipeDeserializeHtmlLeaf = (editor, element) => {
	let node = {};
	[...editor.meta.pluginList].reverse().forEach((plugin) => {
		const deserialized = pluginDeserializeHtml(editor, plugin, {
			deserializeLeaf: true,
			element
		});
		if (!deserialized) return;
		node = {
			...node,
			...deserialized.node
		};
	});
	return node;
};

//#endregion
//#region src/lib/plugins/html/utils/htmlElementToLeaf.ts
/**
* Deserialize HTML to Descendant[] with marks on Text. Build the leaf from the
* leaf deserializers of each plugin.
*/
const htmlElementToLeaf = (editor, element) => {
	const node = pipeDeserializeHtmlLeaf(editor, element);
	return deserializeHtmlNodeChildren(editor, element).reduce((arr, child) => {
		if (!child) return arr;
		if (ElementApi.isElement(child)) {
			if (Object.keys(node).length > 0) mergeDeepToNodes({
				node: child,
				query: { filter: ([n]) => TextApi.isText(n) },
				source: node
			});
			arr.push(child);
		} else {
			const attributes = { ...node };
			if (TextApi.isText(child) && child.text) Object.keys(attributes).forEach((key) => {
				if (attributes[key] && child[key]) attributes[key] = child[key];
			});
			arr.push(jsx("text", attributes, child));
		}
		return arr;
	}, []);
};

//#endregion
//#region src/lib/plugins/html/utils/htmlTextNodeToString.ts
/** Deserialize HTML text node to text. */
const htmlTextNodeToString = (node) => {
	if (isHtmlText(node)) {
		if (node.parentElement?.dataset.platePreventDeserialization) return "";
		return node.textContent || "";
	}
};

//#endregion
//#region src/lib/plugins/html/utils/deserializeHtmlNode.ts
/** Check if a BR tag should be converted to an empty paragraph. */
const shouldBrBecomeEmptyParagraph = (node) => {
	if (node.nodeName !== "BR") return false;
	if (node.className === "Apple-interchange-newline") return false;
	const parent = node.parentElement;
	if (!parent) return false;
	if (parent.tagName === "P" || parent.tagName === "SPAN") return false;
	const hasAdjacentText = () => {
		let sibling = node.previousSibling;
		while (sibling) {
			if (sibling.nodeType === Node.TEXT_NODE && sibling.textContent?.trim()) return true;
			sibling = sibling.previousSibling;
		}
		sibling = node.nextSibling;
		while (sibling) {
			if (sibling.nodeType === Node.TEXT_NODE && sibling.textContent?.trim()) return true;
			sibling = sibling.nextSibling;
		}
		return false;
	};
	if (hasAdjacentText()) return false;
	return true;
};
/** Deserialize HTML element or child node. */
const deserializeHtmlNode = (editor) => (node) => {
	const textNode = htmlTextNodeToString(node);
	if (textNode) return textNode;
	if (!isHtmlElement(node)) return null;
	if (shouldBrBecomeEmptyParagraph(node)) return {
		children: [{ text: "" }],
		type: editor.getType("p")
	};
	if (node.nodeName === "BR" && node.className === "Apple-interchange-newline") return null;
	const breakLine = htmlBrToNewLine(node);
	if (breakLine) return breakLine;
	const fragment = htmlBodyToFragment(editor, node);
	if (fragment) return fragment;
	const element = htmlElementToElement(editor, node, isSlateNode(node));
	if (element) return element;
	return htmlElementToLeaf(editor, node);
};

//#endregion
//#region src/lib/plugins/html/utils/deserializeHtmlElement.ts
/** Deserialize HTML element to fragment. */
const deserializeHtmlElement = (editor, element) => deserializeHtmlNode(editor)(element);

//#endregion
//#region src/lib/plugins/html/utils/htmlStringToDOMNode.ts
/** Convert HTML string into HTML element. */
const htmlStringToDOMNode = (rawHtml) => {
	const node = document.createElement("body");
	node.innerHTML = rawHtml;
	return node;
};

//#endregion
//#region src/lib/plugins/html/utils/deserializeHtml.ts
/** Deserialize HTML element to a valid document fragment. */
const deserializeHtml = (editor, { collapseWhiteSpace: shouldCollapseWhiteSpace = true, defaultElementPlugin, element }) => {
	if (typeof element === "string") element = htmlStringToDOMNode(element);
	if (shouldCollapseWhiteSpace) element = collapseWhiteSpace(element);
	return normalizeDescendantsToDocumentFragment(editor, {
		defaultElementPlugin,
		descendants: deserializeHtmlElement(editor, element)
	});
};

//#endregion
//#region src/lib/plugins/html/utils/parseHtmlDocument.ts
const parseHtmlDocument = (html) => new DOMParser().parseFromString(html, "text/html");

//#endregion
//#region src/lib/plugins/html/HtmlPlugin.ts
/**
* Enables support for deserializing inserted content from HTML format to Slate
* format and serializing Slate content to HTML format.
*/
const HtmlPlugin = createSlatePlugin({ key: "html" }).extendApi(({ editor }) => ({ deserialize: bindFirst(deserializeHtml, editor) })).extend({ parser: {
	format: "text/html",
	deserialize: ({ api, data }) => {
		const document$1 = parseHtmlDocument(data);
		return api.html.deserialize({ element: document$1.body });
	}
} });

//#endregion
//#region src/lib/plugins/length/LengthPlugin.ts
const LengthPlugin = createTSlatePlugin({ key: "length" }).overrideEditor(({ editor, getOptions, tf: { apply } }) => ({ transforms: { apply(operation) {
	editor.tf.withoutNormalizing(() => {
		apply(operation);
		const options = getOptions();
		if (options.maxLength) {
			const length = editor.api.string([]).length;
			if (length > options.maxLength) {
				const overflowLength = length - options.maxLength;
				editor.tf.delete({
					distance: overflowLength,
					reverse: true,
					unit: "character"
				});
			}
		}
	});
} } }));

//#endregion
//#region src/lib/plugins/node-id/withNodeId.ts
/** Enables support for inserting nodes with an id key. */
const withNodeId = ({ editor, getOptions, tf: { apply, insertNode, insertNodes } }) => {
	const idPropsCreator = () => ({ [getOptions().idKey ?? ""]: getOptions().idCreator() });
	const filterNode = (nodeEntry) => {
		const { filter, filterText } = getOptions();
		return filter(nodeEntry) && (!filterText || nodeEntry[0]?.type !== void 0);
	};
	const removeIdFromNodeIfDuplicate = (node) => {
		const { idKey = "", reuseId } = getOptions();
		if (!reuseId && editor.api.some({
			at: [],
			match: { [idKey]: node[idKey] }
		})) delete node[idKey];
	};
	const overrideIdIfSet = (node) => {
		const { idKey = "" } = getOptions();
		if (isDefined(node._id)) {
			const id = node._id;
			node._id = void 0;
			if (!editor.api.some({
				at: [],
				match: { [idKey]: id }
			})) node[idKey] = id;
		}
	};
	return { transforms: {
		apply(operation) {
			const { allow, disableInsertOverrides, exclude, idCreator, idKey = "", reuseId } = getOptions();
			const query = {
				allow,
				exclude,
				filter: filterNode
			};
			if (operation.type === "insert_node") {
				const node = cloneDeep(operation.node);
				applyDeepToNodes({
					apply: removeIdFromNodeIfDuplicate,
					node,
					query,
					source: {}
				});
				defaultsDeepToNodes({
					node,
					path: operation.path,
					query,
					source: idPropsCreator
				});
				if (!disableInsertOverrides) applyDeepToNodes({
					apply: overrideIdIfSet,
					node,
					query,
					source: {}
				});
				return apply({
					...operation,
					node
				});
			}
			if (operation.type === "split_node") {
				const node = operation.properties;
				let id = operation.properties[idKey];
				if (queryNode([node, operation.path], query)) {
					/**
					* Create a new id if:
					*
					* - The id in the new node is already being used in the editor or,
					* - The node has no id
					*/
					if (!reuseId || id === void 0 || editor.api.some({
						at: [],
						match: { [idKey]: id }
					})) id = idCreator();
					return apply({
						...operation,
						properties: {
							...operation.properties,
							[idKey]: id
						}
					});
				}
				if (id) delete operation.properties[idKey];
			}
			return apply(operation);
		},
		insertNode(node) {
			const { disableInsertOverrides, idKey = "" } = getOptions();
			if (!disableInsertOverrides && node[idKey]) {
				if (!Object.isExtensible(node)) node = cloneDeep(node);
				node._id = node[idKey];
			}
			insertNode(node);
		},
		insertNodes(_nodes, options) {
			const nodes = castArray(_nodes).filter((node) => !!node);
			if (nodes.length === 0) return;
			const { disableInsertOverrides, idKey = "" } = getOptions();
			insertNodes(nodes.map((node) => {
				if (!disableInsertOverrides && node[idKey]) {
					if (!Object.isExtensible(node)) node = cloneDeep(node);
					node._id = node[idKey];
				}
				return node;
			}), options);
		}
	} };
};

//#endregion
//#region src/lib/plugins/node-id/NodeIdPlugin.ts
/**
* Normalize node IDs in a value without using editor operations. This is a pure
* function that returns a new normalized value.
*/
const normalizeNodeId = (value, options = {}) => {
	const { allow, exclude, filter = () => true, filterInline = true, filterText = true, idCreator = () => nanoid(10), idKey = "id" } = options;
	const normalizeNode = (node, path) => {
		const clonedNode = { ...node };
		if (!clonedNode[idKey] && queryNode([clonedNode, path], {
			allow,
			exclude,
			filter: (entry) => {
				const [node$1] = entry;
				if (filterText && !ElementApi.isElement(node$1)) return false;
				if (filterInline && ElementApi.isElement(node$1) && node$1.inline === true) return false;
				return filter(entry);
			}
		})) clonedNode[idKey] = idCreator();
		if (ElementApi.isElement(clonedNode)) clonedNode.children = clonedNode.children.map((child, index) => normalizeNode(child, [...path, index]));
		return clonedNode;
	};
	return value.map((node, index) => normalizeNode(node, [index]));
};
/** @see {@link withNodeId} */
const NodeIdPlugin = createTSlatePlugin({
	key: "nodeId",
	options: {
		filterInline: true,
		filterText: true,
		idKey: "id",
		normalizeInitialValue: false,
		filter: () => true,
		idCreator: () => nanoid(10)
	}
}).extendTransforms(({ editor, getOptions }) => ({ normalize() {
	const { allow, exclude, filter, filterInline, filterText, idKey } = getOptions();
	const addNodeId = (entry) => {
		const [node, path] = entry;
		if (!node[idKey] && queryNode([node, path], {
			allow,
			exclude,
			filter: (entry$1) => {
				const [node$1] = entry$1;
				if (filterText && !ElementApi.isElement(node$1)) return false;
				if (filterInline && ElementApi.isElement(node$1) && !editor.api.isBlock(node$1)) return false;
				return filter(entry$1);
			}
		})) {
			if (!editor.api.node(path)) return;
			editor.tf.withoutSaving(() => {
				editor.tf.setNodes({ [idKey]: getOptions().idCreator() }, { at: path });
			});
		}
		if (ElementApi.isElement(node)) node.children.forEach((child, index) => {
			addNodeId([child, [...path, index]]);
		});
	};
	editor.children.forEach((node, index) => {
		addNodeId([node, [index]]);
	});
} })).extend({ normalizeInitialValue: ({ editor, getOptions, tf }) => {
	const { normalizeInitialValue } = getOptions();
	if (!normalizeInitialValue) {
		const firstNode = editor.children[0];
		const lastNode = editor.children.at(-1);
		if (firstNode?.id && lastNode?.id) return;
	}
	tf.nodeId.normalize();
} }).overrideEditor(withNodeId);

//#endregion
//#region src/lib/utils/pipeOnNodeChange.ts
const pipeOnNodeChange = (editor, node, prevNode, operation) => {
	return editor.meta.pluginCache.handlers.onNodeChange.some((key) => {
		const plugin = editor.getPlugin({ key });
		if (!plugin || editor.dom?.readOnly) return false;
		const handler = plugin.handlers?.onNodeChange;
		if (!handler) return false;
		const shouldTreatEventAsHandled = handler({
			editor,
			node,
			operation,
			plugin,
			prevNode
		});
		if (shouldTreatEventAsHandled != null) return shouldTreatEventAsHandled;
		return false;
	});
};

//#endregion
//#region src/lib/utils/pipeOnTextChange.ts
const pipeOnTextChange = (editor, node, text, prevText, operation) => {
	return editor.meta.pluginCache.handlers.onTextChange.some((key) => {
		const plugin = editor.getPlugin({ key });
		if (!plugin || editor.dom?.readOnly) return false;
		const handler = plugin.handlers?.onTextChange;
		if (!handler) return false;
		const shouldTreatEventAsHandled = handler({
			editor,
			node,
			operation,
			plugin,
			prevText,
			text
		});
		if (shouldTreatEventAsHandled != null) return shouldTreatEventAsHandled;
		return false;
	});
};

//#endregion
//#region src/internal/plugin/isEditOnlyDisabled.ts
const DEFAULT = {
	handlers: true,
	inject: true,
	normalizeInitialValue: false,
	render: true
};
/**
* Check if a plugin feature is disabled in read-only mode based on editOnly
* configuration.
*
* @param plugin The plugin to check
* @param isReadOnly Whether the editor is in read-only mode
* @param feature The feature to check ('render' | 'handlers' | 'inject' |
*   'normalizeInitialValue')
* @returns True if the feature should be disabled
*/
const isEditOnly = (readOnly, plugin, feature) => {
	if (!readOnly) return false;
	if (plugin.editOnly === true) return DEFAULT[feature];
	if (typeof plugin.editOnly === "object") return plugin.editOnly[feature] ?? DEFAULT[feature];
	return false;
};

//#endregion
//#region src/internal/plugin/pipeNormalizeInitialValue.ts
/** Normalize initial value from editor plugins. Set into plate store if diff. */
const pipeNormalizeInitialValue = (editor) => {
	const value = editor.meta.isNormalizing;
	editor.meta.isNormalizing = true;
	editor.meta.pluginCache.normalizeInitialValue.forEach((key) => {
		const p = editor.getPlugin({ key });
		if (isEditOnly(editor.dom.readOnly, p, "normalizeInitialValue")) return;
		p.normalizeInitialValue?.({
			...getEditorPlugin(editor, p),
			value: editor.children
		});
	});
	editor.meta.isNormalizing = value;
};

//#endregion
//#region src/lib/plugins/slate-extension/transforms/init.ts
const init = (editor, { autoSelect, selection, shouldNormalizeEditor, value, onReady }) => {
	const onValueLoaded = (isAsync = false) => {
		if (!editor.children || editor.children?.length === 0) editor.children = editor.api.create.value();
		if (selection) editor.selection = selection;
		else if (autoSelect) {
			const target = (autoSelect === "start" ? "start" : "end") === "start" ? editor.api.start([]) : editor.api.end([]);
			editor.tf.select(target);
		}
		if (editor.children.length > 0) pipeNormalizeInitialValue(editor);
		if (shouldNormalizeEditor) editor.tf.normalize({ force: true });
		if (onReady) onReady({
			editor,
			isAsync,
			value: editor.children
		});
	};
	if (value === null) onValueLoaded();
	else if (typeof value === "string") {
		editor.children = editor.api.html.deserialize({ element: value });
		onValueLoaded();
	} else if (typeof value === "function") {
		const result = value(editor);
		if (result && typeof result.then === "function") result.then((resolvedValue) => {
			editor.children = resolvedValue;
			onValueLoaded(true);
		});
		else {
			editor.children = result;
			onValueLoaded();
		}
	} else if (value) {
		editor.children = value;
		onValueLoaded();
	} else onValueLoaded();
};

//#endregion
//#region src/lib/plugins/slate-extension/transforms/insertExitBreak.ts
/**
* Exits the current block structure by creating a new block next to the
* appropriate ancestor.
*
* This function automatically determines the exit point by finding the first
* ancestor that doesn't have strict sibling constraints (`isStrictSiblings:
* false`), allowing standard text blocks to be inserted as siblings.
*
* For example:
*
* - In `column_group > column > codeblock > codeline`, exits after `codeblock`,
*   then after `column_group`
* - In `table > tr > td > p`, exits after `table`
*/
const insertExitBreak = (editor, { match, reverse } = {}) => {
	if (!editor.selection || !editor.api.isCollapsed()) return;
	const block = editor.api.block();
	if (!block) return;
	const ancestorPath = editor.api.above({
		at: block[1],
		match: combineMatchOptions(editor, (n, p) => p.length === 1 || p.length > 1 && !!n.type && !getPluginByType(editor, n.type)?.node.isStrictSiblings, { match })
	})?.[1] ?? block[1];
	const targetPath = reverse ? ancestorPath : PathApi.next(ancestorPath);
	if (!targetPath) return;
	editor.tf.insertNodes(editor.api.create.block(), {
		at: targetPath,
		select: true
	});
	return true;
};

//#endregion
//#region src/lib/plugins/slate-extension/transforms/resetBlock.ts
/**
* Reset the current block to a paragraph, removing all properties except id and
* type.
*/
const resetBlock = (editor, { at } = {}) => {
	const entry = editor.api.block({ at });
	if (!entry?.[0]) return;
	const [block, path] = entry;
	editor.tf.withoutNormalizing(() => {
		const { id, type, ...otherProps } = NodeApi.extractProps(block);
		Object.keys(otherProps).forEach((key) => {
			editor.tf.unsetNodes(key, { at: path });
		});
		const paragraphType = editor.getType(BaseParagraphPlugin.key);
		if (block.type !== paragraphType) editor.tf.setNodes({ type: paragraphType }, { at: path });
	});
	return true;
};

//#endregion
//#region src/lib/plugins/slate-extension/transforms/setValue.ts
const setValue = (editor, value) => {
	let children = value;
	if (typeof value === "string") children = editor.api.html.deserialize({ element: value });
	else if (!value || value.length === 0) children = editor.api.create.value();
	editor.tf.replaceNodes(children, {
		at: [],
		children: true
	});
};

//#endregion
//#region src/lib/plugins/slate-extension/SlateExtensionPlugin.ts
/** Opinionated extension of slate default behavior. */
const SlateExtensionPlugin = createTSlatePlugin({
	key: "slateExtension",
	options: {
		onNodeChange: () => {},
		onTextChange: () => {}
	}
}).extendEditorTransforms(({ editor, getOption, tf: { apply } }) => ({
	init: bindFirst(init, editor),
	insertExitBreak: bindFirst(insertExitBreak, editor),
	resetBlock: bindFirst(resetBlock, editor),
	setValue: bindFirst(setValue, editor),
	apply(operation) {
		const noop = () => {};
		const hasNodeHandlers = editor.meta.pluginCache.handlers.onNodeChange.length > 0 || getOption("onNodeChange") !== noop;
		const hasTextHandlers = editor.meta.pluginCache.handlers.onTextChange.length > 0 || getOption("onTextChange") !== noop;
		if (!hasNodeHandlers && !hasTextHandlers) {
			apply(operation);
			return;
		}
		let prevNode;
		let node;
		let prevText;
		let text;
		let parentNode;
		if (OperationApi.isNodeOperation(operation) && hasNodeHandlers) switch (operation.type) {
			case "insert_node":
				prevNode = operation.node;
				node = operation.node;
				break;
			case "merge_node":
			case "move_node":
			case "set_node":
			case "split_node":
				prevNode = NodeApi.get(editor, operation.path);
				break;
			case "remove_node":
				prevNode = operation.node;
				node = operation.node;
				break;
		}
		else if (OperationApi.isTextOperation(operation) && hasTextHandlers) {
			const parentPath = PathApi.parent(operation.path);
			parentNode = NodeApi.get(editor, parentPath);
			prevText = NodeApi.get(editor, operation.path).text;
		}
		apply(operation);
		if (OperationApi.isNodeOperation(operation) && hasNodeHandlers) {
			switch (operation.type) {
				case "insert_node":
				case "remove_node": break;
				case "merge_node": {
					const prevPath = PathApi.previous(operation.path);
					if (prevPath) node = NodeApi.get(editor, prevPath);
					break;
				}
				case "move_node":
					node = NodeApi.get(editor, operation.newPath);
					break;
				case "set_node":
					node = NodeApi.get(editor, operation.path);
					break;
				case "split_node":
					node = NodeApi.get(editor, operation.path);
					break;
			}
			if (!node) node = prevNode;
			if (!pipeOnNodeChange(editor, node, prevNode, operation)) getOption("onNodeChange")({
				editor,
				node,
				operation,
				prevNode
			});
		}
		if (OperationApi.isTextOperation(operation) && hasTextHandlers) {
			const textNodeAfter = NodeApi.get(editor, operation.path);
			if (textNodeAfter) text = textNodeAfter.text;
			if (!pipeOnTextChange(editor, parentNode, text, prevText, operation)) getOption("onTextChange")({
				editor,
				node: parentNode,
				operation,
				prevText,
				text
			});
		}
	}
}));

//#endregion
//#region src/lib/utils/normalizeDescendantsToDocumentFragment.ts
const isInlineNode = (editor) => (node) => TextApi.isText(node) || ElementApi.isElement(node) && editor.api.isInline(node);
const makeBlockLazy = (type) => () => ({
	children: [],
	type
});
const hasDifferentChildNodes = (descendants, isInline) => descendants.some((descendant, index, arr) => {
	const prevDescendant = arr[index - 1];
	if (index !== 0) return isInline(descendant) !== isInline(prevDescendant);
	return false;
});
/**
* Handles 3rd constraint: "Block nodes can only contain other blocks, or inline
* and text nodes."
*/
const normalizeDifferentNodeTypes = (descendants, isInline, makeDefaultBlock) => {
	const hasDifferentNodes = hasDifferentChildNodes(descendants, isInline);
	const { fragment } = descendants.reduce((memo, node) => {
		if (hasDifferentNodes && isInline(node)) {
			let block = memo.precedingBlock;
			if (!block) {
				block = makeDefaultBlock();
				memo.precedingBlock = block;
				memo.fragment.push(block);
			}
			block.children.push(node);
		} else {
			memo.fragment.push(node);
			memo.precedingBlock = null;
		}
		return memo;
	}, {
		fragment: [],
		precedingBlock: null
	});
	return fragment;
};
/**
* Handles 1st constraint: "All Element nodes must contain at least one Text
* descendant."
*/
const normalizeEmptyChildren = (descendants) => {
	if (descendants.length === 0) return [{ text: "" }];
	return descendants;
};
const normalize = (descendants, isInline, makeDefaultBlock) => {
	descendants = normalizeEmptyChildren(descendants);
	descendants = normalizeDifferentNodeTypes(descendants, isInline, makeDefaultBlock);
	descendants = descendants.map((node) => {
		if (ElementApi.isElement(node)) return {
			...node,
			children: normalize(node.children, isInline, makeDefaultBlock)
		};
		return node;
	});
	return descendants;
};
/** Normalize the descendants to a valid document fragment. */
const normalizeDescendantsToDocumentFragment = (editor, { defaultElementPlugin = BaseParagraphPlugin, descendants }) => {
	return normalize(descendants, isInlineNode(editor), makeBlockLazy(editor.getType(defaultElementPlugin.key)));
};

//#endregion
//#region src/lib/utils/pipeInsertDataQuery.ts
/** Is the plugin disabled by another plugin. */
const pipeInsertDataQuery = (editor, plugins, options) => plugins.every((p) => {
	const query = p.parser?.query;
	return !query || query({
		...getEditorPlugin(editor, p),
		...options
	});
});

//#endregion
//#region src/lib/plugins/ParserPlugin.ts
const ParserPlugin = createSlatePlugin({ key: "parser" }).overrideEditor(({ editor, tf: { insertData } }) => ({ transforms: { insertData(dataTransfer) {
	if ([...editor.meta.pluginList].reverse().some((plugin) => {
		const parser = plugin.parser;
		if (!parser) return false;
		const injectedPlugins = getInjectedPlugins(editor, plugin);
		const { deserialize, format, mimeTypes } = parser;
		if (!format && !mimeTypes) return false;
		const mimeTypeList = mimeTypes || (Array.isArray(format) ? format : format ? [format] : []).map((fmt) => fmt.includes("/") ? fmt : `text/${fmt}`);
		for (const mimeType of mimeTypeList) {
			let data = dataTransfer.getData(mimeType);
			if (mimeType !== "Files" && !data || mimeType === "Files" && dataTransfer.files.length === 0) continue;
			if (!pipeInsertDataQuery(editor, injectedPlugins, {
				data,
				dataTransfer,
				mimeType
			})) continue;
			data = pipeTransformData(editor, injectedPlugins, {
				data,
				dataTransfer,
				mimeType
			});
			let fragment = deserialize?.({
				...getEditorPlugin(editor, plugin),
				data,
				dataTransfer,
				mimeType
			});
			if (!fragment?.length) continue;
			fragment = pipeTransformFragment(editor, injectedPlugins, {
				data,
				dataTransfer,
				fragment,
				mimeType
			});
			if (fragment.length === 0) continue;
			pipeInsertFragment(editor, injectedPlugins, {
				data,
				dataTransfer,
				fragment,
				mimeType
			});
			return true;
		}
		return false;
	})) return;
	insertData(dataTransfer);
} } }));

//#endregion
//#region src/lib/plugins/getCorePlugins.ts
const getCorePlugins = ({ affinity, chunking, maxLength, nodeId, plugins = [] }) => {
	let resolvedNodeId = nodeId;
	if (process.env.NODE_ENV === "test" && nodeId === void 0) resolvedNodeId = false;
	let corePlugins = [
		DebugPlugin,
		SlateExtensionPlugin,
		DOMPlugin,
		HistoryPlugin,
		OverridePlugin,
		ParserPlugin,
		maxLength ? LengthPlugin.configure({ options: { maxLength } }) : LengthPlugin,
		HtmlPlugin,
		AstPlugin,
		NodeIdPlugin.configure({
			enabled: resolvedNodeId !== false,
			options: resolvedNodeId === false ? void 0 : resolvedNodeId
		}),
		AffinityPlugin.configure({ enabled: affinity }),
		BaseParagraphPlugin,
		ChunkingPlugin.configure({
			enabled: chunking !== false,
			options: typeof chunking === "boolean" ? void 0 : chunking
		})
	];
	const customPluginsMap = new Map(plugins.map((plugin) => [plugin.key, plugin]));
	corePlugins = corePlugins.map((corePlugin) => {
		const customPlugin = customPluginsMap.get(corePlugin.key);
		if (customPlugin) {
			const index = plugins.findIndex((p) => p.key === corePlugin.key);
			if (index !== -1) plugins.splice(index, 1);
			return customPlugin;
		}
		return corePlugin;
	});
	return corePlugins;
};

//#endregion
//#region src/lib/editor/withSlate.ts
/**
* Applies Plate enhancements to an editor instance (non-React version).
*
* @remarks
*   This function supports server-side usage as it doesn't include React-specific
*   features like component rendering or hooks integration.
* @see {@link createSlateEditor} for a higher-level non-React editor creation function.
* @see {@link createPlateEditor} for a React-specific version of editor creation.
* @see {@link usePlateEditor} for a memoized React version.
* @see {@link withPlate} for the React-specific enhancement function.
*/
const withSlate = (e, { id, affinity = true, autoSelect, chunking = true, maxLength, nodeId, optionsStoreFactory, plugins = [], readOnly = false, rootPlugin, selection, shouldNormalizeEditor, skipInitialization, userId, value, onReady, ...pluginConfig } = {}) => {
	const editor = e;
	editor.id = id ?? editor.id ?? nanoid();
	editor.meta.key = editor.meta.key ?? nanoid();
	editor.meta.isFallback = false;
	editor.meta.userId = userId;
	editor.dom = {
		composing: false,
		currentKeyboardEvent: null,
		focused: false,
		prevSelection: null,
		readOnly
	};
	editor.getApi = () => editor.api;
	editor.getTransforms = () => editor.transforms;
	editor.getPlugin = (plugin) => getSlatePlugin(editor, plugin);
	editor.getType = (pluginKey) => getPluginType(editor, pluginKey);
	editor.getInjectProps = (plugin) => {
		const nodeProps = editor.getPlugin(plugin).inject?.nodeProps ?? {};
		nodeProps.nodeKey = nodeProps.nodeKey ?? editor.getType(plugin.key);
		nodeProps.styleKey = nodeProps.styleKey ?? nodeProps.nodeKey;
		return nodeProps;
	};
	editor.getOptionsStore = (plugin) => editor.getPlugin(plugin).optionsStore;
	editor.getOptions = (plugin) => {
		if (!editor.getOptionsStore(plugin)) return editor.getPlugin(plugin).options;
		return editor.getOptionsStore(plugin).get("state");
	};
	editor.getOption = (plugin, key, ...args) => {
		const store = editor.getOptionsStore(plugin);
		if (!store) return editor.getPlugin(plugin).options[key];
		if (!(key in store.get("state")) && !(key in store.selectors)) {
			editor.api.debug.error(`editor.getOption: ${key} option is not defined in plugin ${plugin.key}.`, "OPTION_UNDEFINED");
			return;
		}
		return store.get(key, ...args);
	};
	editor.setOption = (plugin, key, ...args) => {
		const store = editor.getOptionsStore(plugin);
		if (!store) return;
		if (!(key in store.get("state"))) {
			editor.api.debug.error(`editor.setOption: ${key} option is not defined in plugin ${plugin.key}.`, "OPTION_UNDEFINED");
			return;
		}
		store.set(key, ...args);
	};
	editor.setOptions = (plugin, options) => {
		const store = editor.getOptionsStore(plugin);
		if (!store) return;
		if (typeof options === "object") store.set("state", (draft) => {
			Object.assign(draft, options);
		});
		else if (typeof options === "function") store.set("state", options);
	};
	const corePlugins = getCorePlugins({
		affinity,
		chunking,
		maxLength,
		nodeId,
		plugins
	});
	let rootPluginInstance = createSlatePlugin({
		key: "root",
		priority: 1e4,
		...pluginConfig,
		override: {
			...pluginConfig.override,
			components: {
				...pluginConfig.components,
				...pluginConfig.override?.components
			}
		},
		plugins: [...corePlugins, ...plugins]
	});
	if (rootPlugin) rootPluginInstance = rootPlugin(rootPluginInstance);
	resolvePlugins(editor, [rootPluginInstance], optionsStoreFactory);
	/** Ignore normalizeNode overrides if shouldNormalizeNode returns false */
	const normalizeNode = editor.tf.normalizeNode;
	editor.tf.normalizeNode = (...args) => {
		if (!editor.api.shouldNormalizeNode(args[0])) return;
		return normalizeNode(...args);
	};
	editor.normalizeNode = editor.tf.normalizeNode;
	if (!skipInitialization) editor.tf.init({
		autoSelect,
		selection,
		shouldNormalizeEditor,
		value,
		onReady
	});
	return editor;
};
/**
* Creates a Slate editor (non-React version).
*
* This function creates a fully configured Plate editor instance that can be
* used in non-React environments or server-side contexts. It applies all the
* specified plugins and configurations to create a functional editor.
*
* Examples:
*
* ```ts
* const editor = createSlateEditor({
*   plugins: [ParagraphPlugin, HeadingPlugin],
*   value: [{ type: 'p', children: [{ text: 'Hello world!' }] }],
* });
*
* // Editor with custom configuration
* const editor = createSlateEditor({
*   plugins: [ParagraphPlugin],
*   maxLength: 1000,
*   nodeId: { idCreator: () => uuidv4() },
*   autoSelect: 'end',
* });
*
* // Server-side editor
* const editor = createSlateEditor({
*   plugins: [ParagraphPlugin],
*   value: '<p>HTML content</p>',
*   skipInitialization: true,
* });
* ```
*
* @see {@link createPlateEditor} for a React-specific version of editor creation.
* @see {@link usePlateEditor} for a memoized React version.
* @see {@link withSlate} for the underlying function that applies Slate enhancements to an editor.
*/
const createSlateEditor = ({ editor = createEditor(), ...options } = {}) => withSlate(editor, options);

//#endregion
export { DebugPlugin as $, pluginDeserializeHtml as A, withNormalizeRules as At, collapseWhiteSpaceText as B, getPluginKey as Bt, deserializeHtmlElement as C, isSlatePluginNode as Ct, pipeDeserializeHtmlLeaf as D, applyDeepToNodes as Dt, htmlElementToLeaf as E, isSlateVoid as Et, collapseWhiteSpace as F, HistoryPlugin as Ft, isHtmlBlockElement as G, getEditorPlugin as Gt, upsertInlineFormattingContext as H, getPluginType as Ht, collapseWhiteSpaceElement as I, withPlateHistory as It, isHtmlText as J, isHtmlInlineElement as K, createSlatePlugin as Kt, inferWhiteSpaceRule as L, AstPlugin as Lt, htmlBrToNewLine as M, withDeleteRules as Mt, htmlBodyToFragment as N, withBreakRules as Nt, htmlElementToElement as O, OverridePlugin as Ot, deserializeHtmlNodeChildren as P, BaseParagraphPlugin as Pt, withScrolling as Q, collapseWhiteSpaceChildren as R, getContainerTypes as Rt, htmlStringToDOMNode as S, isSlatePluginElement as St, htmlTextNodeToString as T, isSlateText as Tt, isLastNonEmptyTextOfInlineFormattingContext as U, getPluginTypes as Ut, endInlineFormattingContext as V, getPluginKeys as Vt, collapseString as W, getSlatePlugin as Wt, AUTO_SCROLL as X, isHtmlElement as Y, DOMPlugin as Z, withNodeId as _, getSlateElements as _t, pipeInsertDataQuery as a, isNodeAffinity as at, parseHtmlDocument as b, isSlateLeaf as bt, setValue as c, getEdgeNodes as ct, init as d, getPluginNodeProps as dt, PlateError as et, isEditOnly as f, getNodeDataAttributeKeys as ft, normalizeNodeId as g, defaultsDeepToNodes as gt, NodeIdPlugin as h, getInjectMatch as ht, ParserPlugin as i, setAffinitySelection as it, getDataNodeProps as j, withMergeRules as jt, pipeDeserializeHtmlElement as k, withOverrides as kt, resetBlock as l, mergeDeepToNodes as lt, pipeOnNodeChange as m, getInjectedPlugins as mt, withSlate as n, withChunking as nt, normalizeDescendantsToDocumentFragment as o, isNodesAffinity as ot, pipeOnTextChange as p, keyToDataAttribute as pt, inlineTagNames as q, createTSlatePlugin as qt, getCorePlugins as r, AffinityPlugin as rt, SlateExtensionPlugin as s, getMarkBoundaryAffinity as st, createSlateEditor as t, ChunkingPlugin as tt, insertExitBreak as u, getSlateClass as ut, LengthPlugin as v, isSlateEditor as vt, deserializeHtmlNode as w, isSlateString as wt, deserializeHtml as x, isSlateNode as xt, HtmlPlugin as y, isSlateElement as yt, collapseWhiteSpaceNode as z, getPluginByType as zt };