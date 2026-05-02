'use client';

import * as React from 'react';

import {
  AIChatPlugin,
  useEditorChat,
  useLastAssistantMessage,
} from '@platejs/ai/react';
import { BlockSelectionPlugin, useIsSelecting } from '@platejs/selection/react';
import { getTransientSuggestionKey } from '@platejs/suggestion';
import { Command as CommandPrimitive } from 'cmdk';
import { Loader2Icon, PauseIcon } from 'lucide-react';
import {
  type NodeEntry,
  isHotkey,
  KEYS,
} from 'platejs';
import {
  useEditorPlugin,
  useFocusedLast,
  useHotkeys,
  usePluginOption,
} from 'platejs/react';
import { useEditorRef } from 'platejs/react';

import { Button } from '@/components/ui/button';
import { Command, CommandList } from '@/components/ui/command';
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

import { AIChatEditor } from './ai-chat-editor';
import {
  createVirtualAnchor,
  getCurrentSelectionRect,
  getMadenAiChatOption,
  setMadenAiChatOption,
  type LooseNodeEntry,
  type MadenAnchorRect,
  type VirtualAnchor,
} from './ai-menu-anchor';
import { buildStructuredSelectionActionPrompt } from './ai-menu-prompts';
import { AIMenuItems } from './ai-menu-items';
import { getSelectionContextInput } from './ai-selection-context';

const AI_REWRITE_SHIMMER_CLASS = 'maden-ai-rewrite-shimmer';

