import { Gt as getEditorPlugin$1, Kt as createSlatePlugin, Pt as BaseParagraphPlugin, Z as DOMPlugin, dt as getPluginNodeProps, f as isEditOnly, n as withSlate, s as SlateExtensionPlugin, tt as ChunkingPlugin, ut as getSlateClass, zt as getPluginByType } from "../withSlate-1B0SfAWG.js";
import { t as Hotkeys } from "../hotkeys-DI1HPO2Q.js";
import { A as pipeInjectNodeProps, C as createStaticEditor, k as pipeDecorate, s as PlateStatic } from "../static-CVN6JhaR.js";
import { PathApi, createEditor } from "@platejs/slate";
import { isDefined } from "@udecode/utils";
import { DefaultPlaceholder, Editable, Slate, useComposing, useFocused, useReadOnly, useSelected, useSlateStatic, withReact } from "slate-react";
import { c } from "react-compiler-runtime";
import React, { useEffect, useId, useRef } from "react";
import { Key, useHotkeys } from "@udecode/react-hotkeys";
import { createAtomStore, useAtomStoreSet, useAtomStoreState, useAtomStoreValue, useStoreAtomState, useStoreAtomValue, useStoreAtomValue as useStoreAtomValue$1, useStoreSetAtom } from "jotai-x";
import { atom, atom as atom$1 } from "jotai";
import { createZustandStore, createZustandStore as createZustandStore$1, useStoreSelect, useStoreSelect as useStoreSelect$1, useStoreState, useStoreValue, useStoreValue as useStoreValue$1, useTracked, useTrackedStore } from "zustand-x";
import clsx$1, { clsx } from "clsx";
import omit from "lodash/omit.js";
import { useDeepCompareMemo } from "use-deep-compare";
import { useComposedRef, useMemoizedSelector, useStableFn } from "@udecode/react-utils";
import { selectAtom } from "jotai/utils";
import { focusAtom } from "jotai-optics";

//#region src/react/components/ContentVisibilityChunk.tsx
const ContentVisibilityChunk = (t0) => {
	const $ = c(4);
	const { attributes, children, lowest } = t0;
	if (!lowest) return children;
	let t1;
	if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
		t1 = { contentVisibility: "auto" };
		$[0] = t1;
	} else t1 = $[0];
	let t2;
	if ($[1] !== attributes || $[2] !== children) {
		t2 = /* @__PURE__ */ React.createElement("div", {
			...attributes,
			style: t1
		}, children);
		$[1] = attributes;
		$[2] = children;
		$[3] = t2;
	} else t2 = $[3];
	return t2;
};

//#endregion
//#region src/react/plugin/toPlatePlugin.ts
const methodsToWrap = [
	"configure",
	"configurePlugin",
	"extendEditorApi",
	"extendSelectors",
	"extendApi",
	"extendEditorTransforms",
	"extendTransforms",
	"overrideEditor",
	"extend",
	"extendPlugin"
];
/**
* Extends a SlatePlugin to create a React PlatePlugin.
*
* @remarks
*   This function transforms a SlatePlugin into a React PlatePlugin, allowing for
*   React-specific functionality to be added.
* @param basePlugin - The base SlatePlugin to be extended.
* @param extendConfig - A function or object that provides the extension
*   configuration. If a function, it receives the plugin context and should
*   return a partial PlatePlugin. If an object, it should be a partial
*   PlatePlugin configuration.
* @returns A new PlatePlugin that combines the base SlatePlugin functionality
*   with React-specific features defined in the extension configuration.
*/
function toPlatePlugin(basePlugin, extendConfig) {
	const plugin = { ...basePlugin };
	methodsToWrap.forEach((method) => {
		const originalMethod = plugin[method];
		plugin[method] = (...args) => {
			return toPlatePlugin(originalMethod(...args));
		};
	});
	if (!extendConfig) return plugin;
	return plugin.extend(extendConfig);
}
/**
* Explicitly typed version of {@link toPlatePlugin}.
*
* @remarks
*   This function requires explicit type parameters for both the base plugin
*   configuration and the extension configuration. Use this when you need
*   precise control over the plugin's type structure or when type inference
*   doesn't provide the desired result.
* @typeParam C - The type of the extension configuration for the PlatePlugin
*   (required).
* @typeParam TContext - The type of the base SlatePlugin configuration
*   (optional).
*/
function toTPlatePlugin(basePlugin, extendConfig) {
	return toPlatePlugin(basePlugin, extendConfig);
}

//#endregion
//#region src/react/plugin/createPlatePlugin.ts
const createPlatePlugin = (config = {}) => {
	return toPlatePlugin(createSlatePlugin(config));
};
/**
* Explicitly typed version of `createPlatePlugin`.
*
* @remarks
*   While `createPlatePlugin` uses type inference, this function requires an
*   explicit type parameter. Use this when you need precise control over the
*   plugin's type structure or when type inference doesn't provide the desired
*   result.
*/
function createTPlatePlugin(config = {}) {
	return createPlatePlugin(config);
}

//#endregion
//#region src/react/plugin/getEditorPlugin.ts
function getEditorPlugin(editor, plugin) {
	return getEditorPlugin$1(editor, plugin);
}

//#endregion
//#region src/react/plugin/getPlugin.ts
/** Get editor plugin by key or plugin object. */
function getPlugin(editor, plugin) {
	return editor.plugins[plugin.key] ?? createPlatePlugin({ key: plugin.key });
}

//#endregion
//#region src/react/plugin/omitPluginContext.ts
const omitPluginContext = (ctx) => {
	const { api, editor, getOption, getOptions, plugin, setOption, setOptions, tf, type, ...rest } = ctx;
	return rest;
};

//#endregion
//#region src/react/plugins/SlateReactExtensionPlugin.ts
const SlateReactExtensionPlugin = toPlatePlugin(SlateExtensionPlugin, { handlers: { onKeyDown: ({ editor, event }) => {
	event.persist();
	editor.dom.currentKeyboardEvent = event;
	if (Hotkeys.isMoveUpward(event)) {
		if (editor.tf.moveLine({ reverse: true })) {
			event.preventDefault();
			event.stopPropagation();
		}
	} else if (Hotkeys.isMoveDownward(event)) {
		if (editor.tf.moveLine({ reverse: false })) {
			event.preventDefault();
			event.stopPropagation();
		}
	} else if (Hotkeys.isTab(editor, event) || Hotkeys.isUntab(editor, event)) {
		if (editor.tf.tab({ reverse: Hotkeys.isUntab(editor, event) })) {
			event.preventDefault();
			event.stopPropagation();
		}
	} else if (Hotkeys.isSelectAll(event)) {
		if (editor.tf.selectAll()) {
			event.preventDefault();
			event.stopPropagation();
		}
	} else if (Hotkeys.isEscape(event) && editor.tf.escape()) {
		event.preventDefault();
		event.stopPropagation();
	}
} } }).extendEditorApi(({ editor }) => ({ redecorate: () => {
	editor.api.debug.warn("The method editor.api.redecorate() has not been overridden. This may cause unexpected behavior. Please ensure that all required editor methods are properly defined.", "OVERRIDE_MISSING");
} })).extendEditorTransforms(({ editor, tf: { reset } }) => ({ reset(options) {
	const isFocused = editor.api.isFocused();
	reset(options);
	if (isFocused) editor.tf.focus({ edge: "startEditor" });
} })).overrideEditor(({ editor, tf: { normalizeNode } }) => ({ transforms: { normalizeNode(entry, options) {
	if (isDefined(entry[0]._memo)) {
		editor.tf.unsetNodes("_memo", { at: entry[1] });
		return;
	}
	normalizeNode(entry, options);
} } }));

//#endregion
//#region src/react/plugins/event-editor/EventEditorStore.ts
/** Store where the keys are event names and the values are editor ids. */
const EventEditorStore = createZustandStore$1({
	blur: null,
	focus: null,
	last: null
}, {
	mutative: true,
	name: "event-editor"
});
const { useValue: useEventEditorValue } = EventEditorStore;

//#endregion
//#region src/react/plugins/event-editor/useFocusEditorEvents.ts
const FOCUS_EDITOR_EVENT = "focus-editor-event";
const BLUR_EDITOR_EVENT = "blur-editor-event";
const useFocusEditorEvents = (t0) => {
	const $ = c(5);
	const { editorRef, onEditorBlur, onEditorFocus } = t0;
	let t1;
	let t2;
	if ($[0] !== editorRef || $[1] !== onEditorBlur || $[2] !== onEditorFocus) {
		t1 = () => {
			const onFocusEditor = (event) => {
				const id = event.detail.id;
				if (!!onEditorFocus && editorRef && editorRef.id === id) onEditorFocus();
			};
			const onBlurEditor = (event_0) => {
				const id_0 = event_0.detail.id;
				if (!!onEditorBlur && editorRef && editorRef.id === id_0) onEditorBlur();
			};
			document.addEventListener(FOCUS_EDITOR_EVENT, onFocusEditor);
			document.addEventListener(BLUR_EDITOR_EVENT, onBlurEditor);
			return () => {
				document.removeEventListener(FOCUS_EDITOR_EVENT, onFocusEditor);
				document.removeEventListener(BLUR_EDITOR_EVENT, onBlurEditor);
			};
		};
		t2 = [
			editorRef,
			onEditorBlur,
			onEditorFocus
		];
		$[0] = editorRef;
		$[1] = onEditorBlur;
		$[2] = onEditorFocus;
		$[3] = t1;
		$[4] = t2;
	} else {
		t1 = $[3];
		t2 = $[4];
	}
	useEffect(t1, t2);
};

//#endregion
//#region src/react/plugins/event-editor/EventEditorPlugin.ts
const EventEditorPlugin = createPlatePlugin({
	key: "eventEditor",
	handlers: {
		onBlur: ({ editor }) => {
			if (EventEditorStore.get("focus") === editor.id) EventEditorStore.set("focus", null);
			EventEditorStore.set("blur", editor.id);
			document.dispatchEvent(new CustomEvent(BLUR_EDITOR_EVENT, { detail: { id: editor.id } }));
		},
		onFocus: ({ editor }) => {
			EventEditorStore.set("focus", editor.id);
			EventEditorStore.set("last", editor.id);
			document.dispatchEvent(new CustomEvent(FOCUS_EDITOR_EVENT, { detail: { id: editor.id } }));
		}
	}
});

//#endregion
//#region src/react/plugins/event-editor/getEventPlateId.ts
const getEventPlateId = (id) => {
	if (id) return id;
	const focus = EventEditorStore.get("focus");
	if (focus) return focus;
	const blur = EventEditorStore.get("blur");
	if (blur) return blur;
	return EventEditorStore.get("last") ?? "plate";
};

//#endregion
//#region src/react/plugins/event-editor/useFocusedLast.ts
/** Whether the current editor is the last focused editor. */
const useFocusedLast = (id) => {
	return (id ?? useEditorId()) === useEventEditorValue("last");
};

//#endregion
//#region src/react/plugins/paragraph/ParagraphPlugin.tsx
const ParagraphPlugin = toPlatePlugin(BaseParagraphPlugin, ({ editor, type }) => ({ shortcuts: { toggleParagraph: {
	keys: [[
		Key.Mod,
		Key.Alt,
		"0"
	], [
		Key.Mod,
		Key.Shift,
		"0"
	]],
	preventDefault: true,
	handler: () => {
		editor.tf.toggleBlock(type);
	}
} } }));

