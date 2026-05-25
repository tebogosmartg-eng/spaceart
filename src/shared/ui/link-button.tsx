import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/shared/lib/utils";
import type { VariantProps } from "class-variance-authority";

interface LinkButtonProps
  extends VariantProps<typeof buttonVariants>,
    React.ComponentProps<typeof Link> {
  href: string;
}

export function LinkButton({
  href,
  className,
  variant,
  size,
  children,
  ...props
}: LinkButtonProps) {
  return (
    <Link
      href={href}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    >
      {children}
    </Link>
  );
}
