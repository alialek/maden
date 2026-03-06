import { c } from "react-compiler-runtime";
import React, { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

//#region src/internal/BoundHotkeysProxyProvider.tsx
const BoundHotkeysProxyProvider = createContext(void 0);
const useBoundHotkeysProxy = () => {
	return useContext(BoundHotkeysProxyProvider);
};
function BoundHotkeysProxyProviderProvider(t0) {
	const $ = c(6);
	const { addHotkey, children, removeHotkey } = t0;
	let t1;
	if ($[0] !== addHotkey || $[1] !== removeHotkey) {
		t1 = {
			addHotkey,
			removeHotkey
		};
		$[0] = addHotkey;
		$[1] = removeHotkey;
		$[2] = t1;
	} else t1 = $[2];
	let t2;
	if ($[3] !== children || $[4] !== t1) {
		t2 = /* @__PURE__ */ React.createElement(BoundHotkeysProxyProvider.Provider, { value: t1 }, children);
		$[3] = children;
		$[4] = t1;
		$[5] = t2;
	} else t2 = $[5];
	return t2;
}

//#endregion
//#region src/internal/deepEqual.ts
function deepEqual(x, y) {
	return x && y && typeof x === "object" && typeof y === "object" ? Object.keys(x).length === Object.keys(y).length && Object.keys(x).reduce((isEqual, key) => isEqual && deepEqual(x[key], y[key]), true) : x === y;
}

//#endregion
//#region src/internal/HotkeysProvider.tsx
const HotkeysContext = createContext({
	activeScopes: [],
	hotkeys: [],
	disableScope: () => {},
	enableScope: () => {},
	toggleScope: () => {}
});
const useHotkeysContext = () => {
	return useContext(HotkeysContext);
};
const HotkeysProvider = (t0) => {
	const $ = c(16);
	const { children, initiallyActiveScopes: t1 } = t0;
	let t2;
	if ($[0] !== t1) {
		t2 = t1 === void 0 ? ["*"] : t1;
		$[0] = t1;
		$[1] = t2;
	} else t2 = $[1];
	const [internalActiveScopes, setInternalActiveScopes] = useState(t2);
	let t3;
	if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
		t3 = [];
		$[2] = t3;
	} else t3 = $[2];
	const [boundHotkeys, setBoundHotkeys] = useState(t3);
	let t4;
	if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
		t4 = (scope) => {
			setInternalActiveScopes((prev) => {
				if (prev.includes("*")) return [scope];
				return Array.from(new Set([scope, ...prev]));
			});
		};
		$[3] = t4;
	} else t4 = $[3];
	const enableScope = t4;
	let t5;
	if ($[4] === Symbol.for("react.memo_cache_sentinel")) {
		t5 = (scope_0) => {
			setInternalActiveScopes((prev_0) => prev_0.filter((s) => s !== scope_0));
		};
		$[4] = t5;
	} else t5 = $[4];
	const disableScope = t5;
	let t6;
	if ($[5] === Symbol.for("react.memo_cache_sentinel")) {
		t6 = (scope_1) => {
			setInternalActiveScopes((prev_1) => {
				if (prev_1.includes(scope_1)) return prev_1.filter((s_0) => s_0 !== scope_1);
				if (prev_1.includes("*")) return [scope_1];
				return Array.from(new Set([scope_1, ...prev_1]));
			});
		};
		$[5] = t6;
	} else t6 = $[5];
	const toggleScope = t6;
	let t7;
	if ($[6] === Symbol.for("react.memo_cache_sentinel")) {
		t7 = (hotkey) => {
			setBoundHotkeys((prev_2) => [...prev_2, hotkey]);
		};
		$[6] = t7;
	} else t7 = $[6];
	const addBoundHotkey = t7;
	let t8;
	if ($[7] === Symbol.for("react.memo_cache_sentinel")) {
		t8 = (hotkey_0) => {
			setBoundHotkeys((prev_3) => prev_3.filter((h) => !deepEqual(h, hotkey_0)));
		};
		$[7] = t8;
	} else t8 = $[7];
	const removeBoundHotkey = t8;
	let t9;
	if ($[8] !== boundHotkeys || $[9] !== internalActiveScopes) {
		t9 = {
			activeScopes: internalActiveScopes,
			disableScope,
			enableScope,
			hotkeys: boundHotkeys,
			toggleScope
		};
		$[8] = boundHotkeys;
		$[9] = internalActiveScopes;
		$[10] = t9;
	} else t9 = $[10];
	let t10;
	if ($[11] !== children) {
		t10 = /* @__PURE__ */ React.createElement(BoundHotkeysProxyProviderProvider, {
			addHotkey: addBoundHotkey,
			removeHotkey: removeBoundHotkey
		}, children);
		$[11] = children;
		$[12] = t10;
	} else t10 = $[12];
	let t11;
	if ($[13] !== t10 || $[14] !== t9) {
		t11 = /* @__PURE__ */ React.createElement(HotkeysContext.Provider, { value: t9 }, t10);
		$[13] = t10;
		$[14] = t9;
		$[15] = t11;
	} else t11 = $[15];
	return t11;
};

