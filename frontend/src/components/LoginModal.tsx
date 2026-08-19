import React, { useEffect } from "react";
import { X } from "lucide-react";
import { SignIn } from "@clerk/clerk-react";
import { useLoginModal } from "@/context/LoginModalContext";

export default function LoginModal() {
  const { isLoginOpen, closeLogin } = useLoginModal();

  // Handle escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isLoginOpen) {
        closeLogin();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLoginOpen, closeLogin]);

  if (!isLoginOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 select-none animate-in fade-in duration-200">
      {/* Backdrop with premium blur */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-300"
        onClick={closeLogin}
      />

      {/* Center Popup Container */}
      <div className="relative bg-white/95 dark:bg-[#07090e]/95 backdrop-blur-xl border border-black/10 dark:border-zinc-800/80 rounded-2xl p-6 shadow-[0_0_50px_rgba(0,0,0,0.3)] dark:shadow-[0_0_50px_rgba(0,0,0,0.85)] z-10 overflow-hidden transform scale-100 transition-all duration-300">
        {/* Close Button */}
        <button
          onClick={closeLogin}
          className="absolute top-4 right-4 p-1.5 rounded-full text-zinc-400 hover:text-foreground dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-all cursor-pointer z-[110]"
          aria-label="Close modal"
        >
          <X size={16} />
        </button>

        <SignIn 
          signUpUrl="/signup"
          appearance={{
            variables: {
              colorPrimary: "#00d1ff",
              colorBackground: "transparent",
              colorText: "currentColor",
              colorTextSecondary: "currentColor",
              colorInputText: "currentColor",
            },
            elements: {
              card: "shadow-none border-0 p-0 bg-transparent text-zinc-900 dark:text-white",
              headerTitle: "text-zinc-900 dark:text-white text-2xl font-bold font-sans",
              headerSubtitle: "text-zinc-600 dark:text-zinc-400 font-mono text-xs uppercase tracking-wider",
              socialButtonsBlockButton: "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-900 dark:text-white font-sans",
              socialButtonsBlockButtonText: "text-zinc-900 dark:text-white font-semibold",
              dividerLine: "bg-zinc-200 dark:bg-zinc-800",
              dividerText: "text-zinc-600 dark:text-zinc-400 text-xs font-mono uppercase",
              formButtonPrimary: "bg-primary text-white dark:bg-[#00d1ff] dark:text-black hover:brightness-110 font-extrabold font-sans",
              footer: "bg-transparent border-0 text-zinc-600 dark:text-zinc-400",
              footerActionText: "text-zinc-600 dark:text-zinc-400 font-sans",
              footerActionLink: "text-primary dark:text-[#00d1ff] hover:underline font-sans font-semibold",
              formLabelInput: "text-[10px] font-mono text-zinc-700 dark:text-zinc-300 uppercase tracking-widest block font-bold",
              formFieldInput: "bg-white dark:bg-zinc-900/90 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:border-primary",
              formResendCodeLink: "text-primary dark:text-[#00d1ff] hover:underline font-mono text-xs",
            }
          }}
        />
      </div>
    </div>
  );
}
