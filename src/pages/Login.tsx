import { useState } from "react";
import type { FormEvent } from "react";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { supabase } from "../lib/supabase";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();

    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    window.location.href = "/admin";
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#080808] px-5 text-[#f2f0eb]">
      <div className="w-full max-w-md">
        <div className="mb-10 text-center">
          <h1 className="text-6xl font-black tracking-[-0.08em]">
            ØFFGRID
          </h1>

          <p className="mt-3 text-[10px] tracking-[0.4em] text-white/40">
            PRIVATE ACCESS / HQ
          </p>
        </div>

        <div className="border border-white/10 bg-[#0d0d0d] p-6 md:p-8">
          <div className="mb-8 flex items-center gap-3">
            <LockKeyhole size={18} className="text-white/50" />

            <div>
              <p className="text-xs font-bold tracking-[0.2em]">
                ADMIN LOGIN
              </p>

              <p className="mt-1 text-xs text-white/30">
                ØFFGRID headquarters
              </p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="mb-2 block text-[10px] font-bold tracking-[0.2em] text-white/40">
                EMAIL
              </label>

              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="h-14 w-full border border-white/10 bg-transparent px-4 text-sm outline-none transition focus:border-white/40"
              />
            </div>

            <div>
              <label className="mb-2 block text-[10px] font-bold tracking-[0.2em] text-white/40">
                PASSWORD
              </label>

              <input
                type="password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                className="h-14 w-full border border-white/10 bg-transparent px-4 text-sm outline-none transition focus:border-white/40"
              />
            </div>

            {error && (
              <div className="border border-red-500/20 bg-red-500/5 p-4 text-xs text-red-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex h-14 w-full items-center justify-center gap-2 bg-[#f2f0eb] text-sm font-black text-black transition hover:bg-white disabled:opacity-50"
            >
              {loading ? (
                "AUTHENTICATING..."
              ) : (
                <>
                  ENTER HQ
                  <ArrowRight size={17} />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-[9px] tracking-[0.25em] text-white/20">
          ØFFGRID — INTERNAL USE ONLY
        </p>
      </div>
    </main>
  );
}

export default Login;