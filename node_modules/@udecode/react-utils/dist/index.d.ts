import React, { DependencyList, JSX } from "react";

//#region src/Box.d.ts
declare const Box: React.ForwardRefExoticComponent<{
  as?: React.ElementType;
  asChild?: boolean;
} & Omit<React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>, "ref"> & React.RefAttributes<any>>;
type BoxProps = React.ComponentPropsWithRef<typeof Box>;
//#endregion
//#region src/MemoizedChildren.d.ts
declare const MemoizedChildren: React.MemoExoticComponent<({
  children
}: {
  children: React.ReactNode;
}) => React.JSX.Element>;
//#endregion
//#region src/PortalBody.d.ts
type PortalBodyProps = {
  children: React.ReactNode;
  element?: Element;
};
declare const PortalBody: ({
  children,
  element
}: PortalBodyProps) => React.ReactPortal;
//#endregion
//#region src/Text.d.ts
declare const Text: React.ForwardRefExoticComponent<{
  as?: React.ElementType;
  asChild?: boolean;
} & Omit<React.DetailedHTMLProps<React.HTMLAttributes<HTMLSpanElement>, HTMLSpanElement>, "ref"> & React.RefAttributes<any>>;
type TextProps = React.ComponentPropsWithRef<typeof Text>;
//#endregion
//#region src/composeEventHandlers.d.ts
/** @see https://github.com/radix-ui/primitives/blob/b324ec2d7ddf13a2a115cb5b11478e24d2f45b87/packages/core/primitive/src/primitive.tsx#L1 */
declare const composeEventHandlers: <E>(originalEventHandler?: (event: E) => void, ourEventHandler?: (event: E) => void, {
  checkForDefaultPrevented
}?: {
  checkForDefaultPrevented?: boolean | undefined;
}) => (event: E) => void;
//#endregion
//#region src/createPrimitiveComponent.d.ts
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
declare const createPrimitiveComponent: <T extends React.ElementType, P extends React.ComponentPropsWithoutRef<T>>(element: T) => <SH extends (options: any) => any, PH extends (state: any) => any>({
  propsHook,
  stateHook
}?: {
  propsHook?: PH;
  stateHook?: SH;
}) => React.ForwardRefExoticComponent<React.PropsWithoutRef<{
  as?: React.ElementType;
  asChild?: boolean;
  className?: string;
  options?: Parameters<SH>[0];
  state?: Parameters<PH>[0];
  style?: React.CSSProperties;
  setProps?: (hookProps: NonNullable<ReturnType<PH>["props"]>) => P;
} & P> & React.RefAttributes<any>>;
//#endregion
//#region src/createPrimitiveElement.d.ts
declare function createPrimitiveElement<T extends keyof HTMLElementTagNameMap>(tag: T): React.ForwardRefExoticComponent<React.PropsWithoutRef<JSX.IntrinsicElements[T]> & React.RefAttributes<HTMLElementTagNameMap[T]>>;
//#endregion
//#region src/createSlotComponent.d.ts
declare const createSlotComponent: <T extends React.ElementType, P extends React.ComponentPropsWithoutRef<T>>(element: T) => React.ForwardRefExoticComponent<React.PropsWithoutRef<{
  as?: React.ElementType;
  asChild?: boolean;
} & P> & React.RefAttributes<any>>;
//#endregion
//#region src/useComposedRef.d.ts
type PossibleRef<T> = React.Ref<T> | undefined;
/**
 * A utility to compose multiple refs together Accepts callback refs and
 * React.RefObject(s)
 */
declare const composeRefs: <T>(...refs: PossibleRef<T>[]) => (node: T) => (() => void) | undefined;
/**
 * A custom hook that composes multiple refs Accepts callback refs and
 * React.RefObject(s)
 */
declare const useComposedRef: <T>(...refs: PossibleRef<T>[]) => (node: T) => (() => void) | undefined;
//#endregion
//#region src/useEffectOnce.d.ts
declare function useEffectOnce(effect: React.EffectCallback, deps: React.DependencyList): void;
//#endregion
//#region src/useIsomorphicLayoutEffect.d.ts
declare const CAN_USE_DOM: boolean;
/**
 * Prevent warning on SSR by falling back to React.useEffect when DOM isn't
 * available
 */