//#endregion
//#region src/react/plugins/react/withPlateReact.ts
const withPlateReact = ({ editor }) => withReact(editor);

//#endregion
//#region src/react/plugins/react/ReactPlugin.ts
/** @see {@link withReact} */
const ReactPlugin = toPlatePlugin(DOMPlugin, {
	key: "dom",
	extendEditor: withPlateReact
});

//#endregion
//#region src/react/editor/getPlateCorePlugins.ts
const getPlateCorePlugins = () => [
	SlateReactExtensionPlugin,
	ReactPlugin,
	EventEditorPlugin,
	ParagraphPlugin
];

//#endregion
//#region src/react/editor/withPlate.ts
/**
* Applies Plate enhancements to an editor instance (React version).
*
* @remarks
*   This function supports React-specific features including component rendering,
*   event handlers, and React hooks integration.
* @see {@link createPlateEditor} for a higher-level React editor creation function.
* @see {@link usePlateEditor} for a memoized version in React components.
* @see {@link withSlate} for the non-React version of editor enhancement.
*/
const withPlate = (e, options = {}) => {
	const { optionsStoreFactory, plugins = [], ...rest } = options;
	return withSlate(e, {
		...rest,
		optionsStoreFactory: optionsStoreFactory ?? createZustandStore,
		plugins: [...getPlateCorePlugins(), ...plugins]
	});
};
/**
* Creates a Plate editor (React version).
*
* This function creates a fully configured Plate editor instance with
* React-specific enhancements including component rendering, event handlers,
* and hooks integration. It applies all specified plugins and configurations to
* create a functional editor.
*
* Examples:
*
* ```ts
* const editor = createPlateEditor({
*   plugins: [ParagraphPlugin, HeadingPlugin],
*   value: [{ type: 'p', children: [{ text: 'Hello world!' }] }],
* });
*
* // Editor with custom components
* const editor = createPlateEditor({
*   plugins: [ParagraphPlugin.withComponent(ParagraphElement)],
*   components: { [CodePlugin.key]: CodeLeaf },
* });
*
* // Editor with React-specific options
* const editor = createPlateEditor({
*   plugins: [ParagraphPlugin],
*   handlers: { onKeyDown: customKeyHandler },
* });
* ```
*
* @see {@link createSlateEditor} for a non-React version of editor creation.
* @see {@link usePlateEditor} for a memoized version in React components.
* @see {@link withPlate} for the underlying function that applies Plate enhancements to an editor.
*/
const createPlateEditor = ({ editor = createEditor(), ...options } = {}) => withPlate(editor, options);

//#endregion
//#region src/react/utils/createPlateFallbackEditor.ts
const createPlateFallbackEditor = (options = {}) => {
	const editor = createPlateEditor(options);
	editor.meta.isFallback = true;
	editor.apply = () => {
		throw new Error("Cannot apply operations on the fallback editor. The fallback editor is used when a hook that depends on the Plate store was unable to locate a valid store. If you are using PlateController, use `useEditorMounted(id?: string)` or `!editor.meta.isFallback` to ensure that a valid Plate store is available before attempting to call operations on the editor.");
	};
	return editor;
};

//#endregion
//#region src/react/utils/dom-attributes.ts
const DOM_HANDLERS = [
	"onCopy",
	"onCopyCapture",
	"onCut",
	"onCutCapture",
	"onPaste",
	"onPasteCapture",
	"onCompositionEnd",
	"onCompositionEndCapture",
	"onCompositionStart",
	"onCompositionStartCapture",
	"onCompositionUpdate",
	"onCompositionUpdateCapture",
	"onFocus",
	"onFocusCapture",
	"onBlur",
	"onBlurCapture",
	"onDOMBeforeInput",
	"onBeforeInput",
	"onBeforeInputCapture",
	"onInput",
	"onInputCapture",
	"onReset",
	"onResetCapture",
	"onSubmit",
	"onSubmitCapture",
	"onInvalid",
	"onInvalidCapture",
	"onLoad",
	"onLoadCapture",
	"onKeyDown",
	"onKeyDownCapture",
	"onKeyPress",
	"onKeyPressCapture",
	"onKeyUp",
	"onKeyUpCapture",
	"onAbort",
	"onAbortCapture",
	"onCanPlay",
	"onCanPlayCapture",
	"onCanPlayThrough",
	"onCanPlayThroughCapture",
	"onDurationChange",
	"onDurationChangeCapture",
	"onEmptied",
	"onEmptiedCapture",
	"onEncrypted",
	"onEncryptedCapture",
	"onEnded",
	"onEndedCapture",
	"onLoadedData",
	"onLoadedDataCapture",
	"onLoadedMetadata",
	"onLoadedMetadataCapture",
	"onLoadStart",
	"onLoadStartCapture",
	"onPause",
	"onPauseCapture",
	"onPlay",
	"onPlayCapture",
	"onPlaying",
	"onPlayingCapture",
	"onProgress",
	"onProgressCapture",
	"onRateChange",
	"onRateChangeCapture",
	"onSeeked",
	"onSeekedCapture",
	"onSeeking",
	"onSeekingCapture",
	"onStalled",
	"onStalledCapture",
	"onSuspend",
	"onSuspendCapture",
	"onTimeUpdate",
	"onTimeUpdateCapture",
	"onVolumeChange",
	"onVolumeChangeCapture",
	"onWaiting",
	"onWaitingCapture",
	"onAuxClick",
	"onAuxClickCapture",
	"onClick",
	"onClickCapture",
	"onContextMenu",
	"onContextMenuCapture",
	"onDoubleClick",
	"onDoubleClickCapture",
	"onDrag",
	"onDragCapture",
	"onDragEnd",
	"onDragEndCapture",
	"onDragEnter",
	"onDragEnterCapture",
	"onDragExit",
	"onDragExitCapture",
	"onDragLeave",
	"onDragLeaveCapture",
	"onDragOver",
	"onDragOverCapture",
	"onDragStart",
	"onDragStartCapture",
	"onDrop",
	"onDropCapture",
	"onMouseDown",
	"onMouseDownCapture",
	"onMouseEnter",
	"onMouseLeave",
	"onMouseMove",
	"onMouseMoveCapture",
	"onMouseOut",
	"onMouseOutCapture",
	"onMouseOver",
	"onMouseOverCapture",
	"onMouseUp",
	"onMouseUpCapture",
	"onSelect",
	"onSelectCapture",
	"onTouchCancel",
	"onTouchCancelCapture",
	"onTouchEnd",
	"onTouchEndCapture",
	"onTouchMove",
	"onTouchMoveCapture",
	"onTouchStart",
	"onTouchStartCapture",
	"onPointerDown",
	"onPointerDownCapture",
	"onPointerMove",
	"onPointerUp",
	"onPointerUpCapture",
	"onPointerCancel",
	"onPointerCancelCapture",
	"onPointerEnter",
	"onPointerLeave",
	"onPointerOver",
	"onPointerOverCapture",
	"onPointerOut",
	"onPointerOutCapture",
	"onGotPointerCapture",
	"onGotPointerCaptureCapture",
	"onLostPointerCapture",
	"onLostPointerCaptureCapture",
	"onScroll",
	"onScrollCapture",
	"onWheel",
	"onWheelCapture",
	"onAnimationStart",
	"onAnimationStartCapture",
	"onAnimationEnd",
	"onAnimationEndCapture",
	"onAnimationIteration",
	"onAnimationIterationCapture",
	"onTransitionEnd",
	"onTransitionEndCapture"
];

//#endregion
//#region src/react/utils/getRenderNodeProps.ts
/**
* Override node props with plugin props. Allowed properties in
* `props.element.attributes` are passed into `props.attributes`. Extend the
* class name with the node type.
*/
const getRenderNodeProps = ({ attributes: nodeAttributes, disableInjectNodeProps, editor, plugin, props, readOnly }) => {
	let newProps = {
		...props,
		...plugin ? getEditorPlugin(editor, plugin) : {
			api: editor.api,
			editor,
			tf: editor.transforms
		}
	};
	const { className } = props;
	const pluginProps = getPluginNodeProps({
		attributes: nodeAttributes,
		plugin,
		props: newProps
	});
	newProps = {
		...pluginProps,
		attributes: {
			...pluginProps.attributes,
			className: clsx(getSlateClass(plugin?.node.type), pluginProps.attributes?.className, className) || void 0
		}
	};
	if (!disableInjectNodeProps) newProps = pipeInjectNodeProps(editor, newProps, (node) => editor.api.findPath(node), readOnly);
	if (newProps.attributes?.style && Object.keys(newProps.attributes.style).length === 0) newProps.attributes.style = void 0;
	return newProps;
};

//#endregion
//#region src/react/utils/pipeHandler.ts
const convertDomEventToSyntheticEvent = (domEvent) => {
	let propagationStopped = false;
	return {
		...domEvent,
		bubbles: domEvent.bubbles,
		cancelable: domEvent.cancelable,
		currentTarget: domEvent.currentTarget,
		defaultPrevented: domEvent.defaultPrevented,
		eventPhase: domEvent.eventPhase,
		isTrusted: domEvent.isTrusted,
		nativeEvent: domEvent,
		target: domEvent.target,
		timeStamp: domEvent.timeStamp,
		type: domEvent.type,
		isDefaultPrevented: () => domEvent.defaultPrevented,
		isPropagationStopped: () => propagationStopped,
		persist: () => {
			throw new Error("persist is not implemented for synthetic events created using convertDomEventToSyntheticEvent");
		},
		preventDefault: () => domEvent.preventDefault(),
		stopPropagation: () => {
			propagationStopped = true;
			domEvent.stopPropagation();
		}
	};
};
/** Check if an event is overrided by a handler. */
const isEventHandled = (event, handler) => {
	if (!handler) return false;
	const shouldTreatEventAsHandled = handler(event);
	if (shouldTreatEventAsHandled != null) return shouldTreatEventAsHandled;
	return event.isPropagationStopped();
};
/**
* Generic pipe for handlers.
*
* - Get all the plugins handlers by `handlerKey`.
* - If there is no plugin handler or editable prop handler for this key, return
*   `undefined`.
* - Return a handler calling all the plugins handlers then the prop handler.
* - Any handler returning true will stop the next handlers to be called,
*   including slate internal handler.
*/
const pipeHandler = (editor, { editableProps, handlerKey }) => {
	const propsHandler = editableProps?.[handlerKey];
	const relevantPlugins = editor.meta.pluginList.filter((plugin) => plugin.handlers?.[handlerKey]);
	if (relevantPlugins.length === 0 && !propsHandler) return;
	return (event) => {
		const handledEvent = event instanceof Event ? convertDomEventToSyntheticEvent(event) : event;
		if (relevantPlugins.some((plugin) => {
			if (isEditOnly(editor.dom.readOnly, plugin, "handlers")) return false;
			const pluginHandler = plugin.handlers[handlerKey];
			const shouldTreatEventAsHandled = pluginHandler({
				...getEditorPlugin(editor, plugin),
				event: handledEvent
			});
			if (shouldTreatEventAsHandled != null) return shouldTreatEventAsHandled;
			return false;
		})) return true;
		return isEventHandled(handledEvent, propsHandler);
	};
};

