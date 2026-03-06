import { $ as DebugPlugin, A as pluginDeserializeHtml, At as withNormalizeRules, B as collapseWhiteSpaceText, Bt as getPluginKey, C as deserializeHtmlElement, Ct as isSlatePluginNode, D as pipeDeserializeHtmlLeaf, Dt as applyDeepToNodes, E as htmlElementToLeaf, Et as isSlateVoid, F as collapseWhiteSpace, Ft as HistoryPlugin, G as isHtmlBlockElement, Gt as getEditorPlugin, H as upsertInlineFormattingContext, Ht as getPluginType, I as collapseWhiteSpaceElement, It as withPlateHistory, J as isHtmlText, K as isHtmlInlineElement, Kt as createSlatePlugin, L as inferWhiteSpaceRule, Lt as AstPlugin, M as htmlBrToNewLine, Mt as withDeleteRules, N as htmlBodyToFragment, Nt as withBreakRules, O as htmlElementToElement, Ot as OverridePlugin, P as deserializeHtmlNodeChildren, Pt as BaseParagraphPlugin, Q as withScrolling, R as collapseWhiteSpaceChildren, Rt as getContainerTypes, S as htmlStringToDOMNode, St as isSlatePluginElement, T as htmlTextNodeToString, Tt as isSlateText, U as isLastNonEmptyTextOfInlineFormattingContext, Ut as getPluginTypes, V as endInlineFormattingContext, Vt as getPluginKeys, W as collapseString, Wt as getSlatePlugin, X as AUTO_SCROLL, Y as isHtmlElement, Z as DOMPlugin, _ as withNodeId, _t as getSlateElements, a as pipeInsertDataQuery, at as isNodeAffinity, b as parseHtmlDocument, bt as isSlateLeaf, c as setValue, ct as getEdgeNodes, d as init, dt as getPluginNodeProps, et as PlateError, ft as getNodeDataAttributeKeys, g as normalizeNodeId, gt as defaultsDeepToNodes, h as NodeIdPlugin, ht as getInjectMatch, i as ParserPlugin, it as setAffinitySelection, j as getDataNodeProps, jt as withMergeRules, k as pipeDeserializeHtmlElement, kt as withOverrides, l as resetBlock, lt as mergeDeepToNodes, m as pipeOnNodeChange, mt as getInjectedPlugins, n as withSlate, nt as withChunking, o as normalizeDescendantsToDocumentFragment, ot as isNodesAffinity, p as pipeOnTextChange, pt as keyToDataAttribute, q as inlineTagNames, qt as createTSlatePlugin, r as getCorePlugins, rt as AffinityPlugin, s as SlateExtensionPlugin, st as getMarkBoundaryAffinity, t as createSlateEditor, tt as ChunkingPlugin, u as insertExitBreak, ut as getSlateClass, v as LengthPlugin, vt as isSlateEditor, w as deserializeHtmlNode, wt as isSlateString, x as deserializeHtml, xt as isSlateNode, y as HtmlPlugin, yt as isSlateElement, z as collapseWhiteSpaceNode, zt as getPluginByType } from "./withSlate-1B0SfAWG.js";
import { n as createHotkey, r as isHotkey, t as Hotkeys } from "./hotkeys-DI1HPO2Q.js";
import { nanoid } from "nanoid";
import { createVanillaStore as createZustandStore } from "zustand-x/vanilla";
import castArray from "lodash/castArray.js";
import defaultsDeep from "lodash/defaultsDeep.js";

//#region src/lib/utils/isType.ts
/** Does the node match the type provided. */
const isType = (editor, node, key) => {
	const keys = castArray(key);
	const types = [];
	for (const _key of keys) types.push(editor.getType(_key));
	return types.includes(node?.type);
};

//#endregion
//#region src/lib/plugins/html/constants.ts
const CARRIAGE_RETURN = "\r";
const LINE_FEED = "\n";
const NO_BREAK_SPACE = "\xA0";
const SPACE = " ";
const TAB = "	";
const ZERO_WIDTH_SPACE = "​";

