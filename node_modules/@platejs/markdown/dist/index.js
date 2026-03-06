import { ElementApi, KEYS, TextApi, bindFirst, createTSlatePlugin, getPluginKey, getPluginType, isUrl } from "platejs";
import "mdast-util-mdx";
import remarkStringify from "remark-stringify";
import { unified } from "unified";
import remarkParse from "remark-parse";
import { marked } from "marked";
import baseRemarkMdx from "remark-mdx";

//#region rolldown:runtime
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function() {
	return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
	if (from && typeof from === "object" || typeof from === "function") {
		for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
			key = keys[i];
			if (!__hasOwnProp.call(to, key) && key !== except) {
				__defProp(to, key, {
					get: ((k) => from[k]).bind(null, key),
					enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
				});
			}
		}
	}
	return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", {
	value: mod,
	enumerable: true
}) : target, mod));

//#endregion
//#region src/lib/types.ts
const PLATE_TO_MDAST = {
	a: "link",
	blockquote: "blockquote",
	bold: "strong",
	callout: "callout",
	code: "inlineCode",
	code_block: "code",
	code_line: "code_line",
	column: "column",
	column_group: "column_group",
	comment: "comment",
	date: "date",
	equation: "math",
	heading: "heading",
	hr: "thematicBreak",
	img: "image",
	inline_equation: "inlineMath",
	italic: "emphasis",
	li: "listItem",
	list: "list",
	mention: "mention",
	p: "paragraph",
	strikethrough: "delete",
	subscript: "sub",
	suggestion: "suggestion",
	superscript: "sup",
	table: "table",
	td: "tableCell",
	text: "text",
	th: "tableCell",
	toc: "toc",
	toggle: "toggle",
	tr: "tableRow",
	underline: "u"
};
const MDAST_TO_PLATE = {
	backgroundColor: "backgroundColor",
	blockquote: "blockquote",
	break: "break",
	code: "code_block",
	color: "color",
	definition: "definition",
	del: "strikethrough",
	delete: "strikethrough",
	emphasis: "italic",
	fontFamily: "fontFamily",
	fontSize: "fontSize",
	fontWeight: "fontWeight",
	footnoteDefinition: "footnoteDefinition",
	footnoteReference: "footnoteReference",
	heading: "heading",
	html: "html",
	image: "img",
	imageReference: "imageReference",
	inlineCode: "code",
	inlineMath: "inline_equation",
	link: "a",
	linkReference: "linkReference",
	list: "list",
	listItem: "li",
	mark: "highlight",
	math: "equation",
	mdxFlowExpression: "mdxFlowExpression",
	mdxjsEsm: "mdxjsEsm",
	mdxJsxFlowElement: "mdxJsxFlowElement",
	mdxJsxTextElement: "mdxJsxTextElement",
	mdxTextExpression: "mdxTextExpression",
	paragraph: "p",
	strong: "bold",
	sub: "subscript",
	sup: "superscript",
	table: "table",
	tableCell: "td",
	tableRow: "tr",
	text: "text",
	thematicBreak: "hr",
	u: "underline",
	yaml: "yaml"
};
/**
* Get plate node type from mdast node type if the mdast is mdast only return
* the mdast type itself.
*/
const mdastToPlate = (editor, mdastType) => {
	const plateKey = MDAST_TO_PLATE[mdastType];
	return getPluginKey(editor, plateKey) ?? plateKey ?? mdastType;
};
/**
* Get mdast node type from plate element type if the plateType is plate only
* return the plateType itself.
*/
const plateToMdast = (plateType) => PLATE_TO_MDAST[plateType] ?? plateType;

//#endregion
//#region src/lib/serializer/utils/getCustomMark.ts
const getCustomMark = (options) => {
	if (!options?.rules) return [];
	return Object.entries(options.rules).filter(([_, parser]) => parser?.mark).map(([key]) => key);
};

//#endregion
//#region src/lib/rules/utils/parseAttributes.ts
function parseAttributes(attributes) {
	const props = {};
	if (attributes && attributes.length > 0) attributes.forEach((attr) => {
		if (attr.name && attr.value !== void 0) {
			let value = attr.value;
			try {
				value = JSON.parse(attr.value);
			} catch (_error) {
				value = attr.value;
			}
			props[attr.name] = value;
		}
	});
	return props;
}
function propsToAttributes(props) {
	return Object.entries(props).map(([name, value]) => ({
		name,
		type: "mdxJsxAttribute",
		value: typeof value === "string" ? value : JSON.stringify(value)
	}));
}

//#endregion
//#region src/lib/rules/columnRules.ts
const columnRules = {
	column: {
		deserialize: (mdastNode, deco, options) => {
			const props = parseAttributes(mdastNode.attributes);
			return {
				children: convertChildrenDeserialize(mdastNode.children, { ...deco }, options),
				type: getPluginType(options.editor, KEYS.column),
				...props
			};
		},
		serialize: (node, options) => {
			const { id, children, type, ...rest } = node;
			return {
				attributes: propsToAttributes(rest),
				children: convertNodesSerialize(children, options),
				name: type,
				type: "mdxJsxFlowElement"
			};
		}
	},
	column_group: {
		deserialize: (mdastNode, deco, options) => {
			const props = parseAttributes(mdastNode.attributes);
			return {
				children: convertChildrenDeserialize(mdastNode.children, { ...deco }, options),
				type: getPluginType(options.editor, KEYS.columnGroup),
				...props
			};
		},
		serialize: (node, options) => {
			const { id, children, type, ...rest } = node;
			return {
				attributes: propsToAttributes(rest),
				children: convertNodesSerialize(children, options),
				name: type,
				type: "mdxJsxFlowElement"
			};
		}
	}
};

//#endregion
//#region ../../node_modules/lodash/_arrayReduce.js
var require__arrayReduce = /* @__PURE__ */ __commonJS({ "../../node_modules/lodash/_arrayReduce.js": ((exports, module) => {
	/**
	* A specialized version of `_.reduce` for arrays without support for
	* iteratee shorthands.
	*
	* @private
	* @param {Array} [array] The array to iterate over.
	* @param {Function} iteratee The function invoked per iteration.
	* @param {*} [accumulator] The initial value.
	* @param {boolean} [initAccum] Specify using the first element of `array` as
	*  the initial value.
	* @returns {*} Returns the accumulated value.
	*/
	function arrayReduce$1(array, iteratee, accumulator, initAccum) {
		var index = -1, length = array == null ? 0 : array.length;
		if (initAccum && length) accumulator = array[++index];
		while (++index < length) accumulator = iteratee(accumulator, array[index], index, array);
		return accumulator;
	}
	module.exports = arrayReduce$1;
}) });

//#endregion
//#region ../../node_modules/lodash/_basePropertyOf.js
var require__basePropertyOf = /* @__PURE__ */ __commonJS({ "../../node_modules/lodash/_basePropertyOf.js": ((exports, module) => {
	/**
	* The base implementation of `_.propertyOf` without support for deep paths.
	*
	* @private
	* @param {Object} object The object to query.
	* @returns {Function} Returns the new accessor function.
	*/
	function basePropertyOf(object) {
		return function(key) {
			return object == null ? void 0 : object[key];
		};
	}
	module.exports = basePropertyOf;
}) });

//#endregion
//#region ../../node_modules/lodash/_deburrLetter.js
var require__deburrLetter = /* @__PURE__ */ __commonJS({ "../../node_modules/lodash/_deburrLetter.js": ((exports, module) => {
	/**
	* Used by `_.deburr` to convert Latin-1 Supplement and Latin Extended-A
	* letters to basic Latin letters.
	*
	* @private
	* @param {string} letter The matched letter to deburr.
	* @returns {string} Returns the deburred letter.
	*/
	var deburrLetter$1 = require__basePropertyOf()({
		"À": "A",
		"Á": "A",
		"Â": "A",
		"Ã": "A",
		"Ä": "A",
		"Å": "A",
		"à": "a",
		"á": "a",
		"â": "a",
		"ã": "a",
		"ä": "a",
		"å": "a",
		"Ç": "C",
		"ç": "c",
		"Ð": "D",
		"ð": "d",
		"È": "E",
		"É": "E",
		"Ê": "E",
		"Ë": "E",
		"è": "e",
		"é": "e",
		"ê": "e",
		"ë": "e",
		"Ì": "I",
		"Í": "I",
		"Î": "I",
		"Ï": "I",
		"ì": "i",
		"í": "i",
		"î": "i",
		"ï": "i",
		"Ñ": "N",
		"ñ": "n",
		"Ò": "O",
		"Ó": "O",
		"Ô": "O",
		"Õ": "O",
		"Ö": "O",
		"Ø": "O",
		"ò": "o",
		"ó": "o",
		"ô": "o",
		"õ": "o",
		"ö": "o",
		"ø": "o",
		"Ù": "U",
		"Ú": "U",
		"Û": "U",
		"Ü": "U",
		"ù": "u",
		"ú": "u",
		"û": "u",
		"ü": "u",
		"Ý": "Y",
		"ý": "y",
		"ÿ": "y",
		"Æ": "Ae",
		"æ": "ae",
		"Þ": "Th",
		"þ": "th",
		"ß": "ss",
		"Ā": "A",
		"Ă": "A",
		"Ą": "A",
		"ā": "a",
		"ă": "a",
		"ą": "a",
		"Ć": "C",
		"Ĉ": "C",
		"Ċ": "C",
		"Č": "C",
		"ć": "c",
		"ĉ": "c",
		"ċ": "c",
		"č": "c",
		"Ď": "D",
		"Đ": "D",
		"ď": "d",
		"đ": "d",
		"Ē": "E",
		"Ĕ": "E",
		"Ė": "E",
		"Ę": "E",
		"Ě": "E",
		"ē": "e",
		"ĕ": "e",
		"ė": "e",
		"ę": "e",
		"ě": "e",
		"Ĝ": "G",
		"Ğ": "G",
		"Ġ": "G",
		"Ģ": "G",
		"ĝ": "g",
		"ğ": "g",
		"ġ": "g",
		"ģ": "g",
		"Ĥ": "H",
		"Ħ": "H",
		"ĥ": "h",
		"ħ": "h",
		"Ĩ": "I",
		"Ī": "I",
		"Ĭ": "I",
		"Į": "I",
		"İ": "I",
		"ĩ": "i",
		"ī": "i",
		"ĭ": "i",
		"į": "i",
		"ı": "i",
		"Ĵ": "J",
		"ĵ": "j",
		"Ķ": "K",
		"ķ": "k",
		"ĸ": "k",
		"Ĺ": "L",
		"Ļ": "L",
		"Ľ": "L",
		"Ŀ": "L",
		"Ł": "L",
		"ĺ": "l",
		"ļ": "l",
		"ľ": "l",
		"ŀ": "l",
		"ł": "l",
		"Ń": "N",
		"Ņ": "N",
		"Ň": "N",
		"Ŋ": "N",
		"ń": "n",
		"ņ": "n",
		"ň": "n",
		"ŋ": "n",
		"Ō": "O",
		"Ŏ": "O",
		"Ő": "O",
		"ō": "o",
		"ŏ": "o",
		"ő": "o",
		"Ŕ": "R",
		"Ŗ": "R",
		"Ř": "R",
		"ŕ": "r",
		"ŗ": "r",
		"ř": "r",
		"Ś": "S",
		"Ŝ": "S",
		"Ş": "S",
		"Š": "S",
		"ś": "s",
		"ŝ": "s",
		"ş": "s",
		"š": "s",
		"Ţ": "T",
		"Ť": "T",
		"Ŧ": "T",
		"ţ": "t",
		"ť": "t",
		"ŧ": "t",
		"Ũ": "U",
		"Ū": "U",
		"Ŭ": "U",
		"Ů": "U",
		"Ű": "U",
		"Ų": "U",
		"ũ": "u",
		"ū": "u",
		"ŭ": "u",
		"ů": "u",
		"ű": "u",
		"ų": "u",
		"Ŵ": "W",
		"ŵ": "w",
		"Ŷ": "Y",
		"ŷ": "y",
		"Ÿ": "Y",
		"Ź": "Z",
		"Ż": "Z",
		"Ž": "Z",
		"ź": "z",
		"ż": "z",
		"ž": "z",
		"Ĳ": "IJ",
		"ĳ": "ij",
		"Œ": "Oe",
		"œ": "oe",
		"ŉ": "'n",
		"ſ": "s"
	});
	module.exports = deburrLetter$1;
}) });

//#endregion
//#region ../../node_modules/lodash/_freeGlobal.js
var require__freeGlobal = /* @__PURE__ */ __commonJS({ "../../node_modules/lodash/_freeGlobal.js": ((exports, module) => {
	/** Detect free variable `global` from Node.js. */
	var freeGlobal$1 = typeof global == "object" && global && global.Object === Object && global;
	module.exports = freeGlobal$1;
}) });

//#endregion
//#region ../../node_modules/lodash/_root.js
var require__root = /* @__PURE__ */ __commonJS({ "../../node_modules/lodash/_root.js": ((exports, module) => {
	var freeGlobal = require__freeGlobal();
	/** Detect free variable `self`. */
	var freeSelf = typeof self == "object" && self && self.Object === Object && self;
	/** Used as a reference to the global object. */
	var root = freeGlobal || freeSelf || Function("return this")();
	module.exports = root;
}) });

//#endregion
//#region ../../node_modules/lodash/_Symbol.js
var require__Symbol = /* @__PURE__ */ __commonJS({ "../../node_modules/lodash/_Symbol.js": ((exports, module) => {
	/** Built-in value references. */
	var Symbol$4 = require__root().Symbol;
	module.exports = Symbol$4;
}) });

//#endregion
//#region ../../node_modules/lodash/_arrayMap.js
var require__arrayMap = /* @__PURE__ */ __commonJS({ "../../node_modules/lodash/_arrayMap.js": ((exports, module) => {
	/**
	* A specialized version of `_.map` for arrays without support for iteratee
	* shorthands.
	*
	* @private
	* @param {Array} [array] The array to iterate over.
	* @param {Function} iteratee The function invoked per iteration.
	* @returns {Array} Returns the new mapped array.
	*/
	function arrayMap$1(array, iteratee) {
		var index = -1, length = array == null ? 0 : array.length, result = Array(length);
		while (++index < length) result[index] = iteratee(array[index], index, array);
		return result;
	}
	module.exports = arrayMap$1;
}) });

