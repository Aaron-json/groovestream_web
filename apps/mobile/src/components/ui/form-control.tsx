import { createFormControl } from "@gluestack-ui/core/form-control/creator";
import { UIIcon } from "@gluestack-ui/core/icon/creator";
import {
  tva,
  withStyleContext,
} from "@gluestack-ui/utils/nativewind-utils";
import { forwardRef } from "react";
import { Text, View } from "react-native";
import { withUniwind } from "uniwind";

const UIFormControl = createFormControl({
  Root: withStyleContext(View, "FORM_CONTROL"),
  Error: View,
  ErrorText: Text,
  ErrorIcon: withUniwind(UIIcon),
  Label: View,
  LabelText: Text,
  LabelAstrick: Text,
  Helper: View,
  HelperText: Text,
});

const rootStyle = tva({ base: "flex-col gap-2" });
const labelStyle = tva({
  base: "text-xs font-semibold uppercase tracking-wider text-muted-foreground",
});
const helperStyle = tva({ base: "text-xs leading-4 text-muted-foreground" });
const errorStyle = tva({ base: "text-xs font-medium leading-4 text-destructive" });

export const FormControl = forwardRef<
  React.ComponentRef<typeof UIFormControl>,
  React.ComponentProps<typeof UIFormControl>
>(function FormControl({ className, ...props }, ref) {
  return (
    <UIFormControl
      ref={ref}
      {...props}
      className={rootStyle({ class: className })}
    />
  );
});

export const FormControlLabel = UIFormControl.Label;
export const FormControlHelper = UIFormControl.Helper;
export const FormControlError = UIFormControl.Error;

export const FormControlLabelText = forwardRef<
  React.ComponentRef<typeof UIFormControl.Label.Text>,
  React.ComponentProps<typeof UIFormControl.Label.Text>
>(function FormControlLabelText({ className, ...props }, ref) {
  return (
    <UIFormControl.Label.Text
      ref={ref}
      {...props}
      className={labelStyle({ class: className })}
    />
  );
});

export const FormControlHelperText = forwardRef<
  React.ComponentRef<typeof UIFormControl.Helper.Text>,
  React.ComponentProps<typeof UIFormControl.Helper.Text>
>(function FormControlHelperText({ className, ...props }, ref) {
  return (
    <UIFormControl.Helper.Text
      ref={ref}
      {...props}
      className={helperStyle({ class: className })}
    />
  );
});

export const FormControlErrorText = forwardRef<
  React.ComponentRef<typeof UIFormControl.Error.Text>,
  React.ComponentProps<typeof UIFormControl.Error.Text>
>(function FormControlErrorText({ className, ...props }, ref) {
  return (
    <UIFormControl.Error.Text
      ref={ref}
      {...props}
      className={errorStyle({ class: className })}
    />
  );
});
