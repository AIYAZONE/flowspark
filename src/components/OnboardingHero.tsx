'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Sprout } from 'lucide-react'

interface OnboardingDict {
  heroTitle: string
  heroDesc: string
  createFirstGoal: string
  seeExample: string
}

export function OnboardingHero({ dict }: { dict: OnboardingDict }) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-background to-background border border-primary/10 p-8 sm:p-12">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      
      <div className="relative z-10 max-w-2xl">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/20 text-primary mb-6">
          <Sprout className="w-6 h-6" />
        </div>
        
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
          {dict.heroTitle}
        </h2>
        
        <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
          {dict.heroDesc}
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/goals/new">
            <Button size="lg" className="w-full sm:w-auto rounded-full px-8 h-12 text-base shadow-lg shadow-primary/20 hover:scale-105 transition-transform">
              {dict.createFirstGoal}
            </Button>
          </Link>
          
          {/* Optional Secondary Action */}
          {/* <Button variant="ghost" size="lg" className="w-full sm:w-auto rounded-full h-12">
            {dict.seeExample}
          </Button> */}
        </div>
      </div>
    </div>
  )
}