//#endregion
//#region ../../node_modules/lodash/isArray.js
var require_isArray = /* @__PURE__ */ __commonJS({ "../../node_modules/lodash/isArray.js": ((exports, module) => {
	/**
	* Checks if `value` is classified as an `Array` object.
	*
	* @static
	* @memberOf _
	* @since 0.1.0
	* @category Lang
	* @param {*} value The value to check.
	* @returns {boolean} Returns `true` if `value` is an array, else `false`.
	* @example
	*
	* _.isArray([1, 2, 3]);
	* // => true
	*
	* _.isArray(document.body.children);
	* // => false
	*
	* _.isArray('abc');
	* // => false
	*
	* _.isArray(_.noop);
	* // => false
	*/
	var isArray$1 = Array.isArray;
	module.exports = isArray$1;
}) });

//#endregion
//#region ../../node_modules/lodash/_getRawTag.js
var require__getRawTag = /* @__PURE__ */ __commonJS({ "../../node_modules/lodash/_getRawTag.js": ((exports, module) => {
	var Symbol$3 = require__Symbol();
	/** Used for built-in method references. */
	var objectProto = Object.prototype;
	/** Used to check objects for own properties. */
	var hasOwnProperty = objectProto.hasOwnProperty;
	/**
	* Used to resolve the
	* [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
	* of values.
	*/
	var nativeObjectToString$1 = objectProto.toString;
	/** Built-in value references. */
	var symToStringTag$1 = Symbol$3 ? Symbol$3.toStringTag : void 0;
	/**
	* A specialized version of `baseGetTag` which ignores `Symbol.toStringTag` values.
	*
	* @private
	* @param {*} value The value to query.
	* @returns {string} Returns the raw `toStringTag`.
	*/
	function getRawTag$1(value) {
		var isOwn = hasOwnProperty.call(value, symToStringTag$1), tag = value[symToStringTag$1];
		try {
			value[symToStringTag$1] = void 0;
			var unmasked = true;
		} catch (e) {}
		var result = nativeObjectToString$1.call(value);
		if (unmasked) if (isOwn) value[symToStringTag$1] = tag;
		else delete value[symToStringTag$1];
		return result;
	}
	module.exports = getRawTag$1;
}) });

//#endregion
//#region ../../node_modules/lodash/_objectToString.js
var require__objectToString = /* @__PURE__ */ __commonJS({ "../../node_modules/lodash/_objectToString.js": ((exports, module) => {
	/**
	* Used to resolve the
	* [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
	* of values.
	*/
	var nativeObjectToString = Object.prototype.toString;
	/**
	* Converts `value` to a string using `Object.prototype.toString`.
	*
	* @private
	* @param {*} value The value to convert.
	* @returns {string} Returns the converted string.
	*/
	function objectToString$1(value) {
		return nativeObjectToString.call(value);
	}
	module.exports = objectToString$1;
}) });

//#endregion
//#region ../../node_modules/lodash/_baseGetTag.js
var require__baseGetTag = /* @__PURE__ */ __commonJS({ "../../node_modules/lodash/_baseGetTag.js": ((exports, module) => {
	var Symbol$2 = require__Symbol(), getRawTag = require__getRawTag(), objectToString = require__objectToString();
	/** `Object#toString` result references. */
	var nullTag = "[object Null]", undefinedTag = "[object Undefined]";
	/** Built-in value references. */
	var symToStringTag = Symbol$2 ? Symbol$2.toStringTag : void 0;
	/**
	* The base implementation of `getTag` without fallbacks for buggy environments.
	*
	* @private
	* @param {*} value The value to query.
	* @returns {string} Returns the `toStringTag`.
	*/
	function baseGetTag$1(value) {
		if (value == null) return value === void 0 ? undefinedTag : nullTag;
		return symToStringTag && symToStringTag in Object(value) ? getRawTag(value) : objectToString(value);
	}
	module.exports = baseGetTag$1;
}) });

//#endregion
//#region ../../node_modules/lodash/isObjectLike.js
var require_isObjectLike = /* @__PURE__ */ __commonJS({ "../../node_modules/lodash/isObjectLike.js": ((exports, module) => {
	/**
	* Checks if `value` is object-like. A value is object-like if it's not `null`
	* and has a `typeof` result of "object".
	*
	* @static
	* @memberOf _
	* @since 4.0.0
	* @category Lang
	* @param {*} value The value to check.
	* @returns {boolean} Returns `true` if `value` is object-like, else `false`.
	* @example
	*
	* _.isObjectLike({});
	* // => true
	*
	* _.isObjectLike([1, 2, 3]);
	* // => true
	*
	* _.isObjectLike(_.noop);
	* // => false
	*
	* _.isObjectLike(null);
	* // => false
	*/
	function isObjectLike$1(value) {
		return value != null && typeof value == "object";
	}
	module.exports = isObjectLike$1;
}) });

//#endregion
//#region ../../node_modules/lodash/isSymbol.js
var require_isSymbol = /* @__PURE__ */ __commonJS({ "../../node_modules/lodash/isSymbol.js": ((exports, module) => {
	var baseGetTag = require__baseGetTag(), isObjectLike = require_isObjectLike();
	/** `Object#toString` result references. */
	var symbolTag = "[object Symbol]";
	/**
	* Checks if `value` is classified as a `Symbol` primitive or object.
	*
	* @static
	* @memberOf _
	* @since 4.0.0
	* @category Lang
	* @param {*} value The value to check.
	* @returns {boolean} Returns `true` if `value` is a symbol, else `false`.
	* @example
	*
	* _.isSymbol(Symbol.iterator);
	* // => true
	*
	* _.isSymbol('abc');
	* // => false
	*/
	function isSymbol$1(value) {
		return typeof value == "symbol" || isObjectLike(value) && baseGetTag(value) == symbolTag;
	}
	module.exports = isSymbol$1;
}) });

//#endregion
//#region ../../node_modules/lodash/_baseToString.js
var require__baseToString = /* @__PURE__ */ __commonJS({ "../../node_modules/lodash/_baseToString.js": ((exports, module) => {
	var Symbol$1 = require__Symbol(), arrayMap = require__arrayMap(), isArray = require_isArray(), isSymbol = require_isSymbol();
	/** Used as references for various `Number` constants. */
	var INFINITY = Infinity;
	/** Used to convert symbols to primitives and strings. */
	var symbolProto = Symbol$1 ? Symbol$1.prototype : void 0, symbolToString = symbolProto ? symbolProto.toString : void 0;
	/**
	* The base implementation of `_.toString` which doesn't convert nullish
	* values to empty strings.
	*
	* @private
	* @param {*} value The value to process.
	* @returns {string} Returns the string.
	*/
	function baseToString$1(value) {
		if (typeof value == "string") return value;
		if (isArray(value)) return arrayMap(value, baseToString$1) + "";
		if (isSymbol(value)) return symbolToString ? symbolToString.call(value) : "";
		var result = value + "";
		return result == "0" && 1 / value == -INFINITY ? "-0" : result;
	}
	module.exports = baseToString$1;
}) });

//#endregion
//#region ../../node_modules/lodash/toString.js
var require_toString = /* @__PURE__ */ __commonJS({ "../../node_modules/lodash/toString.js": ((exports, module) => {
	var baseToString = require__baseToString();
	/**
	* Converts `value` to a string. An empty string is returned for `null`
	* and `undefined` values. The sign of `-0` is preserved.
	*
	* @static
	* @memberOf _
	* @since 4.0.0
	* @category Lang
	* @param {*} value The value to convert.
	* @returns {string} Returns the converted string.
	* @example
	*
	* _.toString(null);
	* // => ''
	*
	* _.toString(-0);
	* // => '-0'
	*
	* _.toString([1, 2, 3]);
	* // => '1,2,3'
	*/
	function toString$2(value) {
		return value == null ? "" : baseToString(value);
	}
	module.exports = toString$2;
}) });

//#endregion
//#region ../../node_modules/lodash/deburr.js
var require_deburr = /* @__PURE__ */ __commonJS({ "../../node_modules/lodash/deburr.js": ((exports, module) => {
	var deburrLetter = require__deburrLetter(), toString$1 = require_toString();
	/** Used to match Latin Unicode letters (excluding mathematical operators). */
	var reLatin = /[\xc0-\xd6\xd8-\xf6\xf8-\xff\u0100-\u017f]/g;
	/**
	* Used to match [combining diacritical marks](https://en.wikipedia.org/wiki/Combining_Diacritical_Marks) and
	* [combining diacritical marks for symbols](https://en.wikipedia.org/wiki/Combining_Diacritical_Marks_for_Symbols).
	*/
	var reComboMark = RegExp("[\\u0300-\\u036f\\ufe20-\\ufe2f\\u20d0-\\u20ff]", "g");
	/**
	* Deburrs `string` by converting
	* [Latin-1 Supplement](https://en.wikipedia.org/wiki/Latin-1_Supplement_(Unicode_block)#Character_table)
	* and [Latin Extended-A](https://en.wikipedia.org/wiki/Latin_Extended-A)
	* letters to basic Latin letters and removing
	* [combining diacritical marks](https://en.wikipedia.org/wiki/Combining_Diacritical_Marks).
	*
	* @static
	* @memberOf _
	* @since 3.0.0
	* @category String
	* @param {string} [string=''] The string to deburr.
	* @returns {string} Returns the deburred string.
	* @example
	*
	* _.deburr('déjà vu');
	* // => 'deja vu'
	*/
	function deburr$1(string) {
		string = toString$1(string);
		return string && string.replace(reLatin, deburrLetter).replace(reComboMark, "");
	}
	module.exports = deburr$1;
}) });

//#endregion
//#region ../../node_modules/lodash/_asciiWords.js
var require__asciiWords = /* @__PURE__ */ __commonJS({ "../../node_modules/lodash/_asciiWords.js": ((exports, module) => {
	/** Used to match words composed of alphanumeric characters. */
	var reAsciiWord = /[^\x00-\x2f\x3a-\x40\x5b-\x60\x7b-\x7f]+/g;
	/**
	* Splits an ASCII `string` into an array of its words.
	*
	* @private
	* @param {string} The string to inspect.
	* @returns {Array} Returns the words of `string`.
	*/
	function asciiWords$1(string) {
		return string.match(reAsciiWord) || [];
	}
	module.exports = asciiWords$1;
}) });

//#endregion
//#region ../../node_modules/lodash/_hasUnicodeWord.js
var require__hasUnicodeWord = /* @__PURE__ */ __commonJS({ "../../node_modules/lodash/_hasUnicodeWord.js": ((exports, module) => {
	/** Used to detect strings that need a more robust regexp to match words. */
	var reHasUnicodeWord = /[a-z][A-Z]|[A-Z]{2}[a-z]|[0-9][a-zA-Z]|[a-zA-Z][0-9]|[^a-zA-Z0-9 ]/;
	/**
	* Checks if `string` contains a word composed of Unicode symbols.
	*
	* @private
	* @param {string} string The string to inspect.
	* @returns {boolean} Returns `true` if a word is found, else `false`.
	*/
	function hasUnicodeWord$1(string) {
		return reHasUnicodeWord.test(string);
	}
	module.exports = hasUnicodeWord$1;
}) });

//#endregion
//#region ../../node_modules/lodash/_unicodeWords.js
var require__unicodeWords = /* @__PURE__ */ __commonJS({ "../../node_modules/lodash/_unicodeWords.js": ((exports, module) => {
	/** Used to compose unicode character classes. */
	var rsAstralRange = "\\ud800-\\udfff", rsComboRange = "\\u0300-\\u036f\\ufe20-\\ufe2f\\u20d0-\\u20ff", rsDingbatRange = "\\u2700-\\u27bf", rsLowerRange = "a-z\\xdf-\\xf6\\xf8-\\xff", rsMathOpRange = "\\xac\\xb1\\xd7\\xf7", rsNonCharRange = "\\x00-\\x2f\\x3a-\\x40\\x5b-\\x60\\x7b-\\xbf", rsPunctuationRange = "\\u2000-\\u206f", rsSpaceRange = " \\t\\x0b\\f\\xa0\\ufeff\\n\\r\\u2028\\u2029\\u1680\\u180e\\u2000\\u2001\\u2002\\u2003\\u2004\\u2005\\u2006\\u2007\\u2008\\u2009\\u200a\\u202f\\u205f\\u3000", rsUpperRange = "A-Z\\xc0-\\xd6\\xd8-\\xde", rsVarRange = "\\ufe0e\\ufe0f", rsBreakRange = rsMathOpRange + rsNonCharRange + rsPunctuationRange + rsSpaceRange;
	/** Used to compose unicode capture groups. */
	var rsApos = "['’]", rsBreak = "[" + rsBreakRange + "]", rsCombo = "[" + rsComboRange + "]", rsDigits = "\\d+", rsDingbat = "[" + rsDingbatRange + "]", rsLower = "[" + rsLowerRange + "]", rsMisc = "[^" + rsAstralRange + rsBreakRange + rsDigits + rsDingbatRange + rsLowerRange + rsUpperRange + "]", rsModifier = "(?:" + rsCombo + "|\\ud83c[\\udffb-\\udfff])", rsNonAstral = "[^" + rsAstralRange + "]", rsRegional = "(?:\\ud83c[\\udde6-\\uddff]){2}", rsSurrPair = "[\\ud800-\\udbff][\\udc00-\\udfff]", rsUpper = "[" + rsUpperRange + "]", rsZWJ = "\\u200d";
	/** Used to compose unicode regexes. */
	var rsMiscLower = "(?:" + rsLower + "|" + rsMisc + ")", rsMiscUpper = "(?:" + rsUpper + "|" + rsMisc + ")", rsOptContrLower = "(?:" + rsApos + "(?:d|ll|m|re|s|t|ve))?", rsOptContrUpper = "(?:" + rsApos + "(?:D|LL|M|RE|S|T|VE))?", reOptMod = rsModifier + "?", rsOptVar = "[" + rsVarRange + "]?", rsOptJoin = "(?:" + rsZWJ + "(?:" + [
		rsNonAstral,
		rsRegional,
		rsSurrPair
	].join("|") + ")" + rsOptVar + reOptMod + ")*", rsOrdLower = "\\d*(?:1st|2nd|3rd|(?![123])\\dth)(?=\\b|[A-Z_])", rsOrdUpper = "\\d*(?:1ST|2ND|3RD|(?![123])\\dTH)(?=\\b|[a-z_])", rsSeq = rsOptVar + reOptMod + rsOptJoin, rsEmoji = "(?:" + [
		rsDingbat,
		rsRegional,
		rsSurrPair
	].join("|") + ")" + rsSeq;
	/** Used to match complex or compound words. */
	var reUnicodeWord = RegExp([
		rsUpper + "?" + rsLower + "+" + rsOptContrLower + "(?=" + [
			rsBreak,
			rsUpper,
			"$"
		].join("|") + ")",
		rsMiscUpper + "+" + rsOptContrUpper + "(?=" + [
			rsBreak,
			rsUpper + rsMiscLower,
			"$"
		].join("|") + ")",
		rsUpper + "?" + rsMiscLower + "+" + rsOptContrLower,
		rsUpper + "+" + rsOptContrUpper,
		rsOrdUpper,
		rsOrdLower,
		rsDigits,
		rsEmoji
	].join("|"), "g");
	/**
	* Splits a Unicode `string` into an array of its words.
	*
	* @private
	* @param {string} The string to inspect.
	* @returns {Array} Returns the words of `string`.
	*/
	function unicodeWords$1(string) {
		return string.match(reUnicodeWord) || [];
	}
	module.exports = unicodeWords$1;
}) });

