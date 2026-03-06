import { Gt as getEditorPlugin, Z as DOMPlugin, dt as getPluginNodeProps, f as isEditOnly, ht as getInjectMatch, n as withSlate, pt as keyToDataAttribute, ut as getSlateClass, zt as getPluginByType } from "./withSlate-1B0SfAWG.js";
import { ElementApi, NodeApi, RangeApi, TextApi, createEditor, isElementDecorationsEqual, isTextDecorationsEqual } from "@platejs/slate";
import { isDefined } from "@udecode/utils";
import React from "react";
import clsx$1, { clsx } from "clsx";
import { decode } from "html-entities";

//#region src/internal/plugin/pluginInjectNodeProps.ts
/**
* Return if `element`, `text`, `nodeKey` is defined. Return if `node.type` is
* not in `targetPlugins` (if defined). Return if `value = node[nodeKey]` is not
* in `validNodeValues` (if defined). If `classNames[value]` is defined,
* override `className` with it. If `styleKey` is defined, override `style` with
* `[styleKey]: value`.
*/
const pluginInjectNodeProps = (editor, plugin, nodeProps, getElementPath) => {
	const { key, inject: { nodeProps: injectNodeProps } } = plugin;
	const { element, text } = nodeProps;
	const node = element ?? text;
	if (!node) return;
	if (!injectNodeProps) return;
	const { classNames, defaultNodeValue, nodeKey = editor.getType(key), query, styleKey = nodeKey, transformClassName, transformNodeValue, transformProps, transformStyle, validNodeValues } = injectNodeProps;
	if (!getInjectMatch(editor, plugin)(node, getElementPath(node))) return;
	const queryResult = query?.({
		...injectNodeProps,
		...getEditorPlugin(editor, plugin),
		nodeProps
	});
	if (query && !queryResult) return;
	const nodeValue = node[nodeKey];
	if (!transformProps && (!isDefined(nodeValue) || validNodeValues && !validNodeValues.includes(nodeValue) || nodeValue === defaultNodeValue)) return;
	const transformOptions = {
		...nodeProps,
		...getEditorPlugin(editor, plugin),
		nodeValue
	};
	const value = transformNodeValue?.(transformOptions) ?? nodeValue;
	transformOptions.value = value;
	let newProps = {};
	if (element && nodeKey && nodeValue) newProps.className = `slate-${nodeKey}-${nodeValue}`;
	if (classNames?.[nodeValue] || transformClassName) newProps.className = transformClassName?.(transformOptions) ?? classNames?.[value];
	if (styleKey) newProps.style = transformStyle?.(transformOptions) ?? { [styleKey]: value };
	if (transformProps) newProps = transformProps({
		...transformOptions,
		props: newProps
	}) ?? newProps;
	return newProps;
};

//#endregion
//#region src/internal/plugin/pipeInjectNodeProps.tsx
/** Inject plugin props, editor. */
const pipeInjectNodeProps = (editor, nodeProps, getElementPath, readOnly = false) => {
	editor.meta.pluginCache.inject.nodeProps.forEach((key) => {
		const plugin = editor.getPlugin({ key });
		const newAttributes = pluginInjectNodeProps(editor, plugin, nodeProps, getElementPath);
		if (isEditOnly(readOnly, plugin, "inject")) return;
		if (!newAttributes) return;
		const attributes = nodeProps.attributes;
		nodeProps.attributes = {
			...attributes,
			...newAttributes,
			className: clsx$1(attributes?.className, newAttributes.className) || void 0,
			style: {
				...attributes?.style,
				...newAttributes.style
			}
		};
	});
	return nodeProps;
};

