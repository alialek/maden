import { OverrideEditor, PluginConfig } from "@platejs/core";
import { Descendant, Path, QueryNodeOptions, TElement, TText } from "@platejs/slate";
import { UnknownObject } from "@udecode/utils";

//#region src/lib/plate-keys.d.ts
declare const NODES: {
  readonly a: "a";
  readonly ai: "ai";
  readonly aiChat: "aiChat";
  readonly audio: "audio";
  readonly blockquote: "blockquote";
  readonly bold: "bold";
  readonly callout: "callout";
  readonly code: "code";
  readonly codeBlock: "code_block";
  readonly codeDrawing: "code_drawing";
  readonly codeLine: "code_line";
  readonly codeSyntax: "code_syntax";
  readonly column: "column";
  readonly columnGroup: "column_group";
  readonly comment: "comment";
  readonly date: "date";
  readonly emojiInput: "emoji_input";
  readonly equation: "equation";
  readonly excalidraw: "excalidraw";
  readonly file: "file";
  readonly h1: "h1";
  readonly h2: "h2";
  readonly h3: "h3";
  readonly h4: "h4";
  readonly h5: "h5";
  readonly h6: "h6";
  readonly highlight: "highlight";
  readonly hr: "hr";
  readonly img: "img";
  readonly inlineEquation: "inline_equation";
  readonly italic: "italic";
  readonly kbd: "kbd";
  readonly li: "li";
  readonly lic: "lic";
  readonly link: "a";
  readonly listTodoClassic: "action_item";
  readonly mediaEmbed: "media_embed";
  readonly mention: "mention";
  readonly mentionInput: "mention_input";
  readonly olClassic: "ol";
  readonly p: "p";
  readonly searchHighlight: "search_highlight";
  readonly slashInput: "slash_input";
  readonly strikethrough: "strikethrough";
  readonly sub: "subscript";
  readonly suggestion: "suggestion";
  readonly sup: "superscript";
  readonly table: "table";
  readonly tag: "tag";
  readonly taskList: "taskList";
  readonly td: "td";
  readonly th: "th";
  readonly toc: "toc";
  readonly toggle: "toggle";
  readonly tr: "tr";
  readonly ulClassic: "ul";
  readonly underline: "underline";
  readonly video: "video";
};
declare const STYLE_KEYS: {
  readonly backgroundColor: "backgroundColor";
  readonly color: "color";
  readonly fontFamily: "fontFamily";
  readonly fontSize: "fontSize";
  readonly fontWeight: "fontWeight";
  readonly indent: "indent";
  readonly lineHeight: "lineHeight";
  readonly listType: "listStyleType";
  readonly textAlign: "textAlign";
  readonly textIndent: "textIndent";
};
declare const KEYS: {
  readonly autoformat: "autoformat";
  readonly blockMenu: "blockMenu";
  readonly blockPlaceholder: "blockPlaceholder";
  readonly blockSelection: "blockSelection";
  readonly caption: "caption";
  readonly copilot: "copilot";
  readonly csv: "csv";
  readonly cursorOverlay: "cursorOverlay";
  readonly delete: "delete";
  readonly dnd: "dnd";
  readonly docx: "docx";
  readonly emoji: "emoji";
  readonly exitBreak: "exitBreak";
  readonly heading: string[];
  readonly html: "html";
  readonly juice: "juice";
  readonly list: "list";
  readonly listChecked: "checked";
  readonly listClassic: "listClassic";
  readonly listRestart: "listRestart";
  readonly listRestartPolite: "listRestartPolite";
  readonly listStart: "listStart";
  readonly listTodo: "todo";
  readonly markdown: "markdown";
  readonly nodeId: "nodeId";
  readonly normalizeTypes: "normalizeTypes";
  readonly ol: "decimal";
  readonly placeholder: "placeholder";
  readonly playwright: "playwright";
  readonly removeEmptyNodes: "removeEmptyNodes";
  readonly resetNode: "resetNode";
  readonly singleBlock: "singleBlock";
  readonly singleLine: "singleLine";
  readonly slashCommand: "slash_command";
  readonly softBreak: "softBreak";
  readonly tabbable: "tabbable";
  readonly trailingBlock: "trailingBlock";
  readonly ul: "disc";
  readonly yjs: "yjs";
  readonly backgroundColor: "backgroundColor";
  readonly color: "color";
  readonly fontFamily: "fontFamily";
  readonly fontSize: "fontSize";
  readonly fontWeight: "fontWeight";
  readonly indent: "indent";
  readonly lineHeight: "lineHeight";
  readonly listType: "listStyleType";
  readonly textAlign: "textAlign";
  readonly textIndent: "textIndent";
  readonly a: "a";
  readonly ai: "ai";
  readonly aiChat: "aiChat";
  readonly audio: "audio";
  readonly blockquote: "blockquote";
  readonly bold: "bold";
  readonly callout: "callout";
  readonly code: "code";
  readonly codeBlock: "code_block";
  readonly codeDrawing: "code_drawing";
  readonly codeLine: "code_line";
  readonly codeSyntax: "code_syntax";
  readonly column: "column";
  readonly columnGroup: "column_group";
  readonly comment: "comment";
  readonly date: "date";
  readonly emojiInput: "emoji_input";
  readonly equation: "equation";
  readonly excalidraw: "excalidraw";
  readonly file: "file";
  readonly h1: "h1";
  readonly h2: "h2";
  readonly h3: "h3";
  readonly h4: "h4";
  readonly h5: "h5";
  readonly h6: "h6";
  readonly highlight: "highlight";
  readonly hr: "hr";
  readonly img: "img";
  readonly inlineEquation: "inline_equation";
  readonly italic: "italic";
  readonly kbd: "kbd";
  readonly li: "li";
  readonly lic: "lic";
  readonly link: "a";
  readonly listTodoClassic: "action_item";
  readonly mediaEmbed: "media_embed";
  readonly mention: "mention";
  readonly mentionInput: "mention_input";
  readonly olClassic: "ol";
  readonly p: "p";
  readonly searchHighlight: "search_highlight";
  readonly slashInput: "slash_input";
  readonly strikethrough: "strikethrough";
  readonly sub: "subscript";
  readonly suggestion: "suggestion";
  readonly sup: "superscript";
  readonly table: "table";
  readonly tag: "tag";
  readonly taskList: "taskList";
  readonly td: "td";
  readonly th: "th";
  readonly toc: "toc";
  readonly toggle: "toggle";
  readonly tr: "tr";
  readonly ulClassic: "ul";
  readonly underline: "underline";
  readonly video: "video";
};
type NodeKey = (typeof NODES)[keyof typeof NODES];
type StyleKey = (typeof STYLE_KEYS)[keyof typeof STYLE_KEYS];
type PlateKey = (typeof KEYS)[keyof typeof KEYS];
//#endregion
//#region src/lib/plate-types.d.ts
interface TCalloutElement extends TElement {
  backgroundColor?: string;
  icon?: string;
  variant?: (string & {}) | 'error' | 'info' | 'note' | 'success' | 'tip' | 'warning';
}
type TTagProps = {
  value: string;
} & UnknownObject;
type TTagElement = TElement & TTagProps;
interface TCodeBlockElement extends TElement {
  lang?: string;
}
interface TCodeSyntaxLeaf extends TText {
  className?: string;
}
interface TColumnElement extends TElement {
  type: 'column';
  width: string;
  id?: string;
}
interface TColumnGroupElement extends TElement {
  children: TColumnElement[];
  type: 'column_group';
  id?: string;
  layout?: number[];
}
interface TDateElement extends TElement {
  date?: string;
}
interface TEquationElement extends TElement {
  texExpression: string;
}
interface TImageElement extends TMediaElement {
  initialHeight?: number;
  initialWidth?: number;
}
interface TPlaceholderElement extends TElement {
  mediaType: string;
}
interface TAudioElement extends TMediaElement {}
interface TFileElement extends TMediaElement {}
interface TVideoElement extends TMediaElement {}
interface TMediaEmbedElement extends TMediaElement {}
interface TLinkElement extends TElement {
  url: string;
  target?: string;
}
interface TMentionElement extends TElement {
  value: string;
}
interface TComboboxInputElement extends TElement {
  value: string;
}
interface TTableElement extends TElement {
  colSizes?: number[];
  marginLeft?: number;
}
interface TTableRowElement extends TElement {
  size?: number;
}
interface TTableCellElement extends TElement {
  id?: string;
  attributes?: {
    colspan?: string;
    rowspan?: string;
  };
  background?: string;
  borders?: {
    /** Only the last row cells have a bottom border. */
    bottom?: TTableCellBorder;
    left?: TTableCellBorder;
    /** Only the last column cells have a right border. */
    right?: TTableCellBorder;
    top?: TTableCellBorder;
  };
  colSpan?: number;
  rowSpan?: number;
  size?: number;
}
type TTableCellBorder = {
  color?: string;
  size?: number;
  style?: string;
};
type TIdProps = {
  id: string;
};
type TIdElement = TElement & TIdProps;
type TTextAlignProps = {
  align?: React.CSSProperties['textAlign'];
};
type TResizableProps = {
  align?: 'center' | 'left' | 'right';
  width?: number;
};
type TResizableElement = TElement & TResizableProps;
type TMediaProps = {
  url: string;
  id?: string;
  isUpload?: boolean;
  name?: string;
  placeholderId?: string;
};
type TMediaElement = TElement & TMediaProps;
type TCaptionProps = {
  caption?: Descendant[];
};
type TCaptionElement = TElement & TCaptionProps;
type TIndentProps = {
  indent: number;
};
type TIndentElement = TElement & TIndentProps;
type TListProps = TIndentProps & {
  listStyleType: string;
  checked?: boolean;
  listRestart?: number;
  listRestartPolite?: number;
  listStart?: number;
};
type TListElement = TElement & TListProps;
type TSuggestionProps = {
  suggestion: TSuggestionData;
};
type TSuggestionElement = TElement & TSuggestionProps;
type TLineHeightProps = {
  lineHeight?: React.CSSProperties['lineHeight'];
};
type TBasicMarks = {
  bold?: boolean;
  code?: boolean;
  italic?: boolean;
  strikethrough?: boolean;
  subscript?: boolean;
  underline?: boolean;
};
type TFontMarks = {
  backgroundColor?: React.CSSProperties['backgroundColor'];
  color?: React.CSSProperties['color'];
  fontFamily?: React.CSSProperties['fontFamily'];
  fontSize?: React.CSSProperties['fontSize'];
  fontWeight?: React.CSSProperties['fontWeight'];
};
interface TCommentText extends TText {
  comment?: boolean;
}
type TSuggestionData = {
  id: string;
  createdAt: number;
  type: 'insert' | 'remove';
  userId: string;
  isLineBreak?: boolean;
};
type TSuggestionText = TText & {
  [key: string]: TInlineSuggestionData | boolean | string;
  suggestion: true;
  text: string;
};
type TInlineSuggestionData = TInsertSuggestionData | TRemoveSuggestionData | TUpdateSuggestionData;
type TInsertSuggestionData = {
  id: string;
  createdAt: number;
  type: 'insert';
  userId: string;
};
type TRemoveSuggestionData = {
  id: string;
  createdAt: number;
  type: 'remove';
  userId: string;
};
type TUpdateSuggestionData = {
  id: string;
  createdAt: number;
  type: 'update';
  userId: string;
  newProperties?: any;
  properties?: any;
};
type EmptyText = {
  text: '';
};
type PlainText = {
  text: string;
};
type TNodeMap = {
  a: TLinkElement;
  action_item: TListElement;
  ai: TText & {
    ai: true;
  };
  aiChat: TElement;
  audio: TAudioElement;
  blockquote: TElement;
  bold: TText & {
    bold: true;
  };
  callout: TCalloutElement;
  code: TText & {
    code: true;
  };
  code_block: TCodeBlockElement;
  code_line: TElement;
  code_syntax: TCodeSyntaxLeaf;
  column: TColumnElement;
  column_group: TColumnGroupElement;
  comment: TText & {
    comment: true;
  };
  date: TDateElement;
  emoji_input: TComboboxInputElement;
  equation: TEquationElement;
  excalidraw: TElement;
  file: TFileElement;
  h1: TElement;
  h2: TElement;
  h3: TElement;
  h4: TElement;
  h5: TElement;
  h6: TElement;
  highlight: TText & {
    highlight: true;
  };
  hr: TElement;
  img: TImageElement & TCaptionProps;
  inline_equation: TEquationElement;
  italic: TText & {
    italic: true;
  };
  kbd: TText & {
    kbd: true;
  };
  li: TElement;
  lic: TElement;
  media_embed: TMediaEmbedElement & TCaptionProps;
  mention: TMentionElement;
  mention_input: TComboboxInputElement;
  ol: TListElement;
  p: TElement;
  search_highlight: TText & {
    search_highlight: true;
  };
  slash_input: TComboboxInputElement;
  strikethrough: TText & {
    strikethrough: true;
  };
  subscript: TText & {
    subscript: true;
  };
  suggestion: TSuggestionText;
  superscript: TText & {
    superscript: true;
  };
  table: TTableElement;
  tag: TTagElement;
  td: TTableCellElement;
  th: TTableCellElement;
  toc: TElement;
  toggle: TElement;
  tr: TTableRowElement;
  ul: TListElement;
  underline: TText & {
    underline: true;
  };
  video: TVideoElement & TCaptionProps;
};
//#endregion
//#region src/lib/plugins/ExitBreakPlugin.d.ts
/**
 * Insert soft break following configurable rules. Each rule specifies a hotkey
 * and query options.
 */
