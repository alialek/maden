import * as platejs2 from "platejs";
import { Descendant, NodeKey, Nullable, OmitFirst, PluginConfig, SlateEditor, TElement, TListElement, TNodeMap, TText, Value } from "platejs";
import { MdxJsxFlowElement, MdxJsxFlowElement as MdMdxJsxFlowElement, MdxJsxTextElement, MdxJsxTextElement as MdMdxJsxTextElement } from "mdast-util-mdx";
import { Options } from "remark-stringify";
import { Plugin } from "unified";
import { Token } from "marked";
import baseRemarkMdx from "remark-mdx";
import { Blockquote as MdBlockquote, Break as MdBreak, Code as MdCode, Content as MdContent, Definition as MdDefinition, Delete as MdDelete, Emphasis as MdEmphasis, FootnoteDefinition as MdFootnoteDefinition, FootnoteReference as MdFootnoteReference, Heading as MdHeading, Html as MdHtml, Image as MdImage, ImageReference as MdImageReference, InlineCode as MdInlineCode, Link as MdLink, LinkReference as MdLinkReference, List as MdList, ListItem as MdListItem, Paragraph as MdParagraph, PhrasingContent as MDPhrasingContent, Root, Root as MdRoot, RootContent as MdRootContent, Strong as MdStrong, Table as MdTable, TableCell as MdTableCell, TableRow as MdTableRow, Text as MdText, ThematicBreak as MdThematicBreak, Yaml as MdYaml } from "mdast";
import { InlineMath as MdInlineMath, Math as MdMath } from "mdast-util-math";
import * as unistLib from "unist";
import { StrictExtract } from "ts-essentials";

//#region src/lib/serializer/serializeMd.d.ts
type SerializeMdOptions = {
  allowedNodes?: PlateType[] | null;
  allowNode?: AllowNodeConfig;
  disallowedNodes?: PlateType[] | null;
  editor?: SlateEditor;
  /** Marks to treat as plain text without applying markdown formatting. */
  plainMarks?: PlateType[] | null;
  preserveEmptyParagraphs?: boolean;
  remarkPlugins?: Plugin[];
  remarkStringifyOptions?: Options | null;
  rules?: MdRules;
  spread?: boolean;
  value?: Descendant[];
  withBlockId?: boolean;
};
/** Serialize the editor value to Markdown. */
declare const serializeMd: (editor: SlateEditor, options?: Omit<SerializeMdOptions, "editor">) => string;
//#endregion
//#region src/lib/serializer/convertNodesSerialize.d.ts
declare const convertNodesSerialize: (nodes: Descendant[], options: SerializeMdOptions, isBlock?: boolean) => unistLib.Node[];
declare const buildMdastNode: (node: any, options: SerializeMdOptions, isBlock?: boolean) => any;
//#endregion
//#region src/lib/serializer/convertTextsSerialize.d.ts
declare const basicMarkdownMarks: string[];
declare const convertTextsSerialize: (slateTexts: readonly TText[], options: SerializeMdOptions, _key?: string) => MdMark[];
//#endregion
//#region src/lib/serializer/listToMdastTree.d.ts
declare function listToMdastTree(nodes: TListElement[], options: SerializeMdOptions, isBlock?: boolean): any;
//#endregion
//#region src/lib/serializer/serializeInlineMd.d.ts
declare const serializeInlineMd: (editor: SlateEditor, options?: SerializeMdOptions) => string;
//#endregion
//#region src/lib/serializer/wrapWithBlockId.d.ts
/**
 * Wraps an mdast node with a block element containing an ID attribute. Used for
 * preserving block IDs when serializing to markdown.
 *
 * @param mdastNode - The mdast node to wrap
 * @param nodeId - The ID to attach to the block element
 * @returns The wrapped mdast node with block element and ID attribute
 */