//#endregion
//#region src/lib/plugins/html/utils/traverseHtmlNode.ts
/**
* Depth-first pre-order tree traverse the given HTML node and calls the given
* callback for each node. see:
* https://en.wikipedia.org/wiki/Tree_traversal#Pre-order_(NLR)
*
* @param callback Returns a boolean indicating whether traversal should be
*   continued
*/
const traverseHtmlNode = (node, callback) => {
	if (!callback(node)) return;
	let child = node.firstChild;
	while (child) {
		const currentChild = child;
		const previousChild = child.previousSibling;
		child = child.nextSibling;
		traverseHtmlNode(currentChild, callback);
		if (!currentChild.previousSibling && !currentChild.nextSibling && !currentChild.parentNode && child && previousChild !== child.previousSibling && child.parentNode) child = previousChild ? previousChild.nextSibling : node.firstChild;
		else if (!currentChild.previousSibling && !currentChild.nextSibling && !currentChild.parentNode && child && !child.previousSibling && !child.nextSibling && !child.parentNode) {
			if (previousChild) child = previousChild.nextSibling ? previousChild.nextSibling.nextSibling : null;
			else if (node.firstChild) child = node.firstChild.nextSibling;
		}
	}
};

//#endregion
//#region src/lib/plugins/html/utils/traverseHtmlElements.ts
/**
* Traverse the HTML elements of the given HTML node.
*
* @param rootNode The root HTML node to traverse.
* @param callback The callback to call for each HTML element.
*/
const traverseHtmlElements = (rootNode, callback) => {
	traverseHtmlNode(rootNode, (node) => {
		if (!isHtmlElement(node)) return true;
		return callback(node);
	});
};

//#endregion
//#region src/lib/plugins/html/utils/cleanHtmlBrElements.ts
/** Replace BR elements with line feeds. */
const cleanHtmlBrElements = (rootNode) => {
	traverseHtmlElements(rootNode, (element) => {
		if (element.tagName !== "BR") return true;
		const replacementTextNode = document.createTextNode(LINE_FEED);
		if (element.parentElement) element.parentElement.replaceChild(replacementTextNode, element);
		return false;
	});
};

//#endregion
//#region src/lib/plugins/html/utils/cleanHtmlCrLf.ts
/** Replace \r\n and \r with \n */
const cleanHtmlCrLf = (html) => html.replaceAll(/\r\n|\r/g, "\n");

//#endregion
//#region src/lib/plugins/html/utils/cleanHtmlEmptyElements.ts
const ALLOWED_EMPTY_ELEMENTS = new Set([
	"BR",
	"IMG",
	"TD",
	"TH"
]);
const isEmpty = (element) => !ALLOWED_EMPTY_ELEMENTS.has(element.nodeName) && !element.innerHTML.trim();
const removeIfEmpty = (element) => {
	if (isEmpty(element)) {
		const { parentElement } = element;
		element.remove();
		if (parentElement) removeIfEmpty(parentElement);
	}
};
/** Remove empty elements from rootNode. Allowed empty elements: BR, IMG. */
const cleanHtmlEmptyElements = (rootNode) => {
	traverseHtmlElements(rootNode, (element) => {
		removeIfEmpty(element);
		return true;
	});
};

//#endregion
//#region src/lib/plugins/html/utils/replaceTagName.ts
/**
* Replace `element` tag name by `tagName`. Attributes, innerHTML and parent
* relationship is kept.
*/
const replaceTagName = (element, tagName) => {
	const newElement = document.createElement(tagName);
	newElement.innerHTML = element.innerHTML;
	for (const { name } of element.attributes) {
		const value = element.getAttribute(name);
		if (value) newElement.setAttribute(name, value);
	}
	if (element.parentNode) element.parentNode.replaceChild(newElement, element);
	return newElement;
};

//#endregion
//#region src/lib/plugins/html/utils/cleanHtmlFontElements.ts
/**
* Replace FONT elements with SPAN elements if there is textContent (remove
* otherwise).
*/
const cleanHtmlFontElements = (rootNode) => {
	traverseHtmlElements(rootNode, (element) => {
		if (element.tagName === "FONT") if (element.textContent) replaceTagName(element, "span");
		else element.remove();
		return true;
	});
};

//#endregion
//#region src/lib/plugins/html/utils/isHtmlFragmentHref.ts
/** If href starts with '#'. */
const isHtmlFragmentHref = (href) => href.startsWith("#");

//#endregion
//#region src/lib/plugins/html/utils/unwrapHtmlElement.ts
/** Unwrap the given HTML element. */
const unwrapHtmlElement = (element) => {
	element.outerHTML = element.innerHTML;
};