//#endregion
//#region src/static/utils/pipeDecorate.ts
/**
* @see {@link Decorate} .
* Optimization: return undefined if empty list so Editable uses a memo.
*/
const pipeDecorate = (editor, decorateProp) => {
	if (editor.meta.pluginCache.decorate.length === 0 && !decorateProp) return;
	return (entry) => {
		let ranges = [];
		const addRanges = (newRanges) => {
			if (newRanges?.length) ranges = [...ranges, ...newRanges];
		};
		editor.meta.pluginCache.decorate.forEach((key) => {
			const plugin = editor.getPlugin({ key });
			addRanges(plugin.decorate({
				...getEditorPlugin(editor, plugin),
				entry
			}));
		});
		if (decorateProp) addRanges(decorateProp({
			editor,
			entry
		}));
		return ranges;
	};
};

//#endregion
//#region src/static/internal/getPlainText.tsx
const getDefaultView = (value) => value?.ownerDocument?.defaultView || null;
/** Check if a DOM node is an element node. */
const isDOMElement = (value) => isDOMNode(value) && value.nodeType === 1;
/** Check if a value is a DOM node. */
const isDOMNode = (value) => {
	const window$1 = getDefaultView(value);
	return !!window$1 && value instanceof window$1.Node;
};
/** Check if a DOM node is an element node. */
const isDOMText = (value) => isDOMNode(value) && value.nodeType === 3;
const getPlainText = (domNode) => {
	let text = "";
	if (isDOMText(domNode) && domNode.nodeValue) return domNode.nodeValue;
	if (isDOMElement(domNode)) {
		for (const childNode of Array.from(domNode.childNodes)) text += getPlainText(childNode);
		const display = getComputedStyle(domNode).getPropertyValue("display");
		if (display === "block" || display === "list" || domNode.tagName === "BR") text += "\n";
	}
	return text;
};

//#endregion
//#region src/static/utils/getSelectedDomFragment.tsx
const getSelectedDomFragment = (editor) => {
	const selection = window.getSelection();
	if (!selection || selection.rangeCount === 0) return [];
	const _domBlocks = selection.getRangeAt(0).cloneContents().querySelectorAll("[data-slate-node=\"element\"][data-slate-id]");
	const domBlocks = Array.from(_domBlocks);
	if (domBlocks.length === 0) return [];
	const nodes = [];
	domBlocks.forEach((node, index) => {
		const blockId = node.dataset.slateId;
		const block = editor.api.node({
			id: blockId,
			at: []
		});
		if (!block || block[1].length !== 1) return;
		/**
		* If the selection don't cover the all first or last block, we need
		* fallback to deserialize the block to get the correct fragment
		*/
		if ((index === 0 || index === domBlocks.length - 1) && node.textContent?.trim() !== NodeApi.string(block[0]) && ElementApi.isElement(block[0]) && !editor.api.isVoid(block[0])) {
			const html = document.createElement("div");
			html.append(node);
			const results = editor.api.html.deserialize({ element: html });
			nodes.push(results[0]);
		} else nodes.push(block[0]);
	});
	return nodes;
};

//#endregion
//#region src/static/utils/getSelectedDomNode.ts
/** Get the DOM node from the DOM selection */
const getSelectedDomNode = () => {
	const selection = window.getSelection();
	if (!selection || selection.rangeCount === 0) return;
	const htmlFragment = selection.getRangeAt(0).cloneContents();
	const div = document.createElement("div");
	div.append(htmlFragment);
	return div;
};

//#endregion
//#region src/static/utils/isSelectOutside.ts
/** Check if the DOM selection is outside the editor */
const isSelectOutside = (html) => {
	const domNodes = html ?? getSelectedDomNode();
	if (!domNodes) return false;
	return !!domNodes?.querySelector("[data-slate-editor=\"true\"]");
};

//#endregion
//#region src/static/plugins/ViewPlugin.ts
const ViewPlugin = DOMPlugin.extendEditorApi(({ editor }) => ({ getFragment() {
	return getSelectedDomFragment(editor);
} })).overrideEditor(({ editor, tf: { setFragmentData } }) => ({ transforms: { setFragmentData(data, originEvent) {
	if (originEvent !== "copy") return setFragmentData(data, originEvent);
	const fragment = getSelectedDomFragment(editor);
	const html = getSelectedDomNode();
	if (!html || !fragment) return;
	if (isSelectOutside(html)) return;
	if (fragment.length > 0) {
		const string = JSON.stringify(fragment);
		const encoded = window.btoa(encodeURIComponent(string));
		data.setData("application/x-slate-fragment", encoded);
		data.setData("text/html", html.innerHTML);
		data.setData("text/plain", getPlainText(html));
	}
} } }));

