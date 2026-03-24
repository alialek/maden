'use client';

import * as React from 'react';

import {
  AIChatPlugin,
  AIPlugin,
  useEditorChat,
  useLastAssistantMessage,
} from '@platejs/ai/react';
import { serializeMd } from '@platejs/markdown';
import { BlockSelectionPlugin, useIsSelecting } from '@platejs/selection/react';
import { getTransientSuggestionKey } from '@platejs/suggestion';
import { Command as CommandPrimitive } from 'cmdk';
import {
  Album,
  BadgeHelp,
  BookOpenCheck,
  Check,
  CornerUpLeft,
  FeatherIcon,
  ListEnd,
  ListMinus,
  ListPlus,
  Loader2Icon,
  PauseIcon,
  PenLine,
  SmileIcon,
  Wand,
  X,
} from 'lucide-react';
import {
  type NodeEntry,
  type SlateEditor,
  isHotkey,
  KEYS,
  NodeApi,
} from 'platejs';
import {
  useEditorPlugin,
  useFocusedLast,
  useHotkeys,
  usePluginOption,
} from 'platejs/react';
import { type PlateEditor, useEditorRef } from 'platejs/react';

import { Button } from '@/components/ui/button';
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

import { AIChatEditor } from './ai-chat-editor';

const AI_REWRITE_SHIMMER_CLASS = 'maden-ai-rewrite-shimmer';

type VirtualAnchor = {
  getBoundingClientRect: () => DOMRect;
  offsetWidth: number;
};

const getCurrentSelectionRect = (): DOMRect | null => {
  if (typeof window === 'undefined') return null;
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return null;
  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();
  if (rect.width > 0 || rect.height > 0) {
    return rect;
  }
  const fallback = range.getClientRects().item(0);
  return fallback ?? null;
};

