"use client"

import { motion } from "framer-motion"
import { Sparkles, Zap, Gift } from "lucide-react"

interface HeroVisualProps {
  dict: {
    userLabel: string
    userInput: string
    aiLabel: string
    dayLabel: string
    questTitle: string
    questDesc: string
    xpLabel: string
    rewardTitle: string
    rewardDesc: string
  }
}

export function HeroVisual({ dict }: HeroVisualProps) {
  return (
    <div className="relative w-full max-w-[500px] aspect-[4/5] mx-auto lg:mx-0">
      {/* Background Glow */}
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
          rotate: [0, 90, 0] 
        }}
        transition={{ 
          duration: 10,
          repeat: Infinity,
          ease: "linear" 
        }}
        className="absolute inset-0 bg-gradient-to-tr from-primary/30 via-purple-500/30 to-blue-500/30 blur-3xl rounded-full"
      />

      {/* Floating Cards Container */}
      <div className="relative z-10 h-full flex flex-col justify-center gap-6">
        
        {/* Card 1: Vague Ambition Input */}
        <motion.div
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="bg-background/80 backdrop-blur-md border border-border p-4 rounded-xl shadow-lg transform -rotate-3"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs">{dict.userLabel}</div>
            <div className="h-2 w-20 bg-muted rounded animate-pulse" />
          </div>
          <div className="text-sm font-medium text-foreground/80">
            "{dict.userInput}"
          </div>
        </motion.div>

        {/* Arrow Connection */}
        <motion.div 
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8, duration: 0.3 }}
          className="self-center text-primary"
        >
          <Zap className="w-8 h-8 fill-primary/20" />
        </motion.div>

        {/* Card 2: AI Micro-Quest Generation */}
        <motion.div
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.5 }}
          className="bg-gradient-to-br from-background to-primary/5 backdrop-blur-md border border-primary/20 p-5 rounded-xl shadow-xl transform rotate-3"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              {dict.aiLabel}
            </div>
            <span className="text-xs text-muted-foreground">{dict.dayLabel}</span>
          </div>
          <h3 className="font-bold text-lg mb-2">{dict.questTitle}</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {dict.questDesc}
          </p>
          <div className="flex items-center justify-between">
            <div className="flex -space-x-2">
              <div className="w-6 h-6 rounded-full bg-blue-500 border-2 border-background" />
              <div className="w-6 h-6 rounded-full bg-purple-500 border-2 border-background" />
            </div>
            <div className="text-xs font-mono text-primary bg-primary/10 px-2 py-1 rounded">
              {dict.xpLabel}
            </div>
          </div>
        </motion.div>

        {/* Card 3: Reward Unlocked (Pop-up effect) */}
        <motion.div
          initial={{ y: 50, opacity: 0, scale: 0.8 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          transition={{ delay: 2.5, type: "spring", bounce: 0.5 }}
          className="absolute -right-4 -bottom-4 bg-foreground text-background p-4 rounded-xl shadow-2xl border border-border max-w-[200px]"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 bg-yellow-400 rounded-lg text-yellow-900">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm">{dict.rewardTitle}</div>
              <div className="text-xs opacity-80 mt-1">{dict.rewardDesc}</div>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  )
}
