'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { User, Menu, X, LogOut, Calendar, BarChart3, Settings } from 'lucide-react'

interface HeaderProps {
  showNav?: boolean
}

export default function Header({ showNav = true }: HeaderProps) {
  const [user, setUser] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        // Check if admin
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', user.id)
          .single()
        setIsAdmin(profile?.is_admin || false)
      }
    }
    getUser()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <header className="bg-gs-black text-gs-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Image
              src="/logo-white.png"
              alt="Grande Sports"
              width={150}
              height={40}
              className="h-8 w-auto object contain"
              priority
            />
          </Link>

          {/* Desktop Navigation */}
          {showNav && (
            <nav className="hidden md:flex items-center space-x-8">
              <Link 
                href="/book" 
                className="text-gs-white hover:text-gs-green transition-colors font-medium"
              >
                Book Session
              </Link>
              {user ? (
                <>
                  <Link
                    href="/dashboard"
                    className="text-gs-white hover:text-gs-green transition-colors font-medium"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/dashboard/settings"
                    className="text-gs-gray-400 hover:text-gs-white transition-colors"
                  >
                    <Settings size={18} />
                  </Link>
                  {isAdmin && (
                    <Link 
                      href="/admin" 
                      className="text-gs-green hover:text-green-400 transition-colors font-medium"
                    >
                      Admin
                    </Link>
                  )}
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2 text-gs-gray-400 hover:text-gs-white transition-colors"
                  >
                    <LogOut size={18} />
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link 
                    href="/auth/login" 
                    className="text-gs-white hover:text-gs-green transition-colors font-medium"
                  >
                    Log In
                  </Link>
                  <Link 
                    href="/auth/register" 
                    className="btn-green text-sm"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </nav>
          )}

          {/* Mobile menu button */}
          {showNav && (
            <button
              className="md:hidden p-2"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          )}
        </div>

        {/* Mobile Navigation */}
        {showNav && menuOpen && (
          <div className="md:hidden py-4 border-t border-gs-gray-800">
            <nav className="flex flex-col space-y-4">
              <Link 
                href="/book" 
                className="text-gs-white hover:text-gs-green transition-colors font-medium py-2"
                onClick={() => setMenuOpen(false)}
              >
                <Calendar className="inline mr-2" size={18} />
                Book Session
              </Link>
              {user ? (
                <>
                  <Link
                    href="/dashboard"
                    className="text-gs-white hover:text-gs-green transition-colors font-medium py-2"
                    onClick={() => setMenuOpen(false)}
                  >
                    <BarChart3 className="inline mr-2" size={18} />
                    Dashboard
                  </Link>
                  <Link
                    href="/dashboard/settings"
                    className="text-gs-white hover:text-gs-green transition-colors font-medium py-2"
                    onClick={() => setMenuOpen(false)}
                  >
                    <Settings className="inline mr-2" size={18} />
                    Settings
                  </Link>
                  {isAdmin && (
                    <Link
                      href="/admin"
                      className="text-gs-green hover:text-green-400 transition-colors font-medium py-2"
                      onClick={() => setMenuOpen(false)}
                    >
                      <User className="inline mr-2" size={18} />
                      Admin
                    </Link>
                  )}
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2 text-gs-gray-400 hover:text-gs-white transition-colors py-2"
                  >
                    <LogOut size={18} />
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link 
                    href="/auth/login" 
                    className="text-gs-white hover:text-gs-green transition-colors font-medium py-2"
                    onClick={() => setMenuOpen(false)}
                  >
                    <User className="inline mr-2" size={18} />
                    Log In
                  </Link>
                  <Link 
                    href="/auth/register" 
                    className="btn-green text-center"
                    onClick={() => setMenuOpen(false)}
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
