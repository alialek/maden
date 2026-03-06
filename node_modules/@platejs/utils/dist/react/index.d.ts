import { PluginConfig } from "@platejs/core";
import { EditorPropOptions, Path, TElement } from "@platejs/slate";
import { PlatePluginContext } from "@platejs/core/react";

//#region src/react/hooks/useEditorString.d.ts
declare const useEditorString: () => any;
//#endregion
//#region src/react/hooks/useFormInputProps.d.ts
type InputProps = {
  /**
   * Should we activate the onKeyDownCapture handler to preventDefault when the
   * user presses enter?
   */
  preventDefaultOnEnterKeydown?: boolean;
};
/**
 * Hook to allow the user to spread a set of predefined props to the Div wrapper
 * of an Input element
 *
 * @param param0 An options object which can be expanded to add further
 *   functionality
 * @returns A props object which can be spread onto the element
 */
declare const useFormInputProps: (options?: InputProps) => {
  props: {
    onKeyDownCapture?: undefined;
  };
} | {
  props: {
    onKeyDownCapture: ((e: React.KeyboardEvent<HTMLDivElement>) => void) | undefined;
  };
};
//#endregion
//#region src/react/hooks/useMarkToolbarButton.d.ts
declare const useMarkToolbarButtonState: ({
  clear,
  nodeType
}: {
  nodeType: string;
  clear?: string[] | string;
}) => {
  clear: string | string[] | undefined;
  nodeType: string;
  pressed: any;
};
declare const useMarkToolbarButton: (state: ReturnType<typeof useMarkToolbarButtonState>) => {
  props: {
    pressed: any;
    onClick: () => void;
    onMouseDown: (e: React.MouseEvent<HTMLButtonElement>) => void;
  };
};
//#endregion
//#region src/react/hooks/useRemoveNodeButton.d.ts
declare const useRemoveNodeButton: ({
  element
}: {
  element: TElement;
}) => {
  props: {
    onClick: () => void;
    onMouseDown: (e: React.MouseEvent<HTMLButtonElement>) => void;
  };
};
//#endregion
//#region src/react/hooks/useSelection.d.ts
declare function useSelectionCollapsed(): boolean;
declare function useSelectionExpanded(): any;
declare function useSelectionWithinBlock(): any;
declare function useSelectionAcrossBlocks(): any;
//#endregion
//#region src/react/hooks/useSelectionFragment.d.ts
declare const useSelectionFragment: () => any;
declare const useSelectionFragmentProp: (options?: Omit<EditorPropOptions, "nodes">) => any;
//#endregion
//#region src/react/plugins/BlockPlaceholderPlugin.d.ts
type BlockPlaceholderConfig = PluginConfig<'blockPlaceholder', {
  _target: {
    node: TElement;
    placeholder: string;
  } | null;
  placeholders: Record<string, string>;
  query: (context: PlatePluginContext<BlockPlaceholderConfig> & {
    node: TElement;
    path: Path;
  }) => boolean;
  className?: string;
}>;
declare const BlockPlaceholderPlugin: any;
//#endregion
export { BlockPlaceholderConfig, BlockPlaceholderPlugin, useEditorString, useFormInputProps, useMarkToolbarButton, useMarkToolbarButtonState, useRemoveNodeButton, useSelectionAcrossBlocks, useSelectionCollapsed, useSelectionExpanded, useSelectionFragment, useSelectionFragmentProp, useSelectionWithinBlock };