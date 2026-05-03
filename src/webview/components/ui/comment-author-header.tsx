import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export function CommentAuthorHeader({
  avatarUrl,
  edited = false,
  name,
  timestamp,
}: {
  avatarUrl?: string;
  edited?: boolean;
  name?: string;
  timestamp: string;
}) {
  return (
    <>
      <Avatar className="size-5">
        <AvatarImage alt={name} src={avatarUrl} />
        <AvatarFallback>{name?.[0]}</AvatarFallback>
      </Avatar>
      <h4 className="mx-2 font-semibold text-sm leading-none">{name}</h4>

      <div className="text-muted-foreground/80 text-xs leading-none">
        <span className="mr-1">{timestamp}</span>
        {edited && <span>(edited)</span>}
      </div>
    </>
  );
}
