//#region src/environment.d.ts
declare const IS_APPLE: boolean;
//#endregion
//#region src/escapeRegexp.d.ts
declare const escapeRegExp: (text: string) => string;
//#endregion
//#region src/findHtmlParentElement.d.ts
declare const findHtmlParentElement: (el: HTMLElement | null, nodeName: string) => HTMLElement | null;
//#endregion
//#region src/getHandler.d.ts
/** Call a handler if defined */
declare const getHandler: <T extends (...args: any) => any>(cb?: T, ...args: Parameters<T>) => () => void;
//#endregion
//#region src/hexToBase64.d.ts
declare const hexToBase64: (hex: string) => string;
//#endregion
//#region src/isUrl.d.ts
/**
 * RegExps. A URL must match #1 and then at least one of #2/#3. Use two levels
 * of REs to avoid REDOS.
 */
/** Loosely validate a URL `string`. */
declare const isUrl: (string: any) => boolean;
//#endregion
//#region src/mergeProps.d.ts
/** Merge props by composing handlers. */
declare const mergeProps: <T>(props?: T, overrideProps?: T, {
  handlerKeys,
  handlerQuery
}?: {
  /** The keys of the handlers to merge. */
  handlerKeys?: string[];
  /**
   * A function that returns true if it's a handler to merge.
   *
   * Default: keys having `on` prefix.
   */
  handlerQuery?: ((key: string) => boolean) | null;
}) => T;
//#endregion
//#region src/sanitizeUrl.d.ts
type SanitizeUrlOptions = {
  allowedSchemes?: string[];
  permitInvalid?: boolean;
};
declare const sanitizeUrl: (url: string | undefined, {
  allowedSchemes,
  permitInvalid
}: SanitizeUrlOptions) => string | null;
//#endregion
//#region src/type-utils.d.ts
/** @returns Whether the provided parameter is undefined. */
declare const isUndefined: (obj: any) => obj is undefined;
declare const isNull: (obj: any) => obj is null;
/** @returns Whether the provided parameter is undefined or null. */
declare const isUndefinedOrNull: (obj: any) => obj is null | undefined;
/** @returns Whether the provided parameter is defined. */
declare const isDefined: <T>(arg: T | null | undefined) => arg is T;
declare function bindFirst<T, Args extends any[], R$1>(fn: (first: T, ...args: Args) => R$1, firstArg: T): (...args: Args) => R$1;
//#endregion
//#region src/types/AnyObject.d.ts
/** Any function. */
type AnyFunction = (...args: any) => any;
type AnyObject = Record<string, any>;
type UnknownObject = Record<string, unknown>;
//#endregion
//#region src/types/Deep.d.ts
declare type DeepPartial<T> = T extends (infer U)[] ? DeepPartial<U>[] : T extends readonly (infer U)[] ? readonly DeepPartial<U>[] : T extends { [key in keyof T]: T[key] } ? { [K in keyof T]?: DeepPartial<T[K]> } : T;
/** 2 levels deep of partial */
type Deep2Partial<T> = { [K in keyof T]?: T[K] extends ((...args: any[]) => any) ? T[K] : Deep2Partial<T[K]> };
type DeepRequired<T> = { [K in keyof T]-?: T[K] extends object ? DeepRequired<T[K]> : T[K] };
//#endregion
//#region src/types/FunctionProperties.d.ts
/** Get the properties from an interface which are functions */
type FunctionProperties<T> = Pick<T, FunctionPropertyNames<T>>;
/** Get the property names from an interface which are functions */
type FunctionPropertyNames<T> = { [K in keyof T]: T[K] extends ((...args: any) => any) ? K : never }[keyof T];
//#endregion
//#region src/types/Nullable.d.ts
type Nullable<T> = { [P in keyof T]: T[P] | null };
//#endregion
//#region src/types/WithOptional.d.ts
type WithOptional<T, K$1 extends keyof T> = Omit<T, K$1> & Partial<Pick<T, K$1>>;
//#endregion
//#region src/types/types.d.ts
type DeepPartialAny<T> = { [P in keyof T]?: T[P] extends AnyObject ? DeepPartialAny<T[P]> : any };
/** Modify type properties. https://stackoverflow.com/a/55032655/6689201 */
type Modify<T, R$1> = Omit<T, keyof R$1> & R$1;
/**
 * Makes each property optional and turns each leaf property into any, allowing
 * for type overrides by narrowing any.
 */
/** Modify deep type properties. https://stackoverflow.com/a/65561287/6689201 */
type ModifyDeep<A extends AnyObject, B extends DeepPartialAny<A>> = { [K in keyof A]: B[K] extends never ? A[K] : B[K] extends AnyObject ? ModifyDeep<A[K], B[K]> : B[K] } & (A extends AnyObject ? Omit<B, keyof A> : A);
type OmitFirst<F> = F extends ((x: any, ...args: infer P) => infer R) ? (...args: P) => R : never;
type PartialExcept<T, K$1 extends keyof T> = Partial<T> & Pick<T, K$1>;
type PartialPick<T, K$1 extends keyof T> = { [P in K$1]?: T[P] };
/** Simplify a complex type expression into a single object. */
type Simplify<T> = T extends any[] | Date ? T : { [K in keyof T]: T[K] } & {};
/** Turn a union type into an intersection. */
type UnionToIntersection<U$1> = (U$1 extends any ? (k: U$1) => void : never) extends ((k: infer I) => void) ? I : never;
type WithPartial<T, K$1 extends keyof T> = Omit<T, K$1> & Partial<T>;
type WithRequired<T, K$1 extends keyof T> = Omit<T, K$1> & Required<Pick<T, K$1>>;
type StrictExtract<Type, Union extends Partial<Type>> = Extract<Type, Union>;
//#endregion
export { AnyFunction, AnyObject, Deep2Partial, DeepPartial, DeepPartialAny, DeepRequired, FunctionProperties, FunctionPropertyNames, IS_APPLE, Modify, ModifyDeep, Nullable, OmitFirst, PartialExcept, PartialPick, SanitizeUrlOptions, Simplify, StrictExtract, UnionToIntersection, UnknownObject, WithOptional, WithPartial, WithRequired, bindFirst, escapeRegExp, findHtmlParentElement, getHandler, hexToBase64, isDefined, isNull, isUndefined, isUndefinedOrNull, isUrl, mergeProps, sanitizeUrl };