"use client";

import { FormEvent, useEffect, useState } from "react";
import { Member, SessionUser } from "@/lib/types";

type Stats = { total: number; withPhotos: number; withoutPhotos: number; representatives: number };
const emptyForm = { regNumber: "", firstname: "", lastname: "", role: "MEMBER", image: null as string | null };

export default function Home() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, withPhotos: 0, withoutPhotos: 0, representatives: 0 });
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState<number | null>(null);
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [loginType, setLoginType] = useState<"member" | "representative">("member");

  const load = async () => {
    const response = await fetch(`/api/members?search=${encodeURIComponent(search)}&role=${encodeURIComponent(role)}`);
    if (response.ok) {
      const data = await response.json();
      setMembers(data.members);
      setStats(data.stats);
    }
    setLoading(false);
  };
  useEffect(() => { fetch("/api/auth/me").then((r) => r.json()).then((d) => { setUser(d.user); if (d.user) load(); else setLoading(false); }); }, []);
  useEffect(() => { if (user) { const timer = setTimeout(load, 250); return () => clearTimeout(timer); } }, [search, role, user]);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = Object.fromEntries(new FormData(event.currentTarget));
    const data = { ...formData, loginType };
    const response = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    const result = await response.json();
    if (!response.ok) return setNotice(result.error);
    setUser(result.user); setNotice(""); load();
  }
  async function save(event: FormEvent) {
    event.preventDefault();
    const response = await fetch(editing ? `/api/members/${editing}` : "/api/members", { method: editing ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const result = await response.json();
    if (!response.ok) return setNotice(result.error);
    setForm(emptyForm); setEditing(null); setNotice(editing ? "Member updated." : "Member added."); load();
  }
  async function remove(id: number) {
    if (!confirm("Delete this member permanently?")) return;
    const response = await fetch(`/api/members/${id}`, { method: "DELETE" });
    if (!response.ok) setNotice((await response.json()).error); else { setNotice("Member deleted."); load(); }
  }
  async function upload(file: File) {
    const data = new FormData(); data.append("file", file);
    const response = await fetch("/api/upload", { method: "POST", body: data });
    const result = await response.json();
    if (!response.ok) return setNotice(result.error);
    setForm((current) => ({ ...current, image: result.url })); setNotice("Photo ready to save.");
  }
  if (loading) return <main className="center"><span className="spinner" /> Loading workspace…</main>;
  if (!user) return <main className="login-shell"><section className="login-card"><div className="brand">CM<span>+</span></div><p className="eyebrow">Y3 IT Class A</p><h1>{loginType === "representative" ? "Representative sign in" : "Member sign in"}</h1><p className="muted">{loginType === "representative" ? "Secure access for CP and CEPINE." : "View the class directory with your registration number."}</p><div className="login-switch" role="tablist"><button type="button" className={loginType === "member" ? "selected" : ""} onClick={() => { setLoginType("member"); setNotice(""); }}>Members</button><button type="button" className={loginType === "representative" ? "selected" : ""} onClick={() => { setLoginType("representative"); setNotice(""); }}>CP / CEPINE</button></div><form onSubmit={login} className="stack"><label>{loginType === "representative" ? "Phone number" : "Registration number"}<input name="identifier" type={loginType === "representative" ? "tel" : "text"} inputMode={loginType === "representative" ? "tel" : "text"} autoComplete="username" placeholder={loginType === "representative" ? "0786718716" : "e.g. 24RP12420"} required /></label><label>Password<input name="password" type="password" autoComplete="current-password" minLength={8} required /></label><button className="primary">{loginType === "representative" ? "Open admin dashboard" : "Sign in"}</button>{notice && <p className="error">{notice}</p>}</form></section></main>;

  const admin = user.role === "CP" || user.role === "CEPINE";
  return <main className="app-shell">
    <aside className="sidebar"><div className="brand">CM<span>+</span></div><div className="profile-mini"><div className="avatar">{user.firstname[0]}</div><div><strong>{user.firstname} {user.lastname}</strong><small>{user.role}</small></div></div><nav><button className="active">Dashboard</button><button>Class Directory</button>{admin && <><button onClick={() => document.getElementById("member-form")?.scrollIntoView()}>Add Member</button><button>Manage Members</button></>}</nav><button className="logout" onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }); location.reload(); }}>Log out</button></aside>
    <section className="content"><header><div><p className="eyebrow">{admin ? (user.role === "CP" ? "Class Representative" : "Assistant Class Representative") : "Class community"}</p><h1>{admin ? `${user.role === "CP" ? "Class Representative" : "Assistant Class Representative"} Dashboard` : "Class Members Dashboard"}</h1></div><button className="theme" onClick={() => document.documentElement.classList.toggle("dark")}>◐</button></header>
      {notice && <div className="notice">{notice}</div>}<section className="stats"><Stat title="Total members" value={stats.total} /><Stat title="With photos" value={stats.withPhotos} /><Stat title="Without photos" value={stats.withoutPhotos} /><Stat title="Representatives" value={stats.representatives} /></section>
      {admin && <form id="member-form" className="panel member-form" onSubmit={save}><div className="panel-heading"><div><p className="eyebrow">{editing ? "Edit record" : "New record"}</p><h2>{editing ? "Update member" : "Add a member"}</h2></div>{editing && <button type="button" onClick={() => { setEditing(null); setForm(emptyForm); }}>Cancel</button>}</div><div className="form-grid"><label>Registration number<input value={form.regNumber} onChange={e => setForm({...form, regNumber:e.target.value})} required /></label><label>First name<input value={form.firstname} onChange={e => setForm({...form, firstname:e.target.value})} required /></label><label>Last name<input value={form.lastname} onChange={e => setForm({...form, lastname:e.target.value})} required /></label><label>Class role<select value={form.role} onChange={e => setForm({...form, role:e.target.value})}><option>MEMBER</option><option>CP</option><option>CEPINE</option></select></label><label>Profile photo<input type="file" accept="image/*" onChange={e => e.target.files?.[0] && upload(e.target.files[0])} />{form.image && <button type="button" className="link danger" onClick={() => setForm({...form, image:null})}>Remove current photo</button>}</label></div><button className="primary" type="submit">{editing ? "Save changes" : "Create member"}</button></form>}
      <section className="panel"><div className="panel-heading"><div><p className="eyebrow">Directory</p><h2>All class members</h2></div><div className="filters"><input placeholder="Search name or registration…" value={search} onChange={e => setSearch(e.target.value)} /><select value={role} onChange={e => setRole(e.target.value)}><option value="">All roles</option><option>CP</option><option>CEPINE</option><option>MEMBER</option></select></div></div><div className="table-wrap"><table><thead><tr><th>Member</th><th>Registration</th><th>Role</th><th>Updated</th>{admin && <th>Actions</th>}</tr></thead><tbody>{members.map(member => <tr key={member.id}><td><div className="member-cell"><div className="avatar">{member.image ? <img src={member.image} alt="" /> : member.firstname[0]}</div><span><strong>{member.firstname} {member.lastname}</strong><small>{member.role === "CP" || member.role === "CEPINE" ? "Class leadership" : "Class member"}</small></span></div></td><td>{member.regNumber}</td><td><span className={`badge ${member.role.toLowerCase()}`}>{member.role}</span></td><td>{new Date(member.updatedAt).toLocaleDateString()}</td>{admin && <td><button className="link" onClick={() => { setEditing(member.id); setForm({regNumber:member.regNumber, firstname:member.firstname, lastname:member.lastname, role:member.role, image:member.image}); }}>Edit</button><button className="link danger" onClick={() => remove(member.id)}>Delete</button></td>}</tr>)}</tbody></table>{!members.length && <p className="empty">No members match your search.</p>}</div></section>
    </section></main>;
}
function Stat({ title, value }: { title: string; value: number }) { return <div className="stat"><span>{title}</span><strong>{value}</strong><i>↗</i></div>; }
