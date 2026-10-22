// דו-קרב: מוצאים יריב שמחכה באותה זירה ומשחקים בזמן אמת.
// עם Supabase השחקנים נפגשים דרך Realtime (presence + broadcast).
// בלי Supabase הדו-קרב עובד בין לשוניות באותו דפדפן (BroadcastChannel), ואפשר גם לשחק נגד המחשב.
(function () {
  const db = window.TeireDB;

  function supabaseTransport(room, onPeers, onMsg) {
    const sb = db.realtime;
    let ch = null;
    return {
      kind: "online",
      join(meta) {
        ch = sb.channel("teire-duel-" + room, { config: { presence: { key: meta.id }, broadcast: { self: false } } });
        ch.on("presence", { event: "sync" }, () => {
          const st = ch.presenceState();
          onPeers(Object.values(st).map(list => list[list.length - 1]));
        });
        ch.on("broadcast", { event: "m" }, ({ payload }) => onMsg(payload));
        ch.subscribe(status => { if (status === "SUBSCRIBED") ch.track(meta); });
      },
      update(meta) { if (ch) ch.track(meta); },
      send(payload) { if (ch) ch.send({ type: "broadcast", event: "m", payload }); },
      close() { if (ch) { sb.removeChannel(ch); ch = null; } },
    };
  }

  function localTransport(room, onPeers, onMsg) {
    let bc = null, timer = null, me = null;
    const peers = {};
    const emit = () => onPeers(Object.values(peers).map(p => p.meta));
    function prune() {
      const now = Date.now();
      let changed = false;
      Object.keys(peers).forEach(id => { if (id !== me.id && now - peers[id].seen > 4500) { delete peers[id]; changed = true; } });
      if (changed) emit();
    }
    return {
      kind: "local",
      join(meta) {
        me = meta;
        peers[me.id] = { meta, seen: Date.now() };
        bc = new BroadcastChannel("teire-duel-" + room);
        bc.onmessage = ev => {
          const m = ev.data;
          if (m.t === "hb") { const isNew = !peers[m.meta.id] || JSON.stringify(peers[m.meta.id].meta) !== JSON.stringify(m.meta); peers[m.meta.id] = { meta: m.meta, seen: Date.now() }; if (isNew) emit(); }
          else if (m.t === "bye" && m.id !== me.id) { delete peers[m.id]; emit(); }
          else if (m.t === "m") onMsg(m.payload);
        };
        const beat = () => { bc.postMessage({ t: "hb", meta: me }); prune(); };
        beat();
        timer = setInterval(beat, 1500);
        emit();
      },
      update(meta) { me = meta; peers[me.id] = { meta, seen: Date.now() }; if (bc) bc.postMessage({ t: "hb", meta }); emit(); },
      send(payload) { if (bc) bc.postMessage({ t: "m", payload }); },
      close() { if (bc) { bc.postMessage({ t: "bye", id: me.id }); bc.close(); bc = null; } clearInterval(timer); },
    };
  }

  // לובי: מצטרפים לזירה, ומתאימים בין שני השחקנים הראשונים שמחכים.
  // h = { onWaiting(count), onStart({ opponent, questions, send }), onMsg(msg), onOpponentLeft(), makeQuestions() }
  function lobby(room, meInfo, h) {
    let meta = { ...meInfo, id: meInfo.id, ts: Date.now(), state: "waiting" };
    let match = null;
    const t = (db.realtime ? supabaseTransport : localTransport)(room, onPeers, onMsg);

    function startMatch(matchId, opponent, questions) {
      match = { id: matchId, opponent };
      meta = { ...meta, state: "playing" };
      t.update(meta);
      h.onStart({ opponent, questions, send: payload => t.send({ ...payload, matchId, from: meta.id }) });
    }

    function onPeers(list) {
      if (match) {
        if (!list.some(p => p.id === match.opponent.id)) h.onOpponentLeft();
        return;
      }
      const waiting = list.filter(p => p.state === "waiting").sort((a, b) => a.ts - b.ts || (a.id < b.id ? -1 : 1));
      h.onWaiting(waiting.filter(p => p.id !== meta.id).length);
      for (let i = 0; i + 1 < waiting.length; i += 2) {
        const [host, guest] = [waiting[i], waiting[i + 1]];
        if (host.id === meta.id) {
          const matchId = meta.id + "-" + Date.now();
          const questions = h.makeQuestions();
          t.send({ t: "start", matchId, host: meta, guest, questions });
          startMatch(matchId, guest, questions);
        }
      }
    }

    function onMsg(m) {
      if (m.t === "start" && !match && m.guest.id === meta.id) return startMatch(m.matchId, m.host, m.questions);
      if (match && m.matchId === match.id && m.from === match.opponent.id) h.onMsg(m);
    }

    t.join(meta);
    return { kind: t.kind, close: () => t.close() };
  }

  // יריב ממוחשב: עונה נכון ברוב הפעמים, אחרי כמה שניות
  function bot(questions, onMsg) {
    const timers = [];
    return {
      opponent: { id: "bot", name: "ינשופי (מחשב)", bot: true },
      ask(qi) {
        const q = questions[qi];
        const ms = 2500 + Math.random() * 7000;
        const choice = Math.random() < .7 ? q.correct : [0, 1, 2, 3].filter(x => x !== q.correct)[Math.floor(Math.random() * 3)];
        timers.push(setTimeout(() => onMsg({ t: "ans", q: qi, choice, ms }), ms));
      },
      close() { timers.forEach(clearTimeout); },
    };
  }

  // ערוץ משותף לכל מי שבאותו חדר (משמש גם לשחקנים שהולכים באותה עיירה)
  const transport = (room, onPeers, onMsg) => (db.realtime ? supabaseTransport : localTransport)(room, onPeers, onMsg);
  window.TeireDuel = { lobby, bot, transport };
})();
