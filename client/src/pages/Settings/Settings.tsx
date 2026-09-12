import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Volume2, VolumeX, Moon, Sun, HelpCircle, LogOut, User } from "lucide-react"
import { useAppSelector } from "@/hooks/useTypedRedux"
import { THEME } from "@/constants/constants"
import { useDispatch } from "react-redux"
import { toggleTheme, toggleSound } from "@/store/slices/settingsSlice"
import { useUpdateSettings } from "@/api/mutations/useUpdateSettings"
import { useNavigate } from "react-router-dom"
import { useSession, signOut } from "@/lib/auth"

export default function SettingsScreen() {
  const { data: session, isPending } = useSession()
  const dispatch = useDispatch()
  
  const theme = useAppSelector((state: { settings: { theme: string } }) => state.settings.theme)
  const soundEnabled = useAppSelector((state: { settings: { soundEnabled: boolean } }) => state.settings.soundEnabled)
  const isDarkMode = theme === THEME.DARK
  const { mutate: updateSettings } = useUpdateSettings()
  const navigate = useNavigate()

  useEffect(() => {
    // Apply theme class to document
    if (theme === THEME.DARK) {
      document.documentElement.classList.add(THEME.DARK)
    } else {
      document.documentElement.classList.remove(THEME.DARK)
    }
  }, [theme])

  const toggleThemeHandler = (checked: boolean) => {
    dispatch(toggleTheme())
    updateSettings({ theme: checked ? THEME.DARK : THEME.LIGHT })
  }

  const toggleSoundHandler = (checked: boolean) => {
    dispatch(toggleSound())
    updateSettings({ soundEnabled: checked })
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center gap-4 p-4 border-b border-border">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
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
                  <VolumeX className="w-5 h-5 text-primary" />
                )}
                <Label htmlFor="sound" className="text-foreground">
                  Sound Effects
                </Label>
              </div>
              <Switch id="sound" checked={soundEnabled} onCheckedChange={toggleSoundHandler} />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isDarkMode ? <Moon className="w-5 h-5 text-primary" /> : <Sun className="w-5 h-5 text-primary" />}
                <Label htmlFor="darkMode" className="text-foreground">
                  Dark Mode
                </Label>
              </div>
              <Switch id="darkMode" checked={isDarkMode} onCheckedChange={toggleThemeHandler} />
            </div>
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
        {isPending ? (
          <div className="bg-card rounded-xl border border-border p-4 animate-pulse">
            <div className="h-5 bg-muted rounded w-1/3 mb-4"></div>
            <div className="flex flex-col gap-2">
              <div className="h-12 bg-muted rounded w-full"></div>
              <div className="h-12 bg-muted rounded w-full"></div>
              <div className="h-12 bg-muted rounded w-full"></div>
            </div>
          </div>
        ) : session ? (
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
              <Button onClick={() => signOut()} variant="ghost" className="justify-start h-12 text-destructive hover:text-destructive">
                <LogOut className="w-5 h-5 mr-3" />
                Sign Out
              </Button>
            </div>
          </div>
        ) : null}

        {/* Version */}
        <div className="text-center text-sm text-muted-foreground">Hitwicket v1.0.0</div>
      </main>
    </div>
  )
}