//#endregion
//#region src/lib/plugins/html/utils/cleanHtmlLinkElements.ts
/** Remove fragment hrefs and spans without inner text. */
const cleanHtmlLinkElements = (rootNode) => {
	traverseHtmlElements(rootNode, (element) => {
		if (element.tagName !== "A") return true;
		const href = element.getAttribute("href");
		if (!href || isHtmlFragmentHref(href)) unwrapHtmlElement(element);
		if (href && element.querySelector("img")) {
			for (const span of element.querySelectorAll("span")) if (!span.textContent) unwrapHtmlElement(span);
		}
		return true;
	});
};

//#endregion
//#region src/lib/plugins/html/utils/traverseHtmlTexts.ts
const traverseHtmlTexts = (rootNode, callback) => {
	traverseHtmlNode(rootNode, (node) => {
		if (!isHtmlText(node)) return true;
		return callback(node);
	});
};

//#endregion
//#region src/lib/plugins/html/utils/cleanHtmlTextNodes.ts
const NEWLINE_WHITESPACE_REGEX = /^\n\s*$/;
const NON_WHITESPACE_REGEX = /\S/;
const LEADING_NEWLINES_REGEX = /^[\n\r]+/;
const cleanHtmlTextNodes = (rootNode) => {
	traverseHtmlTexts(rootNode, (textNode) => {
		if (NEWLINE_WHITESPACE_REGEX.test(textNode.data) && (textNode.previousElementSibling || textNode.nextElementSibling)) {
			textNode.remove();
			return true;
		}
		textNode.data = textNode.data.replaceAll(/\n\s*/g, "\n");
		if (textNode.data.includes(CARRIAGE_RETURN) || textNode.data.includes(LINE_FEED) || textNode.data.includes(NO_BREAK_SPACE)) {
			const hasSpace = textNode.data.includes(SPACE);
			const hasNonWhitespace = NON_WHITESPACE_REGEX.test(textNode.data);
			const hasLineFeed = textNode.data.includes(LINE_FEED);
			if (!(hasSpace || hasNonWhitespace) && !hasLineFeed) {
				if (textNode.data === NO_BREAK_SPACE) {
					textNode.data = SPACE;
					return true;
				}
				textNode.remove();
				return true;
			}
			if (textNode.previousSibling && textNode.previousSibling.nodeName === "BR" && textNode.parentElement) {
				textNode.previousSibling.remove();
				const matches = LEADING_NEWLINES_REGEX.exec(textNode.data);
				const offset = matches ? matches[0].length : 0;
				textNode.data = textNode.data.slice(Math.max(0, offset)).replaceAll(new RegExp(LINE_FEED, "g"), SPACE).replaceAll(new RegExp(CARRIAGE_RETURN, "g"), SPACE);
				textNode.data = `\n${textNode.data}`;
			} else textNode.data = textNode.data.replaceAll(new RegExp(LINE_FEED, "g"), SPACE).replaceAll(new RegExp(CARRIAGE_RETURN, "g"), SPACE);
		}
		return true;
	});
};

//#endregion
//#region src/lib/plugins/html/utils/isHtmlTable.ts
const isHtmlTable = (element) => element.nodeName === "TABLE";

//#endregion
//#region src/lib/plugins/html/utils/copyBlockMarksToSpanChild.ts
/**
* Set HTML blocks mark styles to a new child span element if any. This allows
* Plate to use block marks.
*/
const copyBlockMarksToSpanChild = (rootNode) => {
	traverseHtmlElements(rootNode, (element) => {
		const el = element;
		if (!element.getAttribute("style")) return true;
		if (isHtmlBlockElement(el) && !isHtmlTable(el)) {
			const { style: { backgroundColor, color, fontFamily, fontSize, fontStyle, fontWeight, textDecoration } } = el;
			if (backgroundColor || color || fontFamily || fontSize || fontStyle || fontWeight || textDecoration) {
				const span = document.createElement("span");
				if (!["inherit", "initial"].includes(color)) span.style.color = color;
				span.style.fontFamily = fontFamily;
				span.style.fontSize = fontSize;
				if (![
					"inherit",
					"initial",
					"normal"
				].includes(color)) span.style.fontStyle = fontStyle;
				if (![400, "normal"].includes(fontWeight)) span.style.fontWeight = fontWeight;
				span.style.textDecoration = textDecoration;
				span.innerHTML = el.innerHTML;
				element.innerHTML = span.outerHTML;
			}
		}
		return true;
	});
};

