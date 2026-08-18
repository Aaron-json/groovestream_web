import { createButton } from "@gluestack-ui/core/button/creator";
import { UIIcon } from "@gluestack-ui/core/icon/creator";
import {
  tva,
  useStyleContext,
  withStyleContext,
  type VariantProps,
} from "@gluestack-ui/utils/nativewind-utils";
import { forwardRef } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { withUniwind } from "uniwind";

const SCOPE = "BUTTON";
const UIButton = createButton({
  Root: withStyleContext(Pressable, SCOPE),
  Text,
  Group: View,
  Spinner: withUniwind(ActivityIndicator),
  Icon: withUniwind(UIIcon),
});

const rootStyle = tva({
  base: "flex-row items-center justify-center gap-2 data-[disabled=true]:opacity-45 data-[active=true]:scale-[0.98] transition-transform",
  variants: {
    variant: {
      default: "bg-primary data-[active=true]:opacity-90 shadow-sm shadow-primary/25",
      secondary: "bg-secondary data-[active=true]:bg-secondary/80",
      outline: "border border-border/80 bg-card/60 data-[active=true]:bg-accent/80",
      ghost: "bg-transparent data-[active=true]:bg-accent",
      destructive: "bg-destructive data-[active=true]:opacity-90 shadow-sm shadow-destructive/25",
      destructiveOutline: "border border-destructive/30 bg-destructive/10 data-[active=true]:bg-destructive/20",
      subtle: "bg-primary/15 data-[active=true]:bg-primary/25",
    },
    size: {
      xs: "min-h-8 px-2.5 rounded-lg",
      sm: "min-h-9 px-3.5 rounded-lg",
      default: "min-h-11 px-4 rounded-xl",
      lg: "min-h-13 px-6 rounded-2xl",
      icon: "h-11 w-11 rounded-xl",
      iconSm: "h-9 w-9 rounded-lg",
      iconLg: "h-14 w-14 rounded-full",
      pill: "min-h-11 px-5 rounded-full",
    },
  },
});

const textStyle = tva({
  base: "font-semibold tracking-tight",
  parentVariants: {
    variant: {
      default: "text-primary-foreground",
      secondary: "text-secondary-foreground",
      outline: "text-foreground",
      ghost: "text-foreground",
      destructive: "text-destructive-foreground",
      destructiveOutline: "text-destructive",
      subtle: "text-primary",
    },
    size: {
      xs: "text-xs",
      sm: "text-xs",
      default: "text-sm",
      lg: "text-base font-bold",
      icon: "text-sm",
      iconSm: "text-xs",
      iconLg: "text-base",
      pill: "text-sm font-bold",
    },
  },
});

const spinnerStyle = tva({
  parentVariants: {
    size: {
      xs: "h-3 w-3",
      sm: "h-3.5 w-3.5",
      default: "h-4 w-4",
      lg: "h-5 w-5",
      icon: "h-4 w-4",
      iconSm: "h-3.5 w-3.5",
      iconLg: "h-5 w-5",
      pill: "h-4 w-4",
    },
  },
});

const spinnerColorStyle = tva({
  parentVariants: {
    variant: {
      default: "accent-primary-foreground",
      secondary: "accent-secondary-foreground",
      outline: "accent-foreground",
      ghost: "accent-foreground",
      destructive: "accent-destructive-foreground",
      destructiveOutline: "accent-destructive",
      subtle: "accent-primary",
    },
  },
});

type ButtonProps = Omit<React.ComponentPropsWithoutRef<typeof UIButton>, "context"> &
  VariantProps<typeof rootStyle>;

export const Button = forwardRef<React.ElementRef<typeof UIButton>, ButtonProps>(
  function Button(
    { className, variant = "default", size = "default", ...props },
    ref,
  ) {
    return (
      <UIButton
        ref={ref}
        {...props}
        className={rootStyle({ variant, size, class: className })}
        context={{ variant, size }}
      />
    );
  },
);

export const ButtonText = forwardRef<
  React.ElementRef<typeof UIButton.Text>,
  React.ComponentPropsWithoutRef<typeof UIButton.Text>
>(function ButtonText({ className, ...props }, ref) {
  const { size, variant } = useStyleContext(SCOPE);
  return (
    <UIButton.Text
      ref={ref}
      {...props}
      className={textStyle({
        parentVariants: { size, variant },
        class: className,
      })}
    />
  );
});

export const ButtonSpinner = forwardRef<
  React.ElementRef<typeof UIButton.Spinner>,
  React.ComponentPropsWithoutRef<typeof UIButton.Spinner>
>(function ButtonSpinner({ className, ...props }, ref) {
  const { size, variant } = useStyleContext(SCOPE);
  return (
    <UIButton.Spinner
      ref={ref}
      {...props}
      className={spinnerStyle({ parentVariants: { size }, class: className })}
      colorClassName={spinnerColorStyle({ parentVariants: { variant } })}
    />
  );
});
