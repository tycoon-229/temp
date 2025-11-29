"use client";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

// 1. GLITCH TEXT (PHIÊN BẢN CLIP-PATH - SIÊU MẠNH)
export const GlitchText = ({ text, className = "" }) => {
  const [isGlitching, setIsGlitching] = useState(false);

  useEffect(() => {
    // Giật liên tục mỗi 3 giây
    const interval = setInterval(() => {
      setIsGlitching(true);
      // Dừng giật sau 0.3s
      setTimeout(() => setIsGlitching(false), 300);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`relative inline-block ${className}`}>
      {/* Lớp gốc (Luôn hiện) */}
      <span className="relative z-10 block">{text}</span>

      {/* Lớp Glitch 1: Cắt phần trên, trượt sang trái */}
      {isGlitching && (
        <motion.span
          className="absolute inset-0 z-20 block text-red-500 opacity-70 bg-transparent"
          initial={{ x: 0 }}
          animate={{ x: [-2, 2, -2] }}
          transition={{ duration: 0.1, repeat: Infinity }}
          style={{
            clipPath: "inset(10% 0 60% 0)", // Cắt lấy 1 dải ở trên
          }}
        >
          {text}
        </motion.span>
      )}

      {/* Lớp Glitch 2: Cắt phần dưới, trượt sang phải */}
      {isGlitching && (
        <motion.span
          className="absolute inset-0 z-20 block text-blue-500 opacity-70 bg-transparent"
          initial={{ x: 0 }}
          animate={{ x: [2, -2, 2] }}
          transition={{ duration: 0.1, repeat: Infinity }}
          style={{
            clipPath: "inset(50% 0 10% 0)", // Cắt lấy 1 dải ở dưới
          }}
        >
          {text}
        </motion.span>
      )}
    </div>
  );
};

// 2. SCANLINE (GIỮ NGUYÊN VÌ ĐÃ ỔN)
export const ScanlineOverlay = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl z-10">
      <motion.div
        className="absolute top-0 left-0 w-full h-[50%] bg-gradient-to-b from-transparent via-emerald-400/20 to-transparent"
        initial={{ top: "-50%" }}
        animate={{ top: "150%" }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: "linear"
        }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.1)_1px,transparent_1px)] bg-[size:4px_4px] opacity-30"></div>
    </div>
  );
};