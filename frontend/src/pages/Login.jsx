import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

const DEPARTMENTS = ['Computer Engineering', 'Information Technology', 'AIML', 'Mechanical', 'Civil']
const DIVISIONS = ['A', 'B', 'C']
const BATCH_NUMBERS = [1, 2, 3]

function Login() {
  const [mode, setMode] = useState('login') // 'login' | 'register' | 'verify'
  const { login } = useAuth()
  const navigate = useNavigate()

  // Login state
  const [moodleId, setMoodleId] = useState('')
  const [password, setPassword] = useState('')

  // Register state
  const [regName, setRegName] = useState('')
  const [regMoodleId, setRegMoodleId] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regConfirm, setRegConfirm] = useState('')
  const [regDepartment, setRegDepartment] = useState('')
  const [regDivision, setRegDivision] = useState('')
  const [regBatch, setRegBatch] = useState('')
  const batchLabel = regDivision && regBatch ? `${regDivision}${regBatch}` : ''

  // Verification state
  const [verifyMoodleId, setVerifyMoodleId] = useState('')
  const [otp, setOtp] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)

  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  // Countdown for resend button
  useEffect(() => {
    if (resendCooldown <= 0) return
    const t = setTimeout(() => setResendCooldown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [resendCooldown])

  async function handleLogin(e) {
    e.preventDefault()
    setError('')
    setMessage('')
    try {
      const res = await api.post('/auth/login', { moodleId, password })
      login(res.data.user, res.data.token)
      navigate('/announcements')
    } catch (err) {
      if (err.response?.data?.unverified) {
        setVerifyMoodleId(moodleId)
        setOtp('')
        setMode('verify')
        setError('')
        setMessage('Your email is not verified yet. Enter the code sent to your email, or request a new one below.')
      } else {
        setError(err.response?.data?.error || 'Login failed')
      }
    }
  }

  async function handleRegister(e) {
    e.preventDefault()
    setError('')
    setMessage('')
    if (regPassword !== regConfirm) {
      setError('Passwords do not match')
      return
    }
    try {
      await api.post('/auth/register', {
        name: regName,
        moodleId: regMoodleId,
        password: regPassword,
        department: regDepartment,
        division: regDivision,
        batch: batchLabel,
      })
      setVerifyMoodleId(regMoodleId)
      setOtp('')
      setMode('verify')
      setMessage('')
      setResendCooldown(30)
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed')
    }
  }

  async function handleVerifyOtp(e) {
    e.preventDefault()
    setError('')
    setMessage('')
    try {
      await api.post('/auth/verify-otp', { moodleId: verifyMoodleId, otp })
      switchMode('login')
      setMessage('Email verified! You can now sign in.')
    } catch (err) {
      setError(err.response?.data?.error || 'Verification failed')
    }
  }

  async function handleResendOtp() {
    if (resendCooldown > 0) return
    setError('')
    setMessage('')
    try {
      await api.post('/auth/resend-otp', { moodleId: verifyMoodleId })
      setMessage('A new code has been sent to your email.')
      setResendCooldown(30)
    } catch (err) {
      setError(err.response?.data?.error || 'Could not resend code')
    }
  }

  function switchMode(next) {
    setMode(next)
    setError('')
    setMessage('')
    setOtp('')
  }

  const selectClass = "mt-1.5 w-full border-b border-gray-200 py-2 text-sm text-gray-900 focus:outline-none focus:border-gray-900 transition-colors bg-transparent"
  const inputClass = "mt-1.5 w-full border-b border-gray-200 py-2 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:border-gray-900 transition-colors bg-transparent"
  const labelClass = "text-xs text-gray-400 uppercase tracking-wider"

  return (
    <div className="min-h-screen bg-white flex justify-center py-16">
      <div className="w-full max-w-sm px-6">

        <div className="mb-10">
          <h1 className="text-sm font-bold tracking-widest text-gray-900 uppercase mb-1">Nexus – ARU</h1>
          <p className="text-gray-400 text-sm">A Network for Academic Resources & Updates</p>
        </div>

        {/* Tabs */}
        {mode !== 'verify' && (
          <div className="flex gap-6 mb-8 border-b border-gray-100">
            {['login', 'register'].map(m => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                className={`pb-3 text-sm transition-colors border-b-2 -mb-px ${
                  mode === m
                    ? 'text-gray-900 font-medium border-gray-900'
                    : 'text-gray-400 hover:text-gray-900 border-transparent'
                }`}
              >
                {m === 'login' ? 'Sign In' : 'Register'}
              </button>
            ))}
          </div>
        )}

        {/* Login */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            <div>
              <label className={labelClass}>Moodle ID</label>
              <input type="number" value={moodleId} onChange={e => setMoodleId(e.target.value)} placeholder="e.g. 23106093" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className={inputClass} />
            </div>
            {error && <p className="text-red-500 text-xs">{error}</p>}
            <button type="submit" className="mt-2 w-full bg-gray-900 hover:bg-gray-700 text-white font-medium py-2.5 text-sm transition-colors">
              Sign In
            </button>
          </form>
        )}

        {/* Register */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} className="flex flex-col gap-5">
            <div>
              <label className={labelClass}>Full Name</label>
              <input type="text" value={regName} onChange={e => setRegName(e.target.value)} placeholder="e.g. John Doe" required className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Moodle ID</label>
              <input type="number" value={regMoodleId} onChange={e => setRegMoodleId(e.target.value)} placeholder="e.g. 23106093" required className={inputClass} />
              {regMoodleId && (
                <p className="mt-1 text-xs text-gray-400">
                  Verification code will be sent to {regMoodleId}@apsit.edu.in
                </p>
              )}
            </div>
            <div>
              <label className={labelClass}>Department</label>
              <select value={regDepartment} onChange={e => setRegDepartment(e.target.value)} required className={selectClass}>
                <option value="">Select department</option>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className={labelClass}>Division</label>
                <select value={regDivision} onChange={e => setRegDivision(e.target.value)} required className={selectClass}>
                  <option value="">Division</option>
                  {DIVISIONS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="flex-1">
                <label className={labelClass}>Batch</label>
                <select value={regBatch} onChange={e => setRegBatch(parseInt(e.target.value))} required className={selectClass}>
                  <option value="">Batch</option>
                  {BATCH_NUMBERS.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className={labelClass}>Password</label>
              <input type="password" value={regPassword} onChange={e => setRegPassword(e.target.value)} placeholder="••••••••" required className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Confirm Password</label>
              <input type="password" value={regConfirm} onChange={e => setRegConfirm(e.target.value)} placeholder="••••••••" required className={inputClass} />
            </div>
            {error && <p className="text-red-500 text-xs">{error}</p>}
            {message && <p className="text-green-600 text-xs">{message}</p>}
            <button type="submit" className="mt-2 w-full bg-gray-900 hover:bg-gray-700 text-white font-medium py-2.5 text-sm transition-colors">
              Create Account
            </button>
          </form>
        )}

        {/* Verify OTP */}
        {mode === 'verify' && (
          <form onSubmit={handleVerifyOtp} className="flex flex-col gap-5">
            <div>
              <p className="text-sm text-gray-600 mb-1">
                Enter the 6-digit code sent to
              </p>
              <p className="text-sm font-medium text-gray-900">{verifyMoodleId}@apsit.edu.in</p>
            </div>
            <div>
              <label className={labelClass}>Verification Code</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                required
                className={inputClass}
              />
            </div>
            {error && <p className="text-red-500 text-xs">{error}</p>}
            {message && <p className="text-green-600 text-xs">{message}</p>}
            <button type="submit" className="mt-2 w-full bg-gray-900 hover:bg-gray-700 text-white font-medium py-2.5 text-sm transition-colors">
              Verify & Continue
            </button>
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resendCooldown > 0}
                className="text-xs text-gray-400 hover:text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend code'}
              </button>
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="text-xs text-gray-400 hover:text-gray-900 transition-colors"
              >
                Back to Sign In
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  )
}

export default Login