//#endregion
//#region ../../node_modules/lodash/words.js
var require_words = /* @__PURE__ */ __commonJS({ "../../node_modules/lodash/words.js": ((exports, module) => {
	var asciiWords = require__asciiWords(), hasUnicodeWord = require__hasUnicodeWord(), toString = require_toString(), unicodeWords = require__unicodeWords();
	/**
	* Splits `string` into an array of its words.
	*
	* @static
	* @memberOf _
	* @since 3.0.0
	* @category String
	* @param {string} [string=''] The string to inspect.
	* @param {RegExp|string} [pattern] The pattern to match words.
	* @param- {Object} [guard] Enables use as an iteratee for methods like `_.map`.
	* @returns {Array} Returns the words of `string`.
	* @example
	*
	* _.words('fred, barney, & pebbles');
	* // => ['fred', 'barney', 'pebbles']
	*
	* _.words('fred, barney, & pebbles', /[^, ]+/g);
	* // => ['fred', 'barney', '&', 'pebbles']
	*/
	function words$1(string, pattern, guard) {
		string = toString(string);
		pattern = guard ? void 0 : pattern;
		if (pattern === void 0) return hasUnicodeWord(string) ? unicodeWords(string) : asciiWords(string);
		return string.match(pattern) || [];
	}
	module.exports = words$1;
}) });

//#endregion
//#region ../../node_modules/lodash/_createCompounder.js
var require__createCompounder = /* @__PURE__ */ __commonJS({ "../../node_modules/lodash/_createCompounder.js": ((exports, module) => {
	var arrayReduce = require__arrayReduce(), deburr = require_deburr(), words = require_words();
	/** Used to match apostrophes. */
	var reApos = RegExp("['’]", "g");
	/**
	* Creates a function like `_.camelCase`.
	*
	* @private
	* @param {Function} callback The function to combine each word.
	* @returns {Function} Returns the new compounder function.
	*/
	function createCompounder(callback) {
		return function(string) {
			return arrayReduce(words(deburr(string).replace(reApos, "")), callback, "");
		};
	}
	module.exports = createCompounder;
}) });

//#endregion
//#region ../../node_modules/lodash/kebabCase.js
var require_kebabCase = /* @__PURE__ */ __commonJS({ "../../node_modules/lodash/kebabCase.js": ((exports, module) => {
	/**
	* Converts `string` to
	* [kebab case](https://en.wikipedia.org/wiki/Letter_case#Special_case_styles).
	*
	* @static
	* @memberOf _
	* @since 3.0.0
	* @category String
	* @param {string} [string=''] The string to convert.
	* @returns {string} Returns the kebab cased string.
	* @example
	*
	* _.kebabCase('Foo Bar');
	* // => 'foo-bar'
	*
	* _.kebabCase('fooBar');
	* // => 'foo-bar'
	*
	* _.kebabCase('__FOO_BAR__');
	* // => 'foo-bar'
	*/
	var kebabCase$1 = require__createCompounder()(function(result, word, index) {
		return result + (index ? "-" : "") + word.toLowerCase();
	});
	module.exports = kebabCase$1;
}) });

//#endregion
//#region src/lib/rules/fontRules.ts
var import_kebabCase = /* @__PURE__ */ __toESM(require_kebabCase(), 1);
function createFontRule(propName) {
	const styleName = (0, import_kebabCase.default)(propName);
	return {
		mark: true,
		serialize: (slateNode) => ({
			attributes: [{
				name: "style",
				type: "mdxJsxAttribute",
				value: `${styleName}: ${slateNode[propName]};`
			}],
			children: [{
				type: "text",
				value: slateNode.text
			}],
			name: "span",
			type: "mdxJsxTextElement"
		})
	};
}
const fontRules = {
	backgroundColor: createFontRule("backgroundColor"),
	color: createFontRule("color"),
	fontFamily: createFontRule("fontFamily"),
	fontSize: createFontRule("fontSize"),
	fontWeight: createFontRule("fontWeight"),
	span: {
		mark: true,
		deserialize: (mdastNode, deco, options) => {
			const fontFamily = getStyleValue(mdastNode, "font-family");
			const fontSize = getStyleValue(mdastNode, "font-size");
			const fontWeight = getStyleValue(mdastNode, "font-weight");
			const color$1 = getStyleValue(mdastNode, "color");
			const backgroundColor = getStyleValue(mdastNode, "background-color");
			return convertChildrenDeserialize(mdastNode.children, {
				...deco,
				backgroundColor,
				color: color$1,
				fontFamily,
				fontSize,
				fontWeight
			}, options);
		}
	}
};

//#endregion
//#region src/lib/rules/mediaRules.ts
function createMediaRule() {
	return {
		deserialize: (node) => {
			const { src, ...props } = parseAttributes(node.attributes);
			return {
				children: [{ text: "" }],
				type: node.name,
				url: src,
				...props
			};
		},
		serialize: (node, options) => {
			const { id, children, type, url, ...rest } = node;
			return {
				attributes: propsToAttributes({
					...rest,
					src: url
				}),
				children: convertNodesSerialize(children, options),
				name: type,
				type: "mdxJsxFlowElement"
			};
		}
	};
}
const mediaRules = {
	audio: createMediaRule(),
	file: createMediaRule(),
	video: createMediaRule()
};

//#endregion
//#region src/lib/serializer/utils/getMergedOptionsSerialize.ts
/**
* Merges Markdown configurations, following the principle that options take
* precedence
*
* @param editor Editor instance used to get plugin default configurations
* @param options User-provided options (higher priority)
* @returns The final merged configuration
*/
const getMergedOptionsSerialize = (editor, options) => {
	const { allowedNodes: PluginAllowedNodes, allowNode: PluginAllowNode, disallowedNodes: PluginDisallowedNodes, plainMarks: PluginPlainMarks, remarkPlugins: PluginRemarkPlugins, remarkStringifyOptions: PluginRemarkStringifyOptions, rules: PluginRules } = editor.getOptions(MarkdownPlugin);
	const mergedRules = {
		...buildRules(editor),
		...options?.rules ?? PluginRules
	};
	return {
		allowedNodes: options?.allowedNodes ?? PluginAllowedNodes,
		allowNode: options?.allowNode ?? PluginAllowNode,
		disallowedNodes: options?.disallowedNodes ?? PluginDisallowedNodes,
		editor,
		plainMarks: options?.plainMarks ?? PluginPlainMarks,
		preserveEmptyParagraphs: options?.preserveEmptyParagraphs,
		remarkPlugins: options?.remarkPlugins ?? PluginRemarkPlugins ?? [],
		remarkStringifyOptions: options?.remarkStringifyOptions ?? PluginRemarkStringifyOptions,
		rules: mergedRules,
		spread: options?.spread,
		value: options?.value ?? editor.children,
		withBlockId: options?.withBlockId ?? false
	};
};

//#endregion
//#region src/lib/serializer/utils/getSerializerByKey.ts
const getSerializerByKey = (key, options) => {
	const nodes = options.rules;
	const rules = buildRules(options.editor);
	return nodes?.[key]?.serialize === void 0 ? rules[key]?.serialize : nodes?.[key]?.serialize;
};

//#endregion
//#region src/lib/serializer/utils/unreachable.ts
const unreachable = (value) => {
	console.warn(`Unreachable code: ${JSON.stringify(value)}`);
};

//#endregion
//#region src/lib/serializer/convertTextsSerialize.ts
const basicMarkdownMarks = [
	"italic",
	"bold",
	"strikethrough",
	"code"
];
const convertTextsSerialize = (slateTexts, options, _key) => {
	const customLeaf = getCustomMark(options);
	const mdastTexts = [];
	const starts = [];
	let ends = [];
	let textTemp = "";
	for (let j = 0; j < slateTexts.length; j++) {
		const cur = slateTexts[j];
		textTemp += cur.text;
		const prevStarts = starts.slice();
		const prevEnds = ends.slice();
		const prev = slateTexts[j - 1];
		const next = slateTexts[j + 1];
		ends = [];
		[...basicMarkdownMarks, ...customLeaf.filter((k) => !basicMarkdownMarks.includes(k))].forEach((key) => {
			const nodeType = getPluginType(options.editor, key);
			if (cur[nodeType]) {
				if (options.plainMarks?.includes(key)) return;
				if (!prev?.[nodeType]) starts.push(key);
				if (!next?.[nodeType]) ends.push(key);
			}
		});
		const endsToRemove = starts.reduce((acc, k, kIndex) => {
			if (ends.includes(k)) acc.push({
				key: k,
				index: kIndex
			});
			return acc;
		}, []);
		if (starts.length > 0) {
			let bef = "";
			let aft = "";
			if (endsToRemove.length === 1 && (prevStarts.toString() !== starts.toString() || prevEnds.includes("italic") && ends.includes("bold")) && starts.length - endsToRemove.length === 0) {
				while (textTemp.startsWith(" ")) {
					bef += " ";
					textTemp = textTemp.slice(1);
				}
				while (textTemp.endsWith(" ")) {
					aft += " ";
					textTemp = textTemp.slice(0, -1);
				}
			}
			let res = {
				type: "text",
				value: textTemp
			};
			textTemp = "";
			starts.slice().reverse().forEach((k) => {
				const nodeParser = getSerializerByKey(k, options);
				if (nodeParser) res = {
					...nodeParser(cur, options),
					children: [res]
				};
				switch (k) {
					case "bold":
						res = {
							children: [res],
							type: "strong"
						};
						break;
					case "code": {
						let currentRes = res;
						while (currentRes.type !== "text" && currentRes.type !== "inlineCode") currentRes = currentRes.children[0];
						currentRes.type = "inlineCode";
						break;
					}
					case "italic":
						res = {
							children: [res],
							type: "emphasis"
						};
						break;
					case "strikethrough":
						res = {
							children: [res],
							type: "delete"
						};
						break;
				}
			});
			const arr = [];
			if (bef.length > 0) arr.push({
				type: "text",
				value: bef
			});
			arr.push(res);
			if (aft.length > 0) arr.push({
				type: "text",
				value: aft
			});
			mdastTexts.push(...arr);
		}
		if (endsToRemove.length > 0) endsToRemove.reverse().forEach((e) => {
			starts.splice(e.index, 1);
		});
		else {
			mdastTexts.push({
				type: "text",
				value: textTemp
			});
			textTemp = "";
		}
	}
	if (textTemp) {
		mdastTexts.push({
			type: "text",
			value: textTemp
		});
		textTemp = "";
	}
	return mergeTexts(mdastTexts).map((node) => {
		if (!hasContent(node)) return {
			type: "text",
			value: ""
		};
		return node;
	});
};
const hasContent = (node) => {
	if (node.type === "inlineCode") return node.value !== "";
	if (node.type === "text") return node.value !== "";
	if (node.children?.length > 0) for (const child of node.children) {
		if (child.type !== "emphasis" && child.type !== "strong" && child.type !== "inlineCode" && child.type !== "delete" && child.type !== "text") return true;
		if (hasContent(child)) return true;
	}
	return false;
};
const mergeTexts = (nodes) => {
	const res = [];
	for (const cur of nodes) {
		const last = res.at(-1);
		if (last && last.type === cur.type) if (last.type === "text") last.value += cur.value;
		else if (last.type === "inlineCode") last.value += cur.value;
		else last.children = mergeTexts(last.children.concat(cur.children));
		else {
			if (cur.type === "text" && cur.value === "") continue;
			res.push(cur);
		}
	}
	return res;
};

//#endregion
//#region src/lib/serializer/wrapWithBlockId.ts
/**
* Wraps an mdast node with a block element containing an ID attribute. Used for
* preserving block IDs when serializing to markdown.
*
* @param mdastNode - The mdast node to wrap
* @param nodeId - The ID to attach to the block element
* @returns The wrapped mdast node with block element and ID attribute
*/
const wrapWithBlockId = (mdastNode, nodeId) => ({
	attributes: [{
		name: "id",
		type: "mdxJsxAttribute",
		value: String(nodeId)
	}],
	children: [mdastNode],
	data: { _mdxExplicitJsx: true },
	name: "block",
	type: "mdxJsxFlowElement"
});