//#endregion
//#region src/static/plugins/getStaticPlugins.ts
const getStaticPlugins = () => {
	return [...[ViewPlugin]];
};

//#endregion
//#region src/static/editor/withStatic.tsx
const withStatic = (editor, options = {}) => {
	const { plugins = [], ..._rest } = options;
	options.plugins = [...getStaticPlugins(), ...plugins];
	return withSlate(editor, options);
};
const createStaticEditor = ({ editor = createEditor(), ...options } = {}) => withStatic(editor, options);

//#endregion
//#region src/static/components/slate-nodes.tsx
const useNodeAttributes = (props, ref) => ({
	...props.attributes,
	className: clsx(props.attributes.className, props.className) || void 0,
	ref,
	style: {
		...props.attributes.style,
		...props.style
	}
});
const SlateElement = React.forwardRef(function SlateElement$1({ as: Tag = "div", children, ...props }, ref) {
	const attributes = useNodeAttributes(props, ref);
	const block = !!props.element.id && !!props.editor.api.isBlock(props.element);
	return /* @__PURE__ */ React.createElement(Tag, {
		"data-slate-node": "element",
		"data-slate-inline": attributes["data-slate-inline"],
		"data-block-id": block ? props.element.id : void 0,
		...attributes,
		style: {
			position: "relative",
			...attributes?.style
		}
	}, children);
});
const SlateText = React.forwardRef(({ as: Tag = "span", children, ...props }, ref) => {
	const attributes = useNodeAttributes(props, ref);
	return /* @__PURE__ */ React.createElement(Tag, attributes, children);
});
const NonBreakingSpace = () => /* @__PURE__ */ React.createElement("span", {
	style: {
		fontSize: 0,
		lineHeight: 0
	},
	contentEditable: false
}, String.fromCodePoint(160));
const SlateLeaf = React.forwardRef(({ as: Tag = "span", children, inset, ...props }, ref) => {
	const attributes = useNodeAttributes(props, ref);
	if (inset) return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(NonBreakingSpace, null), /* @__PURE__ */ React.createElement(Tag, attributes, children, /* @__PURE__ */ React.createElement(NonBreakingSpace, null)));
	return /* @__PURE__ */ React.createElement(Tag, attributes, children);
});

//#endregion
//#region src/static/utils/createStaticString.ts
function createStaticString({ text }) {
	return React.createElement("span", { "data-slate-string": true }, text === "" ? "﻿" : text);
}

//#endregion
//#region src/static/utils/getNodeDataAttributes.ts
const getNodeDataAttributes = (editor, node, { isElement, isLeaf, isText }) => {
	return Object.keys(node).reduce((acc, key) => {
		if (typeof node[key] === "object") return acc;
		if (isElement && key === "children") return acc;
		if ((isLeaf || isText) && key === "text") return acc;
		const plugin = editor.getPlugin({ key });
		if (isLeaf && plugin?.node.isLeaf && plugin?.node.isDecoration !== true) return acc;
		if (isText && plugin?.node.isLeaf && plugin?.node.isDecoration !== false) return acc;
		const attributeName = keyToDataAttribute(key);
		acc[attributeName] = node[key];
		return acc;
	}, {});
};
const getPluginDataAttributes = (editor, plugin, node) => {
	const isElement = plugin.node.isElement;
	const dataAttributes = getNodeDataAttributes(editor, node, {
		isElement,
		isLeaf: plugin.node.isLeaf && plugin.node.isDecoration === true,
		isText: plugin.node.isLeaf && plugin.node.isDecoration === false
	});
	const customAttributes = plugin.node.toDataAttributes?.({
		...plugin ? getEditorPlugin(editor, plugin) : {},
		node
	}) ?? {};
	return {
		...dataAttributes,
		...customAttributes
	};
};

