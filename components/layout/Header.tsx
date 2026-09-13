"use client";

interface HeaderProps {
  title: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
}

export default function Header({ title, left, right }: HeaderProps) {
  return (
    <header className="app-header">
      <div className="flex items-center justify-between w-full max-w-2xl mx-auto gap-2">
        <div className="flex items-center gap-1 min-w-0 flex-1">
          {left}
          <h1 className="min-w-0 flex-1 truncate text-[17px] font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>
            {title}
          </h1>
        </div>
        <div className="flex items-center flex-shrink-0">{right}</div>
      </div>
    </header>
  );
}
