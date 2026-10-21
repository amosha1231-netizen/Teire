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

  // השאלות המובנות נקראות תמיד מ-content/torah.js, כך שתיקון שם מגיע לכולם.
  // ממסד הנתונים לוקחים רק שאלות שגולשים הציעו ומנהל אישר. (העותקים הישנים של השאלות המובנות שם מסומנים "צוות האתר" ומדולגים.)
  const SITE = "צוות האתר";
  const builtIn = place => window.TEIRE_SEED.map((q, i) => ({ ...q, id: "seed-" + i, status: "approved", author_name: SITE }))
    .filter(q => !place || q.place === place);
  const fromUsers = list => (list || []).filter(q => q.author_name !== SITE);

  // ---------- מצב מקומי ----------
  const LS_KEY = "teire.questions.v2";
  const local = {
    mode: "local",
    _all() {
      try {
        const raw = localStorage.getItem(LS_KEY);
        if (raw) return fromUsers(JSON.parse(raw));
      } catch (e) { /* ignore */ }
      return [];
    },
    _save(list) {
      try { localStorage.setItem(LS_KEY, JSON.stringify(list)); } catch (e) { /* ignore */ }
    },
    async approved(place) {
      return builtIn(place).concat(this._all().filter(q => q.status === "approved" && (!place || q.place === place)));
    },
    async counts() {
      const c = {};
      (await this.approved()).forEach(q => { c[q.place] = (c[q.place] || 0) + 1; });
      return c;
    },
    async submit(q) {
      const list = this._all();
      const id = list.reduce((m, x) => Math.max(m, x.id), 0) + 1;
      list.push({ ...q, id, status: "pending", created_at: new Date().toISOString() });
      this._save(list);
    },
    async pending() { return this._all().filter(q => q.status === "pending"); },
    async allApproved() { return this._all().filter(q => q.status === "approved").reverse(); },
    async remove(id) { this._save(this._all().filter(q => q.id !== id)); },
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
    // טבלת האלופים צריכה שרת משותף, אז במצב מקומי היא לא זמינה
    async leaderboard() { return null; },
    async submitScore() {},
    async leaveBoard() {},
  };

  // ---------- מצב Supabase ----------
  const OLD_PLACES = ["gan-eden", "teiva", "ohel", "mitzrayim", "sinai", "midbar", "beit-midrash", "beit-knesset"];
  // שגיאה שאומרת שמסד הנתונים עוד לא קיבל את עדכון 2 (אין עמודת level, או שהתחנה לא מותרת)
  const needsUpdate = e => /level|questions_place_check|PGRST204|42703/.test((e.message || "") + " " + (e.code || ""));
  let sb = null;
  const remote = {
    mode: "supabase",
    async approved(place) {
      let query = sb.from("questions").select("*").eq("status", "approved");
      if (place) query = query.eq("place", place);
      const { data, error } = await query;
      if (error) {
        // מסד הנתונים עוד לא הוקם או לא זמין: משחקים עם השאלות המובנות
        console.warn("Supabase לא זמין, משתמשים בשאלות המובנות", error);
        return builtIn(place);
      }
      return builtIn(place).concat(fromUsers(data));
    },
    async allApproved() {
      const { data, error } = await sb.from("questions").select("*").eq("status", "approved").order("created_at", { ascending: false });
      if (error) throw error;
      return fromUsers(data);
    },
    async remove(id) {
      const { error } = await sb.from("questions").delete().eq("id", id);
      if (error) throw error;
    },
    async counts() {
      const { data, error } = await sb.from("questions").select("place, author_name").eq("status", "approved");
      if (error) throw error;
      const c = {};
      builtIn().concat(fromUsers(data)).forEach(q => { c[q.place] = (c[q.place] || 0) + 1; });
      return c;
    },
    async submit(q) {
      // בלי select: משתמש אנונימי לא רשאי לקרוא שאלות שממתינות לאישור
      let { error } = await sb.from("questions").insert({ ...q, status: "pending" });
      if (error && needsUpdate(error)) {
        // מסד הנתונים עוד בלי עדכון 2: שאלה רגילה לשלב 1 עוברת גם בלי השדה level
        if ((q.level || 1) === 1 && OLD_PLACES.includes(q.place)) {
          const { level, ...rest } = q;
          ({ error } = await sb.from("questions").insert({ ...rest, status: "pending" }));
        } else throw new Error("כדי להציע שאלות לשלבים קשים, לתחנות החדשות או לכוללים, המנהל צריך להריץ את הקובץ supabase/update-2.sql ב-Supabase.");
      }
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
      if (error && needsUpdate(error)) throw new Error("כדי לשמור שלב או תחנה חדשה צריך להריץ את הקובץ supabase/update-2.sql ב-Supabase.");
      if (error) throw error;
    },
    // ---- טבלת האלופים ----
    async leaderboard() {
      const { data, error } = await sb.rpc("get_leaderboard");
      if (error) { console.warn("טבלת האלופים לא זמינה", error); return null; }
      return data;
    },
    async submitScore(id, name, stars, souls) {
      const { error } = await sb.rpc("submit_score", { p_id: id, p_name: name, p_stars: stars, p_souls: souls });
      if (error) console.warn("עדכון הטבלה נכשל", error);
    },
    async leaveBoard(id) {
      const { error } = await sb.rpc("leave_board", { p_id: id });
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