//#endregion
//#region src/internal/parseHotkeys.ts
const reservedModifierKeywords = new Set([
	"alt",
	"control",
	"ctrl",
	"meta",
	"mod",
	"shift"
]);
const mappedKeys = {
	AltLeft: "alt",
	AltRight: "alt",
	ControlLeft: "ctrl",
	ControlRight: "ctrl",
	down: "arrowdown",
	esc: "escape",
	left: "arrowleft",
	MetaLeft: "meta",
	MetaRight: "meta",
	OSLeft: "meta",
	OSRight: "meta",
	return: "enter",
	right: "arrowright",
	ShiftLeft: "shift",
	ShiftRight: "shift",
	up: "arrowup"
};
const KEY_PREFIX_REGEX = /key|digit|numpad/;
function mapKey(key) {
	return (mappedKeys[key.trim()] || key.trim()).toLowerCase().replace(KEY_PREFIX_REGEX, "");
}
function isHotkeyModifier(key) {
	return reservedModifierKeywords.has(key);
}
function parseKeysHookInput(keys, delimiter = ",") {
	return keys.toLowerCase().split(delimiter);
}
function parseHotkey(hotkey, splitKey = "+", useKey = false, description) {
	const keys = hotkey.toLocaleLowerCase().split(splitKey).map((k) => mapKey(k));
	const modifiers = {
		alt: keys.includes("alt"),
		ctrl: keys.includes("ctrl") || keys.includes("control"),
		meta: keys.includes("meta"),
		mod: keys.includes("mod"),
		shift: keys.includes("shift"),
		useKey
	};
	const singleCharKeys = keys.filter((k) => !reservedModifierKeywords.has(k));
	return {
		...modifiers,
		keys: singleCharKeys,
		description
	};
}

//#endregion
//#region src/internal/isHotkeyPressed.ts
(() => {
	if (typeof document !== "undefined") {
		document.addEventListener("keydown", (e) => {
			if (e.code === void 0) return;
			pushToCurrentlyPressedKeys([mapKey(e.code)]);
		});
		document.addEventListener("keyup", (e) => {
			if (e.code === void 0) return;
			removeFromCurrentlyPressedKeys([mapKey(e.code)]);
		});
	}
	if (typeof window !== "undefined") window.addEventListener("blur", () => {
		currentlyPressedKeys.clear();
	});
})();
const currentlyPressedKeys = /* @__PURE__ */ new Set();
function isReadonlyArray(value) {
	return Array.isArray(value);
}
function isHotkeyPressed(key, delimiter = ",") {
	return (isReadonlyArray(key) ? key : key.split(delimiter)).every((hotkey) => currentlyPressedKeys.has(hotkey.trim().toLowerCase()));
}
function pushToCurrentlyPressedKeys(key) {
	const hotkeyArray = Array.isArray(key) ? key : [key];
	if (currentlyPressedKeys.has("meta")) {
		for (const key$1 of currentlyPressedKeys) if (!isHotkeyModifier(key$1)) currentlyPressedKeys.delete(key$1.toLowerCase());
	}
	for (const hotkey of hotkeyArray) currentlyPressedKeys.add(hotkey.toLowerCase());
}
function removeFromCurrentlyPressedKeys(key) {
	const hotkeyArray = Array.isArray(key) ? key : [key];
	if (key === "meta") currentlyPressedKeys.clear();
	else for (const hotkey of hotkeyArray) currentlyPressedKeys.delete(hotkey.toLowerCase());
}

