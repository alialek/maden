import * as React from 'react';

import { cn } from '@/lib/utils';

export const PORTAL_PLACEMENT_HIDDEN_CLASS =
  '!pointer-events-none !opacity-0 !animate-none !transition-none';

const readCssPixelValue = (element: HTMLElement, propertyName: string) => {
  const rawValue = element.style.getPropertyValue(propertyName).trim();
  if (!rawValue) return 0;

  const parsedValue = Number.parseFloat(rawValue);
  return Number.isFinite(parsedValue) ? parsedValue : 0;
};

const parseTranslate = (transform: string) => {
  const translateMatch = transform.match(
    /translate(?:3d)?\(\s*(-?\d+(?:\.\d+)?)px\s*,\s*(-?\d+(?:\.\d+)?)px/
  );

  if (!translateMatch) return null;

  const x = Number.parseFloat(translateMatch[1] ?? '0');
  const y = Number.parseFloat(translateMatch[2] ?? '0');

  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;

  return { x, y };
};

export const usePortalPlacementReady = <TElement extends HTMLElement = HTMLDivElement>() => {
  const [ready, setReady] = React.useState(false);
  const contentRef = React.useRef<TElement | null>(null);

  React.useLayoutEffect(() => {
    const content = contentRef.current;
    if (!content) {
      setReady(true);
      return;
    }

    const wrapper = content.closest(
      '[data-radix-popper-content-wrapper]'
    ) as HTMLElement | null;
    let frame = 0;
    let attempts = 0;

    const isPositioned = () => {
      if (!wrapper) return attempts > 0;
      const transform = wrapper.style.transform;
      if (!transform || transform.includes('translate(0, -200%)')) return false;

      const anchorWidth = readCssPixelValue(wrapper, '--radix-popper-anchor-width');
      const anchorHeight = readCssPixelValue(wrapper, '--radix-popper-anchor-height');

      if (anchorWidth > 0 || anchorHeight > 0) return true;

      const pointAnchor = parseTranslate(transform);
      if (!pointAnchor) return false;

      return Math.abs(pointAnchor.x) > 8 || Math.abs(pointAnchor.y) > 8;
    };

    const checkPlacement = () => {
      attempts += 1;
      if (isPositioned() || attempts > 60) {
        setReady(true);
        return;
      }

      frame = window.requestAnimationFrame(checkPlacement);
    };

    checkPlacement();

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, []);

  return {
    placementReady: ready,
    placementRef: contentRef,
  };
};

type PortalPlacementGuardOptions = {
  className?: string;
};

export const usePortalPlacementGuard = <
  TElement extends HTMLElement = HTMLDivElement,
>({ className }: PortalPlacementGuardOptions = {}) => {
  const { placementReady, placementRef } = usePortalPlacementReady<TElement>();

  return {
    className: cn(
      !placementReady && PORTAL_PLACEMENT_HIDDEN_CLASS,
      className
    ),
    'data-maden-placement-ready': placementReady ? 'true' : undefined,
    ref: placementRef,
  } as const;
};

export const withPortalPlacementGuard = <
  TElement extends HTMLElement,
  TProps extends { className?: string },
>(
  Content: React.ComponentType<TProps & React.RefAttributes<TElement>>
) => {
  const GuardedContent = React.forwardRef<TElement, TProps>(
    ({ className, ...props }, forwardedRef) => {
      const placement = usePortalPlacementGuard<TElement>({ className });

      return React.createElement(Content, {
        ...(props as unknown as TProps),
        className: placement.className,
        'data-maden-placement-ready': placement['data-maden-placement-ready'],
        ref: (node: TElement | null) => {
          placement.ref.current = node;

          if (typeof forwardedRef === 'function') {
            forwardedRef(node);
            return;
          }

          if (forwardedRef) {
            forwardedRef.current = node;
          }
        },
      } as TProps & React.RefAttributes<TElement>);
    }
  );

  GuardedContent.displayName = `withPortalPlacementGuard(${
    (Content as { displayName?: string }).displayName ??
    (Content as { name?: string }).name ??
    'Content'
  })`;

  return GuardedContent;
};
