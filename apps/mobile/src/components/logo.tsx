import { Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";

export function AudioLinesIcon({
  size = 20,
  color = "#ffffff",
}: {
  size?: number;
  color?: string;
}) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="M2 10v3" />
      <Path d="M6 6v11" />
      <Path d="M10 3v18" />
      <Path d="M14 8v7" />
      <Path d="M18 5v13" />
      <Path d="M22 10v3" />
    </Svg>
  );
}

export function Logo({
  size = "md",
  className = "",
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const iconSizes = { sm: 16, md: 20, lg: 28 };
  const boxSizes = {
    sm: "h-7 w-7 rounded-lg",
    md: "h-9 w-9 rounded-xl",
    lg: "h-14 w-14 rounded-2xl",
  };
  const textSizes = {
    sm: "text-lg font-semibold",
    md: "text-xl font-semibold",
    lg: "text-3xl font-bold",
  };

  return (
    <View className={`flex-row items-center gap-2.5 ${className}`}>
      <View
        className={`items-center justify-center bg-primary shadow-sm ${boxSizes[size]}`}
      >
        <AudioLinesIcon size={iconSizes[size]} color="#ffffff" />
      </View>
      <Text
        className={`tracking-tight text-foreground ${textSizes[size]}`}
      >
        GrooveStream
      </Text>
    </View>
  );
}
