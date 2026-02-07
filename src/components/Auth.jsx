import React, { useState } from "react";
import { supabase } from "../lib/supabaseClient";

const Auth = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isRegistering) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert("¡Revisá tu email para confirmar el registro!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-slate-100 shadow-xl text-center">
        <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase mb-2">
          {isRegistering ? "Unirse a Vaulty" : "Entrar a la Bóveda"}
        </h2>
        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-8">
          {isRegistering ? "Crea tu cuenta gratis" : "Tus animes te esperan"}
        </p>

        <form onSubmit={handleAuth} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-400 font-medium text-sm"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Contraseña"
            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-400 font-medium text-sm"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button
            disabled={loading}
            className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl hover:bg-indigo-700 transition-all shadow-lg active:scale-95 disabled:opacity-50 uppercase text-xs tracking-widest"
          >
            {loading ? "Procesando..." : isRegistering ? "Registrarme" : "Ingresar"}
          </button>
        </form>

        <button
          onClick={() => setIsRegistering(!isRegistering)}
          className="mt-6 text-[10px] font-black text-slate-400 hover:text-indigo-600 uppercase tracking-widest transition-colors cursor-pointer"
        >
          {isRegistering ? "¿Ya tenés cuenta? Logueate" : "¿No tenés cuenta? Registrate"}
        </button>
      </div>
    </div>
  );
};

export default Auth;