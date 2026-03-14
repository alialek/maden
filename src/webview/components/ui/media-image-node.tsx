'use client';

import * as React from 'react';

import type { TImageElement } from 'platejs';
import type { PlateElementProps } from 'platejs/react';

import { useDraggable } from '@platejs/dnd';
import { Image, ImagePlugin, useMediaState } from '@platejs/media/react';
import { ResizableProvider } from '@platejs/resizable';
import { PlateElement, withHOC } from 'platejs/react';

import { cn } from '@/lib/utils';

import { MediaToolbar } from './media-toolbar';
import {
  mediaResizeHandleVariants,
  Resizable,
  ResizeHandle,
} from './resize-handle';

export const ImageElement = withHOC(
  ResizableProvider,
  function ImageElement(props: PlateElementProps<TImageElement>) {
    const { align = 'center', focused, readOnly, selected } = useMediaState();
    const imageUrl = String((props.element as { url?: string }).url ?? '');
    const imageAlt = String(
      ((props.attributes as { alt?: string } | undefined)?.alt ?? '') ||
      ((props.element as { alt?: string }).alt ?? '')
    );
    const isBadgeImage = /^https?:\/\/img\.shields\.io\//i.test(imageUrl);
    const [isLoaded, setIsLoaded] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState(Boolean(imageUrl));
    const [hasError, setHasError] = React.useState(false);

    const { isDragging, handleRef } = useDraggable({
      element: props.element,
    });

    React.useEffect(() => {
      if (!imageUrl) {
        setIsLoaded(false);
        setIsLoading(false);
        setHasError(true);
        return;
      }

      setIsLoaded(false);
      setIsLoading(true);
      setHasError(false);

      const preloader = new window.Image();
      preloader.src = imageUrl;
      preloader.onload = () => {
        setIsLoaded(true);
        setIsLoading(false);
        setHasError(false);
      };
      preloader.onerror = () => {
        setIsLoaded(false);
        setIsLoading(false);
        setHasError(true);
      };

      return () => {
        preloader.onload = null;
        preloader.onerror = null;
      };
    }, [imageUrl]);

    if (isBadgeImage) {
      return (
        <PlateElement
          {...props}
          as="span"
          className="!my-0 !mr-1 !inline-block !py-0 align-middle"
          data-maden-badge-image="true"
        >
          <span className="inline-flex align-middle" contentEditable={false}>
            <Image
              ref={handleRef}
              className={cn(
                'inline-block h-auto w-auto max-w-none align-middle',
                focused && selected && 'ring-1 ring-border/80',
                isDragging && 'opacity-50'
              )}
              alt={imageAlt || undefined}
              title={imageAlt || undefined}
            />
          </span>
          {props.children}
        </PlateElement>
      );
    }

    return (
      <MediaToolbar plugin={ImagePlugin}>
        <PlateElement {...props} className="block py-2.5">
          <figure className="group relative m-0" contentEditable={false}>
            <Resizable
              align={align}
              options={{
                align,
                readOnly,
              }}
            >
              <ResizeHandle
                className={mediaResizeHandleVariants({ direction: 'left' })}
                options={{ direction: 'left' }}
              />
              <div
                className={cn(
                  'relative rounded-sm',
                  (isLoading || hasError) && 'min-h-[140px] bg-muted/40'
                )}
              >
                {isLoading && !hasError && (
                  <div
                    className="absolute inset-0 z-10 animate-pulse rounded-sm bg-muted/60"
                    aria-hidden
                  />
                )}
                <Image
                  ref={handleRef}
                  className={cn(
                    'block h-auto w-auto max-w-[min(100%,900px)] cursor-pointer object-contain px-0',
                    'rounded-sm outline-none focus-visible:outline-none',
                    focused && selected && 'ring-1 ring-border/80',
                    isLoading && !hasError && 'opacity-0',
                    isDragging && 'opacity-50'
                  )}
                  alt={imageAlt || undefined}
                  title={imageAlt || undefined}
                  onError={() => {
                    setHasError(true);
                    setIsLoaded(false);
                    setIsLoading(false);
                  }}
                  onLoad={() => {
                    setHasError(false);
                    setIsLoaded(true);
                    setIsLoading(false);
                  }}
                />
              </div>
              <ResizeHandle
                className={mediaResizeHandleVariants({
                  direction: 'right',
                })}
                options={{ direction: 'right' }}
              />
            </Resizable>
          </figure>

          {props.children}
        </PlateElement>
      </MediaToolbar>
    );
  }
);
