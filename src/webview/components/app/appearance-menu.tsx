import * as React from 'react';

import { EllipsisVertical, FileIcon, FileTextIcon, FileType2Icon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export type FontMode = 'default' | 'serif' | 'mono';

export type ExportActions = {
  exportDocx: () => void;
  exportHtml: () => void;
  exportPdf: () => void;
};

export function AppearanceMenu({
  exportActions,
  fontMode,
  onFontModeChange,
  onTopbarToggle,
  onWideModeToggle,
  topbarVisible,
  wideModeEnabled,
}: {
  exportActions: ExportActions | null;
  fontMode: FontMode;
  onFontModeChange: (mode: FontMode) => void;
  onTopbarToggle: (next: boolean) => void;
  onWideModeToggle: (next: boolean) => void;
  topbarVisible: boolean;
  wideModeEnabled: boolean;
}) {
  const fontCards: Array<{ key: FontMode; label: string; sampleClass: string }> = [
    { key: 'default', label: 'Default', sampleClass: 'font-sans' },
    { key: 'serif', label: 'Serif', sampleClass: 'font-serif' },
    { key: 'mono', label: 'Mono', sampleClass: 'font-mono' },
  ];

  return (
    <div className="pointer-events-none fixed top-1.5 right-2 z-[95]">
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="pointer-events-auto h-8 w-8 bg-background/95 backdrop-blur-sm"
            aria-label="Editor appearance"
          >
            <EllipsisVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-[340px] p-2">
          <DropdownMenuLabel>Maden</DropdownMenuLabel>
          <DropdownMenuCheckboxItem
            checked={topbarVisible}
            onCheckedChange={(checked) => onTopbarToggle(checked === true)}
          >
            Toggle topbar (maden topbar)
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={wideModeEnabled}
            onCheckedChange={(checked) => onWideModeToggle(checked === true)}
          >
            Wide mode
          </DropdownMenuCheckboxItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Typography</DropdownMenuLabel>
          <div className="grid grid-cols-3 gap-2 p-1">
            {fontCards.map((card) => {
              const active = fontMode === card.key;

              return (
                <button
                  key={card.key}
                  type="button"
                  className={`rounded-md border px-2 py-2 text-left transition-colors ${
                    active
                      ? 'border-primary bg-accent text-accent-foreground'
                      : 'border-border hover:bg-accent/60'
                  }`}
                  onClick={() => onFontModeChange(card.key)}
                >
                  <div className={`${card.sampleClass} text-[34px] leading-none`}>Ag</div>
                  <div className="mt-1 text-sm">{card.label}</div>
                </button>
              );
            })}
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Export</DropdownMenuLabel>
          <DropdownMenuGroup>
            <DropdownMenuItem disabled={!exportActions} onSelect={() => exportActions?.exportPdf()}>
              <FileIcon />
              Export as PDF
            </DropdownMenuItem>
            <DropdownMenuItem disabled={!exportActions} onSelect={() => exportActions?.exportHtml()}>
              <FileTextIcon />
              Export as HTML
            </DropdownMenuItem>
            <DropdownMenuItem disabled={!exportActions} onSelect={() => exportActions?.exportDocx()}>
              <FileType2Icon />
              Export as DOCX
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
