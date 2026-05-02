'use client';

import { BaseExcalidrawPlugin } from '@platejs/excalidraw';
import { toPlatePlugin } from 'platejs/react';

import { ExcalidrawElement } from '@/components/ui/excalidraw-node';

export const ExcalidrawKit = [
  toPlatePlugin(BaseExcalidrawPlugin).withComponent(ExcalidrawElement),
];