//#endregion
//#region src/static/utils/getRenderNodeStaticProps.ts
const getRenderNodeStaticProps = ({ attributes: nodeAttributes, editor, node, plugin, props }) => {
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
		node,
		plugin,
		props: newProps
	});
	newProps = {
		...pluginProps,
		attributes: {
			...pluginProps.attributes,
			className: clsx$1(getSlateClass(plugin?.node.type), className) || void 0
		}
	};
	newProps = pipeInjectNodeProps(editor, newProps, (node$1) => editor.api.findPath(node$1));
	if (newProps.style && Object.keys(newProps.style).length === 0) newProps.style = void 0;
	return newProps;
};

//#endregion
//#region src/static/utils/getSelectedDomBlocks.ts
/** Get the slate nodes from the DOM selection */
/** @deprecated Use getSelectedDomFragment instead */
const getSelectedDomBlocks = () => {
	const selection = window.getSelection();
	if (!selection || selection.rangeCount === 0) return;
	const domBlocks = selection.getRangeAt(0).cloneContents().querySelectorAll("[data-slate-node=\"element\"][data-slate-id]");
	return Array.from(domBlocks);
};

//#endregion
//#region src/static/utils/stripHtmlClassNames.ts
const classAttrRegExp = / class="([^"]*)"/g;
const whitespaceRegExp = /\s+/;
/**
* Remove all class names that do not start with one of preserveClassNames
* (`slate-` by default)
*/
const stripHtmlClassNames = (html, { preserveClassNames = ["slate-"] }) => {
	if (preserveClassNames.length === 0) return html.replaceAll(classAttrRegExp, "");
	const preserveRegExp = new RegExp(preserveClassNames.map((cn) => `^${cn}`).join("|"));
	return html.replaceAll(classAttrRegExp, (_match, className) => {
		const classesToKeep = className.split(whitespaceRegExp).filter((cn) => preserveRegExp.test(cn));
		return classesToKeep.length === 0 ? "" : ` class="${classesToKeep.join(" ")}"`;
	});
};

//#endregion
//#region src/static/utils/stripSlateDataAttributes.ts
const stripSlateDataAttributes = (rawHtml) => rawHtml.replaceAll(/ data-slate(?:-node|-type|-leaf|-string)="[^"]+"/g, "").replaceAll(/ data-testid="[^"]+"/g, "");

//#endregion
//#region src/static/pluginRenderElementStatic.tsx
const pluginRenderElementStatic = (editor, plugin) => function render(nodeProps) {
	const element = nodeProps.element;
	const Component = editor.meta.components?.[plugin.key];
	const Element = Component ?? SlateElement;
	let { children } = nodeProps;
	const dataAttributes = getPluginDataAttributes(editor, plugin, element);
	nodeProps = getRenderNodeStaticProps({
		attributes: {
			...element.attributes,
			...dataAttributes
		},
		editor,
		node: element,
		plugin,
		props: nodeProps
	});
	editor.meta.pluginCache.render.belowNodes.forEach((key) => {
		const hoc = editor.getPlugin({ key }).render.belowNodes({
			...nodeProps,
			key
		});
		if (hoc) children = hoc({
			...nodeProps,
			children
		});
	});
	const defaultProps = Component ? {} : { as: plugin.render?.as };
	let component = /* @__PURE__ */ React.createElement(Element, {
		...defaultProps,
		...nodeProps
	}, children, editor.meta.pluginCache.render.belowRootNodes.map((key) => {
		const Component$1 = editor.getPlugin({ key }).render.belowRootNodes;
		return /* @__PURE__ */ React.createElement(Component$1, {
			key,
			...defaultProps,
			...nodeProps
		});
	}));
	editor.meta.pluginCache.render.aboveNodes.forEach((key) => {
		const hoc = editor.getPlugin({ key }).render.aboveNodes({
			...nodeProps,
			key
		});
		if (hoc) component = hoc({
			...nodeProps,
			children: component
		});
	});
	return component;
};

