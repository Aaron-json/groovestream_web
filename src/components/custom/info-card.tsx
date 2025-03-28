import { Card, CardContent } from "../ui/card";
import { Music2 } from "lucide-react";

type InfoCardProps = {
  text: string;
  icon?: React.ReactNode;
};

export default function InfoCard(props: InfoCardProps) {
  const icon = props.icon ?? <Music2 className="w-6 h-6 mr-2" />;
  return (
    <Card className="w-[30rem] mx-auto mt-8">
      <CardContent className="flex items-center justify-center p-8 text-muted-foreground">
        {icon}
        <span>{props.text}</span>
      </CardContent>
    </Card>
  );
}
