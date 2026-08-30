import React, { useState, useEffect, useCallback, useRef } from "react";
import * as XLSX from "xlsx";
import { supabase } from "./supabaseClient";
import { Calendar, MessageSquare, CheckSquare, Users, Plus, X, AlertTriangle, ChevronLeft, ChevronRight, Check, Trash2, User, Repeat, Clock, Lock, Unlock, Wine, Search, MapPin, Grape, UtensilsCrossed, Package, Tag, Barcode, Pencil, Percent, Bell, Phone, ScanLine, CameraOff, Crown, ClipboardList, FileText, FileSpreadsheet, Printer, Home, TrendingUp, CalendarDays, History, ArrowLeftRight, Tags, Settings, UserPlus } from "lucide-react";

const RAYONS = [
  "Apéros",
  "Asiatique",
  "Bocaux",
  "C1",
  "C2",
  "C3",
  "C4",
  "C5",
  "C6",
  "C7",
  "C8",
  "C9",
  "Cafés",
  "Cave",
  "Chips",
  "Confitures",
  "Épices",
  "Frigo",
  "Fruits secs",
  "Gâteaux",
  "Général",
  "Pâtes",
  "Podium",
  "PPI",
  "Riz",
  "Sauces tomates",
  "Secs",
  "Stand",
  "TG1",
  "TG2",
  "Thons",
];

const JOURS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

const ROLES = ["Employé", "Second", "Chef"];

const COLORS = {
  vert: "#FF385C",
  vertClair: "#00A699",
  creme: "#F7F7F7",
  ardoise: "#222222",
  moutarde: "#FFB400",
  tomate: "#C1291E",
  card: "#FFFFFF",
};

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

