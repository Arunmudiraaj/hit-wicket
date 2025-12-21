import { Link, NavLink, useLocation } from "react-router-dom"
import { Menu } from "lucide-react"
import { useEffect, useState } from "react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

import { APP_ROUTES } from "../constants/constants"

export default function Header() {
  const [open, setOpen] = useState(false)
  const location = useLocation()

  const navLinks = Object.values(APP_ROUTES)

  // close mobile menu on route change
  useEffect(() => {
    setOpen(false)
  }, [location.pathname])

  return (
    <header className="fixed top-0 z-50 w-full border-b shadow-lg bg-base-bg/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-3 font-bold tracking-tight"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500 text-white shadow">
            H
          </div>
          <span className="text-xl">HitWicket</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              className={({ isActive }) =>
                cn(
                  "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                  "hover:bg-elevated-bg",
                  isActive
                    ? "bg-primary-500 text-white shadow-sm"
                    : "text-muted-text"
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* Mobile Nav */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="md:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>

          <SheetContent side="right" className="w-80">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-500 text-white">
                  H
                </div>
                Menu
              </SheetTitle>
            </SheetHeader>

            <nav className="mt-8 flex flex-col gap-2">
              {navLinks.map((link) => (
                <NavLink
                  key={link.path}
                  to={link.path}
                  className={({ isActive }) =>
                    cn(
                      "rounded-lg px-4 py-3 text-sm font-medium transition-colors",
                      "hover:bg-muted-bg",
                      isActive
                        ? "bg-primary-500 text-white"
                        : "text-muted-text"
                    )
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}
