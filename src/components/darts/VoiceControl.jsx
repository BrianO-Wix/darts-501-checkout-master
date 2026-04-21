import React, { useState, useEffect, useRef, useCallback } from "react";
import { Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

export default function VoiceControl({ onTranscript, prompt }) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [supported, setSupported] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const recognitionRef = useRef(null);
  const onScoreRef = useRef(onTranscript);

  // Keep ref in sync so the recognition handler always calls the latest version
  useEffect(() => {
    onScoreRef.current = onTranscript;
  }, [onTranscript]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      const current = event.results[event.results.length - 1];
      const text = current[0].transcript;
      setTranscript(text);

      if (current.isFinal) {
        onScoreRef.current(text);
      }
    };

    recognition.onerror = (event) => {
      setIsListening(false);
      if (event.error === "not-allowed") {
        setErrorMsg("Microphone access denied. Please allow microphone in your browser.");
      } else if (event.error === "no-speech") {
        setErrorMsg("No speech detected. Try again.");
      } else {
        setErrorMsg(`Error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.abort();
    };
  }, []); // Only run once — uses ref for callback

  const toggleListening = useCallback(async () => {
    if (!recognitionRef.current) return;
    setErrorMsg("");

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      // Request microphone permission explicitly first
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (err) {
        setErrorMsg("Microphone access denied. Please allow microphone in your browser.");
        return;
      }

      setTranscript("");
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        setErrorMsg("Could not start voice recognition. Try again.");
      }
    }
  }, [isListening]);

  if (!supported) {
    return (
      <div className="text-center text-muted-foreground font-body text-sm">
        Voice recognition is not supported in this browser. Try Chrome or Edge.
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Mic Button */}
      <motion.div whileTap={{ scale: 0.95 }}>
        <Button
          onClick={toggleListening}
          size="lg"
          className={`relative w-24 h-24 rounded-full transition-all duration-300 ${
            isListening
              ? "bg-primary text-primary-foreground shadow-[0_0_40px_hsl(var(--primary)/0.5)]"
              : "bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground"
          }`}
        >
          <AnimatePresence mode="wait">
            {isListening ? (
              <motion.div
                key="on"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
              >
                <Mic className="w-10 h-10" />
              </motion.div>
            ) : (
              <motion.div
                key="off"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
              >
                <MicOff className="w-10 h-10" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Pulse rings when listening */}
          {isListening && (
            <>
              <motion.span
                className="absolute inset-0 rounded-full border-2 border-primary"
                animate={{ scale: [1, 1.5], opacity: [0.6, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <motion.span
                className="absolute inset-0 rounded-full border-2 border-primary"
                animate={{ scale: [1, 1.8], opacity: [0.4, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
              />
            </>
          )}
        </Button>
      </motion.div>

      {/* Status label */}
      <p className="text-sm font-body text-muted-foreground tracking-wide uppercase">
        {isListening ? "Listening…" : "Tap to speak"}
      </p>
      {prompt && !isListening && (
        <p className="text-xs font-body text-muted-foreground/70 text-center max-w-xs">{prompt}</p>
      )}

      {/* Error message */}
      <AnimatePresence>
        {errorMsg && (
          <motion.p
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-destructive font-body text-sm text-center max-w-xs"
          >
            {errorMsg}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Transcript */}
      <AnimatePresence>
        {transcript && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-center"
          >
            <p className="text-xs text-muted-foreground font-body">I heard:</p>
            <p className="text-foreground font-body font-medium text-lg">"{transcript}"</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function speakText(text) {
  if (!text || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.9;
  utterance.pitch = 1;
  utterance.lang = "en-US";
  window.speechSynthesis.speak(utterance);
}

export function speakCheckout(checkout) {
  if (!checkout) return;
  speakText(checkout.spoken.join(", "));
}