const createVirtualAnchor = (rect: {
  height: number;
  width: number;
  x: number;
  y: number;
}): VirtualAnchor => ({
  getBoundingClientRect: () =>
    DOMRect.fromRect({
      height: rect.height,
      width: rect.width,
      x: rect.x,
      y: rect.y,
    }),
  offsetWidth: rect.width,
});

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
        editor.setOption(AIChatPlugin, 'madenAnchorPath', null as any);
        editor.setOption(AIChatPlugin, 'madenAnchorRect', null as any);
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

    // remove when you implement the route /api/ai/command
    (chat as any)._abortFakeStream();
  });

  const isLoading = status === 'streaming' || status === 'submitted';

  React.useEffect(() => {
    if (toolName === 'edit' && mode === 'chat' && !isLoading) {
      let anchorNode = editor.api.node({
        at: [],
        reverse: true,
        match: (n) => !!n[KEYS.suggestion] && !!n[getTransientSuggestionKey()],
      });

      if (!anchorNode) {
        const storedAnchorRect = editor.getOption(AIChatPlugin, 'madenAnchorRect') as
          | { height?: unknown; width?: unknown; x?: unknown; y?: unknown }
          | null
          | undefined;
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
        const storedAnchorPath = editor.getOption(AIChatPlugin, 'madenAnchorPath') as
          | unknown[]
          | null
          | undefined;
        if (Array.isArray(storedAnchorPath) && storedAnchorPath.length > 0) {
          try {
            anchorNode = editor.api.block({
              at: storedAnchorPath as any,
              highest: true,
            }) as NodeEntry | undefined;
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
              | NodeEntry
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
                      editor.setOption(AIChatPlugin, 'madenAnchorRect', {
                        height: selectionRect.height,
                        width: selectionRect.width,
                        x: selectionRect.x,
                        y: selectionRect.y,
                      } as any);
                    }
                    const anchorBlock =
                      (editor.selection
                        ? editor.api.block({ at: editor.selection, highest: true })
                        : null) ?? editor.api.block({ highest: true });
                    if (anchorBlock?.[1]) {
                      editor.setOption(
                        AIChatPlugin,
                        'madenAnchorPath',
                        anchorBlock[1] as any
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

type EditorChatState =
  | 'selectionCommand'
  | 'selectionSuggestion';

const AICommentIcon = () => (
  <svg
    fill="none"
    height="24"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="2"
    viewBox="0 0 24 24"
    width="24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M0 0h24v24H0z" fill="none" stroke="none" />
    <path d="M8 9h8" />
    <path d="M8 13h4.5" />
    <path d="M10 19l-1 -1h-3a3 3 0 0 1 -3 -3v-8a3 3 0 0 1 3 -3h12a3 3 0 0 1 3 3v4.5" />
    <path d="M17.8 20.817l-2.172 1.138a.392 .392 0 0 1 -.568 -.41l.415 -2.411l-1.757 -1.707a.389 .389 0 0 1 .217 -.665l2.428 -.352l1.086 -2.193a.392 .392 0 0 1 .702 0l1.086 2.193l2.428 .352a.39 .39 0 0 1 .217 .665l-1.757 1.707l.414 2.41a.39 .39 0 0 1 -.567 .411l-2.172 -1.138z" />
  </svg>
);

const SELECTION_ONLY_EDIT_INSTRUCTION = [
  'Edit only the fragment inside <target-text>...</target-text>.',
  'Use <context-above>...</context-above> and <context-below>...</context-below> only for coherence.',
  'Do not rewrite text outside the target fragment.',
  'Return only replacement text for the target fragment.',
  'Preserve the markdown structure of the target fragment.',
  'Keep the same block type, same block count, and same overall format as the target fragment.',
  'If the target fragment is a heading, return only a heading.',
  'Do not pull sentences, details, or arguments from the context into the replacement unless they already exist in the target fragment.',
  'No explanations, headings, quotes, or code fences.',
  'Keep the replacement concise and naturally integrated.',
].join(' ');

const buildSelectionActionPrompt = (
  actionInstruction: string,
  contextInput: string
): string => {
  const context = contextInput.trim();
  return context
    ? `${actionInstruction}\n\n${SELECTION_ONLY_EDIT_INSTRUCTION}\n\n${context}`
    : `${actionInstruction}\n\n${SELECTION_ONLY_EDIT_INSTRUCTION}`;
};

const STRUCTURED_SELECTION_ACTION_INSTRUCTION = [
  'Return a structured response using this exact wrapper:',
  '<maden-response action="inline|comment|add">',
  'YOUR CONTENT',
  '</maden-response>',
  'Choose action="inline" when the target fragment should be rewritten directly.',
  'Choose action="comment" when feedback should be added as a comment without changing the target fragment.',
  'Choose action="add" when new text should be inserted after the target fragment.',
  'For action="inline", return only replacement text for the target fragment and preserve its markdown structure.',
  'For action="comment", return only the comment text.',
  'For action="add", return only the text to insert after the target fragment.',
  'Do not return explanations outside the wrapper.',
].join(' ');

const buildStructuredSelectionActionPrompt = (
  actionInstruction: string,
  contextInput: string
) => {
  const context = contextInput.trim();
  return context
    ? `${actionInstruction}\n\n${STRUCTURED_SELECTION_ACTION_INSTRUCTION}\n\n${context}`
    : `${actionInstruction}\n\n${STRUCTURED_SELECTION_ACTION_INSTRUCTION}`;
};

const aiChatItems = {
  accept: {
    icon: <Check />,
    label: 'Accept',
    value: 'accept',
    onSelect: ({ aiEditor, editor }) => {
      const { mode, toolName } = editor.getOptions(AIChatPlugin);

      if (mode === 'chat' && toolName === 'generate') {
        return editor
          .getTransforms(AIChatPlugin)
          .aiChat.replaceSelection(aiEditor);
      }

      editor.getTransforms(AIChatPlugin).aiChat.accept();
      editor.tf.focus({ edge: 'end' });
    },
  },
  comment: {
    icon: <AICommentIcon />,
    label: 'Comment',
    value: 'comment',
    onSelect: ({ editor, input }) => {
      editor.getApi(AIChatPlugin).aiChat.submit('', {
        mode: 'insert',
        prompt: buildSelectionActionPrompt(
          'Provide concise feedback only for the target fragment.',
          input
        ),
        toolName: 'comment',
      });
    },
  },
  continueWrite: {
    icon: <PenLine />,
    label: 'Continue writing',
    value: 'continueWrite',
    onSelect: ({ editor, input }) => {
      const ancestorNode = editor.api.block({ highest: true });

      if (!ancestorNode) return;

      const isEmpty = NodeApi.string(ancestorNode[0]).trim().length === 0;

      void editor.getApi(AIChatPlugin).aiChat.submit(input, {
        mode: 'insert',
        prompt: isEmpty
          ? `<Document>
{editor}
</Document>
Start writing a new paragraph AFTER <Document> ONLY ONE SENTENCE`
          : 'Continue writing AFTER <Block> ONLY ONE SENTENCE. DONT REPEAT THE TEXT.',
        toolName: 'generate',
      });
    },
  },
  discard: {
    icon: <X />,
    label: 'Discard',
    shortcut: 'Escape',
    value: 'discard',
    onSelect: ({ editor }) => {
      editor.getTransforms(AIPlugin).ai.undo();
      editor.getApi(AIChatPlugin).aiChat.hide();
    },
  },
  emojify: {
    icon: <SmileIcon />,
    label: 'Emojify',
    value: 'emojify',
    onSelect: ({ editor, input }) => {
      void editor.getApi(AIChatPlugin).aiChat.submit('', {
        prompt: buildSelectionActionPrompt(
          'Add a small number of contextually relevant emojis in the target fragment only. Preserve markdown, links, and line breaks.',
          input
        ),
        toolName: 'edit',
      });
    },
  },
  explain: {
    icon: <BadgeHelp />,
    label: 'Explain',
    value: 'explain',
    onSelect: ({ editor, input }) => {
      void editor.getApi(AIChatPlugin).aiChat.submit(input, {
        prompt: {
          default: 'Explain {editor}',
          selecting: 'Explain',
        },
        toolName: 'generate',
      });
    },
  },
  fixSpelling: {
    icon: <Check />,
    label: 'Fix spelling & grammar',
    value: 'fixSpelling',
    onSelect: ({ editor, input }) => {
      void editor.getApi(AIChatPlugin).aiChat.submit('', {
        prompt: buildSelectionActionPrompt(
          'Fix spelling, grammar, and punctuation without changing meaning or tone.',
          input
        ),
        toolName: 'edit',
      });
    },
  },
  generateMarkdownSample: {
    icon: <BookOpenCheck />,
    label: 'Generate Markdown sample',
    value: 'generateMarkdownSample',
    onSelect: ({ editor, input }) => {
      void editor.getApi(AIChatPlugin).aiChat.submit(input, {
        prompt: 'Generate a markdown sample',
        toolName: 'generate',
      });
    },
  },
  generateMdxSample: {
    icon: <BookOpenCheck />,
    label: 'Generate MDX sample',
    value: 'generateMdxSample',
    onSelect: ({ editor, input }) => {
      void editor.getApi(AIChatPlugin).aiChat.submit(input, {
        prompt: 'Generate a mdx sample',
        toolName: 'generate',
      });
    },
  },
  improveWriting: {
    icon: <Wand />,
    label: 'Improve writing',
    value: 'improveWriting',
    onSelect: ({ editor, input }) => {
      void editor.getApi(AIChatPlugin).aiChat.submit('', {
        prompt: buildSelectionActionPrompt(
          'Improve clarity and flow without adding new information.',
          input
        ),
        toolName: 'edit',
      });
    },
  },
  insertBelow: {
    icon: <ListEnd />,
    label: 'Insert below',
    value: 'insertBelow',
    onSelect: ({ aiEditor, editor }) => {
      /** Format: 'none' Fix insert table */
      void editor
        .getTransforms(AIChatPlugin)
        .aiChat.insertBelow(aiEditor, { format: 'none' });
    },
  },
  makeLonger: {
    icon: <ListPlus />,
    label: 'Make longer',
    value: 'makeLonger',
    onSelect: ({ editor, input }) => {
      void editor.getApi(AIChatPlugin).aiChat.submit('', {
        prompt: buildSelectionActionPrompt(
          'Make the target fragment slightly longer by elaborating existing ideas without changing meaning.',
          input
        ),
        toolName: 'edit',
      });
    },
  },
  makeShorter: {
    icon: <ListMinus />,
    label: 'Make shorter',
    value: 'makeShorter',
    onSelect: ({ editor, input }) => {
      void editor.getApi(AIChatPlugin).aiChat.submit('', {
        prompt: buildSelectionActionPrompt(
          'Make the target fragment shorter by reducing verbosity while preserving essential meaning.',
          input
        ),
        toolName: 'edit',
      });
    },
  },
  replace: {
    icon: <Check />,
    label: 'Replace selection',
    value: 'replace',
    onSelect: ({ aiEditor, editor }) => {
      void editor.getTransforms(AIChatPlugin).aiChat.replaceSelection(aiEditor);
    },
  },
  simplifyLanguage: {
    icon: <FeatherIcon />,
    label: 'Simplify language',
    value: 'simplifyLanguage',
    onSelect: ({ editor, input }) => {
      void editor.getApi(AIChatPlugin).aiChat.submit('', {
        prompt: buildSelectionActionPrompt(
          'Simplify wording in the target fragment without changing meaning.',
          input
        ),
        toolName: 'edit',
      });
    },
  },
  summarize: {
    icon: <Album />,
    label: 'Add a summary',
    value: 'summarize',
    onSelect: ({ editor, input }) => {
      void editor.getApi(AIChatPlugin).aiChat.submit(input, {
        mode: 'insert',
        prompt: {
          default: 'Summarize {editor}',
          selecting: 'Summarize',
        },
        toolName: 'generate',
      });
    },
  },
  tryAgain: {
    icon: <CornerUpLeft />,
    label: 'Try again',
    value: 'tryAgain',
    onSelect: ({ editor }) => {
      void editor.getApi(AIChatPlugin).aiChat.reload();
    },
  },
} satisfies Record<
  string,
  {
    icon: React.ReactNode;
    label: string;
    value: string;
    component?: React.ComponentType<{ menuState: EditorChatState }>;
    filterItems?: boolean;
    items?: { label: string; value: string }[];
    shortcut?: string;
    onSelect?: ({
      aiEditor,
      editor,
      input,
    }: {
      aiEditor: SlateEditor;
      editor: PlateEditor;
      input: string;
    }) => void;
  }
>;

const menuStateItems: Record<
  EditorChatState,
  {
    items: (typeof aiChatItems)[keyof typeof aiChatItems][];
    heading?: string;
  }[]
> = {
  selectionCommand: [
    {
      items: [
        aiChatItems.improveWriting,
        aiChatItems.comment,
        aiChatItems.emojify,
        aiChatItems.makeLonger,
        aiChatItems.makeShorter,
        aiChatItems.fixSpelling,
        aiChatItems.simplifyLanguage,
      ],
    },
  ],
  selectionSuggestion: [
    {
      items: [
        aiChatItems.accept,
        aiChatItems.discard,
        aiChatItems.insertBelow,
        aiChatItems.tryAgain,
      ],
    },
  ],
};

const blockPlainText = (block: unknown): string => {
  if (!block) return '';
  return NodeApi.string(block as any).replace(/\s+/g, ' ').trim();
};

const getNeighborIndexes = (
  children: any[],
  targetIndexes: number[],
  direction: 'above' | 'below',
  limit: number
): number[] => {
  const sortedTargets = [...targetIndexes].sort((a, b) => a - b);
  if (sortedTargets.length === 0) return [];

  const picked: number[] = [];

  if (direction === 'above') {
    for (let index = sortedTargets[0] - 1; index >= 0; index -= 1) {
      if (targetIndexes.includes(index)) continue;
      if (!blockPlainText(children[index])) continue;
      picked.push(index);
      if (picked.length >= limit) break;
    }
    return picked.reverse();
  }

  for (
    let index = sortedTargets[sortedTargets.length - 1] + 1;
    index < children.length;
    index += 1
  ) {
    if (targetIndexes.includes(index)) continue;
    if (!blockPlainText(children[index])) continue;
    picked.push(index);
    if (picked.length >= limit) break;
  }

  return picked;
};

const getSelectionContextInput = (
  editor: PlateEditor,
  isSelecting: boolean
): string => {
  try {
    const topLevelChildren = Array.isArray(editor.children)
      ? (editor.children as any[])
      : [];
    const selectedBlocks = editor
      .getApi(BlockSelectionPlugin)
      .blockSelection.getNodes({ selectionFallback: true, sort: true })
      .map(([block]) => block);
    const selectedIds = selectedBlocks
      .map((block) => (block as { id?: unknown }).id)
      .filter((id): id is string => typeof id === 'string');
    const targetIndexes = topLevelChildren
      .map((block, index) => ({
        id: (block as { id?: unknown }).id,
        index,
      }))
      .filter(({ id }) => typeof id === 'string' && selectedIds.includes(id))
      .map(({ index }) => index);

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
    const currentBlock =
      blockFromCurrentSelection ??
      blockFromChatSelection ??
      editor.api.block({ highest: true }) ??
      null;
    const currentIndex = currentBlock
      ? topLevelChildren.findIndex((block) => block === currentBlock[0])
      : topLevelChildren.findIndex((block) => Boolean(blockPlainText(block)));

    const effectiveTargetIndexes =
      targetIndexes.length > 0
        ? targetIndexes
        : currentIndex >= 0
          ? [currentIndex]
          : [];

    let targetMarkdown = '';

    if (editor.api.isExpanded()) {
      const fragment = editor.api.fragment();
      if (fragment && fragment.length > 0) {
        targetMarkdown = serializeMd(editor, { value: fragment as any }).trim();
      }
    }

    if (!targetMarkdown && selectedBlocks.length > 0) {
      targetMarkdown = serializeMd(editor, { value: selectedBlocks as any }).trim();
    }

    if (!targetMarkdown && currentBlock) {
      targetMarkdown = serializeMd(editor, { value: [currentBlock[0]] as any }).trim();
    }

    if (!targetMarkdown && currentIndex >= 0) {
      targetMarkdown = serializeMd(editor, { value: [topLevelChildren[currentIndex]] as any }).trim();
    }

    if (!targetMarkdown) {
      return '';
    }

    const aboveIndexes = getNeighborIndexes(
      topLevelChildren,
      effectiveTargetIndexes,
      'above',
      2
    );
    const belowIndexes = getNeighborIndexes(
      topLevelChildren,
      effectiveTargetIndexes,
      'below',
      2
    );

    const aboveMarkdown = aboveIndexes
      .map((index) =>
        serializeMd(editor, { value: [topLevelChildren[index]] as any }).trim()
      )
      .filter(Boolean)
      .join('\n\n');

    const belowMarkdown = belowIndexes
      .map((index) =>
        serializeMd(editor, { value: [topLevelChildren[index]] as any }).trim()
      )
      .filter(Boolean)
      .join('\n\n');

    return [
      aboveMarkdown ? `<context-above>\n${aboveMarkdown}\n</context-above>` : '',
      `<target-text>\n${targetMarkdown}\n</target-text>`,
      belowMarkdown ? `<context-below>\n${belowMarkdown}\n</context-below>` : '',
    ]
      .filter(Boolean)
      .join('\n\n');
  } catch {
    // Best effort context extraction.
  }

  return '';
};

export const AIMenuItems = ({
  input,
  setInput,
  setValue,
}: {
  input: string;
  setInput: (value: string) => void;
  setValue: (value: string) => void;
}) => {
  const editor = useEditorRef();
  const { messages } = usePluginOption(AIChatPlugin, 'chat');
  const aiEditor = usePluginOption(AIChatPlugin, 'aiEditor')!;
  const isSelecting = useIsSelecting();

  const menuState = React.useMemo<EditorChatState | null>(() => {
    if (!isSelecting) {
      return null;
    }

    if (messages && messages.length > 0) {
      return 'selectionSuggestion';
    }

    return 'selectionCommand';
  }, [isSelecting, messages]);

  const menuGroups = React.useMemo(() => {
    if (!menuState) {
      return [];
    }
    const items = menuStateItems[menuState];

    return items;
  }, [menuState]);
  const [hoveredValue, setHoveredValue] = React.useState<string | null>(null);
  const lastTriggerRef = React.useRef<{ at: number; value: string } | null>(
    null
  );

  const triggerMenuItem = React.useCallback(
    (menuItem: (typeof aiChatItems)[keyof typeof aiChatItems]) => {
      const now = Date.now();
      const last = lastTriggerRef.current;
      if (last && last.value === menuItem.value && now - last.at < 250) {
        return;
      }
      lastTriggerRef.current = { at: now, value: menuItem.value };
      const normalizedInput = input.trim();
      const contextInput =
        normalizedInput.length > 0
          ? normalizedInput
          : getSelectionContextInput(editor, isSelecting);

      menuItem.onSelect?.({
        aiEditor,
        editor,
        input: contextInput,
      });
      setInput('');
    },
    [aiEditor, editor, input, isSelecting, setInput]
  );

  React.useEffect(() => {
    if (menuGroups.length > 0 && menuGroups[0].items.length > 0) {
      setValue(menuGroups[0].items[0].value);
    }
  }, [menuGroups, setValue]);

  return (
    <>
      {menuGroups.map((group, index) => (
        <CommandGroup key={index} heading={group.heading}>
          {group.items.map((menuItem) => (
            <CommandItem
              key={menuItem.value}
              className={cn(
                'cursor-pointer [&_svg]:text-muted-foreground',
                hoveredValue === menuItem.value && 'text-foreground'
              )}
              value={menuItem.value}
              onMouseEnter={() => {
                setHoveredValue(menuItem.value);
              }}
              onMouseLeave={() => {
                setHoveredValue((current) =>
                  current === menuItem.value ? null : current
                );
              }}
              onMouseDown={(event) => {
                event.preventDefault();
                event.stopPropagation();
                triggerMenuItem(menuItem);
              }}
              onSelect={() => {
                triggerMenuItem(menuItem);
              }}
            >
              {menuItem.icon}
              <span>{menuItem.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      ))}
    </>
  );
};

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

    // remove when you implement the route /api/ai/command
    (chat as any)._abortFakeStream();
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
