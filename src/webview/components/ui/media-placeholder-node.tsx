'use client';

import * as React from 'react';

import type { TPlaceholderElement } from 'platejs';
import type { PlateElementProps } from 'platejs/react';

import { PlaceholderPlugin, PlaceholderProvider } from '@platejs/media/react';
import { AudioLines, FileUp, Film, ImageIcon } from 'lucide-react';
import { isUrl, KEYS } from 'platejs';
import { PlateElement, withHOC } from 'platejs/react';
import { toast } from 'sonner';
import { useFilePicker } from 'use-file-picker';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { resolveMediaInsertUrl } from '@/lib/file-path';
import { cn } from '@/lib/utils';

const CONTENT: Record<
  string,
  {
    accept: string[];
    content: React.ReactNode;
    icon: React.ReactNode;
  }
> = {
  [KEYS.audio]: {
    accept: ['audio/*'],
    content: 'Add an audio file',
    icon: <AudioLines />,
  },
  [KEYS.file]: {
    accept: ['*'],
    content: 'Add a file',
    icon: <FileUp />,
  },
  [KEYS.img]: {
    accept: ['image/*'],
    content: 'Add an image',
    icon: <ImageIcon />,
  },
  [KEYS.video]: {
    accept: ['video/*'],
    content: 'Add a video',
    icon: <Film />,
  },
};

const getMediaUrlFromFile = (file: File) => {
  const url = resolveMediaInsertUrl({ file });
  if (url.startsWith('blob:')) {
    toast.warning('Using temporary blob URL: local filesystem path is unavailable in this environment.');
  }
  return url;
};

export const PlaceholderElement = withHOC(
  PlaceholderProvider,
  function PlaceholderElement(props: PlateElementProps<TPlaceholderElement>) {
    const { editor, element } = props;

    const currentContent = CONTENT[element.mediaType];
    const [menuOpen, setMenuOpen] = React.useState(false);
    const [urlDialogOpen, setUrlDialogOpen] = React.useState(false);
    const [url, setUrl] = React.useState('');

    const insertMediaNode = React.useCallback(
      (mediaUrl: string, displayName: string) => {
        const path = editor.api.findPath(element);

        if (!path) {
          toast.error('Unable to insert media at the current location.');
          return;
        }

        editor.tf.withoutSaving(() => {
          editor.tf.removeNodes({ at: path });
          editor.tf.insertNodes(
            {
              children: [{ text: '' }],
              name: element.mediaType === KEYS.file ? displayName : '',
              type: element.mediaType!,
              url: mediaUrl,
            },
            { at: path }
          );
        });
      },
      [editor, element]
    );

    const replaceCurrentPlaceholder = React.useCallback(
      (file: File) => {
        insertMediaNode(getMediaUrlFromFile(file), file.name);
      },
      [insertMediaNode]
    );

    const replaceCurrentPlaceholderWithUrl = React.useCallback(() => {
      if (!isUrl(url)) {
        toast.error('Invalid URL');
        return;
      }

      insertMediaNode(url, url.split('/').pop() ?? 'file');
      setUrlDialogOpen(false);
      setUrl('');
    }, [insertMediaNode, url]);

    const { openFilePicker } = useFilePicker({
      accept: currentContent.accept,
      multiple: true,
      onFilesSelected: ({ plainFiles: updatedFiles }) => {
        const [firstFile, ...restFiles] = updatedFiles;
        if (!firstFile) return;

        replaceCurrentPlaceholder(firstFile);

        if (restFiles.length > 0) {
          editor.getTransforms(PlaceholderPlugin).insert.media(restFiles);
        }
      },
    });

    return (
      <PlateElement className="my-1" {...props}>
        <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen} modal={false}>
          <DropdownMenuTrigger asChild>
            <div
              className={cn(
                'flex cursor-pointer select-none items-center rounded-sm bg-muted p-3 pr-9 hover:bg-primary/10'
              )}
              contentEditable={false}
            >
              <div className="relative mr-3 flex text-muted-foreground/80 [&_svg]:size-6">
                {currentContent.icon}
              </div>
              <div className="whitespace-nowrap text-muted-foreground text-sm">
                {currentContent.content}
              </div>
            </div>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="start">
            <DropdownMenuItem
              onSelect={(event) => {
                event.preventDefault();
                setMenuOpen(false);
                openFilePicker();
              }}
            >
              Upload from computer
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={(event) => {
                event.preventDefault();
                setMenuOpen(false);
                setUrlDialogOpen(true);
              }}
            >
              Insert via URL
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {props.children}

        <AlertDialog open={urlDialogOpen} onOpenChange={setUrlDialogOpen}>
          <AlertDialogContent className="gap-6">
            <AlertDialogHeader>
              <AlertDialogTitle>Insert media via URL</AlertDialogTitle>
            </AlertDialogHeader>

            <div className="group relative w-full">
              <label
                className="-translate-y-1/2 absolute top-1/2 block cursor-text px-1 text-muted-foreground/70 text-sm transition-all group-focus-within:pointer-events-none group-focus-within:top-0 group-focus-within:cursor-default group-focus-within:font-medium group-focus-within:text-foreground group-focus-within:text-xs has-[+input:not(:placeholder-shown)]:pointer-events-none has-[+input:not(:placeholder-shown)]:top-0 has-[+input:not(:placeholder-shown)]:cursor-default has-[+input:not(:placeholder-shown)]:font-medium has-[+input:not(:placeholder-shown)]:text-foreground has-[+input:not(:placeholder-shown)]:text-xs"
                htmlFor={`placeholder-url-${element.id}`}
              >
                <span className="inline-flex bg-background px-2">URL</span>
              </label>
              <Input
                id={`placeholder-url-${element.id}`}
                className="w-full"
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    replaceCurrentPlaceholderWithUrl();
                  }
                }}
                placeholder=""
                type="url"
                autoFocus
              />
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={(event) => {
                  event.preventDefault();
                  replaceCurrentPlaceholderWithUrl();
                }}
              >
                Accept
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </PlateElement>
    );
  }
);
