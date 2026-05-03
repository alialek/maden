import * as React from 'react';

import type { TDateElement } from 'platejs';
import type { SlateElementProps } from 'platejs/static';

import { SlateElement } from 'platejs/static';

import { formatDateElementLabel } from './date-label';

export function DateElementStatic(props: SlateElementProps<TDateElement>) {
  const { element } = props;

  return (
    <SlateElement as="span" className="inline-block" {...props}>
      <span className="w-fit rounded-sm bg-muted px-1 text-muted-foreground">
        {formatDateElementLabel(element.date) ?? <span>Pick a date</span>}
      </span>
      {props.children}
    </SlateElement>
  );
}