//#endregion
//#region src/lib/serializer/listToMdastTree.ts
function listToMdastTree(nodes, options, isBlock = false) {
	if (nodes.length === 0) throw new Error("Cannot create a list from empty nodes");
	if (options.withBlockId && isBlock && nodes.some((node) => node.id)) return processListWithBlockIds(nodes, options);
	const root$1 = {
		children: [],
		ordered: nodes[0].listStyleType === "decimal",
		spread: options.spread ?? false,
		start: nodes[0].listStart,
		type: "list"
	};
	const indentStack = [{
		indent: nodes[0].indent,
		list: root$1,
		parent: null,
		styleType: nodes[0].listStyleType
	}];
	for (let i = 0; i < nodes.length; i++) {
		const node = nodes[i];
		const currentIndent = node.indent;
		while (indentStack.length > 1 && indentStack.at(-1).indent > currentIndent) indentStack.pop();
		let stackTop = indentStack.at(-1);
		if (!stackTop) throw new Error("Stack should never be empty");
		if (stackTop.indent === currentIndent && stackTop.styleType !== node.listStyleType && !!stackTop.parent) {
			const siblingList = {
				children: [],
				ordered: node.listStyleType === "decimal",
				spread: options.spread ?? false,
				start: node.listStart,
				type: "list"
			};
			stackTop.parent.children.push(siblingList);
			indentStack[indentStack.length - 1] = {
				indent: currentIndent,
				list: siblingList,
				parent: stackTop.parent,
				styleType: node.listStyleType
			};
			stackTop = indentStack.at(-1);
		}
		const listItem = {
			checked: null,
			children: [{
				children: convertNodesSerialize(node.children, options),
				type: "paragraph"
			}],
			type: "listItem"
		};
		if (options.spread) listItem.spread = true;
		if (node.listStyleType === "todo" && node.checked !== void 0) listItem.checked = node.checked;
		stackTop.list.children.push(listItem);
		const nextNode = nodes[i + 1];
		if (nextNode && nextNode.indent > currentIndent) {
			const nestedList = {
				children: [],
				ordered: nextNode.listStyleType === "decimal",
				spread: options.spread ?? false,
				start: nextNode.listStart,
				type: "list"
			};
			listItem.children.push(nestedList);
			indentStack.push({
				indent: nextNode.indent,
				list: nestedList,
				parent: listItem,
				styleType: nextNode.listStyleType
			});
		}
	}
	return root$1;
}
/**
* Process list nodes with block IDs by wrapping each item separately This
* preserves list numbering while allowing individual block wrapping
*/
function processListWithBlockIds(nodes, options) {
	const fragments = [];
	for (let i = 0; i < nodes.length; i++) {
		const node = nodes[i];
		const singleList = {
			children: [],
			ordered: node.listStyleType === "decimal",
			spread: options.spread ?? false,
			start: node.listStyleType === "decimal" ? i + 1 : void 0,
			type: "list"
		};
		const listItem = {
			checked: null,
			children: [{
				children: convertNodesSerialize(node.children, options),
				type: "paragraph"
			}],
			type: "listItem"
		};
		if (options.spread) listItem.spread = true;
		if (node.listStyleType === "todo" && node.checked !== void 0) listItem.checked = node.checked;
		singleList.children.push(listItem);
		if (node.id) fragments.push(wrapWithBlockId(singleList, String(node.id)));
		else fragments.push(singleList);
	}
	return {
		children: fragments,
		type: "fragment"
	};
}

//#endregion
//#region src/lib/serializer/convertNodesSerialize.ts
const convertNodesSerialize = (nodes, options, isBlock = false) => {
	const mdastNodes = [];
	let textQueue = [];
	const listBlock = [];
	for (let i = 0; i <= nodes.length; i++) {
		const n = nodes[i];
		if (n && TextApi.isText(n)) {
			if (shouldIncludeText(n, options)) textQueue.push(n);
		} else {
			if (textQueue.length > 0) mdastNodes.push(...convertTextsSerialize(textQueue, options));
			textQueue = [];
			if (!n) continue;
			if (!shouldIncludeNode$1(n, options)) continue;
			const pType = getPluginType(options.editor, KEYS.p) ?? KEYS.p;
			if (n?.type === pType && "listStyleType" in n) {
				listBlock.push(n);
				const next = nodes[i + 1];
				const isNextIndent = next && next.type === pType && "listStyleType" in next;
				const firstList = listBlock.at(0);
				const hasDifferentListStyle = isNextIndent && firstList && next.listStyleType !== firstList.listStyleType && next.indent === firstList.indent;
				if (!isNextIndent || hasDifferentListStyle) {
					const result = listToMdastTree(listBlock, options, isBlock);
					if (result.type === "fragment") mdastNodes.push(...result.children);
					else mdastNodes.push(result);
					listBlock.length = 0;
				}
			} else {
				const node = buildMdastNode(n, options, isBlock);
				if (node) mdastNodes.push(node);
			}
		}
	}
	return mdastNodes;
};
const buildMdastNode = (node, options, isBlock = false) => {
	const editor = options.editor;
	let key = getPluginKey(editor, node.type) ?? node.type;
	if (KEYS.heading.includes(key)) key = "heading";
	if (key === KEYS.olClassic || key === KEYS.ulClassic) key = "list";
	const nodeParser = getSerializerByKey(key, options);
	if (nodeParser) {
		const mdastNode = nodeParser(node, options);
		if (options.withBlockId && node.id && isBlock) return wrapWithBlockId(mdastNode, node.id);
		return mdastNode;
	}
	unreachable(node);
};
const shouldIncludeText = (text, options) => {
	const { allowedNodes, allowNode, disallowedNodes } = options;
	if (allowedNodes && disallowedNodes && allowedNodes.length > 0 && disallowedNodes.length > 0) throw new Error("Cannot combine allowedNodes with disallowedNodes");
	for (const [key, value] of Object.entries(text)) {
		if (key === "text") continue;
		if (allowedNodes) {
			if (!allowedNodes.includes(key) && value) return false;
		} else if (disallowedNodes?.includes(key) && value) return false;
	}
	if (allowNode?.serialize) return allowNode.serialize(text);
	return true;
};
const shouldIncludeNode$1 = (node, options) => {
	const { allowedNodes, allowNode, disallowedNodes } = options;
	if (!node.type) return true;
	if (allowedNodes && disallowedNodes && allowedNodes.length > 0 && disallowedNodes.length > 0) throw new Error("Cannot combine allowedNodes with disallowedNodes");
	if (allowedNodes) {
		if (!allowedNodes.includes(node.type)) return false;
	} else if (disallowedNodes?.includes(node.type)) return false;
	if (allowNode?.serialize) return allowNode.serialize(node);
	return true;
};

//#endregion
//#region src/lib/serializer/serializeInlineMd.ts
const serializeInlineMd = (editor, options) => {
	const mergedOptions = getMergedOptionsSerialize(editor, options);
	const toRemarkProcessor = unified().use(mergedOptions.remarkPlugins ?? []).use(remarkStringify, {
		emphasis: "_",
		...mergedOptions?.remarkStringifyOptions
	});
	if (options?.value?.length === 0) return "";
	const convertedTexts = convertTextsSerialize(mergedOptions.value, { editor });
	return toRemarkProcessor.stringify({
		children: convertedTexts,
		type: "root"
	});
};

//#endregion
//#region src/lib/serializer/serializeMd.ts
/** Serialize the editor value to Markdown. */
const serializeMd = (editor, options) => {
	const mergedOptions = getMergedOptionsSerialize(editor, options);
	const { remarkPlugins, value } = mergedOptions;
	const toRemarkProcessor = unified().use(remarkPlugins ?? []).use(remarkStringify, {
		emphasis: "_",
		...mergedOptions?.remarkStringifyOptions
	});
	const mdast = slateToMdast({
		children: value,
		options: mergedOptions
	});
	return toRemarkProcessor.stringify(mdast);
};
const slateToMdast = ({ children, options }) => {
	return {
		children: convertNodesSerialize(children, options, true),
		type: "root"
	};
};