async function hashPassword(pwd) {
  const enc = new TextEncoder().encode(pwd);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function getWeekStart(offset = 0) {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - (day === 0 ? 6 : day - 1) + offset * 7;
  const monday = new Date(now.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function fmtDate(d) {
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

async function storageGet(key, shared) {
  try {
    if (!shared) {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    }
    const { data, error } = await supabase.from("app_data").select("value").eq("key", key).maybeSingle();
    if (error || !data) return null;
    return data.value;
  } catch {
    return null;
  }
}
async function storageSet(key, value, shared) {
  try {
    if (!shared) {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    }
    const { error } = await supabase.from("app_data").upsert({ key, value }, { onConflict: "key" });
    if (error) return false;
    return true;
  } catch {
    return false;
  }
}

const Etiquette = ({ children, accent = COLORS.vert, style = {}, className = "" }) => (
  <div
    className={`relative ${className}`}
    style={{
      background: COLORS.card,
      borderRadius: 16,
      border: "1px solid #EBEBEB",
      boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 2px 8px rgba(0,0,0,0.04)",
      ...style,
    }}
  >
    <div
      style={{
        position: "absolute",
        top: 12,
        right: 12,
        width: 8,
        height: 8,
        borderRadius: "50%",
        background: accent,
      }}
    />
    {children}
  </div>
);

export default function App() {
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("accueil");
  const [nameInput, setNameInput] = useState("");
  const [roleInput, setRoleInput] = useState("Employé");
  const [signupCodeInput, setSignupCodeInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [loginError, setLoginError] = useState("");
  const [authMode, setAuthMode] = useState("login");

  const [employees, setEmployees] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [taskStatuses, setTaskStatuses] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [weekOffset, setWeekOffset] = useState(0);
  const [planningView, setPlanningView] = useState("planning");
  const [autoOpenTaskForm, setAutoOpenTaskForm] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [inventoryMode, setInventoryMode] = useState(false);
  const [requests, setRequests] = useState([]);
  const [wines, setWines] = useState([]);
  const [products, setProducts] = useState([]);
  const [promos, setPromos] = useState([]);
  const [adminCode, setAdminCode] = useState(null);
  const [inventaires, setInventaires] = useState([]);
  const [conges, setConges] = useState([]);

  useEffect(() => {
    (async () => {
      const savedMe = await storageGet("me", false);
      if (savedMe) setMe(savedMe);
      const [emp, sh, tk, an, rq, ts, wn, pr, pm, ac, iv, cg] = await Promise.all([
        storageGet("employees", true),
        storageGet("shifts", true),
        storageGet("tasks", true),
        storageGet("announcements", true),
        storageGet("requests", true),
        storageGet("taskStatuses", true),
        storageGet("wines", true),
        storageGet("products", true),
        storageGet("promos", true),
        storageGet("adminCode", true),
        storageGet("inventaires", true),
        storageGet("conges", true),
      ]);
      setEmployees(emp || []);
      setShifts(sh || []);
      setTasks(tk || []);
      setAnnouncements(an || []);
      setRequests(rq || []);
      setTaskStatuses(ts || []);
      setWines(wn || []);
      setProducts(pr || []);
      setPromos(pm || []);
      setAdminCode(ac || null);
      setInventaires(iv || []);
      setConges(cg || []);
      setLoading(false);
    })();
  }, []);

  const saveEmployees = useCallback(async (next) => {
    setEmployees(next);
    await storageSet("employees", next, true);
  }, []);
  const saveShifts = useCallback(async (next) => {
    setShifts(next);
    await storageSet("shifts", next, true);
  }, []);
  const saveTasks = useCallback(async (next) => {
    setTasks(next);
    await storageSet("tasks", next, true);
  }, []);
  const saveTaskStatuses = useCallback(async (next) => {
    setTaskStatuses(next);
    await storageSet("taskStatuses", next, true);
  }, []);
  const saveAnnouncements = useCallback(async (next) => {
    setAnnouncements(next);
    await storageSet("announcements", next, true);
  }, []);
  const saveRequests = useCallback(async (next) => {
    setRequests(next);
    await storageSet("requests", next, true);
  }, []);
  const saveWines = useCallback(async (next) => {
    setWines(next);
    await storageSet("wines", next, true);
  }, []);
  const saveProducts = useCallback(async (next) => {
    setProducts(next);
    await storageSet("products", next, true);
  }, []);
  const savePromos = useCallback(async (next) => {
    setPromos(next);
    await storageSet("promos", next, true);
  }, []);
  const saveAdminCode = useCallback(async (next) => {
    setAdminCode(next);
    await storageSet("adminCode", next, true);
  }, []);
  const saveInventaires = useCallback(async (next) => {
    setInventaires(next);
    await storageSet("inventaires", next, true);
  }, []);
  const saveConges = useCallback(async (next) => {
    setConges(next);
    await storageSet("conges", next, true);
  }, []);

  useEffect(() => {
    if (inventoryMode && !inventaires.some((iv) => iv.status === "en cours")) {
      setInventoryMode(false);
    }
  }, [inventoryMode, inventaires]);

  const existingEmployee = employees.find(
    (e) => e.name.toLowerCase() === nameInput.trim().toLowerCase()
  );

  const hasChef = employees.some((e) => e.role === "Chef");

  const handleLogin = async () => {
    setLoginError("");
    const name = nameInput.trim();
    if (!name || !passwordInput) {
      setLoginError("Prénom et mot de passe requis.");
      return;
    }
    if (authMode === "login" && !existingEmployee) {
      setLoginError("Aucun compte trouvé avec ce prénom. Crée un compte ci-dessous.");
      return;
    }
    if (authMode === "signup" && existingEmployee) {
      setLoginError("Ce prénom est déjà utilisé — connecte-toi plutôt.");
      return;
    }
    if (authMode === "signup" && roleInput !== "Employé") {
      const isBootstrapChef = roleInput === "Chef" && !hasChef;
      if (!isBootstrapChef) {
        if (!adminCode) {
          setLoginError("Aucun code chef n'a encore été généré. Demande au chef de le générer depuis son profil.");
          return;
        }
        if (signupCodeInput.trim() !== adminCode) {
          setLoginError("Code chef incorrect.");
          return;
        }
      }
    }
    const pwdHash = await hashPassword(passwordInput);

    if (existingEmployee) {
      // Compte existant : vérifier le mot de passe
      if (!existingEmployee.pwdHash) {
        // Compte créé avant l'ajout du mot de passe : on le protège maintenant
        const updated = employees.map((e) =>
          e.id === existingEmployee.id ? { ...e, pwdHash } : e
        );
        await saveEmployees(updated);
      } else if (existingEmployee.pwdHash !== pwdHash) {
        setLoginError("Mot de passe incorrect pour ce prénom.");
        return;
      }
      const profile = { name: existingEmployee.name, rayon: existingEmployee.rayon, role: existingEmployee.role || "Employé" };
      setMe(profile);
      await storageSet("me", profile, false);
    } else {
      // Nouveau compte : demander confirmation du mot de passe
      if (passwordInput !== passwordConfirm) {
        setLoginError("Les deux mots de passe ne correspondent pas.");
        return;
      }
      const profile = { name, rayon: RAYONS[0], role: roleInput };
      await saveEmployees([...employees, { id: uid(), ...profile, pwdHash }]);
      setMe(profile);
      await storageSet("me", profile, false);
    }
    setPasswordInput("");
    setPasswordConfirm("");
    setSignupCodeInput("");
  };

  const handleSwitchUser = async () => {
    setMe(null);
    setNameInput("");
    setPasswordInput("");
    setPasswordConfirm("");
    setLoginError("");
    setAuthMode("login");
    setRoleInput("Employé");
    setSignupCodeInput("");
  };

  if (loading) {
    return (
      <div style={{ background: COLORS.creme, minHeight: "100vh" }} className="flex items-center justify-center">
        <div style={{ fontFamily: "'Poppins', sans-serif", color: COLORS.vert }} className="text-2xl">
          Chargement…
        </div>
      </div>
    );
  }

  if (!me) {
    return (
      <div style={{ background: COLORS.creme, minHeight: "100vh", fontFamily: "'Inter', sans-serif" }} className="flex flex-col items-center justify-center p-6">
        <style>{FONT_IMPORT}</style>

        <div
          style={{ color: COLORS.vert, fontFamily: "'Poppins', sans-serif" }}
          className="text-5xl font-extrabold mb-1 text-center"
        >
          MyÉpicerie
        </div>
        <div style={{ color: COLORS.ardoise }} className="text-sm mb-8 opacity-60 text-center">
          Épicerie · La Seyne-sur-Mer — appli d'équipe
        </div>

        <div style={{ background: COLORS.card, borderRadius: 16, maxWidth: 420, width: "100%" }} className="p-8 shadow-lg">
          <div style={{ color: COLORS.ardoise, fontFamily: "'Poppins', sans-serif" }} className="text-lg font-semibold mb-5">
            {authMode === "login" ? "Se connecter" : "Créer un compte"}
          </div>

          <label style={{ color: COLORS.ardoise }} className="text-sm font-medium block mb-1">
            Ton prénom
          </label>
          <input
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder="Ex: Allan"
            style={{ borderColor: `${COLORS.vert}33` }}
            className="w-full border rounded-lg px-3 py-2 mb-4 outline-none focus:ring-2"
          />

          {authMode === "signup" && (
            <>
              <label style={{ color: COLORS.ardoise }} className="text-sm font-medium block mb-1">
                Ton poste
              </label>
              <select
                value={roleInput}
                onChange={(e) => {
                  setRoleInput(e.target.value);
                  setLoginError("");
                }}
                style={{ borderColor: `${COLORS.vert}33` }}
                className="w-full border rounded-lg px-3 py-2 mb-4 outline-none"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>

              {roleInput !== "Employé" && !(roleInput === "Chef" && !hasChef) && (
                <>
                  <label style={{ color: COLORS.ardoise }} className="text-sm font-medium block mb-1">
                    Code chef
                  </label>
                  <input
                    value={signupCodeInput}
                    onChange={(e) => setSignupCodeInput(e.target.value)}
                    placeholder="Code à 6 chiffres"
                    style={{ borderColor: `${COLORS.vert}33` }}
                    className="w-full border rounded-lg px-3 py-2 mb-4 outline-none"
                  />
                </>
              )}
            </>
          )}

          <label style={{ color: COLORS.ardoise }} className="text-sm font-medium block mb-1">
            {authMode === "login" ? "Mot de passe" : "Choisis un mot de passe"}
          </label>
          <input
            type="password"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            placeholder="••••••••"
            style={{ borderColor: `${COLORS.vert}33` }}
            className="w-full border rounded-lg px-3 py-2 mb-4 outline-none focus:ring-2"
            onKeyDown={(e) => e.key === "Enter" && authMode === "login" && handleLogin()}
          />

          {authMode === "signup" && (
            <>
              <label style={{ color: COLORS.ardoise }} className="text-sm font-medium block mb-1">
                Confirme le mot de passe
              </label>
              <input
                type="password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                placeholder="••••••••"
                style={{ borderColor: `${COLORS.vert}33` }}
                className="w-full border rounded-lg px-3 py-2 mb-4 outline-none focus:ring-2"
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              />
            </>
          )}

          {loginError && (
            <div style={{ color: COLORS.tomate }} className="text-xs mb-4 flex items-center gap-1">
              <AlertTriangle size={12} /> {loginError}
            </div>
          )}

          <button
            onClick={handleLogin}
            style={{ background: COLORS.vert }}
            className="w-full text-white rounded-lg py-2.5 font-medium hover:opacity-90 transition"
          >
            {authMode === "login" ? "Se connecter" : "Créer mon compte"}
          </button>

          <div style={{ color: COLORS.ardoise }} className="text-xs mt-4 opacity-50">
            Les données (planning, tâches, annonces) sont partagées avec toute l'équipe. Ton mot de passe protège seulement l'accès à ton nom.
          </div>
        </div>

        <div className="mt-6 text-sm text-center">
          {authMode === "login" ? (
            <span style={{ color: COLORS.ardoise }} className="opacity-70">
              Pas encore de compte ?{" "}
              <button
                onClick={() => {
                  setAuthMode("signup");
                  setLoginError("");
                }}
                style={{ color: COLORS.vert }}
                className="font-semibold underline decoration-dotted underline-offset-2"
              >
                Créer un compte
              </button>
            </span>
          ) : (
            <span style={{ color: COLORS.ardoise }} className="opacity-70">
              Déjà un compte ?{" "}
              <button
                onClick={() => {
                  setAuthMode("login");
                  setLoginError("");
                }}
                style={{ color: COLORS.vert }}
                className="font-semibold underline decoration-dotted underline-offset-2"
              >
                Se connecter
              </button>
            </span>
          )}
        </div>
      </div>
    );
  }

  if (inventoryMode) {
    const activeSession = inventaires.find((iv) => iv.status === "en cours");
    if (activeSession) {
      return (
        <InventoryScanScreen
          me={me}
          products={products}
          session={activeSession}
          inventaires={inventaires}
          saveInventaires={saveInventaires}
          onExit={() => setInventoryMode(false)}
        />
      );
    }
  }

  const todayForNotifs = todayKey();
  const jourForNotifs = todayJour();
  const notifPromos = promos.filter(
    (p) => promoStatus(p, todayForNotifs) === "En cours" && joursRestants(p.dateFin, todayForNotifs) <= 2
  );
  const notifConges = me.role === "Chef" || me.role === "Second" ? conges.filter((c) => c.status === "En attente") : [];
  const notifTaches = tasks.filter(
    (t) =>
      t.assignedTo &&
      t.assignedTo.includes(me.name) &&
      isTaskActiveToday(t, todayForNotifs, jourForNotifs) &&
      !getTaskStatus(t, taskStatuses, todayForNotifs).done
  );
  const notifCount = notifPromos.length + notifConges.length + notifTaches.length;

  return (
    <div style={{ background: COLORS.creme, minHeight: "100vh", fontFamily: "'Inter', sans-serif" }}>
      <style>{FONT_IMPORT}</style>
      <header style={{ background: "#FFFFFF", borderBottom: "1px solid #EBEBEB" }} className="sticky top-0 z-10 shadow-sm">
        <div className="px-4 pt-4 pb-2 flex items-center justify-between">
          <button
            onClick={() => setTab("accueil")}
            style={{ fontFamily: "'Poppins', sans-serif", color: COLORS.vert }}
            className="text-xl font-bold"
          >
            MyÉpicerie
          </button>
          <div className="flex items-center gap-3">
            <button onClick={() => setShowNotifs(!showNotifs)} className="relative" aria-label="Notifications">
              <Bell size={19} color={COLORS.ardoise} />
              {notifCount > 0 && (
                <span
                  style={{ background: COLORS.tomate }}
                  className="absolute -top-1.5 -right-1.5 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center"
                >
                  {notifCount > 9 ? "9+" : notifCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setShowProfile(true)}
              className="flex items-center gap-2 text-xs font-medium"
              style={{ color: COLORS.ardoise }}
            >
              {me.role === "Chef" && <Crown size={13} color={COLORS.moutarde} />}
              <span
                style={{ background: `${COLORS.vert}15`, color: COLORS.vert }}
                className="w-7 h-7 rounded-full flex items-center justify-center"
              >
                <User size={14} />
              </span>
              {me.name}
            </button>
          </div>
        </div>

        {showNotifs && (
          <div className="px-4 pb-3">
            <div style={{ background: COLORS.card, border: "1px solid #EBEBEB" }} className="rounded-2xl p-3 shadow-md">
              {notifCount === 0 ? (
                <div style={{ color: COLORS.ardoise }} className="text-xs opacity-50 text-center py-2">
                  Rien de nouveau pour l'instant
                </div>
              ) : (
                <>
                  {notifTaches.length > 0 && (
                    <button
                      onClick={() => {
                        setTab("taches");
                        setShowNotifs(false);
                      }}
                      className="w-full text-left flex items-center gap-2 py-1.5 text-xs"
                      style={{ color: COLORS.ardoise }}
                    >
                      <CheckSquare size={13} color={COLORS.vert} />
                      {notifTaches.length} tâche{notifTaches.length > 1 ? "s" : ""} qui t'{notifTaches.length > 1 ? "sont" : "est"} assignée
                      {notifTaches.length > 1 ? "s" : ""} aujourd'hui
                    </button>
                  )}
                  {notifPromos.length > 0 && (
                    <button
                      onClick={() => {
                        setTab("promos");
                        setShowNotifs(false);
                      }}
                      className="w-full text-left flex items-center gap-2 py-1.5 text-xs"
                      style={{ color: COLORS.ardoise }}
                    >
                      <Percent size={13} color={COLORS.tomate} />
                      {notifPromos.length} promo{notifPromos.length > 1 ? "s" : ""} se termine{notifPromos.length > 1 ? "nt" : ""} bientôt
                    </button>
                  )}
                  {notifConges.length > 0 && (
                    <button
                      onClick={() => {
                        setTab("planning");
                        setPlanningView("conges");
                        setShowNotifs(false);
                      }}
                      className="w-full text-left flex items-center gap-2 py-1.5 text-xs"
                      style={{ color: COLORS.ardoise }}
                    >
                      <CalendarDays size={13} color={COLORS.moutarde} />
                      {notifConges.length} demande{notifConges.length > 1 ? "s" : ""} de congé en attente
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        )}
        <div style={{ color: COLORS.ardoise }} className="px-4 pb-2 text-xs opacity-50">
          {me.rayon}
        </div>
        <nav className="flex px-2 pb-2 gap-1 overflow-x-auto">
          {[
            { id: "accueil", label: "Accueil", icon: Home },
            { id: "planning", label: "Planning", icon: Calendar },
            { id: "promos", label: "Promos", icon: Percent },
            { id: "cave", label: "Cave", icon: Wine },
            ...(me.role === "Chef" ? [{ id: "chefmaster", label: "Chefmaster", icon: Settings }] : []),
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="flex-1 flex flex-col items-center gap-1 py-2 px-1 text-[11px] rounded-2xl transition shrink-0"
              style={{
                background: tab === t.id ? COLORS.vert : "transparent",
                color: tab === t.id ? "#ffffff" : "#717171",
                fontWeight: tab === t.id ? 600 : 500,
                minWidth: 64,
              }}
            >
              <t.icon size={16} />
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="p-4 max-w-2xl mx-auto pb-24">
        {tab === "accueil" && (
          <AccueilTab
            me={me}
            shifts={shifts}
            tasks={tasks}
            taskStatuses={taskStatuses}
            promos={promos}
            announcements={announcements}
            products={products}
            wines={wines}
            setTab={setTab}
            onQuickAddTask={() => {
              setAutoOpenTaskForm(true);
              setTab("taches");
            }}
          />
        )}
        {tab === "planning" && (
          <PlanningTab
            me={me}
            shifts={shifts}
            saveShifts={saveShifts}
            employees={employees}
            weekOffset={weekOffset}
            setWeekOffset={setWeekOffset}
            requests={requests}
            saveRequests={saveRequests}
            conges={conges}
            saveConges={saveConges}
            view={planningView}
            setView={setPlanningView}
          />
        )}
        {tab === "taches" && (
          <TachesTab
            me={me}
            tasks={tasks}
            saveTasks={saveTasks}
            taskStatuses={taskStatuses}
            saveTaskStatuses={saveTaskStatuses}
            employees={employees}
            autoOpenForm={autoOpenTaskForm}
            onAutoOpenHandled={() => setAutoOpenTaskForm(false)}
          />
        )}
        {tab === "produits" && (
          <ProduitsTab
            me={me}
            products={products}
            saveProducts={saveProducts}
            inventaires={inventaires}
            saveInventaires={saveInventaires}
            onEnterInventoryMode={() => setInventoryMode(true)}
            adminCode={adminCode}
            tasks={tasks}
            saveTasks={saveTasks}
          />
        )}
        {tab === "promos" && <PromosTab me={me} promos={promos} savePromos={savePromos} products={products} />}
        {tab === "cave" && <CaveTab me={me} wines={wines} saveWines={saveWines} />}
        {tab === "annonces" && (
          <AnnoncesTab me={me} announcements={announcements} saveAnnouncements={saveAnnouncements} />
        )}
        {tab === "chefmaster" && me.role === "Chef" && (
          <ChefMasterTab
            employees={employees}
            saveEmployees={saveEmployees}
            adminCode={adminCode}
            saveAdminCode={saveAdminCode}
            products={products}
            inventaires={inventaires}
            tasks={tasks}
            taskStatuses={taskStatuses}
          />
        )}
      </main>

      <nav
        style={{ background: "#FFFFFF", borderTop: "1px solid #EBEBEB" }}
        className="fixed bottom-0 inset-x-0 z-20 flex px-2 pt-1.5 pb-2 max-w-2xl mx-auto"
      >
        {[
          { id: "produits", label: "Produits", icon: Package },
          { id: "taches", label: "Tâches", icon: CheckSquare },
          { id: "annonces", label: "Annonces", icon: MessageSquare },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="flex-1 flex flex-col items-center gap-0.5 py-1"
            style={{ color: tab === t.id ? COLORS.vert : "#717171" }}
          >
            <t.icon size={20} />
            <span className="text-[11px]" style={{ fontWeight: tab === t.id ? 600 : 500 }}>
              {t.label}
            </span>
          </button>
        ))}
      </nav>

      {showProfile && (
        <ProfileModal
          me={me}
          setMe={setMe}
          employees={employees}
          saveEmployees={saveEmployees}
          adminCode={adminCode}
          saveAdminCode={saveAdminCode}
          onClose={() => setShowProfile(false)}
          onLogout={() => {
            setShowProfile(false);
            handleSwitchUser();
          }}
        />
      )}
    </div>
  );
}

const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700;800&family=Inter:wght@400;500;600;700&display=swap');`;

function generateAdminCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function ProfileModal({ me, setMe, employees, saveEmployees, onClose, onLogout, adminCode, saveAdminCode }) {
  const [rayon, setRayon] = useState(me.rayon);
  const [role, setRole] = useState(me.role || "Employé");
  const [codeInput, setCodeInput] = useState("");
  const [showCodeConfirm, setShowCodeConfirm] = useState(false);
  const [oldPwd, setOldPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [newPwd2, setNewPwd2] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [codeRevealed, setCodeRevealed] = useState(false);
  const [showEquipe, setShowEquipe] = useState(false);

  const myRecord = employees.find((e) => e.name.toLowerCase() === me.name.toLowerCase());
  const [telephone, setTelephone] = useState(myRecord?.telephone || "");

  const saveRayon = async () => {
    setError("");
    setMessage("");
    if (rayon === me.rayon) return;
    const next = employees.map((e) => (e.id === myRecord?.id ? { ...e, rayon } : e));
    await saveEmployees(next);
    const updatedMe = { ...me, rayon };
    setMe(updatedMe);
    await storageSet("me", updatedMe, false);
    setMessage("Rayon mis à jour.");
  };

  const saveTelephone = async () => {
    setError("");
    setMessage("");
    const next = employees.map((e) => (e.id === myRecord?.id ? { ...e, telephone: telephone.trim() } : e));
    await saveEmployees(next);
    setMessage("Numéro mis à jour.");
  };

  const confirmRoleChange = async () => {
    setError("");
    setMessage("");
    if (!adminCode) {
      setError("Aucun code admin n'a encore été généré. Demande à un chef de le générer depuis son profil.");
      return;
    }
    if (codeInput.trim() !== adminCode) {
      setError("Code admin incorrect.");
      return;
    }
    const next = employees.map((e) => (e.id === myRecord?.id ? { ...e, role } : e));
    await saveEmployees(next);
    const updatedMe = { ...me, role };
    setMe(updatedMe);
    await storageSet("me", updatedMe, false);
    setMessage("Poste mis à jour.");
    setCodeInput("");
    setShowCodeConfirm(false);
  };

  const regenerateAdminCode = async () => {
    const code = generateAdminCode();
    await saveAdminCode(code);
    setCodeRevealed(true);
    setMessage("Nouveau code admin généré.");
  };

  const changePassword = async () => {
    setError("");
    setMessage("");
    if (!oldPwd || !newPwd || !newPwd2) {
      setError("Remplis les trois champs pour changer de mot de passe.");
      return;
    }
    if (newPwd !== newPwd2) {
      setError("Les nouveaux mots de passe ne correspondent pas.");
      return;
    }
    setSaving(true);
    const oldHash = await hashPassword(oldPwd);
    if (myRecord?.pwdHash && myRecord.pwdHash !== oldHash) {
      setSaving(false);
      setError("Mot de passe actuel incorrect.");
      return;
    }
    const newHash = await hashPassword(newPwd);
    const next = employees.map((e) => (e.id === myRecord?.id ? { ...e, pwdHash: newHash } : e));
    await saveEmployees(next);
    setSaving(false);
    setOldPwd("");
    setNewPwd("");
    setNewPwd2("");
    setMessage("Mot de passe changé.");
  };

  return (
    <div
      className="fixed inset-0 flex items-end sm:items-center justify-center z-20"
      style={{ background: "rgba(38,36,33,0.45)" }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: COLORS.creme, borderRadius: "20px 20px 0 0", maxWidth: 440 }}
        className="w-full sm:rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-4">
          <div style={{ fontFamily: "'Poppins', sans-serif", color: COLORS.vert }} className="text-2xl">
            Mon profil
          </div>
          <button onClick={onClose}>
            <X size={20} color={COLORS.ardoise} />
          </button>
        </div>

        <div style={{ background: COLORS.card }} className="rounded-xl p-4 mb-4 shadow-sm">
          <div style={{ color: COLORS.ardoise }} className="text-xs opacity-60 mb-1">
            Prénom
          </div>
          <div style={{ color: COLORS.ardoise }} className="text-sm font-medium mb-3">
            {me.name}
          </div>

          <div style={{ color: COLORS.ardoise }} className="text-xs opacity-60 mb-1">
            Rayon
          </div>
          <div className="flex gap-2">
            <select
              value={rayon}
              onChange={(e) => setRayon(e.target.value)}
              style={{ borderColor: `${COLORS.vert}33` }}
              className="flex-1 border rounded-lg px-3 py-2 text-sm"
            >
              {RAYONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            {rayon !== me.rayon && (
              <button onClick={saveRayon} style={{ background: COLORS.vert }} className="text-white rounded-lg px-3 text-sm">
                OK
              </button>
            )}
          </div>

          <div style={{ color: COLORS.ardoise }} className="text-xs opacity-60 mb-1 mt-3">
            Poste
          </div>
          <div className="flex gap-2">
            <select
              value={role}
              onChange={(e) => {
                setRole(e.target.value);
                setError("");
                setMessage("");
                setShowCodeConfirm(e.target.value !== (me.role || "Employé"));
              }}
              style={{ borderColor: `${COLORS.vert}33` }}
              className="flex-1 border rounded-lg px-3 py-2 text-sm"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {showCodeConfirm && (
            <div className="flex gap-2 mt-2">
              <input
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value)}
                placeholder="Code admin à 6 chiffres"
                style={{ borderColor: `${COLORS.vert}33` }}
                className="flex-1 border rounded-lg px-3 py-2 text-sm outline-none"
              />
              <button onClick={confirmRoleChange} style={{ background: COLORS.vert }} className="text-white rounded-lg px-3 text-sm">
                Confirmer
              </button>
            </div>
          )}

          <div style={{ color: COLORS.ardoise }} className="text-xs opacity-60 mb-1 mt-3">
            Numéro pour être contacté
          </div>
          <div className="flex gap-2">
            <input
              type="tel"
              value={telephone}
              onChange={(e) => setTelephone(e.target.value)}
              placeholder="Ex: 06 12 34 56 78"
              style={{ borderColor: `${COLORS.vert}33` }}
              className="flex-1 border rounded-lg px-3 py-2 text-sm outline-none"
            />
            {telephone !== (myRecord?.telephone || "") && (
              <button onClick={saveTelephone} style={{ background: COLORS.vert }} className="text-white rounded-lg px-3 text-sm">
                OK
              </button>
            )}
          </div>
          <div style={{ color: COLORS.ardoise }} className="text-xs opacity-50 mt-1">
            Visible par toute l'équipe.
          </div>
        </div>

        <div style={{ background: COLORS.card }} className="rounded-xl p-4 mb-4 shadow-sm">
          <button onClick={() => setShowEquipe(!showEquipe)} className="w-full flex items-center justify-between">
            <div style={{ color: COLORS.ardoise }} className="text-sm font-medium flex items-center gap-2">
              <Users size={15} color={COLORS.vert} /> Équipe ({employees.length})
            </div>
            <ChevronLeft size={16} color={COLORS.vert} style={{ transform: showEquipe ? "rotate(90deg)" : "rotate(-90deg)" }} />
          </button>
          {showEquipe && (
            <div className="mt-3">
              <EquipeTab employees={employees} />
            </div>
          )}
        </div>

        {me.role === "Chef" && (
          <div style={{ background: COLORS.card }} className="rounded-xl p-4 mb-4 shadow-sm">
            <div style={{ color: COLORS.ardoise }} className="text-sm font-medium mb-1">
              Code admin
            </div>
            <div style={{ color: COLORS.ardoise }} className="text-xs opacity-60 mb-3">
              Ce code est demandé à tout le monde (y compris toi) pour changer de poste. Ne le partage qu'avec qui de droit.
            </div>
            {adminCode ? (
              <div className="flex items-center gap-2 mb-3">
                <div
                  style={{ background: `${COLORS.vert}18`, color: COLORS.vert, letterSpacing: 3 }}
                  className="flex-1 rounded-lg px-3 py-2 text-sm font-mono font-semibold text-center"
                >
                  {codeRevealed ? adminCode : "••••••"}
                </div>
                <button
                  onClick={() => setCodeRevealed(!codeRevealed)}
                  style={{ borderColor: `${COLORS.vert}55`, color: COLORS.vert }}
                  className="border rounded-lg px-3 py-2 text-xs font-medium"
                >
                  {codeRevealed ? "Cacher" : "Voir"}
                </button>
              </div>
            ) : (
              <div style={{ color: COLORS.tomate }} className="text-xs mb-3">
                Aucun code généré pour l'instant.
              </div>
            )}
            <button
              onClick={regenerateAdminCode}
              style={{ background: COLORS.moutarde }}
              className="w-full text-white rounded-lg py-2 text-sm font-medium"
            >
              {adminCode ? "Générer un nouveau code" : "Générer le code admin"}
            </button>
          </div>
        )}

        <div style={{ background: COLORS.card }} className="rounded-xl p-4 mb-4 shadow-sm">
          <div style={{ color: COLORS.ardoise }} className="text-sm font-medium mb-3">
            Changer de mot de passe
          </div>
          <input
            type="password"
            value={oldPwd}
            onChange={(e) => setOldPwd(e.target.value)}
            placeholder="Mot de passe actuel"
            style={{ borderColor: `${COLORS.vert}33` }}
            className="w-full border rounded-lg px-3 py-2 mb-2 text-sm outline-none"
          />
          <input
            type="password"
            value={newPwd}
            onChange={(e) => setNewPwd(e.target.value)}
            placeholder="Nouveau mot de passe"
            style={{ borderColor: `${COLORS.vert}33` }}
            className="w-full border rounded-lg px-3 py-2 mb-2 text-sm outline-none"
          />
          <input
            type="password"
            value={newPwd2}
            onChange={(e) => setNewPwd2(e.target.value)}
            placeholder="Confirme le nouveau mot de passe"
            style={{ borderColor: `${COLORS.vert}33` }}
            className="w-full border rounded-lg px-3 py-2 mb-3 text-sm outline-none"
          />
          <button
            onClick={changePassword}
            disabled={saving}
            style={{ background: COLORS.vert }}
            className="w-full text-white rounded-lg py-2 text-sm font-medium disabled:opacity-60"
          >
            {saving ? "…" : "Mettre à jour le mot de passe"}
          </button>
        </div>

        {error && (
          <div style={{ color: COLORS.tomate }} className="text-xs mb-3 flex items-center gap-1">
            <AlertTriangle size={12} /> {error}
          </div>
        )}
        {message && (
          <div style={{ color: COLORS.vert }} className="text-xs mb-3">
            {message}
          </div>
        )}

        <button
          onClick={onLogout}
          style={{ borderColor: COLORS.tomate, color: COLORS.tomate }}
          className="w-full border-2 rounded-lg py-2 text-sm font-medium"
        >
          Se déconnecter
        </button>
      </div>
    </div>
  );
}

function AccueilTab({ me, shifts, tasks, taskStatuses, promos, announcements, products, wines, setTab, onQuickAddTask }) {
  const [search, setSearch] = useState("");

  const today = todayKey();
  const jourAujourdhui = todayJour();
  const monday = getWeekStart(0);
  const weekKey = monday.toISOString().slice(0, 10);

  const mesCreneaux = shifts.filter(
    (s) => s.weekStart === weekKey && s.day === jourAujourdhui && s.employeeName === me.name
  );

  const tachesAujourdhui = tasks
    .filter((t) => (me.rayon === "Général" || t.rayon === me.rayon) && isTaskActiveToday(t, today, jourAujourdhui))
    .map((t) => ({ ...t, status: getTaskStatus(t, taskStatuses, today) }));
  const tachesFaites = tachesAujourdhui.filter((t) => t.status.done).length;

  const promosBientot = promos
    .map((p) => ({ ...p, status: promoStatus(p, today) }))
    .filter((p) => p.status === "En cours" && joursRestants(p.dateFin, today) <= 2);

  const dernieresAnnonces = [...announcements].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 3);

  const weekAgo = (() => {
    const d = new Date(today);
    d.setDate(d.getDate() - 6);
    return d.toISOString().slice(0, 10);
  })();
  const tachesFaitesSemaine = taskStatuses.filter((s) => s.done && s.date >= weekAgo && s.date <= today).length;

  const q = search.trim().toLowerCase();
  const showSearch = q.length > 0;
  const resultsProduits = showSearch
    ? products.filter(
        (p) => p.nom.toLowerCase().includes(q) || p.reference.toLowerCase().includes(q) || p.origine.toLowerCase().includes(q)
      )
    : [];
  const resultsVins = showSearch
    ? wines.filter(
        (w) => w.nom.toLowerCase().includes(q) || w.origine.toLowerCase().includes(q) || w.cepage.toLowerCase().includes(q)
      )
    : [];
  const resultsAnnonces = showSearch ? announcements.filter((a) => a.text.toLowerCase().includes(q)) : [];

  return (
    <div>
      <div style={{ fontFamily: "'Poppins', sans-serif", color: COLORS.ardoise }} className="text-2xl font-bold mb-1">
        Salut {me.name} 👋
      </div>
      <div style={{ color: COLORS.ardoise }} className="text-sm opacity-60 mb-4">
        {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
      </div>

      <div className="relative mb-5">
        <Search size={14} style={{ position: "absolute", left: 10, top: 10 }} color={COLORS.ardoise} className="opacity-40" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un produit, un vin, une annonce…"
          style={{ borderColor: "#EBEBEB" }}
          className="w-full border rounded-xl pl-8 pr-3 py-2.5 text-sm outline-none"
        />
      </div>

      {showSearch ? (
        <div>
          {resultsProduits.length === 0 && resultsVins.length === 0 && resultsAnnonces.length === 0 && (
            <div style={{ color: COLORS.ardoise }} className="text-sm opacity-40 italic">
              Aucun résultat
            </div>
          )}
          {resultsProduits.length > 0 && (
            <div className="mb-4">
              <div style={{ color: COLORS.ardoise }} className="text-xs font-semibold uppercase tracking-wide opacity-50 mb-1.5">
                Produits
              </div>
              {resultsProduits.slice(0, 5).map((p) => (
                <Etiquette key={p.id} accent={COLORS.vert} className="mb-2 p-3">
                  <div style={{ color: COLORS.ardoise }} className="text-sm font-medium">
                    {p.nom}
                  </div>
                  <div style={{ color: COLORS.ardoise }} className="text-xs opacity-60">
                    {getProductRayons(p).join(", ")} {p.reference && `· ${p.reference}`}
                  </div>
                </Etiquette>
              ))}
              <button onClick={() => setTab("produits")} style={{ color: COLORS.vert }} className="text-xs font-medium">
                Voir dans Produits →
              </button>
            </div>
          )}
          {resultsVins.length > 0 && (
            <div className="mb-4">
              <div style={{ color: COLORS.ardoise }} className="text-xs font-semibold uppercase tracking-wide opacity-50 mb-1.5">
                Cave à vin
              </div>
              {resultsVins.slice(0, 5).map((w) => (
                <Etiquette key={w.id} accent={COLORS.vertClair} className="mb-2 p-3">
                  <div style={{ color: COLORS.ardoise }} className="text-sm font-medium">
                    {w.nom}
                  </div>
                  <div style={{ color: COLORS.ardoise }} className="text-xs opacity-60">
                    {w.couleur} {w.origine && `· ${w.origine}`}
                  </div>
                </Etiquette>
              ))}
              <button onClick={() => setTab("cave")} style={{ color: COLORS.vert }} className="text-xs font-medium">
                Voir dans la Cave →
              </button>
            </div>
          )}
          {resultsAnnonces.length > 0 && (
            <div className="mb-4">
              <div style={{ color: COLORS.ardoise }} className="text-xs font-semibold uppercase tracking-wide opacity-50 mb-1.5">
                Annonces
              </div>
              {resultsAnnonces.slice(0, 5).map((a) => (
                <Etiquette key={a.id} accent={COLORS.moutarde} className="mb-2 p-3">
                  <div style={{ color: COLORS.ardoise }} className="text-sm">
                    {a.text}
                  </div>
                  <div style={{ color: COLORS.ardoise }} className="text-xs opacity-50 mt-0.5">
                    {a.author}
                  </div>
                </Etiquette>
              ))}
              <button onClick={() => setTab("annonces")} style={{ color: COLORS.vert }} className="text-xs font-medium">
                Voir dans Annonces →
              </button>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 mb-5">
            <Etiquette accent={COLORS.vert} className="p-4">
              <div style={{ color: COLORS.ardoise }} className="text-xs opacity-60 mb-1">
                Aujourd'hui
              </div>
              <div style={{ color: COLORS.ardoise }} className="text-2xl font-bold">
                {mesCreneaux.length === 0 ? "Repos" : mesCreneaux.map((s) => `${s.start}–${s.end}`).join(", ")}
              </div>
              <button onClick={() => setTab("planning")} style={{ color: COLORS.vert }} className="text-xs font-medium mt-1">
                Voir le planning →
              </button>
            </Etiquette>
            <Etiquette accent={COLORS.vertClair} className="p-4">
              <div style={{ color: COLORS.ardoise }} className="text-xs opacity-60 mb-1">
                {me.rayon === "Général" ? "Tâches de l'épicerie" : "Tâches du rayon"}
              </div>
              <div style={{ color: COLORS.ardoise }} className="text-2xl font-bold">
                {tachesFaites}/{tachesAujourdhui.length}
              </div>
              <button onClick={() => setTab("taches")} style={{ color: COLORS.vert }} className="text-xs font-medium mt-1">
                Voir les tâches →
              </button>
            </Etiquette>
          </div>

          <Etiquette accent={COLORS.moutarde} className="p-4 mb-5">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} color={COLORS.vert} />
              <div style={{ color: COLORS.ardoise }} className="text-sm">
                <span className="font-semibold">{tachesFaitesSemaine}</span> tâche{tachesFaitesSemaine > 1 ? "s" : ""} faite
                {tachesFaitesSemaine > 1 ? "s" : ""} par l'équipe cette semaine
              </div>
            </div>
          </Etiquette>

          {promosBientot.length > 0 && (
            <div className="mb-5">
              <div style={{ color: COLORS.ardoise }} className="text-xs font-semibold uppercase tracking-wide opacity-50 mb-1.5 flex items-center gap-1">
                <Bell size={12} /> Promos qui se terminent bientôt
              </div>
              {promosBientot.map((p) => {
                const j = joursRestants(p.dateFin, today);
                return (
                  <Etiquette key={p.id} accent={COLORS.tomate} className="mb-2 p-3">
                    <div style={{ color: COLORS.ardoise }} className="text-sm font-medium">
                      {p.nom}
                    </div>
                    <div style={{ color: COLORS.tomate }} className="text-xs font-medium">
                      {j <= 0 ? "Se termine aujourd'hui" : `Finit dans ${j} jour${j > 1 ? "s" : ""}`}
                    </div>
                  </Etiquette>
                );
              })}
              <button onClick={() => setTab("promos")} style={{ color: COLORS.vert }} className="text-xs font-medium">
                Voir toutes les promos →
              </button>
            </div>
          )}

          <div>
            <div style={{ color: COLORS.ardoise }} className="text-xs font-semibold uppercase tracking-wide opacity-50 mb-1.5">
              Dernières annonces
            </div>
            {dernieresAnnonces.length === 0 && (
              <div style={{ color: COLORS.ardoise }} className="text-sm opacity-40 italic">
                Aucune annonce pour l'instant
              </div>
            )}
            {dernieresAnnonces.map((a) => (
              <Etiquette key={a.id} accent={a.important ? COLORS.tomate : COLORS.vertClair} className="mb-2 p-3">
                <div style={{ color: COLORS.ardoise }} className="text-sm">
                  {a.text}
                </div>
                <div style={{ color: COLORS.ardoise }} className="text-xs opacity-50 mt-0.5">
                  {a.author}
                </div>
              </Etiquette>
            ))}
            {announcements.length > 0 && (
              <button onClick={() => setTab("annonces")} style={{ color: COLORS.vert }} className="text-xs font-medium">
                Voir toutes les annonces →
              </button>
            )}
          </div>
        </>
      )}

      <button
        onClick={onQuickAddTask}
        style={{ background: COLORS.vert, boxShadow: "0 4px 14px rgba(255,56,92,0.4)" }}
        className="fixed bottom-24 right-5 z-30 w-14 h-14 rounded-full flex items-center justify-center text-white"
        aria-label="Ajouter une tâche"
      >
        <Plus size={26} />
      </button>
    </div>
  );
}

function PlanningTab({ me, shifts, saveShifts, employees, weekOffset, setWeekOffset, requests, saveRequests, conges, saveConges, view, setView }) {
  const canManage = me.role === "Chef" || me.role === "Second";
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ employeeName: me.name, day: JOURS[0], start: "08:00", end: "16:00" });
  const monday = getWeekStart(weekOffset);
  const weekDates = JOURS.map((_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
  const weekLabel = `${fmtDate(weekDates[0])} – ${fmtDate(weekDates[6])}`;

  const addShift = async () => {
    const next = [...shifts, { id: uid(), weekStart: monday.toISOString().slice(0, 10), ...form }];
    await saveShifts(next);
    setShowForm(false);
  };
  const removeShift = async (id) => {
    await saveShifts(shifts.filter((s) => s.id !== id));
  };

  const weekKey = monday.toISOString().slice(0, 10);
  const weekShifts = shifts.filter((s) => s.weekStart === weekKey);

  const exportPlanningPDF = () => {
    const rows = JOURS.map((jour, i) => {
      const dayShifts = weekShifts.filter((s) => s.day === jour);
      const lignes = dayShifts.length
        ? dayShifts.map((s) => `${s.employeeName} (${s.start}–${s.end})`).join("<br/>")
        : "—";
      return `<tr><td>${jour} ${fmtDate(weekDates[i])}</td><td>${lignes}</td></tr>`;
    }).join("");
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Planning ${weekLabel}</title>
      <style>
        body{font-family: Arial, Helvetica, sans-serif; padding: 24px; color:#222;}
        h1{font-size:20px;margin:0 0 16px;}
        table{width:100%;border-collapse:collapse;font-size:13px;}
        th,td{border-bottom:1px solid #ddd;padding:8px;text-align:left;vertical-align:top;}
        th{background:#f7f7f7;}
        .printBtn{background:#FF385C;color:#fff;border:none;border-radius:8px;padding:10px 16px;font-size:14px;cursor:pointer;margin-bottom:16px;}
        @media print { .printBtn { display:none; } }
      </style>
      </head><body>
        <button class="printBtn" onclick="window.print()">Imprimer / Enregistrer en PDF</button>
        <h1>MyÉpicerie — Planning semaine du ${weekLabel}</h1>
        <table><thead><tr><th>Jour</th><th>Créneaux</th></tr></thead><tbody>${rows}</tbody></table>
      </body></html>`;
    const win = window.open("", "_blank");
    if (!win) {
      alert("La fenêtre n'a pas pu s'ouvrir (pop-up bloqué). Autorise les pop-ups pour cette page, puis réessaie.");
      return;
    }
    win.document.open();
    win.document.write(html);
    win.document.close();
    win.focus();
  };

  const exportPlanningExcel = () => {
    const data = [];
    JOURS.forEach((jour, i) => {
      const dayShifts = weekShifts.filter((s) => s.day === jour);
      if (dayShifts.length === 0) {
        data.push({ Jour: `${jour} ${fmtDate(weekDates[i])}`, Employé: "", Début: "", Fin: "" });
      } else {
        dayShifts.forEach((s) => {
          data.push({ Jour: `${jour} ${fmtDate(weekDates[i])}`, Employé: s.employeeName, Début: s.start, Fin: s.end });
        });
      }
    });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Planning");
    XLSX.writeFile(wb, `planning-semaine-du-${weekKey}.xlsx`);
  };

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setView("planning")}
          style={{
            background: view === "planning" ? COLORS.vert : "transparent",
            color: view === "planning" ? "#fff" : COLORS.ardoise,
            borderColor: `${COLORS.vert}55`,
          }}
          className="flex-1 border rounded-full py-1.5 text-xs font-medium flex items-center justify-center gap-1"
        >
          <Calendar size={13} /> Planning
        </button>
        <button
          onClick={() => setView("conges")}
          style={{
            background: view === "conges" ? COLORS.vert : "transparent",
            color: view === "conges" ? "#fff" : COLORS.ardoise,
            borderColor: `${COLORS.vert}55`,
          }}
          className="flex-1 border rounded-full py-1.5 text-xs font-medium flex items-center justify-center gap-1"
        >
          <CalendarDays size={13} /> Congés
        </button>
      </div>

      {view === "conges" && (
        <CongesTab me={me} employees={employees} shifts={shifts} conges={conges} saveConges={saveConges} />
      )}

      {view === "planning" && (
        <>
      {!canManage && (
        <div style={{ color: COLORS.ardoise, background: `${COLORS.moutarde}22` }} className="text-xs rounded-lg px-3 py-2 mb-3">
          Seuls le chef et le second peuvent modifier le planning. Utilise le formulaire en bas de page pour une demande.
        </div>
      )}
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setWeekOffset(weekOffset - 1)} style={{ color: COLORS.vert }}>
          <ChevronLeft />
        </button>
        <div style={{ fontFamily: "'Poppins', sans-serif", color: COLORS.vert }} className="text-lg">
          Semaine du {weekLabel}
        </div>
        <button onClick={() => setWeekOffset(weekOffset + 1)} style={{ color: COLORS.vert }}>
          <ChevronRight />
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={exportPlanningPDF}
          style={{ borderColor: `${COLORS.vert}55`, color: COLORS.vert }}
          className="flex-1 border rounded-lg py-1.5 text-xs font-medium flex items-center justify-center gap-1"
        >
          <Printer size={12} /> PDF
        </button>
        <button
          onClick={exportPlanningExcel}
          style={{ borderColor: `${COLORS.vert}55`, color: COLORS.vert }}
          className="flex-1 border rounded-lg py-1.5 text-xs font-medium flex items-center justify-center gap-1"
        >
          <FileSpreadsheet size={12} /> Excel
        </button>
      </div>

      {JOURS.map((jour, i) => {
        const dayShifts = weekShifts.filter((s) => s.day === jour);
        return (
          <div key={jour} className="mb-3">
            <div style={{ color: COLORS.ardoise }} className="text-xs font-semibold uppercase tracking-wide opacity-60 mb-1">
              {jour} {fmtDate(weekDates[i])}
            </div>
            {dayShifts.length === 0 && (
              <div style={{ color: COLORS.ardoise }} className="text-sm opacity-40 italic py-1">
                Personne de prévu
              </div>
            )}
            {dayShifts.map((s) => (
              <Etiquette
                key={s.id}
                accent={s.employeeName === me.name ? COLORS.moutarde : COLORS.vertClair}
                className="mb-1.5 p-3 flex items-center justify-between"
              >
                <div>
                  <div style={{ color: COLORS.ardoise }} className="font-medium text-sm">
                    {s.employeeName}
                  </div>
                  <div style={{ color: COLORS.ardoise }} className="text-xs opacity-60">
                    {s.start} – {s.end}
                  </div>
                </div>
                {canManage && (
                  <button onClick={() => removeShift(s.id)} className="opacity-40 hover:opacity-100">
                    <Trash2 size={15} color={COLORS.tomate} />
                  </button>
                )}
              </Etiquette>
            ))}
          </div>
        );
      })}

      {canManage && (
        <>
          {!showForm ? (
            <button
              onClick={() => setShowForm(true)}
              style={{ borderColor: COLORS.vert, color: COLORS.vert }}
              className="w-full border-2 border-dashed rounded-xl py-3 flex items-center justify-center gap-2 text-sm font-medium mt-2"
            >
              <Plus size={16} /> Ajouter un créneau
            </button>
          ) : (
            <div style={{ background: COLORS.card }} className="rounded-xl p-4 mt-2 shadow">
              <div className="flex justify-between items-center mb-3">
                <div style={{ color: COLORS.vert }} className="font-medium text-sm">
                  Nouveau créneau
                </div>
                <button onClick={() => setShowForm(false)}>
                  <X size={16} />
                </button>
              </div>
              <select
                value={form.employeeName}
                onChange={(e) => setForm({ ...form, employeeName: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 mb-2 text-sm"
              >
                <option value={me.name}>{me.name} (moi)</option>
                {employees.filter((e) => e.name !== me.name).map((e) => (
                  <option key={e.id} value={e.name}>
                    {e.name}
                  </option>
                ))}
              </select>
              <select
                value={form.day}
                onChange={(e) => setForm({ ...form, day: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 mb-2 text-sm"
              >
                {JOURS.map((j) => (
                  <option key={j} value={j}>
                    {j}
                  </option>
                ))}
              </select>
              <div className="flex gap-2 mb-3">
                <input
                  type="time"
                  value={form.start}
                  onChange={(e) => setForm({ ...form, start: e.target.value })}
                  className="flex-1 border rounded-lg px-3 py-2 text-sm"
                />
                <input
                  type="time"
                  value={form.end}
                  onChange={(e) => setForm({ ...form, end: e.target.value })}
                  className="flex-1 border rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <button
                onClick={addShift}
                style={{ background: COLORS.vert }}
                className="w-full text-white rounded-lg py-2 text-sm font-medium"
              >
                Ajouter
              </button>
            </div>
          )}
        </>
      )}

      <RequestsSection me={me} requests={requests} saveRequests={saveRequests} canManage={canManage} />
        </>
      )}
    </div>
  );
}

const REQUEST_TYPES = ["Changement d'horaire", "Indisponibilité"];

function RequestsSection({ me, requests, saveRequests, canManage }) {
  const [type, setType] = useState(REQUEST_TYPES[0]);
  const [day, setDay] = useState(JOURS[0]);
  const [message, setMessage] = useState("");

  const submit = async () => {
    if (!message.trim()) return;
    const next = [
      {
        id: uid(),
        employeeName: me.name,
        rayon: me.rayon,
        type,
        day,
        message: message.trim(),
        date: new Date().toISOString(),
        status: "En attente",
      },
      ...requests,
    ];
    await saveRequests(next);
    setMessage("");
  };

  const setStatus = async (id, status) => {
    const next = requests.map((r) => (r.id === id ? { ...r, status } : r));
    await saveRequests(next);
  };
  const remove = async (id) => {
    await saveRequests(requests.filter((r) => r.id !== id));
  };

  const visible = canManage ? requests : requests.filter((r) => r.employeeName === me.name);
  const sorted = [...visible].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div className="mt-8">
      <div style={{ fontFamily: "'Poppins', sans-serif", color: COLORS.vert }} className="text-lg mb-3">
        {canManage ? "Demandes de l'équipe" : "Mes demandes"}
      </div>

      {!canManage && (
        <div style={{ background: COLORS.card }} className="rounded-xl p-4 mb-4 shadow-sm">
          <div className="flex gap-2 mb-2">
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="flex-1 border rounded-lg px-3 py-2 text-sm"
            >
              {REQUEST_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <select
              value={day}
              onChange={(e) => setDay(e.target.value)}
              className="flex-1 border rounded-lg px-3 py-2 text-sm"
            >
              {JOURS.map((j) => (
                <option key={j} value={j}>
                  {j}
                </option>
              ))}
            </select>
          </div>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Précise ta demande (ex: échange de créneau avec quelqu'un, absence prévue…)"
            rows={2}
            style={{ borderColor: `${COLORS.vert}33` }}
            className="w-full border rounded-lg px-3 py-2 text-sm outline-none resize-none mb-2"
          />
          <button onClick={submit} style={{ background: COLORS.vert }} className="w-full text-white rounded-lg py-2 text-sm font-medium">
            Envoyer la demande
          </button>
        </div>
      )}

      {sorted.length === 0 && (
        <div style={{ color: COLORS.ardoise }} className="text-sm opacity-40 italic">
          Aucune demande
        </div>
      )}

      {sorted.map((r) => (
        <Etiquette
          key={r.id}
          accent={r.status === "Traité" ? COLORS.vertClair : COLORS.moutarde}
          className="mb-2 p-3"
        >
          <div className="flex items-start justify-between mb-1">
            <div>
              <span style={{ color: COLORS.vert }} className="text-sm font-semibold">
                {r.type}
              </span>
              <span style={{ color: COLORS.ardoise }} className="text-xs opacity-50">
                {" "}
                · {r.day}
              </span>
            </div>
            <span
              style={{ color: r.status === "Traité" ? COLORS.vertClair : COLORS.tomate }}
              className="text-xs font-medium shrink-0"
            >
              {r.status}
            </span>
          </div>
          {canManage && (
            <div style={{ color: COLORS.ardoise }} className="text-xs opacity-60 mb-1">
              {r.employeeName} · {r.rayon}
            </div>
          )}
          <div style={{ color: COLORS.ardoise }} className="text-sm mb-2">
            {r.message}
          </div>
          {canManage && (
            <div className="flex gap-2">
              {r.status !== "Traité" && (
                <button
                  onClick={() => setStatus(r.id, "Traité")}
                  style={{ color: COLORS.vert }}
                  className="text-xs font-medium flex items-center gap-1"
                >
                  <Check size={12} /> Marquer traité
                </button>
              )}
              <button onClick={() => remove(r.id)} style={{ color: COLORS.tomate }} className="text-xs font-medium flex items-center gap-1">
                <Trash2 size={12} /> Supprimer
              </button>
            </div>
          )}
        </Etiquette>
      ))}
    </div>
  );
}

function todayJour() {
  const idx = (new Date().getDay() + 6) % 7; // 0 = Lundi ... 6 = Dimanche
  return JOURS[idx];
}

function isTaskActiveToday(task, today, jourAujourdhui) {
  if (task.type === "periodique") {
    if (task.frequency === "quotidien") return true;
    if (task.frequency === "hebdomadaire") return (task.daysOfWeek || []).includes(jourAujourdhui);
    return false;
  }
  // occasionnelle
  return task.date === today;
}

function getTaskStatus(task, taskStatuses, today) {
  const found = taskStatuses.find((s) => s.taskId === task.id && s.date === today);
  if (found) return found;
  // compat avec les anciennes tâches (avant prise/périodicité)
  if (task.done !== undefined) {
    return { taskId: task.id, date: today, claimedBy: task.doneBy || null, done: !!task.done, doneBy: task.doneBy || null };
  }
  return { taskId: task.id, date: today, claimedBy: null, done: false, doneBy: null };
}

function TachesTab({ me, tasks, saveTasks, taskStatuses, saveTaskStatuses, employees, autoOpenForm, onAutoOpenHandled }) {
  const canManage = me.role === "Chef" || me.role === "Second";
  const [showForm, setShowForm] = useState(false);
  const [label, setLabel] = useState("");
  const [rayonFilter, setRayonFilter] = useState(me.rayon === "Général" ? "Tous" : me.rayon);
  const [taskRayon, setTaskRayon] = useState(me.rayon === "Général" ? RAYONS[0] : me.rayon);
  const [type, setType] = useState("occasionnelle");
  const [date, setDate] = useState(todayKey());
  const [frequency, setFrequency] = useState("quotidien");
  const [daysOfWeek, setDaysOfWeek] = useState([]);
  const [heure, setHeure] = useState("");
  const [assignedTo, setAssignedTo] = useState([]);

  useEffect(() => {
    if (autoOpenForm) {
      setShowForm(true);
      if (onAutoOpenHandled) onAutoOpenHandled();
    }
  }, [autoOpenForm]);

  const today = todayKey();
  const jourAujourdhui = todayJour();

  const toggleDay = (j) => {
    setDaysOfWeek((prev) => (prev.includes(j) ? prev.filter((d) => d !== j) : [...prev, j]));
  };

  const toggleAssigned = (name) => {
    setAssignedTo((prev) => (prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]));
  };

  const addTask = async () => {
    if (!label.trim()) return;
    const effectiveType = canManage ? type : "occasionnelle";
    const base = {
      id: uid(),
      rayon: taskRayon,
      label: label.trim(),
      type: effectiveType,
      heure: heure || null,
      assignedTo: canManage ? assignedTo : [],
    };
    const newTask =
      effectiveType === "occasionnelle"
        ? { ...base, date }
        : { ...base, frequency, daysOfWeek: frequency === "hebdomadaire" ? daysOfWeek : [] };
    await saveTasks([...tasks, newTask]);
    setLabel("");
    setHeure("");
    setDaysOfWeek([]);
    setAssignedTo([]);
    setShowForm(false);
  };

  const removeTask = async (id) => {
    await saveTasks(tasks.filter((t) => t.id !== id));
    await saveTaskStatuses(taskStatuses.filter((s) => s.taskId !== id));
  };

  const updateStatus = async (taskId, patch) => {
    const exists = taskStatuses.some((s) => s.taskId === taskId && s.date === today);
    const next = exists
      ? taskStatuses.map((s) => (s.taskId === taskId && s.date === today ? { ...s, ...patch } : s))
      : [...taskStatuses, { taskId, date: today, claimedBy: null, done: false, doneBy: null, ...patch }];
    await saveTaskStatuses(next);
  };

  const claim = (taskId) => updateStatus(taskId, { claimedBy: me.name, claimedAt: new Date().toISOString() });
  const release = (taskId) => updateStatus(taskId, { claimedBy: null, claimedAt: null });
  const toggleDone = (taskId, current) =>
    updateStatus(taskId, { done: !current.done, doneBy: !current.done ? me.name : null });

  const dayTasks = tasks
    .filter((t) => (rayonFilter === "Tous" || t.rayon === rayonFilter) && isTaskActiveToday(t, today, jourAujourdhui))
    .map((t) => ({ ...t, status: getTaskStatus(t, taskStatuses, today) }))
    .sort((a, b) => (a.heure || "99:99").localeCompare(b.heure || "99:99"));
  const doneCount = dayTasks.filter((t) => t.status.done).length;

  return (
    <div>
      <select
        value={rayonFilter}
        onChange={(e) => setRayonFilter(e.target.value)}
        style={{ borderColor: `${COLORS.vert}33` }}
        className="w-full border rounded-lg px-3 py-2 mb-3 text-sm"
      >
        <option value="Tous">Tous les rayons</option>
        {RAYONS.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>

      <div style={{ color: COLORS.ardoise }} className="text-xs opacity-60 mb-3">
        Aujourd'hui · {doneCount}/{dayTasks.length} fait{doneCount > 1 ? "es" : ""}
      </div>

      {dayTasks.length === 0 && (
        <div style={{ color: COLORS.ardoise }} className="text-sm opacity-40 italic mb-3">
          Aucune tâche {rayonFilter === "Tous" ? "" : "pour ce rayon "}aujourd'hui
        </div>
      )}

      {dayTasks.map((t) => {
        const s = t.status;
        const isAssigned = t.assignedTo && t.assignedTo.length > 0;
        const isMine = s.claimedBy === me.name;
        const takenByOther = s.claimedBy && !isMine;
        const canInteract = isAssigned ? canManage || t.assignedTo.includes(me.name) : true;
        return (
          <Etiquette
            key={t.id}
            accent={s.done ? COLORS.vertClair : isAssigned ? COLORS.vert : takenByOther ? "#9a9186" : COLORS.moutarde}
            className="mb-2 p-3"
          >
            <div className="flex items-center gap-3">
              <button
                onClick={() => toggleDone(t.id, s)}
                disabled={isAssigned ? !canInteract && !s.done : !isMine && !s.done}
                style={{
                  background: s.done ? COLORS.vert : "transparent",
                  borderColor: s.done ? COLORS.vert : takenByOther && !isAssigned ? "#9a9186" : COLORS.vert,
                  opacity: (isAssigned ? !canInteract && !s.done : !isMine && !s.done) ? 0.4 : 1,
                }}
                className="w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0"
              >
                {s.done && <Check size={14} color="white" />}
              </button>
              <div className="flex-1">
                <div
                  style={{ color: COLORS.ardoise, textDecoration: s.done ? "line-through" : "none" }}
                  className="text-sm"
                >
                  {t.label}
                </div>
                <div style={{ color: COLORS.ardoise }} className="text-xs opacity-50 flex items-center gap-2 flex-wrap mt-0.5">
                  {t.type === "periodique" ? (
                    <span className="flex items-center gap-1">
                      <Repeat size={11} />
                      {t.frequency === "quotidien" ? "Tous les jours" : (t.daysOfWeek || []).join(", ") || "Hebdomadaire"}
                    </span>
                  ) : (
                    <span>Ponctuelle</span>
                  )}
                  {t.heure && (
                    <span className="flex items-center gap-1">
                      <Clock size={11} />
                      {t.heure}
                    </span>
                  )}
                </div>
                {s.done ? (
                  <div style={{ color: COLORS.ardoise }} className="text-xs opacity-50 mt-0.5">
                    fait par {s.doneBy}
                  </div>
                ) : isAssigned ? (
                  <div style={{ color: COLORS.vert }} className="text-xs opacity-80 mt-0.5 flex items-center gap-1">
                    <Users size={11} /> assignée à {t.assignedTo.join(", ")}
                  </div>
                ) : s.claimedBy ? (
                  <div style={{ color: isMine ? COLORS.vert : COLORS.ardoise }} className="text-xs opacity-70 mt-0.5 flex items-center gap-1">
                    <Lock size={11} /> prise par {s.claimedBy}
                  </div>
                ) : null}
              </div>
              <button onClick={() => removeTask(t.id)} className="opacity-30 hover:opacity-100 shrink-0">
                <Trash2 size={14} color={COLORS.tomate} />
              </button>
            </div>

            {!s.done && !isAssigned && (
              <div className="flex gap-2 mt-2 pl-9">
                {!s.claimedBy && (
                  <button
                    onClick={() => claim(t.id)}
                    style={{ color: COLORS.vert }}
                    className="text-xs font-medium flex items-center gap-1"
                  >
                    <Unlock size={12} /> Prendre cette tâche
                  </button>
                )}
                {isMine && (
                  <button
                    onClick={() => release(t.id)}
                    style={{ color: COLORS.ardoise }}
                    className="text-xs font-medium opacity-60"
                  >
                    Libérer
                  </button>
                )}
              </div>
            )}
          </Etiquette>
        );
      })}

      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          style={{ borderColor: COLORS.vert, color: COLORS.vert }}
          className="w-full border-2 border-dashed rounded-xl py-3 flex items-center justify-center gap-2 text-sm font-medium mt-3"
        >
          <Plus size={16} /> Nouvelle tâche
        </button>
      ) : (
        <div style={{ background: COLORS.card }} className="rounded-xl p-4 mt-3 shadow">
          <div className="flex justify-between items-center mb-3">
            <div style={{ color: COLORS.vert }} className="font-medium text-sm">
              Nouvelle tâche
            </div>
            <button onClick={() => setShowForm(false)}>
              <X size={16} />
            </button>
          </div>

          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Ex: Nettoyer la vitrine…"
            style={{ borderColor: `${COLORS.vert}33` }}
            className="w-full border rounded-lg px-3 py-2 mb-2 text-sm outline-none"
          />

          <div style={{ color: COLORS.ardoise }} className="text-xs opacity-60 mb-1">
            Rayon concerné
          </div>
          <select
            value={taskRayon}
            onChange={(e) => setTaskRayon(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 mb-2 text-sm"
          >
            {RAYONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>

          {canManage && (
            <div className="flex gap-2 mb-2">
              <button
                onClick={() => setType("occasionnelle")}
                style={{
                  background: type === "occasionnelle" ? COLORS.vert : "transparent",
                  color: type === "occasionnelle" ? "#fff" : COLORS.vert,
                  borderColor: COLORS.vert,
                }}
                className="flex-1 border rounded-lg py-2 text-xs font-medium"
              >
                Occasionnelle
              </button>
              <button
                onClick={() => setType("periodique")}
                style={{
                  background: type === "periodique" ? COLORS.vert : "transparent",
                  color: type === "periodique" ? "#fff" : COLORS.vert,
                  borderColor: COLORS.vert,
                }}
                className="flex-1 border rounded-lg py-2 text-xs font-medium"
              >
                Périodique
              </button>
            </div>
          )}
          {!canManage && (
            <div style={{ color: COLORS.ardoise, background: `${COLORS.moutarde}18` }} className="text-xs rounded-lg px-3 py-2 mb-2">
              Seuls le chef et le second peuvent créer des tâches périodiques. Ta tâche sera ponctuelle.
            </div>
          )}

          {type === "occasionnelle" ? (
            <div className="mb-2">
              <div style={{ color: COLORS.ardoise }} className="text-xs opacity-60 mb-1">
                Date
              </div>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>
          ) : (
            <div className="mb-2">
              <div style={{ color: COLORS.ardoise }} className="text-xs opacity-60 mb-1">
                Fréquence
              </div>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 mb-2 text-sm"
              >
                <option value="quotidien">Tous les jours</option>
                <option value="hebdomadaire">Certains jours de la semaine</option>
              </select>
              {frequency === "hebdomadaire" && (
                <div className="flex flex-wrap gap-1.5">
                  {JOURS.map((j) => (
                    <button
                      key={j}
                      onClick={() => toggleDay(j)}
                      style={{
                        background: daysOfWeek.includes(j) ? COLORS.vert : "transparent",
                        color: daysOfWeek.includes(j) ? "#fff" : COLORS.ardoise,
                        borderColor: `${COLORS.vert}55`,
                      }}
                      className="border rounded-full px-2.5 py-1 text-xs"
                    >
                      {j.slice(0, 3)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div style={{ color: COLORS.ardoise }} className="text-xs opacity-60 mb-1">
            Heure (optionnel)
          </div>
          <input
            type="time"
            value={heure}
            onChange={(e) => setHeure(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 mb-3 text-sm"
          />

          {canManage && (
            <div className="mb-3">
              <div style={{ color: COLORS.ardoise }} className="text-xs opacity-60 mb-1">
                Assigner à une ou plusieurs personnes (optionnel)
              </div>
              <div className="flex flex-wrap gap-1.5">
                {employees.map((e) => (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => toggleAssigned(e.name)}
                    style={{
                      background: assignedTo.includes(e.name) ? COLORS.vert : "transparent",
                      color: assignedTo.includes(e.name) ? "#fff" : COLORS.ardoise,
                      borderColor: `${COLORS.vert}55`,
                    }}
                    className="border rounded-full px-2.5 py-1 text-xs"
                  >
                    {e.name}
                  </button>
                ))}
              </div>
              {assignedTo.length === 0 && (
                <div style={{ color: COLORS.ardoise }} className="text-xs opacity-40 mt-1">
                  Personne sélectionnée = tâche ouverte à toute l'équipe du rayon.
                </div>
              )}
            </div>
          )}

          <button onClick={addTask} style={{ background: COLORS.vert }} className="w-full text-white rounded-lg py-2 text-sm font-medium">
            Ajouter
          </button>
        </div>
      )}

      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          style={{ background: COLORS.vert, boxShadow: "0 4px 14px rgba(255,56,92,0.4)" }}
          className="fixed bottom-24 right-5 z-30 w-14 h-14 rounded-full flex items-center justify-center text-white"
          aria-label="Ajouter une tâche"
        >
          <Plus size={26} />
        </button>
      )}
    </div>
  );
}

function normalizeText(name) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

const CEPAGES_INFO = {
  "grenache": {
    origine: "Espagne (Aragon) / Sud de la France",
    profil: "Fruits rouges mûrs, épices douces, garrigue",
    description:
      "Cépage roi du sud de la France, il aime la chaleur et donne des vins généreux, souples, riches en alcool et en fruit. Il apporte de la rondeur, souvent associé à la Syrah et au Mourvèdre.",
  },
  "syrah": {
    origine: "Vallée du Rhône",
    profil: "Poivre noir, violette, fruits noirs",
    description:
      "Cépage structurant à la robe sombre, il apporte tanins fermes, notes poivrées et florales. Il donne de la colonne vertébrale aux assemblages du Rhône et de Provence.",
  },
  "mourvedre": {
    origine: "Espagne / Bandol",
    profil: "Tanins puissants, garrigue, fruits noirs, cuir",
    description:
      "Cépage tardif qui a besoin de beaucoup de soleil, emblématique de Bandol. Il donne des vins tanniques et taillés pour la garde, avec des arômes de garrigue et de cuir qui s'affinent avec le temps.",
  },
  "cinsault": {
    origine: "Sud de la France",
    profil: "Fruité, léger, floral",
    description:
      "Cépage souple et peu tannique, il apporte fraîcheur et fruit aux assemblages, en particulier dans les rosés de Provence où il donne de la légèreté et des notes florales.",
  },
  "rolle": {
    origine: "Provence / Corse (aussi appelé Vermentino)",
    profil: "Agrumes, fleurs blanches, iode",
    description:
      "Cépage blanc méditerranéen à l'acidité fraîche, il donne des vins parfumés aux notes d'agrumes et de fleurs blanches, avec une pointe saline typique des terroirs côtiers.",
  },
  "vermentino": {
    origine: "Italie / Corse / Provence",
    profil: "Agrumes, fleurs blanches, iode",
    description: "Synonyme du Rolle en France. Cépage blanc méditerranéen vif et parfumé, souvent marqué par des notes salines.",
  },
  "marsanne": {
    origine: "Vallée du Rhône",
    profil: "Fruits à noyau, amande, fleurs blanches",
    description: "Cépage blanc ample et gras, il apporte des arômes d'abricot et d'amande, souvent assemblé avec la Roussanne.",
  },
  "clairette": {
    origine: "Sud de la France",
    profil: "Floral, anisé, vif",
    description: "Cépage blanc traditionnel du Midi, il donne des vins vifs aux notes florales et légèrement anisées.",
  },
  "ugni blanc": {
    origine: "Italie (Trebbiano) / Sud de la France",
    profil: "Acidité vive, discret, neutre",
    description: "Cépage blanc très cultivé, à l'acidité marquée et aux arômes discrets. Il sert aussi de base aux eaux-de-vie.",
  },
  "cabernet sauvignon": {
    origine: "Bordeaux",
    profil: "Cassis, poivron, tanins fermes",
    description: "Cépage bordelais de référence, riche en tanins, avec des arômes de cassis et de poivron vert, et une bonne aptitude au vieillissement.",
  },
  "merlot": {
    origine: "Bordeaux",
    profil: "Fruits rouges, rondeur, souplesse",
    description: "Cépage souple et charnu, il apporte rondeur et fruit aux assemblages bordelais, avec des tanins doux.",
  },
  "cabernet franc": {
    origine: "Val de Loire / Bordeaux",
    profil: "Poivron, fruits rouges, notes végétales",
    description: "Cépage aromatique aux notes de poivron et de fruits rouges frais, typique des rouges de Loire.",
  },
  "pinot noir": {
    origine: "Bourgogne",
    profil: "Fruits rouges frais, finesse, sous-bois",
    description: "Cépage délicat et élégant, à l'origine des grands rouges de Bourgogne, fin et sur le fruit rouge frais.",
  },
  "chardonnay": {
    origine: "Bourgogne",
    profil: "Pomme, beurre, silex ou vanille selon l'élevage",
    description: "Cépage blanc très polyvalent : minéral et vif en Chablis, plus beurré et vanillé avec passage en fût ailleurs en Bourgogne.",
  },
  "sauvignon blanc": {
    origine: "Val de Loire / Bordeaux",
    profil: "Agrumes, buis, fruits exotiques",
    description: "Cépage blanc aromatique et vif, aux notes de buis et d'agrumes, emblématique de Sancerre et Pouilly-Fumé.",
  },
  "chenin": {
    origine: "Val de Loire",
    profil: "Coing, miel, acidité vive",
    description: "Cépage blanc polyvalent de Loire, capable de donner des vins secs, moelleux ou effervescents.",
  },
  "gamay": {
    origine: "Beaujolais",
    profil: "Fruits rouges croquants, léger, gouleyant",
    description: "Cépage du Beaujolais, il donne des vins légers et fruités, faciles à boire.",
  },
  "carignan": {
    origine: "Espagne / Languedoc",
    profil: "Fruits noirs, rustique, tannique jeune",
    description: "Cépage méditerranéen rustique, il s'assouplit avec l'âge des vignes et donne des vins de caractère.",
  },
  "viognier": {
    origine: "Vallée du Rhône (Condrieu)",
    profil: "Abricot, fleurs blanches, ampleur",
    description: "Cépage blanc aromatique et gras, emblématique de Condrieu, aux arômes intenses d'abricot.",
  },
  "muscat": {
    origine: "Méditerranée",
    profil: "Raisin frais, floral, très aromatique",
    description: "Famille de cépages très aromatiques, utilisés en vins secs comme en vins doux naturels.",
  },
  "semillon": {
    origine: "Bordeaux",
    profil: "Cire d'abeille, fruits confits, gras",
    description: "Cépage blanc ample et gras, à la base des grands liquoreux de Sauternes comme des blancs secs bordelais.",
  },
  "nielluccio": {
    origine: "Corse",
    profil: "Fruits rouges, épices, tanins fins",
    description: "Cépage corse proche du Sangiovese, il donne des vins aux tanins fins, marqués par le fruit rouge.",
  },
  "tibouren": {
    origine: "Provence (Var)",
    profil: "Épices, garrigue, fruits rouges frais",
    description: "Cépage typiquement varois, star des rosés gastronomiques de Provence, aromatique et délicatement épicé.",
  },
};

const APPELLATIONS_INFO = {
  "bandol": {
    region: "Provence (Var)",
    description: "AOC réputée pour ses rouges de garde à base de Mourvèdre, cultivés sur des restanques face à la mer. Rosés et blancs existent aussi, mais le rouge reste la référence.",
  },
  "cassis": {
    region: "Provence (Bouches-du-Rhône)",
    description: "Petite appellation côtière connue pour ses blancs iodés et minéraux, parfaits avec les produits de la mer.",
  },
  "côtes de provence": {
    region: "Provence",
    description: "La plus vaste appellation de Provence, célèbre pour ses rosés pâles et frais, mais produit aussi des rouges et blancs de qualité.",
  },
  "coteaux varois en provence": {
    region: "Provence (Var)",
    description: "Appellation varoise d'altitude modérée, offrant des rosés frais et des rouges souples issus de Grenache, Cinsault et Syrah.",
  },
  "coteaux d'aix-en-provence": {
    region: "Provence (Bouches-du-Rhône)",
    description: "Appellation provençale aux rosés fruités et rouges méditerranéens, sur un terroir varié entre plaine et collines.",
  },
  "palette": {
    region: "Provence (Bouches-du-Rhône)",
    description: "Micro-appellation autour d'Aix-en-Provence, réputée pour ses vins de garde structurés issus d'un encépagement traditionnel très diversifié.",
  },
  "bellet": {
    region: "Provence (Alpes-Maritimes)",
    description: "Rarissime appellation niçoise en terrasses, cépages autochtones (Braquet, Folle Noire, Rolle) donnant des vins rares et typés.",
  },
  "les baux-de-provence": {
    region: "Provence (Bouches-du-Rhône)",
    description: "Appellation au pied des Alpilles, terrain de prédilection de la viticulture biologique, rouges puissants et rosés méditerranéens.",
  },
  "châteauneuf-du-pape": {
    region: "Vallée du Rhône",
    description: "Appellation prestigieuse du sud Rhône, célèbre pour ses rouges puissants et complexes, assemblages pouvant compter jusqu'à 13 cépages.",
  },
  "côte-rôtie": {
    region: "Vallée du Rhône",
    description: "Appellation nord-rhodanienne sur coteaux escarpés, 100% Syrah, vins structurés et parfumés, parmi les plus grands du Rhône.",
  },
  "condrieu": {
    region: "Vallée du Rhône",
    description: "Petite appellation blanche 100% Viognier, vins amples et aromatiques aux notes d'abricot et de fleurs blanches.",
  },
  "bordeaux": {
    region: "Bordeaux",
    description: "Vaste vignoble structuré en rive gauche (Cabernet Sauvignon dominant) et rive droite (Merlot dominant), du vin de tous les jours aux grands crus.",
  },
  "sauternes": {
    region: "Bordeaux",
    description: "Appellation de vins liquoreux issus de raisins botrytisés (pourriture noble), Sémillon et Sauvignon, vins riches et complexes de longue garde.",
  },
  "bourgogne": {
    region: "Bourgogne",
    description: "Vignoble morcelé en climats précis, Pinot Noir pour les rouges et Chardonnay pour les blancs, référence mondiale de l'expression du terroir.",
  },
  "chablis": {
    region: "Bourgogne",
    description: "Appellation blanche du nord de la Bourgogne sur sol calcaire (kimméridgien), Chardonnay vif, minéral et tendu.",
  },
  "sancerre": {
    region: "Val de Loire",
    description: "Appellation blanche de référence pour le Sauvignon Blanc, vins vifs aux notes d'agrumes et de buis ; produit aussi des rouges légers en Pinot Noir.",
  },
  "vouvray": {
    region: "Val de Loire",
    description: "Appellation à base de Chenin, déclinée en sec, demi-sec, moelleux ou effervescent selon les millésimes.",
  },
  "champagne": {
    region: "Champagne",
    description: "Vins effervescents de méthode traditionnelle, assemblage de Chardonnay, Pinot Noir et Pinot Meunier, référence mondiale du vin de fête.",
  },
  "alsace": {
    region: "Alsace",
    description: "Vignoble spécialisé dans les cépages aromatiques vinifiés en blancs secs (Riesling, Gewurztraminer, Pinot Gris, Muscat), souvent mono-cépages.",
  },
  "beaujolais": {
    region: "Beaujolais",
    description: "Vignoble 100% Gamay, vins légers et fruités souvent issus de macération carbonique, dont le célèbre Beaujolais Nouveau.",
  },
  "languedoc": {
    region: "Languedoc",
    description: "Vaste vignoble méditerranéen, cépages du Sud (Grenache, Syrah, Carignan, Mourvèdre), rouges généreux et rosés faciles à boire.",
  },
  "patrimonio": {
    region: "Corse",
    description: "Appellation corse réputée pour ses rouges de Nielluccio, structurés et épicés, ainsi que ses blancs de Vermentino.",
  },
  "ajaccio": {
    region: "Corse",
    description: "Appellation autour d'Ajaccio, cépage Sciaccarello dominant pour des rouges fins et épicés typiques du sud de la Corse.",
  },
};

function findAppellationInfo(text) {
  if (!text) return null;
  const norm = normalizeText(text);
  const key = Object.keys(APPELLATIONS_INFO).find((k) => norm.includes(k));
  return key ? APPELLATIONS_INFO[key] : null;
}

function findCepageInfo(text) {
  if (!text) return null;
  const norm = normalizeText(text);
  return CEPAGES_INFO[norm] || null;
}

function promoStatus(promo, today) {
  if (today < promo.dateDebut) return "À venir";
  if (today > promo.dateFin) return "Terminée";
  return "En cours";
}

function joursRestants(dateFin, today) {
  const diff = Math.ceil((new Date(dateFin) - new Date(today)) / (1000 * 60 * 60 * 24));
  return diff;
}

const PROMO_STATUS_COLOR = {
  "En cours": "#00A699",
  "À venir": "#FFB400",
  "Terminée": "#9A9186",
};

function PromosTab({ me, promos, savePromos, products }) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Toutes");
  const [form, setForm] = useState({
    nom: "",
    produit: "",
    reduction: "",
    conditions: "",
    dateDebut: todayKey(),
    dateFin: todayKey(),
  });

  const today = todayKey();

  const resetForm = () =>
    setForm({ nom: "", produit: "", reduction: "", conditions: "", dateDebut: today, dateFin: today });

  const openNewForm = () => {
    resetForm();
    setEditingId(null);
    setShowForm(true);
  };

  const openEditForm = (promo) => {
    setForm({
      nom: promo.nom,
      produit: promo.produit,
      reduction: promo.reduction,
      conditions: promo.conditions,
      dateDebut: promo.dateDebut,
      dateFin: promo.dateFin,
    });
    setEditingId(promo.id);
    setSelectedId(null);
    setShowForm(true);
  };

  const savePromo = async () => {
    if (!form.nom.trim() || !form.dateDebut || !form.dateFin) return;
    if (editingId) {
      const next = promos.map((p) =>
        p.id === editingId
          ? {
              ...p,
              nom: form.nom.trim(),
              produit: form.produit.trim(),
              reduction: form.reduction.trim(),
              conditions: form.conditions.trim(),
              dateDebut: form.dateDebut,
              dateFin: form.dateFin,
            }
          : p
      );
      await savePromos(next);
    } else {
      const promo = {
        id: uid(),
        nom: form.nom.trim(),
        produit: form.produit.trim(),
        reduction: form.reduction.trim(),
        conditions: form.conditions.trim(),
        dateDebut: form.dateDebut,
        dateFin: form.dateFin,
        addedBy: me.name,
      };
      await savePromos([...promos, promo]);
    }
    resetForm();
    setEditingId(null);
    setShowForm(false);
  };

  const removePromo = async (id) => {
    await savePromos(promos.filter((p) => p.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const statusOrder = { "En cours": 0, "À venir": 1, "Terminée": 2 };

  const filtered = promos
    .map((p) => ({ ...p, status: promoStatus(p, today) }))
    .filter((p) => statusFilter === "Toutes" || p.status === statusFilter)
    .filter((p) => {
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return p.nom.toLowerCase().includes(q) || p.produit.toLowerCase().includes(q);
    })
    .sort((a, b) => statusOrder[a.status] - statusOrder[b.status] || a.dateFin.localeCompare(b.dateFin));

  const selected = promos.find((p) => p.id === selectedId);
  const selectedStatus = selected ? promoStatus(selected, today) : null;
  const selectedJours = selected ? joursRestants(selected.dateFin, today) : null;

  const enCoursBientotFini = promos.filter((p) => {
    const s = promoStatus(p, today);
    return s === "En cours" && joursRestants(p.dateFin, today) <= 2;
  });

  return (
    <div>
      <div style={{ color: COLORS.ardoise }} className="text-xs opacity-60 mb-3">
        {promos.length} promotion{promos.length > 1 ? "s" : ""}
      </div>

      {enCoursBientotFini.length > 0 && (
        <div
          style={{ background: `${COLORS.tomate}18`, borderLeft: `3px solid ${COLORS.tomate}` }}
          className="rounded-lg px-3 py-2 mb-3"
        >
          <div style={{ color: COLORS.tomate }} className="text-xs font-semibold flex items-center gap-1.5 mb-1">
            <Bell size={13} /> Se terminent bientôt
          </div>
          {enCoursBientotFini.map((p) => {
            const j = joursRestants(p.dateFin, today);
            return (
              <div key={p.id} style={{ color: COLORS.ardoise }} className="text-xs">
                {p.nom} — {j <= 0 ? "se termine aujourd'hui" : `finit dans ${j} jour${j > 1 ? "s" : ""}`}
              </div>
            );
          })}
        </div>
      )}

      <div className="relative mb-2">
        <Search size={14} style={{ position: "absolute", left: 10, top: 10 }} color={COLORS.ardoise} className="opacity-40" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher une promotion, un produit…"
          style={{ borderColor: `${COLORS.vert}33` }}
          className="w-full border rounded-lg pl-8 pr-3 py-2 text-sm outline-none"
        />
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {["Toutes", "En cours", "À venir", "Terminée"].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            style={{
              background: statusFilter === s ? COLORS.vert : "transparent",
              color: statusFilter === s ? "#fff" : COLORS.ardoise,
              borderColor: `${COLORS.vert}55`,
            }}
            className="border rounded-full px-3 py-1 text-xs font-medium"
          >
            {s}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={{ color: COLORS.ardoise }} className="text-sm opacity-40 italic mb-3">
          Aucune promotion trouvée
        </div>
      )}

      {filtered.map((p) => {
        const j = joursRestants(p.dateFin, today);
        return (
          <Etiquette
            key={p.id}
            accent={PROMO_STATUS_COLOR[p.status]}
            className="mb-2 p-3"
            style={{ cursor: "pointer" }}
          >
            <div onClick={() => setSelectedId(p.id)} className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div style={{ color: COLORS.ardoise }} className="text-sm font-semibold truncate">
                  {p.nom}
                </div>
                <div style={{ color: COLORS.ardoise }} className="text-xs opacity-50 flex items-center gap-2 flex-wrap mt-0.5">
                  <span
                    style={{ background: `${PROMO_STATUS_COLOR[p.status]}22`, color: PROMO_STATUS_COLOR[p.status] }}
                    className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                  >
                    {p.status}
                  </span>
                  {p.reduction && (
                    <span style={{ color: COLORS.moutarde }} className="font-medium">
                      {p.reduction}
                    </span>
                  )}
                  {p.produit && <span>{p.produit}</span>}
                </div>
                <div style={{ color: COLORS.ardoise }} className="text-xs opacity-40 mt-0.5">
                  Jusqu'au {p.dateFin}
                  {p.status === "En cours" && j <= 2 ? ` · finit dans ${j <= 0 ? "moins d'1 jour" : j + " jour" + (j > 1 ? "s" : "")}` : ""}
                </div>
              </div>
            </div>
          </Etiquette>
        );
      })}

      {!showForm ? (
        <button
          onClick={openNewForm}
          style={{ borderColor: COLORS.vert, color: COLORS.vert }}
          className="w-full border-2 border-dashed rounded-xl py-3 flex items-center justify-center gap-2 text-sm font-medium mt-2"
        >
          <Plus size={16} /> Ajouter une promotion
        </button>
      ) : (
        <div style={{ background: COLORS.card }} className="rounded-xl p-4 mt-2 shadow">
          <div className="flex justify-between items-center mb-3">
            <div style={{ color: COLORS.vert }} className="font-medium text-sm">
              {editingId ? "Modifier la promotion" : "Nouvelle promotion"}
            </div>
            <button
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
              }}
            >
              <X size={16} />
            </button>
          </div>

          <input
            value={form.nom}
            onChange={(e) => setForm({ ...form, nom: e.target.value })}
            placeholder="Nom de la promotion (ex: Semaine des pâtes)"
            style={{ borderColor: `${COLORS.vert}33` }}
            className="w-full border rounded-lg px-3 py-2 mb-2 text-sm outline-none"
          />

          <input
            value={form.produit}
            onChange={(e) => setForm({ ...form, produit: e.target.value })}
            placeholder="Produit concerné (optionnel)"
            list="produits-suggestions"
            style={{ borderColor: `${COLORS.vert}33` }}
            className="w-full border rounded-lg px-3 py-2 mb-2 text-sm outline-none"
          />
          <datalist id="produits-suggestions">
            {products.map((prod) => (
              <option key={prod.id} value={prod.nom} />
            ))}
          </datalist>

          <input
            value={form.reduction}
            onChange={(e) => setForm({ ...form, reduction: e.target.value })}
            placeholder="Réduction (ex: -20%, 2 achetés = 1 offert…)"
            style={{ borderColor: `${COLORS.vert}33` }}
            className="w-full border rounded-lg px-3 py-2 mb-2 text-sm outline-none"
          />

          <textarea
            value={form.conditions}
            onChange={(e) => setForm({ ...form, conditions: e.target.value })}
            placeholder="Conditions (ex: dans la limite des stocks, hors carte de fidélité…)"
            rows={2}
            style={{ borderColor: `${COLORS.vert}33` }}
            className="w-full border rounded-lg px-3 py-2 mb-2 text-sm outline-none resize-none"
          />

          <div className="flex gap-2 mb-3">
            <div className="flex-1">
              <div style={{ color: COLORS.ardoise }} className="text-xs opacity-60 mb-1">
                Début
              </div>
              <input
                type="date"
                value={form.dateDebut}
                onChange={(e) => setForm({ ...form, dateDebut: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div className="flex-1">
              <div style={{ color: COLORS.ardoise }} className="text-xs opacity-60 mb-1">
                Fin
              </div>
              <input
                type="date"
                value={form.dateFin}
                onChange={(e) => setForm({ ...form, dateFin: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>

          <button onClick={savePromo} style={{ background: COLORS.vert }} className="w-full text-white rounded-lg py-2 text-sm font-medium">
            {editingId ? "Enregistrer les modifications" : "Ajouter la promotion"}
          </button>
        </div>
      )}

      {selected && (
        <div
          className="fixed inset-0 flex items-end sm:items-center justify-center z-20"
          style={{ background: "rgba(38,36,33,0.45)" }}
          onClick={() => setSelectedId(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: COLORS.creme, borderRadius: "20px 20px 0 0", maxWidth: 440 }}
            className="w-full sm:rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-start justify-between mb-1">
              <div
                style={{ background: `${PROMO_STATUS_COLOR[selectedStatus]}22`, color: PROMO_STATUS_COLOR[selectedStatus] }}
                className="px-2 py-0.5 rounded text-xs font-medium"
              >
                {selectedStatus}
              </div>
              <button onClick={() => setSelectedId(null)}>
                <X size={20} color={COLORS.ardoise} />
              </button>
            </div>

            <div style={{ fontFamily: "'Poppins', sans-serif", color: COLORS.vert }} className="text-2xl mb-1">
              {selected.nom}
            </div>

            {selected.produit && (
              <div style={{ color: COLORS.ardoise }} className="text-sm opacity-70 mb-3">
                {selected.produit}
              </div>
            )}

            {selected.reduction && (
              <div className="mb-3">
                <div style={{ color: COLORS.ardoise }} className="text-xs opacity-60">
                  Réduction
                </div>
                <div style={{ color: COLORS.moutarde }} className="text-lg font-semibold">
                  {selected.reduction}
                </div>
              </div>
            )}

            <div className="flex items-start gap-2 mb-3">
              <Clock size={14} style={{ color: COLORS.ardoise }} className="mt-0.5 opacity-60 shrink-0" />
              <div>
                <div style={{ color: COLORS.ardoise }} className="text-xs opacity-60">
                  Période
                </div>
                <div style={{ color: COLORS.ardoise }} className="text-sm">
                  Du {selected.dateDebut} au {selected.dateFin}
                </div>
                {selectedStatus === "En cours" && (
                  <div style={{ color: selectedJours <= 2 ? COLORS.tomate : COLORS.ardoise }} className="text-xs font-medium mt-0.5 flex items-center gap-1">
                    {selectedJours <= 2 && <Bell size={11} />}
                    {selectedJours <= 0 ? "Se termine aujourd'hui" : `Finit dans ${selectedJours} jour${selectedJours > 1 ? "s" : ""}`}
                  </div>
                )}
              </div>
            </div>

            {selected.conditions && (
              <div className="flex items-start gap-2 mb-4">
                <AlertTriangle size={14} style={{ color: COLORS.ardoise }} className="mt-0.5 opacity-60 shrink-0" />
                <div>
                  <div style={{ color: COLORS.ardoise }} className="text-xs opacity-60 mb-0.5">
                    Conditions
                  </div>
                  <div style={{ color: COLORS.ardoise }} className="text-sm leading-relaxed">
                    {selected.conditions}
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-2 mt-2">
              <button
                onClick={() => openEditForm(selected)}
                style={{ borderColor: COLORS.vert, color: COLORS.vert }}
                className="flex-1 border-2 rounded-lg py-2 text-sm font-medium flex items-center justify-center gap-2"
              >
                <Pencil size={14} /> Modifier
              </button>
              <button
                onClick={() => removePromo(selected.id)}
                style={{ borderColor: COLORS.tomate, color: COLORS.tomate }}
                className="flex-1 border-2 rounded-lg py-2 text-sm font-medium flex items-center justify-center gap-2"
              >
                <Trash2 size={14} /> Retirer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ScanModal({ onDetected, onClose }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [supported, setSupported] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [manualCode, setManualCode] = useState("");

  useEffect(() => {
    let interval;
    let cancelled = false;

    async function start() {
      if (typeof window === "undefined" || !("BarcodeDetector" in window)) {
        setSupported(false);
        return;
      }
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setSupported(false);
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        const detector = new window.BarcodeDetector({
          formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "code_39", "qr_code"],
        });
        interval = setInterval(async () => {
          if (!videoRef.current || cancelled) return;
          try {
            const codes = await detector.detect(videoRef.current);
            if (codes && codes.length > 0 && codes[0].rawValue) {
              onDetected(codes[0].rawValue);
            }
          } catch (e) {
            // erreur ponctuelle de détection, on continue
          }
        }, 350);
      } catch (e) {
        setErrorMsg("Impossible d'accéder à la caméra. Vérifie les autorisations dans ton navigateur.");
        setSupported(false);
      }
    }

    start();

    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    };
  }, [onDetected]);

  const submitManual = () => {
    if (!manualCode.trim()) return;
    onDetected(manualCode.trim());
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-30 p-4"
      style={{ background: "rgba(38,36,33,0.75)" }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: COLORS.creme, maxWidth: 420 }}
        className="w-full rounded-2xl p-5"
      >
        <div className="flex items-center justify-between mb-3">
          <div style={{ fontFamily: "'Poppins', sans-serif", color: COLORS.vert }} className="text-xl">
            Scanner un code-barres
          </div>
          <button onClick={onClose}>
            <X size={20} color={COLORS.ardoise} />
          </button>
        </div>

        {supported ? (
          <div style={{ background: "#000", borderRadius: 12, overflow: "hidden", aspectRatio: "4 / 3" }} className="relative mb-3">
            <video ref={videoRef} muted playsInline className="w-full h-full object-cover" />
            <div
              className="absolute inset-x-8 top-1/2 -translate-y-1/2 border-2 rounded-lg"
              style={{ borderColor: COLORS.moutarde, height: 70 }}
            />
          </div>
        ) : (
          <div
            style={{ background: `${COLORS.tomate}18`, color: COLORS.ardoise }}
            className="rounded-lg p-3 mb-3 text-xs flex items-start gap-2"
          >
            <CameraOff size={16} color={COLORS.tomate} className="shrink-0 mt-0.5" />
            <div>
              {errorMsg ||
                "Le scan caméra n'est pas disponible sur ce navigateur/appareil. Saisis le code manuellement ci-dessous."}
            </div>
          </div>
        )}

        <div style={{ color: COLORS.ardoise }} className="text-xs opacity-60 mb-1">
          Ou saisis le code manuellement
        </div>
        <div className="flex gap-2">
          <input
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitManual()}
            placeholder="Ex: 3245678901234"
            style={{ borderColor: `${COLORS.vert}33` }}
            className="flex-1 border rounded-lg px-3 py-2 text-sm outline-none"
          />
          <button onClick={submitManual} style={{ background: COLORS.vert }} className="text-white rounded-lg px-4 text-sm font-medium">
            OK
          </button>
        </div>
      </div>
    </div>
  );
}

function getProductRayons(p) {
  if (p.rayons && p.rayons.length > 0) return p.rayons;
  return p.rayon ? [p.rayon] : [];
}

function inventaireItems(session, products) {
  return session.rayon === "Tous" ? products : products.filter((p) => getProductRayons(p).includes(session.rayon));
}

function printPriceLabel(product) {
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Étiquette — ${product.nom}</title>
    <style>
      body{font-family: Arial, Helvetica, sans-serif; padding: 24px; color:#222;}
      .printBtn{background:#FF385C;color:#fff;border:none;border-radius:8px;padding:10px 16px;font-size:14px;cursor:pointer;margin-bottom:20px;}
      @media print { .printBtn { display:none; } }
      .label{border:2px solid #222; border-radius:12px; padding:20px; max-width:320px; text-align:center;}
      .nom{font-size:18px;font-weight:700;margin-bottom:6px;}
      .origine{font-size:12px;color:#555;margin-bottom:12px;}
      .prix{font-size:40px;font-weight:800;color:#C1291E;margin-bottom:8px;}
      .ref{font-size:11px;color:#888;letter-spacing:1px;}
    </style>
    </head><body>
      <button class="printBtn" onclick="window.print()">Imprimer / Enregistrer en PDF</button>
      <div class="label">
        <div class="nom">${product.nom}</div>
        ${product.origine ? `<div class="origine">${product.origine}</div>` : ""}
        <div class="prix">${product.prix || "—"}</div>
        ${product.reference ? `<div class="ref">${product.reference}</div>` : ""}
      </div>
    </body></html>`;
  const win = window.open("", "_blank");
  if (!win) {
    alert("La fenêtre n'a pas pu s'ouvrir (pop-up bloqué). Autorise les pop-ups pour cette page, puis réessaie.");
    return;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
  win.focus();
}

function printInventoryPDF(session, products) {
  const items = inventaireItems(session, products);
  const rows = items
    .map((p) => {
      const qte = session.counts?.[p.id];
      return `<tr><td>${p.nom}</td><td>${getProductRayons(p).join(", ")}</td><td>${p.reference || ""}</td><td style="text-align:right">${
        qte === undefined || qte === "" ? "—" : qte
      }</td></tr>`;
    })
    .join("");
  const dateFinLabel = session.dateFin ? new Date(session.dateFin).toLocaleString("fr-FR") : "en cours";
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Inventaire ${session.rayon}</title>
    <style>
      body{font-family: Arial, Helvetica, sans-serif; padding: 24px; color:#262421;}
      h1{font-size:20px;margin:0 0 4px;}
      .meta{font-size:12px;color:#666;margin-bottom:16px;}
      table{width:100%;border-collapse:collapse;font-size:13px;}
      th,td{border-bottom:1px solid #ddd;padding:6px 8px;text-align:left;}
      th{background:#f4f1e7;}
      .printBtn{background:#1F4D36;color:#fff;border:none;border-radius:8px;padding:10px 16px;font-size:14px;cursor:pointer;margin-bottom:16px;}
      @media print { .printBtn { display:none; } }
    </style>
    </head><body>
      <button class="printBtn" onclick="window.print()">Imprimer / Enregistrer en PDF</button>
      <h1>MyÉpicerie — Inventaire</h1>
      <div class="meta">Rayon : ${session.rayon} · Réalisé par ${session.startedBy} · terminé le ${dateFinLabel}</div>
      <table>
        <thead><tr><th>Produit</th><th>Rayon</th><th>Référence</th><th style="text-align:right">Quantité</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </body></html>`;

  const win = window.open("", "_blank");
  if (!win) {
    alert(
      "La fenêtre n'a pas pu s'ouvrir (pop-up bloqué). Autorise les pop-ups pour cette page dans ton navigateur, puis réessaie."
    );
    return;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
  win.focus();
}

function downloadInventoryExcel(session, products) {
  const items = inventaireItems(session, products);
  const data = items.map((p) => ({
    Produit: p.nom,
    Rayon: getProductRayons(p).join(", "),
    Référence: p.reference || "",
    Quantité: session.counts?.[p.id] ?? "",
  }));
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Inventaire");
  const datePart = (session.dateFin || session.dateDebut || "").slice(0, 10);
  XLSX.writeFile(wb, `inventaire-${session.rayon.replace(/\s+/g, "-")}-${datePart}.xlsx`);
}

function InventaireSetupModal({ me, products, inventaires, saveInventaires, adminCode, onEnter, onClose }) {
  const [rayonChoisi, setRayonChoisi] = useState("Tous");
  const [showHistorique, setShowHistorique] = useState(false);
  const [expandedHistId, setExpandedHistId] = useState(null);
  const [codeInput, setCodeInput] = useState("");
  const [error, setError] = useState("");

  const session = inventaires.find((iv) => iv.status === "en cours");
  const historique = inventaires
    .filter((iv) => iv.status === "terminé")
    .sort((a, b) => new Date(b.dateFin) - new Date(a.dateFin));

  const demarrer = async () => {
    setError("");
    if (!adminCode) {
      setError("Aucun code admin n'a encore été généré. Demande au chef de le générer depuis son profil.");
      return;
    }
    if (codeInput.trim() !== adminCode) {
      setError("Code admin incorrect.");
      return;
    }
    const nouvelle = {
      id: uid(),
      rayon: rayonChoisi,
      dateDebut: new Date().toISOString(),
      dateFin: null,
      startedBy: me.name,
      status: "en cours",
      counts: {},
    };
    await saveInventaires([...inventaires, nouvelle]);
    setCodeInput("");
    onEnter();
  };

  const annuler = async () => {
    await saveInventaires(inventaires.filter((iv) => iv.id !== session.id));
  };

  const produitsConcernes = session
    ? session.rayon === "Tous"
      ? products
      : products.filter((p) => getProductRayons(p).includes(session.rayon))
    : [];
  const compte = session
    ? Object.values(session.counts || {}).filter((v) => v !== undefined && v !== "").length
    : 0;

  return (
    <div
      className="fixed inset-0 flex items-end sm:items-center justify-center z-30"
      style={{ background: "rgba(38,36,33,0.6)" }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: COLORS.creme, borderRadius: "20px 20px 0 0", maxWidth: 480 }}
        className="w-full sm:rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-4">
          <div style={{ fontFamily: "'Poppins', sans-serif", color: COLORS.vert }} className="text-2xl flex items-center gap-2">
            <ClipboardList size={20} /> Inventaire
          </div>
          <button onClick={onClose}>
            <X size={20} color={COLORS.ardoise} />
          </button>
        </div>

        {!session ? (
          <>
            <div style={{ color: COLORS.ardoise }} className="text-sm mb-3">
              Choisis le périmètre à compter. L'app passera en mode scan plein écran : scanne chaque produit, entre la quantité, et passe au suivant.
            </div>
            <select
              value={rayonChoisi}
              onChange={(e) => setRayonChoisi(e.target.value)}
              style={{ borderColor: `${COLORS.vert}33` }}
              className="w-full border rounded-lg px-3 py-2 mb-3 text-sm"
            >
              <option value="Tous">Tous les rayons</option>
              {RAYONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <div style={{ color: COLORS.ardoise }} className="text-xs opacity-60 mb-1">
              Code admin du chef
            </div>
            <input
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value)}
              placeholder="Code à 6 chiffres"
              style={{ borderColor: `${COLORS.vert}33` }}
              className="w-full border rounded-lg px-3 py-2 mb-2 text-sm outline-none"
            />
            {error && (
              <div style={{ color: COLORS.tomate }} className="text-xs mb-2 flex items-center gap-1">
                <AlertTriangle size={12} /> {error}
              </div>
            )}
            <button onClick={demarrer} style={{ background: COLORS.vert }} className="w-full text-white rounded-lg py-2.5 text-sm font-medium mb-4">
              Initier un inventaire
            </button>
          </>
        ) : (
          <>
            <div
              style={{ background: `${COLORS.moutarde}18`, borderLeft: `3px solid ${COLORS.moutarde}` }}
              className="rounded-lg px-3 py-2 mb-3 text-xs"
            >
              <div style={{ color: COLORS.ardoise }}>
                <span className="font-semibold">{session.rayon}</span> · démarré par {session.startedBy}
              </div>
              <div style={{ color: COLORS.ardoise }} className="opacity-70 mt-0.5">
                {compte} / {produitsConcernes.length} produits comptés
              </div>
            </div>
            <div className="flex gap-2 mb-4">
              <button
                onClick={annuler}
                style={{ borderColor: COLORS.tomate, color: COLORS.tomate }}
                className="flex-1 border-2 rounded-lg py-2 text-sm font-medium"
              >
                Annuler l'inventaire
              </button>
              <button onClick={onEnter} style={{ background: COLORS.vert }} className="flex-1 text-white rounded-lg py-2 text-sm font-medium">
                Reprendre le scan
              </button>
            </div>
          </>
        )}

        {historique.length > 0 && (
          <div>
            <button
              onClick={() => setShowHistorique(!showHistorique)}
              style={{ color: COLORS.vert }}
              className="text-xs font-medium mb-2"
            >
              {showHistorique ? "Masquer" : "Voir"} l'historique ({historique.length})
            </button>
            {showHistorique &&
              historique.map((iv) => (
                <Etiquette key={iv.id} accent={COLORS.vertClair} className="mb-2 p-3">
                  <div
                    onClick={() => setExpandedHistId(expandedHistId === iv.id ? null : iv.id)}
                    className="flex items-center justify-between cursor-pointer"
                  >
                    <div>
                      <div style={{ color: COLORS.ardoise }} className="text-sm font-medium">
                        {iv.rayon}
                      </div>
                      <div style={{ color: COLORS.ardoise }} className="text-xs opacity-60">
                        {new Date(iv.dateFin).toLocaleDateString("fr-FR")} · par {iv.startedBy} ·{" "}
                        {Object.keys(iv.counts || {}).length} produit
                        {Object.keys(iv.counts || {}).length > 1 ? "s" : ""} compté
                        {Object.keys(iv.counts || {}).length > 1 ? "s" : ""}
                      </div>
                    </div>
                  </div>
                  {expandedHistId === iv.id && (
                    <div className="mt-2 pt-2" style={{ borderTop: `1px solid ${COLORS.vert}22` }}>
                      {Object.entries(iv.counts || {}).map(([pid, qte]) => {
                        const prod = products.find((p) => p.id === pid);
                        return (
                          <div key={pid} style={{ color: COLORS.ardoise }} className="text-xs flex justify-between py-0.5">
                            <span>{prod ? prod.nom : "Produit supprimé"}</span>
                            <span className="font-medium">{qte}</span>
                          </div>
                        );
                      })}
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => printInventoryPDF(iv, products)}
                          style={{ borderColor: `${COLORS.vert}55`, color: COLORS.vert }}
                          className="flex-1 border rounded-lg py-1.5 text-xs font-medium flex items-center justify-center gap-1"
                        >
                          <Printer size={12} /> PDF
                        </button>
                        <button
                          onClick={() => downloadInventoryExcel(iv, products)}
                          style={{ borderColor: `${COLORS.vert}55`, color: COLORS.vert }}
                          className="flex-1 border rounded-lg py-1.5 text-xs font-medium flex items-center justify-center gap-1"
                        >
                          <FileSpreadsheet size={12} /> Excel
                        </button>
                      </div>
                    </div>
                  )}
                </Etiquette>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

function InventoryScanScreen({ me, products, session, saveInventaires, inventaires, onExit }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const pausedRef = useRef(false);
  const [cameraSupported, setCameraSupported] = useState(true);
  const [cameraError, setCameraError] = useState("");
  const [detectedCode, setDetectedCode] = useState(null);
  const [matchedProduct, setMatchedProduct] = useState(null);
  const [quantity, setQuantity] = useState("");
  const [manualCode, setManualCode] = useState("");

  const produitsConcernes =
    session.rayon === "Tous" ? products : products.filter((p) => getProductRayons(p).includes(session.rayon));
  const compte = Object.values(session.counts || {}).filter((v) => v !== undefined && v !== "").length;

  const handleCode = useCallback(
    (code) => {
      if (pausedRef.current) return;
      pausedRef.current = true;
      const trimmed = code.trim();
      const match = products.find((p) => p.reference && p.reference.trim() === trimmed);
      setDetectedCode(trimmed);
      setMatchedProduct(match || null);
      setQuantity(match ? String(session.counts?.[match.id] ?? "") : "");
    },
    [products, session]
  );

  useEffect(() => {
    let interval;
    let cancelled = false;

    async function start() {
      if (typeof window === "undefined" || !("BarcodeDetector" in window) || !navigator.mediaDevices?.getUserMedia) {
        setCameraSupported(false);
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        const detector = new window.BarcodeDetector({
          formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "code_39", "qr_code"],
        });
        interval = setInterval(async () => {
          if (!videoRef.current || cancelled || pausedRef.current) return;
          try {
            const codes = await detector.detect(videoRef.current);
            if (codes && codes.length > 0 && codes[0].rawValue) {
              handleCode(codes[0].rawValue);
            }
          } catch (e) {
            // erreur ponctuelle, on continue
          }
        }, 350);
      } catch (e) {
        setCameraError("Impossible d'accéder à la caméra. Vérifie les autorisations.");
        setCameraSupported(false);
      }
    }

    start();
    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    };
  }, [handleCode]);

  const reprendreLeScan = () => {
    setDetectedCode(null);
    setMatchedProduct(null);
    setQuantity("");
    setManualCode("");
    pausedRef.current = false;
  };

  const submitManualCode = () => {
    if (!manualCode.trim()) return;
    handleCode(manualCode.trim());
  };

  const validerQuantite = async () => {
    if (!matchedProduct) return;
    const next = inventaires.map((iv) =>
      iv.id === session.id ? { ...iv, counts: { ...iv.counts, [matchedProduct.id]: quantity } } : iv
    );
    await saveInventaires(next);
    reprendreLeScan();
  };

  const terminer = async () => {
    const dateFin = new Date().toISOString();
    const terminedSession = { ...session, status: "terminé", dateFin };
    const next = inventaires.map((iv) => (iv.id === session.id ? terminedSession : iv));
    await saveInventaires(next);
    try {
      printInventoryPDF(terminedSession, products);
    } catch (e) {
      // impression indisponible, on continue sans bloquer
    }
    try {
      downloadInventoryExcel(terminedSession, products);
    } catch (e) {
      // export indisponible, on continue sans bloquer
    }
    onExit();
  };

  return (
    <div className="fixed inset-0 z-40 flex flex-col" style={{ background: COLORS.creme }}>
      <style>{FONT_IMPORT}</style>
      <div style={{ background: COLORS.vert }} className="text-white px-4 pt-4 pb-3 shrink-0">
        <div className="flex items-center justify-between mb-1">
          <button onClick={onExit} className="flex items-center gap-1 text-sm opacity-90">
            <ChevronLeft size={18} /> Quitter
          </button>
          <button onClick={terminer} style={{ background: COLORS.moutarde }} className="text-xs font-medium rounded-lg px-3 py-1.5">
            Terminer l'inventaire
          </button>
        </div>
        <div style={{ fontFamily: "'Poppins', sans-serif" }} className="text-xl flex items-center gap-2">
          <ClipboardList size={18} /> {session.rayon}
        </div>
        <div className="text-xs opacity-80 mt-0.5">
          {compte} / {produitsConcernes.length} produits comptés
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {cameraSupported ? (
          <div style={{ background: "#000", borderRadius: 12, overflow: "hidden", aspectRatio: "4 / 3" }} className="relative mb-4">
            <video ref={videoRef} muted playsInline className="w-full h-full object-cover" />
            {!matchedProduct && detectedCode === null && (
              <div
                className="absolute inset-x-8 top-1/2 -translate-y-1/2 border-2 rounded-lg"
                style={{ borderColor: COLORS.moutarde, height: 70 }}
              />
            )}
          </div>
        ) : (
          <div
            style={{ background: `${COLORS.tomate}18`, color: COLORS.ardoise }}
            className="rounded-lg p-3 mb-4 text-xs flex items-start gap-2"
          >
            <CameraOff size={16} color={COLORS.tomate} className="shrink-0 mt-0.5" />
            <div>{cameraError || "Le scan caméra n'est pas disponible sur cet appareil. Saisis les codes manuellement ci-dessous."}</div>
          </div>
        )}

        {detectedCode !== null && matchedProduct && (
          <Etiquette accent={COLORS.vert} className="p-4 mb-4">
            <div style={{ color: COLORS.ardoise }} className="text-xs opacity-60 mb-1">
              Produit scanné
            </div>
            <div style={{ fontFamily: "'Poppins', sans-serif", color: COLORS.vert }} className="text-xl mb-3">
              {matchedProduct.nom}
            </div>
            <div style={{ color: COLORS.ardoise }} className="text-xs opacity-60 mb-1">
              Quantité comptée
            </div>
            <div className="flex gap-2">
              <input
                type="number"
                inputMode="numeric"
                autoFocus
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && validerQuantite()}
                placeholder="0"
                style={{ borderColor: `${COLORS.vert}33` }}
                className="flex-1 border rounded-lg px-3 py-2 text-lg text-center outline-none"
              />
              <button onClick={validerQuantite} style={{ background: COLORS.vert }} className="text-white rounded-lg px-5 text-sm font-medium">
                Valider
              </button>
            </div>
          </Etiquette>
        )}

        {detectedCode !== null && !matchedProduct && (
          <div
            style={{ background: `${COLORS.tomate}18`, borderLeft: `3px solid ${COLORS.tomate}` }}
            className="rounded-lg p-3 mb-4"
          >
            <div style={{ color: COLORS.ardoise }} className="text-sm mb-2">
              Aucune fiche produit pour le code <span className="font-mono">{detectedCode}</span>.
            </div>
            <button onClick={reprendreLeScan} style={{ background: COLORS.vert }} className="text-white rounded-lg px-4 py-1.5 text-xs font-medium">
              Réessayer
            </button>
          </div>
        )}

        <div style={{ color: COLORS.ardoise }} className="text-xs opacity-60 mb-1">
          Ou saisis le code manuellement
        </div>
        <div className="flex gap-2 mb-4">
          <input
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitManualCode()}
            placeholder="Ex: 3245678901234"
            style={{ borderColor: `${COLORS.vert}33` }}
            className="flex-1 border rounded-lg px-3 py-2 text-sm outline-none"
          />
          <button onClick={submitManualCode} style={{ background: COLORS.vert }} className="text-white rounded-lg px-4 text-sm font-medium">
            OK
          </button>
        </div>
      </div>
    </div>
  );
}

function ProduitsTab({ me, products, saveProducts, inventaires, saveInventaires, onEnterInventoryMode, adminCode, tasks, saveTasks }) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState("");
  const [rayonFilter, setRayonFilter] = useState("Tous");
  const [showScan, setShowScan] = useState(false);
  const [scanNotice, setScanNotice] = useState("");
  const [showInventaire, setShowInventaire] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [etiquetteNotice, setEtiquetteNotice] = useState("");
  const [form, setForm] = useState({
    nom: "",
    rayons: [RAYONS[0]],
    reference: "",
    prix: "",
    origine: "",
    allergenes: "",
    description: "",
    dlc: "",
  });

  const resetForm = () =>
    setForm({ nom: "", rayons: [RAYONS[0]], reference: "", prix: "", origine: "", allergenes: "", description: "", dlc: "" });

  const toggleFormRayon = (r) => {
    setForm((f) => ({
      ...f,
      rayons: f.rayons.includes(r) ? f.rayons.filter((x) => x !== r) : [...f.rayons, r],
    }));
  };

  const handleScanDetected = useCallback(
    (code) => {
      setShowScan(false);
      const match = products.find((p) => p.reference && p.reference.trim() === code.trim());
      if (match) {
        setScanNotice("");
        setSelectedId(match.id);
      } else {
        resetForm();
        setForm((f) => ({ ...f, reference: code }));
        setEditingId(null);
        setShowForm(true);
        setScanNotice("Aucune fiche pour ce code — référence pré-remplie, complète la fiche produit.");
      }
    },
    [products]
  );

  const openNewForm = () => {
    resetForm();
    setEditingId(null);
    setShowForm(true);
  };

  const openEditForm = (product) => {
    setForm({
      nom: product.nom,
      rayons: getProductRayons(product),
      reference: product.reference,
      prix: product.prix,
      origine: product.origine,
      allergenes: product.allergenes,
      description: product.description,
      dlc: product.dlc || "",
    });
    setEditingId(product.id);
    setSelectedId(null);
    setShowForm(true);
  };

  const CHAMPS_LABELS = {
    nom: "Nom",
    reference: "Référence",
    prix: "Prix",
    origine: "Origine",
    allergenes: "Allergènes",
    description: "Description",
    dlc: "DLC",
  };

  const saveProduct = async () => {
    if (!form.nom.trim() || form.rayons.length === 0) return;
    if (editingId) {
      const next = products.map((p) => {
        if (p.id !== editingId) return p;
        const updated = {
          ...p,
          nom: form.nom.trim(),
          rayons: form.rayons,
          reference: form.reference.trim(),
          prix: form.prix.trim(),
          origine: form.origine.trim(),
          allergenes: form.allergenes.trim(),
          description: form.description.trim(),
          dlc: form.dlc || "",
        };
        delete updated.rayon;
        const changes = Object.keys(CHAMPS_LABELS)
          .filter((champ) => (p[champ] || "") !== (updated[champ] || ""))
          .map((champ) => ({ champ: CHAMPS_LABELS[champ], avant: p[champ] || "—", apres: updated[champ] || "—" }));
        const oldRayons = getProductRayons(p).join(", ");
        const newRayons = form.rayons.join(", ");
        if (oldRayons !== newRayons) {
          changes.push({ champ: "Rayons", avant: oldRayons || "—", apres: newRayons || "—" });
        }
        if (changes.length > 0) {
          updated.history = [...(p.history || []), { date: new Date().toISOString(), author: me.name, changes }];
        }
        return updated;
      });
      await saveProducts(next);
    } else {
      const product = {
        id: uid(),
        nom: form.nom.trim(),
        rayons: form.rayons,
        reference: form.reference.trim(),
        prix: form.prix.trim(),
        origine: form.origine.trim(),
        allergenes: form.allergenes.trim(),
        description: form.description.trim(),
        dlc: form.dlc || "",
        addedBy: me.name,
        history: [],
      };
      await saveProducts([...products, product]);
    }
    resetForm();
    setEditingId(null);
    setShowForm(false);
  };

  const removeProduct = async (id) => {
    await saveProducts(products.filter((p) => p.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const demanderImpressionEtiquette = async (product) => {
    const rayonsProduit = getProductRayons(product);
    const nouvelleTache = {
      id: uid(),
      rayon: rayonsProduit[0] || RAYONS[0],
      label: `Imprimer étiquette : ${product.nom}`,
      type: "occasionnelle",
      date: todayKey(),
      heure: null,
      assignedTo: [],
    };
    await saveTasks([...tasks, nouvelleTache]);
    setEtiquetteNotice("Demande ajoutée dans les tâches.");
    setTimeout(() => setEtiquetteNotice(""), 3000);
  };

  const filtered = products
    .filter((p) => rayonFilter === "Tous" || getProductRayons(p).includes(rayonFilter))
    .filter((p) => {
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return (
        p.nom.toLowerCase().includes(q) ||
        p.reference.toLowerCase().includes(q) ||
        p.origine.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => a.nom.localeCompare(b.nom));

  const selected = products.find((p) => p.id === selectedId);

  const today = todayKey();
  const dlcAlertes = products.filter((p) => p.dlc && joursRestants(p.dlc, today) <= 3);

  return (
    <div>
      <div style={{ color: COLORS.ardoise }} className="text-xs opacity-60 mb-3">
        {products.length} produit{products.length > 1 ? "s" : ""} référencé{products.length > 1 ? "s" : ""}
      </div>

      {dlcAlertes.length > 0 && (
        <div
          style={{ background: `${COLORS.tomate}18`, borderLeft: `3px solid ${COLORS.tomate}` }}
          className="rounded-lg px-3 py-2 mb-3"
        >
          <div style={{ color: COLORS.tomate }} className="text-xs font-semibold flex items-center gap-1.5 mb-1">
            <AlertTriangle size={13} /> DLC à surveiller
          </div>
          {dlcAlertes.map((p) => {
            const j = joursRestants(p.dlc, today);
            return (
              <div key={p.id} style={{ color: COLORS.ardoise }} className="text-xs">
                {p.nom} — {j < 0 ? "DLC dépassée" : j === 0 ? "DLC aujourd'hui" : `DLC dans ${j} jour${j > 1 ? "s" : ""}`}
              </div>
            );
          })}
        </div>
      )}

      {scanNotice && (
        <div
          style={{ background: `${COLORS.moutarde}18`, borderLeft: `3px solid ${COLORS.moutarde}` }}
          className="rounded-lg px-3 py-2 mb-3 flex items-start justify-between gap-2"
        >
          <div style={{ color: COLORS.ardoise }} className="text-xs">
            {scanNotice}
          </div>
          <button onClick={() => setScanNotice("")} className="shrink-0">
            <X size={13} color={COLORS.ardoise} />
          </button>
        </div>
      )}

      <div className="flex gap-2 mb-2">
        <div className="relative flex-1">
          <Search size={14} style={{ position: "absolute", left: 10, top: 10 }} color={COLORS.ardoise} className="opacity-40" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un produit, une référence, une origine…"
            style={{ borderColor: `${COLORS.vert}33` }}
            className="w-full border rounded-lg pl-8 pr-3 py-2 text-sm outline-none"
          />
        </div>
        <button
          onClick={() => setShowScan(true)}
          style={{ background: COLORS.vert }}
          className="text-white rounded-lg px-3 flex items-center justify-center shrink-0"
          aria-label="Scanner un code-barres"
        >
          <ScanLine size={18} />
        </button>
      </div>

      <select
        value={rayonFilter}
        onChange={(e) => setRayonFilter(e.target.value)}
        style={{ borderColor: `${COLORS.vert}33` }}
        className="w-full border rounded-lg px-2 py-1.5 text-xs mb-3"
      >
        <option value="Tous">Tous les rayons</option>
        {RAYONS.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>

      <button
        onClick={() => setShowInventaire(true)}
        style={{ borderColor: `${COLORS.vert}55`, color: COLORS.vert }}
        className="w-full border-2 rounded-lg py-2 flex items-center justify-center gap-2 text-sm font-medium mb-3"
      >
        <ClipboardList size={16} /> Initier un inventaire
      </button>

      {filtered.length === 0 && (
        <div style={{ color: COLORS.ardoise }} className="text-sm opacity-40 italic mb-3">
          Aucun produit trouvé
        </div>
      )}

      {filtered.map((p) => (
        <Etiquette
          key={p.id}
          accent={COLORS.vert}
          className="mb-2 p-3"
          style={{ cursor: "pointer" }}
        >
          <div onClick={() => setSelectedId(p.id)} className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div style={{ color: COLORS.ardoise }} className="text-sm font-semibold truncate">
                {p.nom}
              </div>
              <div style={{ color: COLORS.ardoise }} className="text-xs opacity-50 flex items-center gap-2 flex-wrap mt-0.5">
                {getProductRayons(p).map((r) => (
                  <span
                    key={r}
                    style={{ background: `${COLORS.vert}18`, color: COLORS.vert }}
                    className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                  >
                    {r}
                  </span>
                ))}
                {p.reference && (
                  <span className="flex items-center gap-1">
                    <Barcode size={11} /> {p.reference}
                  </span>
                )}
                {p.prix && (
                  <span style={{ color: COLORS.moutarde }} className="font-medium">
                    {p.prix}
                  </span>
                )}
              </div>
            </div>
          </div>
        </Etiquette>
      ))}

      {!showForm ? (
        <button
          onClick={openNewForm}
          style={{ borderColor: COLORS.vert, color: COLORS.vert }}
          className="w-full border-2 border-dashed rounded-xl py-3 flex items-center justify-center gap-2 text-sm font-medium mt-2"
        >
          <Plus size={16} /> Ajouter un produit
        </button>
      ) : (
        <div style={{ background: COLORS.card }} className="rounded-xl p-4 mt-2 shadow">
          <div className="flex justify-between items-center mb-3">
            <div style={{ color: COLORS.vert }} className="font-medium text-sm">
              {editingId ? "Modifier le produit" : "Nouveau produit"}
            </div>
            <button
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
              }}
            >
              <X size={16} />
            </button>
          </div>

          <input
            value={form.nom}
            onChange={(e) => setForm({ ...form, nom: e.target.value })}
            placeholder="Nom du produit"
            style={{ borderColor: `${COLORS.vert}33` }}
            className="w-full border rounded-lg px-3 py-2 mb-2 text-sm outline-none"
          />

          <div style={{ color: COLORS.ardoise }} className="text-xs opacity-60 mb-1">
            Rayons (sélection multiple)
          </div>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {RAYONS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => toggleFormRayon(r)}
                style={{
                  background: form.rayons.includes(r) ? COLORS.vert : "transparent",
                  color: form.rayons.includes(r) ? "#fff" : COLORS.ardoise,
                  borderColor: `${COLORS.vert}55`,
                }}
                className="border rounded-full px-2.5 py-1 text-xs"
              >
                {r}
              </button>
            ))}
          </div>
          {form.rayons.length === 0 && (
            <div style={{ color: COLORS.tomate }} className="text-xs mb-2">
              Choisis au moins un rayon.
            </div>
          )}

          <div className="flex gap-2 mb-2">
            <input
              value={form.reference}
              onChange={(e) => setForm({ ...form, reference: e.target.value })}
              placeholder="Référence / code-barres"
              style={{ borderColor: `${COLORS.vert}33` }}
              className="flex-1 border rounded-lg px-3 py-2 text-sm outline-none"
            />
            <input
              value={form.prix}
              onChange={(e) => setForm({ ...form, prix: e.target.value })}
              placeholder="Prix"
              style={{ borderColor: `${COLORS.vert}33` }}
              className="flex-1 border rounded-lg px-3 py-2 text-sm outline-none"
            />
          </div>

          <input
            value={form.origine}
            onChange={(e) => setForm({ ...form, origine: e.target.value })}
            placeholder="Origine / provenance (optionnel)"
            style={{ borderColor: `${COLORS.vert}33` }}
            className="w-full border rounded-lg px-3 py-2 mb-2 text-sm outline-none"
          />

          <input
            value={form.allergenes}
            onChange={(e) => setForm({ ...form, allergenes: e.target.value })}
            placeholder="Allergènes (optionnel)"
            style={{ borderColor: `${COLORS.vert}33` }}
            className="w-full border rounded-lg px-3 py-2 mb-2 text-sm outline-none"
          />

          <div style={{ color: COLORS.ardoise }} className="text-xs opacity-60 mb-1">
            DLC (optionnel)
          </div>
          <input
            type="date"
            value={form.dlc}
            onChange={(e) => setForm({ ...form, dlc: e.target.value })}
            className="w-full border rounded-lg px-3 py-2 mb-2 text-sm"
          />

          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Description / conseil de vente…"
            rows={2}
            style={{ borderColor: `${COLORS.vert}33` }}
            className="w-full border rounded-lg px-3 py-2 mb-3 text-sm outline-none resize-none"
          />

          <button onClick={saveProduct} style={{ background: COLORS.vert }} className="w-full text-white rounded-lg py-2 text-sm font-medium">
            {editingId ? "Enregistrer les modifications" : "Ajouter le produit"}
          </button>
        </div>
      )}

      {selected && (
        <div
          className="fixed inset-0 flex items-center justify-center z-20 p-4"
          style={{ background: "rgba(38,36,33,0.55)" }}
          onClick={() => setSelectedId(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: COLORS.creme, borderRadius: 20, maxWidth: 440 }}
            className="w-full p-6 max-h-[85vh] overflow-y-auto shadow-2xl"
          >
            <div className="flex items-start justify-between mb-1">
              <div className="flex flex-wrap gap-1">
                {getProductRayons(selected).map((r) => (
                  <div
                    key={r}
                    style={{ background: `${COLORS.vert}18`, color: COLORS.vert }}
                    className="px-2 py-0.5 rounded text-xs font-medium"
                  >
                    {r}
                  </div>
                ))}
              </div>
              <button onClick={() => setSelectedId(null)}>
                <X size={20} color={COLORS.ardoise} />
              </button>
            </div>

            <div style={{ fontFamily: "'Poppins', sans-serif", color: COLORS.vert }} className="text-2xl mb-3">
              {selected.nom}
            </div>

            {selected.reference && (
              <div className="flex items-start gap-2 mb-2">
                <Barcode size={14} style={{ color: COLORS.ardoise }} className="mt-0.5 opacity-60 shrink-0" />
                <div>
                  <div style={{ color: COLORS.ardoise }} className="text-xs opacity-60">
                    Référence
                  </div>
                  <div style={{ color: COLORS.ardoise }} className="text-sm">
                    {selected.reference}
                  </div>
                </div>
              </div>
            )}

            {selected.origine && (
              <div className="flex items-start gap-2 mb-2">
                <MapPin size={14} style={{ color: COLORS.ardoise }} className="mt-0.5 opacity-60 shrink-0" />
                <div>
                  <div style={{ color: COLORS.ardoise }} className="text-xs opacity-60">
                    Origine
                  </div>
                  <div style={{ color: COLORS.ardoise }} className="text-sm">
                    {selected.origine}
                  </div>
                </div>
              </div>
            )}

            {selected.prix && (
              <div className="mb-2">
                <div style={{ color: COLORS.ardoise }} className="text-xs opacity-60">
                  Prix
                </div>
                <div style={{ color: COLORS.moutarde }} className="text-sm font-medium">
                  {selected.prix}
                </div>
              </div>
            )}

            {selected.allergenes && (
              <div className="flex items-start gap-2 mb-2">
                <AlertTriangle size={14} style={{ color: COLORS.tomate }} className="mt-0.5 shrink-0" />
                <div>
                  <div style={{ color: COLORS.ardoise }} className="text-xs opacity-60">
                    Allergènes
                  </div>
                  <div style={{ color: COLORS.ardoise }} className="text-sm">
                    {selected.allergenes}
                  </div>
                </div>
              </div>
            )}

            {selected.dlc && (
              <div className="flex items-start gap-2 mb-2">
                <Clock size={14} style={{ color: joursRestants(selected.dlc, today) <= 3 ? COLORS.tomate : COLORS.ardoise }} className="mt-0.5 shrink-0" />
                <div>
                  <div style={{ color: COLORS.ardoise }} className="text-xs opacity-60">
                    DLC
                  </div>
                  <div style={{ color: joursRestants(selected.dlc, today) <= 3 ? COLORS.tomate : COLORS.ardoise }} className="text-sm font-medium">
                    {selected.dlc}
                  </div>
                </div>
              </div>
            )}

            {selected.description && (
              <div className="flex items-start gap-2 mb-4 mt-3">
                <Tag size={14} style={{ color: COLORS.ardoise }} className="mt-0.5 opacity-60 shrink-0" />
                <div>
                  <div style={{ color: COLORS.ardoise }} className="text-xs opacity-60 mb-0.5">
                    Description
                  </div>
                  <div style={{ color: COLORS.ardoise }} className="text-sm leading-relaxed">
                    {selected.description}
                  </div>
                </div>
              </div>
            )}

            {selected.history && selected.history.length > 0 && (
              <div className="mb-3">
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  style={{ color: COLORS.vert }}
                  className="text-xs font-medium flex items-center gap-1"
                >
                  <History size={12} /> {showHistory ? "Masquer" : "Voir"} l'historique des modifications ({selected.history.length})
                </button>
                {showHistory && (
                  <div className="mt-2 space-y-2">
                    {[...selected.history].reverse().map((h, i) => (
                      <div key={i} style={{ background: "#F7F7F7", borderRadius: 10 }} className="p-2">
                        <div style={{ color: COLORS.ardoise }} className="text-xs opacity-60 mb-1">
                          {h.author} · {new Date(h.date).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </div>
                        {h.changes.map((c, j) => (
                          <div key={j} style={{ color: COLORS.ardoise }} className="text-xs">
                            <span className="font-medium">{c.champ}</span> : {c.avant} → {c.apres}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <button
              onClick={() => demanderImpressionEtiquette(selected)}
              style={{ borderColor: `${COLORS.vert}55`, color: COLORS.vert }}
              className="w-full border rounded-lg py-2 text-sm font-medium flex items-center justify-center gap-2 mb-2"
            >
              <Tags size={14} /> Demander l'impression de l'étiquette
            </button>
            {etiquetteNotice && (
              <div style={{ color: COLORS.vertClair }} className="text-xs text-center mb-2">
                {etiquetteNotice}
              </div>
            )}

            <div className="flex gap-2 mt-2">
              <button
                onClick={() => openEditForm(selected)}
                style={{ borderColor: COLORS.vert, color: COLORS.vert }}
                className="flex-1 border-2 rounded-lg py-2 text-sm font-medium flex items-center justify-center gap-2"
              >
                <Pencil size={14} /> Modifier
              </button>
              <button
                onClick={() => removeProduct(selected.id)}
                style={{ borderColor: COLORS.tomate, color: COLORS.tomate }}
                className="flex-1 border-2 rounded-lg py-2 text-sm font-medium flex items-center justify-center gap-2"
              >
                <Trash2 size={14} /> Retirer
              </button>
            </div>
          </div>
        </div>
      )}

      {showScan && <ScanModal onDetected={handleScanDetected} onClose={() => setShowScan(false)} />}
      {showInventaire && (
        <InventaireSetupModal
          me={me}
          products={products}
          inventaires={inventaires}
          saveInventaires={saveInventaires}
          adminCode={adminCode}
          onEnter={() => {
            setShowInventaire(false);
            onEnterInventoryMode();
          }}
          onClose={() => setShowInventaire(false)}
        />
      )}
    </div>
  );
}



const COULEURS_VIN = ["Rouge", "Blanc", "Gris", "Rosé"];

const REGIONS_VIN = [
  "Provence",
  "Vallée du Rhône",
  "Bordeaux",
  "Bourgogne",
  "Val de Loire",
  "Champagne",
  "Alsace",
  "Beaujolais",
  "Languedoc",
  "Sud-Ouest",
  "Jura / Savoie",
  "Corse",
  "Autre",
];

const COULEUR_ACCENT = {
  Rouge: "#7A2333",
  Blanc: "#C9A227",
  Gris: "#9A9186",
  Rosé: "#D98098",
};

function CaveTab({ me, wines, saveWines }) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState("");
  const [couleurFilter, setCouleurFilter] = useState("Toutes");
  const [regionFilter, setRegionFilter] = useState("Toutes");
  const [sortBy, setSortBy] = useState("nom");
  const [infoCepage, setInfoCepage] = useState(null);
  const [infoAppellation, setInfoAppellation] = useState(null);
  const [form, setForm] = useState({
    nom: "",
    couleur: "Rouge",
    region: REGIONS_VIN[0],
    origine: "",
    cepage: "",
    prix: "",
    conseil: "",
  });

  const resetForm = () =>
    setForm({ nom: "", couleur: "Rouge", region: REGIONS_VIN[0], origine: "", cepage: "", prix: "", conseil: "" });

  const openNewForm = () => {
    resetForm();
    setEditingId(null);
    setShowForm(true);
  };

  const openEditForm = (wine) => {
    setForm({
      nom: wine.nom,
      couleur: wine.couleur,
      region: wine.region || REGIONS_VIN[0],
      origine: wine.origine,
      cepage: wine.cepage,
      prix: wine.prix,
      conseil: wine.conseil,
    });
    setEditingId(wine.id);
    setSelectedId(null);
    setShowForm(true);
  };

  const saveWine = async () => {
    if (!form.nom.trim()) return;
    if (editingId) {
      const next = wines.map((w) =>
        w.id === editingId
          ? {
              ...w,
              nom: form.nom.trim(),
              couleur: form.couleur,
              region: form.region,
              origine: form.origine.trim(),
              cepage: form.cepage.trim(),
              prix: form.prix.trim(),
              conseil: form.conseil.trim(),
            }
          : w
      );
      await saveWines(next);
    } else {
      const wine = {
        id: uid(),
        nom: form.nom.trim(),
        couleur: form.couleur,
        region: form.region,
        origine: form.origine.trim(),
        cepage: form.cepage.trim(),
        prix: form.prix.trim(),
        conseil: form.conseil.trim(),
        addedBy: me.name,
      };
      await saveWines([...wines, wine]);
    }
    resetForm();
    setEditingId(null);
    setShowForm(false);
  };

  const removeWine = async (id) => {
    await saveWines(wines.filter((w) => w.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const filtered = wines
    .filter((w) => couleurFilter === "Toutes" || w.couleur === couleurFilter)
    .filter((w) => regionFilter === "Toutes" || w.region === regionFilter)
    .filter((w) => {
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return (
        w.nom.toLowerCase().includes(q) ||
        w.origine.toLowerCase().includes(q) ||
        w.cepage.toLowerCase().includes(q) ||
        (w.region || "").toLowerCase().includes(q)
      );
    })
    .sort((a, b) =>
      sortBy === "region"
        ? (a.region || "").localeCompare(b.region || "") || a.nom.localeCompare(b.nom)
        : a.nom.localeCompare(b.nom)
    );

  const selected = wines.find((w) => w.id === selectedId);

  return (
    <div>
      <div style={{ color: COLORS.ardoise }} className="text-xs opacity-60 mb-3">
        {wines.length} vin{wines.length > 1 ? "s" : ""} dans la cave
      </div>

      <div className="relative mb-2">
        <Search size={14} style={{ position: "absolute", left: 10, top: 10 }} color={COLORS.ardoise} className="opacity-40" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un vin, une origine, un cépage…"
          style={{ borderColor: `${COLORS.vert}33` }}
          className="w-full border rounded-lg pl-8 pr-3 py-2 text-sm outline-none"
        />
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {["Toutes", ...COULEURS_VIN].map((c) => (
          <button
            key={c}
            onClick={() => setCouleurFilter(c)}
            style={{
              background: couleurFilter === c ? COLORS.vert : "transparent",
              color: couleurFilter === c ? "#fff" : COLORS.ardoise,
              borderColor: `${COLORS.vert}55`,
            }}
            className="border rounded-full px-3 py-1 text-xs font-medium"
          >
            {c}
          </button>
        ))}
      </div>

      <div className="flex gap-2 mb-3">
        <select
          value={regionFilter}
          onChange={(e) => setRegionFilter(e.target.value)}
          style={{ borderColor: `${COLORS.vert}33` }}
          className="flex-1 border rounded-lg px-2 py-1.5 text-xs"
        >
          <option value="Toutes">Toutes les régions</option>
          {REGIONS_VIN.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          style={{ borderColor: `${COLORS.vert}33` }}
          className="flex-1 border rounded-lg px-2 py-1.5 text-xs"
        >
          <option value="nom">Trier par nom</option>
          <option value="region">Trier par région</option>
        </select>
      </div>

      {filtered.length === 0 && (
        <div style={{ color: COLORS.ardoise }} className="text-sm opacity-40 italic mb-3">
          Aucun vin trouvé
        </div>
      )}

      {filtered.map((w) => (
        <Etiquette
          key={w.id}
          accent={COULEUR_ACCENT[w.couleur] || COLORS.vert}
          className="mb-2 p-3"
          style={{ cursor: "pointer" }}
        >
          <div onClick={() => setSelectedId(w.id)} className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div style={{ color: COLORS.ardoise }} className="text-sm font-semibold truncate">
                {w.nom}
              </div>
              <div style={{ color: COLORS.ardoise }} className="text-xs opacity-50 flex items-center gap-2 flex-wrap mt-0.5">
                <span
                  style={{ background: `${COULEUR_ACCENT[w.couleur]}22`, color: COULEUR_ACCENT[w.couleur] }}
                  className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                >
                  {w.couleur}
                </span>
                {w.region && (
                  <span style={{ color: COLORS.moutarde }} className="text-[10px] font-medium uppercase tracking-wide">
                    {w.region}
                  </span>
                )}
                {w.origine && (
                  <span className="flex items-center gap-1">
                    <MapPin size={11} /> {w.origine}
                  </span>
                )}
                {w.cepage && (
                  <span className="flex items-center gap-1">
                    <Grape size={11} /> {w.cepage}
                  </span>
                )}
              </div>
            </div>
          </div>
        </Etiquette>
      ))}

      {!showForm ? (
        <button
          onClick={openNewForm}
          style={{ borderColor: COLORS.vert, color: COLORS.vert }}
          className="w-full border-2 border-dashed rounded-xl py-3 flex items-center justify-center gap-2 text-sm font-medium mt-2"
        >
          <Plus size={16} /> Ajouter un vin
        </button>
      ) : (
        <div style={{ background: COLORS.card }} className="rounded-xl p-4 mt-2 shadow">
          <div className="flex justify-between items-center mb-3">
            <div style={{ color: COLORS.vert }} className="font-medium text-sm">
              {editingId ? "Modifier le vin" : "Nouveau vin"}
            </div>
            <button
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
              }}
            >
              <X size={16} />
            </button>
          </div>

          <input
            value={form.nom}
            onChange={(e) => setForm({ ...form, nom: e.target.value })}
            placeholder="Nom du vin / domaine"
            style={{ borderColor: `${COLORS.vert}33` }}
            className="w-full border rounded-lg px-3 py-2 mb-2 text-sm outline-none"
          />

          <select
            value={form.couleur}
            onChange={(e) => setForm({ ...form, couleur: e.target.value })}
            className="w-full border rounded-lg px-3 py-2 mb-2 text-sm"
          >
            {COULEURS_VIN.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={form.region}
            onChange={(e) => setForm({ ...form, region: e.target.value })}
            className="w-full border rounded-lg px-3 py-2 mb-2 text-sm"
          >
            {REGIONS_VIN.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>

          <input
            value={form.origine}
            onChange={(e) => setForm({ ...form, origine: e.target.value })}
            placeholder="Origine (ex: Bandol, Côtes de Provence…)"
            style={{ borderColor: `${COLORS.vert}33` }}
            className="w-full border rounded-lg px-3 py-2 mb-2 text-sm outline-none"
          />

          <input
            value={form.cepage}
            onChange={(e) => setForm({ ...form, cepage: e.target.value })}
            placeholder="Cépage(s) (ex: Mourvèdre, Grenache…)"
            style={{ borderColor: `${COLORS.vert}33` }}
            className="w-full border rounded-lg px-3 py-2 mb-2 text-sm outline-none"
          />

          <input
            value={form.prix}
            onChange={(e) => setForm({ ...form, prix: e.target.value })}
            placeholder="Prix (ex: 18,90 €)"
            style={{ borderColor: `${COLORS.vert}33` }}
            className="w-full border rounded-lg px-3 py-2 mb-2 text-sm outline-none"
          />

          <textarea
            value={form.conseil}
            onChange={(e) => setForm({ ...form, conseil: e.target.value })}
            placeholder="Conseil culinaire (accords mets-vins…)"
            rows={2}
            style={{ borderColor: `${COLORS.vert}33` }}
            className="w-full border rounded-lg px-3 py-2 mb-3 text-sm outline-none resize-none"
          />

          <button onClick={saveWine} style={{ background: COLORS.vert }} className="w-full text-white rounded-lg py-2 text-sm font-medium">
            {editingId ? "Enregistrer les modifications" : "Ajouter à la cave"}
          </button>
        </div>
      )}

      {selected && (
        <div
          className="fixed inset-0 flex items-end sm:items-center justify-center z-20"
          style={{ background: "rgba(38,36,33,0.45)" }}
          onClick={() => setSelectedId(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: COLORS.creme, borderRadius: "20px 20px 0 0", maxWidth: 440 }}
            className="w-full sm:rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-start justify-between mb-1">
              <div
                style={{ background: `${COULEUR_ACCENT[selected.couleur]}22`, color: COULEUR_ACCENT[selected.couleur] }}
                className="px-2 py-0.5 rounded text-xs font-medium"
              >
                {selected.couleur}
              </div>
              <button onClick={() => setSelectedId(null)}>
                <X size={20} color={COLORS.ardoise} />
              </button>
            </div>

            <div style={{ fontFamily: "'Poppins', sans-serif", color: COLORS.vert }} className="text-2xl mb-3">
              {selected.nom}
            </div>

            {selected.region && (
              <div style={{ color: COLORS.moutarde }} className="text-xs font-medium uppercase tracking-wide mb-2">
                {selected.region}
              </div>
            )}

            {selected.origine && (
              <div className="flex items-start gap-2 mb-2">
                <MapPin size={14} style={{ color: COLORS.ardoise }} className="mt-0.5 opacity-60 shrink-0" />
                <div>
                  <div style={{ color: COLORS.ardoise }} className="text-xs opacity-60">
                    Origine
                  </div>
                  <button
                    onClick={() => setInfoAppellation(selected.origine)}
                    className="text-sm underline decoration-dotted underline-offset-2 text-left"
                    style={{ color: COLORS.vert }}
                  >
                    {selected.origine}
                  </button>
                </div>
              </div>
            )}

            {selected.cepage && (
              <div className="flex items-start gap-2 mb-2">
                <Grape size={14} style={{ color: COLORS.ardoise }} className="mt-0.5 opacity-60 shrink-0" />
                <div>
                  <div style={{ color: COLORS.ardoise }} className="text-xs opacity-60 mb-0.5">
                    Cépage
                  </div>
                  <div className="flex flex-wrap gap-x-1.5 gap-y-0.5">
                    {selected.cepage.split(",").map((c, i) => {
                      const trimmed = c.trim();
                      if (!trimmed) return null;
                      return (
                        <button
                          key={i}
                          onClick={() => setInfoCepage(trimmed)}
                          className="text-sm underline decoration-dotted underline-offset-2"
                          style={{ color: COLORS.vert }}
                        >
                          {trimmed}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {selected.prix && (
              <div className="mb-2">
                <div style={{ color: COLORS.ardoise }} className="text-xs opacity-60">
                  Prix
                </div>
                <div style={{ color: COLORS.moutarde }} className="text-sm font-medium">
                  {selected.prix}
                </div>
              </div>
            )}

            {selected.conseil && (
              <div className="flex items-start gap-2 mb-4 mt-3">
                <UtensilsCrossed size={14} style={{ color: COLORS.ardoise }} className="mt-0.5 opacity-60 shrink-0" />
                <div>
                  <div style={{ color: COLORS.ardoise }} className="text-xs opacity-60 mb-0.5">
                    Conseil culinaire
                  </div>
                  <div style={{ color: COLORS.ardoise }} className="text-sm leading-relaxed">
                    {selected.conseil}
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-2 mt-2">
              <button
                onClick={() => openEditForm(selected)}
                style={{ borderColor: COLORS.vert, color: COLORS.vert }}
                className="flex-1 border-2 rounded-lg py-2 text-sm font-medium flex items-center justify-center gap-2"
              >
                <Pencil size={14} /> Modifier
              </button>
              <button
                onClick={() => removeWine(selected.id)}
                style={{ borderColor: COLORS.tomate, color: COLORS.tomate }}
                className="flex-1 border-2 rounded-lg py-2 text-sm font-medium flex items-center justify-center gap-2"
              >
                <Trash2 size={14} /> Retirer
              </button>
            </div>
          </div>
        </div>
      )}

      {infoCepage && (
        <InfoModal
          icon={Grape}
          title={infoCepage}
          badge={findCepageInfo(infoCepage)?.origine ? `Origine : ${findCepageInfo(infoCepage).origine}` : null}
          subtitle={findCepageInfo(infoCepage)?.profil ? `Profil aromatique : ${findCepageInfo(infoCepage).profil}` : null}
          description={
            findCepageInfo(infoCepage)?.description ||
            "Pas encore de fiche pour ce cépage — tu peux enrichir le conseil culinaire du vin en attendant."
          }
          onClose={() => setInfoCepage(null)}
        />
      )}

      {infoAppellation && (
        <InfoModal
          icon={MapPin}
          title={infoAppellation}
          badge={findAppellationInfo(infoAppellation)?.region ? `Région : ${findAppellationInfo(infoAppellation).region}` : null}
          description={
            findAppellationInfo(infoAppellation)?.description ||
            "Pas encore de fiche pour cette origine — n'hésite pas à compléter la description du vin en attendant."
          }
          onClose={() => setInfoAppellation(null)}
        />
      )}
    </div>
  );
}

function InfoModal({ icon: Icon, title, badge, subtitle, description, onClose }) {
  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center p-4"
      style={{ background: "rgba(38,36,33,0.55)" }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: COLORS.card, color: COLORS.ardoise, maxWidth: 400 }}
        className="rounded-xl p-6 w-full relative shadow-lg"
      >
        <button onClick={onClose} className="absolute top-4 right-4 opacity-50 hover:opacity-100">
          <X size={18} />
        </button>
        <div className="flex items-center gap-2 mb-1">
          <Icon size={16} style={{ color: COLORS.vert }} />
          {badge && (
            <span style={{ color: COLORS.vert }} className="text-[11px] uppercase tracking-wider font-medium">
              {badge}
            </span>
          )}
        </div>
        <div style={{ fontFamily: "'Poppins', sans-serif", color: COLORS.vert }} className="text-2xl capitalize mb-2">
          {title}
        </div>
        {subtitle && (
          <div style={{ color: COLORS.ardoise }} className="text-xs opacity-60 mb-3">
            {subtitle}
          </div>
        )}
        <p className="text-sm leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

const MONTHS_FR = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

function daysInMonth(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function firstWeekdayOffset(year, monthIndex) {
  const d = new Date(year, monthIndex, 1).getDay();
  return d === 0 ? 6 : d - 1;
}

function dateInRange(dateStr, start, end) {
  return dateStr >= start && dateStr <= end;
}

function suggererRemplacants(demande, employees, conges) {
  return employees.filter((e) => {
    if (e.name === demande.employeeName || e.rayon !== demande.rayon) return false;
    const dejaAbsent = conges.some(
      (c) =>
        c.id !== demande.id &&
        c.employeeName === e.name &&
        c.status === "Validé" &&
        c.dateDebut <= demande.dateFin &&
        c.dateFin >= demande.dateDebut
    );
    return !dejaAbsent;
  });
}

function CongesTab({ me, employees, shifts, conges, saveConges }) {
  const canManage = me.role === "Chef" || me.role === "Second";
  const [dateDebut, setDateDebut] = useState(todayKey());
  const [dateFin, setDateFin] = useState(todayKey());
  const [motif, setMotif] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [year, setYear] = useState(new Date().getFullYear());

  const soumettre = async () => {
    if (!dateDebut || !dateFin || dateFin < dateDebut) return;
    const demande = {
      id: uid(),
      employeeName: me.name,
      rayon: me.rayon,
      dateDebut,
      dateFin,
      motif: motif.trim(),
      status: "En attente",
      createdAt: new Date().toISOString(),
    };
    await saveConges([...conges, demande]);
    setMotif("");
    setShowForm(false);
  };

  const setStatus = async (id, status) => {
    await saveConges(conges.map((c) => (c.id === id ? { ...c, status } : c)));
  };

  const supprimer = async (id) => {
    await saveConges(conges.filter((c) => c.id !== id));
  };

  const visibles = canManage ? conges : conges.filter((c) => c.employeeName === me.name);
  const sorted = [...visibles].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const congesValides = conges.filter((c) => c.status === "Validé");

  return (
    <div>
      <div style={{ fontFamily: "'Poppins', sans-serif", color: COLORS.ardoise }} className="text-lg font-bold mb-3">
        Congés
      </div>

      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          style={{ borderColor: COLORS.vert, color: COLORS.vert }}
          className="w-full border-2 border-dashed rounded-xl py-3 flex items-center justify-center gap-2 text-sm font-medium mb-5"
        >
          <Plus size={16} /> Demander un congé
        </button>
      ) : (
        <div style={{ background: COLORS.card, border: "1px solid #EBEBEB" }} className="rounded-2xl p-4 mb-5">
          <div className="flex justify-between items-center mb-3">
            <div style={{ color: COLORS.vert }} className="font-medium text-sm">
              Nouvelle demande
            </div>
            <button onClick={() => setShowForm(false)}>
              <X size={16} />
            </button>
          </div>
          <div className="flex gap-2 mb-2">
            <div className="flex-1">
              <div style={{ color: COLORS.ardoise }} className="text-xs opacity-60 mb-1">
                Du
              </div>
              <input
                type="date"
                value={dateDebut}
                onChange={(e) => setDateDebut(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div className="flex-1">
              <div style={{ color: COLORS.ardoise }} className="text-xs opacity-60 mb-1">
                Au
              </div>
              <input
                type="date"
                value={dateFin}
                onChange={(e) => setDateFin(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>
          <textarea
            value={motif}
            onChange={(e) => setMotif(e.target.value)}
            placeholder="Motif (optionnel)"
            rows={2}
            style={{ borderColor: "#EBEBEB" }}
            className="w-full border rounded-lg px-3 py-2 mb-3 text-sm outline-none resize-none"
          />
          <button onClick={soumettre} style={{ background: COLORS.vert }} className="w-full text-white rounded-lg py-2 text-sm font-medium">
            Envoyer la demande
          </button>
        </div>
      )}

      <div style={{ color: COLORS.ardoise }} className="text-xs font-semibold uppercase tracking-wide opacity-50 mb-2">
        {canManage ? "Demandes de l'équipe" : "Mes demandes"}
      </div>

      {sorted.length === 0 && (
        <div style={{ color: COLORS.ardoise }} className="text-sm opacity-40 italic mb-5">
          Aucune demande
        </div>
      )}

      {sorted.map((c) => {
        const remplacants = c.status === "En attente" ? suggererRemplacants(c, employees, conges) : [];
        return (
          <Etiquette
            key={c.id}
            accent={c.status === "Validé" ? COLORS.vertClair : c.status === "Refusé" ? COLORS.tomate : COLORS.moutarde}
            className="mb-2 p-3"
          >
            <div className="flex items-start justify-between mb-1">
              <div>
                <div style={{ color: COLORS.ardoise }} className="text-sm font-medium">
                  {c.dateDebut} → {c.dateFin}
                </div>
                {canManage && (
                  <div style={{ color: COLORS.ardoise }} className="text-xs opacity-60">
                    {c.employeeName} · {c.rayon}
                  </div>
                )}
                {c.motif && (
                  <div style={{ color: COLORS.ardoise }} className="text-xs opacity-70 mt-0.5">
                    {c.motif}
                  </div>
                )}
              </div>
              <span
                style={{
                  color: c.status === "Validé" ? COLORS.vertClair : c.status === "Refusé" ? COLORS.tomate : COLORS.moutarde,
                }}
                className="text-xs font-medium shrink-0"
              >
                {c.status}
              </span>
            </div>

            {canManage && c.status === "En attente" && remplacants.length > 0 && (
              <div style={{ color: COLORS.ardoise }} className="text-xs opacity-70 mt-1 flex items-start gap-1">
                <ArrowLeftRight size={12} className="mt-0.5 shrink-0" />
                Remplaçants possibles : {remplacants.map((r) => r.name).join(", ")}
              </div>
            )}

            {canManage && c.status === "En attente" && (
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => setStatus(c.id, "Validé")}
                  style={{ color: COLORS.vertClair }}
                  className="text-xs font-medium flex items-center gap-1"
                >
                  <Check size={12} /> Valider
                </button>
                <button
                  onClick={() => setStatus(c.id, "Refusé")}
                  style={{ color: COLORS.tomate }}
                  className="text-xs font-medium flex items-center gap-1"
                >
                  <X size={12} /> Refuser
                </button>
              </div>
            )}
            {(c.employeeName === me.name || canManage) && (
              <button
                onClick={() => supprimer(c.id)}
                style={{ color: COLORS.ardoise }}
                className="text-xs font-medium opacity-50 mt-2"
              >
                Supprimer
              </button>
            )}
          </Etiquette>
        );
      })}

      <div className="flex items-center justify-between mt-6 mb-3">
        <button onClick={() => setYear(year - 1)} style={{ color: COLORS.vert }}>
          <ChevronLeft size={18} />
        </button>
        <div style={{ fontFamily: "'Poppins', sans-serif", color: COLORS.ardoise }} className="text-sm font-semibold">
          Calendrier des congés validés — {year}
        </div>
        <button onClick={() => setYear(year + 1)} style={{ color: COLORS.vert }}>
          <ChevronRight size={18} />
        </button>
      </div>

      {MONTHS_FR.map((moisNom, monthIndex) => {
        const total = daysInMonth(year, monthIndex);
        const offset = firstWeekdayOffset(year, monthIndex);
        const cells = [...Array(offset).fill(null), ...Array.from({ length: total }, (_, i) => i + 1)];
        return (
          <div key={moisNom} className="mb-3">
            <div style={{ color: COLORS.ardoise }} className="text-xs font-medium opacity-70 mb-1">
              {moisNom}
            </div>
            <div className="grid grid-cols-7 gap-0.5">
              {cells.map((day, i) => {
                if (day === null) return <div key={`empty-${i}`} />;
                const dateStr = `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const enConge = congesValides.some((c) => dateInRange(dateStr, c.dateDebut, c.dateFin));
                return (
                  <div
                    key={dateStr}
                    style={{
                      background: enConge ? COLORS.vert : "transparent",
                      color: enConge ? "#fff" : COLORS.ardoise,
                    }}
                    className="text-[9px] rounded flex items-center justify-center aspect-square"
                  >
                    {day}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AnnoncesTab({ me, announcements, saveAnnouncements }) {
  const [text, setText] = useState("");
  const [important, setImportant] = useState(false);

  const post = async () => {
    if (!text.trim()) return;
    const next = [
      { id: uid(), author: me.name, rayon: me.rayon, text: text.trim(), date: new Date().toISOString(), important },
      ...announcements,
    ];
    await saveAnnouncements(next);
    setText("");
    setImportant(false);
  };
  const remove = async (id) => {
    await saveAnnouncements(announcements.filter((a) => a.id !== id));
  };

  const sorted = [...announcements].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div>
      <div style={{ background: COLORS.card }} className="rounded-xl p-4 shadow mb-4">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Écrire une annonce pour l'équipe…"
          rows={3}
          style={{ borderColor: `${COLORS.vert}33` }}
          className="w-full border rounded-lg px-3 py-2 text-sm outline-none resize-none mb-2"
        />
        <div className="flex items-center justify-between">
          <label style={{ color: COLORS.ardoise }} className="flex items-center gap-1.5 text-xs">
            <input type="checkbox" checked={important} onChange={(e) => setImportant(e.target.checked)} />
            Important
          </label>
          <button onClick={post} style={{ background: COLORS.vert }} className="text-white rounded-lg px-4 py-1.5 text-sm font-medium">
            Publier
          </button>
        </div>
      </div>

      {sorted.length === 0 && (
        <div style={{ color: COLORS.ardoise }} className="text-sm opacity-40 italic">
          Aucune annonce
        </div>
      )}

      {sorted.map((a) => (
        <Etiquette key={a.id} accent={a.important ? COLORS.tomate : COLORS.vertClair} className="mb-2 p-3">
          <div className="flex items-start justify-between mb-1">
            <div className="flex items-center gap-1.5">
              {a.important && <AlertTriangle size={13} color={COLORS.tomate} />}
              <span style={{ color: COLORS.vert }} className="text-sm font-semibold">
                {a.author}
              </span>
              <span style={{ color: COLORS.ardoise }} className="text-xs opacity-50">
                · {a.rayon}
              </span>
            </div>
            {a.author === me.name && (
              <button onClick={() => remove(a.id)} className="opacity-30 hover:opacity-100">
                <X size={14} />
              </button>
            )}
          </div>
          <div style={{ color: COLORS.ardoise }} className="text-sm mb-1">
            {a.text}
          </div>
          <div style={{ color: COLORS.ardoise }} className="text-xs opacity-40">
            {new Date(a.date).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
          </div>
        </Etiquette>
      ))}
    </div>
  );
}

const ROLE_BADGE_COLOR = {
  Chef: "#FFB400",
  Second: "#00A699",
  Employé: "#717171",
};

function EquipeTab({ employees }) {
  const [selectedId, setSelectedId] = useState(null);
  const selected = employees.find((e) => e.id === selectedId);

  return (
    <div>
      {employees.length === 0 && (
        <div style={{ color: COLORS.ardoise }} className="text-sm opacity-40 italic">
          Personne n'a encore rejoint l'appli
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {employees.map((p) => (
          <button
            key={p.id}
            onClick={() => setSelectedId(p.id)}
            style={{ background: COLORS.card, borderLeft: `3px solid ${COLORS.vert}` }}
            className="px-3 py-1.5 rounded-lg text-sm text-left flex items-center gap-1"
          >
            {p.role === "Chef" && <Crown size={12} color={COLORS.moutarde} />}
            <span style={{ color: COLORS.ardoise }}>{p.name}</span>
          </button>
        ))}
      </div>

      {selected && (
        <div
          className="fixed inset-0 flex items-end sm:items-center justify-center z-20"
          style={{ background: "rgba(38,36,33,0.45)" }}
          onClick={() => setSelectedId(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: COLORS.creme, borderRadius: "20px 20px 0 0", maxWidth: 400 }}
            className="w-full sm:rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-start justify-between mb-4">
              <div
                style={{
                  background: `${ROLE_BADGE_COLOR[selected.role || "Employé"]}22`,
                  color: ROLE_BADGE_COLOR[selected.role || "Employé"],
                }}
                className="px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1"
              >
                {selected.role === "Chef" && <Crown size={12} />}
                {selected.role || "Employé"}
              </div>
              <button onClick={() => setSelectedId(null)}>
                <X size={20} color={COLORS.ardoise} />
              </button>
            </div>

            <div style={{ fontFamily: "'Poppins', sans-serif", color: COLORS.vert }} className="text-2xl mb-4">
              {selected.name}
            </div>

            {selected.telephone && (
              <div className="flex items-start gap-2">
                <Phone size={14} style={{ color: COLORS.ardoise }} className="mt-0.5 opacity-60 shrink-0" />
                <div>
                  <div style={{ color: COLORS.ardoise }} className="text-xs opacity-60">
                    Téléphone
                  </div>
                  <a href={`tel:${selected.telephone.replace(/\s/g, "")}`} style={{ color: COLORS.vert }} className="text-sm underline decoration-dotted underline-offset-2">
                    {selected.telephone}
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function SuiviEquipeTab({ employees, tasks, taskStatuses }) {
  const [selectedTask, setSelectedTask] = useState(null);
  const today = todayKey();
  const jourAujourdhui = todayJour();

  const tachesActives = tasks
    .filter((t) => isTaskActiveToday(t, today, jourAujourdhui))
    .map((t) => ({ ...t, status: getTaskStatus(t, taskStatuses, today) }));

  return (
    <div>
      <div style={{ color: COLORS.ardoise }} className="text-xs opacity-60 mb-4">
        Qui fait quoi aujourd'hui, et dans quel rayon
      </div>

      {employees.length === 0 && (
        <div style={{ color: COLORS.ardoise }} className="text-sm opacity-40 italic">
          Personne n'a encore rejoint l'appli
        </div>
      )}

      {employees.map((e) => {
        const mesTaches = tachesActives.filter(
          (t) => (t.assignedTo && t.assignedTo.includes(e.name)) || t.status.claimedBy === e.name
        );
        return (
          <Etiquette key={e.id} accent={COLORS.vert} className="mb-2 p-3">
            <div className="flex items-center justify-between mb-1.5">
              <div style={{ color: COLORS.ardoise }} className="text-sm font-medium flex items-center gap-1">
                {e.role === "Chef" && <Crown size={12} color={COLORS.moutarde} />}
                {e.name}
              </div>
              <span
                style={{ background: `${COLORS.vert}18`, color: COLORS.vert }}
                className="text-[10px] font-medium px-2 py-0.5 rounded"
              >
                {e.rayon || "—"}
              </span>
            </div>
            {mesTaches.length === 0 ? (
              <div style={{ color: COLORS.ardoise }} className="text-xs opacity-40 italic">
                Aucune tâche prise aujourd'hui
              </div>
            ) : (
              mesTaches.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTask(t)}
                  className="w-full text-xs flex items-center justify-between py-1 text-left"
                >
                  <span
                    style={{ color: COLORS.vert, textDecoration: t.status.done ? "line-through" : "none" }}
                    className="opacity-90 underline decoration-dotted underline-offset-2"
                  >
                    {t.label}
                  </span>
                  <span style={{ color: t.status.done ? COLORS.vertClair : COLORS.moutarde }} className="font-medium shrink-0 ml-2">
                    {t.status.done ? "Fait" : "En cours"}
                  </span>
                </button>
              ))
            )}
          </Etiquette>
        );
      })}

      {selectedTask && (
        <div
          className="fixed inset-0 flex items-center justify-center z-20 p-4"
          style={{ background: "rgba(38,36,33,0.55)" }}
          onClick={() => setSelectedTask(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: COLORS.creme, borderRadius: 20, maxWidth: 400 }}
            className="w-full p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between mb-3">
              <span
                style={{
                  background: `${selectedTask.status.done ? COLORS.vertClair : COLORS.moutarde}22`,
                  color: selectedTask.status.done ? COLORS.vertClair : COLORS.moutarde,
                }}
                className="px-2 py-0.5 rounded text-xs font-medium"
              >
                {selectedTask.status.done ? "Fait" : "En cours"}
              </span>
              <button onClick={() => setSelectedTask(null)}>
                <X size={20} color={COLORS.ardoise} />
              </button>
            </div>

            <div style={{ fontFamily: "'Poppins', sans-serif", color: COLORS.vert }} className="text-xl mb-4">
              {selectedTask.label}
            </div>

            <div className="space-y-2.5">
              <div className="flex items-start gap-2">
                <MapPin size={14} style={{ color: COLORS.ardoise }} className="mt-0.5 opacity-60 shrink-0" />
                <div>
                  <div style={{ color: COLORS.ardoise }} className="text-xs opacity-60">
                    Rayon
                  </div>
                  <div style={{ color: COLORS.ardoise }} className="text-sm">
                    {selectedTask.rayon}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2">
                {selectedTask.type === "periodique" ? (
                  <Repeat size={14} style={{ color: COLORS.ardoise }} className="mt-0.5 opacity-60 shrink-0" />
                ) : (
                  <Calendar size={14} style={{ color: COLORS.ardoise }} className="mt-0.5 opacity-60 shrink-0" />
                )}
                <div>
                  <div style={{ color: COLORS.ardoise }} className="text-xs opacity-60">
                    Fréquence
                  </div>
                  <div style={{ color: COLORS.ardoise }} className="text-sm">
                    {selectedTask.type === "periodique"
                      ? selectedTask.frequency === "quotidien"
                        ? "Tous les jours"
                        : (selectedTask.daysOfWeek || []).join(", ") || "Hebdomadaire"
                      : "Ponctuelle"}
                  </div>
                </div>
              </div>

              {selectedTask.heure && (
                <div className="flex items-start gap-2">
                  <Clock size={14} style={{ color: COLORS.ardoise }} className="mt-0.5 opacity-60 shrink-0" />
                  <div>
                    <div style={{ color: COLORS.ardoise }} className="text-xs opacity-60">
                      Heure
                    </div>
                    <div style={{ color: COLORS.ardoise }} className="text-sm">
                      {selectedTask.heure}
                    </div>
                  </div>
                </div>
              )}

              {selectedTask.assignedTo && selectedTask.assignedTo.length > 0 && (
                <div className="flex items-start gap-2">
                  <Users size={14} style={{ color: COLORS.ardoise }} className="mt-0.5 opacity-60 shrink-0" />
                  <div>
                    <div style={{ color: COLORS.ardoise }} className="text-xs opacity-60">
                      Assignée à
                    </div>
                    <div style={{ color: COLORS.ardoise }} className="text-sm">
                      {selectedTask.assignedTo.join(", ")}
                    </div>
                  </div>
                </div>
              )}

              {selectedTask.status.done ? (
                <div className="flex items-start gap-2">
                  <Check size={14} style={{ color: COLORS.vertClair }} className="mt-0.5 shrink-0" />
                  <div>
                    <div style={{ color: COLORS.ardoise }} className="text-xs opacity-60">
                      Faite par
                    </div>
                    <div style={{ color: COLORS.ardoise }} className="text-sm">
                      {selectedTask.status.doneBy}
                    </div>
                  </div>
                </div>
              ) : selectedTask.status.claimedBy ? (
                <div className="flex items-start gap-2">
                  <Lock size={14} style={{ color: COLORS.ardoise }} className="mt-0.5 opacity-60 shrink-0" />
                  <div>
                    <div style={{ color: COLORS.ardoise }} className="text-xs opacity-60">
                      Prise par
                    </div>
                    <div style={{ color: COLORS.ardoise }} className="text-sm">
                      {selectedTask.status.claimedBy}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ChefMasterTab({ employees, saveEmployees, adminCode, saveAdminCode, products, inventaires, tasks, taskStatuses }) {
  const [view, setView] = useState("comptes");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nom: "", rayon: RAYONS[0], role: "Employé", password: "", passwordConfirm: "" });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [codeRevealed, setCodeRevealed] = useState(false);

  const resetForm = () => setForm({ nom: "", rayon: RAYONS[0], role: "Employé", password: "", passwordConfirm: "" });

  const creerCompte = async () => {
    setError("");
    setMessage("");
    const nom = form.nom.trim();
    if (!nom || !form.password) {
      setError("Prénom et mot de passe requis.");
      return;
    }
    if (employees.some((e) => e.name.toLowerCase() === nom.toLowerCase())) {
      setError("Ce prénom est déjà utilisé.");
      return;
    }
    if (form.password !== form.passwordConfirm) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }
    const pwdHash = await hashPassword(form.password);
    const nouveau = {
      id: uid(),
      name: nom,
      rayon: form.rayon,
      role: form.role,
      pwdHash,
    };
    await saveEmployees([...employees, nouveau]);
    setMessage(`Compte créé pour ${nom}.`);
    resetForm();
    setShowForm(false);
  };

  const updateRayon = async (id, rayon) => {
    await saveEmployees(employees.map((e) => (e.id === id ? { ...e, rayon } : e)));
  };

  const updateRole = async (id, role) => {
    await saveEmployees(employees.map((e) => (e.id === id ? { ...e, role } : e)));
  };

  const removeEmployee = async (id) => {
    await saveEmployees(employees.filter((e) => e.id !== id));
  };

  const regenerateAdminCode = async () => {
    const code = generateAdminCode();
    await saveAdminCode(code);
    setCodeRevealed(true);
    setMessage("Nouveau code chef généré.");
  };

  return (
    <div>
      <div style={{ fontFamily: "'Poppins', sans-serif", color: COLORS.ardoise }} className="text-lg font-bold mb-1 flex items-center gap-2">
        <Settings size={18} color={COLORS.vert} /> Chefmaster
      </div>
      <div style={{ color: COLORS.ardoise }} className="text-xs opacity-60 mb-4">
        Gestion des comptes, des rayons et des rapports — réservé au chef
      </div>

      <div className="flex gap-2 mb-5">
        <button
          onClick={() => setView("comptes")}
          style={{
            background: view === "comptes" ? COLORS.vert : "transparent",
            color: view === "comptes" ? "#fff" : COLORS.ardoise,
            borderColor: `${COLORS.vert}55`,
          }}
          className="flex-1 border rounded-full py-1.5 text-xs font-medium flex items-center justify-center gap-1"
        >
          <Users size={13} /> Comptes
        </button>
        <button
          onClick={() => setView("rapports")}
          style={{
            background: view === "rapports" ? COLORS.vert : "transparent",
            color: view === "rapports" ? "#fff" : COLORS.ardoise,
            borderColor: `${COLORS.vert}55`,
          }}
          className="flex-1 border rounded-full py-1.5 text-xs font-medium flex items-center justify-center gap-1"
        >
          <FileText size={13} /> Rapports
        </button>
        <button
          onClick={() => setView("suivi")}
          style={{
            background: view === "suivi" ? COLORS.vert : "transparent",
            color: view === "suivi" ? "#fff" : COLORS.ardoise,
            borderColor: `${COLORS.vert}55`,
          }}
          className="flex-1 border rounded-full py-1.5 text-xs font-medium flex items-center justify-center gap-1"
        >
          <ClipboardList size={13} /> Suivi
        </button>
      </div>

      {view === "rapports" && <RapportsTab products={products} inventaires={inventaires} />}

      {view === "suivi" && <SuiviEquipeTab employees={employees} tasks={tasks} taskStatuses={taskStatuses} />}

      {view === "comptes" && (
        <>

      <div style={{ background: COLORS.card, border: "1px solid #EBEBEB" }} className="rounded-2xl p-4 mb-5">
        <div style={{ color: COLORS.ardoise }} className="text-sm font-medium mb-1">
          Code chef
        </div>
        <div style={{ color: COLORS.ardoise }} className="text-xs opacity-60 mb-3">
          Demandé pour prendre un poste autre qu'Employé à l'inscription.
        </div>
        {adminCode ? (
          <div className="flex items-center gap-2 mb-3">
            <div
              style={{ background: `${COLORS.vert}18`, color: COLORS.vert, letterSpacing: 3 }}
              className="flex-1 rounded-lg px-3 py-2 text-sm font-mono font-semibold text-center"
            >
              {codeRevealed ? adminCode : "••••••"}
            </div>
            <button
              onClick={() => setCodeRevealed(!codeRevealed)}
              style={{ borderColor: `${COLORS.vert}55`, color: COLORS.vert }}
              className="border rounded-lg px-3 py-2 text-xs font-medium"
            >
              {codeRevealed ? "Cacher" : "Voir"}
            </button>
          </div>
        ) : (
          <div style={{ color: COLORS.tomate }} className="text-xs mb-3">
            Aucun code généré pour l'instant.
          </div>
        )}
        <button onClick={regenerateAdminCode} style={{ background: COLORS.moutarde }} className="w-full text-white rounded-lg py-2 text-sm font-medium">
          {adminCode ? "Générer un nouveau code" : "Générer le code chef"}
        </button>
      </div>

      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          style={{ borderColor: COLORS.vert, color: COLORS.vert }}
          className="w-full border-2 border-dashed rounded-xl py-3 flex items-center justify-center gap-2 text-sm font-medium mb-5"
        >
          <UserPlus size={16} /> Créer un compte
        </button>
      ) : (
        <div style={{ background: COLORS.card, border: "1px solid #EBEBEB" }} className="rounded-2xl p-4 mb-5">
          <div className="flex justify-between items-center mb-3">
            <div style={{ color: COLORS.vert }} className="font-medium text-sm">
              Nouveau compte
            </div>
            <button onClick={() => setShowForm(false)}>
              <X size={16} />
            </button>
          </div>

          <input
            value={form.nom}
            onChange={(e) => setForm({ ...form, nom: e.target.value })}
            placeholder="Prénom"
            style={{ borderColor: `${COLORS.vert}33` }}
            className="w-full border rounded-lg px-3 py-2 mb-2 text-sm outline-none"
          />

          <select
            value={form.rayon}
            onChange={(e) => setForm({ ...form, rayon: e.target.value })}
            className="w-full border rounded-lg px-3 py-2 mb-2 text-sm"
          >
            {RAYONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>

          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            className="w-full border rounded-lg px-3 py-2 mb-2 text-sm"
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>

          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="Mot de passe"
            style={{ borderColor: `${COLORS.vert}33` }}
            className="w-full border rounded-lg px-3 py-2 mb-2 text-sm outline-none"
          />
          <input
            type="password"
            value={form.passwordConfirm}
            onChange={(e) => setForm({ ...form, passwordConfirm: e.target.value })}
            placeholder="Confirme le mot de passe"
            style={{ borderColor: `${COLORS.vert}33` }}
            className="w-full border rounded-lg px-3 py-2 mb-3 text-sm outline-none"
          />

          <button onClick={creerCompte} style={{ background: COLORS.vert }} className="w-full text-white rounded-lg py-2 text-sm font-medium">
            Créer le compte
          </button>
        </div>
      )}

      {error && (
        <div style={{ color: COLORS.tomate }} className="text-xs mb-3 flex items-center gap-1">
          <AlertTriangle size={12} /> {error}
        </div>
      )}
      {message && (
        <div style={{ color: COLORS.vertClair }} className="text-xs mb-3">
          {message}
        </div>
      )}

      <div style={{ color: COLORS.ardoise }} className="text-xs font-semibold uppercase tracking-wide opacity-50 mb-2">
        Équipe ({employees.length})
      </div>

      {employees.map((e) => (
        <Etiquette key={e.id} accent={COLORS.vert} className="mb-2 p-3">
          <div className="flex items-center justify-between mb-2">
            <div style={{ color: COLORS.ardoise }} className="text-sm font-medium flex items-center gap-1">
              {e.role === "Chef" && <Crown size={12} color={COLORS.moutarde} />}
              {e.name}
            </div>
            <button onClick={() => removeEmployee(e.id)} className="opacity-40 hover:opacity-100">
              <Trash2 size={14} color={COLORS.tomate} />
            </button>
          </div>
          <div className="flex gap-2">
            <select
              value={e.rayon}
              onChange={(ev) => updateRayon(e.id, ev.target.value)}
              className="flex-1 border rounded-lg px-2 py-1.5 text-xs"
            >
              {RAYONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <select
              value={e.role || "Employé"}
              onChange={(ev) => updateRole(e.id, ev.target.value)}
              className="flex-1 border rounded-lg px-2 py-1.5 text-xs"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        </Etiquette>
      ))}
        </>
      )}
    </div>
  );
}

function RapportsTab({ products, inventaires }) {
  const [expandedId, setExpandedId] = useState(null);
  const historique = inventaires
    .filter((iv) => iv.status === "terminé")
    .sort((a, b) => new Date(b.dateFin) - new Date(a.dateFin));

  return (
    <div>
      <div style={{ color: COLORS.ardoise }} className="text-xs opacity-60 mb-3">
        Rapports d'inventaire — réservé au chef
      </div>

      {historique.length === 0 && (
        <div style={{ color: COLORS.ardoise }} className="text-sm opacity-40 italic">
          Aucun inventaire terminé pour l'instant.
        </div>
      )}

      {historique.map((iv) => {
        const nbProduits = Object.keys(iv.counts || {}).length;
        return (
          <Etiquette key={iv.id} accent={COLORS.vertClair} className="mb-2 p-3">
            <div
              onClick={() => setExpandedId(expandedId === iv.id ? null : iv.id)}
              className="flex items-center justify-between cursor-pointer"
            >
              <div>
                <div style={{ color: COLORS.ardoise }} className="text-sm font-medium">
                  {iv.rayon}
                </div>
                <div style={{ color: COLORS.ardoise }} className="text-xs opacity-60">
                  {new Date(iv.dateFin).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  {" · par "}
                  {iv.startedBy} · {nbProduits} produit{nbProduits > 1 ? "s" : ""} compté{nbProduits > 1 ? "s" : ""}
                </div>
              </div>
            </div>

            {expandedId === iv.id && (
              <div className="mt-2 pt-2" style={{ borderTop: `1px solid ${COLORS.vert}22` }}>
                {Object.entries(iv.counts || {}).map(([pid, qte]) => {
                  const prod = products.find((p) => p.id === pid);
                  return (
                    <div key={pid} style={{ color: COLORS.ardoise }} className="text-xs flex justify-between py-0.5">
                      <span>{prod ? prod.nom : "Produit supprimé"}</span>
                      <span className="font-medium">{qte}</span>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex gap-2 mt-2">
              <button
                onClick={() => printInventoryPDF(iv, products)}
                style={{ borderColor: `${COLORS.vert}55`, color: COLORS.vert }}
                className="flex-1 border rounded-lg py-1.5 text-xs font-medium flex items-center justify-center gap-1"
              >
                <Printer size={12} /> PDF
              </button>
              <button
                onClick={() => downloadInventoryExcel(iv, products)}
                style={{ borderColor: `${COLORS.vert}55`, color: COLORS.vert }}
                className="flex-1 border rounded-lg py-1.5 text-xs font-medium flex items-center justify-center gap-1"
              >
                <FileSpreadsheet size={12} /> Excel
              </button>
            </div>
          </Etiquette>
        );
      })}
    </div>
  );
}
