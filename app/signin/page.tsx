"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function SigninPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.ok) {
      router.push("/dashboard");
      router.refresh();
    } else {
      setError("Email atau password salah.");
    }
  }

  return (
    <div className="container-xxl">
      <div className="authentication-wrapper authentication-basic container-p-y py-4">
        <div className="authentication-inner">
          <div className="card">
            <div className="card-body">
              <div className="app-brand justify-content-center mb-4">
                <a href="/dashboard" className="app-brand-link gap-2">
                  <span className="app-brand-logo demo">
                    <span className="text-primary fw-bold fs-2">M</span>
                  </span>
                  <span className="app-brand-text demo text-body fw-bold fs-4">MBKM 2026 UDB</span>
                </a>
              </div>
              <h4 className="mb-2">Selamat Datang! 👋</h4>
              <p className="mb-4">Silakan masuk ke akun pembimbing MBKM Anda.</p>

              <form onSubmit={handleSubmit} className="mb-3">
                <div className="mb-3 form-password-toggle">
                  <label className="form-label" htmlFor="email">Email</label>
                  <div className="input-group input-group-merge">
                    <span className="input-group-text"><i className="bx bx-user" /></span>
                    <input
                      id="email"
                      type="email"
                      className="form-control"
                      placeholder="nama@udb.ac.id"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>
                </div>
                <div className="mb-3 form-password-toggle">
                  <div className="d-flex justify-content-between">
                    <label className="form-label" htmlFor="password">Password</label>
                  </div>
                  <div className="input-group input-group-merge">
                    <span className="input-group-text"><i className="bx bx-lock-alt" /></span>
                    <input
                      id="password"
                      type="password"
                      className="form-control"
                      placeholder="&#183;&#183;&#183;&#183;&#183;&#183;&#183;&#183;"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <span className="input-group-text cursor-pointer"><i className="bx bx-hide" /></span>
                  </div>
                </div>
                {error && <div className="alert alert-danger py-2">{error}</div>}
                <div className="mb-3">
                  <button className="btn btn-primary d-grid w-100" type="submit" disabled={loading}>
                    {loading ? "Memproses…" : "Masuk"}
                  </button>
                </div>
              </form>

              <p className="text-center mb-0">
                <span className="text-muted">Universitas Duta Bangsa — TA 2026/2027</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
