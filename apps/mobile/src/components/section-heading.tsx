import { Text, View } from "react-native";

export function SectionHeading({
  title,
  subtitle,
  action,
  className = "",
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <View className={`flex-row items-end justify-between ${className}`}>
      <View className="min-w-0 flex-1 gap-0.5">
        <Text className="text-xl font-bold tracking-tight text-foreground">
          {title}
        </Text>
        {subtitle ? (
          <Text className="text-xs text-muted-foreground">{subtitle}</Text>
        ) : null}
      </View>
      {action}
    </View>
  );
}