//#endregion
//#region src/static/pipeRenderElementStatic.tsx
const pipeRenderElementStatic = (editor, { renderElement: renderElementProp } = {}) => function render(props) {
	const plugin = getPluginByType(editor, props.element.type);
	if (plugin?.node.isElement) return pluginRenderElementStatic(editor, plugin)(props);
	if (renderElementProp) return renderElementProp(props);
	const ctxProps = getRenderNodeStaticProps({
		editor,
		props: { ...props }
	});
	return /* @__PURE__ */ React.createElement(SlateElement, ctxProps, props.children, editor.meta.pluginCache.render.belowRootNodes.map((key) => {
		const Component = editor.getPlugin({ key }).render.belowRootNodes;
		return /* @__PURE__ */ React.createElement(Component, {
			key,
			...ctxProps
		});
	}));
};

//#endregion
//#region src/static/pluginRenderTextStatic.tsx
const pluginRenderTextStatic = (editor, plugin) => function render(nodeProps) {
	const { children, text } = nodeProps;
	if (text[plugin.node.type ?? plugin.key]) {
		const Component = editor.meta.components?.[plugin.key];
		const Text = Component ?? SlateText;
		const ctxProps = getRenderNodeStaticProps({
			attributes: { ...text.attributes },
			editor,
			node: text,
			plugin,
			props: nodeProps
		});
		const defaultProps = Component ? {} : { as: plugin.render?.as };
		return /* @__PURE__ */ React.createElement(Text, {
			...defaultProps,
			...ctxProps
		}, children);
	}
	return children;
};
/** @see {@link RenderText} */
const pipeRenderTextStatic = (editor, { renderText: renderTextProp } = {}) => {
	const renderTexts = [];
	const textPropsPlugins = [];
	editor.meta.pluginCache.node.isText.forEach((key) => {
		const plugin = editor.getPlugin({ key });
		if (plugin) renderTexts.push(pluginRenderTextStatic(editor, plugin));
	});
	editor.meta.pluginCache.node.textProps.forEach((key) => {
		const plugin = editor.getPlugin({ key });
		if (plugin) textPropsPlugins.push(plugin);
	});
	return function render({ attributes, ...props }) {
		renderTexts.forEach((render$1) => {
			const newChildren = render$1(props);
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
		const ctxProps = getRenderNodeStaticProps({
			editor,
			props: {
				attributes,
				...props
			}
		});
		const text = ctxProps.text;
		const dataAttributes = getNodeDataAttributes(editor, text, { isText: true });
		return /* @__PURE__ */ React.createElement(SlateText, {
			...ctxProps,
			attributes: {
				...ctxProps.attributes,
				...dataAttributes
			}
		});
	};
};

//#endregion
//#region src/static/components/PlateStatic.tsx
function BaseElementStatic({ decorate, decorations, editor, element = {
	children: [],
	type: ""
} }) {
	const renderElement = pipeRenderElementStatic(editor);
	const attributes = {
		"data-slate-node": "element",
		ref: null
	};
	let children = /* @__PURE__ */ React.createElement(Children, {
		decorate,
		decorations,
		editor
	}, element.children);
	if (editor.api.isVoid(element)) {
		attributes["data-slate-void"] = true;
		children = /* @__PURE__ */ React.createElement("span", {
			style: {
				color: "transparent",
				height: "0",
				outline: "none",
				position: "absolute"
			},
			"data-slate-spacer": true
		}, /* @__PURE__ */ React.createElement(Children, {
			decorate,
			decorations,
			editor
		}, element.children));
	}
	if (editor.api.isInline(element)) attributes["data-slate-inline"] = true;
	return /* @__PURE__ */ React.createElement(React.Fragment, null, renderElement?.({
		attributes,
		children,
		element
	}));
}
const ElementStatic = React.memo(BaseElementStatic, (prev, next) => (prev.element === next.element || prev.element._memo !== void 0 && prev.element._memo === next.element._memo) && isElementDecorationsEqual(prev.decorations, next.decorations));
function BaseLeafStatic({ decorations, editor, text = { text: "" } }) {
	const renderLeaf = pipeRenderLeafStatic(editor);
	const renderText = pipeRenderTextStatic(editor);
	const leafElements = TextApi.decorations(text, decorations).map(({ leaf, position }, index) => {
		const leafElement = renderLeaf({
			attributes: { "data-slate-leaf": true },
			children: /* @__PURE__ */ React.createElement("span", { "data-slate-string": true }, leaf.text === "" ? "﻿" : leaf.text),
			leaf,
			leafPosition: position,
			text: leaf
		});
		return /* @__PURE__ */ React.createElement(React.Fragment, { key: index }, leafElement);
	});
	return renderText({
		attributes: {
			"data-slate-node": "text",
			ref: null
		},
		children: leafElements,
		text
	});
}
const LeafStatic = React.memo(BaseLeafStatic, (prev, next) => {
	return TextApi.equals(next.text, prev.text) && isTextDecorationsEqual(next.decorations, prev.decorations);
});
const defaultDecorate = () => [];
function Children({ children = [], decorate = defaultDecorate, decorations = [], editor }) {
	return /* @__PURE__ */ React.createElement(React.Fragment, null, children.map((child, i) => {
		const p = editor.api.findPath(child);
		let ds = [];
		if (p) {
			const range = editor.api.range(p);
			ds = decorate([child, p]);
			for (const dec of decorations) {
				const d = RangeApi.intersection(dec, range);
				if (d) ds.push(d);
			}
		}
		return ElementApi.isElement(child) ? /* @__PURE__ */ React.createElement(ElementStatic, {
			key: i,
			decorate,
			decorations: ds,
			editor,
			element: child
		}) : /* @__PURE__ */ React.createElement(LeafStatic, {
			key: i,
			decorations: ds,
			editor,
			text: child
		});
	}));
}
function PlateStatic(props) {
	const { className, editor, value, ...rest } = props;
	if (value) editor.children = value;
	const decorate = pipeDecorate(editor);
	let afterEditable = null;
	let beforeEditable = null;
	editor.meta.pluginCache.render.beforeEditable.forEach((key) => {
		const BeforeEditable = editor.getPlugin({ key }).render.beforeEditable;
		if (BeforeEditable) beforeEditable = /* @__PURE__ */ React.createElement(React.Fragment, null, beforeEditable, /* @__PURE__ */ React.createElement(BeforeEditable, null));
	});
	editor.meta.pluginCache.render.afterEditable.forEach((key) => {
		const AfterEditable = editor.getPlugin({ key }).render.afterEditable;
		if (AfterEditable) afterEditable = /* @__PURE__ */ React.createElement(React.Fragment, null, afterEditable, /* @__PURE__ */ React.createElement(AfterEditable, null));
	});
	const content = /* @__PURE__ */ React.createElement("div", {
		className: clsx$1("slate-editor", className),
		"data-slate-editor": true,
		"data-slate-node": "value",
		...rest
	}, /* @__PURE__ */ React.createElement(Children, {
		decorate,
		decorations: [],
		editor
	}, editor.children));
	let aboveEditable = /* @__PURE__ */ React.createElement(React.Fragment, null, beforeEditable, content, afterEditable);
	editor.meta.pluginCache.render.aboveEditable.forEach((key) => {
		const AboveEditable = editor.getPlugin({ key }).render.aboveEditable;
		if (AboveEditable) aboveEditable = /* @__PURE__ */ React.createElement(AboveEditable, null, aboveEditable);
	});
	return aboveEditable;
}

//#endregion
//#region src/static/pluginRenderLeafStatic.tsx
const pluginRenderLeafStatic = (editor, plugin) => function render(props) {
	const { children, leaf } = props;
	if (leaf[plugin.node.type]) {
		const Component = plugin.render.leaf ?? editor.meta.components?.[plugin.key];
		const Leaf = Component ?? SlateLeaf;
		const ctxProps = getRenderNodeStaticProps({
			attributes: { ...leaf.attributes },
			editor,
			node: leaf,
			plugin,
			props
		});
		const defaultProps = Component ? {} : { as: plugin.render?.as };
		return /* @__PURE__ */ React.createElement(Leaf, {
			...defaultProps,
			...ctxProps
		}, children);
	}
	return children;
};
/** @see {@link RenderLeaf} */
const pipeRenderLeafStatic = (editor, { renderLeaf: renderLeafProp } = {}) => {
	const renderLeafs = [];
	const leafPropsPlugins = [];
	editor.meta.pluginCache.node.isLeaf.forEach((key) => {
		const plugin = editor.getPlugin({ key });
		if (plugin) renderLeafs.push(pluginRenderLeafStatic(editor, plugin));
	});
	editor.meta.pluginCache.node.leafProps.forEach((key) => {
		const plugin = editor.getPlugin({ key });
		if (plugin) leafPropsPlugins.push(plugin);
	});
	return function render({ attributes, ...props }) {
		renderLeafs.forEach((render$1) => {
			const newChildren = render$1(props);
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
		const ctxProps = getRenderNodeStaticProps({
			editor,
			props: {
				attributes,
				...props
			}
		});
		const leaf = ctxProps.leaf;
		const dataAttributes = getNodeDataAttributes(editor, leaf, { isLeaf: true });
		return /* @__PURE__ */ React.createElement(SlateLeaf, {
			...ctxProps,
			attributes: {
				...ctxProps.attributes,
				...dataAttributes
			}
		});
	};
};

//#endregion
//#region src/static/serializeHtml.tsx
const getReactDOMServer = async () => {
	return (await import("react-dom/server")).default;
};
const renderComponentToHtml = (ReactDOMServer, Component, props) => decode(ReactDOMServer.renderToStaticMarkup(React.createElement(Component, props)));
/**
* Serialize the editor content to HTML. By default, uses `PlateStatic` as the
* editor component, but you can provide a custom component (e.g.
* `EditorStatic`).
*/
const serializeHtml = async (editor, { editorComponent: EditorComponent = PlateStatic, preserveClassNames, props = {}, stripClassNames = false, stripDataAttributes = false } = {}) => {
	let htmlString = renderComponentToHtml(await getReactDOMServer(), EditorComponent, {
		editor,
		...props
	});
	if (stripClassNames) htmlString = stripHtmlClassNames(htmlString, { preserveClassNames });
	if (stripDataAttributes) htmlString = stripSlateDataAttributes(htmlString);
	return htmlString;
};

//#endregion
//#region src/static/deserialize/htmlStringToEditorDOM.ts
/**
* Convert HTML string exported from Plate into HTML element.
*
* @param html - The HTML string to convert exported from Plate.
* @returns The Editor element without head and body.
*/
const getEditorDOMFromHtmlString = (html) => {
	const node = document.createElement("body");
	node.innerHTML = html;
	return node.querySelector("[data-slate-editor=\"true\"]");
};

//#endregion
export { pipeInjectNodeProps as A, createStaticEditor as C, getSelectedDomNode as D, isSelectOutside as E, getSelectedDomFragment as O, useNodeAttributes as S, ViewPlugin as T, getPluginDataAttributes as _, ElementStatic as a, SlateLeaf as b, pipeRenderTextStatic as c, pluginRenderElementStatic as d, stripSlateDataAttributes as f, getNodeDataAttributes as g, getRenderNodeStaticProps as h, pluginRenderLeafStatic as i, pipeDecorate as k, pluginRenderTextStatic as l, getSelectedDomBlocks as m, serializeHtml as n, LeafStatic as o, stripHtmlClassNames as p, pipeRenderLeafStatic as r, PlateStatic as s, getEditorDOMFromHtmlString as t, pipeRenderElementStatic as u, createStaticString as v, getStaticPlugins as w, SlateText as x, SlateElement as y };