declare const ExitBreakPlugin: any;
//#endregion
//#region src/lib/plugins/normalize-types/NormalizeTypesPlugin.d.ts
type NormalizeTypesConfig = PluginConfig<'normalizeTypes', {
  /**
   * Set of rules for the types. For each rule, provide a `path` and either
   * `strictType` or `type`. If there is no node existing at `path`: insert a
   * node with `strictType`. If there is a node existing at `path` but its
   * type is not `strictType` or `type`: set the node type to `strictType` or
   * `type`.
   */
  rules?: Rule[];
  onError?: (err: any) => void;
}>;
type Rule = {
  /** Path where the rule applies */
  path: Path;
  /** Force the type of the node at the given path */
  strictType?: string;
  /** Type of the inserted node at the given path if `strictType` is not provided */
  type?: string;
};
/** @see {@link withNormalizeTypes} */
declare const NormalizeTypesPlugin: any;
//#endregion
//#region src/lib/plugins/normalize-types/withNormalizeTypes.d.ts
declare const withNormalizeTypes: OverrideEditor<NormalizeTypesConfig>;
//#endregion
//#region src/lib/plugins/single-block/SingleBlockPlugin.d.ts
/** Forces editor to only have one block. */
declare const SingleBlockPlugin: any;
//#endregion
//#region src/lib/plugins/single-block/SingleLinePlugin.d.ts
/** Forces editor to only have one line. */
declare const SingleLinePlugin: any;
//#endregion
//#region src/lib/plugins/trailing-block/TrailingBlockPlugin.d.ts
type TrailingBlockConfig = PluginConfig<'trailingBlock', {
  /** Level where the trailing node should be, the first level being 0. */
  level?: number;
  /** Type of the trailing block */
  type?: string;
} & QueryNodeOptions>;
/** @see {@link withTrailingBlock} */
declare const TrailingBlockPlugin: any;
//#endregion
//#region src/lib/plugins/trailing-block/withTrailingBlock.d.ts
/**
 * Add a trailing block when the last node type is not `type` and when the
 * editor has .
 */
