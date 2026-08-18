import { Card, CardContent } from "@/components/ui/card";
import { Music2, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type InfoCardVariant = "default" | "destructive" | "primary";

export type InfoCardProps = {
  title?: string;
  text: string;
  icon?: React.ReactNode;
  variant?: InfoCardVariant;
  className?: string;
};

const variantStyles: Record<InfoCardVariant, string> = {
  default: "bg-card text-muted-foreground border-border",
  destructive: "bg-destructive/10 text-destructive border-destructive/20",
  primary: "bg-primary/10 text-primary border-primary/20",
};

const defaultIcons: Record<InfoCardVariant, React.ElementType> = {
  default: Music2,
  destructive: AlertCircle,
  primary: Info,
};

export default function InfoCard({
  title,
  text,
  icon,
  variant = "default",
  className,
}: InfoCardProps) {
  const Icon = defaultIcons[variant];
  const renderIcon = icon ?? <Icon className="w-8 h-8 shrink-0 opacity-80" />;

  return (
    <Card
      className={cn(
        "mx-auto w-full max-w-lg overflow-hidden transition-all shadow-sm",
        className,
      )}
    >
      <CardContent
        className={cn(
          "flex flex-col items-center justify-center text-center p-8 gap-4",
          variantStyles[variant],
        )}
      >
        <div className="rounded-full p-4 bg-background/50 backdrop-blur-sm shadow-sm ring-1 ring-border/10">
          {renderIcon}
        </div>
        <div className="space-y-1.5">
          {title && (
            <h3 className="font-semibold tracking-tight text-foreground text-lg">
              {title}
            </h3>
          )}
          <p className="text-sm opacity-90 leading-relaxed max-w-[280px] mx-auto">
            {text}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
