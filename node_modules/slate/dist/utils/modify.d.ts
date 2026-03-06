import { Ancestor, Descendant, Path, Text } from '../interfaces';
export declare const insertChildren: <T>(xs: T[], index: number, ...newValues: T[]) => T[];
export declare const replaceChildren: <T>(xs: T[], index: number, removeCount: number, ...newValues: T[]) => T[];
export declare const removeChildren: <T>(xs: T[], index: number, removeCount: number, ...newValues: T[]) => T[];
/**
 * Replace a descendant with a new node, replacing all ancestors
 */
export declare const modifyDescendant: <N extends Descendant>(root: Ancestor, path: Path, f: (node: N) => N) => void;
/**
 * Replace the children of a node, replacing all ancestors
 */
export declare const modifyChildren: (root: Ancestor, path: Path, f: (children: Descendant[]) => Descendant[]) => void;
/**
 * Replace a leaf, replacing all ancestors
 */
export declare const modifyLeaf: (root: Ancestor, path: Path, f: (leaf: Text) => Text) => void;
//# sourceMappingURL=modify.d.ts.map