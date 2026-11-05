/* Shared helpers: Supabase client, auth, nav, formatting */
const C = window.NGWX;
const sb = window.supabase.createClient(C.SUPABASE_URL, C.SUPABASE_ANON_KEY);
const FN = C.SUPABASE_URL + '/functions/v1';
const OWNER_EMAILS = ['wxiangng@hotmail.com', 'wxiangngaera@gmail.com', 'tanjc1994@hotmail.com'];

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const rm = (n) => 'RM ' + Number(n || 0).toLocaleString('en-MY', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
const billingLabel = (b) => ({ one_time: 'one-time', month: '/ month', year: '/ year' }[b] || b);
const ORD = (d) => { const n = d.getDate(); const s = n % 10 === 1 && n !== 11 ? 'st' : n % 10 === 2 && n !== 12 ? 'nd' : n % 10 === 3 && n !== 13 ? 'rd' : 'th'; return n + s; };
const fmtDate = (iso) => { if (!iso) return '—'; const d = new Date(iso); return `${ORD(d)} ${d.toLocaleString('en-GB', { month: 'short' })} ${d.getFullYear()}`; };
const toast = (m) => { const t = document.createElement('div'); t.className = 'toast'; t.textContent = m; document.body.appendChild(t); setTimeout(() => t.remove(), 2800); };
const isOwner = (user) => !!user && OWNER_EMAILS.includes((user.email || '').toLowerCase());

function renderNav(active) {
  const links = [['index.html#apps', 'Apps', 'hide-m'], ['index.html#how', 'How it works', 'hide-m'], ['index.html#faq', 'FAQ', 'hide-m'], ['account.html', 'My account', '']];
  return `<header class="nav"><div class="wrap">
    <a class="brand" href="index.html"><span class="mark">NG</span><span>${esc(C.BRAND)}<small>${esc(C.TAGLINE)}</small></span></a>
    <nav class="nav-links">${links.map(([h, t, c]) => `<a href="${h}" class="${c}">${t}</a>`).join('')}<span id="nav-owner"></span><a class="btn btn-accent btn-sm" href="https://wa.me/${C.WHATSAPP}" target="_blank" rel="noopener">WhatsApp</a></nav>
  </div></header>`;
}
function renderFooter() {
  const y = new Date().getFullYear();
  return `<footer><div class="wrap"><div class="cols">
    <div><a class="brand" href="index.html"><span class="mark">NG</span><span>${esc(C.BRAND)}<small>${esc(C.TAGLINE)}</small></span></a>
      <p class="small" style="margin-top:1rem;max-width:40ch">Ready-made web apps for Malaysian businesses — hosted, maintained and set up for you. Pay monthly, yearly or once.</p></div>
    <div><strong style="color:#fff">Browse</strong><br><br><a href="index.html#apps">All apps</a><a href="index.html#how">How it works</a><a href="index.html#faq">FAQ</a><a href="account.html">My account</a></div>
    <div><strong style="color:#fff">Contact</strong><br><br><a href="mailto:${C.EMAIL}">${C.EMAIL}</a><a href="tel:${C.PHONE.replace(/[^0-9+]/g, '')}">${C.PHONE}</a><a href="https://wa.me/${C.WHATSAPP}" target="_blank" rel="noopener">WhatsApp</a><span class="small">${esc(C.ADDRESS)}</span></div>
  </div><div class="copy">© ${y} ${esc(C.BRAND)} · Payments processed securely by Stripe (MYR)</div></div></footer>`;
}
async function mountChrome() {
  $('#nav').innerHTML = renderNav();
  $('#footer').innerHTML = renderFooter();
  const { data: { user } } = await sb.auth.getUser();
  if (isOwner(user)) $('#nav-owner').innerHTML = '<a href="admin.html" class="hide-m" style="color:var(--blue)">Admin</a>';
  return user;
}
async function callFn(name, body) {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) throw new Error('Please sign in first');
  const r = await fetch(`${FN}/${name}`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}`, apikey: C.SUPABASE_ANON_KEY }, body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || `Request failed (${r.status})`);
  return j;
}
/** Start checkout for a plan; redirects to Stripe. Sends to account.html to sign in first if needed. */
async function buyPlan(planId) {
  const { data: { user } } = await sb.auth.getUser();
  if (!user) { sessionStorage.setItem('ngwx.pendingPlan', planId); location.href = 'account.html?next=buy'; return; }
  const base = location.href.replace(/[^/]*$/, '');
  toast('Opening secure checkout…');
  try {
    const { url } = await callFn('create-checkout', { plan_id: planId, success_url: base + 'account.html?paid=1', cancel_url: base + 'account.html?cancelled=1' });
    location.href = url;
  } catch (e) { alert(e.message); }
}
window.NG = { sb, $, $$, esc, rm, billingLabel, fmtDate, toast, isOwner, mountChrome, callFn, buyPlan };
