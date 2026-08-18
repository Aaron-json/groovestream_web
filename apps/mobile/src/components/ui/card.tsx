import { forwardRef } from "react";
import { Text, View, type TextProps, type ViewProps } from "react-native";

export const Card = forwardRef<View, ViewProps>(function Card(
  { className = "", ...props },
  ref,
) {
  return (
    <View
      ref={ref}
      className={`rounded-2xl border border-border/80 bg-card p-4 shadow-sm ${className}`}
      {...props}
    />
  );
});

export const CardHeader = forwardRef<View, ViewProps>(function CardHeader(
  { className = "", ...props },
  ref,
) {
  return <View ref={ref} className={`gap-1 pb-3 ${className}`} {...props} />;
});

export const CardTitle = forwardRef<Text, TextProps>(function CardTitle(
  { className = "", ...props },
  ref,
) {
  return (
    <Text
      ref={ref}
      className={`text-lg font-bold tracking-tight text-card-foreground ${className}`}
      {...props}
    />
  );
});

export const CardDescription = forwardRef<Text, TextProps>(
  function CardDescription({ className = "", ...props }, ref) {
    return (
      <Text
        ref={ref}
        className={`text-sm leading-5 text-muted-foreground ${className}`}
        {...props}
      />
    );
  },
);

export const CardContent = forwardRef<View, ViewProps>(function CardContent(
  { className = "", ...props },
  ref,
) {
  return <View ref={ref} className={`pt-1 ${className}`} {...props} />;
});

export const CardFooter = forwardRef<View, ViewProps>(function CardFooter(
  { className = "", ...props },
  ref,
) {
  return (
    <View
      ref={ref}
      className={`flex-row items-center justify-end gap-2 pt-3 ${className}`}
      {...props}
    />
  );
});
