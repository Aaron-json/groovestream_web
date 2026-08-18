import { useCallback, useMemo } from "react";
import { Pressable, View } from "react-native";
import { AppIcon } from "@/components/app-icon";
import {
  Toast,
  ToastDescription,
  ToastTitle,
  useToast,
} from "@/components/ui/toast";

type ToastAction = "success" | "error" | "info";

export function useAppToast() {
  const toast = useToast();

  const show = useCallback(
    (action: ToastAction, title: string, description?: string) => {
      const toastId = `${action}:${title}`;
      if (toast.isActive(toastId)) return;

      toast.show({
        id: toastId,
        placement: "top",
        duration: 3500,
        render: ({ id }) => (
          <Toast nativeID={`toast-${id}`} action={action}>
            <View
              className={`h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                action === "error"
                  ? "bg-destructive/15"
                  : action === "success"
                    ? "bg-primary/15"
                    : "bg-secondary"
              }`}
            >
              <AppIcon
                name={
                  action === "error"
                    ? "alert-circle"
                    : action === "success"
                      ? "checkmark-circle"
                      : "information-circle"
                }
                size={20}
                colorClassName={
                  action === "error"
                    ? "accent-destructive"
                    : action === "success"
                      ? "accent-primary"
                      : "accent-foreground"
                }
              />
            </View>
            <View className="min-w-0 flex-1 gap-0.5">
              <ToastTitle>{title}</ToastTitle>
              {description ? (
                <ToastDescription>{description}</ToastDescription>
              ) : null}
            </View>
            <Pressable
              onPress={() => toast.close(id)}
              accessibilityRole="button"
              accessibilityLabel="Dismiss notification"
              hitSlop={12}
              className="h-8 w-8 shrink-0 items-center justify-center rounded-full active:bg-accent"
            >
              <AppIcon
                name="close"
                size={16}
                colorClassName="accent-muted-foreground"
              />
            </Pressable>
          </Toast>
        ),
      });
    },
    [toast],
  );

  return useMemo(
    () => ({
      success: (title: string, description?: string) =>
        show("success", title, description),
      error: (title: string, description?: string) =>
        show("error", title, description),
      info: (title: string, description?: string) =>
        show("info", title, description),
    }),
    [show],
  );
}
