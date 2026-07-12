"use client";

import { motion, useReducedMotion } from "framer-motion";
import { EASE_STANDARD, MOTION_DURATION } from "@/lib/motion";

export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: MOTION_DURATION.reveal, delay, ease: EASE_STANDARD }}
    >
      {children}
    </motion.div>
  );
}
