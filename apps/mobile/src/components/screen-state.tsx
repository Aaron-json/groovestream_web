import { ActivityIndicator, Text, View } from "react-native";
import type Ionicons from "@expo/vector-icons/Ionicons";
import { AppIcon } from "@/components/app-icon";
import { Button, ButtonText } from "@/components/ui/button";

export function LoadingState({ label }: { label: string }) {
  return (
    <View className="flex-1 items-center justify-center gap-4 bg-background p-6">
      <View className="h-16 w-16 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 shadow-lg shadow-primary/15">
        <ActivityIndicator size="large" colorClassName="accent-primary" />
      </View>
      <Text className="text-sm font-medium text-muted-foreground">{label}</Text>
    </View>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <View className="flex-1 items-center justify-center gap-4 bg-background p-8">
      <View className="h-16 w-16 items-center justify-center rounded-2xl border border-destructive/20 bg-destructive/10">
        <AppIcon
          name="alert-circle-outline"
          size={32}
          colorClassName="accent-destructive"
        />
      </View>
      <View className="items-center gap-1">
        <Text className="text-xl font-bold tracking-tight text-foreground">
          Couldn&apos;t load this
        </Text>
        <Text className="max-w-xs text-center text-sm leading-5 text-muted-foreground">
          {message}
        </Text>
      </View>
      <Button onPress={onRetry} size="default" accessibilityLabel="Try loading again">
        <ButtonText>Try again</ButtonText>
      </Button>
    </View>
  );
}

export function EmptyState({
  title,
  description,
  icon,
  action,
}: {
  title: string;
  description: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  action?: React.ReactNode;
}) {
  return (
    <View className="items-center gap-4 px-6 py-12">
      <View className="h-16 w-16 items-center justify-center rounded-2xl border border-border/80 bg-secondary/60">
        <AppIcon
          name={icon}
          size={32}
          colorClassName="accent-muted-foreground"
        />
      </View>
      <View className="items-center gap-1.5">
        <Text className="text-center text-lg font-bold tracking-tight text-foreground">
          {title}
        </Text>
        <Text className="max-w-xs text-center text-sm leading-5 text-muted-foreground">
          {description}
        </Text>
      </View>
      {action}
    </View>
  );
}

export function PaginationFooter({
  loading,
  failed,
  onRetry,
}: {
  loading: boolean;
  failed: boolean;
  onRetry: () => void;
}) {
  if (loading) {
    return (
      <View className="items-center py-6">
        <ActivityIndicator colorClassName="accent-primary" />
      </View>
    );
  }
  if (!failed) return null;

  return (
    <View className="items-center gap-2 py-6">
      <Text className="text-xs text-destructive">More items could not be loaded.</Text>
      <Button variant="ghost" size="sm" onPress={onRetry}>
        <ButtonText>Try again</ButtonText>
      </Button>
    </View>
  );
}
