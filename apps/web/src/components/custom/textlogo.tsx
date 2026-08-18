import { cn } from "@/lib/utils";
import { AudioLines } from "lucide-react";

const TextLogo = ({ className, ...props }: React.ComponentProps<"h1">) => {
  return (
    <h1
      className={cn(
        "flex items-center gap-2.5 text-xl font-semibold tracking-tight text-foreground",
        className,
      )}
      {...props}
    >
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
        <AudioLines className="size-4.5" />
      </span>
      <span>GrooveStream</span>
    </h1>
  );
};

export { TextLogo };