//#endregion
//#region src/react/utils/pipeOnChange.ts
const pipeOnChange = (editor, value) => {
	return editor.meta.pluginCache.handlers.onChange.some((key) => {
		const plugin = getPlugin(editor, { key });
		if (isEditOnly(editor.dom.readOnly, plugin, "handlers")) return false;
		const handler = plugin.handlers.onChange;
		const shouldTreatEventAsHandled = handler({
			...getEditorPlugin(editor, plugin),
			value
		});
		if (shouldTreatEventAsHandled != null) return shouldTreatEventAsHandled;
		return false;
	});
};

//#endregion
//#region src/react/components/plate-nodes.tsx
const useNodeAttributes = (props, ref) => {
	const $ = c(11);
	const t0 = props.attributes;
	let t1;
	if ($[0] !== props.attributes || $[1] !== props.className) {
		t1 = clsx(props.attributes.className, props.className) || void 0;
		$[0] = props.attributes;
		$[1] = props.className;
		$[2] = t1;
	} else t1 = $[2];
	const t2 = useComposedRef(ref, props.attributes.ref);
	const t3 = props.attributes;
	let t4;
	if ($[3] !== props.style || $[4] !== t3.style) {
		t4 = {
			...t3.style,
			...props.style
		};
		$[3] = props.style;
		$[4] = t3.style;
		$[5] = t4;
	} else t4 = $[5];
	let t5;
	if ($[6] !== props.attributes || $[7] !== t1 || $[8] !== t2 || $[9] !== t4) {
		t5 = {
			...t0,
			className: t1,
			ref: t2,
			style: t4
		};
		$[6] = props.attributes;
		$[7] = t1;
		$[8] = t2;
		$[9] = t4;
		$[10] = t5;
	} else t5 = $[10];
	return t5;
};
const PlateElement = React.forwardRef(function PlateElement$1(t0, ref) {
	const $ = c(22);
	let children;
	let insetProp;
	let props;
	let t1;
	if ($[0] !== t0) {
		({as: t1, children, insetProp, ...props} = t0);
		$[0] = t0;
		$[1] = children;
		$[2] = insetProp;
		$[3] = props;
		$[4] = t1;
	} else {
		children = $[1];
		insetProp = $[2];
		props = $[3];
		t1 = $[4];
	}
	const Tag = t1 === void 0 ? "div" : t1;
	const attributes = useNodeAttributes(props, ref);
	const block = useEditorMounted() && !!props.element.id && !!props.editor.api.isBlock(props.element);
	const inset = insetProp ?? props.plugin?.rules.selection?.affinity === "directional";
	let t2;
	if ($[5] !== inset) {
		t2 = inset && /* @__PURE__ */ React.createElement(NonBreakingSpace, null);
		$[5] = inset;
		$[6] = t2;
	} else t2 = $[6];
	const t3 = attributes["data-slate-inline"];
	const t4 = block ? props.element.id : void 0;
	const t5 = attributes?.style;
	let t6;
	if ($[7] !== t5) {
		t6 = {
			position: "relative",
			...t5
		};
		$[7] = t5;
		$[8] = t6;
	} else t6 = $[8];
	const t7 = t6;
	let t8;
	if ($[9] !== inset) {
		t8 = inset && /* @__PURE__ */ React.createElement(NonBreakingSpace, null);
		$[9] = inset;
		$[10] = t8;
	} else t8 = $[10];
	let t9;
	if ($[11] !== Tag || $[12] !== attributes || $[13] !== children || $[14] !== t3 || $[15] !== t4 || $[16] !== t7 || $[17] !== t8) {
		t9 = /* @__PURE__ */ React.createElement(Tag, {
			"data-slate-node": "element",
			"data-slate-inline": t3,
			"data-block-id": t4,
			...attributes,
			style: t7
		}, children, t8);
		$[11] = Tag;
		$[12] = attributes;
		$[13] = children;
		$[14] = t3;
		$[15] = t4;
		$[16] = t7;
		$[17] = t8;
		$[18] = t9;
	} else t9 = $[18];
	let t10;
	if ($[19] !== t2 || $[20] !== t9) {
		t10 = /* @__PURE__ */ React.createElement(React.Fragment, null, t2, t9);
		$[19] = t2;
		$[20] = t9;
		$[21] = t10;
	} else t10 = $[21];
	return t10;
});
const PlateText = React.forwardRef((t0, ref) => {
	const $ = c(8);
	let children;
	let props;
	let t1;
	if ($[0] !== t0) {
		({as: t1, children, ...props} = t0);
		$[0] = t0;
		$[1] = children;
		$[2] = props;
		$[3] = t1;
	} else {
		children = $[1];
		props = $[2];
		t1 = $[3];
	}
	const Tag = t1 === void 0 ? "span" : t1;
	const attributes = useNodeAttributes(props, ref);
	let t2;
	if ($[4] !== Tag || $[5] !== attributes || $[6] !== children) {
		t2 = /* @__PURE__ */ React.createElement(Tag, attributes, children);
		$[4] = Tag;
		$[5] = attributes;
		$[6] = children;
		$[7] = t2;
	} else t2 = $[7];
	return t2;
});
const NonBreakingSpace = () => {
	const $ = c(2);
	let t0;
	if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
		t0 = {
			fontSize: 0,
			lineHeight: 0
		};
		$[0] = t0;
	} else t0 = $[0];
	let t1;
	if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
		t1 = /* @__PURE__ */ React.createElement("span", {
			style: t0,
			contentEditable: false
		}, String.fromCodePoint(160));
		$[1] = t1;
	} else t1 = $[1];
	return t1;
};
const PlateLeaf = React.forwardRef((t0, ref) => {
	const $ = c(15);
	let children;
	let insetProp;
	let props;
	let t1;
	if ($[0] !== t0) {
		({as: t1, children, inset: insetProp, ...props} = t0);
		$[0] = t0;
		$[1] = children;
		$[2] = insetProp;
		$[3] = props;
		$[4] = t1;
	} else {
		children = $[1];
		insetProp = $[2];
		props = $[3];
		t1 = $[4];
	}
	const Tag = t1 === void 0 ? "span" : t1;
	const attributes = useNodeAttributes(props, ref);
	if (insetProp ?? props.plugin?.rules.selection?.affinity === "hard") {
		let t2$1;
		if ($[5] === Symbol.for("react.memo_cache_sentinel")) {
			t2$1 = /* @__PURE__ */ React.createElement(NonBreakingSpace, null);
			$[5] = t2$1;
		} else t2$1 = $[5];
		let t3;
		if ($[6] === Symbol.for("react.memo_cache_sentinel")) {
			t3 = /* @__PURE__ */ React.createElement(NonBreakingSpace, null);
			$[6] = t3;
		} else t3 = $[6];
		let t4;
		if ($[7] !== Tag || $[8] !== attributes || $[9] !== children) {
			t4 = /* @__PURE__ */ React.createElement(React.Fragment, null, t2$1, /* @__PURE__ */ React.createElement(Tag, attributes, children, t3));
			$[7] = Tag;
			$[8] = attributes;
			$[9] = children;
			$[10] = t4;
		} else t4 = $[10];
		return t4;
	}
	let t2;
	if ($[11] !== Tag || $[12] !== attributes || $[13] !== children) {
		t2 = /* @__PURE__ */ React.createElement(Tag, attributes, children);
		$[11] = Tag;
		$[12] = attributes;
		$[13] = children;
		$[14] = t2;
	} else t2 = $[14];
	return t2;
});

//#endregion
//#region src/react/utils/pluginRenderLeaf.tsx
/**
* Get a `Editable.renderLeaf` handler for `plugin.node.type`. If the type is
* equals to the slate leaf type, render `plugin.render.node`. Else, return
* `children`.
*/
const pluginRenderLeaf = (editor, plugin) => function render(props) {
	const { render: { leaf: leafComponent, node } } = plugin;
	const { children, leaf } = props;
	const readOnly = useReadOnly();
	if (isEditOnly(readOnly, plugin, "render")) return children;
	if (leaf[plugin.node.type]) {
		const Component = leafComponent ?? node;
		const Leaf = Component ?? PlateLeaf;
		const ctxProps = getRenderNodeProps({
			attributes: leaf.attributes,
			editor,
			plugin,
			props,
			readOnly
		});
		const defaultProps = Component ? {} : { as: plugin.render?.as };
		return /* @__PURE__ */ React.createElement(Leaf, {
			...defaultProps,
			...ctxProps
		}, children);
	}
	return children;
};

//#endregion
//#region src/react/utils/pipeRenderLeaf.tsx
/** @see {@link RenderLeaf} */
const pipeRenderLeaf = (editor, renderLeafProp) => {
	const renderLeafs = [];
	const leafPropsPlugins = [];
	editor.meta.pluginCache.node.isLeaf.forEach((key) => {
		const plugin = editor.getPlugin({ key });
		if (plugin) renderLeafs.push(pluginRenderLeaf(editor, plugin));
	});
	editor.meta.pluginCache.node.leafProps.forEach((key) => {
		const plugin = editor.getPlugin({ key });
		if (plugin) leafPropsPlugins.push(plugin);
	});
	return function render({ attributes, ...props }) {
		const readOnly = useReadOnly();
		renderLeafs.forEach((renderLeaf) => {
			const newChildren = renderLeaf(props);
			if (newChildren !== void 0) props.children = newChildren;
		});
		leafPropsPlugins.forEach((plugin) => {
			if (props.leaf[plugin.node.type]) {
				const pluginLeafProps = typeof plugin.node.leafProps === "function" ? plugin.node.leafProps(props) : plugin.node.leafProps ?? {};
				if (pluginLeafProps.className) pluginLeafProps.className = clsx$1(props.className, pluginLeafProps.className);
				attributes = {
					...attributes,
					...pluginLeafProps
				};
			}
		});
		if (renderLeafProp) return renderLeafProp({
			attributes,
			...props
		});
		const ctxProps = getRenderNodeProps({
			editor,
			props: {
				attributes,
				...props
			},
			readOnly
		});
		return /* @__PURE__ */ React.createElement(PlateLeaf, ctxProps, props.children);
	};
};

//#endregion
//#region src/react/utils/pluginRenderText.tsx
/**
* Get a `Editable.renderText` handler for `plugin.node.type`. If the type is
* equals to the slate text type and isDecoration is false, render
* `plugin.render.node`. Else, return the default text rendering.
*/
const pluginRenderText = (editor, plugin) => function render(nodeProps) {
	const { render: { node } } = plugin;
	const { children, text } = nodeProps;
	const readOnly = useReadOnly();
	if (isEditOnly(readOnly, plugin, "render")) return children;
	if (text[plugin.node.type ?? plugin.key]) {
		const Text = node ?? PlateText;
		const ctxProps = getRenderNodeProps({
			attributes: nodeProps.attributes,
			editor,
			plugin,
			props: nodeProps,
			readOnly
		});
		const defaultProps = node ? {} : { as: plugin.render?.as };
		return /* @__PURE__ */ React.createElement(Text, {
			...defaultProps,
			...ctxProps
		}, children);
	}
	return children;
};