declare const wrapWithBlockId: (mdastNode: unistLib.Node, nodeId: string) => unistLib.Node;
//#endregion
//#region src/lib/serializer/utils/getCustomMark.d.ts
declare const getCustomMark: (options?: SerializeMdOptions) => string[];
//#endregion
//#region src/lib/serializer/utils/getMergedOptionsSerialize.d.ts
/**
 * Merges Markdown configurations, following the principle that options take
 * precedence
 *
 * @param editor Editor instance used to get plugin default configurations
 * @param options User-provided options (higher priority)
 * @returns The final merged configuration
 */
declare const getMergedOptionsSerialize: (editor: SlateEditor, options?: SerializeMdOptions) => SerializeMdOptions;
//#endregion
//#region src/lib/serializer/utils/getSerializerByKey.d.ts
declare const getSerializerByKey: (key: string, options: SerializeMdOptions) => any;
//#endregion
//#region src/lib/serializer/utils/unreachable.d.ts
declare const unreachable: (value: any) => void;
//#endregion
//#region src/lib/types.d.ts
type MdRules = Partial<{ [K in keyof PlateNodeMap]: Nullable<MdNodeParser<K>> }> & Record<string, Nullable<AnyNodeParser>>;
type MdNodeParser<K$1 extends keyof PlateNodeMap> = {
  mark?: boolean;
  deserialize?: (mdastNode: MdNodeMap[K$1], deco: MdDecoration, options: DeserializeMdOptions) => PlateNodeMap[K$1];
  serialize?: (slateNode: PlateNodeMap[K$1], options: SerializeMdOptions) => MdNodeMap[K$1];
};
type AnyNodeParser = {
  mark?: boolean;
  deserialize?: (mdastNode: any, deco: MdDecoration, options: DeserializeMdOptions) => any;
  serialize?: (slateNode: any, options: SerializeMdOptions) => any;
};
type StrictMdType = MdGFM | MdRootContent['type'] | MdStyle;
type MdType = (string & {}) | StrictMdType;
type MdGFM = 'del' | 'mark' | 'sub' | 'sup' | 'u';
type MdStyle = 'backgroundColor' | 'color' | 'fontFamily' | 'fontSize' | 'fontWeight';
type MdMark = MdDelete | MdEmphasis | MdInlineCode | MdStrong | MdText;
type MdDecoration = Readonly<Partial<Record<(string & {}) | (MdDelete | MdEmphasis | MdInlineCode | MdStrong)['type'] | MdStyle | 'underline', boolean | string>>>;
type StrictPlateType = StrictExtract<NodeKey, 'a' | 'blockquote' | 'bold' | 'callout' | 'code' | 'code_block' | 'code_line' | 'column' | 'column_group' | 'comment' | 'date' | 'equation' | 'hr' | 'img' | 'inline_equation' | 'italic' | 'li' | 'mention' | 'p' | 'strikethrough' | 'subscript' | 'suggestion' | 'superscript' | 'table' | 'td' | 'th' | 'toc' | 'toggle' | 'tr' | 'underline'> | 'heading' | 'list' | 'text';
type PlateType = (string & {}) | StrictPlateType;
type PlateNodeMap = Pick<TNodeMap, 'a' | 'audio' | 'blockquote' | 'bold' | 'callout' | 'code' | 'code_block' | 'column' | 'column_group' | 'comment' | 'date' | 'equation' | 'file' | 'hr' | 'img' | 'inline_equation' | 'italic' | 'mention' | 'p' | 'strikethrough' | 'subscript' | 'suggestion' | 'superscript' | 'table' | 'td' | 'th' | 'toc' | 'toggle' | 'tr' | 'underline' | 'video'> & {
  /** Markdown only */
  text: TText;
  list: any;
  heading: TElement;
  footnoteReference: any;
  definition: any;
  footnoteDefinition: any;
  break: any;
  yaml: any;
  imageReference: any;
  linkReference: any;
  html: any;
};
type MdNodeMap = {
  /** Common Elements */
  a: MdLink;
  blockquote: MdBlockquote;
  code_block: MdCode;
  equation: MdMath;
  heading: MdHeading;
  hr: MdThematicBreak;
  img: MdImage;
  inline_equation: MdInlineMath;
  p: MdParagraph;
  table: MdTable;
  td: MdTableCell;
  th: MdTableCell;
  tr: MdTableRow;
  list: MdList;
  /** Common Marks */
  bold: MdStrong;
  italic: MdEmphasis;
  code: MdInlineCode;
  text: MdText;
  strikethrough: MdDelete;
  /** Markdown only */
  footnoteReference: MdFootnoteReference;
  definition: MdDefinition;
  footnoteDefinition: MdFootnoteDefinition;
  break: MdBreak;
  yaml: MdYaml;
  imageReference: MdImageReference;
  linkReference: MdLinkReference;
  html: MdHtml;
  /** Plate only */
  column_group: any;
  column: any;
  toc: any;
  callout: any;
  toggle: any;
  mention: any;
  date: any;
  underline: any;
  comment: any;
  superscript: any;
  subscript: any;
  suggestion: any;
  file: any;
  video: any;
  audio: any;
};
/**
 * Get plate node type from mdast node type if the mdast is mdast only return
 * the mdast type itself.
 */
