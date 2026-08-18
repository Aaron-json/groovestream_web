import { createSlider } from "@gluestack-ui/core/slider/creator";
import {
  tva,
  useStyleContext,
  withStyleContext,
} from "@gluestack-ui/utils/nativewind-utils";
import { forwardRef } from "react";
import { Pressable, View } from "react-native";
import { withUniwind } from "uniwind";

const SCOPE = "SLIDER";
const UISlider = createSlider({
  Root: withStyleContext(View, SCOPE),
  Thumb: View,
  Track: Pressable,
  FilledTrack: View,
  ThumbInteraction: View,
});
const StyledTrack = withUniwind(UISlider.Track);

const rootStyle = tva({ base: "w-full items-center justify-center py-2" });
const trackStyle = tva({
  base: "h-1.5 w-full flex-row overflow-hidden rounded-full bg-secondary",
});
const fillStyle = tva({ base: "h-full bg-primary rounded-full" });
const thumbStyle = tva({
  base: "absolute h-4 w-4 rounded-full border-2 border-primary bg-white shadow-md shadow-black/40",
});

export const Slider = forwardRef<
  React.ComponentRef<typeof UISlider>,
  React.ComponentProps<typeof UISlider>
>(function Slider({ className, ...props }, ref) {
  return (
    <UISlider
      ref={ref}
      {...props}
      className={rootStyle({ class: className })}
      context={{ orientation: "horizontal", isReversed: false }}
    />
  );
});

export const SliderTrack = forwardRef<
  React.ComponentRef<typeof UISlider.Track>,
  React.ComponentProps<typeof UISlider.Track>
>(function SliderTrack({ className, ...props }, ref) {
  useStyleContext(SCOPE);
  return (
    <StyledTrack
      ref={ref}
      hitSlop={24}
      {...props}
      className={trackStyle({ class: className })}
    />
  );
});

export const SliderFilledTrack = forwardRef<
  React.ComponentRef<typeof UISlider.FilledTrack>,
  React.ComponentProps<typeof UISlider.FilledTrack>
>(function SliderFilledTrack({ className, ...props }, ref) {
  return (
    <UISlider.FilledTrack
      ref={ref}
      {...props}
      className={fillStyle({ class: className })}
    />
  );
});

export const SliderThumb = forwardRef<
  React.ComponentRef<typeof UISlider.Thumb>,
  React.ComponentProps<typeof UISlider.Thumb>
>(function SliderThumb({ className, ...props }, ref) {
  return (
    <UISlider.Thumb
      ref={ref}
      {...props}
      className={thumbStyle({ class: className })}
    />
  );
});
