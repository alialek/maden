import { n as NODES, r as STYLE_KEYS, t as KEYS } from "./plate-keys-C2YNmTqZ.js";
import { createSlatePlugin, createTSlatePlugin } from "@platejs/core";
import { ElementApi, NodeApi, PathApi, TextApi, queryNode } from "@platejs/slate";

//#region src/lib/plugins/ExitBreakPlugin.ts
/**
* Insert soft break following configurable rules. Each rule specifies a hotkey
* and query options.
*/
const ExitBreakPlugin = createSlatePlugin({
	key: KEYS.exitBreak,
	editOnly: true
}).extendTransforms(({ editor }) => ({
	insert: (options) => editor.tf.insertExitBreak(options),
	insertBefore: (options) => editor.tf.insertExitBreak({
		...options,
		reverse: true
	})
}));

//#endregion
//#region src/lib/plugins/normalize-types/withNormalizeTypes.ts
const withNormalizeTypes = ({ editor, getOptions, tf: { normalizeNode } }) => ({ transforms: { normalizeNode([currentNode, currentPath]) {
	const { rules, onError } = getOptions();
	if (currentPath.length === 0) {
		if (rules.some(({ path, strictType, type }) => {
			const node = NodeApi.get(editor, path);
			if (node) {
				if (strictType && ElementApi.isElement(node) && node.type !== strictType) {
					const { children, ...props } = editor.api.create.block({ type: strictType });
					editor.tf.setNodes(props, { at: path });
					return true;
				}
			} else try {
				editor.tf.insertNodes(editor.api.create.block({ type: strictType ?? type }), { at: path });
				return true;
			} catch (error) {
				onError?.(error);
			}
			return false;
		})) return;
	}
	return normalizeNode([currentNode, currentPath]);
} } });

//#endregion
//#region src/lib/plugins/normalize-types/NormalizeTypesPlugin.ts
/** @see {@link withNormalizeTypes} */
const NormalizeTypesPlugin = createTSlatePlugin({
	key: KEYS.normalizeTypes,
	options: { rules: [] }
}).overrideEditor(withNormalizeTypes);

//#endregion
//#region src/lib/plugins/single-block/SingleBlockPlugin.ts
/** Forces editor to only have one block. */
const SingleBlockPlugin = createSlatePlugin({
	key: KEYS.singleBlock,
	override: { enabled: { [KEYS.trailingBlock]: false } }
}).overrideEditor(({ editor, tf: { normalizeNode } }) => ({ transforms: {
	insertBreak() {
		editor.tf.insertSoftBreak();
	},
	normalizeNode(entry) {
		const [_node, path] = entry;
		if (path.length === 0 && editor.children.length > 1) {
			editor.tf.withoutNormalizing(() => {
				while (editor.children.length > 1) {
					editor.tf.insertText("\n", { at: editor.api.start([1]) });
					editor.tf.mergeNodes({
						at: [1],
						match: (_, path$1) => path$1.length === 1
					});
				}
			});
			return;
		}
		normalizeNode(entry);
	}
} }));

//#endregion
//#region src/lib/plugins/single-block/SingleLinePlugin.ts
/** Forces editor to only have one line. */
const SingleLinePlugin = createSlatePlugin({
	key: KEYS.singleLine,
	override: { enabled: { [KEYS.trailingBlock]: false } }
}).overrideEditor(({ editor, tf: { normalizeNode } }) => ({ transforms: {
	insertBreak() {},
	insertSoftBreak() {},
	normalizeNode(entry) {
		const [node, path] = entry;
		if (TextApi.isText(node)) {
			const filteredText = node.text.replace(/[\r\n\u2028\u2029]/g, "");
			if (filteredText !== node.text) {
				editor.tf.insertText(filteredText, { at: path });
				return;
			}
		}
		if (path.length === 0 && editor.children.length > 1) {
			editor.tf.withoutNormalizing(() => {
				while (editor.children.length > 1) editor.tf.mergeNodes({
					at: [1],
					match: (_, path$1) => path$1.length === 1
				});
			});
			return;
		}
		normalizeNode(entry);
	}
} }));

//#endregion
//#region src/lib/plugins/trailing-block/withTrailingBlock.ts
/**
* Add a trailing block when the last node type is not `type` and when the
* editor has .
*/
const withTrailingBlock = ({ editor, getOptions, tf: { normalizeNode } }) => ({ transforms: { normalizeNode([currentNode, currentPath]) {
	const { level, type, ...query } = getOptions();
	if (currentPath.length === 0) {
		const lastChild = editor.api.last([], { level });
		const lastChildNode = lastChild?.[0];
		if (!lastChildNode || lastChildNode.type !== type && queryNode(lastChild, query)) {
			const at = lastChild ? PathApi.next(lastChild[1]) : [0];
			editor.tf.insertNodes(editor.api.create.block({ type }, at), { at });
			return;
		}
	}
	return normalizeNode([currentNode, currentPath]);
} } });

//#endregion
//#region src/lib/plugins/trailing-block/TrailingBlockPlugin.ts
/** @see {@link withTrailingBlock} */
const TrailingBlockPlugin = createTSlatePlugin({
	key: KEYS.trailingBlock,
	options: { level: 0 }
}).overrideEditor(withTrailingBlock).extend(({ editor }) => ({ options: { type: editor.getType(KEYS.p) } }));

//#endregion
export { ExitBreakPlugin, KEYS, NODES, NormalizeTypesPlugin, STYLE_KEYS, SingleBlockPlugin, SingleLinePlugin, TrailingBlockPlugin, withNormalizeTypes, withTrailingBlock };