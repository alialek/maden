import * as React from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export type MadenThemeMode = 'inherit' | 'light' | 'dark' | 'confluence';

const THEME_OPTIONS: Array<{ label: string; value: MadenThemeMode }> = [
  { label: 'Inherit VS Code', value: 'inherit' },
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
  { label: 'Confluence', value: 'confluence' },
];

export function MadenSettingsDialog({
  onOpenChange,
  onSave,
  open,
  themeMode,
}: {
  onOpenChange: (open: boolean) => void;
  onSave: (themeMode: MadenThemeMode) => void;
  open: boolean;
  themeMode: MadenThemeMode;
}) {
  const [draftThemeMode, setDraftThemeMode] =
    React.useState<MadenThemeMode>(themeMode);

  React.useEffect(() => {
    if (!open) {
      return;
    }

    setDraftThemeMode(themeMode);
  }, [open, themeMode]);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    onSave(draftThemeMode);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Maden Settings</DialogTitle>
          <DialogDescription>
            Configure editor UI preferences for this webview.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={submit}>
          <label className="flex flex-col gap-1 text-sm">
            Theme
            <Select
              value={draftThemeMode}
              onValueChange={(value) =>
                setDraftThemeMode(value as MadenThemeMode)
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select theme" />
              </SelectTrigger>
              <SelectContent position="popper" className="z-[110]">
                {THEME_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>

          <Button className="w-full" type="submit">
            Save settings
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