//#endregion
//#region src/react/utils/pipeRenderText.tsx
/** @see {@link RenderText} */
const pipeRenderText = (editor, renderTextProp) => {
	const renderTexts = [];
	const textPropsPlugins = [];
	editor.meta.pluginList.forEach((plugin) => {
		if (plugin.node.isLeaf && plugin.node.isDecoration === false) renderTexts.push(pluginRenderText(editor, plugin));
		if (plugin.node.textProps) textPropsPlugins.push(plugin);
	});
	return function render({ attributes, ...props }) {
		const readOnly = useReadOnly();
		renderTexts.forEach((renderText) => {
			const newChildren = renderText(props);
			if (newChildren !== void 0) props.children = newChildren;
		});
		textPropsPlugins.forEach((plugin) => {
			if (props.text[plugin.node.type ?? plugin.key]) {
				const pluginTextProps = typeof plugin.node.textProps === "function" ? plugin.node.textProps(props) : plugin.node.textProps ?? {};
				if (pluginTextProps.className) pluginTextProps.className = clsx$1(props.className, pluginTextProps.className);
				attributes = {
					...attributes,
					...pluginTextProps
				};
			}
		});
		if (renderTextProp) return renderTextProp({
			attributes,
			...props
		});
		const ctxProps = getRenderNodeProps({
			editor,
			props: {
				attributes,
				...props
			},
			readOnly
		});
		return /* @__PURE__ */ React.createElement(PlateText, ctxProps, props.children);
	};
};

//#endregion
//#region src/react/hooks/useEditableProps.ts
const useEditableProps = ({ disabled, readOnly, ...editableProps } = {}) => {
	const { id } = editableProps;
	const editor = useEditorRef(id);
	const store = usePlateStore(id);
	const versionDecorate = useAtomStoreValue(store, "versionDecorate");
	const storeDecorate = useAtomStoreValue(store, "decorate");
	const storeRenderChunk = useAtomStoreValue(store, "renderChunk");
	const storeRenderElement = useAtomStoreValue(store, "renderElement");
	const storeRenderLeaf = useAtomStoreValue(store, "renderLeaf");
	const storeRenderText = useAtomStoreValue(store, "renderText");
	const decorateMemo = React.useMemo(() => pipeDecorate(editor, storeDecorate ?? editableProps?.decorate), [
		editableProps?.decorate,
		editor,
		storeDecorate
	]);
	const decorate = React.useMemo(() => {
		if (!versionDecorate || !decorateMemo) return;
		return (entry) => decorateMemo(entry);
	}, [decorateMemo, versionDecorate]);
	const defaultRenderChunk = usePluginOption(ChunkingPlugin, "contentVisibilityAuto") ? ContentVisibilityChunk : void 0;
	const renderChunk = storeRenderChunk ?? editableProps?.renderChunk ?? defaultRenderChunk;
	const renderElement = React.useMemo(() => pipeRenderElement(editor, storeRenderElement ?? editableProps?.renderElement), [
		editableProps?.renderElement,
		editor,
		storeRenderElement
	]);
	const renderLeaf = React.useMemo(() => pipeRenderLeaf(editor, storeRenderLeaf ?? editableProps?.renderLeaf), [
		editableProps?.renderLeaf,
		editor,
		storeRenderLeaf
	]);
	const renderText = React.useMemo(() => pipeRenderText(editor, storeRenderText ?? editableProps?.renderText), [
		editableProps?.renderText,
		editor,
		storeRenderText
	]);
	const props = useDeepCompareMemo(() => {
		const _props = {
			decorate,
			renderChunk,
			renderElement,
			renderLeaf,
			renderText
		};
		DOM_HANDLERS.forEach((handlerKey) => {
			const handler = pipeHandler(editor, {
				editableProps,
				handlerKey
			});
			if (handler) _props[handlerKey] = handler;
		});
		return _props;
	}, [
		decorate,
		editableProps,
		renderChunk,
		renderElement,
		renderLeaf,
		renderText
	]);
	return useDeepCompareMemo(() => ({
		...omit(editableProps, [
			...DOM_HANDLERS,
			"renderChunk",
			"renderElement",
			"renderLeaf",
			"renderText",
			"decorate"
		]),
		...props,
		"aria-disabled": disabled,
		className: clsx$1("slate-editor", "ignore-click-outside/toolbar", editableProps.className),
		"data-readonly": readOnly ? "true" : void 0,
		readOnly
	}), [
		editableProps,
		props,
		readOnly
	]);
};

//#endregion
//#region src/react/hooks/useNodePath.ts
/**
* Returns the path of a node every time the node changes. Note, however, that
* if another node is updated in a way that affects this node's path, this hook
* will not return the new path.
*/
const useNodePath = (node) => {
	const $ = c(6);
	const editor = useEditorRef();
	let t0;
	if ($[0] !== editor.api || $[1] !== node) {
		t0 = () => editor.api.findPath(node);
		$[0] = editor.api;
		$[1] = node;
		$[2] = t0;
	} else t0 = $[2];
	let t1;
	if ($[3] !== editor || $[4] !== node) {
		t1 = [editor, node];
		$[3] = editor;
		$[4] = node;
		$[5] = t1;
	} else t1 = $[5];
	return useMemoizedSelector(t0, t1, _temp);
};
function _temp(a, b) {
	return !!a && !!b && PathApi.equals(a, b);
}

//#endregion
//#region src/react/hooks/useSlateProps.ts
/** Get Slate props stored in a global store. */
const useSlateProps = (t0) => {
	const $ = c(17);
	const { id } = t0;
	const editor = useEditorRef(id);
	const store = usePlateStore(id);
	const onChangeProp = useAtomStoreValue(store, "onChange");
	const onValueChangeProp = useAtomStoreValue(store, "onValueChange");
	const onSelectionChangeProp = useAtomStoreValue(store, "onSelectionChange");
	const updateVersionEditor = useIncrementVersion("versionEditor", id);
	const updateVersionSelection = useIncrementVersion("versionSelection", id);
	const updateVersionValue = useIncrementVersion("versionValue", id);
	let t1;
	if ($[0] !== editor || $[1] !== onChangeProp || $[2] !== updateVersionEditor) {
		t1 = (newValue) => {
			updateVersionEditor();
			if (!pipeOnChange(editor, newValue)) onChangeProp?.({
				editor,
				value: newValue
			});
		};
		$[0] = editor;
		$[1] = onChangeProp;
		$[2] = updateVersionEditor;
		$[3] = t1;
	} else t1 = $[3];
	const onChange = t1;
	let t2;
	if ($[4] !== editor || $[5] !== onValueChangeProp || $[6] !== updateVersionValue) {
		t2 = (value) => {
			updateVersionValue();
			onValueChangeProp?.({
				editor,
				value
			});
		};
		$[4] = editor;
		$[5] = onValueChangeProp;
		$[6] = updateVersionValue;
		$[7] = t2;
	} else t2 = $[7];
	const onValueChange = t2;
	let t3;
	if ($[8] !== editor || $[9] !== onSelectionChangeProp || $[10] !== updateVersionSelection) {
		t3 = (selection) => {
			updateVersionSelection();
			onSelectionChangeProp?.({
				editor,
				selection
			});
		};
		$[8] = editor;
		$[9] = onSelectionChangeProp;
		$[10] = updateVersionSelection;
		$[11] = t3;
	} else t3 = $[11];
	const onSelectionChange = t3;
	let t4;
	if ($[12] !== editor || $[13] !== onChange || $[14] !== onSelectionChange || $[15] !== onValueChange) {
		t4 = {
			key: editor.meta.key,
			editor,
			initialValue: editor.children,
			value: editor.children,
			onChange,
			onSelectionChange,
			onValueChange
		};
		$[12] = editor;
		$[13] = onChange;
		$[14] = onSelectionChange;
		$[15] = onValueChange;
		$[16] = t4;
	} else t4 = $[16];
	return t4;
};

//#endregion
//#region src/react/stores/element/usePath.ts
/** Get the memoized path of the closest element. */
const usePath = (pluginKey) => {
	const editor = useEditorRef();
	const value = useAtomStoreValue(useElementStore(pluginKey), "path");
	if (!value) {
		editor.api.debug.warn(`usePath(${pluginKey}) hook must be used inside the node component's context`, "USE_ELEMENT_CONTEXT");
		return;
	}
	return value;
};

//#endregion
//#region src/react/stores/element/useElementStore.tsx
const SCOPE_ELEMENT = "element";
const initialState = {
	element: null,
	entry: null,
	path: null
};
const { ElementProvider, elementStore, useElementStore } = createAtomStore(initialState, {
	effect: Effect,
	name: "element",
	suppressWarnings: true
});
function Effect() {
	const $ = c(1);
	const path = usePath();
	if (path && PathApi.equals(path, [0])) {
		let t0;
		if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
			t0 = /* @__PURE__ */ React.createElement(FirstBlockEffect, null);
			$[0] = t0;
		} else t0 = $[0];
		return t0;
	}
	return null;
}
function FirstBlockEffect() {
	const editor = useEditorRef();
	const store = usePlateStore();
	const composing = useComposing();
	const readOnly = useReadOnly();
	editor.dom.readOnly = readOnly;
	editor.dom.composing = composing;
	React.useLayoutEffect(() => {
		store.set("composing", composing);
	}, [composing, store]);
	return null;
}

//#endregion
//#region src/react/utils/pluginRenderElement.tsx
function ElementContent(t0) {
	const $ = c(3);
	const { editor, plugin, ...t1 } = t0;
	let props = t1;
	const element = useElement();
	const readOnly = useReadOnly();
	if (isEditOnly(readOnly, plugin, "render")) return null;
	const { children: _children } = props;
	const Component = plugin.render?.node;
	const Element = Component ?? PlateElement;
	props = getRenderNodeProps({
		attributes: element.attributes,
		editor,
		plugin,
		props,
		readOnly
	});
	let children = _children;
	editor.meta.pluginCache.render.belowNodes.forEach((key) => {
		const plugin_0 = editor.getPlugin({ key });
		const withHOC$1 = plugin_0.render.belowNodes;
		const hoc = withHOC$1({
			...props,
			key
		});
		if (hoc && !isEditOnly(readOnly, plugin_0, "render")) children = hoc({
			...props,
			children
		});
	});
	let t2;
	if ($[0] !== Component || $[1] !== plugin.render?.as) {
		t2 = Component ? {} : { as: plugin.render?.as };
		$[0] = Component;
		$[1] = plugin.render?.as;
		$[2] = t2;
	} else t2 = $[2];
	const defaultProps = t2;
	let component = /* @__PURE__ */ React.createElement(Element, {
		...defaultProps,
		...props
	}, children, /* @__PURE__ */ React.createElement(BelowRootNodes, {
		...defaultProps,
		...props
	}));
	editor.meta.pluginCache.render.aboveNodes.forEach((key_0) => {
		const plugin_1 = editor.getPlugin({ key: key_0 });
		const withHOC_0 = plugin_1.render.aboveNodes;
		const hoc_0 = withHOC_0({
			...props,
			key: key_0
		});
		if (hoc_0 && !isEditOnly(readOnly, plugin_1, "render")) component = hoc_0({
			...props,
			children: component
		});
	});
	return component;
}
function BelowRootNodes(props) {
	const $ = c(6);
	const editor = useEditorRef();
	const readOnly = useReadOnly();
	let t0;
	if ($[0] !== editor || $[1] !== props || $[2] !== readOnly) {
		t0 = editor.meta.pluginCache.render.belowRootNodes.map((key) => {
			const plugin = editor.getPlugin({ key });
			if (isEditOnly(readOnly, plugin, "render")) return null;
			const Component = plugin.render.belowRootNodes;
			return /* @__PURE__ */ React.createElement(Component, {
				key,
				...props
			});
		});
		$[0] = editor;
		$[1] = props;
		$[2] = readOnly;
		$[3] = t0;
	} else t0 = $[3];
	let t1;
	if ($[4] !== t0) {
		t1 = /* @__PURE__ */ React.createElement(React.Fragment, null, t0);
		$[4] = t0;
		$[5] = t1;
	} else t1 = $[5];
	return t1;
}
/**
* Get a `Editable.renderElement` handler for `plugin.node.type`. If the type is
* equals to the slate element type, render `plugin.render.node`. Else, return
* `undefined` so the pipeline can check the next plugin.
*/
const pluginRenderElement = (editor, plugin) => function render(props) {
	const { element, path } = props;
	return /* @__PURE__ */ React.createElement(ElementProvider, {
		element,
		entry: [element, path],
		path,
		scope: plugin.key
	}, /* @__PURE__ */ React.createElement(ElementContent, {
		editor,
		plugin,
		...props
	}));
};