declare const mdastToPlate: <T extends StrictMdType>(editor: SlateEditor, mdastType: T) => string;
/**
 * Get mdast node type from plate element type if the plateType is plate only
 * return the plateType itself.
 */
declare const plateToMdast: <T extends StrictPlateType>(plateType: T) => {
  readonly a: "link";
  readonly blockquote: "blockquote";
  readonly bold: "strong";
  readonly callout: "callout";
  readonly code: "inlineCode";
  readonly code_block: "code";
  readonly code_line: "code_line";
  readonly column: "column";
  readonly column_group: "column_group";
  readonly comment: "comment";
  readonly date: "date";
  readonly equation: "math";
  readonly heading: "heading";
  readonly hr: "thematicBreak";
  readonly img: "image";
  readonly inline_equation: "inlineMath";
  readonly italic: "emphasis";
  readonly li: "listItem";
  readonly list: "list";
  readonly mention: "mention";
  readonly p: "paragraph";
  readonly strikethrough: "delete";
  readonly subscript: "sub";
  readonly suggestion: "suggestion";
  readonly superscript: "sup";
  readonly table: "table";
  readonly td: "tableCell";
  readonly text: "text";
  readonly th: "tableCell";
  readonly toc: "toc";
  readonly toggle: "toggle";
  readonly tr: "tableRow";
  readonly underline: "u";
}[T];
//#endregion
//#region src/lib/deserializer/utils/customMdxDeserialize.d.ts
declare const customMdxDeserialize: (mdastNode: MdxJsxFlowElement | MdxJsxTextElement, deco: MdDecoration, options: DeserializeMdOptions) => any;
//#endregion
//#region src/lib/deserializer/utils/deserializeInlineMd.d.ts
declare const deserializeInlineMd: (editor: SlateEditor, text: string, options?: DeserializeMdOptions) => Descendant[];
//#endregion
//#region src/lib/deserializer/utils/getDeserializerByKey.d.ts
declare const getDeserializerByKey: (key: string, options: DeserializeMdOptions) => any;
//#endregion
//#region src/lib/deserializer/utils/getMergedOptionsDeserialize.d.ts
/**
 * Merges Markdown configurations, following the principle that options take
 * precedence
 *
 * @param editor Editor instance used to get plugin default configurations
 * @param options User-provided options (higher priority)
 * @returns The final merged configuration
 */
