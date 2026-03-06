import { c } from "react-compiler-runtime";
import { Slot } from "@radix-ui/react-slot";
import React from "react";
import ReactDOM from "react-dom";
import { isDefined } from "@udecode/utils";
import { clsx } from "clsx";

//#region src/createSlotComponent.tsx
const createSlotComponent = (element) => React.forwardRef((t0, ref) => {
	const $ = c(8);
	let as;
	let props;
	let t1;
	if ($[0] !== t0) {
		({as, asChild: t1, ...props} = t0);
		$[0] = t0;
		$[1] = as;
		$[2] = props;
		$[3] = t1;
	} else {
		as = $[1];
		props = $[2];
		t1 = $[3];
	}
	const Comp = (t1 === void 0 ? false : t1) ? Slot : as || element;
	let t2;
	if ($[4] !== Comp || $[5] !== props || $[6] !== ref) {
		t2 = /* @__PURE__ */ React.createElement(Comp, {
			ref,
			...props
		});
		$[4] = Comp;
		$[5] = props;
		$[6] = ref;
		$[7] = t2;
	} else t2 = $[7];
	return t2;
});

//#endregion
//#region src/Box.tsx
const Box = createSlotComponent("div");

//#endregion
//#region src/MemoizedChildren.tsx
const MemoizedChildren = React.memo((t0) => {
	const $ = c(2);
	const { children } = t0;
	let t1;
	if ($[0] !== children) {
		t1 = /* @__PURE__ */ React.createElement(React.Fragment, null, children);
		$[0] = children;
		$[1] = t1;
	} else t1 = $[1];
	return t1;
});

//#endregion
//#region src/PortalBody.tsx
const PortalBody = ({ children, element }) => {
	if (!(element || typeof window !== "undefined" ? document.body : void 0)) return children;
	return ReactDOM.createPortal(children, element || document.body);
};

//#endregion
//#region src/Text.tsx
const Text = createSlotComponent("span");

//#endregion
//#region src/composeEventHandlers.ts
/** @see https://github.com/radix-ui/primitives/blob/b324ec2d7ddf13a2a115cb5b11478e24d2f45b87/packages/core/primitive/src/primitive.tsx#L1 */
const composeEventHandlers = (originalEventHandler, ourEventHandler, { checkForDefaultPrevented = true } = {}) => (event) => {
	originalEventHandler?.(event);
	if (checkForDefaultPrevented === false || !event.defaultPrevented) return ourEventHandler?.(event);
};

//#endregion
//#region src/useComposedRef.ts
/**
* Set a given ref to a given value This utility takes care of different types
* of refs: callback refs and React.RefObject(s)
*/
const setRef = (ref, value) => {
	if (typeof ref === "function") return ref(value);
	if (ref !== null && ref !== void 0) ref.current = value;
};
/**
* A utility to compose multiple refs together Accepts callback refs and
* React.RefObject(s)
*/
const composeRefs = (...refs) => (node) => {
	const cleanups = [];
	refs.forEach((ref) => {
		const cleanup = setRef(ref, node);
		if (typeof cleanup === "function") cleanups.push(cleanup);
	});
	if (cleanups.length > 0) return () => {
		for (const cleanup of cleanups) cleanup?.();
	};
};
/**
* A custom hook that composes multiple refs Accepts callback refs and
* React.RefObject(s)
*/
const useComposedRef = (...refs) => {
	return React.useCallback(composeRefs(...refs), refs);
};

