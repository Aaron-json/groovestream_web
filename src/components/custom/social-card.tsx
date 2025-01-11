import { Card, CardContent } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Users2 } from "lucide-react";

export type SocialCardProps = {
  title: string;
  subtitle: string;
};

export default function SocialCard({ title, subtitle }: SocialCardProps) {
  <Card className="w-40 shadow-md hover:shadow-lg transition-shadow duration-200 rounded-md">
    <CardContent className="p-0">
      <div className="flex flex-col gap-2">
        <AspectRatio ratio={1} className="bg-muted relative group rounded-md">
          <div className="absolute inset-0 flex items-center justify-center">
            <Users2 className="w-10 h-10 text-muted-foreground" />
          </div>
        </AspectRatio>
        <div className="flex flex-col px-2 pb-2">
          <span className="truncate font-semibold text-sm text-primary">
            {title}
          </span>
          <div className="flex justify-between items-center text-xs text-muted-foreground">
            <span className="truncate">{subtitle}</span>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>;
}
