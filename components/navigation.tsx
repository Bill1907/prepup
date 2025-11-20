"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu, FileText, MessageSquare, Mic, Settings } from "lucide-react";

export function Navigation() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(path + "/");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:bg-gray-900/95 dark:supports-[backdrop-filter]:bg-gray-900/60">
      <div className="container flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-bold text-xl">
            PrepUp
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <SignedIn>
              <Link
                href="/service/dashboard"
                className={`text-sm font-medium transition-colors hover:text-blue-600 ${
                  isActive("/service/dashboard") ? "text-blue-600" : "text-gray-600 dark:text-gray-300"
                }`}
              >
                Dashboard
              </Link>
            </SignedIn>
            <Link
              href="/about"
              className={`text-sm font-medium transition-colors hover:text-blue-600 ${
                isActive("/about") ? "text-blue-600" : "text-gray-600 dark:text-gray-300"
              }`}
            >
              About
            </Link>
            <Link
              href="/blog"
              className={`text-sm font-medium transition-colors hover:text-blue-600 ${
                isActive("/blog") ? "text-blue-600" : "text-gray-600 dark:text-gray-300"
              }`}
            >
              Blog
            </Link>
            <Link
              href="/help"
              className={`text-sm font-medium transition-colors hover:text-blue-600 ${
                isActive("/help") ? "text-blue-600" : "text-gray-600 dark:text-gray-300"
              }`}
            >
              Help
            </Link>
            <Link
              href="/contact"
              className={`text-sm font-medium transition-colors hover:text-blue-600 ${
                isActive("/contact") ? "text-blue-600" : "text-gray-600 dark:text-gray-300"
              }`}
            >
              Contact
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center gap-4">
            <SignedOut>
              <SignInButton mode="modal">
                <Button variant="ghost">Sign In</Button>
              </SignInButton>
              <SignUpButton mode="modal">
                <Button>Get Started</Button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link href="/service/dashboard" className="cursor-pointer">
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/service/resume" className="cursor-pointer flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Resume
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/service/questions" className="cursor-pointer flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Questions
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/service/mock-interview" className="cursor-pointer flex items-center gap-2">
                      <Mic className="h-4 w-4" />
                      Mock Interview
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/service/settings" className="cursor-pointer flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <UserButton />
            </SignedIn>
          </div>

          {/* Mobile Menu */}
          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <SignedOut>
                  <DropdownMenuItem asChild>
                    <SignInButton mode="modal">
                      <button className="w-full text-left cursor-pointer">Sign In</button>
                    </SignInButton>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <SignUpButton mode="modal">
                      <button className="w-full text-left cursor-pointer">Sign Up</button>
                    </SignUpButton>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </SignedOut>
                <SignedIn>
                  <DropdownMenuItem asChild>
                    <Link href="/service/dashboard" className="cursor-pointer">
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                </SignedIn>
                <DropdownMenuItem asChild>
                  <Link href="/about" className="cursor-pointer">
                    About
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/blog" className="cursor-pointer">
                    Blog
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/help" className="cursor-pointer">
                    Help
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/contact" className="cursor-pointer">
                    Contact
                  </Link>
                </DropdownMenuItem>
                <SignedIn>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/service/settings" className="cursor-pointer">
                      Settings
                    </Link>
                  </DropdownMenuItem>
                </SignedIn>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}