//#endregion
//#region src/react/utils/pipeRenderElement.tsx
/** @see {@link RenderElement} */
const pipeRenderElement = (editor, renderElementProp) => {
	return function render(props) {
		const readOnly = useReadOnly();
		const path = useNodePath(props.element);
		const plugin = getPluginByType(editor, props.element.type);
		if (plugin?.node.isElement) return pluginRenderElement(editor, plugin)({
			...props,
			path
		});
		if (renderElementProp) return renderElementProp({
			...props,
			path
		});
		const ctxProps = getRenderNodeProps({
			disableInjectNodeProps: true,
			editor,
			props: {
				...props,
				path
			},
			readOnly
		});
		return /* @__PURE__ */ React.createElement(ElementProvider, {
			element: ctxProps.element,
			entry: [ctxProps.element, path],
			path,
			scope: ctxProps.element.type ?? "default"
		}, /* @__PURE__ */ React.createElement(PlateElement, ctxProps, props.children, /* @__PURE__ */ React.createElement(BelowRootNodes, ctxProps)));
	};
};

//#endregion
//#region src/react/stores/plate-controller/plateControllerStore.ts
const { PlateControllerProvider: PlateController, plateControllerStore, usePlateControllerStore: _usePlateControllerStore } = createAtomStore({
	activeId: atom$1(null),
	editorStores: atom$1({}),
	primaryEditorIds: atom$1([])
}, { name: "plateController" });
const usePlateControllerLocalStore = (options) => _usePlateControllerStore({
	scope: typeof options === "string" ? options : void 0,
	warnIfNoStore: false,
	...typeof options === "object" ? options : {}
});
const usePlateControllerExists = () => {
	return !!usePlateControllerLocalStore().store;
};
/**
* Retrieve from PlateController the JotaiStore for the editor with a given ID,
* or the active editor if no ID is provided, or the first primary editor if no
* editor is active, or null.
*/
const usePlateControllerStore = (idProp) => {
	const $ = c(2);
	let t0;
	if ($[0] !== idProp) {
		t0 = atom$1((get) => {
			const editorStores = get(plateControllerStore.atom.editorStores);
			const forId = (id) => {
				if (!id) return null;
				return editorStores[id] ?? null;
			};
			if (idProp) return forId(idProp);
			const lookupOrder = [get(plateControllerStore.atom.activeId), ...get(plateControllerStore.atom.primaryEditorIds)];
			for (const id_0 of lookupOrder) {
				const store = forId(id_0);
				if (store) return store;
			}
			return null;
		});
		$[0] = idProp;
		$[1] = t0;
	} else t0 = $[1];
	const storeAtom = t0;
	return useStoreAtomValue(usePlateControllerLocalStore(), storeAtom);
};

//#endregion
//#region src/react/stores/plate/createPlateStore.ts
const PLATE_SCOPE = "plate";
const GLOBAL_PLATE_SCOPE = Symbol("global-plate");
const createPlateStore = ({ id, composing = false, containerRef = { current: null }, decorate = null, editor, isMounted = false, primary = true, readOnly = null, renderChunk = null, renderElement = null, renderLeaf = null, renderText = null, scrollRef = { current: null }, versionDecorate = 1, versionEditor = 1, versionSelection = 1, versionValue = 1, onChange = null, onNodeChange = null, onSelectionChange = null, onTextChange = null, onValueChange = null, ...state } = {}) => createAtomStore({
	composing,
	containerRef,
	decorate,
	editor,
	isMounted,
	primary,
	readOnly,
	renderChunk,
	renderElement,
	renderLeaf,
	renderText,
	scrollRef,
	versionDecorate,
	versionEditor,
	versionSelection,
	versionValue,
	onChange,
	onNodeChange,
	onSelectionChange,
	onTextChange,
	onValueChange,
	...state
}, {
	name: "plate",
	suppressWarnings: true,
	extend: (atoms) => ({
		trackedEditor: atom$1((get) => ({
			editor: get(atoms.editor),
			version: get(atoms.versionEditor)
		})),
		trackedSelection: atom$1((get) => ({
			selection: get(atoms.editor).selection,
			version: get(atoms.versionSelection)
		})),
		trackedValue: atom$1((get) => ({
			value: get(atoms.editor).children,
			version: get(atoms.versionValue)
		}))
	})
});
const { PlateProvider: PlateStoreProvider, plateStore, usePlateSet: usePlateLocalSet, usePlateState: usePlateLocalState, usePlateStore: usePlateLocalStore, usePlateValue: usePlateLocalValue } = createPlateStore();
const { usePlateStore: useFallbackPlateStore } = createPlateStore();
const usePlateStore = (id) => {
	const localStore = usePlateLocalStore({
		scope: id,
		warnIfNoStore: false
	}) ?? null;
	const [localStoreExists] = React.useState(!!localStore.store);
	const store = localStoreExists ? localStore : usePlateControllerStore(id);
	/**
	* If we still have no store, there are two possibilities.
	*
	* Case 1: There is neither a Plate nor a PlateController above us in the
	* tree. In this case, throw an error, since calling the hook will never
	* work.
	*
	* Case 2: There is a PlateController, but it has no active editor. In this
	* case, return a fallback store until an editor becomes active.
	*/
	const plateControllerExists = usePlateControllerExists();
	const fallbackStore = useFallbackPlateStore();
	if (!store) {
		if (plateControllerExists) return fallbackStore;
		throw new Error("Plate hooks must be used inside a Plate or PlateController");
	}
	return store;
};
const usePlateSet = (key, options) => {
	return useAtomStoreSet(usePlateStore(typeof options === "string" ? options : options?.scope), key);
};
const usePlateValue = ((key, options) => {
	return useAtomStoreValue(usePlateStore(typeof options === "string" ? options : options?.scope), key);
});
const usePlateState = ((key, options) => {
	return useAtomStoreState(usePlateStore(typeof options === "string" ? options : options?.scope), key);
});
/** Get the closest `Plate` id. */
const useEditorId = () => {
	return useAtomStoreValue(usePlateStore(), "editor").id;
};
const useEditorContainerRef = (id) => {
	return useAtomStoreValue(usePlateStore(id), "containerRef");
};
const useEditorScrollRef = (id) => {
	return useAtomStoreValue(usePlateStore(id), "scrollRef");
};
/** Returns the scrollRef if it exists, otherwise returns the containerRef. */
const useScrollRef = (id) => {
	const scrollRef = useEditorScrollRef(id);
	const containerRef = useEditorContainerRef(id);
	return scrollRef.current ? scrollRef : containerRef;
};
const useEditorMounted = (id) => {
	return !!useAtomStoreValue(usePlateStore(id), "isMounted");
};
/**
* Whether the editor is read-only. You can also use `useReadOnly` from
* `slate-react` in node components.
*/
const useEditorReadOnly = (id) => {
	return !!useAtomStoreValue(usePlateStore(id), "readOnly");
};
/** Whether the editor is composing. */
const useEditorComposing = (id) => {
	return !!useAtomStoreValue(usePlateStore(id), "composing");
};
/**
* Get a reference to the editor instance that remains stable across re-renders.
* The editor object is enhanced with a `store` property that provides access to
* the Plate store.
*
* @example
*   ```tsx
*   const editor = useEditorRef();
*   const readOnly = useAtomStoreValue(editor.store, 'readOnly');
*/
const useEditorRef = (id) => {
	const store = usePlateStore(id);
	const editor = useAtomStoreValue(store, "editor") ?? createPlateFallbackEditor();
	editor.store = store;
	return editor;
};
/** Get the editor selection (deeply memoized). */
const useEditorSelection = (id) => usePlateStore(id).useTrackedSelectionValue().selection;
/** Get editor state which is updated on editor change. */
const useEditorState = (id) => usePlateStore(id).useTrackedEditorValue().editor;
/** Version incremented on each editor change. */
const useEditorVersion = (id) => {
	return useAtomStoreValue(usePlateStore(id), "versionEditor");
};
/** Version incremented on selection change. */
const useSelectionVersion = (id) => {
	return useAtomStoreValue(usePlateStore(id), "versionSelection");
};
/** Get the editor value (deeply memoized). */
const useEditorValue = (id) => usePlateStore(id).useTrackedValueValue().value;
/** Version incremented on value change. */
const useValueVersion = (id) => {
	return useAtomStoreValue(usePlateStore(id), "versionValue");
};
const useIncrementVersion = (key, id) => {
	const $ = c(6);
	const previousVersionRef = React.useRef(1);
	const store = usePlateStore(id);
	const setVersionDecorate = useAtomStoreSet(store, "versionDecorate");
	const setVersionSelection = useAtomStoreSet(store, "versionSelection");
	const setVersionValue = useAtomStoreSet(store, "versionValue");
	const setVersionEditor = useAtomStoreSet(store, "versionEditor");
	let t0;
	if ($[0] !== key || $[1] !== setVersionDecorate || $[2] !== setVersionEditor || $[3] !== setVersionSelection || $[4] !== setVersionValue) {
		t0 = () => {
			const nextVersion = previousVersionRef.current + 1;
			bb2: switch (key) {
				case "versionDecorate":
					setVersionDecorate(nextVersion);
					break bb2;
				case "versionEditor":
					setVersionEditor(nextVersion);
					break bb2;
				case "versionSelection":
					setVersionSelection(nextVersion);
					break bb2;
				case "versionValue": setVersionValue(nextVersion);
			}
			previousVersionRef.current = nextVersion;
		};
		$[0] = key;
		$[1] = setVersionDecorate;
		$[2] = setVersionEditor;
		$[3] = setVersionSelection;
		$[4] = setVersionValue;
		$[5] = t0;
	} else t0 = $[5];
	return t0;
};
const useRedecorate = (id) => {
	const $ = c(2);
	const updateDecorate = useIncrementVersion("versionDecorate", id);
	let t0;
	if ($[0] !== updateDecorate) {
		t0 = () => {
			updateDecorate();
		};
		$[0] = updateDecorate;
		$[1] = t0;
	} else t0 = $[1];
	return t0;
};

