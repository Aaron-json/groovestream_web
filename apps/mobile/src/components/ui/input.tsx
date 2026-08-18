import { createInput } from "@gluestack-ui/core/input/creator";
import { UIIcon } from "@gluestack-ui/core/icon/creator";
import {
  tva,
  withStyleContext,
  type VariantProps,
} from "@gluestack-ui/utils/nativewind-utils";
import { forwardRef } from "react";
import { Pressable, TextInput, View } from "react-native";
import { withUniwind } from "uniwind";

const UIInput = createInput({
  Root: withStyleContext(View, "INPUT"),
  Icon: withUniwind(UIIcon),
  Slot: Pressable,
  Input: TextInput,
});

const rootStyle = tva({
  base: "min-h-12 w-full flex-row items-center overflow-hidden rounded-xl border border-border/80 bg-card px-3.5 data-[focus=true]:border-primary data-[invalid=true]:border-destructive data-[disabled=true]:opacity-50",
  variants: {
    size: {
      sm: "min-h-10 px-3 rounded-lg",
      default: "min-h-12 px-3.5 rounded-xl",
      lg: "min-h-14 px-4 rounded-2xl",
    },
  },
});

const fieldStyle = tva({
  base: "flex-1 py-2.5 text-base text-foreground placeholder:text-muted-foreground",
});

type InputProps = React.ComponentProps<typeof UIInput> &
  VariantProps<typeof rootStyle>;

export const Input = forwardRef<React.ComponentRef<typeof UIInput>, InputProps>(
  function Input({ className, size = "default", ...props }, ref) {
    return (
      <UIInput
        ref={ref}
        {...props}
        className={rootStyle({ size, class: className })}
        context={{ size }}
      />
    );
  },
);

export const InputField = forwardRef<
  React.ComponentRef<typeof UIInput.Input>,
  React.ComponentProps<typeof UIInput.Input>
>(function InputField({ className, ...props }, ref) {
  return (
    <UIInput.Input
      ref={ref}
      {...props}
      className={fieldStyle({ class: className })}
    />
  );
});

export const InputSlot = UIInput.Slot;
export const InputIcon = UIInput.Icon;