//#endregion
//#region src/lib/plugins/html/utils/findHtmlElement.ts
/**
* Find the first HTML element that matches the given selector.
*
* @param rootNode
* @param predicate
*/
const findHtmlElement = (rootNode, predicate) => {
	let res = null;
	traverseHtmlElements(rootNode, (node) => {
		if (predicate(node)) {
			res = node;
			return false;
		}
		return true;
	});
	return res;
};
const someHtmlElement = (rootNode, predicate) => !!findHtmlElement(rootNode, predicate);

//#endregion
//#region src/lib/plugins/html/utils/getHtmlComments.ts
const acceptNode = () => NodeFilter.FILTER_ACCEPT;
const getHtmlComments = (node) => {
	const comments = [];
	const iterator = document.createNodeIterator(node, NodeFilter.SHOW_COMMENT, { acceptNode });
	let currentNode = iterator.nextNode();
	while (currentNode) {
		if (currentNode.nodeValue) comments.push(currentNode.nodeValue);
		currentNode = iterator.nextNode();
	}
	return comments;
};

//#endregion
//#region src/lib/plugins/html/utils/isHtmlComment.ts
const isHtmlComment = (node) => node.nodeType === Node.COMMENT_NODE;

//#endregion
//#region src/lib/plugins/html/utils/isOlSymbol.ts
const OL_SYMBOL_REGEX = /[\da-np-z]\S/;
const isOlSymbol = (symbol) => OL_SYMBOL_REGEX.test(symbol.toLowerCase());

//#endregion
//#region src/lib/plugins/html/utils/parseHtmlElement.ts
const parseHtmlElement = (html) => {
	const { body } = parseHtmlDocument(html);
	return body.firstElementChild;
};

//#endregion
//#region src/lib/plugins/html/utils/postCleanHtml.ts
/** Trim the html and remove zero width spaces, then wrap it with a body element. */
const postCleanHtml = (html) => {
	return `<body>${html.trim().replaceAll(new RegExp(ZERO_WIDTH_SPACE, "g"), "")}</body>`;
};

//#endregion
//#region src/lib/plugins/html/utils/removeHtmlSurroundings.ts
/** Remove string before <html */
const removeBeforeHtml = (html) => {
	const index = html.indexOf("<html");
	if (index === -1) return html;
	return html.slice(Math.max(0, index));
};
/** Remove string after </html> */
const removeAfterHtml = (html) => {
	const index = html.lastIndexOf("</html>");
	if (index === -1) return html;
	return html.slice(0, Math.max(0, index + 7));
};
/** Remove string before <html and after </html> */
const removeHtmlSurroundings = (html) => removeBeforeHtml(removeAfterHtml(html));

//#endregion
//#region src/lib/plugins/html/utils/preCleanHtml.ts
const cleaners = [removeHtmlSurroundings, cleanHtmlCrLf];
/** Remove HTML surroundings and clean HTML from CR/LF */
const preCleanHtml = (html) => cleaners.reduce((result, clean) => clean(result), html);

//#endregion
//#region src/lib/plugins/html/utils/traverseHtmlComments.ts
/** Traverse HTML comments. */
const traverseHtmlComments = (rootNode, callback) => {
	traverseHtmlNode(rootNode, (node) => {
		if (!isHtmlComment(node)) return true;
		return callback(node);
	});
};

//#endregion
//#region src/lib/plugins/html/utils/removeHtmlNodesBetweenComments.ts
/** Removes HTML nodes between HTML comments. */
const removeHtmlNodesBetweenComments = (rootNode, start, end) => {
	const isClosingComment = (node) => isHtmlComment(node) && node.data === end;
	traverseHtmlComments(rootNode, (comment) => {
		if (comment.data === start) {
			let node = comment.nextSibling;
			comment.remove();
			while (node && !isClosingComment(node)) {
				const { nextSibling } = node;
				node.remove();
				node = nextSibling;
			}
			if (node && isClosingComment(node)) node.remove();
		}
		return true;
	});
};

//#endregion
//#region src/lib/utils/omitPluginContext.ts
const omitPluginContext = (ctx) => {
	const { api, editor, getOption, getOptions, plugin, setOption, setOptions, tf, type, ...rest } = ctx;
	return rest;
};

