"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Volume2, VolumeX, Sparkles, Moon, Sun, HelpCircle, LogOut, User } from "lucide-react"

type SettingsScreenProps = {
  onBack: () => void
}

export function SettingsScreen({ onBack }: SettingsScreenProps) {
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [animationsEnabled, setAnimationsEnabled] = useState(true)

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center gap-4 p-4 border-b border-border">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-bold text-foreground">Settings</h1>
      </header>

      <main className="flex-1 p-4 max-w-md mx-auto w-full flex flex-col gap-6">
        {/* Sound & Visual */}
        <div className="bg-card rounded-xl border border-border p-4">
          <h3 className="font-semibold text-foreground mb-4">Sound & Visual</h3>

          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {soundEnabled ? (
                  <Volume2 className="w-5 h-5 text-primary" />
                ) : (
                  <VolumeX className="w-5 h-5 text-muted-foreground" />
                )}
                <Label htmlFor="sound" className="text-foreground">
                  Sound Effects
                </Label>
              </div>
              <Switch id="sound" checked={soundEnabled} onCheckedChange={setSoundEnabled} />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-accent" />
                <Label htmlFor="animations" className="text-foreground">
                  Animations
                </Label>
              </div>
              <Switch id="animations" checked={animationsEnabled} onCheckedChange={setAnimationsEnabled} />
            </div>

            {/* <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isDarkMode ? <Moon className="w-5 h-5 text-primary" /> : <Sun className="w-5 h-5 text-accent" />}
                <Label htmlFor="darkMode" className="text-foreground">
                  Dark Mode
                </Label>
              </div>
              <Switch id="darkMode" checked={isDarkMode} onCheckedChange={toggleTheme} />
            </div> */}
          </div>
        </div>

        {/* How to Play */}
        <div className="bg-card rounded-xl border border-border p-4">
          <h3 className="font-semibold text-foreground mb-4">How to Play</h3>

          <div className="flex flex-col gap-3 text-sm text-muted-foreground">
            <div className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">
                1
              </span>
              <p>Both players choose a number: 0, 1, 2, 4, or 5</p>
            </div>
            <div className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">
                2
              </span>
              <p>If numbers match, the batter is OUT!</p>
            </div>
            <div className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">
                3
              </span>
              <p>{"If numbers don't match, batter scores their chosen runs"}</p>
            </div>
            <div className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">
                4
              </span>
              <p>After 30 balls or OUT, roles switch for the second innings</p>
            </div>
            <div className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">
                5
              </span>
              <p>Player with most runs wins!</p>
            </div>
          </div>
        </div>

        {/* Account */}
        <div className="bg-card rounded-xl border border-border p-4">
          <h3 className="font-semibold text-foreground mb-4">Account</h3>

          <div className="flex flex-col gap-2">
            <Button variant="ghost" className="justify-start h-12">
              <User className="w-5 h-5 mr-3" />
              Edit Profile
            </Button>
            <Button variant="ghost" className="justify-start h-12">
              <HelpCircle className="w-5 h-5 mr-3" />
              Help & Support
            </Button>
            <Button variant="ghost" className="justify-start h-12 text-destructive hover:text-destructive">
              <LogOut className="w-5 h-5 mr-3" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* Version */}
        <div className="text-center text-sm text-muted-foreground">Hitwicket v1.0.0</div>
      </main>
    </div>
  )
}