export function AIMenu() {
  const { api, editor } = useEditorPlugin(AIChatPlugin);
  const mode = usePluginOption(AIChatPlugin, 'mode');
  const toolName = usePluginOption(AIChatPlugin, 'toolName');

  const streaming = usePluginOption(AIChatPlugin, 'streaming');
  const isSelecting = useIsSelecting();
  const isFocusedLast = useFocusedLast();
  const open = usePluginOption(AIChatPlugin, 'open') && isFocusedLast;
  const [value, setValue] = React.useState('');

  const [input, setInput] = React.useState('');

  const chat = usePluginOption(AIChatPlugin, 'chat');

  const { messages, status } = chat;
  const [anchorElement, setAnchorElement] = React.useState<HTMLElement | VirtualAnchor | null>(
    null
  );

  const content = useLastAssistantMessage()?.parts.find(
    (part) => part.type === 'text'
  )?.text;

  React.useEffect(() => {
    if (streaming) {
      const anchor = api.aiChat.node({ anchor: true });
      setTimeout(() => {
        if (!anchor?.[0]) return;
        try {
          const anchorDom = editor.api.toDOMNode(anchor[0])!;
          setAnchorElement(anchorDom);
        } catch {
          // Anchor can disappear during AI state transitions.
        }
      }, 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streaming]);

  const setOpen = (open: boolean) => {
    if (open) {
      api.aiChat.show();
    } else {
      api.aiChat.hide();
    }
  };

  const show = (anchorElement: HTMLElement) => {
    setAnchorElement(anchorElement);
    setOpen(true);
  };

  useEditorChat({
    onOpenBlockSelection: (blocks: NodeEntry[]) => {
      const target = blocks.at(-1);
      if (!target?.[0]) return;
      show(editor.api.toDOMNode(target[0])!);
    },
    onOpenChange: (open) => {
      if (!open) {
        setAnchorElement(null);
        setInput('');
        setMadenAiChatOption(editor, 'madenAnchorPath', null);
        setMadenAiChatOption(editor, 'madenAnchorRect', null);
      }
    },
    onOpenCursor: () => {
      const blockEntry = editor.api.block({ highest: true });
      if (!blockEntry?.[0]) return;
      const [ancestor] = blockEntry;

      if (!editor.api.isAt({ end: true }) && !editor.api.isEmpty(ancestor)) {
        editor
          .getApi(BlockSelectionPlugin)
          .blockSelection.set(ancestor.id as string);
      }

      show(editor.api.toDOMNode(ancestor)!);
    },
    onOpenSelection: () => {
      const selectionRect = getCurrentSelectionRect();
      if (selectionRect) {
        setAnchorElement(
          createVirtualAnchor({
            height: selectionRect.height,
            width: selectionRect.width,
            x: selectionRect.x,
            y: selectionRect.y,
          })
        );
        setOpen(true);
        return;
      }

      const target = editor.api.blocks().at(-1);
      if (!target?.[0]) return;
      show(editor.api.toDOMNode(target[0])!);
    },
  });

  useHotkeys('esc', () => {
    api.aiChat.stop();
  });

  const isLoading = status === 'streaming' || status === 'submitted';

  React.useEffect(() => {
    if (toolName === 'edit' && mode === 'chat' && !isLoading) {
      let anchorNode = editor.api.node({
        at: [],
        reverse: true,
        match: (n) => !!n[KEYS.suggestion] && !!n[getTransientSuggestionKey()],
      }) as LooseNodeEntry | undefined;

      if (!anchorNode) {
        const storedAnchorRect = getMadenAiChatOption<Partial<MadenAnchorRect> | null>(
          editor,
          'madenAnchorRect'
        );
        if (
          storedAnchorRect &&
          typeof storedAnchorRect.x === 'number' &&
          typeof storedAnchorRect.y === 'number' &&
          typeof storedAnchorRect.width === 'number' &&
          typeof storedAnchorRect.height === 'number'
        ) {
          setAnchorElement(
            createVirtualAnchor({
              height: storedAnchorRect.height,
              width: storedAnchorRect.width,
              x: storedAnchorRect.x,
              y: storedAnchorRect.y,
            })
          );
          return;
        }
      }

      if (!anchorNode) {
        const storedAnchorPath = getMadenAiChatOption<unknown[] | null>(
          editor,
          'madenAnchorPath'
        );
        if (Array.isArray(storedAnchorPath) && storedAnchorPath.length > 0) {
          try {
            anchorNode = editor.api.block({
              at: storedAnchorPath as any,
              highest: true,
            }) as LooseNodeEntry | undefined;
          } catch {
            anchorNode = undefined;
          }
        }
      }

      if (!anchorNode) {
        const chatSelection = editor.getOption(AIChatPlugin, 'chatSelection') as
          | { anchor?: { path?: unknown }; focus?: { path?: unknown } }
          | undefined;
        const anchorPath =
          chatSelection?.anchor?.path ?? chatSelection?.focus?.path;
        if (Array.isArray(anchorPath) && anchorPath.length > 0) {
          try {
            anchorNode = editor.api.block({ at: anchorPath as any, highest: true }) as
              | LooseNodeEntry
              | undefined;
          } catch {
            anchorNode = undefined;
          }
        }
      }

      if (!anchorNode) {
        anchorNode = editor
          .getApi(BlockSelectionPlugin)
          .blockSelection.getNodes({ selectionFallback: true, sort: true })
          .at(-1);
      }

      if (!anchorNode) return;

      const block = editor.api.block({ at: anchorNode[1] });
      if (!block?.[0]) return;
      setAnchorElement(editor.api.toDOMNode(block[0])!);
      return;
    }

    if (!isLoading && toolName !== 'comment') {
      const selectedBlock = editor
        .getApi(BlockSelectionPlugin)
        .blockSelection.getNodes({ selectionFallback: true, sort: true })
        .at(-1);
      if (selectedBlock?.[0]) {
        setAnchorElement(editor.api.toDOMNode(selectedBlock[0])!);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, isLoading, mode, toolName, messages.length]);

  if (isLoading && mode === 'insert') return null;

  if (toolName === 'comment') return null;

  if (toolName === 'edit' && mode === 'chat' && isLoading) return null;

  return (
    <Popover open={open} onOpenChange={setOpen} modal={false}>
      <PopoverAnchor virtualRef={{ current: anchorElement! }} />

      <PopoverContent
        className="pointer-events-auto border-none bg-transparent p-0 shadow-none"
        style={{
          width: anchorElement?.offsetWidth,
        }}
        onEscapeKeyDown={(e) => {
          e.preventDefault();

          api.aiChat.hide();
        }}
        align="center"
        side="bottom"
      >
        <Command
          className="pointer-events-auto w-full rounded-lg border shadow-md"
          value={value}
          onValueChange={setValue}
        >
          {mode === 'chat' &&
            isSelecting &&
            content &&
            toolName === 'generate' && <AIChatEditor content={content} />}

          {isLoading ? (
            <div className="flex grow select-none items-center gap-2 p-2 text-muted-foreground text-sm">
              <Loader2Icon className="size-4 animate-spin" />
              {messages.length > 1 ? 'Editing...' : 'Thinking...'}
            </div>
          ) : (
            <CommandPrimitive.Input
              className={cn(
                'flex h-9 w-full min-w-0 border-input bg-transparent px-3 py-1 text-base outline-none transition-[color,box-shadow] placeholder:text-muted-foreground md:text-sm dark:bg-input/30',
                'aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40',
                'border-b focus-visible:ring-transparent'
              )}
              value={input}
              onKeyDown={(e) => {
                if (isHotkey('backspace')(e) && input.length === 0) {
                  e.preventDefault();
                  api.aiChat.hide();
                }
                if (isHotkey('enter')(e) && !e.shiftKey && !value) {
                  e.preventDefault();
                  const normalizedInput = input.trim();
                  if (isSelecting) {
                    const selectionRect = getCurrentSelectionRect();
                    if (selectionRect) {
                      setMadenAiChatOption(editor, 'madenAnchorRect', {
                        height: selectionRect.height,
                        width: selectionRect.width,
                        x: selectionRect.x,
                        y: selectionRect.y,
                      });
                    }
                    const anchorBlock =
                      (editor.selection
                        ? editor.api.block({ at: editor.selection, highest: true })
                        : null) ?? editor.api.block({ highest: true });
                    if (anchorBlock?.[1]) {
                      setMadenAiChatOption(
                        editor,
                        'madenAnchorPath',
                        anchorBlock[1]
                      );
                    }

                    const prompt = buildStructuredSelectionActionPrompt(
                      normalizedInput ||
                        'Decide whether the target fragment should be rewritten, commented on, or followed by an addition.',
                      getSelectionContextInput(editor, isSelecting)
                    );

                    editor.getApi(AIChatPlugin).aiChat.submit('', {
                      prompt,
                      toolName: 'comment',
                    });
                  } else {
                    const contextInput =
                      normalizedInput.length > 0
                        ? normalizedInput
                        : getSelectionContextInput(editor, isSelecting);

                    void api.aiChat.submit(contextInput);
                  }
                  setInput('');
                }
              }}
              onValueChange={setInput}
              placeholder="Ask AI anything..."
              data-plate-focus
              autoFocus
            />
          )}

          {!isLoading && (
            <CommandList>
              <AIMenuItems
                input={input}
                setInput={setInput}
                setValue={setValue}
              />
            </CommandList>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function AILoadingBar() {
  const editor = useEditorRef();

  const toolName = usePluginOption(AIChatPlugin, 'toolName');
  const chat = usePluginOption(AIChatPlugin, 'chat');
  const mode = usePluginOption(AIChatPlugin, 'mode');

  const { status } = chat;

  const { api } = useEditorPlugin(AIChatPlugin);
  const rewriteShimmerTargetsRef = React.useRef<HTMLElement[]>([]);

  const isLoading = status === 'streaming' || status === 'submitted';

  React.useEffect(() => {
    const clearGlow = () => {
      for (const element of rewriteShimmerTargetsRef.current) {
        element.classList.remove(AI_REWRITE_SHIMMER_CLASS);
      }
      rewriteShimmerTargetsRef.current = [];
    };

    clearGlow();

    const shouldGlow =
      isLoading &&
      ((mode === 'chat' && toolName === 'edit') || toolName === 'comment');
    if (!shouldGlow) {
      return clearGlow;
    }

    const blocks = editor
      .getApi(BlockSelectionPlugin)
      .blockSelection.getNodes({ selectionFallback: true, sort: true })
      .map(([block]) => block);

    const blockFromCurrentSelection = editor.selection
      ? editor.api.block({ at: editor.selection, highest: true })
      : null;
    const chatSelection = editor.getOption(AIChatPlugin, 'chatSelection') as
      | { anchor?: { path?: unknown }; focus?: { path?: unknown } }
      | undefined;
    const blockFromChatSelection = (() => {
      const anchorPath = chatSelection?.anchor?.path ?? chatSelection?.focus?.path;
      if (!anchorPath) return null;
      try {
        return editor.api.block({ at: anchorPath as any, highest: true });
      } catch {
        return null;
      }
    })();

    const targets =
      blocks.length > 0
        ? blocks
        : blockFromCurrentSelection
          ? [blockFromCurrentSelection[0]]
          : blockFromChatSelection
            ? [blockFromChatSelection[0]]
            : (() => {
                const block = editor.api.block({ highest: true });
                return block ? [block[0]] : [];
              })();

    const domTargets = targets
      .map((block) => {
        try {
          return editor.api.toDOMNode(block) as HTMLElement;
        } catch {
          return null;
        }
      })
      .filter((element): element is HTMLElement => Boolean(element));

    domTargets.forEach((element) => {
      element.classList.add(AI_REWRITE_SHIMMER_CLASS);
    });

    rewriteShimmerTargetsRef.current = domTargets;

    return clearGlow;
  }, [editor, isLoading, mode, toolName]);

  useHotkeys('esc', () => {
    api.aiChat.stop();
  });

  if (
    isLoading &&
    (mode === 'insert' ||
      toolName === 'comment' ||
      (toolName === 'edit' && mode === 'chat'))
  ) {
    return (
      <div
        className={cn(
          '-translate-x-1/2 absolute bottom-4 left-1/2 z-20 flex items-center gap-3 rounded-md border border-border bg-muted px-3 py-1.5 text-muted-foreground text-sm shadow-md transition-all duration-300'
        )}
      >
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
        <span>{status === 'submitted' ? 'Thinking...' : 'Writing...'}</span>
        <Button
          size="sm"
          variant="ghost"
          className="flex items-center gap-1 text-xs"
          onClick={() => api.aiChat.stop()}
        >
          <PauseIcon className="h-4 w-4" />
          Stop
          <kbd className="ml-1 rounded bg-border px-1 font-mono text-[10px] text-muted-foreground shadow-sm">
            Esc
          </kbd>
        </Button>
      </div>
    );
  }

  return null;
}