//#endregion
//#region src/lib/rules/defaultRules.ts
const LEADING_NEWLINE_REGEX = /^\n/;
function isBoolean(value) {
	return value === true || value === false || !!value && typeof value === "object" && Object.prototype.toString.call(value) === "[object Boolean]";
}
const defaultRules = {
	a: {
		deserialize: (mdastNode, deco, options) => ({
			children: convertChildrenDeserialize(mdastNode.children, deco, options),
			type: getPluginType(options.editor, KEYS.a),
			url: mdastNode.url
		}),
		serialize: (node, options) => ({
			children: convertNodesSerialize(node.children, options),
			type: "link",
			url: node.url
		})
	},
	blockquote: {
		deserialize: (mdastNode, deco, options) => {
			return {
				children: (mdastNode.children.length > 0 ? mdastNode.children.flatMap((paragraph, index, children) => {
					if (paragraph.type === "paragraph") {
						if (children.length > 1 && children.length - 1 !== index) {
							const paragraphChildren = convertChildrenDeserialize(paragraph.children, deco, options);
							paragraphChildren.push({ text: "\n" }, { text: "\n" });
							return paragraphChildren;
						}
						return convertChildrenDeserialize(paragraph.children, deco, options);
					}
					if ("children" in paragraph) return convertChildrenDeserialize(paragraph.children, deco, options);
					return [{ text: "" }];
				}) : [{ text: "" }]).flatMap((child) => child.type === "blockquote" ? child.children : [child]),
				type: getPluginType(options.editor, KEYS.blockquote)
			};
		},
		serialize: (node, options) => {
			const nodes = [];
			for (const child of node.children) if (child.text === "\n") nodes.push({ type: "break" });
			else nodes.push(child);
			const paragraphChildren = convertNodesSerialize(nodes, options);
			if (paragraphChildren.length > 0 && paragraphChildren.at(-1).type === "break") {
				paragraphChildren.at(-1).type = "html";
				paragraphChildren.at(-1).value = "\n<br />";
			}
			return {
				children: [{
					children: paragraphChildren,
					type: "paragraph"
				}],
				type: "blockquote"
			};
		}
	},
	bold: {
		mark: true,
		deserialize: (mdastNode, deco, options) => convertTextsDeserialize(mdastNode, deco, options)
	},
	br: { deserialize() {
		return [{ text: "\n" }];
	} },
	break: {
		deserialize: (_mdastNode, _deco) => ({ text: "\n" }),
		serialize: () => ({ type: "break" })
	},
	callout: {
		deserialize: (mdastNode, deco, options) => {
			const props = parseAttributes(mdastNode.attributes);
			return {
				children: convertChildrenDeserialize(mdastNode.children, deco, options),
				type: getPluginType(options.editor, KEYS.callout),
				...props
			};
		},
		serialize(slateNode, options) {
			const { children, type, ...rest } = slateNode;
			return {
				attributes: propsToAttributes(rest),
				children: convertNodesSerialize(children, options),
				name: "callout",
				type: "mdxJsxFlowElement"
			};
		}
	},
	code: {
		mark: true,
		deserialize: (mdastNode, deco, options) => ({
			...deco,
			[getPluginType(options.editor, KEYS.code)]: true,
			text: mdastNode.value
		})
	},
	code_block: {
		deserialize: (mdastNode, _deco, options) => ({
			children: (mdastNode.value || "").split("\n").map((line) => ({
				children: [{ text: line }],
				type: getPluginType(options.editor, KEYS.codeLine)
			})),
			lang: mdastNode.lang ?? void 0,
			type: getPluginType(options.editor, KEYS.codeBlock)
		}),
		serialize: (node) => ({
			lang: node.lang,
			type: "code",
			value: node.children.map((child) => child?.children === void 0 ? child.text : child.children.map((c) => c.text).join("")).join("\n")
		})
	},
	comment: {
		mark: true,
		deserialize: (mdastNode, deco, options) => {
			return convertChildrenDeserialize(mdastNode.children, {
				[getPluginType(options.editor, KEYS.comment)]: true,
				...deco
			}, options);
		},
		serialize(slateNode) {
			return {
				attributes: [],
				children: [{
					type: "text",
					value: slateNode.text
				}],
				name: "comment",
				type: "mdxJsxTextElement"
			};
		}
	},
	date: {
		deserialize(mdastNode, _deco, options) {
			return {
				children: [{ text: "" }],
				date: (mdastNode.children?.[0])?.value || "",
				type: getPluginType(options.editor, KEYS.date)
			};
		},
		serialize({ date }) {
			return {
				attributes: [],
				children: [{
					type: "text",
					value: date ?? ""
				}],
				name: "date",
				type: "mdxJsxTextElement"
			};
		}
	},
	del: {
		mark: true,
		deserialize: (mdastNode, deco, options) => convertChildrenDeserialize(mdastNode.children, {
			[getPluginType(options.editor, KEYS.strikethrough)]: true,
			...deco
		}, options)
	},
	equation: {
		deserialize: (mdastNode, _deco, options) => ({
			children: [{ text: "" }],
			texExpression: mdastNode.value,
			type: getPluginType(options.editor, KEYS.equation)
		}),
		serialize: (node) => ({
			type: "math",
			value: node.texExpression
		})
	},
	footnoteDefinition: { deserialize: (mdastNode, deco, options) => {
		return {
			children: convertChildrenDeserialize(mdastNode.children, deco, options).flatMap((child) => child.type === "p" ? child.children : [child]),
			type: getPluginType(options.editor, KEYS.p)
		};
	} },
	footnoteReference: {},
	heading: {
		deserialize: (mdastNode, deco, options) => {
			const defaultType = {
				1: "h1",
				2: "h2",
				3: "h3",
				4: "h4",
				5: "h5",
				6: "h6"
			}[mdastNode.depth];
			const type = getPluginType(options.editor, defaultType);
			return {
				children: convertChildrenDeserialize(mdastNode.children, deco, options),
				type
			};
		},
		serialize: (node, options) => {
			const key = getPluginKey(options.editor, node.type) ?? node.type;
			return {
				children: convertNodesSerialize(node.children, options),
				depth: {
					h1: 1,
					h2: 2,
					h3: 3,
					h4: 4,
					h5: 5,
					h6: 6
				}[key],
				type: "heading"
			};
		}
	},
	highlight: {
		mark: true,
		deserialize: (mdastNode, deco, options) => convertChildrenDeserialize(mdastNode.children, {
			[getPluginType(options.editor, KEYS.highlight)]: true,
			...deco
		}, options),
		serialize(slateNode) {
			return {
				attributes: [],
				children: [{
					type: "text",
					value: slateNode.text
				}],
				name: "mark",
				type: "mdxJsxTextElement"
			};
		}
	},
	hr: {
		deserialize: (_, __, options) => ({
			children: [{ text: "" }],
			type: getPluginType(options.editor, KEYS.hr)
		}),
		serialize: () => ({ type: "thematicBreak" })
	},
	html: { deserialize: (mdastNode, _deco, _options) => ({ text: (mdastNode.value || "").replaceAll("<br />", "\n") }) },
	img: {
		deserialize: (mdastNode, _deco, options) => {
			const { alt, attributes, title, url } = mdastNode;
			const { alt: altAttr, src, ...rest } = attributes ? parseAttributes(attributes) : {};
			return {
				caption: [{ text: altAttr || alt || "" }],
				children: [{ text: "" }],
				...title && { title },
				type: getPluginType(options.editor, KEYS.img),
				url: src || url,
				...rest
			};
		},
		serialize: ({ caption, url }) => {
			return {
				children: [{
					alt: caption ? caption.map((c) => c.text).join("") : void 0,
					title: caption ? caption.map((c) => c.text).join("") : void 0,
					type: "image",
					url
				}],
				type: "paragraph"
			};
		}
	},
	inline_equation: {
		deserialize(mdastNode, _, options) {
			return {
				children: [{ text: "" }],
				texExpression: mdastNode.value,
				type: getPluginType(options.editor, KEYS.inlineEquation)
			};
		},
		serialize: (node) => ({
			type: "inlineMath",
			value: node.texExpression
		})
	},
	italic: {
		mark: true,
		deserialize: (mdastNode, deco, options) => convertTextsDeserialize(mdastNode, deco, options)
	},
	kbd: {
		mark: true,
		deserialize: (mdastNode, deco, options) => convertChildrenDeserialize(mdastNode.children, {
			[getPluginType(options.editor, KEYS.kbd)]: true,
			...deco
		}, options),
		serialize(slateNode) {
			return {
				attributes: [],
				children: [{
					type: "text",
					value: slateNode.text
				}],
				name: "kbd",
				type: "mdxJsxTextElement"
			};
		}
	},
	list: {
		deserialize: (mdastNode, deco, options) => {
			if (!!!options.editor?.plugins.list) return {
				children: mdastNode.children.map((child) => {
					if (child.type === "listItem") return {
						children: child.children.map((itemChild) => {
							if (itemChild.type === "paragraph") return {
								children: convertChildrenDeserialize(itemChild.children, deco, options),
								type: getPluginType(options.editor, KEYS.lic)
							};
							return convertChildrenDeserialize([itemChild], deco, options)[0];
						}),
						type: getPluginType(options.editor, KEYS.li)
					};
					return convertChildrenDeserialize([child], deco, options)[0];
				}),
				type: getPluginType(options.editor, mdastNode.ordered ? KEYS.olClassic : KEYS.ulClassic)
			};
			const parseListItems = (listNode, indent = 1, startIndex = 1) => {
				const items = [];
				const isOrdered = !!listNode.ordered;
				let listStyleType = isOrdered ? getPluginType(options.editor, KEYS.ol) : getPluginType(options.editor, KEYS.ul);
				listNode.children?.forEach((listItem, index) => {
					if (listItem.type !== "listItem") return;
					const isTodoList = isBoolean(listItem.checked);
					if (isTodoList) listStyleType = getPluginType(options.editor, KEYS.listTodo);
					const [paragraph, ...subLists] = listItem.children || [];
					const result = paragraph ? buildSlateNode(paragraph, deco, options) : {
						children: [{ text: "" }],
						type: getPluginType(options.editor, KEYS.p)
					};
					(Array.isArray(result) ? result : [result]).forEach((node) => {
						const itemContent = {
							...node,
							indent,
							type: node.type === getPluginType(options.editor, KEYS.img) ? node.type : getPluginType(options.editor, KEYS.p)
						};
						itemContent.listStyleType = listStyleType;
						if (isTodoList) itemContent.checked = listItem.checked;
						if (isOrdered) itemContent.listStart = startIndex + index;
						items.push(itemContent);
					});
					subLists.forEach((subNode) => {
						if (subNode.type === "list") {
							const subListStart = subNode.start || 1;
							const nestedItems = parseListItems(subNode, indent + 1, subListStart);
							items.push(...nestedItems);
						} else {
							const result$1 = buildSlateNode(subNode, deco, options);
							if (Array.isArray(result$1)) items.push(...result$1.map((item) => ({
								...item,
								indent: indent + 1
							})));
							else items.push({
								...result$1,
								indent: indent + 1
							});
						}
					});
				});
				return items;
			};
			return parseListItems(mdastNode, 1, mdastNode.start || 1);
		},
		serialize: (node, options) => {
			const editor = options.editor;
			const isOrdered = getPluginKey(editor, node.type) === KEYS.olClassic;
			const serializeListItems = (children) => {
				const items = [];
				let currentItem = null;
				for (const child of children) if (getPluginKey(editor, child.type) === "li") {
					if (currentItem) items.push(currentItem);
					currentItem = {
						children: [],
						spread: false,
						type: "listItem"
					};
					for (const liChild of child.children) if (getPluginKey(editor, liChild.type) === "lic") currentItem.children.push({
						children: convertNodesSerialize(liChild.children, options),
						type: "paragraph"
					});
					else if (getPluginKey(editor, liChild.type) === "ol" || getPluginKey(editor, liChild.type) === "ul") currentItem.children.push({
						children: serializeListItems(liChild.children),
						ordered: getPluginKey(editor, liChild.type) === "ol",
						spread: false,
						type: "list"
					});
				}
				if (currentItem) items.push(currentItem);
				return items;
			};
			return {
				children: serializeListItems(node.children),
				ordered: isOrdered,
				spread: false,
				type: "list"
			};
		}
	},
	listItem: {
		deserialize: (mdastNode, deco, options) => {
			return {
				children: mdastNode.children.map((child) => {
					if (child.type === "paragraph") return {
						children: convertChildrenDeserialize(child.children, deco, options),
						type: getPluginType(options.editor, KEYS.lic)
					};
					return convertChildrenDeserialize([child], deco, options)[0];
				}),
				type: getPluginType(options.editor, KEYS.li)
			};
		},
		serialize: (node, options) => ({
			children: convertNodesSerialize(node.children, options),
			type: "listItem"
		})
	},
	mention: {
		deserialize: (node, _deco, options) => ({
			children: [{ text: "" }],
			type: getPluginType(options.editor, KEYS.mention),
			value: node.displayText || node.username,
			...node.displayText && { key: node.username }
		}),
		serialize: (node) => {
			const mentionId = node.key || node.value;
			const displayText = node.value;
			const encodedId = encodeURIComponent(String(mentionId)).replace(/\(/g, "%28").replace(/\)/g, "%29");
			return {
				children: [{
					type: "text",
					value: displayText
				}],
				type: "link",
				url: `mention:${encodedId}`
			};
		}
	},
	p: {
		deserialize: (node, deco, options) => {
			const isKeepLineBreak = options.splitLineBreaks;
			const children = convertChildrenDeserialize(node.children, deco, options);
			const splitBlockTypes = new Set(["img"]);
			const elements = [];
			let inlineNodes = [];
			const flushInlineNodes = () => {
				if (inlineNodes.length > 0) {
					elements.push({
						children: inlineNodes,
						type: getPluginType(options.editor, KEYS.p)
					});
					inlineNodes = [];
				}
			};
			children.forEach((c) => {
				if (c.text === "​") c.text = "";
			});
			children.forEach((child, index, children$1) => {
				const { type } = child;
				if (type && splitBlockTypes.has(type)) {
					flushInlineNodes();
					elements.push(child);
				} else if (isKeepLineBreak && "text" in child && typeof child.text === "string") {
					const textParts = child.text.split("\n");
					if (child.text === "\n" && inlineNodes.length === 0) {
						inlineNodes.push({
							...child,
							text: ""
						});
						flushInlineNodes();
						return;
					}
					textParts.forEach((part, index$1, array) => {
						const isNotFirstPart = index$1 > 0;
						const isNotLastPart = index$1 < array.length - 1;
						if (isNotFirstPart) flushInlineNodes();
						if (part) inlineNodes.push({
							...child,
							text: part
						});
						if (isNotLastPart) flushInlineNodes();
					});
				} else if (child.text === "\n" && children$1.length > 1 && index === children$1.length - 1) {} else inlineNodes.push(child);
			});
			flushInlineNodes();
			return elements.length === 1 ? elements[0] : elements;
		},
		serialize: (node, options) => {
			let enrichedChildren = node.children;
			enrichedChildren = enrichedChildren.map((child) => {
				if (child.text === "\n") return { type: "break" };
				if (child.text === "" && options.preserveEmptyParagraphs !== false) return {
					...child,
					text: "​"
				};
				return child;
			});
			const convertedNodes = convertNodesSerialize(enrichedChildren, options);
			if (convertedNodes.length > 0 && enrichedChildren.at(-1).type === "break") {
				convertedNodes.at(-1).type = "html";
				convertedNodes.at(-1).value = "\n<br />";
			}
			return {
				children: convertedNodes,
				type: "paragraph"
			};
		}
	},
	strikethrough: {
		mark: true,
		deserialize: (mdastNode, deco, options) => convertTextsDeserialize(mdastNode, deco, options)
	},
	subscript: {
		mark: true,
		deserialize: (mdastNode, deco, options) => convertChildrenDeserialize(mdastNode.children, {
			[getPluginType(options.editor, KEYS.sub)]: true,
			...deco
		}, options),
		serialize(slateNode, _options) {
			return {
				attributes: [],
				children: [{
					type: "text",
					value: slateNode.text
				}],
				name: "sub",
				type: "mdxJsxTextElement"
			};
		}
	},
	suggestion: {
		mark: true,
		deserialize: (mdastNode, deco, options) => {
			return convertChildrenDeserialize(mdastNode.children, {
				[getPluginType(options.editor, KEYS.suggestion)]: true,
				...deco
			}, options);
		},
		serialize(slateNode) {
			return {
				attributes: [],
				children: [{
					type: "text",
					value: slateNode.text
				}],
				name: "suggestion",
				type: "mdxJsxTextElement"
			};
		}
	},
	superscript: {
		mark: true,
		deserialize: (mdastNode, deco, options) => convertChildrenDeserialize(mdastNode.children, {
			[getPluginType(options.editor, KEYS.sup)]: true,
			...deco
		}, options),
		serialize(slateNode, _options) {
			return {
				attributes: [],
				children: [{
					type: "text",
					value: slateNode.text
				}],
				name: "sup",
				type: "mdxJsxTextElement"
			};
		}
	},
	table: {
		deserialize: (node, deco, options) => {
			const paragraphType = getPluginType(options.editor, KEYS.p);
			return {
				children: node.children?.map((row, rowIndex) => ({
					children: row.children?.map((cell) => {
						const cellType = rowIndex === 0 ? "th" : "td";
						const cellChildren = convertChildrenDeserialize(cell.children, deco, options);
						const groupedChildren = [];
						let currentParagraphChildren = [];
						for (const child of cellChildren) if (!child.type || child.type === KEYS.inlineEquation) currentParagraphChildren.push(child);
						else {
							if (currentParagraphChildren.length > 0) {
								groupedChildren.push({
									children: currentParagraphChildren,
									type: paragraphType
								});
								currentParagraphChildren = [];
							}
							groupedChildren.push(child);
						}
						if (currentParagraphChildren.length > 0) groupedChildren.push({
							children: currentParagraphChildren,
							type: paragraphType
						});
						return {
							children: groupedChildren.length > 0 ? groupedChildren : [{
								children: [{ text: "" }],
								type: paragraphType
							}],
							type: getPluginType(options.editor, cellType)
						};
					}) || [],
					type: getPluginType(options.editor, KEYS.tr)
				})) || [],
				type: getPluginType(options.editor, KEYS.table)
			};
		},
		serialize: (node, options) => ({
			children: convertNodesSerialize(node.children, options),
			type: "table"
		})
	},
	td: { serialize: (node, options) => {
		const children = convertNodesSerialize(node.children, options);
		if (children.length > 1) {
			const result = [];
			for (let i = 0; i < children.length; i++) {
				result.push(children[i]);
				if (i < children.length - 1) result.push({
					type: "html",
					value: "<br/>"
				});
			}
			return {
				children: result,
				type: "tableCell"
			};
		}
		return {
			children,
			type: "tableCell"
		};
	} },
	text: { deserialize: (mdastNode, deco) => ({
		...deco,
		text: mdastNode.value.replace(LEADING_NEWLINE_REGEX, "")
	}) },
	th: { serialize: (node, options) => {
		const children = convertNodesSerialize(node.children, options);
		if (children.length > 1) {
			const result = [];
			for (let i = 0; i < children.length; i++) {
				result.push(children[i]);
				if (i < children.length - 1) result.push({
					type: "html",
					value: "<br/>"
				});
			}
			return {
				children: result,
				type: "tableCell"
			};
		}
		return {
			children,
			type: "tableCell"
		};
	} },
	toc: {
		deserialize: (mdastNode, deco, options) => ({
			children: convertChildrenDeserialize(mdastNode.children, deco, options),
			type: getPluginType(options.editor, KEYS.toc)
		}),
		serialize: (node, options) => ({
			attributes: [],
			children: convertNodesSerialize(node.children, options),
			name: "toc",
			type: "mdxJsxFlowElement"
		})
	},
	tr: { serialize: (node, options) => ({
		children: convertNodesSerialize(node.children, options),
		type: "tableRow"
	}) },
	underline: {
		mark: true,
		deserialize: (mdastNode, deco, options) => convertChildrenDeserialize(mdastNode.children, {
			[getPluginType(options.editor, KEYS.underline)]: true,
			...deco
		}, options),
		serialize(slateNode, _options) {
			return {
				attributes: [],
				children: [{
					type: "text",
					value: slateNode.text
				}],
				name: "u",
				type: "mdxJsxTextElement"
			};
		}
	},
	...fontRules,
	...mediaRules,
	...columnRules
};
const buildRules = (editor) => {
	const keys = Object.keys(defaultRules);
	const newRules = {};
	keys.forEach((key) => {
		const pluginKey = getPluginKey(editor, key);
		newRules[pluginKey ?? key] = defaultRules[key];
	});
	return newRules;
};

//#endregion
//#region src/lib/deserializer/utils/getDeserializerByKey.ts
const getDeserializerByKey = (key, options) => {
	const rules = options.rules;
	return rules?.[key]?.deserialize === void 0 ? buildRules(options.editor)[key]?.deserialize : rules?.[key]?.deserialize;
};

//#endregion
//#region src/lib/deserializer/utils/customMdxDeserialize.ts
const customMdxDeserialize = (mdastNode, deco, options) => {
	const customJsxElementKey = mdastNode.name;
	const key = getPluginKey(options.editor, customJsxElementKey) ?? mdastNode.name;
	if (key) {
		const nodeParserDeserialize = getDeserializerByKey(mdastToPlate(options.editor, key), options);
		if (nodeParserDeserialize) return nodeParserDeserialize(mdastNode, deco, options);
	} else console.warn("This MDX node does not have a parser for deserialization", mdastNode);
	if (mdastNode.type === "mdxJsxTextElement") {
		const tagName = mdastNode.name;
		let textContent = "";
		if (mdastNode.children) textContent = mdastNode.children.map((child) => {
			if ("value" in child) return child.value;
			return "";
		}).join("");
		return [{ text: `<${tagName}>${textContent}</${tagName}>` }];
	}
	if (mdastNode.type === "mdxJsxFlowElement") {
		const tagName = mdastNode.name;
		return [{
			children: [
				{ text: `<${tagName}>\n` },
				...convertChildrenDeserialize(mdastNode.children, deco, options),
				{ text: `\n</${tagName}>` }
			],
			type: getPluginType(options.editor, KEYS.p)
		}];
	}
};