//#endregion
//#region src/createPrimitiveComponent.tsx
/**
* Primitive component factory. It uses hooks for managing state and props, and
* forwards references to child components. Component props:
*
* - `asChild`: If true, the component will be rendered as a `Slot`
*   {@link https://www.radix-ui.com/docs/primitives/utilities/slot}.
* - `options`: Options passed to the state hook.
* - `state`: Provide your state instead of using the state hook.
* - `className`: Class name to be merged to the component.
* - `style`: Style object to be merged to the component.
* - `setProps`: Function to set props from the props hook.
* - `...props`: Props to be passed to the component. Props hook return value:
* - `ref`: Reference to be forwarded to the component.
* - `props`: Props to be passed to the component.
* - `hidden`: If true, the component will not be rendered.
*
* @example
*   const MyButton = createPrimitiveComponent(Button)({
*     stateHook: useButtonState,
*     propsHook: useButton,
*   });
*
* @param {React.ElementType} element The base component or native HTML element.
* @returns {function} A primitive component.
*/
const createPrimitiveComponent = (element) => {
	const Comp = createSlotComponent(element);
	return ({ propsHook, stateHook } = {}) => React.forwardRef((t0, ref) => {
		const $ = c(9);
		const { asChild, className: classNameProp, getClassName, options, state: stateProp, ...props } = t0;
		const state = isDefined(stateProp) ? stateProp : stateHook ? stateHook(options) : void 0;
		const { hidden, props: hookProps, ref: hookRef } = propsHook ? propsHook(state) : {
			hidden: false,
			props: {},
			ref: null
		};
		const _ref = useComposedRef(ref, hookRef);
		const className = isDefined(hookProps?.className) || isDefined(classNameProp) ? clsx(hookProps?.className, classNameProp) : void 0;
		const style = hookProps?.style || props.style ? {
			...hookProps?.style,
			...props.style
		} : void 0;
		if (!asChild && hidden) return null;
		const T0 = Comp;
		const t1 = props.setProps?.(hookProps ?? {}) ?? {};
		let t2;
		if ($[0] !== T0 || $[1] !== _ref || $[2] !== asChild || $[3] !== className || $[4] !== hookProps || $[5] !== props || $[6] !== style || $[7] !== t1) {
			t2 = /* @__PURE__ */ React.createElement(T0, {
				asChild,
				ref: _ref,
				...hookProps,
				className,
				style,
				...props,
				...t1
			});
			$[0] = T0;
			$[1] = _ref;
			$[2] = asChild;
			$[3] = className;
			$[4] = hookProps;
			$[5] = props;
			$[6] = style;
			$[7] = t1;
			$[8] = t2;
		} else t2 = $[8];
		return t2;
	});
};

//#endregion
//#region src/createPrimitiveElement.tsx
function createPrimitiveElement(tag) {
	return React.forwardRef(function CreateComponent(props, ref) {
		return React.createElement(tag, {
			...props,
			ref
		});
	});
}

//#endregion
//#region src/useEffectOnce.ts
function useEffectOnce(effect, deps) {
	const initialized = React.useRef(false);
	const prevDepsRef = React.useRef(deps);
	React.useEffect(() => {
		const depsChanged = deps.some((dep, i) => dep !== prevDepsRef.current[i]);
		if (!initialized.current || depsChanged) {
			initialized.current = true;
			prevDepsRef.current = deps;
			effect();
		}
	}, deps);
}

//#endregion
//#region src/useIsomorphicLayoutEffect.ts
const CAN_USE_DOM = typeof window !== "undefined" && window.document?.createElement !== void 0;
/**
* Prevent warning on SSR by falling back to React.useEffect when DOM isn't
* available
*/
const useIsomorphicLayoutEffect = CAN_USE_DOM ? React.useLayoutEffect : React.useEffect;

//#endregion
//#region src/useMemoizedSelector.ts
/**
* Re-render only when the selector result changes.
*
* @param selector A function that derives a value from deps
* @param deps Dependencies on which to run the selector
* @param equalityFn Optional comparison function to detect changes in the
*   derived value
*/
function useMemoizedSelector(selector, deps, equalityFn = (a, b) => a === b) {
	const [memoizedValue, setMemoizedValue] = React.useState(() => selector());
	const previousValueRef = React.useRef(memoizedValue);
	React.useEffect(() => {
		const newValue = selector();
		if (!equalityFn(previousValueRef.current, newValue)) {
			setMemoizedValue(newValue);
			previousValueRef.current = newValue;
		}
	}, deps);
	return memoizedValue;
}

