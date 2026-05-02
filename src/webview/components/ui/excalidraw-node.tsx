'use client';

import * as React from 'react';

import type { TExcalidrawElement } from '@platejs/excalidraw';
import type { PlateElementProps } from 'platejs/react';

import { PencilRulerIcon } from 'lucide-react';
import { PlateElement, useEditorRef, useReadOnly } from 'platejs/react';

import { cn } from '@/lib/utils';

type ExcalidrawElementData = NonNullable<TExcalidrawElement['data']> & {
  files?: unknown;
};

const getCurrentExcalidrawTheme = (): 'light' | 'dark' => {
  if (typeof document === 'undefined') {
    return 'light';
  }

  const forcedTheme = document.body.dataset.madenTheme;
  if (forcedTheme === 'dark') {
    return 'dark';
  }
  if (forcedTheme === 'light' || forcedTheme === 'confluence') {
    return 'light';
  }

  return document.body.classList.contains('vscode-dark') ||
    document.body.classList.contains('dark')
    ? 'dark'
    : 'light';
};

const cloneSerializable = <T,>(value: T): T => {
  if (value === undefined) {
    return value;
  }

  if (typeof globalThis.structuredClone === 'function') {
    return globalThis.structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value)) as T;
};

export function ExcalidrawElement(
  props: PlateElementProps<TExcalidrawElement>
) {
  const editor = useEditorRef();
  const readOnly = useReadOnly();
  const lastSavedDataRef = React.useRef<string | null>(null);
  const [Excalidraw, setExcalidraw] =
    React.useState<React.ComponentType<any> | null>(null);
  const [theme, setTheme] = React.useState(getCurrentExcalidrawTheme);

  React.useEffect(() => {
    let mounted = true;

    import('@excalidraw/excalidraw').then((module) => {
      if (mounted) {
        setExcalidraw(() => module.Excalidraw);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  const initialData = React.useMemo(
    () => {
      const data = props.element.data as ExcalidrawElementData | null | undefined;

      return {
        appState: data?.state ? cloneSerializable(data.state) : undefined,
        elements: data?.elements ? cloneSerializable(data.elements) : [],
        files: data?.files ? cloneSerializable(data.files) : undefined,
        libraryItems: [],
        scrollToContent: true,
      };
    },
    [props.element.data]
  );

  const handleChange = React.useCallback(
    (elements: unknown, state: unknown, files: unknown) => {
      if (readOnly) return;

      const data = {
        elements: cloneSerializable(elements),
        files: cloneSerializable(files),
        state: cloneSerializable(state),
      };
      const serialized = JSON.stringify(data);

      if (lastSavedDataRef.current === serialized) {
        return;
      }

      const path = editor.api.findPath(props.element);
      if (!path) {
        return;
      }

      lastSavedDataRef.current = serialized;
      editor.tf.setNodes({ data }, { at: path });
    },
    [editor, props.element, readOnly]
  );

  React.useEffect(() => {
    const observer = new MutationObserver(() => {
      setTheme(getCurrentExcalidrawTheme());
    });

    observer.observe(document.body, {
      attributeFilter: ['class', 'data-maden-theme'],
      attributes: true,
    });

    return () => observer.disconnect();
  }, []);

  return (
    <PlateElement className="my-3" {...props}>
      <div
        className={cn(
          'maden-excalidraw relative h-[520px] min-h-[360px] overflow-hidden rounded-md border border-border bg-background',
          'focus-within:ring-2 focus-within:ring-ring/40'
        )}
        contentEditable={false}
      >
        {Excalidraw ? (
          <Excalidraw
            autoFocus={false}
            initialData={initialData}
            onChange={readOnly ? undefined : handleChange}
            theme={theme}
          />
        ) : (
          <div className="flex h-full items-center justify-center gap-2 text-muted-foreground text-sm">
            <PencilRulerIcon className="size-5" />
            <span>Loading Excalidraw...</span>
          </div>
        )}
      </div>
      {props.children}
    </PlateElement>
  );
}
