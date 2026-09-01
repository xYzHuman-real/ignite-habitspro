import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export type PurchaseResult = {
  status: "success" | "failed";
  receiptId: string;
  failureReason?: string;
  failureCode?: string;
};

interface FakePlayPurchaseSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: "monthly" | "yearly";
  priceInr: number;
  onConfirm: (result: PurchaseResult) => Promise<void> | void;
}

/**
 * Purchases stay disabled until Google Play Billing is integrated and receipts
 * are verified by the backend. A custom sheet must never imitate Play checkout
 * or grant a paid entitlement.
 */
export function FakePlayPurchaseSheet({ open, onOpenChange }: FakePlayPurchaseSheetProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm p-6">
        <div className="flex gap-3">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
          <div>
            <h2 className="text-base font-semibold">Premium purchases are not available yet</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              We are setting up secure Google Play Billing. No payment has been charged and Premium has not been activated.
            </p>
          </div>
        </div>
        <Button className="mt-5 w-full" onClick={() => onOpenChange(false)}>
          Close
        </Button>
      </DialogContent>
    </Dialog>
  );
}
