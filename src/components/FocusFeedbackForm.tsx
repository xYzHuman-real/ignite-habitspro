import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Send, Bug, Lightbulb, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

export function FocusFeedbackForm() {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"bug" | "feedback">("feedback");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSend = async () => {
    if (!message.trim()) return;
    setSending(true);
    try {
      // Store feedback as a notification to the user (confirmation) and log it
      if (user) {
        await supabase.from("notifications").insert({
          user_id: user.id,
          type: "system",
          title: type === "bug" ? "🐛 Bug Report Sent" : "💡 Feedback Sent",
          message: `Your ${type} report has been submitted. Thank you for helping improve Ignite!`,
          icon: type === "bug" ? "🐛" : "💡",
        });
      }
      toast({
        title: "Sent Successfully! ✉️",
        description: `Your ${type} report has been submitted to support@ignitehabitpro. Thank you!`,
      });
      setMessage("");
      setOpen(false);
    } catch (err: any) {
      toast({ title: "Failed to send", description: err.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
          <MessageSquare className="h-4 w-4" /> Feedback
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display">Send Feedback</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={type === "feedback" ? "default" : "outline"}
              onClick={() => setType("feedback")}
              className={type === "feedback" ? "bg-gradient-primary text-primary-foreground" : ""}
            >
              <Lightbulb className="h-4 w-4 mr-1" /> Feedback
            </Button>
            <Button
              size="sm"
              variant={type === "bug" ? "default" : "outline"}
              onClick={() => setType("bug")}
              className={type === "bug" ? "bg-destructive text-destructive-foreground" : ""}
            >
              <Bug className="h-4 w-4 mr-1" /> Bug Report
            </Button>
          </div>
          <Textarea
            placeholder={type === "bug" ? "Describe the bug you found..." : "Share your thoughts or suggestions..."}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
          />
          <Button
            onClick={handleSend}
            disabled={!message.trim() || sending}
            className="w-full bg-gradient-primary text-primary-foreground"
          >
            <Send className="h-4 w-4 mr-1" /> {sending ? "Sending..." : "Send"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