declare const getMergedOptionsDeserialize: (editor: SlateEditor, options?: DeserializeMdOptions) => DeserializeMdOptions;
//#endregion
//#region src/lib/deserializer/utils/getStyleValue.d.ts
declare const getStyleValue: (mdastNode: MdMdxJsxTextElement, styleName: string) => string | undefined;
//#endregion
//#region src/lib/deserializer/utils/htmlToJsx.d.ts
declare const htmlToJsx: (html: string) => string;
//#endregion
//#region src/lib/deserializer/utils/markdownToSlateNodesSafely.d.ts
declare const markdownToSlateNodesSafely: (editor: SlateEditor, data: string, options?: Omit<DeserializeMdOptions, "editor">) => platejs2.Descendant[] | {
  children: platejs2.Descendant[];
  type: string;
}[];
//#endregion
//#region src/lib/deserializer/utils/parseMarkdownBlocks.d.ts
type ParseMarkdownBlocksOptions = {
  /**
   * Token types to exclude from the output.
   *
   * @default ['space']
   */
  exclude?: string[];
  /**
   * Whether to trim the content.
   *
   * @default true
   */
  trim?: boolean;
};
declare const parseMarkdownBlocks: (content: string, {
  exclude,
  trim
}?: ParseMarkdownBlocksOptions) => Token[];
//#endregion
//#region src/lib/deserializer/utils/splitIncompleteMdx.d.ts
declare const splitIncompleteMdx: (data: string) => string[] | string;
//#endregion
//#region src/lib/deserializer/utils/stripMarkdown.d.ts
declare const stripMarkdownBlocks: (text: string) => string;
declare const stripMarkdownInline: (text: string) => string;
declare const stripMarkdown: (text: string) => string;
//#endregion
//#region src/lib/deserializer/deserializeMd.d.ts
type DeserializeMdOptions = {
  allowedNodes?: PlateType[] | null;
  allowNode?: AllowNodeConfig;
  disallowedNodes?: PlateType[] | null;
  editor?: SlateEditor;
  memoize?: boolean;
  parser?: ParseMarkdownBlocksOptions;
  preserveEmptyParagraphs?: boolean;
  remarkPlugins?: Plugin[];
  rules?: MdRules | null;
  splitLineBreaks?: boolean;
  withoutMdx?: boolean;
  onError?: (error: Error) => void;
};
declare const markdownToAstProcessor: (editor: SlateEditor, data: string, options?: DeserializeMdOptions) => Root;
declare const markdownToSlateNodes: (editor: SlateEditor, data: string, options?: Omit<DeserializeMdOptions, "editor">) => Descendant[];
declare const deserializeMd: (editor: SlateEditor, data: string, options?: Omit<DeserializeMdOptions, "editor">) => Value;
declare module 'unified' {
  interface CompileResultMap {
    remarkToSlateNode: Descendant[];
  }
}
//#endregion
//#region src/lib/deserializer/convertChildrenDeserialize.d.ts
declare const convertChildrenDeserialize: (children: MdRootContent[], deco: MdDecoration, options: DeserializeMdOptions) => Descendant[];
//#endregion
//#region src/lib/deserializer/convertNodesDeserialize.d.ts
declare const convertNodesDeserialize: (nodes: MdRootContent[], deco: MdDecoration, options: DeserializeMdOptions) => Descendant[];
declare const buildSlateNode: (mdastNode: MdRootContent, deco: MdDecoration, options: DeserializeMdOptions) => Descendant[];
//#endregion
//#region src/lib/deserializer/convertTextsDeserialize.d.ts
declare const convertTextsDeserialize: (mdastNode: MdDelete | MdEmphasis | MdStrong, deco: MdDecoration, options: DeserializeMdOptions) => any;
//#endregion
//#region src/lib/deserializer/mdastToSlate.d.ts
declare const mdastToSlate: (node: Root, options: DeserializeMdOptions) => Descendant[];
//#endregion
//#region src/lib/MarkdownPlugin.d.ts
type AllowNodeConfig = {
  /** Custom filter function for nodes during deserialization */
  deserialize?: (node: any) => boolean;
  /** Custom filter function for nodes during serialization */
  serialize?: (node: any) => boolean;
};
type MarkdownConfig = PluginConfig<'markdown', {
  /**
   * Configuration for allowed node types. Cannot be combined with
   * disallowedNodes.
   */
  allowedNodes: PlateType[] | null;
  /**
   * Configuration for disallowed node types. Cannot be combined with
   * allowedNodes.
   *
   * @default null
   */
  disallowedNodes: PlateType[] | null;
  /**
   * Array of remark plugins to extend Markdown parsing and serialization
   * functionality. For example, you can add remark-gfm to support GFM syntax,
   * remark-math to support mathematical formulas, etc. These plugins will be
   * used during the parsing and generation of Markdown text.
   *
   * @default undefined
   */
  remarkPlugins: Plugin[];
  /**
   * Custom options passed to remark-stringify.
   *
   * @default null
   */
  remarkStringifyOptions: Options | null;
  /**
   * Rules that define how to convert Markdown syntax elements to Slate editor
   * elements. Or rules that how to convert Slate editor elements to Markdown
   * syntax elements. Includes conversion rules for elements such as
   * paragraphs, headings, lists, links, images, etc.
   *
   * You can pass null disable default node parser.
   *
   * NOTE: don't forget pass `mark:true` when you custom inline nodes.
   *
   * @default null
   */
  rules: MdRules | null;
  /**
   * Custom filter function for nodes during deserialization and
   * serialization.
   *
   * @default null
   */
  allowNode?: AllowNodeConfig;
  /**
   * Marks to treat as plain text without applying markdown formatting.
   *
   * @default null
   */
  plainMarks?: PlateType[] | null;
}, {
  markdown: {
    deserialize: OmitFirst<typeof deserializeMd>;
    deserializeInline: OmitFirst<typeof deserializeInlineMd>;
    serialize: OmitFirst<typeof serializeMd>;
  };
}>;
declare const MarkdownPlugin: platejs2.SlatePlugin<PluginConfig<"markdown", {
  /**
   * Configuration for allowed node types. Cannot be combined with
   * disallowedNodes.
   */
  allowedNodes: PlateType[] | null;
  /**
   * Configuration for disallowed node types. Cannot be combined with
   * allowedNodes.
   *
   * @default null
   */
  disallowedNodes: PlateType[] | null;
  /**
   * Array of remark plugins to extend Markdown parsing and serialization
   * functionality. For example, you can add remark-gfm to support GFM syntax,
   * remark-math to support mathematical formulas, etc. These plugins will be
   * used during the parsing and generation of Markdown text.
   *
   * @default undefined
   */
  remarkPlugins: Plugin[];
  /**
   * Custom options passed to remark-stringify.
   *
   * @default null
   */
  remarkStringifyOptions: Options | null;
  /**
   * Rules that define how to convert Markdown syntax elements to Slate editor
   * elements. Or rules that how to convert Slate editor elements to Markdown
   * syntax elements. Includes conversion rules for elements such as
   * paragraphs, headings, lists, links, images, etc.
   *
   * You can pass null disable default node parser.
   *
   * NOTE: don't forget pass `mark:true` when you custom inline nodes.
   *
   * @default null
   */
  rules: MdRules | null;
  /**
   * Custom filter function for nodes during deserialization and
   * serialization.
   *
   * @default null
   */
  allowNode?: AllowNodeConfig;
  /**
   * Marks to treat as plain text without applying markdown formatting.
   *
   * @default null
   */
  plainMarks?: PlateType[] | null;
}, {
  markdown: {
    deserialize: OmitFirst<typeof deserializeMd>;
    deserializeInline: OmitFirst<typeof deserializeInlineMd>;
    serialize: OmitFirst<typeof serializeMd>;
  };
} & Record<"markdown", {
  deserialize: (data: string, options?: Omit<DeserializeMdOptions, "editor"> | undefined) => platejs2.Value;
  deserializeInline: (text: string, options?: DeserializeMdOptions | undefined) => platejs2.Descendant[];
  serialize: (options?: Omit<SerializeMdOptions, "editor"> | undefined) => string;
}>, {}, {}>>;
//#endregion
//#region src/lib/plugins/remarkMdx.d.ts
declare const remarkMdx: typeof baseRemarkMdx;
//#endregion
//#region src/lib/plugins/remarkMention.d.ts
type MentionNode = {
  children: {
    type: 'text';
    value: string;
  }[];
  type: 'mention';
  username: string;
  displayText?: string;
};
declare module 'mdast' {
  interface StaticPhrasingContentMap {
    mention: MentionNode;
  }
}
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
declare const remarkMention: Plugin;
//#endregion
//#region src/lib/rules/columnRules.d.ts
declare const columnRules: MdRules;
//#endregion
//#region src/lib/rules/defaultRules.d.ts
declare const defaultRules: MdRules;
declare const buildRules: (editor: SlateEditor) => Record<string, any>;
//#endregion
//#region src/lib/rules/fontRules.d.ts
declare const fontRules: MdRules;
//#endregion
//#region src/lib/rules/mediaRules.d.ts
declare const mediaRules: MdRules;
//#endregion
//#region src/lib/rules/utils/parseAttributes.d.ts
declare function parseAttributes(attributes: any[]): Record<string, any>;
declare function propsToAttributes(props: Record<string, any>): any[];
//#endregion
//#region src/lib/utils/getRemarkPluginsWithoutMdx.d.ts
declare const REMARK_MDX_TAG = "remarkMdx";
declare const tagRemarkPlugin: (pluginFn: any, tag: string) => {
  (this: any, ...args: any[]): any;
  __pluginTag: string;
};
declare const getRemarkPluginsWithoutMdx: (plugins: Plugin[]) => Plugin[];
//#endregion
export { AllowNodeConfig, DeserializeMdOptions, type MDPhrasingContent, MarkdownConfig, MarkdownPlugin, type MdBlockquote, type MdBreak, type MdCode, type MdContent, MdDecoration, type MdDefinition, type MdDelete, type MdEmphasis, type MdFootnoteDefinition, type MdFootnoteReference, type MdHeading, type MdHtml, type MdImage, type MdImageReference, type MdInlineCode, type MdInlineMath, type MdLink, type MdLinkReference, type MdList, type MdListItem, MdMark, type MdMath, type MdMdxJsxFlowElement, type MdMdxJsxTextElement, MdNodeParser, type MdParagraph, type MdRoot, type MdRootContent, MdRules, type MdStrong, type MdTable, type MdTableCell, type MdTableRow, type MdText, type MdThematicBreak, MdType, type MdYaml, MentionNode, ParseMarkdownBlocksOptions, PlateType, REMARK_MDX_TAG, SerializeMdOptions, StrictPlateType, basicMarkdownMarks, buildMdastNode, buildRules, buildSlateNode, columnRules, convertChildrenDeserialize, convertNodesDeserialize, convertNodesSerialize, convertTextsDeserialize, convertTextsSerialize, customMdxDeserialize, defaultRules, deserializeInlineMd, deserializeMd, fontRules, getCustomMark, getDeserializerByKey, getMergedOptionsDeserialize, getMergedOptionsSerialize, getRemarkPluginsWithoutMdx, getSerializerByKey, getStyleValue, htmlToJsx, listToMdastTree, markdownToAstProcessor, markdownToSlateNodes, markdownToSlateNodesSafely, mdastToPlate, mdastToSlate, mediaRules, parseAttributes, parseMarkdownBlocks, plateToMdast, propsToAttributes, remarkMdx, remarkMention, serializeInlineMd, serializeMd, splitIncompleteMdx, stripMarkdown, stripMarkdownBlocks, stripMarkdownInline, tagRemarkPlugin, type unistLib, unreachable, wrapWithBlockId };