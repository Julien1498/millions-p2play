import React, { useEffect, useState } from "react";
import { PhoneCall, X, Clock } from "lucide-react";
import { Button } from "../ui/Button";

export interface PhoneFriendModalProps {
  hintText: string | null;
  onClose: () => void;
}

export function PhoneFriendModal({ hintText, onClose }: PhoneFriendModalProps) {
  const [timeLeft, setTimeLeft] = useState<number>(30);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  if (!hintText) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0b1736] border-2 border-amber-500/50 rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl space-y-6 text-slate-100">
        <div className="flex items-center justify-between border-b border-amber-500/30 pb-3">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-lg">
            <PhoneCall className="w-6 h-6 animate-bounce" /> Appel à un Ami
          </div>
          <div className="flex items-center gap-1 bg-amber-500/20 text-amber-400 font-mono font-bold px-3 py-1 rounded-full text-xs border border-amber-500/40">
            <Clock className="w-3.5 h-3.5" /> {timeLeft}s
          </div>
        </div>

        <div className="bg-slate-900/80 p-5 rounded-xl border border-amber-500/30 text-amber-200 italic font-medium leading-relaxed shadow-inner">
          {hintText}
        </div>

        <div className="pt-2 flex justify-center">
          <Button variant="secondary" size="md" onClick={onClose}>
            Raccrocher
          </Button>
        </div>
      </div>
    </div>
  );
}
