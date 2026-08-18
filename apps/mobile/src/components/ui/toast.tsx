import { createToastHook } from "@gluestack-ui/core/toast/creator";
import {
  tva,
  withStyleContext,
} from "@gluestack-ui/utils/nativewind-utils";
import { forwardRef } from "react";
import { Text, View } from "react-native";

export const useToast = createToastHook(View);

const SCOPE = "TOAST";
const Root = withStyleContext(View, SCOPE);
const rootStyle = tva({
  base: "w-[94%] max-w-[420px] self-center flex-row items-center gap-3.5 rounded-2xl border bg-popover p-4 shadow-xl",
  variants: {
    action: {
      success: "border-primary/30",
      error: "border-destructive/35",
      info: "border-border/80",
    },
  },
});
const titleStyle = tva({
  base: "text-sm font-semibold text-popover-foreground tracking-tight",
});
const descriptionStyle = tva({ base: "text-xs leading-4 text-muted-foreground" });

type ToastAction = "success" | "error" | "info";

export const Toast = forwardRef<
  React.ComponentRef<typeof Root>,
  React.ComponentProps<typeof Root> & { action?: ToastAction }
>(function Toast({ className, action = "info", ...props }, ref) {
  return (
    <Root
      ref={ref}
      accessibilityRole="alert"
      {...props}
      className={rootStyle({ action, class: className })}
      context={{ action }}
    />
  );
});

export const ToastTitle = forwardRef<
  React.ComponentRef<typeof Text>,
  React.ComponentProps<typeof Text>
>(function ToastTitle({ className, ...props }, ref) {
  return (
    <Text
      ref={ref}
      {...props}
      className={titleStyle({ class: className })}
    />
  );
});

export const ToastDescription = forwardRef<
  React.ComponentRef<typeof Text>,
  React.ComponentProps<typeof Text>
>(function ToastDescription({ className, ...props }, ref) {
  return (
    <Text
      ref={ref}
      {...props}
      className={descriptionStyle({ class: className })}
    />
  );
});