//#endregion
//#region src/internal/key.ts
/**
* A const enum that includes all non-printable string values one can expect
* from $event.key. For example, this enum includes values like "CapsLock",
* "Backspace", and "AudioVolumeMute", but does not include values like "a",
* "A", "#", "é", or "¿". Auto generated from MDN:
* https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values#Speech_recognition_keys
*/
const Key = {
	Accept: "Accept",
	Add: "Add",
	Again: "Again",
	AllCandidates: "AllCandidates",
	Alphanumeric: "Alphanumeric",
	Alt: "Alt",
	AltGraph: "AltGraph",
	AppSwitch: "AppSwitch",
	ArrowDown: "ArrowDown",
	ArrowLeft: "ArrowLeft",
	ArrowRight: "ArrowRight",
	ArrowUp: "ArrowUp",
	Attn: "Attn",
	AudioBalanceLeft: "AudioBalanceLeft",
	AudioBalanceRight: "AudioBalanceRight",
	AudioBassBoostDown: "AudioBassBoostDown",
	AudioBassBoostToggle: "AudioBassBoostToggle",
	AudioBassBoostUp: "AudioBassBoostUp",
	AudioBassDown: "AudioBassDown",
	AudioBassUp: "AudioBassUp",
	AudioFaderFront: "AudioFaderFront",
	AudioFaderRear: "AudioFaderRear",
	AudioSurroundModeNext: "AudioSurroundModeNext",
	AudioTrebleDown: "AudioTrebleDown",
	AudioTrebleUp: "AudioTrebleUp",
	AudioVolumeDown: "AudioVolumeDown",
	AudioVolumeMute: "AudioVolumeMute",
	AudioVolumeUp: "AudioVolumeUp",
	AVRInput: "AVRInput",
	AVRPower: "AVRPower",
	Backspace: "Backspace",
	BrightnessDown: "BrightnessDown",
	BrightnessUp: "BrightnessUp",
	BrowserBack: "BrowserBack",
	BrowserFavorites: "BrowserFavorites",
	BrowserForward: "BrowserForward",
	BrowserHome: "BrowserHome",
	BrowserRefresh: "BrowserRefresh",
	BrowserSearch: "BrowserSearch",
	BrowserStop: "BrowserStop",
	Call: "Call",
	Camera: "Camera",
	CameraFocus: "CameraFocus",
	Cancel: "Cancel",
	CapsLock: "CapsLock",
	ChannelDown: "ChannelDown",
	ChannelUp: "ChannelUp",
	Clear: "Clear",
	Close: "Close",
	ClosedCaptionToggle: "ClosedCaptionToggle",
	CodeInput: "CodeInput",
	ColorF0Red: "ColorF0Red",
	ColorF1Green: "ColorF1Green",
	ColorF2Yellow: "ColorF2Yellow",
	ColorF3Blue: "ColorF3Blue",
	ColorF4Grey: "ColorF4Grey",
	ColorF5Brown: "ColorF5Brown",
	Compose: "Compose",
	ContextMenu: "ContextMenu",
	Control: "Control",
	Convert: "Convert",
	Copy: "Copy",
	CrSel: "CrSel",
	Cut: "Cut",
	Dead: "Dead",
	Decimal: "Decimal",
	Delete: "Delete",
	Dimmer: "Dimmer",
	DisplaySwap: "DisplaySwap",
	Divide: "Divide",
	DVR: "DVR",
	Eisu: "Eisu",
	Eject: "Eject",
	End: "End",
	EndCall: "EndCall",
	Enter: "Enter",
	EraseEof: "EraseEof",
	Escape: "Escape",
	Execute: "Execute",
	Exit: "Exit",
	ExSel: "ExSel",
	F1: "F1",
	F2: "F2",
	F3: "F3",
	F4: "F4",
	F5: "F5",
	F6: "F6",
	F7: "F7",
	F8: "F8",
	F9: "F9",
	F10: "F10",
	F11: "F11",
	F12: "F12",
	F13: "F13",
	F14: "F14",
	F15: "F15",
	F16: "F16",
	F17: "F17",
	F18: "F18",
	F19: "F19",
	F20: "F20",
	FavoriteClear0: "FavoriteClear0",
	FavoriteClear1: "FavoriteClear1",
	FavoriteClear2: "FavoriteClear2",
	FavoriteClear3: "FavoriteClear3",
	FavoriteRecall0: "FavoriteRecall0",
	FavoriteRecall1: "FavoriteRecall1",
	FavoriteRecall2: "FavoriteRecall2",
	FavoriteRecall3: "FavoriteRecall3",
	FavoriteStore0: "FavoriteStore0",
	FavoriteStore1: "FavoriteStore1",
	FavoriteStore2: "FavoriteStore2",
	FavoriteStore3: "FavoriteStore3",
	FinalMode: "FinalMode",
	Find: "Find",
	Finish: "Finish",
	Fn: "Fn",
	FnLock: "FnLock",
	GoBack: "GoBack",
	GoHome: "GoHome",
	GroupFirst: "GroupFirst",
	GroupLast: "GroupLast",
	GroupNext: "GroupNext",
	GroupPrevious: "GroupPrevious",
	Guide: "Guide",
	GuideNextDay: "GuideNextDay",
	GuidePreviousDay: "GuidePreviousDay",
	HangulMode: "HangulMode",
	HanjaMode: "HanjaMode",
	Hankaku: "Hankaku",
	HeadsetHook: "HeadsetHook",
	Help: "Help",
	Hibernate: "Hibernate",
	Hiragana: "Hiragana",
	HiraganaKatakana: "HiraganaKatakana",
	Home: "Home",
	Hyper: "Hyper",
	Info: "Info",
	Insert: "Insert",
	InstantReplay: "InstantReplay",
	JunjaMode: "JunjaMode",
	KanaMode: "KanaMode",
	KanjiMode: "KanjiMode",
	Katakana: "Katakana",
	Key11: "Key11",
	Key12: "Key12",
	LastNumberRedial: "LastNumberRedial",
	LaunchApplication1: "LaunchApplication1",
	LaunchApplication2: "LaunchApplication2",
	LaunchApplication3: "LaunchApplication3",
	LaunchApplication4: "LaunchApplication4",
	LaunchApplication5: "LaunchApplication5",
	LaunchApplication6: "LaunchApplication6",
	LaunchApplication7: "LaunchApplication7",
	LaunchApplication8: "LaunchApplication8",
	LaunchApplication9: "LaunchApplication9",
	LaunchApplication10: "LaunchApplication10",
	LaunchApplication11: "LaunchApplication11",
	LaunchApplication12: "LaunchApplication12",
	LaunchApplication13: "LaunchApplication13",
	LaunchApplication14: "LaunchApplication14",
	LaunchApplication15: "LaunchApplication15",
	LaunchApplication16: "LaunchApplication16",
	LaunchCalculator: "LaunchCalculator",
	LaunchCalendar: "LaunchCalendar",
	LaunchContacts: "LaunchContacts",
	LaunchMail: "LaunchMail",
	LaunchMediaPlayer: "LaunchMediaPlayer",
	LaunchMusicPlayer: "LaunchMusicPlayer",
	LaunchMyComputer: "LaunchMyComputer",
	LaunchPhone: "LaunchPhone",
	LaunchScreenSaver: "LaunchScreenSaver",
	LaunchSpreadsheet: "LaunchSpreadsheet",
	LaunchWebBrowser: "LaunchWebBrowser",
	LaunchWebCam: "LaunchWebCam",
	LaunchWordProcessor: "LaunchWordProcessor",
	Link: "Link",
	ListProgram: "ListProgram",
	LiveContent: "LiveContent",
	Lock: "Lock",
	LogOff: "LogOff",
	MailForward: "MailForward",
	MailReply: "MailReply",
	MailSend: "MailSend",
	MannerMode: "MannerMode",
	MediaApps: "MediaApps",
	MediaAudioTrack: "MediaAudioTrack",
	MediaFastForward: "MediaFastForward",
	MediaLast: "MediaLast",
	MediaPause: "MediaPause",
	MediaPlay: "MediaPlay",
	MediaPlayPause: "MediaPlayPause",
	MediaRecord: "MediaRecord",
	MediaRewind: "MediaRewind",
	MediaSkipBackward: "MediaSkipBackward",
	MediaSkipForward: "MediaSkipForward",
	MediaStepBackward: "MediaStepBackward",
	MediaStepForward: "MediaStepForward",
	MediaStop: "MediaStop",
	MediaTopMenu: "MediaTopMenu",
	MediaTrackNext: "MediaTrackNext",
	MediaTrackPrevious: "MediaTrackPrevious",
	Meta: "Meta",
	MicrophoneToggle: "MicrophoneToggle",
	MicrophoneVolumeDown: "MicrophoneVolumeDown",
	MicrophoneVolumeMute: "MicrophoneVolumeMute",
	MicrophoneVolumeUp: "MicrophoneVolumeUp",
	Mod: "Mod",
	ModeChange: "ModeChange",
	Multiply: "Multiply",
	NavigateIn: "NavigateIn",
	NavigateNext: "NavigateNext",
	NavigateOut: "NavigateOut",
	NavigatePrevious: "NavigatePrevious",
	New: "New",
	NextCandidate: "NextCandidate",
	NextFavoriteChannel: "NextFavoriteChannel",
	NextUserProfile: "NextUserProfile",
	NonConvert: "NonConvert",
	Notification: "Notification",
	NumLock: "NumLock",
	OnDemand: "OnDemand",
	Open: "Open",
	PageDown: "PageDown",
	PageUp: "PageUp",
	Pairing: "Pairing",
	Paste: "Paste",
	Pause: "Pause",
	PinPDown: "PinPDown",
	PinPMove: "PinPMove",
	PinPToggle: "PinPToggle",
	PinPUp: "PinPUp",
	Play: "Play",
	PlaySpeedDown: "PlaySpeedDown",
	PlaySpeedReset: "PlaySpeedReset",
	PlaySpeedUp: "PlaySpeedUp",
	Power: "Power",
	PowerOff: "PowerOff",
	PreviousCandidate: "PreviousCandidate",
	Print: "Print",
	PrintScreen: "PrintScreen",
	Process: "Process",
	Props: "Props",
	RandomToggle: "RandomToggle",
	RcLowBattery: "RcLowBattery",
	RecordSpeedNext: "RecordSpeedNext",
	Redo: "Redo",
	RfBypass: "RfBypass",
	Romaji: "Romaji",
	Save: "Save",
	ScanChannelsToggle: "ScanChannelsToggle",
	ScreenModeNext: "ScreenModeNext",
	ScrollLock: "ScrollLock",
	Select: "Select",
	Separator: "Separator",
	Settings: "Settings",
	Shift: "Shift",
	SingleCandidate: "SingleCandidate",
	Soft1: "Soft1",
	Soft2: "Soft2",
	Soft3: "Soft3",
	Soft4: "Soft4",
	SpeechCorrectionList: "SpeechCorrectionList",
	SpeechInputToggle: "SpeechInputToggle",
	SpellCheck: "SpellCheck",
	SplitScreenToggle: "SplitScreenToggle",
	Standby: "Standby",
	STBInput: "STBInput",
	STBPower: "STBPower",
	Subtitle: "Subtitle",
	Subtract: "Subtract",
	Super: "Super",
	Symbol: "Symbol",
	SymbolLock: "SymbolLock",
	Tab: "Tab",
	Teletext: "Teletext",
	TV: "TV",
	TV3DMode: "TV3DMode",
	TVAntennaCable: "TVAntennaCable",
	TVAudioDescription: "TVAudioDescription",
	TVAudioDescriptionMixDown: "TVAudioDescriptionMixDown",
	TVAudioDescriptionMixUp: "TVAudioDescriptionMixUp",
	TVContentsMenu: "TVContentsMenu",
	TVDataService: "TVDataService",
	TVInput: "TVInput",
	TVInputComponent1: "TVInputComponent1",
	TVInputComponent2: "TVInputComponent2",
	TVInputComposite1: "TVInputComposite1",
	TVInputComposite2: "TVInputComposite2",
	TVInputHDMI1: "TVInputHDMI1",
	TVInputHDMI2: "TVInputHDMI2",
	TVInputHDMI3: "TVInputHDMI3",
	TVInputHDMI4: "TVInputHDMI4",
	TVInputVGA1: "TVInputVGA1",
	TVMediaContext: "TVMediaContext",
	TVNetwork: "TVNetwork",
	TVNumberEntry: "TVNumberEntry",
	TVPower: "TVPower",
	TVRadioService: "TVRadioService",
	TVSatellite: "TVSatellite",
	TVSatelliteBS: "TVSatelliteBS",
	TVSatelliteCS: "TVSatelliteCS",
	TVSatelliteToggle: "TVSatelliteToggle",
	TVTerrestrialAnalog: "TVTerrestrialAnalog",
	TVTerrestrialDigital: "TVTerrestrialDigital",
	TVTimer: "TVTimer",
	Undo: "Undo",
	Unidentified: "Unidentified",
	VideoModeNext: "VideoModeNext",
	VoiceDial: "VoiceDial",
	WakeUp: "WakeUp",
	Wink: "Wink",
	Zenkaku: "Zenkaku",
	ZenkakuHanaku: "ZenkakuHanaku",
	ZoomIn: "ZoomIn",
	ZoomOut: "ZoomOut",
	ZoomToggle: "ZoomToggle"
};

