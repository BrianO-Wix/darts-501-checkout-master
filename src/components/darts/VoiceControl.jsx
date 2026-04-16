import React, { useState, useEffect, useRef, useCallback } from "react";
import { Mic, MicOff, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

export default function VoiceControl({ onScoreDetected }) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef(null);

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
        // Extract number from speech
        const numbers = text.match(/\d+/g);
        if (numbers) {
          const score = parseInt(numbers[numbers.length - 1], 10);
          onScoreDetected(score);
        }
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.abort();
    };
  }, [onScoreDetected]);

  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setTranscript("");
      recognitionRef.current.start();
      setIsListening(true);
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

export function speakCheckout(checkout) {
  if (!checkout || !window.speechSynthesis) return;

  window.speechSynthesis.cancel();

  const text = checkout.spoken.join(", ");
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.9;
  utterance.pitch = 1;
  utterance.lang = "en-US";
  window.speechSynthesis.speak(utterance);
}