//#endregion
//#region src/react/stores/plate/useEditorPlugin.ts
/** Get editor and plugin context. */
function useEditorPlugin(p, id) {
	const $ = c(6);
	const editor = useEditorRef(id);
	let t0;
	if ($[0] !== editor || $[1] !== p) {
		t0 = getEditorPlugin(editor, p);
		$[0] = editor;
		$[1] = p;
		$[2] = t0;
	} else t0 = $[2];
	let t1;
	if ($[3] !== editor.store || $[4] !== t0) {
		t1 = {
			...t0,
			store: editor.store
		};
		$[3] = editor.store;
		$[4] = t0;
		$[5] = t1;
	} else t1 = $[5];
	return t1;
}

//#endregion
//#region src/react/stores/plate/useEditorSelector.ts
const useEditorSelector = (selector, deps, { id, equalityFn = (a, b) => a === b } = {}) => {
	const selectorAtom = React.useMemo(() => selectAtom(plateStore.atom.trackedEditor, ({ editor }, prev) => selector(editor, prev), equalityFn), deps);
	return useStoreAtomValue$1(usePlateStore(id), selectorAtom);
};

//#endregion
//#region src/react/stores/plate/usePluginOption.ts
/**
* Hook to access plugin options. For usage outside `<Plate>`, use
* `useEditorPluginOption` instead.
*
* @example
*   const value = usePluginOption(plugin, 'value');
*   const doubleValue = usePluginOption(plugin, 'doubleValue', 2);
*/
function usePluginOption(plugin, key, ...args) {
	return useEditorPluginOption(useEditorRef(), plugin, key, ...args);
}
function useEditorPluginOption(editor, plugin, key, ...args) {
	const store = editor.getOptionsStore(plugin);
	if (!store) return;
	if (!(key in store.get("state")) && !(key in store.selectors)) {
		editor.api.debug.error(`usePluginOption: ${key} option is not defined in plugin ${plugin.key}`, "OPTION_UNDEFINED");
		return;
	}
	return useStoreValue$1(store, key, ...args);
}
/**
* Use zustand store selector.
*
* @example
*   const name = usePluginOptions(plugin, (state) => state.name, equalityFn);
*/
function usePluginOptions(plugin, selector, t0) {
	const $ = c(4);
	let t1;
	if ($[0] !== t0) {
		t1 = t0 === void 0 ? {} : t0;
		$[0] = t0;
		$[1] = t1;
	} else t1 = $[1];
	const { id, equalityFn } = t1;
	const editor = useEditorRef(id);
	let t2;
	if ($[2] !== equalityFn) {
		t2 = { equalityFn };
		$[2] = equalityFn;
		$[3] = t2;
	} else t2 = $[3];
	return useEditorPluginOptions(editor, plugin, selector, t2);
}
function useEditorPluginOptions(editor, plugin, selector, { equalityFn } = {}) {
	const store = editor.getOptionsStore(plugin);
	if (!store) return;
	return useStoreSelect$1(store, selector, equalityFn);
}

//#endregion
//#region src/react/stores/element/useElement.ts
/**
* Get the element by plugin key. If no element is found in the context, it will
* return an empty object.
*/
const useElement = (t0) => {
	const $ = c(1);
	const pluginKey = t0 === void 0 ? SCOPE_ELEMENT : t0;
	const editor = useEditorRef();
	const value = useAtomStoreValue(useElementStore(pluginKey), "element");
	if (!value) {
		editor.api.debug.warn(`useElement(${pluginKey}) hook must be used inside the node component's context`, "USE_ELEMENT_CONTEXT");
		let t1;
		if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
			t1 = {};
			$[0] = t1;
		} else t1 = $[0];
		return t1;
	}
	return value;
};

//#endregion
//#region src/react/stores/element/useElementSelector.ts
const useElementSelector = (selector, deps, { key, equalityFn = (a, b) => a === b } = {}) => {
	const selectorAtom = React.useMemo(() => selectAtom(elementStore.atom.entry, (entry, prev) => selector(entry, prev), equalityFn), deps);
	return useStoreAtomValue$1(useElementStore(key), selectorAtom);
};

//#endregion
//#region src/react/stores/event-editor/useEventPlateId.ts
/** Get last event editor id: focus, blur or last. */
const useEventPlateId = (id) => {
	const focus = useEventEditorValue("focus");
	const blur = useEventEditorValue("blur");
	const last = useEventEditorValue("last");
	const providerId = useEditorRef().id;
	if (id) return id;
	if (focus) return focus;
	if (blur) return blur;
	return last ?? providerId ?? PLATE_SCOPE;
};

//#endregion
//#region src/react/components/EditorHotkeysEffect.tsx
function EditorHotkeysEffect(t0) {
	const $ = c(4);
	const { id, editableRef } = t0;
	const editor = useEditorRef(id);
	let t1;
	if ($[0] !== editableRef || $[1] !== editor.meta.shortcuts || $[2] !== id) {
		t1 = /* @__PURE__ */ React.createElement(React.Fragment, null, Object.entries(editor.meta.shortcuts).map((t2) => {
			const [hotkeyString, hotkeyConfig] = t2;
			if (!hotkeyConfig || !isDefined(hotkeyConfig.keys) || !hotkeyConfig.handler) return null;
			return /* @__PURE__ */ React.createElement(HotkeyEffect, {
				id,
				key: hotkeyString,
				editableRef,
				hotkeyConfig
			});
		}));
		$[0] = editableRef;
		$[1] = editor.meta.shortcuts;
		$[2] = id;
		$[3] = t1;
	} else t1 = $[3];
	return t1;
}
function HotkeyEffect(t0) {
	const $ = c(15);
	const { id, editableRef, hotkeyConfig } = t0;
	const editor = useEditorRef(id);
	let handler;
	let keys;
	let options;
	if ($[0] !== hotkeyConfig) {
		({keys, handler, ...options} = hotkeyConfig);
		$[0] = hotkeyConfig;
		$[1] = handler;
		$[2] = keys;
		$[3] = options;
	} else {
		handler = $[1];
		keys = $[2];
		options = $[3];
	}
	let t1;
	if ($[4] !== editor || $[5] !== handler || $[6] !== options) {
		t1 = (event, eventDetails) => {
			if (handler({
				editor,
				event,
				eventDetails
			}) !== false && !isDefined(options.preventDefault)) {
				event.preventDefault();
				event.stopPropagation?.();
			}
		};
		$[4] = editor;
		$[5] = handler;
		$[6] = options;
		$[7] = t1;
	} else t1 = $[7];
	let t2;
	if ($[8] !== options) {
		t2 = {
			enableOnContentEditable: true,
			...options
		};
		$[8] = options;
		$[9] = t2;
	} else t2 = $[9];
	let t3;
	if ($[10] === Symbol.for("react.memo_cache_sentinel")) {
		t3 = [];
		$[10] = t3;
	} else t3 = $[10];
	const setHotkeyRef = useHotkeys(keys, t1, t2, t3);
	let t4;
	let t5;
	if ($[11] !== editableRef || $[12] !== setHotkeyRef) {
		t4 = () => {
			if (editableRef.current) setHotkeyRef(editableRef.current);
		};
		t5 = [setHotkeyRef, editableRef];
		$[11] = editableRef;
		$[12] = setHotkeyRef;
		$[13] = t4;
		$[14] = t5;
	} else {
		t4 = $[13];
		t5 = $[14];
	}
	useEffect(t4, t5);
	return null;
}

//#endregion
//#region src/react/components/EditorMethodsEffect.ts
const EditorMethodsEffect = ({ id }) => {
	const editor = useEditorRef(id);
	const redecorate = useRedecorate(id);
	React.useEffect(() => {
		editor.api.redecorate = redecorate;
	}, [editor, redecorate]);
	return null;
};

//#endregion
//#region src/react/components/EditorRefEffect.tsx
function EditorRefPluginEffect({ id, plugin }) {
	const editor = useEditorRef(id);
	plugin.useHooks?.(getEditorPlugin(editor, plugin));
	return null;
}
function EditorRefEffect({ id }) {
	const store = usePlateStore(id);
	const editor = useAtomStoreValue(store, "editor");
	const setIsMounted = useAtomStoreSet(store, "isMounted");
	React.useEffect(() => {
		setIsMounted(true);
		return () => {
			setIsMounted(false);
		};
	}, [setIsMounted]);
	return /* @__PURE__ */ React.createElement(React.Fragment, null, editor.meta.pluginCache.useHooks.map((key) => /* @__PURE__ */ React.createElement(EditorRefPluginEffect, {
		id,
		key,
		plugin: getPlugin(editor, { key })
	})));
}

//#endregion
//#region src/internal/hooks/usePlateInstancesWarn.ts
function checkPlateInstances() {
	globalThis.__PLATE_INSTANCES__ = (globalThis.__PLATE_INSTANCES__ || 0) + 1;
}
checkPlateInstances();
function usePlateInstancesWarn(disabled) {
	const $ = c(3);
	let t0;
	let t1;
	if ($[0] !== disabled) {
		t0 = () => {
			if (!disabled && globalThis.__PLATE_INSTANCES__ && globalThis.__PLATE_INSTANCES__ > 1) console.warn("Detected multiple @platejs/core instances!");
		};
		t1 = [disabled];
		$[0] = disabled;
		$[1] = t0;
		$[2] = t1;
	} else {
		t0 = $[1];
		t1 = $[2];
	}
	React.useEffect(t0, t1);
}

//#endregion
//#region src/react/components/Plate.tsx
function PlateInner(t0) {
	const $ = c(15);
	const { children, containerRef, decorate, editor, primary, readOnly, renderElement, renderLeaf, scrollRef, onChange, onNodeChange, onSelectionChange, onTextChange, onValueChange } = t0;
	const t1 = readOnly ?? editor?.dom.readOnly;
	let t2;
	if ($[0] !== children || $[1] !== containerRef || $[2] !== decorate || $[3] !== editor || $[4] !== onChange || $[5] !== onNodeChange || $[6] !== onSelectionChange || $[7] !== onTextChange || $[8] !== onValueChange || $[9] !== primary || $[10] !== renderElement || $[11] !== renderLeaf || $[12] !== scrollRef || $[13] !== t1) {
		t2 = /* @__PURE__ */ React.createElement(PlateStoreProvider, {
			readOnly: t1,
			onChange,
			onNodeChange,
			onSelectionChange,
			onTextChange,
			onValueChange,
			containerRef,
			decorate,
			editor,
			primary,
			renderElement,
			renderLeaf,
			scope: editor.id,
			scrollRef
		}, children);
		$[0] = children;
		$[1] = containerRef;
		$[2] = decorate;
		$[3] = editor;
		$[4] = onChange;
		$[5] = onNodeChange;
		$[6] = onSelectionChange;
		$[7] = onTextChange;
		$[8] = onValueChange;
		$[9] = primary;
		$[10] = renderElement;
		$[11] = renderLeaf;
		$[12] = scrollRef;
		$[13] = t1;
		$[14] = t2;
	} else t2 = $[14];
	return t2;
}
function Plate(props) {
	const id = useId();
	const containerRef = React.useRef(null);
	const scrollRef = React.useRef(null);
	usePlateInstancesWarn(props.suppressInstanceWarning);
	if (!props.editor) return null;
	props.editor.meta.uid = `e-${id.replaceAll(":", "")}`;
	return /* @__PURE__ */ React.createElement(PlateInner, {
		key: props.editor.meta.key,
		containerRef,
		scrollRef,
		...props
	});
}

