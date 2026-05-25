import { cn } from "@/shared/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  eyebrow?: string;
  className?: string;
  children?: React.ReactNode;
}

export function PageHeader({
  title,
  description,
  eyebrow,
  className,
  children,
}: PageHeaderProps) {
  return (
    <div className={cn("mb-12 md:mb-16", className)}>
      {eyebrow && (
        <p className="text-eyebrow mb-4 text-accent">{eyebrow}</p>
      )}
      <h1 className="text-cinematic text-4xl md:text-5xl lg:text-6xl">
        {title}
      </h1>
      {description && (
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
          {description}
        </p>
      )}
      {children && <div className="mt-8">{children}</div>}
    </div>
  );
}