//#endregion
//#region src/internal/useDeepEqualMemo.ts
function useDeepEqualMemo(value) {
	const ref = useRef(void 0);
	if (!deepEqual(ref.current, value)) ref.current = value;
	return ref.current;
}

//#endregion
//#region src/internal/validators.ts
function maybePreventDefault(e, hotkey, preventDefault) {
	if (typeof preventDefault === "function" && preventDefault(e, hotkey) || preventDefault === true) e.preventDefault();
}
function isHotkeyEnabled(e, hotkey, enabled) {
	if (typeof enabled === "function") return enabled(e, hotkey);
	return enabled === true || enabled === void 0;
}
function isKeyboardEventTriggeredByInput(ev) {
	return isHotkeyEnabledOnTag(ev, [
		"input",
		"textarea",
		"select"
	]);
}
function isHotkeyEnabledOnTag({ target }, enabledOnTags = false) {
	const targetTagName = target && target.tagName;
	if (isReadonlyArray(enabledOnTags)) return Boolean(targetTagName && enabledOnTags?.some((tag) => tag.toLowerCase() === targetTagName.toLowerCase()));
	return Boolean(targetTagName && enabledOnTags && enabledOnTags);
}
function isScopeActive(activeScopes, scopes) {
	if (activeScopes.length === 0 && scopes) {
		console.warn("A hotkey has the \"scopes\" option set, however no active scopes were found. If you want to use the global scopes feature, you need to wrap your app in a <HotkeysProvider>");
		return true;
	}
	if (!scopes) return true;
	return activeScopes.some((scope) => scopes.includes(scope)) || activeScopes.includes("*");
}
const isHotkeyMatchingKeyboardEvent = (e, hotkey, ignoreModifiers = false) => {
	const { keys, alt, ctrl, meta, mod, shift, useKey } = hotkey;
	const { key: producedKey, altKey, code, ctrlKey, metaKey, shiftKey } = e;
	const mappedCode = mapKey(code);
	if (useKey && keys?.length === 1 && keys.includes(producedKey)) return true;
	if (!keys?.includes(mappedCode) && ![
		"alt",
		"control",
		"ctrl",
		"meta",
		"os",
		"shift",
		"unknown"
	].includes(mappedCode)) return false;
	if (!ignoreModifiers) {
		if (alt !== altKey && mappedCode !== "alt") return false;
		if (shift !== shiftKey && mappedCode !== "shift") return false;
		if (mod) {
			if (!metaKey && !ctrlKey) return false;
		} else {
			if (meta !== metaKey && mappedCode !== "meta" && mappedCode !== "os") return false;
			if (ctrl !== ctrlKey && mappedCode !== "ctrl" && mappedCode !== "control") return false;
		}
	}
	if (keys && keys.length === 1 && keys.includes(mappedCode)) return true;
	if (keys) return isHotkeyPressed(keys);
	if (!keys) return true;
	return false;
};