//#endregion
//#region src/useOnClickOutside.ts
const canUsePassiveEvents = () => {
	if (typeof window === "undefined" || typeof window.addEventListener !== "function") return false;
	let passive = false;
	const options = Object.defineProperty({}, "passive", { get() {
		passive = true;
	} });
	const noop = () => null;
	window.addEventListener("test", noop, options);
	window.removeEventListener("test", noop, options);
	return passive;
};
const DEFAULT_IGNORE_CLASS = "ignore-onclickoutside";
const checkClass = (el, cl) => el.classList?.contains(cl);
const hasIgnoreClass = (e, ignoreClass) => {
	let el = e.target || e;
	while (el) {
		if (Array.isArray(ignoreClass)) {
			if (ignoreClass.some((c$1) => checkClass(el, c$1))) return true;
		} else if (checkClass(el, ignoreClass)) return true;
		el = el.parentElement;
	}
	return false;
};
const clickedOnScrollbar = (e) => document.documentElement.clientWidth <= e.clientX || document.documentElement.clientHeight <= e.clientY;
const getEventOptions = (type) => type.includes("touch") && canUsePassiveEvents() ? { passive: true } : false;
const useOnClickOutside = (callback, { detectIFrame = true, disabled, eventTypes = ["mousedown", "touchstart"], excludeScrollbar, ignoreClass = DEFAULT_IGNORE_CLASS, refs: refsOpt } = {}) => {
	const [refsState, setRefsState] = React.useState([]);
	const callbackRef = React.useRef(callback);
	callbackRef.current = callback;
	const ref = React.useCallback((el) => setRefsState((prevState) => [...prevState, { current: el }]), []);
	React.useEffect(() => {
		if (!refsOpt?.length && refsState.length === 0) return;
		const getEls = () => {
			const els = [];
			for (const { current } of refsOpt || refsState) if (current) els.push(current);
			return els;
		};
		const handler = (e) => {
			if (!hasIgnoreClass(e, ignoreClass) && !(excludeScrollbar && clickedOnScrollbar(e)) && getEls().every((el) => !el.contains(e.target))) callbackRef.current(e);
		};
		const blurHandler = (e) => setTimeout(() => {
			const { activeElement } = document;
			if (activeElement?.tagName === "IFRAME" && !hasIgnoreClass(activeElement, ignoreClass) && !getEls().includes(activeElement)) callbackRef.current(e);
		}, 0);
		const removeEventListener = () => {
			for (const type of eventTypes) document.removeEventListener(type, handler, getEventOptions(type));
			if (detectIFrame) window.removeEventListener("blur", blurHandler);
		};
		if (disabled) {
			removeEventListener();
			return;
		}
		for (const type of eventTypes) document.addEventListener(type, handler, getEventOptions(type));
		if (detectIFrame) window.addEventListener("blur", blurHandler);
		return () => removeEventListener();
	}, [
		refsState,
		ignoreClass,
		excludeScrollbar,
		disabled,
		detectIFrame,
		JSON.stringify(eventTypes)
	]);
	return ref;
};

//#endregion
//#region src/useStableFn.ts
/**
* Create a stable version of a function that can be used in dependency arrays
* without causing hooks like useEffect to re-run if the function changes.
* Calling the returned function always calls the most recent version of the
* function that was passed to useStableFn.
*
* If you do want the function to be replaced when certain dependency values
* change, include those values in the dependency array of useStableFn.
*/
const useStableFn = (fn, deps = []) => {
	const fnRef = React.useRef(fn);
	fnRef.current = fn;
	return React.useCallback((...args) => fnRef.current(...args), deps);
};

//#endregion
//#region src/useStableMemo.ts
const useStableMemo = (producer, deps) => {
	const [value, setValue] = React.useState(producer);
	React.useLayoutEffect(() => {
		setValue(producer);
	}, deps);
	return value;
};

//#endregion
//#region src/withProviders.tsx
/** biome-ignore-all lint/correctness/useJsxKeyInIterable: biome */
/**
* Wrap a component into multiple providers. If there are any props that you
* want a provider to receive, you can simply pass an array.
*/
const withProviders = (...providers) => (WrappedComponent) => (props) => providers.reduceRight((acc, prov) => {
	let Provider = prov;
	if (Array.isArray(prov)) {
		[Provider] = prov;
		return /* @__PURE__ */ React.createElement(Provider, prov[1], acc);
	}
	return /* @__PURE__ */ React.createElement(Provider, null, acc);
}, /* @__PURE__ */ React.createElement(WrappedComponent, props));

//#endregion
//#region src/withRef.tsx
/**
* Shorter alternative to `React.forwardRef`.
*
* @generic1 Component type or element type
* @generic2 Extended prop types
*/
function withRef(renderFunction) {
	return React.forwardRef(renderFunction);
}

//#endregion
export { Box, CAN_USE_DOM, DEFAULT_IGNORE_CLASS, MemoizedChildren, PortalBody, Text, composeEventHandlers, composeRefs, createPrimitiveComponent, createPrimitiveElement, createSlotComponent, useComposedRef, useEffectOnce, useIsomorphicLayoutEffect, useMemoizedSelector, useOnClickOutside, useStableFn, useStableMemo, withProviders, withRef };