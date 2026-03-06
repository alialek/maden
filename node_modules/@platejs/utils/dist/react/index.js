import { t as KEYS } from "../plate-keys-C2YNmTqZ.js";
import { getContainerTypes } from "@platejs/core";
import { c } from "react-compiler-runtime";
import { createTPlatePlugin, useEditorComposing, useEditorReadOnly, useEditorRef, useEditorSelector, useFocused, usePluginOption } from "@platejs/core/react";
import React from "react";

//#region src/react/hooks/useEditorString.ts
const useEditorString = () => {
	const $ = c(1);
	let t0;
	if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
		t0 = [];
		$[0] = t0;
	} else t0 = $[0];
	return useEditorSelector(_temp$4, t0);
};
function _temp$4(editor) {
	return editor.api.string([]);
}

//#endregion
//#region src/react/hooks/useFormInputProps.ts
/**
* Hook to allow the user to spread a set of predefined props to the Div wrapper
* of an Input element
*
* @param param0 An options object which can be expanded to add further
*   functionality
* @returns A props object which can be spread onto the element
*/
const useFormInputProps = (options) => {
	if (!options) return { props: {} };
	const { preventDefaultOnEnterKeydown } = options;
	/**
	* Handle the keydown capture event and prevent the default behaviour when the
	* user presses enter.
	*
	* In the event the user presses enter on a field such as a link, prior to
	* filling in both label and url, the default behaviour is to submit the form.
	* This, ultimately, results in no link being added as you need to fill both
	* fields to pass validation.
	*
	* By calling preventDefault we short circuit the form's submission thus
	* allowing the user to continue filling in the other fields
	*
	* @param e The original event which was provided by the VDOM implement their
	*   own behaviour on this event
	*/
	const handleEnterKeydownCapture = (e) => {
		if (e.key === "Enter" || e.keyCode === 13) e.preventDefault();
	};
	return { props: { onKeyDownCapture: preventDefaultOnEnterKeydown ? (e) => handleEnterKeydownCapture(e) : void 0 } };
};

//#endregion
//#region src/react/hooks/useMarkToolbarButton.ts
const useMarkToolbarButtonState = (t0) => {
	const $ = c(7);
	const { clear, nodeType } = t0;
	let t1;
	let t2;
	if ($[0] !== nodeType) {
		t1 = (editor) => editor.api.hasMark(nodeType);
		t2 = [nodeType];
		$[0] = nodeType;
		$[1] = t1;
		$[2] = t2;
	} else {
		t1 = $[1];
		t2 = $[2];
	}
	const pressed = useEditorSelector(t1, t2);
	let t3;
	if ($[3] !== clear || $[4] !== nodeType || $[5] !== pressed) {
		t3 = {
			clear,
			nodeType,
			pressed
		};
		$[3] = clear;
		$[4] = nodeType;
		$[5] = pressed;
		$[6] = t3;
	} else t3 = $[6];
	return t3;
};
const useMarkToolbarButton = (state) => {
	const $ = c(7);
	const editor = useEditorRef();
	let t0;
	if ($[0] !== editor || $[1] !== state.clear || $[2] !== state.nodeType) {
		t0 = () => {
			editor.tf.toggleMark(state.nodeType, { remove: state.clear });
			editor.tf.focus();
		};
		$[0] = editor;
		$[1] = state.clear;
		$[2] = state.nodeType;
		$[3] = t0;
	} else t0 = $[3];
	let t1;
	if ($[4] !== state.pressed || $[5] !== t0) {
		t1 = { props: {
			pressed: state.pressed,
			onClick: t0,
			onMouseDown: _temp$3
		} };
		$[4] = state.pressed;
		$[5] = t0;
		$[6] = t1;
	} else t1 = $[6];
	return t1;
};
function _temp$3(e) {
	e.preventDefault();
}

//#endregion
//#region src/react/hooks/useRemoveNodeButton.ts
const useRemoveNodeButton = (t0) => {
	const $ = c(3);
	const { element } = t0;
	const editor = useEditorRef();
	let t1;
	if ($[0] !== editor || $[1] !== element) {
		t1 = { props: {
			onClick: () => {
				const path = editor.api.findPath(element);
				editor.tf.removeNodes({ at: path });
			},
			onMouseDown: _temp$2
		} };
		$[0] = editor;
		$[1] = element;
		$[2] = t1;
	} else t1 = $[2];
	return t1;
};
function _temp$2(e) {
	e.preventDefault();
}