declare const useIsomorphicLayoutEffect: typeof React.useEffect;
//#endregion
//#region src/useMemoizedSelector.d.ts
/**
 * Re-render only when the selector result changes.
 *
 * @param selector A function that derives a value from deps
 * @param deps Dependencies on which to run the selector
 * @param equalityFn Optional comparison function to detect changes in the
 *   derived value
 */
declare function useMemoizedSelector<R$1>(selector: () => R$1, deps: React.DependencyList, equalityFn?: (a: R$1, b: R$1) => boolean): R$1;
//#endregion
//#region src/useOnClickOutside.d.ts
declare const DEFAULT_IGNORE_CLASS = "ignore-onclickoutside";
type UseOnClickOutsideCallback<T extends Event = Event> = (event: T) => void;
type UseOnClickOutsideOptions = {
  detectIFrame?: boolean;
  disabled?: boolean;
  eventTypes?: string[];
  excludeScrollbar?: boolean;
  ignoreClass?: string[] | string;
  refs?: Refs;
};
type UseOnClickOutsideReturn = (element: El | null) => void;
type El = HTMLElement;
type Refs = React.RefObject<El | null>[];
declare const useOnClickOutside: (callback: UseOnClickOutsideCallback, {
  detectIFrame,
  disabled,
  eventTypes,
  excludeScrollbar,
  ignoreClass,
  refs: refsOpt
}?: UseOnClickOutsideOptions) => UseOnClickOutsideReturn;
//#endregion
//#region src/useStableFn.d.ts
/**
 * Create a stable version of a function that can be used in dependency arrays
 * without causing hooks like useEffect to re-run if the function changes.
 * Calling the returned function always calls the most recent version of the
 * function that was passed to useStableFn.
 *
 * If you do want the function to be replaced when certain dependency values
 * change, include those values in the dependency array of useStableFn.
 */
declare const useStableFn: <A extends unknown[], R$1>(fn: (...args: A) => R$1, deps?: DependencyList) => (...args: A) => R$1;
//#endregion
//#region src/useStableMemo.d.ts
declare const useStableMemo: <T>(producer: () => T, deps?: React.DependencyList) => T;
//#endregion
//#region src/withProviders.d.ts
/**
 * Wrap a component into multiple providers. If there are any props that you
 * want a provider to receive, you can simply pass an array.
 */
declare const withProviders: (...providers: any[]) => <T>(WrappedComponent: React.FC<T>) => (props: T) => any;
//#endregion
//#region src/withRef.d.ts
type ElementType<P = any> = React.ComponentType<P> | { [K in keyof JSX.IntrinsicElements]: P extends JSX.IntrinsicElements[K] ? K : never }[keyof JSX.IntrinsicElements];
type ForwardRefComponent<T, P = {}> = React.ForwardRefExoticComponent<React.PropsWithoutRef<P> & React.RefAttributes<T>>;
type InferElementRef<T> = T extends ElementType<any> ? T extends keyof JSX.IntrinsicElements ? JSX.IntrinsicElements[T] extends React.DetailedHTMLProps<React.HTMLAttributes<infer R>, any> ? R : never : T extends React.ComponentType<any> ? T extends React.ComponentClass<any> ? InstanceType<T> : T extends React.ForwardRefExoticComponent<any> ? React.ComponentPropsWithRef<T>['ref'] extends React.Ref<infer R> ? R : never : never : never : never;
/**
 * Shorter alternative to `React.forwardRef`.
 *
 * @generic1 Component type or element type
 * @generic2 Extended prop types
 */
declare function withRef<T extends ElementType, P = {}>(renderFunction: React.ForwardRefRenderFunction<InferElementRef<T>, React.ComponentPropsWithoutRef<T> & P>): ForwardRefComponent<InferElementRef<T>, React.ComponentPropsWithoutRef<T> & P>;
//#endregion
export { Box, BoxProps, CAN_USE_DOM, DEFAULT_IGNORE_CLASS, MemoizedChildren, PortalBody, PortalBodyProps, Text, TextProps, UseOnClickOutsideCallback, UseOnClickOutsideOptions, UseOnClickOutsideReturn, composeEventHandlers, composeRefs, createPrimitiveComponent, createPrimitiveElement, createSlotComponent, useComposedRef, useEffectOnce, useIsomorphicLayoutEffect, useMemoizedSelector, useOnClickOutside, useStableFn, useStableMemo, withProviders, withRef };