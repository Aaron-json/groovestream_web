import type { ReactNode } from "react";

import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MediaRowSkeleton } from "./media-card";

export type MediaListProps = {
  children: ReactNode;
  title: string;
  headerAction?: ReactNode;
};

export default function MediaList({
  title,
  headerAction,
  children,
}: MediaListProps) {
  return (
    <section className="w-full">
      <Card className="gap-0 py-0">
        <CardHeader className="border-b py-4">
          <CardTitle>
            <h2>{title}</h2>
          </CardTitle>
          {headerAction && <CardAction>{headerAction}</CardAction>}
        </CardHeader>
        <CardContent className="p-2">
          <div className="grid grid-cols-1 gap-1 md:grid-cols-2">
            {children}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

export function MediaListSkeleton() {
  return (
    <Card className="w-full gap-0 py-0">
      <CardContent className="grid grid-cols-1 gap-1 p-2 md:grid-cols-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <MediaRowSkeleton key={index} />
        ))}
      </CardContent>
    </Card>
  );
}
