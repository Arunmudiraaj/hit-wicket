import { Link, NavLink } from "react-router-dom"
import { Menu, X } from "lucide-react"
import { useState } from "react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

import { APP_ROUTES } from "../constants/constants"

export default function Header() {
  const [open, setOpen] = useState(false)
  const navLinks = Object.values(APP_ROUTES)

  return (
    <header className="fixed top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-3 font-semibold tracking-tight transition-opacity hover:opacity-90"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-md font-bold text-lg">
            H
          </div>
          <span className="text-xl text-foreground">HitWicket</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <NavLink

              key={link.path}
              to={link.path}
              className={({ isActive }) =>
                cn(
                  "rounded-lg px-4 py-2 text-sm font-medium transition-all hover:text-primary hover:scale-105 duration-300",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground"
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* Mobile Menu Button */}
        <Button
          size="icon"
          variant="ghost"
          className="md:hidden text-foreground"
          aria-label="Open menu"
          onClick={() => setOpen(!open)}
        >
          <Menu />
        </Button>

        {/* Mobile Menu Overlay */}
        {open && (
          <>
            <div
              className="fixed top-0 left-0 h-[100vh] w-[100vw] inset-0 z-40 bg-background/80 backdrop-blur-xs md:hidden"
              onClick={() => setOpen(false)}
            />
            <div className="fixed right-0 top-0 z-50 h-[100vh] w-80 border-l border-border bg-card shadow-xl md:hidden animate-in slide-in-from-right duration-300">
              <div className="flex h-16 items-center justify-between border-b border-border px-6">
                <span className="text-lg font-semibold text-foreground">Menu</span>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label="Close menu"
                  onClick={() => setOpen(false)}
                  className="text-foreground"
                >
                  <X />
                </Button>
              </div>
              <nav className="flex flex-col p-4">
                {navLinks.map((link) => (
                  <NavLink
                    key={link.path}
                    to={link.path}
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        "rounded-lg px-4 py-1 text-sm font-medium hover:text-primary",
                        isActive
                          ? "text-primary"
                          : "text-muted-foreground"
                      )
                    }
                  >
                    {link.label}
                  </NavLink>
                ))}
              </nav>
            </div>
          </>
        )}
      </div>
    </header>
  )
}
