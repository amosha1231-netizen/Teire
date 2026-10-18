// שכבת הנתונים: Supabase כשמוגדר, אחרת שמירה מקומית בדפדפן (localStorage).
(function () {
  const cfg = window.TEIRE_CONFIG;
  const useSupabase = !!(cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY && window.supabase);

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // ---------- מצב מקומי ----------
  const LS_KEY = "teire.questions.v2";
  const local = {
    mode: "local",
    _all() {
      try {
        const raw = localStorage.getItem(LS_KEY);
        if (raw) return JSON.parse(raw);
      } catch (e) { /* ignore */ }
      const seeded = window.TEIRE_SEED.map((q, i) => ({ ...q, id: i + 1, status: "approved", author_name: "צוות האתר" }));
      this._save(seeded);
      return seeded;
    },
    _save(list) {
      try { localStorage.setItem(LS_KEY, JSON.stringify(list)); } catch (e) { /* ignore */ }
    },
    async approved(place) {
      return this._all().filter(q => q.status === "approved" && (!place || q.place === place));
    },
    async counts() {
      const c = {};
      this._all().filter(q => q.status === "approved").forEach(q => { c[q.place] = (c[q.place] || 0) + 1; });
      return c;
    },
    async submit(q) {
      const list = this._all();
      const id = list.reduce((m, x) => Math.max(m, x.id), 0) + 1;
      list.push({ ...q, id, status: "pending", created_at: new Date().toISOString() });
      this._save(list);
    },
    async pending() { return this._all().filter(q => q.status === "pending"); },
    async setStatus(id, status) {
      const list = this._all();
      const q = list.find(x => x.id === id);
      if (q) q.status = status;
      this._save(list);
    },
    async update(id, fields) {
      const list = this._all();
      const q = list.find(x => x.id === id);
      if (q) Object.assign(q, fields);
      this._save(list);
    },
    // כניסת מנהל מקומית עם קוד
    _admin: sessionStorage.getItem("teire.admin") === "1",
    async isAdmin() { return this._admin; },
    async login(_email, pin) {
      if (pin !== cfg.LOCAL_ADMIN_PIN) throw new Error("קוד שגוי");
      this._admin = true; sessionStorage.setItem("teire.admin", "1");
    },
    async logout() { this._admin = false; sessionStorage.removeItem("teire.admin"); },
  };

  // ---------- מצב Supabase ----------
  let sb = null;
  const remote = {
    mode: "supabase",
    async approved(place) {
      let query = sb.from("questions").select("*").eq("status", "approved");
      if (place) query = query.eq("place", place);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    async counts() {
      const { data, error } = await sb.from("questions").select("place").eq("status", "approved");
      if (error) throw error;
      const c = {};
      data.forEach(q => { c[q.place] = (c[q.place] || 0) + 1; });
      return c;
    },
    async submit(q) {
      // בלי select: משתמש אנונימי לא רשאי לקרוא שאלות שממתינות לאישור
      const { error } = await sb.from("questions").insert({ ...q, status: "pending" });
      if (error) throw error;
    },
    async pending() {
      const { data, error } = await sb.from("questions").select("*").eq("status", "pending").order("created_at");
      if (error) throw error;
      return data;
    },
    async setStatus(id, status) {
      const { error } = await sb.from("questions").update({ status }).eq("id", id);
      if (error) throw error;
    },
    async update(id, fields) {
      const { error } = await sb.from("questions").update(fields).eq("id", id);
      if (error) throw error;
    },
    async isAdmin() {
      const { data: { session } } = await sb.auth.getSession();
      if (!session) return false;
      const { data } = await sb.from("admins").select("email").eq("email", session.user.email);
      return !!(data && data.length);
    },
    async login(email, password) {
      const { error } = await sb.auth.signInWithPassword({ email, password });
      if (error) throw new Error("אימייל או סיסמה שגויים");
      if (!(await this.isAdmin())) {
        await sb.auth.signOut();
        throw new Error("המשתמש הזה אינו מוגדר כמנהל");
      }
    },
    async logout() { await sb.auth.signOut(); },
  };

  if (useSupabase) sb = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
  window.TeireDB = useSupabase ? remote : local;
  window.TeireDB.shuffle = shuffle;
  window.TeireDB.realtime = sb; // לדו-קרב בזמן אמת (null במצב מקומי)
})();
