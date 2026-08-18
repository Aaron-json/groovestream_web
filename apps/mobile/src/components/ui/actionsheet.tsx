import { createActionsheet } from "@gluestack-ui/core/actionsheet/creator";
import { UIIcon } from "@gluestack-ui/core/icon/creator";
import { tva } from "@gluestack-ui/utils/nativewind-utils";
import { forwardRef } from "react";
import Animated, { FadeIn, SlideInDown } from "react-native-reanimated";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  SectionList,
  Text,
  View,
  VirtualizedList,
  type PressableProps,
  type ViewProps,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { withUniwind } from "uniwind";

type MotionProps = {
  initial?: unknown;
  animate?: unknown;
  exit?: unknown;
  transition?: unknown;
};

// Gluestack's core accepts an animated host component. Reanimated keeps the
// sheet native without pulling in the stock template's Legend Motion runtime.
const AnimatedView = withUniwind(Animated.View);
const AnimatedPressable = withUniwind(
  Animated.createAnimatedComponent(Pressable),
);
const SheetContent = forwardRef<View, ViewProps & MotionProps>(
  function SheetContent(
    { initial, animate, exit, transition, ...props },
    ref,
  ) {
    void initial;
    void animate;
    void exit;
    void transition;
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="w-full"
      >
        <AnimatedView ref={ref} entering={SlideInDown.duration(200)} {...props} />
      </KeyboardAvoidingView>
    );
  },
);

const SheetBackdrop = forwardRef<
  React.ComponentRef<typeof Pressable>,
  PressableProps & MotionProps
>(function SheetBackdrop(
  { initial, animate, exit, transition, ...props },
  ref,
) {
  void initial;
  void animate;
  void exit;
  void transition;
  return <AnimatedPressable ref={ref} entering={FadeIn.duration(160)} {...props} />;
});

const UIActionsheet = createActionsheet({
  Root: View,
  Content: SheetContent,
  Item: Pressable,
  ItemText: Text,
  DragIndicator: View,
  IndicatorWrapper: View,
  Backdrop: SheetBackdrop,
  ScrollView,
  VirtualizedList,
  FlatList,
  SectionList,
  SectionHeaderText: Text,
  Icon: withUniwind(UIIcon),
});

const rootStyle = tva({ base: "h-full w-full justify-end" });
const contentStyle = tva({
  base: "mt-auto max-h-[88%] w-full rounded-t-[28px] border-t border-border/80 bg-card px-5 pt-2 shadow-2xl",
});
const backdropStyle = tva({ base: "absolute inset-0 bg-black/65" });
const itemStyle = tva({
  base: "min-h-[52px] w-full flex-row items-center gap-3.5 rounded-xl px-3.5 data-[active=true]:bg-accent data-[disabled=true]:opacity-45",
});
const itemTextStyle = tva({ base: "text-base font-medium text-foreground tracking-tight" });

export const Actionsheet = forwardRef<
  React.ComponentRef<typeof UIActionsheet>,
  React.ComponentProps<typeof UIActionsheet>
>(function Actionsheet({ className, ...props }, ref) {
  return (
    <UIActionsheet
      ref={ref}
      {...props}
      className={rootStyle({ class: className })}
    />
  );
});

export const ActionsheetBackdrop = forwardRef<
  React.ComponentRef<typeof UIActionsheet.Backdrop>,
  React.ComponentProps<typeof UIActionsheet.Backdrop>
>(function ActionsheetBackdrop({ className, ...props }, ref) {
  return (
    <UIActionsheet.Backdrop
      ref={ref}
      {...props}
      className={backdropStyle({ class: className })}
    />
  );
});

export const ActionsheetContent = forwardRef<
  React.ComponentRef<typeof UIActionsheet.Content>,
  React.ComponentProps<typeof UIActionsheet.Content>
>(function ActionsheetContent({ className, style, ...props }, ref) {
  const insets = useSafeAreaInsets();
  return (
    <UIActionsheet.Content
      ref={ref}
      {...props}
      style={[style, { paddingBottom: Math.max(insets.bottom, 24) }]}
      className={contentStyle({ class: className })}
    />
  );
});

export const ActionsheetDragIndicatorWrapper =
  UIActionsheet.DragIndicatorWrapper;

export const ActionsheetDragIndicator = forwardRef<
  React.ComponentRef<typeof UIActionsheet.DragIndicator>,
  React.ComponentProps<typeof UIActionsheet.DragIndicator>
>(function ActionsheetDragIndicator({ className, ...props }, ref) {
  return (
    <UIActionsheet.DragIndicator
      ref={ref}
      {...props}
      className={`h-1.5 w-12 rounded-full bg-muted-foreground/35 ${className ?? ""}`}
    />
  );
});

export const ActionsheetItem = forwardRef<
  React.ComponentRef<typeof UIActionsheet.Item>,
  React.ComponentProps<typeof UIActionsheet.Item>
>(function ActionsheetItem({ className, ...props }, ref) {
  return (
    <UIActionsheet.Item
      ref={ref}
      {...props}
      className={itemStyle({ class: className })}
    />
  );
});

export const ActionsheetItemText = forwardRef<
  React.ComponentRef<typeof UIActionsheet.ItemText>,
  React.ComponentProps<typeof UIActionsheet.ItemText>
>(function ActionsheetItemText({ className, ...props }, ref) {
  return (
    <UIActionsheet.ItemText
      ref={ref}
      {...props}
      className={itemTextStyle({ class: className })}
    />
  );
});
