'use client';

import { useIsTouchDevice } from '@/hooks/use-is-touch-device';

export const useIsMobile = () => useIsTouchDevice();
