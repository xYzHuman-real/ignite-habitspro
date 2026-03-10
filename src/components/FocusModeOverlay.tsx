import { motion, AnimatePresence } from "framer-motion";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface FocusModeOverlayProps {
  showExitConfirm: boolean;
  onContinue: () => void;
  onExit: () => void;
}

export function FocusExitConfirmDialog({ showExitConfirm, onContinue, onExit }: FocusModeOverlayProps) {
  return (
    <AlertDialog open={showExitConfirm} onOpenChange={(open) => !open && onContinue()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="font-display">Exit Focus Session?</AlertDialogTitle>
          <AlertDialogDescription>
            You are currently in a focus session. Your timer will continue running in the background, but leaving may break your focus.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onContinue}>Continue Focus</AlertDialogCancel>
          <AlertDialogAction onClick={onExit} className="bg-destructive text-destructive-foreground">
            Exit Session
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
