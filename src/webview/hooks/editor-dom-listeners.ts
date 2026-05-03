import type { PlateEditor } from 'platejs/react';

type EditorDomListener = {
  listener: EventListener;
  options?: boolean | AddEventListenerOptions;
  type: string;
};

const getEditorElement = (editor: PlateEditor): HTMLElement | null => {
  try {
    return editor.api.toDOMNode(editor) as HTMLElement;
  } catch {
    return document.querySelector('[data-slate-editor]') as HTMLElement | null;
  }
};

const removeListeners = (
  element: HTMLElement | null,
  listeners: EditorDomListener[]
) => {
  listeners.forEach(({ listener, options, type }) => {
    element?.removeEventListener(type, listener, options);
  });
};

const addListeners = (element: HTMLElement, listeners: EditorDomListener[]) => {
  listeners.forEach(({ listener, options, type }) => {
    element.addEventListener(type, listener, options);
  });
};

export const attachEditorDomListeners = (
  editor: PlateEditor,
  listeners: EditorDomListener[]
) => {
  let currentEditorElement: HTMLElement | null = null;

  const attach = (element: HTMLElement | null) => {
    if (!element || currentEditorElement === element) return;
    removeListeners(currentEditorElement, listeners);

    currentEditorElement = element;
    addListeners(currentEditorElement, listeners);
  };

  attach(getEditorElement(editor));
  const attachInterval = window.setInterval(() => {
    attach(getEditorElement(editor));
  }, 200);

  return () => {
    window.clearInterval(attachInterval);
    removeListeners(currentEditorElement, listeners);
  };
};