//#endregion
//#region src/react/components/PlateContainer.tsx
const PlateContainer = (t0) => {
	const $ = c(20);
	let children;
	let props;
	if ($[0] !== t0) {
		({children, ...props} = t0);
		$[0] = t0;
		$[1] = children;
		$[2] = props;
	} else {
		children = $[1];
		props = $[2];
	}
	const editor = useEditorRef();
	const readOnly = useEditorReadOnly();
	const containerRef = useEditorContainerRef();
	let afterContainer;
	let beforeContainer;
	let mainContainer;
	if ($[3] !== children || $[4] !== containerRef || $[5] !== editor || $[6] !== props || $[7] !== readOnly) {
		afterContainer = null;
		beforeContainer = null;
		let t1$1;
		if ($[11] !== children || $[12] !== containerRef || $[13] !== editor.meta.uid || $[14] !== props) {
			t1$1 = /* @__PURE__ */ React.createElement("div", {
				id: editor.meta.uid,
				ref: containerRef,
				...props
			}, children);
			$[11] = children;
			$[12] = containerRef;
			$[13] = editor.meta.uid;
			$[14] = props;
			$[15] = t1$1;
		} else t1$1 = $[15];
		mainContainer = t1$1;
		editor.meta.pluginCache.render.beforeContainer.forEach((key) => {
			const plugin = editor.getPlugin({ key });
			if (isEditOnly(readOnly, plugin, "render")) return;
			const BeforeContainer = plugin.render.beforeContainer;
			beforeContainer = /* @__PURE__ */ React.createElement(React.Fragment, null, beforeContainer, /* @__PURE__ */ React.createElement(BeforeContainer, props));
		});
		editor.meta.pluginCache.render.afterContainer.forEach((key_0) => {
			const plugin_0 = editor.getPlugin({ key: key_0 });
			if (isEditOnly(readOnly, plugin_0, "render")) return;
			const AfterContainer = plugin_0.render.afterContainer;
			afterContainer = /* @__PURE__ */ React.createElement(React.Fragment, null, afterContainer, /* @__PURE__ */ React.createElement(AfterContainer, props));
		});
		$[3] = children;
		$[4] = containerRef;
		$[5] = editor;
		$[6] = props;
		$[7] = readOnly;
		$[8] = afterContainer;
		$[9] = beforeContainer;
		$[10] = mainContainer;
	} else {
		afterContainer = $[8];
		beforeContainer = $[9];
		mainContainer = $[10];
	}
	let t1;
	if ($[16] !== afterContainer || $[17] !== beforeContainer || $[18] !== mainContainer) {
		t1 = /* @__PURE__ */ React.createElement(React.Fragment, null, beforeContainer, mainContainer, afterContainer);
		$[16] = afterContainer;
		$[17] = beforeContainer;
		$[18] = mainContainer;
		$[19] = t1;
	} else t1 = $[19];
	return t1;
};
PlateContainer.displayName = "PlateContainer";

//#endregion
//#region src/react/components/PlateControllerEffect.ts
const PlateControllerEffect = (t0) => {
	const $ = c(23);
	const { id: idProp } = t0;
	const idFromStore = useEditorId();
	const id = idProp ?? idFromStore;
	let t1;
	if ($[0] !== id) {
		t1 = focusAtom(plateControllerStore.atom.editorStores, (optic) => optic.prop(id));
		$[0] = id;
		$[1] = t1;
	} else t1 = $[1];
	const currentStoreAtom = t1;
	const t2 = usePlateControllerLocalStore();
	let t3;
	if ($[2] !== currentStoreAtom || $[3] !== t2) {
		t3 = t2.setAtom(currentStoreAtom);
		$[2] = currentStoreAtom;
		$[3] = t2;
		$[4] = t3;
	} else t3 = $[4];
	let t4;
	if ($[5] !== currentStoreAtom) {
		t4 = [currentStoreAtom];
		$[5] = currentStoreAtom;
		$[6] = t4;
	} else t4 = $[6];
	const setCurrentStore = useStableFn(t3, t4);
	const setPrimaryEditorIds = useStableFn(useAtomStoreSet(usePlateControllerLocalStore(), "primaryEditorIds"));
	const setActiveId = useStableFn(useAtomStoreSet(usePlateControllerLocalStore(), "activeId"));
	const store = usePlateStore(id);
	const primary = useAtomStoreValue(store, "primary");
	const focused = useFocused();
	let t5;
	let t6;
	if ($[7] !== id || $[8] !== setActiveId || $[9] !== setCurrentStore || $[10] !== store) {
		t5 = () => {
			setCurrentStore(store ?? null);
			return () => {
				setCurrentStore(null);
				setActiveId((activeId) => activeId === id ? null : activeId);
			};
		};
		t6 = [
			store,
			setCurrentStore,
			setActiveId,
			id
		];
		$[7] = id;
		$[8] = setActiveId;
		$[9] = setCurrentStore;
		$[10] = store;
		$[11] = t5;
		$[12] = t6;
	} else {
		t5 = $[11];
		t6 = $[12];
	}
	React.useEffect(t5, t6);
	let t7;
	let t8;
	if ($[13] !== id || $[14] !== primary || $[15] !== setPrimaryEditorIds) {
		t7 = () => {
			if (primary) {
				setPrimaryEditorIds((ids) => [...ids, id]);
				return () => {
					setPrimaryEditorIds((ids_0) => ids_0.filter((i) => i !== id));
				};
			}
		};
		t8 = [
			id,
			primary,
			setPrimaryEditorIds
		];
		$[13] = id;
		$[14] = primary;
		$[15] = setPrimaryEditorIds;
		$[16] = t7;
		$[17] = t8;
	} else {
		t7 = $[16];
		t8 = $[17];
	}
	React.useEffect(t7, t8);
	let t10;
	let t9;
	if ($[18] !== focused || $[19] !== id || $[20] !== setActiveId) {
		t9 = () => {
			if (id && focused) setActiveId(id);
		};
		t10 = [
			id,
			focused,
			setActiveId
		];
		$[18] = focused;
		$[19] = id;
		$[20] = setActiveId;
		$[21] = t10;
		$[22] = t9;
	} else {
		t10 = $[21];
		t9 = $[22];
	}
	React.useEffect(t9, t10);
	return null;
};

//#endregion
//#region src/react/components/PlateSlate.tsx
/**
* Slate with plugins.
*
* - OnChange prop
* - RenderAboveSlate
*/
function PlateSlate(t0) {
	const $ = c(6);
	const { id, children } = t0;
	let t1;
	if ($[0] !== id) {
		t1 = { id };
		$[0] = id;
		$[1] = t1;
	} else t1 = $[1];
	const slateProps = useSlateProps(t1);
	const editor = useEditorRef(id);
	const t2 = slateProps;
	let aboveSlate;
	if ($[2] !== children || $[3] !== editor || $[4] !== t2) {
		aboveSlate = /* @__PURE__ */ React.createElement(Slate, t2, children);
		editor.meta.pluginCache.render.aboveSlate.forEach((key) => {
			const AboveSlate = editor.getPlugin({ key }).render.aboveSlate;
			aboveSlate = /* @__PURE__ */ React.createElement(AboveSlate, null, aboveSlate);
		});
		$[2] = children;
		$[3] = editor;
		$[4] = t2;
		$[5] = aboveSlate;
	} else aboveSlate = $[5];
	return aboveSlate;
}

//#endregion
//#region src/react/components/PlateContent.tsx
/**
* Editable with plugins.
*
* - Decorate prop
* - DOM handler props
* - ReadOnly prop
* - Render.afterEditable
* - Render.beforeEditable
* - RenderElement prop
* - RenderLeaf prop
* - UseHooks
*/
const PlateContent = React.forwardRef(({ autoFocusOnEditable, readOnly: readOnlyProp, renderEditable, ...props }, ref) => {
	const { id } = props;
	const editor = useEditorRef(id);
	const storeReadOnly = useEditorReadOnly();
	const readOnly = props.disabled ? true : readOnlyProp ?? storeReadOnly;
	editor.dom.readOnly = readOnly;
	if (!editor) throw new Error("Editor not found. Please ensure that PlateContent is rendered below Plate.");
	const editableProps = useEditableProps({
		...props,
		readOnly
	});
	const editableRef = useRef(null);
	const combinedRef = useComposedRef(ref, editableRef);
	if (!editor.children || editor.children.length === 0) return null;
	const editable = /* @__PURE__ */ React.createElement(Editable, {
		ref: combinedRef,
		...editableProps
	});
	let afterEditable = null;
	let beforeEditable = null;
	editor.meta.pluginCache.render.beforeEditable.forEach((key) => {
		const plugin = editor.getPlugin({ key });
		if (isEditOnly(readOnly, plugin, "render")) return;
		const BeforeEditable = plugin.render.beforeEditable;
		beforeEditable = /* @__PURE__ */ React.createElement(React.Fragment, null, beforeEditable, /* @__PURE__ */ React.createElement(BeforeEditable, editableProps));
	});
	editor.meta.pluginCache.render.afterEditable.forEach((key_0) => {
		const plugin_0 = editor.getPlugin({ key: key_0 });
		if (isEditOnly(readOnly, plugin_0, "render")) return;
		const AfterEditable = plugin_0.render.afterEditable;
		afterEditable = /* @__PURE__ */ React.createElement(React.Fragment, null, afterEditable, /* @__PURE__ */ React.createElement(AfterEditable, editableProps));
	});
	let aboveEditable = /* @__PURE__ */ React.createElement(React.Fragment, null, renderEditable ? renderEditable(editable) : editable, /* @__PURE__ */ React.createElement(EditorMethodsEffect, { id }), /* @__PURE__ */ React.createElement(EditorHotkeysEffect, {
		id,
		editableRef
	}), /* @__PURE__ */ React.createElement(EditorRefEffect, { id }), /* @__PURE__ */ React.createElement(PlateControllerEffect, { id }));
	editor.meta.pluginCache.render.aboveEditable.forEach((key_1) => {
		const plugin_1 = editor.getPlugin({ key: key_1 });
		if (isEditOnly(readOnly, plugin_1, "render")) return;
		const AboveEditable = plugin_1.render.aboveEditable;
		aboveEditable = /* @__PURE__ */ React.createElement(AboveEditable, null, aboveEditable);
	});
	return /* @__PURE__ */ React.createElement(PlateSlate, { id }, /* @__PURE__ */ React.createElement(EditorStateEffect, {
		id,
		disabled: props.disabled,
		readOnly: readOnlyProp,
		autoFocusOnEditable,
		editor
	}), beforeEditable, aboveEditable, afterEditable);
});
PlateContent.displayName = "PlateContent";
function EditorStateEffect(t0) {
	const $ = c(25);
	const { id, autoFocusOnEditable, disabled, editor, readOnly } = t0;
	const store = usePlateStore(id);
	let t1;
	if ($[0] !== disabled || $[1] !== readOnly || $[2] !== store) {
		t1 = () => {
			if (disabled) {
				store.setReadOnly(true);
				return;
			}
			if (isDefined(readOnly)) store.setReadOnly(readOnly);
		};
		$[0] = disabled;
		$[1] = readOnly;
		$[2] = store;
		$[3] = t1;
	} else t1 = $[3];
	let t2;
	if ($[4] !== disabled || $[5] !== editor.dom || $[6] !== readOnly || $[7] !== store) {
		t2 = [
			disabled,
			editor.dom,
			readOnly,
			store
		];
		$[4] = disabled;
		$[5] = editor.dom;
		$[6] = readOnly;
		$[7] = store;
		$[8] = t2;
	} else t2 = $[8];
	React.useLayoutEffect(t1, t2);
	const onNodeChange = useAtomStoreValue(store, "onNodeChange");
	let t3;
	let t4;
	if ($[9] !== editor || $[10] !== onNodeChange) {
		t3 = () => {
			if (onNodeChange) editor.setOption(SlateExtensionPlugin, "onNodeChange", onNodeChange);
		};
		t4 = [editor, onNodeChange];
		$[9] = editor;
		$[10] = onNodeChange;
		$[11] = t3;
		$[12] = t4;
	} else {
		t3 = $[11];
		t4 = $[12];
	}
	React.useLayoutEffect(t3, t4);
	const onTextChange = useAtomStoreValue(store, "onTextChange");
	let t5;
	let t6;
	if ($[13] !== editor || $[14] !== onTextChange) {
		t5 = () => {
			if (onTextChange) editor.setOption(SlateExtensionPlugin, "onTextChange", onTextChange);
		};
		t6 = [editor, onTextChange];
		$[13] = editor;
		$[14] = onTextChange;
		$[15] = t5;
		$[16] = t6;
	} else {
		t5 = $[15];
		t6 = $[16];
	}
	React.useLayoutEffect(t5, t6);
	const prevReadOnly = React.useRef(readOnly);
	let t7;
	if ($[17] !== autoFocusOnEditable || $[18] !== editor.tf || $[19] !== readOnly) {
		t7 = () => {
			if (autoFocusOnEditable && prevReadOnly.current && !readOnly) editor.tf.focus({ edge: "endEditor" });
			prevReadOnly.current = readOnly;
		};
		$[17] = autoFocusOnEditable;
		$[18] = editor.tf;
		$[19] = readOnly;
		$[20] = t7;
	} else t7 = $[20];
	let t8;
	if ($[21] !== autoFocusOnEditable || $[22] !== editor || $[23] !== readOnly) {
		t8 = [
			autoFocusOnEditable,
			editor,
			readOnly
		];
		$[21] = autoFocusOnEditable;
		$[22] = editor;
		$[23] = readOnly;
		$[24] = t8;
	} else t8 = $[24];
	React.useEffect(t7, t8);
	return null;
}