//#endregion
//#region src/lib/deserializer/utils/stripMarkdown.ts
const stripMarkdownBlocks = (text) => {
	let result = text;
	result = result.replaceAll(/^#{1,6}\s+/gm, "");
	result = result.replaceAll(/^\s*>\s?/gm, "");
	result = result.replaceAll(/^([*_-]){3,}\s*$/gm, "");
	result = result.replaceAll(/^(\s*)([*+-]|\d+\.)\s/gm, "$1");
	result = result.replaceAll(/^```[\S\s]*?^```/gm, "");
	result = result.replaceAll("<br>", "\n");
	return result;
};
const stripMarkdownInline = (text) => {
	let result = text;
	result = result.replaceAll(/(\*\*|__)(.*?)\1/g, "$2");
	result = result.replaceAll(/(\*|_)(.*?)\1/g, "$2");
	result = result.replaceAll(/\[([^\]]+)]\(([^)]+)\)/g, "$1");
	result = result.replaceAll(/`(.+?)`/g, "$1");
	result = result.replaceAll("&nbsp;", " ");
	result = result.replaceAll("&lt;", "<");
	result = result.replaceAll("&gt;", ">");
	result = result.replaceAll("&amp;", "&");
	return result;
};
const stripMarkdown = (text) => {
	let result = stripMarkdownBlocks(text);
	result = stripMarkdownInline(result);
	return result;
};

//#endregion
//#region src/lib/deserializer/utils/deserializeInlineMd.ts
const LEADING_SPACES_REGEX = /^\s*/;
const TRAILING_SPACES_REGEX = /\s*$/;
const deserializeInlineMd = (editor, text, options) => {
	const leadingSpaces = LEADING_SPACES_REGEX.exec(text)?.[0] || "";
	const trailingSpaces = TRAILING_SPACES_REGEX.exec(text)?.[0] || "";
	const strippedText = stripMarkdownBlocks(text.trim());
	const fragment = [];
	if (leadingSpaces) fragment.push({ text: leadingSpaces });
	if (strippedText) {
		const result = editor.getApi(MarkdownPlugin).markdown.deserialize(strippedText, options)[0];
		if (result) {
			const nodes = ElementApi.isElement(result) ? result.children : [result];
			fragment.push(...nodes);
		}
	}
	if (trailingSpaces) fragment.push({ text: trailingSpaces });
	return fragment;
};

//#endregion
//#region src/lib/utils/getRemarkPluginsWithoutMdx.ts
const REMARK_MDX_TAG = "remarkMdx";
const tagRemarkPlugin = (pluginFn, tag) => {
	const wrapped = function(...args) {
		return pluginFn.apply(this, args);
	};
	wrapped.__pluginTag = tag;
	return wrapped;
};
const getRemarkPluginsWithoutMdx = (plugins) => plugins.filter((plugin) => plugin.__pluginTag !== REMARK_MDX_TAG);

//#endregion
//#region src/lib/deserializer/utils/getMergedOptionsDeserialize.ts
/**
* Merges Markdown configurations, following the principle that options take
* precedence
*
* @param editor Editor instance used to get plugin default configurations
* @param options User-provided options (higher priority)
* @returns The final merged configuration
*/
const getMergedOptionsDeserialize = (editor, options) => {
	const { allowedNodes: PluginAllowedNodes, allowNode: PluginAllowNode, disallowedNodes: PluginDisallowedNodes, remarkPlugins: PluginRemarkPlugins, rules: PluginRules } = editor.getOptions(MarkdownPlugin);
	const mergedRules = {
		...buildRules(editor),
		...options?.rules ?? PluginRules
	};
	const remarkPlugins = options?.remarkPlugins ?? PluginRemarkPlugins ?? [];
	return {
		allowedNodes: options?.allowedNodes ?? PluginAllowedNodes,
		allowNode: options?.allowNode ?? PluginAllowNode,
		disallowedNodes: options?.disallowedNodes ?? PluginDisallowedNodes,
		editor,
		memoize: options?.memoize,
		parser: options?.parser,
		remarkPlugins: options?.withoutMdx ? getRemarkPluginsWithoutMdx(remarkPlugins) : remarkPlugins,
		rules: mergedRules,
		splitLineBreaks: options?.splitLineBreaks
	};
};

//#endregion
//#region src/lib/deserializer/utils/getStyleValue.ts
const getStyleValue = (mdastNode, styleName) => {
	const styleAttribute = mdastNode.attributes.find((attr) => "name" in attr && attr.name === "style");
	if (!styleAttribute?.value) return;
	const styles = styleAttribute.value.split(";");
	for (const style of styles) {
		const [name, value] = style.split(":").map((s) => s.trim());
		if (name === styleName) return value;
	}
};