//#endregion
//#region src/react/hooks/useSelection.ts
function useSelectionCollapsed() {
	const $ = c(1);
	let t0;
	if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
		t0 = [];
		$[0] = t0;
	} else t0 = $[0];
	return useEditorSelector(_temp$1, t0);
}
function _temp$1(editor) {
	return !editor.api.isExpanded();
}
function useSelectionExpanded() {
	const $ = c(1);
	let t0;
	if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
		t0 = [];
		$[0] = t0;
	} else t0 = $[0];
	return useEditorSelector(_temp2, t0);
}
function _temp2(editor) {
	return editor.api.isExpanded();
}
function useSelectionWithinBlock() {
	const $ = c(1);
	let t0;
	if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
		t0 = [];
		$[0] = t0;
	} else t0 = $[0];
	return useEditorSelector(_temp3, t0);
}
function _temp3(editor) {
	return editor.api.isAt({ block: true });
}
function useSelectionAcrossBlocks() {
	const $ = c(1);
	let t0;
	if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
		t0 = [];
		$[0] = t0;
	} else t0 = $[0];
	return useEditorSelector(_temp4, t0);
}
function _temp4(editor) {
	return editor.api.isAt({ blocks: true });
}

//#endregion
//#region src/react/hooks/useSelectionFragment.ts
const useSelectionFragment = () => {
	const $ = c(1);
	let t0;
	if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
		t0 = [];
		$[0] = t0;
	} else t0 = $[0];
	return useEditorSelector(_temp, t0);
};
const useSelectionFragmentProp = (t0) => {
	const $ = c(5);
	let t1;
	if ($[0] !== t0) {
		t1 = t0 === void 0 ? {} : t0;
		$[0] = t0;
		$[1] = t1;
	} else t1 = $[1];
	const options = t1;
	let t2;
	if ($[2] !== options) {
		t2 = (editor) => {
			const fragment = editor.api.fragment(editor.selection, { unwrap: getContainerTypes(editor) });
			return editor.api.prop({
				nodes: fragment,
				...options
			});
		};
		$[2] = options;
		$[3] = t2;
	} else t2 = $[3];
	let t3;
	if ($[4] === Symbol.for("react.memo_cache_sentinel")) {
		t3 = [];
		$[4] = t3;
	} else t3 = $[4];
	return useEditorSelector(t2, t3);
};
function _temp(editor) {
	return editor.api.fragment(editor.selection, { unwrap: getContainerTypes(editor) });
}

//#endregion
//#region src/react/plugins/BlockPlaceholderPlugin.tsx
const BlockPlaceholderPlugin = createTPlatePlugin({
	key: KEYS.blockPlaceholder,
	editOnly: true,
	options: {
		_target: null,
		placeholders: { [KEYS.p]: "Type something..." },
		query: ({ path }) => path.length === 1
	},
	useHooks: (ctx) => {
		const { editor, getOptions, setOption } = ctx;
		const focused = useFocused();
		const readOnly = useEditorReadOnly();
		const composing = useEditorComposing();
		const entry = useEditorSelector(() => {
			if (readOnly || composing || !focused || !editor.selection || editor.api.isExpanded()) return null;
			return editor.api.block();
		}, [
			readOnly,
			composing,
			focused
		]);
		React.useEffect(() => {
			if (!entry) {
				setOption("_target", null);
				return;
			}
			const { placeholders, query } = getOptions();
			const [element, path] = entry;
			const placeholder = Object.keys(placeholders).find((key) => editor.getType(key) === element.type);
			if (query({
				...ctx,
				node: element,
				path
			}) && placeholder && editor.api.isEmpty(element) && !editor.api.isEmpty()) setOption("_target", {
				node: element,
				placeholder: placeholders[placeholder]
			});
			else setOption("_target", null);
		}, [
			editor,
			entry,
			setOption,
			getOptions
		]);
	}
}).extendSelectors(({ getOption }) => ({ placeholder: (node) => {
	const target = getOption("_target");
	if (target?.node === node) return target.placeholder;
} })).extend({ inject: {
	isBlock: true,
	nodeProps: { transformProps: (props) => {
		const placeholder = usePluginOption(props.plugin, "placeholder", props.element);
		if (placeholder) return {
			className: props.getOption("className"),
			placeholder
		};
	} }
} });

//#endregion
export { BlockPlaceholderPlugin, useEditorString, useFormInputProps, useMarkToolbarButton, useMarkToolbarButtonState, useRemoveNodeButton, useSelectionAcrossBlocks, useSelectionCollapsed, useSelectionExpanded, useSelectionFragment, useSelectionFragmentProp, useSelectionWithinBlock };