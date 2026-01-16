interface PageHeaderProps {
  title: string;
  subtitle?: string;
}

export function PageHeader({title, subtitle}: PageHeaderProps) {
  return (
    <header className="bg-sand pt-40 px-4 pb-4 md:pt-36 md:px-8 md:pb-4">
      <h1 className="text-h1 font-display">{title}</h1>
      {subtitle && (
        <p className="mt-4 text-paragraph font-display opacity-80">
          {subtitle}
        </p>
      )}
    </header>
  );
}
