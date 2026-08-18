import { Image, Text, View } from "react-native";

export type AvatarProps = {
  name?: string | null;
  imageUrl?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
};

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-lg",
  xl: "h-20 w-20 text-2xl",
};

export function Avatar({
  name,
  imageUrl,
  size = "md",
  className = "",
}: AvatarProps) {
  const initials = (name || "?")
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const sizeClass = sizeClasses[size];

  if (imageUrl) {
    return (
      <View
        className={`overflow-hidden rounded-full border border-border/80 bg-secondary ${sizeClass} ${className}`}
      >
        <Image
          source={{ uri: imageUrl }}
          className="h-full w-full"
          accessibilityLabel={name ? `${name}'s avatar` : "User avatar"}
        />
      </View>
    );
  }

  return (
    <View
      className={`items-center justify-center rounded-full border border-primary/25 bg-primary/15 ${sizeClass} ${className}`}
    >
      <Text className="font-bold text-primary">{initials}</Text>
    </View>
  );
}
