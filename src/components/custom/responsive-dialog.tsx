import { useIsMobile } from "@/hooks/use-mobile";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerTrigger,
  DrawerDescription,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

export type ResponsiveDialogProps = {
  state?: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
  };
  trigger: React.ReactNode;
  header: {
    title: string;
    description?: string;
  };
  content: React.ReactNode;
};
export default function ResponsiveDialog(props: ResponsiveDialogProps) {
  const isMobile = useIsMobile();

  if (!isMobile) {
    return (
      <Dialog {...props.state}>
        <DialogTrigger asChild>{props.trigger}</DialogTrigger>
        <DialogHeader>
          <DialogTitle>{props.header.title}</DialogTitle>
          {props.header.description && (
            <DialogDescription>{props.header.description}</DialogDescription>
          )}
        </DialogHeader>
        <DialogContent>{props.content}</DialogContent>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
        </DialogFooter>
      </Dialog>
    );
  } else {
    return (
      <Drawer {...props.state}>
        <DrawerTrigger asChild>{props.trigger}</DrawerTrigger>
        <DrawerHeader>
          <DrawerTitle>{props.header.title}</DrawerTitle>
          {props.header.description && (
            <DrawerDescription>{props.header.description}</DrawerDescription>
          )}
        </DrawerHeader>
        <DrawerContent>{props.content}</DrawerContent>
        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="outline">Close</Button>
          </DrawerClose>
        </DrawerFooter>
      </Drawer>
    );
  }
}
