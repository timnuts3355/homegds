"use client";

interface HeaderProps {
  title: string;
  right?: React.ReactNode;
}

export default function Header({ title, right }: HeaderProps) {
  return (
    <header className="app-header">
      <div className="flex items-center justify-between w-full max-w-2xl mx-auto">
        <h1 className="text-[17px] font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>
          {title}
        </h1>
        <div className="flex items-center">{right}</div>
      </div>
    </header>
  );
}
