import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface FocusModeOverlayProps {
  showExitConfirm: boolean;
  onContinue: () => void;
  onExit: () => void;
}

export function FocusExitConfirmDialog({ showExitConfirm, onContinue, onExit }: FocusModeOverlayProps) {
  return (
    <AlertDialog open={showExitConfirm} onOpenChange={(open) => !open && onContinue()}>
      <AlertDialogContent className="z-[300]">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-display">Exit Focus Session?</AlertDialogTitle>
          <AlertDialogDescription>
            You are currently in a focus session. Your actual time studied will be saved.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onContinue}>Continue Focus</AlertDialogCancel>
          <AlertDialogAction onClick={onExit} className="bg-destructive text-destructive-foreground">
            End Session
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
