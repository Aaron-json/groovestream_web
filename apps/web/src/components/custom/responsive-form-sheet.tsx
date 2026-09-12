import type { ComponentProps } from "react";

import { SheetContent } from "@/components/ui/sheet";
import { useResponsiveSheetSide } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

type ResponsiveFormSheetProps = Omit<
  ComponentProps<typeof SheetContent>,
  "side"
>;

export function ResponsiveFormSheet({
  children,
  className,
  ...props
}: ResponsiveFormSheetProps) {
  const side = useResponsiveSheetSide();

  return (
    <SheetContent
      side={side}
      className={cn(
        "w-full p-5 data-[side=bottom]:max-h-[90dvh] data-[side=bottom]:overflow-hidden data-[side=bottom]:rounded-t-2xl data-[side=right]:sm:max-w-md sm:p-6",
        className,
      )}
      {...props}
    >
      {children}
    </SheetContent>
  );
}