//#endregion
//#region src/lib/deserializer/utils/htmlToJsx.ts
const VOID_ELEMENTS = new Set([
	"area",
	"base",
	"br",
	"col",
	"embed",
	"hr",
	"img",
	"input",
	"link",
	"meta",
	"param",
	"source",
	"track",
	"wbr"
]);
const BOOL_ATTRS = new Map([
	["checked", "checked"],
	["disabled", "disabled"],
	["readonly", "readOnly"],
	["required", "required"],
	["multiple", "multiple"],
	["hidden", "hidden"]
]);
const BOOL_ATTR_REGEXES = Array.from(BOOL_ATTRS.entries()).map(([htmlAttr, jsxAttr]) => ({
	jsxAttr,
	reg: new RegExp(`(\\s|^)${htmlAttr}(\\s|/?>|$)`, "gi")
}));
const ATTR_RENAMES = [[/(\s)class=/g, "$1className="], [/(\s)for=/g, "$1htmlFor="]];
const htmlToJsx = (html) => {
	if (!html || typeof html !== "string") return html;
	return html.replace(/<!--([\s\S]*?)-->/g, "{/*$1*/}").replace(/<([a-zA-Z0-9]+)\b([^>]*?)(\/?)>/gi, (_match, tagName, attrs, selfClosing) => {
		let a = attrs;
		ATTR_RENAMES.forEach(([pattern, replacement]) => {
			a = a.replace(pattern, replacement);
		});
		a = a.replace(/(^|\s)([a-zA-Z0-9_-]+)=([^{ \t\n\r"'>]+?)(?=\s|\/?>|$)/g, "$1$2=\"$3\"");
		for (const { reg, jsxAttr } of BOOL_ATTR_REGEXES) a = a.replace(reg, `$1${jsxAttr}="true"$2`);
		const closing = VOID_ELEMENTS.has(tagName.toLowerCase()) ? " /" : selfClosing;
		return `<${tagName}${a.trimEnd()}${closing}>`;
	});
};

//#endregion
//#region src/lib/deserializer/mdastToSlate.ts
const mdastToSlate = (node, options) => buildSlateRoot(node, options);
const buildSlateRoot = (root$1, options) => {
	if (!options.splitLineBreaks) {
		root$1.children = root$1.children.map((child) => {
			if (child.type === "html" && child.value === "<br />") return {
				children: [{
					type: "text",
					value: "\n"
				}],
				type: "paragraph"
			};
			return child;
		});
		return convertNodesDeserialize(root$1.children, {}, options);
	}
	const results = [];
	let startLine = root$1.position?.start.line ?? 1;
	const addEmptyParagraphs = (count) => {
		if (count > 0) results.push(...Array.from({ length: count }).map(() => ({
			children: [{ text: "" }],
			type: options.editor ? getPluginKey(options.editor, KEYS.p) ?? KEYS.p : KEYS.p
		})));
	};
	root$1.children?.forEach((child, index) => {
		const isFirstChild = index === 0;
		const isLastChild = index === root$1.children.length - 1;
		if (child.position) {
			addEmptyParagraphs(child.position.start.line - (isFirstChild ? startLine : startLine + 1));
			const transformValue = convertNodesDeserialize([child], {}, options);
			results.push(...transformValue);
			if (isLastChild) addEmptyParagraphs(root$1.position.end.line - child.position.end.line - 1);
			startLine = child.position.end.line;
		} else {
			const transformValue = convertNodesDeserialize([child], {}, options);
			results.push(...transformValue);
		}
	});
	return results;
};

//#endregion
//#region src/lib/deserializer/deserializeMd.ts
const markdownToAstProcessor = (editor, data, options) => {
	const mergedOptions = getMergedOptionsDeserialize(editor, options);
	return unified().use(remarkParse).use(mergedOptions.remarkPlugins ?? []).parse(data);
};
const markdownToSlateNodes = (editor, data, options) => {
	const processedData = options?.withoutMdx ? data : htmlToJsx(data);
	const mergedOptions = getMergedOptionsDeserialize(editor, options);
	const toSlateProcessor = unified().use(remarkParse).use(mergedOptions.remarkPlugins ?? []).use(remarkToSlate, mergedOptions);
	if (options?.memoize) return parseMarkdownBlocks(processedData, options.parser).flatMap((token) => {
		if (token.type === "space") return {
			...editor.api.create.block(),
			_memo: token.raw
		};
		return toSlateProcessor.processSync(token.raw).result.map((result) => ({
			_memo: token.raw,
			...result
		}));
	});
	return toSlateProcessor.processSync(processedData).result;
};
const deserializeMd = (editor, data, options) => {
	let output = null;
	try {
		output = markdownToSlateNodes(editor, data, options);
	} catch (error) {
		options?.onError?.(error);
		if (!options?.withoutMdx) output = markdownToSlateNodesSafely(editor, data, options);
	}
	if (!output) return [];
	return output.map((item) => TextApi.isText(item) ? {
		children: [item],
		type: getPluginKey(editor, KEYS.p) ?? KEYS.p
	} : item);
};
const remarkToSlate = function(options = {}) {
	this.compiler = (node) => mdastToSlate(node, options);
};

//#endregion
//#region src/lib/deserializer/utils/splitIncompleteMdx.ts
/** Check if character is valid for tag name: A-Z / a-z / 0-9 / - _ : */
const isNameChar = (c) => c >= 48 && c <= 57 || c >= 65 && c <= 90 || c >= 97 && c <= 122 || c === 45 || c === 95 || c === 58;
const splitIncompleteMdx = (data) => {
	const stack = [];
	const len = data.length;
	let i = 0;
	let cutPos = -1;
	while (i < len) {
		if (data.codePointAt(i) !== 60) {
			i++;
			continue;
		}
		const tagStart = i;
		i++;
		if (i >= len) {
			cutPos = tagStart;
			break;
		}
		let closing = false;
		if (data[i] === "/") {
			closing = true;
			i++;
		}
		const nameStart = i;
		while (i < len && isNameChar(data.codePointAt(i))) i++;
		if (nameStart === i) {
			cutPos = tagStart;
			break;
		}
		const tagName = data.slice(nameStart, i).toLowerCase();
		let inQuote = null;
		let selfClosing = false;
		while (i < len) {
			const ch = data[i];
			if (inQuote) {
				if (ch === inQuote) inQuote = null;
			} else if (ch === "\"" || ch === "'") inQuote = ch;
			else if (ch === ">") {
				selfClosing = data[i - 1] === "/";
				i++;
				break;
			}
			i++;
		}
		if (i >= len) {
			cutPos = tagStart;
			break;
		}
		if (selfClosing) continue;
		if (closing) {
			for (let j = stack.length - 1; j >= 0; j--) if (stack[j].name === tagName) {
				stack.splice(j, 1);
				break;
			}
		} else stack.push({
			name: tagName,
			pos: tagStart
		});
	}
	if (stack.length > 0) {
		const firstUnmatched = stack[0].pos;
		cutPos = cutPos === -1 ? firstUnmatched : Math.min(cutPos, firstUnmatched);
	}
	return cutPos === -1 ? data : [data.slice(0, cutPos), data.slice(cutPos)];
};

//#endregion
//#region src/lib/deserializer/utils/markdownToSlateNodesSafely.ts
const markdownToSlateNodesSafely = (editor, data, options) => {
	const result = splitIncompleteMdx(data);
	if (!Array.isArray(result)) return markdownToSlateNodes(editor, data, {
		...options,
		withoutMdx: true
	});
	const [completeString, incompleteString] = result;
	const incompleteNodes = deserializeInlineMd(editor, incompleteString, {
		...options,
		withoutMdx: true
	});
	const completeNodes = markdownToSlateNodes(editor, completeString, options);
	if (incompleteNodes.length === 0) return completeNodes;
	const newBlock = {
		children: incompleteNodes,
		type: getPluginType(editor, KEYS.p)
	};
	if (completeNodes.length === 0) return [newBlock];
	const lastBlock = completeNodes.at(-1);
	if (ElementApi.isElement(lastBlock) && editor.api.isVoid(lastBlock)) return [newBlock];
	if (ElementApi.isElement(lastBlock) && lastBlock?.children) {
		lastBlock.children.push(...incompleteNodes);
		return completeNodes;
	}
	return completeNodes;
};

//#endregion
//#region src/lib/deserializer/utils/parseMarkdownBlocks.ts
const parseMarkdownBlocks = (content, { exclude = ["space"], trim = true } = {}) => {
	let tokens = [...marked.lexer(content)];
	if (exclude.length > 0) tokens = tokens.filter((token) => !exclude.includes(token.type));
	if (trim) tokens = tokens.map((token) => ({
		...token,
		raw: token.raw.trimEnd()
	}));
	return tokens;
};

//#endregion
//#region src/lib/deserializer/convertNodesDeserialize.ts
const convertNodesDeserialize = (nodes, deco, options) => {
	return nodes.reduce((acc, node) => {
		if (shouldIncludeNode(node, options)) acc.push(...buildSlateNode(node, deco, options));
		return acc;
	}, []);
};
const buildSlateNode = (mdastNode, deco, options) => {
	/** Handle custom mdx nodes */
	if (mdastNode.type === "mdxJsxTextElement" || mdastNode.type === "mdxJsxFlowElement") {
		const result = customMdxDeserialize(mdastNode, deco, options);
		return Array.isArray(result) ? result : [result];
	}
	const nodeParser = getDeserializerByKey(mdastToPlate(options.editor, mdastNode.type), options);
	if (nodeParser) {
		const result = nodeParser(mdastNode, deco, options);
		return Array.isArray(result) ? result : [result];
	}
	return [];
};
const shouldIncludeNode = (node, options) => {
	const { allowedNodes, allowNode, disallowedNodes } = options;
	if (!node.type) return true;
	const type = mdastToPlate(options.editor, node.type);
	if (allowedNodes && disallowedNodes && allowedNodes.length > 0 && disallowedNodes.length > 0) throw new Error("Cannot combine allowedNodes with disallowedNodes");
	if (allowedNodes) {
		if (!allowedNodes.includes(type)) return false;
	} else if (disallowedNodes?.includes(type)) return false;
	if (allowNode?.deserialize) return allowNode.deserialize({
		...node,
		type
	});
	return true;
};

//#endregion
//#region src/lib/deserializer/convertChildrenDeserialize.ts
const convertChildrenDeserialize = (children, deco, options) => {
	if (children.length === 0) return [{ text: "" }];
	return convertNodesDeserialize(children, deco, options);
};

//#endregion
//#region src/lib/deserializer/convertTextsDeserialize.ts
const convertTextsDeserialize = (mdastNode, deco, options) => mdastNode.children.reduce((acc, n) => {
	const key = mdastToPlate(options.editor, mdastNode.type);
	const type = getPluginType(options.editor, key);
	acc.push(...buildSlateNode(n, {
		...deco,
		[type]: true
	}, options));
	return acc;
}, []);

//#endregion
//#region src/lib/MarkdownPlugin.ts
const MarkdownPlugin = createTSlatePlugin({
	key: KEYS.markdown,
	options: {
		allowedNodes: null,
		disallowedNodes: null,
		plainMarks: null,
		remarkPlugins: [],
		remarkStringifyOptions: null,
		rules: null
	}
}).extendApi(({ editor }) => ({
	deserialize: bindFirst(deserializeMd, editor),
	deserializeInline: bindFirst(deserializeInlineMd, editor),
	serialize: bindFirst(serializeMd, editor)
})).extend(({ api }) => ({ parser: {
	format: "text/plain",
	deserialize: ({ data }) => api.markdown.deserialize(data),
	query: ({ data, dataTransfer }) => {
		if (dataTransfer.getData("text/html")) return false;
		const { files } = dataTransfer;
		if (!files?.length && isUrl(data)) return false;
		return true;
	}
} }));

//#endregion
//#region src/lib/plugins/remarkMdx.ts
const remarkMdx = tagRemarkPlugin(baseRemarkMdx, REMARK_MDX_TAG);

//#endregion
//#region ../../node_modules/unist-util-is/lib/index.js
/**
* Generate an assertion from a test.
*
* Useful if you’re going to test many nodes, for example when creating a
* utility where something else passes a compatible test.
*
* The created function is a bit faster because it expects valid input only:
* a `node`, `index`, and `parent`.
*
* @param {Test} test
*   *   when nullish, checks if `node` is a `Node`.
*   *   when `string`, works like passing `(node) => node.type === test`.
*   *   when `function` checks if function passed the node is true.
*   *   when `object`, checks that all keys in test are in node, and that they have (strictly) equal values.
*   *   when `array`, checks if any one of the subtests pass.
* @returns {Check}
*   An assertion.
*/
const convert = function(test) {
	if (test === null || test === void 0) return ok;
	if (typeof test === "function") return castFactory(test);
	if (typeof test === "object") return Array.isArray(test) ? anyFactory(test) : propsFactory(test);
	if (typeof test === "string") return typeFactory(test);
	throw new Error("Expected function, string, or object as test");
};
/**
* @param {Array<Props | TestFunction | string>} tests
* @returns {Check}
*/
function anyFactory(tests) {
	/** @type {Array<Check>} */
	const checks = [];
	let index = -1;
	while (++index < tests.length) checks[index] = convert(tests[index]);
	return castFactory(any);
	/**
	* @this {unknown}
	* @type {TestFunction}
	*/
	function any(...parameters) {
		let index$1 = -1;
		while (++index$1 < checks.length) if (checks[index$1].apply(this, parameters)) return true;
		return false;
	}
}
/**
* Turn an object into a test for a node with a certain fields.
*
* @param {Props} check
* @returns {Check}
*/
function propsFactory(check) {
	const checkAsRecord = check;
	return castFactory(all);
	/**
	* @param {Node} node
	* @returns {boolean}
	*/
	function all(node) {
		const nodeAsRecord = node;
		/** @type {string} */
		let key;
		for (key in check) if (nodeAsRecord[key] !== checkAsRecord[key]) return false;
		return true;
	}
}
/**
* Turn a string into a test for a node with a certain type.
*
* @param {string} check
* @returns {Check}
*/
function typeFactory(check) {
	return castFactory(type);
	/**
	* @param {Node} node
	*/
	function type(node) {
		return node && node.type === check;
	}
}
/**
* Turn a custom test into a test for a node that passes that test.
*
* @param {TestFunction} testFunction
* @returns {Check}
*/
function castFactory(testFunction) {
	return check;
	/**
	* @this {unknown}
	* @type {Check}
	*/
	function check(value, index, parent) {
		return Boolean(looksLikeANode(value) && testFunction.call(this, value, typeof index === "number" ? index : void 0, parent || void 0));
	}
}
function ok() {
	return true;
}
/**
* @param {unknown} value
* @returns {value is Node}
*/
function looksLikeANode(value) {
	return value !== null && typeof value === "object" && "type" in value;
}

//#endregion
//#region ../../node_modules/unist-util-visit-parents/lib/color.js
/**
* @param {string} d
* @returns {string}
*/
function color(d) {
	return d;
}

//#endregion
//#region ../../node_modules/unist-util-visit-parents/lib/index.js
/**
* @typedef {import('unist').Node} UnistNode
* @typedef {import('unist').Parent} UnistParent
*/
/**
* @typedef {Exclude<import('unist-util-is').Test, undefined> | undefined} Test
*   Test from `unist-util-is`.
*
*   Note: we have remove and add `undefined`, because otherwise when generating
*   automatic `.d.ts` files, TS tries to flatten paths from a local perspective,
*   which doesn’t work when publishing on npm.
*/
/**
* @typedef {(
*   Fn extends (value: any) => value is infer Thing
*   ? Thing
*   : Fallback
* )} Predicate
*   Get the value of a type guard `Fn`.
* @template Fn
*   Value; typically function that is a type guard (such as `(x): x is Y`).
* @template Fallback
*   Value to yield if `Fn` is not a type guard.
*/
/**
* @typedef {(
*   Check extends null | undefined // No test.
*   ? Value
*   : Value extends {type: Check} // String (type) test.
*   ? Value
*   : Value extends Check // Partial test.
*   ? Value
*   : Check extends Function // Function test.
*   ? Predicate<Check, Value> extends Value
*     ? Predicate<Check, Value>
*     : never
*   : never // Some other test?
* )} MatchesOne
*   Check whether a node matches a primitive check in the type system.
* @template Value
*   Value; typically unist `Node`.
* @template Check
*   Value; typically `unist-util-is`-compatible test, but not arrays.
*/
/**
* @typedef {(
*   Check extends Array<any>
*   ? MatchesOne<Value, Check[keyof Check]>
*   : MatchesOne<Value, Check>
* )} Matches
*   Check whether a node matches a check in the type system.
* @template Value
*   Value; typically unist `Node`.
* @template Check
*   Value; typically `unist-util-is`-compatible test.
*/
/**
* @typedef {0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10} Uint
*   Number; capped reasonably.
*/
/**
* @typedef {I extends 0 ? 1 : I extends 1 ? 2 : I extends 2 ? 3 : I extends 3 ? 4 : I extends 4 ? 5 : I extends 5 ? 6 : I extends 6 ? 7 : I extends 7 ? 8 : I extends 8 ? 9 : 10} Increment
*   Increment a number in the type system.
* @template {Uint} [I=0]
*   Index.
*/
/**
* @typedef {(
*   Node extends UnistParent
*   ? Node extends {children: Array<infer Children>}
*     ? Child extends Children ? Node : never
*     : never
*   : never
* )} InternalParent
*   Collect nodes that can be parents of `Child`.
* @template {UnistNode} Node
*   All node types in a tree.
* @template {UnistNode} Child
*   Node to search for.
*/
/**
* @typedef {InternalParent<InclusiveDescendant<Tree>, Child>} Parent
*   Collect nodes in `Tree` that can be parents of `Child`.
* @template {UnistNode} Tree
*   All node types in a tree.
* @template {UnistNode} Child
*   Node to search for.
*/
/**
* @typedef {(
*   Depth extends Max
*   ? never
*   :
*     | InternalParent<Node, Child>
*     | InternalAncestor<Node, InternalParent<Node, Child>, Max, Increment<Depth>>
* )} InternalAncestor
*   Collect nodes in `Tree` that can be ancestors of `Child`.
* @template {UnistNode} Node
*   All node types in a tree.
* @template {UnistNode} Child
*   Node to search for.
* @template {Uint} [Max=10]
*   Max; searches up to this depth.
* @template {Uint} [Depth=0]
*   Current depth.
*/
/**
* @typedef {InternalAncestor<InclusiveDescendant<Tree>, Child>} Ancestor
*   Collect nodes in `Tree` that can be ancestors of `Child`.
* @template {UnistNode} Tree
*   All node types in a tree.
* @template {UnistNode} Child
*   Node to search for.
*/
/**
* @typedef {(
*   Tree extends UnistParent
*     ? Depth extends Max
*       ? Tree
*       : Tree | InclusiveDescendant<Tree['children'][number], Max, Increment<Depth>>
*     : Tree
* )} InclusiveDescendant
*   Collect all (inclusive) descendants of `Tree`.
*
*   > 👉 **Note**: for performance reasons, this seems to be the fastest way to
*   > recurse without actually running into an infinite loop, which the
*   > previous version did.
*   >
*   > Practically, a max of `2` is typically enough assuming a `Root` is
*   > passed, but it doesn’t improve performance.
*   > It gets higher with `List > ListItem > Table > TableRow > TableCell`.
*   > Using up to `10` doesn’t hurt or help either.
* @template {UnistNode} Tree
*   Tree type.
* @template {Uint} [Max=10]
*   Max; searches up to this depth.
* @template {Uint} [Depth=0]
*   Current depth.
*/
/**
* @typedef {'skip' | boolean} Action
*   Union of the action types.
*
* @typedef {number} Index
*   Move to the sibling at `index` next (after node itself is completely
*   traversed).
*
*   Useful if mutating the tree, such as removing the node the visitor is
*   currently on, or any of its previous siblings.
*   Results less than 0 or greater than or equal to `children.length` stop
*   traversing the parent.
*
* @typedef {[(Action | null | undefined | void)?, (Index | null | undefined)?]} ActionTuple
*   List with one or two values, the first an action, the second an index.
*
* @typedef {Action | ActionTuple | Index | null | undefined | void} VisitorResult
*   Any value that can be returned from a visitor.
*/
/**
* @callback Visitor
*   Handle a node (matching `test`, if given).
*
*   Visitors are free to transform `node`.
*   They can also transform the parent of node (the last of `ancestors`).
*
*   Replacing `node` itself, if `SKIP` is not returned, still causes its
*   descendants to be walked (which is a bug).
*
*   When adding or removing previous siblings of `node` (or next siblings, in
*   case of reverse), the `Visitor` should return a new `Index` to specify the
*   sibling to traverse after `node` is traversed.
*   Adding or removing next siblings of `node` (or previous siblings, in case
*   of reverse) is handled as expected without needing to return a new `Index`.
*
*   Removing the children property of an ancestor still results in them being
*   traversed.
* @param {Visited} node
*   Found node.
* @param {Array<VisitedParents>} ancestors
*   Ancestors of `node`.
* @returns {VisitorResult}
*   What to do next.
*
*   An `Index` is treated as a tuple of `[CONTINUE, Index]`.
*   An `Action` is treated as a tuple of `[Action]`.
*
*   Passing a tuple back only makes sense if the `Action` is `SKIP`.
*   When the `Action` is `EXIT`, that action can be returned.
*   When the `Action` is `CONTINUE`, `Index` can be returned.
* @template {UnistNode} [Visited=UnistNode]
*   Visited node type.
* @template {UnistParent} [VisitedParents=UnistParent]
*   Ancestor type.
*/
/**
* @typedef {Visitor<Matches<InclusiveDescendant<Tree>, Check>, Ancestor<Tree, Matches<InclusiveDescendant<Tree>, Check>>>} BuildVisitor
*   Build a typed `Visitor` function from a tree and a test.
*
*   It will infer which values are passed as `node` and which as `parents`.
* @template {UnistNode} [Tree=UnistNode]
*   Tree type.
* @template {Test} [Check=Test]
*   Test type.
*/
/** @type {Readonly<ActionTuple>} */
const empty = [];
/**
* Continue traversing as normal.
*/
const CONTINUE = true;
/**
* Stop traversing immediately.
*/
const EXIT = false;
/**
* Do not traverse this node’s children.
*/
const SKIP = "skip";
/**
* Visit nodes, with ancestral information.
*
* This algorithm performs *depth-first* *tree traversal* in *preorder*
* (**NLR**) or if `reverse` is given, in *reverse preorder* (**NRL**).
*
* You can choose for which nodes `visitor` is called by passing a `test`.
* For complex tests, you should test yourself in `visitor`, as it will be
* faster and will have improved type information.
*
* Walking the tree is an intensive task.
* Make use of the return values of the visitor when possible.
* Instead of walking a tree multiple times, walk it once, use `unist-util-is`
* to check if a node matches, and then perform different operations.
*
* You can change the tree.
* See `Visitor` for more info.
*
* @overload
* @param {Tree} tree
* @param {Check} check
* @param {BuildVisitor<Tree, Check>} visitor
* @param {boolean | null | undefined} [reverse]
* @returns {undefined}
*
* @overload
* @param {Tree} tree
* @param {BuildVisitor<Tree>} visitor
* @param {boolean | null | undefined} [reverse]
* @returns {undefined}
*
* @param {UnistNode} tree
*   Tree to traverse.
* @param {Visitor | Test} test
*   `unist-util-is`-compatible test
* @param {Visitor | boolean | null | undefined} [visitor]
*   Handle each node.
* @param {boolean | null | undefined} [reverse]
*   Traverse in reverse preorder (NRL) instead of the default preorder (NLR).
* @returns {undefined}
*   Nothing.
*
* @template {UnistNode} Tree
*   Node type.
* @template {Test} Check
*   `unist-util-is`-compatible test.
*/
function visitParents(tree, test, visitor, reverse) {
	/** @type {Test} */
	let check;
	if (typeof test === "function" && typeof visitor !== "function") {
		reverse = visitor;
		visitor = test;
	} else check = test;
	const is = convert(check);
	const step = reverse ? -1 : 1;
	factory(tree, void 0, [])();
	/**
	* @param {UnistNode} node
	* @param {number | undefined} index
	* @param {Array<UnistParent>} parents
	*/
	function factory(node, index, parents) {
		const value = node && typeof node === "object" ? node : {};
		if (typeof value.type === "string") {
			const name = typeof value.tagName === "string" ? value.tagName : typeof value.name === "string" ? value.name : void 0;
			Object.defineProperty(visit$1, "name", { value: "node (" + color(node.type + (name ? "<" + name + ">" : "")) + ")" });
		}
		return visit$1;
		function visit$1() {
			/** @type {Readonly<ActionTuple>} */
			let result = empty;
			/** @type {Readonly<ActionTuple>} */
			let subresult;
			/** @type {number} */
			let offset;
			/** @type {Array<UnistParent>} */
			let grandparents;
			if (!test || is(node, index, parents[parents.length - 1] || void 0)) {
				result = toResult(visitor(node, parents));
				if (result[0] === EXIT) return result;
			}
			if ("children" in node && node.children) {
				const nodeAsParent = node;
				if (nodeAsParent.children && result[0] !== SKIP) {
					offset = (reverse ? nodeAsParent.children.length : -1) + step;
					grandparents = parents.concat(nodeAsParent);
					while (offset > -1 && offset < nodeAsParent.children.length) {
						const child = nodeAsParent.children[offset];
						subresult = factory(child, offset, grandparents)();
						if (subresult[0] === EXIT) return subresult;
						offset = typeof subresult[1] === "number" ? subresult[1] : offset + step;
					}
				}
			}
			return result;
		}
	}
}
/**
* Turn a return value into a clean result.
*
* @param {VisitorResult} value
*   Valid return values from visitors.
* @returns {Readonly<ActionTuple>}
*   Clean result.
*/
function toResult(value) {
	if (Array.isArray(value)) return value;
	if (typeof value === "number") return [CONTINUE, value];
	return value === null || value === void 0 ? empty : [value];
}

//#endregion
//#region ../../node_modules/unist-util-visit/lib/index.js
/**
* @typedef {import('unist').Node} UnistNode
* @typedef {import('unist').Parent} UnistParent
* @typedef {import('unist-util-visit-parents').VisitorResult} VisitorResult
*/
/**
* @typedef {Exclude<import('unist-util-is').Test, undefined> | undefined} Test
*   Test from `unist-util-is`.
*
*   Note: we have remove and add `undefined`, because otherwise when generating
*   automatic `.d.ts` files, TS tries to flatten paths from a local perspective,
*   which doesn’t work when publishing on npm.
*/
/**
* @typedef {(
*   Fn extends (value: any) => value is infer Thing
*   ? Thing
*   : Fallback
* )} Predicate
*   Get the value of a type guard `Fn`.
* @template Fn
*   Value; typically function that is a type guard (such as `(x): x is Y`).
* @template Fallback
*   Value to yield if `Fn` is not a type guard.
*/
/**
* @typedef {(
*   Check extends null | undefined // No test.
*   ? Value
*   : Value extends {type: Check} // String (type) test.
*   ? Value
*   : Value extends Check // Partial test.
*   ? Value
*   : Check extends Function // Function test.
*   ? Predicate<Check, Value> extends Value
*     ? Predicate<Check, Value>
*     : never
*   : never // Some other test?
* )} MatchesOne
*   Check whether a node matches a primitive check in the type system.
* @template Value
*   Value; typically unist `Node`.
* @template Check
*   Value; typically `unist-util-is`-compatible test, but not arrays.
*/
/**
* @typedef {(
*   Check extends Array<any>
*   ? MatchesOne<Value, Check[keyof Check]>
*   : MatchesOne<Value, Check>
* )} Matches
*   Check whether a node matches a check in the type system.
* @template Value
*   Value; typically unist `Node`.
* @template Check
*   Value; typically `unist-util-is`-compatible test.
*/
/**
* @typedef {0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10} Uint
*   Number; capped reasonably.
*/
/**
* @typedef {I extends 0 ? 1 : I extends 1 ? 2 : I extends 2 ? 3 : I extends 3 ? 4 : I extends 4 ? 5 : I extends 5 ? 6 : I extends 6 ? 7 : I extends 7 ? 8 : I extends 8 ? 9 : 10} Increment
*   Increment a number in the type system.
* @template {Uint} [I=0]
*   Index.
*/
/**
* @typedef {(
*   Node extends UnistParent
*   ? Node extends {children: Array<infer Children>}
*     ? Child extends Children ? Node : never
*     : never
*   : never
* )} InternalParent
*   Collect nodes that can be parents of `Child`.
* @template {UnistNode} Node
*   All node types in a tree.
* @template {UnistNode} Child
*   Node to search for.
*/
/**
* @typedef {InternalParent<InclusiveDescendant<Tree>, Child>} Parent
*   Collect nodes in `Tree` that can be parents of `Child`.
* @template {UnistNode} Tree
*   All node types in a tree.
* @template {UnistNode} Child
*   Node to search for.
*/
/**
* @typedef {(
*   Depth extends Max
*   ? never
*   :
*     | InternalParent<Node, Child>
*     | InternalAncestor<Node, InternalParent<Node, Child>, Max, Increment<Depth>>
* )} InternalAncestor
*   Collect nodes in `Tree` that can be ancestors of `Child`.
* @template {UnistNode} Node
*   All node types in a tree.
* @template {UnistNode} Child
*   Node to search for.
* @template {Uint} [Max=10]
*   Max; searches up to this depth.
* @template {Uint} [Depth=0]
*   Current depth.
*/
/**
* @typedef {(
*   Tree extends UnistParent
*     ? Depth extends Max
*       ? Tree
*       : Tree | InclusiveDescendant<Tree['children'][number], Max, Increment<Depth>>
*     : Tree
* )} InclusiveDescendant
*   Collect all (inclusive) descendants of `Tree`.
*
*   > 👉 **Note**: for performance reasons, this seems to be the fastest way to
*   > recurse without actually running into an infinite loop, which the
*   > previous version did.
*   >
*   > Practically, a max of `2` is typically enough assuming a `Root` is
*   > passed, but it doesn’t improve performance.
*   > It gets higher with `List > ListItem > Table > TableRow > TableCell`.
*   > Using up to `10` doesn’t hurt or help either.
* @template {UnistNode} Tree
*   Tree type.
* @template {Uint} [Max=10]
*   Max; searches up to this depth.
* @template {Uint} [Depth=0]
*   Current depth.
*/
/**
* @callback Visitor
*   Handle a node (matching `test`, if given).
*
*   Visitors are free to transform `node`.
*   They can also transform `parent`.
*
*   Replacing `node` itself, if `SKIP` is not returned, still causes its
*   descendants to be walked (which is a bug).
*
*   When adding or removing previous siblings of `node` (or next siblings, in
*   case of reverse), the `Visitor` should return a new `Index` to specify the
*   sibling to traverse after `node` is traversed.
*   Adding or removing next siblings of `node` (or previous siblings, in case
*   of reverse) is handled as expected without needing to return a new `Index`.
*
*   Removing the children property of `parent` still results in them being
*   traversed.
* @param {Visited} node
*   Found node.
* @param {Visited extends UnistNode ? number | undefined : never} index
*   Index of `node` in `parent`.
* @param {Ancestor extends UnistParent ? Ancestor | undefined : never} parent
*   Parent of `node`.
* @returns {VisitorResult}
*   What to do next.
*
*   An `Index` is treated as a tuple of `[CONTINUE, Index]`.
*   An `Action` is treated as a tuple of `[Action]`.
*
*   Passing a tuple back only makes sense if the `Action` is `SKIP`.
*   When the `Action` is `EXIT`, that action can be returned.
*   When the `Action` is `CONTINUE`, `Index` can be returned.
* @template {UnistNode} [Visited=UnistNode]
*   Visited node type.
* @template {UnistParent} [Ancestor=UnistParent]
*   Ancestor type.
*/
/**
* @typedef {Visitor<Visited, Parent<Ancestor, Visited>>} BuildVisitorFromMatch
*   Build a typed `Visitor` function from a node and all possible parents.
*
*   It will infer which values are passed as `node` and which as `parent`.
* @template {UnistNode} Visited
*   Node type.
* @template {UnistParent} Ancestor
*   Parent type.
*/
/**
* @typedef {(
*   BuildVisitorFromMatch<
*     Matches<Descendant, Check>,
*     Extract<Descendant, UnistParent>
*   >
* )} BuildVisitorFromDescendants
*   Build a typed `Visitor` function from a list of descendants and a test.
*
*   It will infer which values are passed as `node` and which as `parent`.
* @template {UnistNode} Descendant
*   Node type.
* @template {Test} Check
*   Test type.
*/
/**
* @typedef {(
*   BuildVisitorFromDescendants<
*     InclusiveDescendant<Tree>,
*     Check
*   >
* )} BuildVisitor
*   Build a typed `Visitor` function from a tree and a test.
*
*   It will infer which values are passed as `node` and which as `parent`.
* @template {UnistNode} [Tree=UnistNode]
*   Node type.
* @template {Test} [Check=Test]
*   Test type.
*/
/**
* Visit nodes.
*
* This algorithm performs *depth-first* *tree traversal* in *preorder*
* (**NLR**) or if `reverse` is given, in *reverse preorder* (**NRL**).
*
* You can choose for which nodes `visitor` is called by passing a `test`.
* For complex tests, you should test yourself in `visitor`, as it will be
* faster and will have improved type information.
*
* Walking the tree is an intensive task.
* Make use of the return values of the visitor when possible.
* Instead of walking a tree multiple times, walk it once, use `unist-util-is`
* to check if a node matches, and then perform different operations.
*
* You can change the tree.
* See `Visitor` for more info.
*
* @overload
* @param {Tree} tree
* @param {Check} check
* @param {BuildVisitor<Tree, Check>} visitor
* @param {boolean | null | undefined} [reverse]
* @returns {undefined}
*
* @overload
* @param {Tree} tree
* @param {BuildVisitor<Tree>} visitor
* @param {boolean | null | undefined} [reverse]
* @returns {undefined}
*
* @param {UnistNode} tree
*   Tree to traverse.
* @param {Visitor | Test} testOrVisitor
*   `unist-util-is`-compatible test (optional, omit to pass a visitor).
* @param {Visitor | boolean | null | undefined} [visitorOrReverse]
*   Handle each node (when test is omitted, pass `reverse`).
* @param {boolean | null | undefined} [maybeReverse=false]
*   Traverse in reverse preorder (NRL) instead of the default preorder (NLR).
* @returns {undefined}
*   Nothing.
*
* @template {UnistNode} Tree
*   Node type.
* @template {Test} Check
*   `unist-util-is`-compatible test.
*/
function visit(tree, testOrVisitor, visitorOrReverse, maybeReverse) {
	/** @type {boolean | null | undefined} */
	let reverse;
	/** @type {Test} */
	let test;
	/** @type {Visitor} */
	let visitor;
	if (typeof testOrVisitor === "function" && typeof visitorOrReverse !== "function") {
		test = void 0;
		visitor = testOrVisitor;
		reverse = visitorOrReverse;
	} else {
		test = testOrVisitor;
		visitor = visitorOrReverse;
		reverse = maybeReverse;
	}
	visitParents(tree, test, overload, reverse);
	/**
	* @param {UnistNode} node
	* @param {Array<UnistParent>} parents
	*/
	function overload(node, parents) {
		const parent = parents[parents.length - 1];
		const index = parent ? parent.children.indexOf(node) : void 0;
		return visitor(node, index, parent);
	}
}

//#endregion
//#region src/lib/plugins/remarkMention.ts
/**
* A remark plugin that converts @username patterns and [display
* text](mention:id) patterns in text nodes into mention nodes. This plugin runs
* after remark-gfm and transforms mention patterns into special mention nodes
* that can be later converted into Plate mention elements.
*
* Supports two formats:
*
* - @username - Simple mention format (no spaces allowed)
* - [display text](mention:id) - Markdown link-style format (supports spaces)
*/
const remarkMention = () => (tree) => {
	visit(tree, "link", (node, index, parent) => {
		if (!parent || typeof index !== "number") return;
		if (node.url?.startsWith("mention:")) {
			let username = node.url.slice(8);
			username = decodeURIComponent(username);
			const displayText = node.children?.[0]?.value || username;
			const mentionNode = {
				children: [{
					type: "text",
					value: displayText
				}],
				displayText,
				type: "mention",
				username
			};
			parent.children[index] = mentionNode;
		}
	});
	visit(tree, "text", (node, index, parent) => {
		if (!parent || typeof index !== "number") return;
		if (parent.type === "link") return;
		const atMentionPattern = /(?:^|\s)@([a-zA-Z0-9_-]+)(?=[\s.,;:!?)]|$)/g;
		const parts = [];
		let lastIndex = 0;
		const text = node.value;
		const allMatches = [];
		let match;
		while (true) {
			match = atMentionPattern.exec(text);
			if (!match) break;
			const mentionStart = match[0].startsWith(" ") ? match.index + 1 : match.index;
			const mentionEnd = mentionStart + match[0].length - (match[0].startsWith(" ") ? 1 : 0);
			allMatches.push({
				end: mentionEnd,
				node: {
					children: [{
						type: "text",
						value: `@${match[1]}`
					}],
					type: "mention",
					username: match[1]
				},
				start: mentionStart
			});
		}
		allMatches.sort((a, b) => a.start - b.start);
		for (const matchInfo of allMatches) {
			if (matchInfo.start > lastIndex) parts.push({
				type: "text",
				value: text.slice(lastIndex, matchInfo.start)
			});
			parts.push(matchInfo.node);
			lastIndex = matchInfo.end;
		}
		if (lastIndex < text.length) parts.push({
			type: "text",
			value: text.slice(lastIndex)
		});
		if (parts.length > 0) parent.children.splice(index, 1, ...parts);
	});
};

//#endregion
export { MarkdownPlugin, REMARK_MDX_TAG, basicMarkdownMarks, buildMdastNode, buildRules, buildSlateNode, columnRules, convertChildrenDeserialize, convertNodesDeserialize, convertNodesSerialize, convertTextsDeserialize, convertTextsSerialize, customMdxDeserialize, defaultRules, deserializeInlineMd, deserializeMd, fontRules, getCustomMark, getDeserializerByKey, getMergedOptionsDeserialize, getMergedOptionsSerialize, getRemarkPluginsWithoutMdx, getSerializerByKey, getStyleValue, htmlToJsx, listToMdastTree, markdownToAstProcessor, markdownToSlateNodes, markdownToSlateNodesSafely, mdastToPlate, mdastToSlate, mediaRules, parseAttributes, parseMarkdownBlocks, plateToMdast, propsToAttributes, remarkMdx, remarkMention, serializeInlineMd, serializeMd, splitIncompleteMdx, stripMarkdown, stripMarkdownBlocks, stripMarkdownInline, tagRemarkPlugin, unreachable, wrapWithBlockId };