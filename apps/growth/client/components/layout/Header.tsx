import {useAuth} from '../../hooks/useAuth';

export function Header() {
  const {user, logout} = useAuth();

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
      <div />
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground">{user?.email}</span>
        <button
          onClick={() => logout.mutate()}
          className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