//#endregion
//#region src/react/editor/usePlateEditor.ts
/**
* Creates a memoized Plate editor for React components.
*
* This hook creates a fully configured Plate editor instance that is memoized
* based on the provided dependencies. It's optimized for React components to
* prevent unnecessary re-creation of the editor on every render.
*
* Examples:
*
* ```ts
* const editor = usePlateEditor({
*   plugins: [ParagraphPlugin, HeadingPlugin],
*   value: [{ type: 'p', children: [{ text: 'Hello world!' }] }],
* });
*
* // Editor with custom dependencies
* const editor = usePlateEditor(
*   {
*     plugins: [ParagraphPlugin],
*     enabled,
*   },
*   [enabled]
* ); // Re-create when enabled changes
* ```
*
* @param options - Configuration options for creating the Plate editor
* @param deps - Additional dependencies for the useMemo hook (default: [])
* @see {@link createPlateEditor} for detailed information on React editor creation and configuration.
* @see {@link createSlateEditor} for a non-React version of editor creation.
* @see {@link withPlate} for the underlying React-specific enhancement function.
*/
function usePlateEditor(options = {}, deps = []) {
	const [, forceRender] = React.useState({});
	const isMountedRef = React.useRef(false);
	React.useEffect(() => {
		isMountedRef.current = true;
		return () => {
			isMountedRef.current = false;
		};
	}, []);
	return React.useMemo(() => {
		if (options.enabled === false) return null;
		return createPlateEditor({
			...options,
			onReady: (ctx) => {
				if (ctx.isAsync && isMountedRef.current) forceRender({});
				options.onReady?.(ctx);
			}
		});
	}, [
		options.id,
		options.enabled,
		...deps
	]);
}

//#endregion
//#region src/react/editor/usePlateViewEditor.ts
/**
* Creates a memoized static Plate editor for view-only React components.
*
* This hook creates a fully configured static Plate editor instance that is
* memoized based on the provided dependencies. It's optimized for React
* components to prevent unnecessary re-creation of the editor on every render.
* Uses createStaticEditor.
*
* @param options - Configuration options for creating the static Plate editor
* @param deps - Additional dependencies for the useMemo hook (default: [])
* @see {@link createStaticEditor} for detailed information on static editor creation and configuration.
*/
function usePlateViewEditor(options = {}, deps = []) {
	const isMountedRef = React.useRef(false);
	const [, forceRender] = React.useState({});
	React.useEffect(() => {
		isMountedRef.current = true;
		return () => {
			isMountedRef.current = false;
		};
	}, []);
	return React.useMemo(() => {
		if (options.enabled === false) return null;
		return createStaticEditor({
			...options,
			onReady: (ctx) => {
				if (ctx.isAsync && isMountedRef.current) forceRender({});
				options.onReady?.(ctx);
			}
		});
	}, [
		options?.id,
		options?.enabled,
		...deps
	]);
}

//#endregion
//#region src/react/components/PlateTest.tsx
function PlateTest(t0) {
	const $ = c(12);
	let editableProps;
	let editor;
	let props;
	let variant;
	if ($[0] !== t0) {
		const { editableProps: t1$1, shouldNormalizeEditor, variant: t2$1, ...t3 } = t0;
		editableProps = t1$1;
		props = t3;
		variant = t2$1 === void 0 ? "wordProcessor" : t2$1;
		const { id, editor: _editor, plugins } = props;
		editor = _editor;
		if (editor && !editor.meta.pluginList) editor = createPlateEditor({
			id,
			editor,
			plugins,
			shouldNormalizeEditor
		});
		$[0] = t0;
		$[1] = editableProps;
		$[2] = editor;
		$[3] = props;
		$[4] = variant;
	} else {
		editableProps = $[1];
		editor = $[2];
		props = $[3];
		variant = $[4];
	}
	let t1;
	if ($[5] !== editableProps || $[6] !== variant) {
		t1 = /* @__PURE__ */ React.createElement(PlateContent, {
			"data-testid": "slate-content-editable",
			"data-variant": variant,
			autoFocus: true,
			...editableProps
		});
		$[5] = editableProps;
		$[6] = variant;
		$[7] = t1;
	} else t1 = $[7];
	let t2;
	if ($[8] !== editor || $[9] !== props || $[10] !== t1) {
		t2 = /* @__PURE__ */ React.createElement(Plate, {
			...props,
			editor
		}, t1);
		$[8] = editor;
		$[9] = props;
		$[10] = t1;
		$[11] = t2;
	} else t2 = $[11];
	return t2;
}

//#endregion
//#region src/react/components/PlateView.tsx
const PlateView = (props) => {
	const $ = c(5);
	let t0;
	if ($[0] !== props.editor.tf) {
		t0 = (e) => {
			props.editor.tf.setFragmentData(e.clipboardData, "copy");
			if (e.clipboardData.getData("application/x-slate-fragment")) e.preventDefault();
		};
		$[0] = props.editor.tf;
		$[1] = t0;
	} else t0 = $[1];
	const t1 = t0;
	let t2;
	if ($[2] !== props || $[3] !== t1) {
		t2 = /* @__PURE__ */ React.createElement(PlateStatic, {
			onCopy: t1,
			...props
		});
		$[2] = props;
		$[3] = t1;
		$[4] = t2;
	} else t2 = $[4];
	return t2;
};

//#endregion
//#region src/react/components/withHOC.tsx
const withHOC = (HOC, Component, hocProps, hocRef) => React.forwardRef((props, componentRef) => {
	const $ = c(3);
	const t0 = props;
	let t1;
	if ($[0] !== componentRef || $[1] !== t0) {
		t1 = /* @__PURE__ */ React.createElement(HOC, {
			...hocProps,
			ref: hocRef
		}, /* @__PURE__ */ React.createElement(Component, {
			...t0,
			ref: componentRef
		}));
		$[0] = componentRef;
		$[1] = t0;
		$[2] = t1;
	} else t1 = $[2];
	return t1;
});

//#endregion
export { BLUR_EDITOR_EVENT, BelowRootNodes, ContentVisibilityChunk, DOM_HANDLERS, DefaultPlaceholder, Editable, EditorHotkeysEffect, EditorMethodsEffect, EditorRefEffect, EditorRefPluginEffect, ElementProvider, EventEditorPlugin, EventEditorStore, FOCUS_EDITOR_EVENT, GLOBAL_PLATE_SCOPE, PLATE_SCOPE, ParagraphPlugin, Plate, PlateContainer, PlateContent, PlateController, PlateControllerEffect, PlateElement, PlateLeaf, PlateSlate, PlateStoreProvider, PlateTest, PlateText, PlateView, ReactPlugin, SCOPE_ELEMENT, Slate, SlateReactExtensionPlugin, atom, convertDomEventToSyntheticEvent, createAtomStore, createPlateEditor, createPlateFallbackEditor, createPlatePlugin, createPlateStore, createTPlatePlugin, createZustandStore, elementStore, getEditorPlugin, getEventPlateId, getPlateCorePlugins, getPlugin, getRenderNodeProps, isEventHandled, omitPluginContext, pipeHandler, pipeOnChange, pipeRenderElement, pipeRenderLeaf, pipeRenderText, plateControllerStore, plateStore, pluginRenderElement, pluginRenderLeaf, pluginRenderText, toPlatePlugin, toTPlatePlugin, useComposing, useEditableProps, useEditorComposing, useEditorContainerRef, useEditorId, useEditorMounted, useEditorPlugin, useEditorPluginOption, useEditorPluginOptions, useEditorReadOnly, useEditorRef, useEditorScrollRef, useEditorSelection, useEditorSelector, useEditorState, useEditorValue, useEditorVersion, useElement, useElementSelector, useElementStore, useEventEditorValue, useEventPlateId, useFocusEditorEvents, useFocused, useFocusedLast, useIncrementVersion, useNodeAttributes, useNodePath, usePath, usePlateControllerExists, usePlateControllerLocalStore, usePlateControllerStore, usePlateEditor, usePlateLocalStore, usePlateSet, usePlateState, usePlateStore, usePlateValue, usePlateViewEditor, usePluginOption, usePluginOptions, useReadOnly, useRedecorate, useScrollRef, useSelected, useSelectionVersion, useSlateProps, useSlateStatic, useStoreAtomState, useStoreAtomValue, useStoreSelect, useStoreSetAtom, useStoreState, useStoreValue, useTracked, useTrackedStore, useValueVersion, withHOC, withPlate, withPlateReact, withReact };