//#endregion
//#region src/internal/useHotkeys.ts
const stopPropagation = (e) => {
	e.stopPropagation();
	e.preventDefault();
	e.stopImmediatePropagation();
};
const useSafeLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;
function useHotkeys(keys, callback, options, dependencies) {
	const [ref, setRef] = useState(null);
	const hasTriggeredRef = useRef(false);
	const _options = Array.isArray(options) ? Array.isArray(dependencies) ? void 0 : dependencies : options;
	const _keys = useMemo(() => {
		if (Array.isArray(keys) && keys.length > 0 && Array.isArray(keys[0])) return keys.map((keyCombo) => keyCombo.map((k) => k.toString()).join(_options?.splitKey || "+")).join(_options?.delimiter || ",");
		if (Array.isArray(keys)) return keys.join(_options?.delimiter || ",");
		return keys;
	}, [
		keys,
		_options?.splitKey,
		_options?.delimiter
	]);
	const _deps = Array.isArray(options) ? options : Array.isArray(dependencies) ? dependencies : void 0;
	const memoisedCB = useCallback(callback, _deps ?? []);
	const cbRef = useRef(memoisedCB);
	cbRef.current = _deps ? memoisedCB : callback;
	const memoisedOptions = useDeepEqualMemo(_options);
	const { activeScopes } = useHotkeysContext();
	const proxy = useBoundHotkeysProxy();
	useSafeLayoutEffect(() => {
		if (memoisedOptions?.enabled === false || !isScopeActive(activeScopes, memoisedOptions?.scopes)) return;
		const listener = (e, isKeyUp = false) => {
			if (isKeyboardEventTriggeredByInput(e) && !isHotkeyEnabledOnTag(e, memoisedOptions?.enableOnFormTags)) return;
			if (ref !== null) {
				const rootNode = ref.getRootNode();
				if ((rootNode instanceof Document || rootNode instanceof ShadowRoot) && rootNode.activeElement !== ref && !ref.contains(rootNode.activeElement)) {
					stopPropagation(e);
					return;
				}
			}
			if (e.target?.isContentEditable && !memoisedOptions?.enableOnContentEditable) return;
			parseKeysHookInput(_keys, memoisedOptions?.delimiter).forEach((key) => {
				const hotkey = parseHotkey(key, memoisedOptions?.splitKey, memoisedOptions?.useKey);
				if (isHotkeyMatchingKeyboardEvent(e, hotkey, memoisedOptions?.ignoreModifiers) || hotkey.keys?.includes("*")) {
					if ((memoisedOptions?.ignoreEventWhenPrevented ?? true) && e.defaultPrevented) return;
					if (memoisedOptions?.ignoreEventWhen?.(e)) return;
					if (isKeyUp && hasTriggeredRef.current) return;
					if (!isHotkeyEnabled(e, hotkey, memoisedOptions?.enabled)) {
						stopPropagation(e);
						return;
					}
					cbRef.current(e, hotkey);
					maybePreventDefault(e, hotkey, memoisedOptions?.preventDefault);
					if (!isKeyUp) hasTriggeredRef.current = true;
				}
			});
		};
		const handleKeyDown = (event) => {
			if (event.code === void 0) return;
			pushToCurrentlyPressedKeys(mapKey(event.code));
			if (memoisedOptions?.keydown === void 0 && memoisedOptions?.keyup !== true || memoisedOptions?.keydown) listener(event);
		};
		const handleKeyUp = (event) => {
			if (event.code === void 0) return;
			removeFromCurrentlyPressedKeys(mapKey(event.code));
			hasTriggeredRef.current = false;
			if (memoisedOptions?.keyup) listener(event, true);
		};
		const domNode = ref || _options?.document || document;
		domNode.addEventListener("keyup", handleKeyUp);
		domNode.addEventListener("keydown", handleKeyDown);
		if (proxy) for (const key of parseKeysHookInput(_keys, memoisedOptions?.delimiter)) proxy.addHotkey(parseHotkey(key, memoisedOptions?.splitKey, memoisedOptions?.useKey, memoisedOptions?.description));
		return () => {
			domNode.removeEventListener("keyup", handleKeyUp);
			domNode.removeEventListener("keydown", handleKeyDown);
			if (proxy) for (const key of parseKeysHookInput(_keys, memoisedOptions?.delimiter)) proxy.removeHotkey(parseHotkey(key, memoisedOptions?.splitKey, memoisedOptions?.useKey, memoisedOptions?.description));
		};
	}, [
		ref,
		_keys,
		memoisedOptions,
		activeScopes
	]);
	return setRef;
}

