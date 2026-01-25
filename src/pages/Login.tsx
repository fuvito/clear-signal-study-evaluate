
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { Card } from 'primereact/card'
import { Button } from 'primereact/button'
import { InputText } from 'primereact/inputtext'
import { Password } from 'primereact/password'
import { Divider } from 'primereact/divider'
import { Message } from 'primereact/message'
import { useNavigate } from 'react-router-dom'

declare global {
  interface Window {
    turnstile: {
      render: (
        element: HTMLElement | string,
        options: {
          sitekey: string
          callback?: (token: string) => void
          'expired-callback'?: () => void
          theme?: 'light' | 'dark' | 'auto'
        }
      ) => string
      remove: (widgetId: string) => void
    }
  }
}

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const turnstileRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    // Check if turnstile is loaded
    if (window.turnstile && turnstileRef.current) {
        const widgetId = window.turnstile.render(turnstileRef.current, {
            sitekey: import.meta.env.VITE_TURNSTILE_SITE_KEY || '1x00000000000000000000AA', // default dummy key
            callback: (token: string) => {
                setCaptchaToken(token)
            },
            'expired-callback': () => {
                setCaptchaToken(null)
            },
        })

        return () => {
            if (window.turnstile) {
                window.turnstile.remove(widgetId)
            }
        }
    }
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!captchaToken) {
        setError("Please complete the captcha verification")
        return
    }

    setLoading(true)
    setError(null)

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
        options: {
            captchaToken // Pass the token to Supabase if configured, or verify on backend
        }
      })

      if (authError) {
        setError(authError.message)
        return
      }

      navigate('/dashboard')
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('An unexpected error occurred')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleMagicLink = async (e: React.FormEvent) => {
      e.preventDefault()
      if (!captchaToken) {
        setError("Please complete the captcha verification")
        return
    }

      setLoading(true)
      setError(null)

      try {
        const { error: authError } = await supabase.auth.signInWithOtp({
          email,
          options: {
            captchaToken
          }
        })

        if (authError) {
          setError(authError.message)
          return
        }

        alert('Check your email for the login link!')
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message)
        } else {
          setError('An unexpected error occurred')
        }
      } finally {
        setLoading(false)
      }
    }

  return (
    <div className="flex flex-column justify-content-center align-items-center min-h-screen px-4">
      <div className="mb-4 text-center">
        <div className="text-4xl font-bold text-primary mb-2">Study Evaluate</div>
        <div className="text-600">Sign in to continue your progress</div>
      </div>
      
      <Card className="w-full md:w-30rem shadow-2 border-round-xl border-none">
        <form onSubmit={handleLogin} className="flex flex-column gap-3 p-2">
          {error && <Message severity="error" text={error} className="w-full" />}

          <div className="flex flex-column gap-2">
            <label htmlFor="email" className="font-medium text-700">Email</label>
            <InputText
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full"
            />
          </div>

          <div className="flex flex-column gap-2">
            <label htmlFor="password" className="font-medium text-700">Password</label>
            <Password
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full"
              inputClassName="w-full"
              feedback={false}
              toggleMask
            />
          </div>

          <div className="flex justify-content-center my-2" ref={turnstileRef}></div>

          <Button
            label="Sign In"
            icon="pi pi-sign-in"
            loading={loading}
            type="submit"
            disabled={!captchaToken}
            className="w-full font-bold bg-primary border-none hover:bg-indigo-400"
          />

          <Divider align="center" className="my-3">
              <span className="text-500 text-sm font-medium bg-white px-2">OR</span>
          </Divider>

          <Button
            label="Send Magic Link"
            icon="pi pi-envelope"
            outlined
            severity="secondary"
            onClick={handleMagicLink}
            loading={loading}
            type="button"
            disabled={!captchaToken}
            className="w-full text-600 border-300 hover:bg-gray-50"
          />
        </form>
      </Card>
      
      <div className="mt-4 text-center text-sm text-500">
        &copy; {new Date().getFullYear()} Clear Signal
      </div>
    </div>
  )
}
