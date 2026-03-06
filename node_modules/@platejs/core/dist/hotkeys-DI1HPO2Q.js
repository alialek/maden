import { IS_APPLE } from "@udecode/utils";
import { isHotkey, isKeyHotkey } from "is-hotkey";

//#region src/lib/utils/hotkeys.ts
/** Hotkey mappings for each platform. */
const HOTKEYS = {
	bold: "mod+b",
	compose: [
		"down",
		"left",
		"right",
		"up",
		"backspace",
		"enter"
	],
	deleteBackward: "shift?+backspace",
	deleteForward: "shift?+delete",
	escape: "escape",
	extendBackward: "shift+left",
	extendDownward: "shift+down",
	extendForward: "shift+right",
	extendUpward: "shift+up",
	insertSoftBreak: "shift+enter",
	italic: "mod+i",
	moveBackward: "left",
	moveDownward: "down",
	moveForward: "right",
	moveUpward: "up",
	moveWordBackward: "ctrl+left",
	moveWordForward: "ctrl+right",
	selectAll: "mod+a",
	splitBlock: "enter",
	tab: "tab",
	undo: "mod+z",
	untab: "shift+tab"
};
const APPLE_HOTKEYS = {
	deleteBackward: ["ctrl+backspace", "ctrl+h"],
	deleteForward: ["ctrl+delete", "ctrl+d"],
	deleteLineBackward: "cmd+shift?+backspace",
	deleteLineForward: ["cmd+shift?+delete", "ctrl+k"],
	deleteWordBackward: "opt+shift?+backspace",
	deleteWordForward: "opt+shift?+delete",
	extendLineBackward: "opt+shift+up",
	extendLineForward: "opt+shift+down",
	moveLineBackward: "opt+up",
	moveLineForward: "opt+down",
	moveWordBackward: "opt+left",
	moveWordForward: "opt+right",
	redo: "cmd+shift+z",
	transposeCharacter: "ctrl+t"
};
const WINDOWS_HOTKEYS = {
	deleteWordBackward: "ctrl+shift?+backspace",
	deleteWordForward: "ctrl+shift?+delete",
	redo: ["ctrl+y", "ctrl+shift+z"]
};
/** Create a platform-aware hotkey checker. */
const createHotkey = (key) => {
	const generic = HOTKEYS[key];
	const apple = APPLE_HOTKEYS[key];
	const windows = WINDOWS_HOTKEYS[key];
	const isGeneric = generic && isKeyHotkey(generic);
	const isApple = apple && isKeyHotkey(apple);
	const isWindows = windows && isKeyHotkey(windows);
	return (event) => {
		if (isGeneric?.(event)) return true;
		if (IS_APPLE && isApple?.(event)) return true;
		if (!IS_APPLE && isWindows?.(event)) return true;
		return false;
	};
};
const createComposing = (key) => (editor, event, { composing } = {}) => {
	if (!createHotkey(key)(event)) return false;
	if (!!composing !== editor.api.isComposing()) return false;
	return true;
};
const Hotkeys = {
	isBold: createHotkey("bold"),
	isCompose: createHotkey("compose"),
	isDeleteBackward: createHotkey("deleteBackward"),
	isDeleteForward: createHotkey("deleteForward"),
	isDeleteLineBackward: createHotkey("deleteLineBackward"),
	isDeleteLineForward: createHotkey("deleteLineForward"),
	isDeleteWordBackward: createHotkey("deleteWordBackward"),
	isDeleteWordForward: createHotkey("deleteWordForward"),
	isEscape: createHotkey("escape"),
	isExtendBackward: createHotkey("extendBackward"),
	isExtendDownward: createHotkey("extendDownward"),
	isExtendForward: createHotkey("extendForward"),
	isExtendLineBackward: createHotkey("extendLineBackward"),
	isExtendLineForward: createHotkey("extendLineForward"),
	isExtendUpward: createHotkey("extendUpward"),
	isItalic: createHotkey("italic"),
	isMoveBackward: createHotkey("moveBackward"),
	isMoveDownward: createHotkey("moveDownward"),
	isMoveForward: createHotkey("moveForward"),
	isMoveLineBackward: createHotkey("moveLineBackward"),
	isMoveLineForward: createHotkey("moveLineForward"),
	isMoveUpward: createHotkey("moveUpward"),
	isMoveWordBackward: createHotkey("moveWordBackward"),
	isMoveWordForward: createHotkey("moveWordForward"),
	isRedo: createHotkey("redo"),
	isSelectAll: createHotkey("selectAll"),
	isSoftBreak: createHotkey("insertSoftBreak"),
	isSplitBlock: createHotkey("splitBlock"),
	isTab: createComposing("tab"),
	isTransposeCharacter: createHotkey("transposeCharacter"),
	isUndo: createHotkey("undo"),
	isUntab: createComposing("untab")
};

//#endregion
export { createHotkey as n, isHotkey as r, Hotkeys as t };