//#endregion
//#region src/internal/useRecordHotkeys.ts
function useRecordHotkeys() {
	const $ = c(10);
	let t0;
	if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
		t0 = /* @__PURE__ */ new Set();
		$[0] = t0;
	} else t0 = $[0];
	const [keys, setKeys] = useState(t0);
	const [isRecording, setIsRecording] = useState(false);
	let t1;
	if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
		t1 = (event) => {
			if (event.code === void 0) return;
			event.preventDefault();
			event.stopPropagation();
			setKeys((prev) => {
				const newKeys = new Set(prev);
				newKeys.add(mapKey(event.code));
				return newKeys;
			});
		};
		$[1] = t1;
	} else t1 = $[1];
	const handler = t1;
	let t2;
	if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
		t2 = () => {
			if (typeof document !== "undefined") {
				document.removeEventListener("keydown", handler);
				setIsRecording(false);
			}
		};
		$[2] = t2;
	} else t2 = $[2];
	const stop = t2;
	let t3;
	if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
		t3 = () => {
			setKeys(/* @__PURE__ */ new Set());
			if (typeof document !== "undefined") {
				stop();
				document.addEventListener("keydown", handler);
				setIsRecording(true);
			}
		};
		$[3] = t3;
	} else t3 = $[3];
	const start = t3;
	let t4;
	if ($[4] === Symbol.for("react.memo_cache_sentinel")) {
		t4 = () => {
			setKeys(/* @__PURE__ */ new Set());
		};
		$[4] = t4;
	} else t4 = $[4];
	const resetKeys = t4;
	let t5;
	if ($[5] !== isRecording) {
		t5 = {
			isRecording,
			resetKeys,
			start,
			stop
		};
		$[5] = isRecording;
		$[6] = t5;
	} else t5 = $[6];
	let t6;
	if ($[7] !== keys || $[8] !== t5) {
		t6 = [keys, t5];
		$[7] = keys;
		$[8] = t5;
		$[9] = t6;
	} else t6 = $[9];
	return t6;
}

//#endregion
export { HotkeysProvider, Key, isHotkeyPressed, useHotkeys, useHotkeysContext, useRecordHotkeys };