declare const withTrailingBlock: OverrideEditor<TrailingBlockConfig>;
//#endregion
export { EmptyText, ExitBreakPlugin, KEYS, NODES, NodeKey, NormalizeTypesConfig, NormalizeTypesPlugin, PlainText, PlateKey, STYLE_KEYS, SingleBlockPlugin, SingleLinePlugin, StyleKey, TAudioElement, TBasicMarks, TCalloutElement, TCaptionElement, TCaptionProps, TCodeBlockElement, TCodeSyntaxLeaf, TColumnElement, TColumnGroupElement, TComboboxInputElement, TCommentText, TDateElement, TEquationElement, TFileElement, TFontMarks, TIdElement, TIdProps, TImageElement, TIndentElement, TIndentProps, TInlineSuggestionData, TInsertSuggestionData, TLineHeightProps, TLinkElement, TListElement, TListProps, TMediaElement, TMediaEmbedElement, TMediaProps, TMentionElement, TNodeMap, TPlaceholderElement, TRemoveSuggestionData, TResizableElement, TResizableProps, TSuggestionData, TSuggestionElement, TSuggestionProps, TSuggestionText, TTableCellBorder, TTableCellElement, TTableElement, TTableRowElement, TTagElement, TTagProps, TTextAlignProps, TUpdateSuggestionData, TVideoElement, TrailingBlockConfig, TrailingBlockPlugin, withNormalizeTypes, withTrailingBlock };