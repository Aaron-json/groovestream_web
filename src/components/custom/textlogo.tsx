import { cn } from "@/lib/utils";

const TextLogo = ({ className, ...props }: React.ComponentProps<"h1">) => {
  return (
    <h1
      className={cn("text-3xl font-bold text-center text-primary", className)}
      {...props}
    >
      GrooveStream
    </h1>
  );
};

export { TextLogo };