//#endregion
//#region src/lib/utils/overridePluginsByKey.ts
/**
* Recursive deep merge of each plugin from `override.plugins` into plugin with
* same key (plugin > plugin.plugins).
*/
const overridePluginsByKey = (plugin, overrideByKey = {}, nested = false) => {
	if (overrideByKey[plugin.key]) {
		const { __extensions: pluginOverridesExtensions, plugins: pluginOverridesPlugins, ...pluginOverrides } = overrideByKey[plugin.key];
		plugin = defaultsDeep({}, pluginOverrides, plugin);
		if (pluginOverridesExtensions) plugin.__extensions = [...plugin.__extensions || [], ...pluginOverridesExtensions];
		if (!nested) pluginOverridesPlugins?.forEach((pOverrides) => {
			if (!plugin.plugins) plugin.plugins = [];
			if (!plugin.plugins.find((p) => p.key === pOverrides.key)) plugin.plugins.push(pOverrides);
		});
	}
	if (plugin.plugins) plugin.plugins = plugin.plugins.map((p) => overridePluginsByKey(p, overrideByKey, true));
	return plugin;
};

//#endregion
export { AUTO_SCROLL, AffinityPlugin, AstPlugin, BaseParagraphPlugin, CARRIAGE_RETURN, ChunkingPlugin, DOMPlugin, DebugPlugin, HistoryPlugin, Hotkeys, HtmlPlugin, LINE_FEED, LengthPlugin, NO_BREAK_SPACE, NodeIdPlugin, OverridePlugin, ParserPlugin, PlateError, SPACE, SlateExtensionPlugin, TAB, ZERO_WIDTH_SPACE, applyDeepToNodes, cleanHtmlBrElements, cleanHtmlCrLf, cleanHtmlEmptyElements, cleanHtmlFontElements, cleanHtmlLinkElements, cleanHtmlTextNodes, collapseString, collapseWhiteSpace, collapseWhiteSpaceChildren, collapseWhiteSpaceElement, collapseWhiteSpaceNode, collapseWhiteSpaceText, copyBlockMarksToSpanChild, createHotkey, createSlateEditor, createSlatePlugin, createTSlatePlugin, createZustandStore, defaultsDeepToNodes, deserializeHtml, deserializeHtmlElement, deserializeHtmlNode, deserializeHtmlNodeChildren, endInlineFormattingContext, findHtmlElement, getContainerTypes, getCorePlugins, getDataNodeProps, getEdgeNodes, getEditorPlugin, getHtmlComments, getInjectMatch, getInjectedPlugins, getMarkBoundaryAffinity, getNodeDataAttributeKeys, getPluginByType, getPluginKey, getPluginKeys, getPluginNodeProps, getPluginType, getPluginTypes, getSlateClass, getSlateElements, getSlatePlugin, htmlBodyToFragment, htmlBrToNewLine, htmlElementToElement, htmlElementToLeaf, htmlStringToDOMNode, htmlTextNodeToString, inferWhiteSpaceRule, init, inlineTagNames, insertExitBreak, isHotkey, isHtmlBlockElement, isHtmlComment, isHtmlElement, isHtmlFragmentHref, isHtmlInlineElement, isHtmlTable, isHtmlText, isLastNonEmptyTextOfInlineFormattingContext, isNodeAffinity, isNodesAffinity, isOlSymbol, isSlateEditor, isSlateElement, isSlateLeaf, isSlateNode, isSlatePluginElement, isSlatePluginNode, isSlateString, isSlateText, isSlateVoid, isType, keyToDataAttribute, mergeDeepToNodes, nanoid, normalizeDescendantsToDocumentFragment, normalizeNodeId, omitPluginContext, overridePluginsByKey, parseHtmlDocument, parseHtmlElement, pipeDeserializeHtmlElement, pipeDeserializeHtmlLeaf, pipeInsertDataQuery, pipeOnNodeChange, pipeOnTextChange, pluginDeserializeHtml, postCleanHtml, preCleanHtml, removeHtmlNodesBetweenComments, removeHtmlSurroundings, replaceTagName, resetBlock, setAffinitySelection, setValue, someHtmlElement, traverseHtmlComments, traverseHtmlElements, traverseHtmlNode, traverseHtmlTexts, unwrapHtmlElement, upsertInlineFormattingContext, withBreakRules, withChunking, withDeleteRules, withMergeRules, withNodeId, withNormalizeRules, withOverrides, withPlateHistory, withScrolling, withSlate };