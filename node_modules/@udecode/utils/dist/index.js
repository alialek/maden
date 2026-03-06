//#region src/environment.ts
const IS_APPLE = typeof navigator !== "undefined" && navigator.userAgent.includes("Mac OS X");

//#endregion
//#region src/escapeRegexp.ts
const escapeRegExp = (text) => text.replaceAll(/[#$()*+,.?[\\\]^s{|}-]/g, String.raw`\$&`);

//#endregion
//#region src/findHtmlParentElement.ts
const findHtmlParentElement = (el, nodeName) => {
	if (!el || el.nodeName === nodeName) return el;
	return findHtmlParentElement(el.parentElement, nodeName);
};

//#endregion
//#region src/getHandler.ts
/** Call a handler if defined */
const getHandler = (cb, ...args) => () => {
	cb?.(...args);
};

//#endregion
//#region src/hexToBase64.ts
const hexToBase64 = (hex) => {
	const binary = (hex.match(/\w{2}/g) || []).map((hexPair) => String.fromCodePoint(Number.parseInt(hexPair, 16)));
	return btoa(binary.join(""));
};

//#endregion
//#region src/isUrl.ts
/**
* RegExps. A URL must match #1 and then at least one of #2/#3. Use two levels
* of REs to avoid REDOS.
*/
const protocolAndDomainRE = /^(?:\w+:)?\/\/(\S+)$/;
const emailLintRE = /mailto:([^?\\]+)/;
const localhostDomainRE = /^localhost[\d:?]*(?:[^\d:?]\S*)?$/;
const nonLocalhostDomainRE = /^[^\s.]+\.\S{2,}$/;
/** Loosely validate a URL `string`. */
const isUrl = (string) => {
	if (typeof string !== "string") return false;
	const generalMatch = protocolAndDomainRE.exec(string);
	const emailLinkMatch = emailLintRE.exec(string);
	const match = generalMatch || emailLinkMatch;
	if (!match) return false;
	const everythingAfterProtocol = match[1];
	if (!everythingAfterProtocol) return false;
	try {
		new URL(string);
	} catch {
		return false;
	}
	return localhostDomainRE.test(everythingAfterProtocol) || nonLocalhostDomainRE.test(everythingAfterProtocol);
};

//#endregion
//#region src/mergeProps.ts
/** Merge props by composing handlers. */
const mergeProps = (props, overrideProps, { handlerKeys, handlerQuery = (key) => key.startsWith("on") } = {}) => {
	const map = /* @__PURE__ */ new Map();
	const acc = {};
	const mapProps = (_props) => {
		if (!_props) return;
		Object.entries(_props).forEach(([key, value]) => {
			if ((!handlerKeys || handlerKeys.includes(key)) && (!handlerQuery || handlerQuery(key)) && typeof value === "function") {
				if (!map.has(key)) map.set(key, []);
				map.get(key)?.push(value);
				acc[key] = (...args) => {
					const fns = map.get(key);
					if (fns) for (const fn of fns) fn(...args);
				};
			} else acc[key] = value;
		});
	};
	mapProps(props);
	mapProps(overrideProps);
	return acc;
};

//#endregion
//#region src/sanitizeUrl.ts
const sanitizeUrl = (url, { allowedSchemes, permitInvalid = false }) => {
	if (!url) return null;
	if (url.startsWith("/") || url.startsWith("#")) return url;
	let parsedUrl = null;
	try {
		parsedUrl = new URL(url);
	} catch {
		return permitInvalid ? url : null;
	}
	if (allowedSchemes && !allowedSchemes.includes(parsedUrl.protocol.slice(0, -1))) return null;
	return parsedUrl.href;
};

//#endregion
//#region src/type-utils.ts
/** @returns Whether the provided parameter is undefined. */
const isUndefined = (obj) => obj === void 0;
const isNull = (obj) => obj === null;
/** @returns Whether the provided parameter is undefined or null. */
const isUndefinedOrNull = (obj) => isUndefined(obj) || isNull(obj);
/** @returns Whether the provided parameter is defined. */
const isDefined = (arg) => !isUndefinedOrNull(arg);
function bindFirst(fn, firstArg) {
	return (...args) => fn(firstArg, ...args);
}

//#endregion
export { IS_APPLE, bindFirst, escapeRegExp, findHtmlParentElement, getHandler, hexToBase64, isDefined, isNull, isUndefined, isUndefinedOrNull, isUrl, mergeProps, sanitizeUrl };