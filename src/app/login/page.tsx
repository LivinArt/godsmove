'use client';

import { useActionState, Suspense } from 'react';
import { login } from './actions';
import { useSearchParams } from 'next/navigation';
import { ArrowRight, Hexagon } from 'lucide-react';
import { Plus_Jakarta_Sans } from 'next/font/google';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'] });

const initialState = { error: null as string | null };

function LoginForm() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/admin';
  const [state, formAction, isPending] = useActionState(login, initialState);

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="redirectTo" value={redirectTo} />

      {state?.error && (
        <div className="p-4 text-sm font-medium text-red-400 bg-red-950/30 border border-red-900/50 rounded-lg">
          {state.error}
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
          System ID (Email)
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="appearance-none block w-full px-4 py-3 bg-[#0a0a0a] border border-white/10 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all text-sm"
          placeholder="admin@godsmove.com"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
          Access Token (Password)
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="appearance-none block w-full px-4 py-3 bg-[#0a0a0a] border border-white/10 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all text-sm"
          placeholder="••••••••"
        />
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="group relative w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg text-sm font-bold text-black bg-white hover:bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white focus:ring-offset-[#0a0a0a] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isPending ? 'Authenticating...' : 'Initialize Session'}
          {!isPending && (
            <ArrowRight className="ml-2 w-4 h-4 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
          )}
        </button>
      </div>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className={`min-h-screen bg-[#050505] flex flex-col justify-center py-12 sm:px-6 lg:px-8 ${jakarta.className}`}>
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-8">
          <div className="h-14 w-14 bg-white flex items-center justify-center rounded-sm rotate-45">
            <div className="-rotate-45">
              <Hexagon className="w-8 h-8 text-black" fill="currentColor" />
            </div>
          </div>
        </div>
        <h2 className="text-center text-2xl font-extrabold text-white tracking-tight">
          GODSMOVE
        </h2>
        <p className="mt-2 text-center text-sm font-medium text-zinc-500 uppercase tracking-widest">
          Authorized access only.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-[#111] py-10 px-4 shadow-2xl shadow-black sm:rounded-2xl sm:px-10 border border-white/5">
          <Suspense fallback={<div className="text-zinc-500 text-center text-sm">Loading security protocols...</div>}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
