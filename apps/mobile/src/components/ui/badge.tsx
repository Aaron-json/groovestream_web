import { forwardRef } from "react";
import { Text, View, type ViewProps } from "react-native";

export type BadgeVariant =
  | "default"
  | "secondary"
  | "outline"
  | "destructive"
  | "success"
  | "primary";

export type BadgeProps = ViewProps & {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
  textClassName?: string;
};

const variantStyles: Record<BadgeVariant, { container: string; text: string }> = {
  default: {
    container: "bg-primary/15 border-primary/25",
    text: "text-primary",
  },
  primary: {
    container: "bg-primary border-primary",
    text: "text-primary-foreground",
  },
  secondary: {
    container: "bg-secondary border-border/80",
    text: "text-secondary-foreground",
  },
  outline: {
    container: "bg-transparent border-border/80",
    text: "text-foreground",
  },
  destructive: {
    container: "bg-destructive/15 border-destructive/30",
    text: "text-destructive",
  },
  success: {
    container: "bg-emerald-500/15 border-emerald-500/30",
    text: "text-emerald-400",
  },
};

export const Badge = forwardRef<View, BadgeProps>(function Badge(
  { variant = "default", children, className = "", textClassName = "", ...props },
  ref,
) {
  const styles = variantStyles[variant];

  return (
    <View
      ref={ref}
      className={`self-start flex-row items-center gap-1 rounded-full border px-2.5 py-0.5 ${styles.container} ${className}`}
      {...props}
    >
      <Text className={`text-xs font-semibold tracking-tight ${styles.text} ${textClassName}`}>
        {children}
      </Text>
    </View>
  );
});
