// src/App.jsx
import React, { useState, useEffect } from "react";
import {
  Coffee, ShoppingBag, Award, ClipboardList, Plus, Minus, X, Check,
  User, Phone, MapPin, Store, Truck, Leaf, Sparkles, Snowflake, Loader2,
  LogOut, Utensils, Star, Heart, Palette, ArrowUpDown, Shuffle, Gift,
  Percent, Tag, ChevronLeft, RotateCcw, Clock, Calendar, Share2,
  PartyPopper, Trophy, Copy, Info, WifiOff, Lock,
} from "lucide-react";
import DanehLogo from "./components/DanehLogo.jsx";
import Bean from "./components/Bean.jsx";
import PHOTOS from "./photos.js";
import { api, getToken, setToken, ApiError } from "./api.js";
import { previewPricing, isBirthdayToday as previewIsBirthdayToday, estimatePrepMinutes } from "./pricingPreview.js";
import "./styles.css";

const CATEGORIES = [
  { id: "coffee", label: "قهوه", icon: Coffee },
  { id: "tea", label: "چای و دمنوش", icon: Leaf },
  { id: "cake", label: "کیک و شیرینی", icon: Sparkles },
  { id: "cold", label: "نوشیدنی سرد", icon: Snowflake },
];
const CAT_STYLE = {
  coffee: { grad: "linear-gradient(135deg,#6F4E37,#3B2A1E)", fg: "#F3E9DD" },
  tea: { grad: "linear-gradient(135deg,#7C9B70,#45563F)", fg: "#F3F6EF" },
  cake: { grad: "linear-gradient(135deg,#D9B25C,#B8923A)", fg: "#FFFBF0" },
  cold: { grad: "linear-gradient(135deg,#8FB6C9,#4F7E94)", fg: "#F1F8FA" },
};
const THEMES = [
  { id: "light", label: "روشن", swatch: "#FAF8F4", swatch2: "#C49A3A" },
  { id: "dark", label: "تیره", swatch: "#1E1812", swatch2: "#E0B563" },
  { id: "autumn", label: "پاییزی", swatch: "#FBF3E7", swatch2: "#C97B3D" },
];
const TIER_LABEL = { bronze: "برنزی", silver: "نقره‌ای", gold: "طلایی" };
const TIER_COLOR = { bronze: "#B08D57", silver: "#9CA3AF", gold: "var(--accent-gold)" };

function formatToman(n) { return (n ?? 0).toLocaleString("fa-IR"); }
function toFa(n) { return String(n).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[d]); }
function findItem(menu, id) { return menu.find((m) => m.id === id); }

export default function App() {
  const [booting, setBooting] = useState(true);
  const [screen, setScreen] = useState("welcome"); // welcome | login | app
  const [connectionError, setConnectionError] = useState(false);
  const [user, setUser] = useState(null);
  const [menu, setMenu] = useState([]);

  // auth form
  const [authMode, setAuthMode] = useState("register"); // register | login
  const [fName, setFName] = useState("");
  const [fPhone, setFPhone] = useState("");
  const [fPassword, setFPassword] = useState("");
  const [fBMonth, setFBMonth] = useState("");
  const [fBDay, setFBDay] = useState("");
  const [fReferral, setFReferral] = useState("");
  const [authError, setAuthError] = useState("");
  const [authBusy, setAuthBusy] = useState(false);

  const [activeTab, setActiveTab] = useState("menu");
  const [activeCat, setActiveCat] = useState("coffee");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [sortMode, setSortMode] = useState("default");
  const [favorites, setFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem("daneh-favorites") || "{}"); } catch { return {}; }
  });
  const [theme, setTheme] = useState(() => localStorage.getItem("daneh-theme") || "light");

  const [cart, setCart] = useState(() => {
    try { return JSON.parse(localStorage.getItem("daneh-cart") || "{}"); } catch { return {}; }
  });
  const [redeemedItem, setRedeemedItem] = useState(null);
  const [redeemSheetOpen, setRedeemSheetOpen] = useState(false);

  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [deliveryType, setDeliveryType] = useState("pickup");
  const [scheduleMode, setScheduleMode] = useState("now");
  const [scheduleTime, setScheduleTime] = useState("");
  const [custAddress, setCustAddress] = useState("");
  const [placingOrder, setPlacingOrder] = useState(false);

  const [orders, setOrders] = useState([]);
  const [loyalty, setLoyalty] = useState({ points: 0, stamps: 0, rewards: 0, tier: "bronze", weekly: { teaCount: 0, goal: 2, rewardReady: false, rewardClaimed: false } });
  const [referral, setReferral] = useState({ code: "", totalUses: 0, unclaimed: 0 });

  const [accountOpen, setAccountOpen] = useState(false);
  const [themeSheetOpen, setThemeSheetOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [adminDraft, setAdminDraft] = useState({});
  const [adminBusy, setAdminBusy] = useState(false);

  const [toast, setToast] = useState(null);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  }

  // ---------- boot ----------
  useEffect(() => {
    (async () => {
      try {
        const menuRes = await api.menu();
        setMenu(menuRes.items);
      } catch (e) {
        setConnectionError(true);
        setBooting(false);
        return;
      }
      const token = getToken();
      if (token) {
        try {
          const meRes = await api.me();
          setUser(meRes.user);
          setScreen("app");
          await refreshUserData();
        } catch {
          setToken(null);
          setScreen("welcome");
        }
      }
      setBooting(false);
    })();
  }, []);

  useEffect(() => {
    localStorage.setItem("daneh-cart", JSON.stringify(cart));
  }, [cart]);
  useEffect(() => {
    localStorage.setItem("daneh-favorites", JSON.stringify(favorites));
  }, [favorites]);
  useEffect(() => {
    localStorage.setItem("daneh-theme", theme);
  }, [theme]);

  async function refreshUserData() {
    try {
      const [loyaltyRes, referralRes, ordersRes] = await Promise.all([api.loyalty(), api.myReferral(), api.myOrders()]);
      setLoyalty(loyaltyRes);
      setReferral(referralRes);
      setOrders(ordersRes.orders);
    } catch (e) {
      /* non-fatal — user stays logged in, panels just show stale/empty data */
    }
  }

  // ---------- auth ----------
  async function submitAuth() {
    setAuthError("");
    setAuthBusy(true);
    try {
      let result;
      if (authMode === "register") {
        const birthday = fBMonth && fBDay ? String(fBMonth).padStart(2, "0") + "-" + String(fBDay).padStart(2, "0") : undefined;
        result = await api.register({ name: fName, phone: fPhone, password: fPassword, birthday, referralCode: fReferral || undefined });
      } else {
        result = await api.login({ phone: fPhone, password: fPassword });
      }
      setToken(result.token);
      setUser(result.user);
      setScreen("app");
      await refreshUserData();
      showToast(authMode === "register" ? "خوش اومدی به کافه دانه ☕" : "خوش برگشتی!");
    } catch (e) {
      setAuthError(e instanceof ApiError ? e.message : "خطایی پیش اومد");
    } finally {
      setAuthBusy(false);
    }
  }

  function handleLogout() {
    setToken(null);
    setUser(null);
    setOrders([]);
    setCart({});
    setRedeemedItem(null);
    setAccountOpen(false);
    setScreen("login");
  }

  // ---------- cart ----------
  function addToCart(id) {
    setCart((p) => ({ ...p, [id]: (p[id] || 0) + 1 }));
  }
  function decFromCart(id) {
    setCart((p) => {
      const n = { ...p };
      if (!n[id]) return p;
      n[id] -= 1;
      if (n[id] <= 0) delete n[id];
      return n;
    });
  }
  function toggleFavorite(id) {
    setFavorites((p) => {
      const n = { ...p };
      if (n[id]) delete n[id];
      else n[id] = true;
      return n;
    });
  }

  const cartItems = Object.entries(cart)
    .map(([id, qty]) => {
      const item = findItem(menu, id);
      return item ? { ...item, qty } : null;
    })
    .filter(Boolean);
  const cartCount = cartItems.reduce((s, it) => s + it.qty, 0);
  const preview = previewPricing(
    cartItems.map((it) => ({ price: it.price, qty: it.qty })),
    user?.birthday
  );
  const birthdayToday = previewIsBirthdayToday(user?.birthday);

  function confirmRedeem(item) {
    setRedeemedItem({ id: item.id, name: item.name });
    setRedeemSheetOpen(false);
    showToast("🎁 " + item.name + " به‌عنوان جایزه اضافه شد");
  }
  function pickRandomReward() {
    const coffeeItems = menu.filter((m) => m.category === "coffee");
    confirmRedeem(coffeeItems[Math.floor(Math.random() * coffeeItems.length)]);
  }

  async function placeOrder() {
    if (deliveryType === "delivery" && !custAddress.trim()) return;
    if (scheduleMode === "later" && !scheduleTime) return;
    setPlacingOrder(true);
    try {
      const res = await api.placeOrder({
        items: cartItems.map((it) => ({ menuItemId: it.id, qty: it.qty })),
        deliveryType,
        address: deliveryType === "delivery" ? custAddress : undefined,
        scheduledTime: scheduleMode === "later" ? scheduleTime : undefined,
        redeemRewardItemId: redeemedItem ? redeemedItem.id : undefined,
      });
      setCart({});
      setRedeemedItem(null);
      setCheckoutOpen(false);
      setCustAddress("");
      setScheduleMode("now");
      setScheduleTime("");
      setActiveTab("orders");
      await refreshUserData();
      showToast(`سفارش ثبت شد ✅ · آماده‌سازی ~${toFa(res.order.prep_minutes)} دقیقه`);
    } catch (e) {
      showToast(e instanceof ApiError ? e.message : "ثبت سفارش با خطا مواجه شد");
    } finally {
      setPlacingOrder(false);
    }
  }

  function reorderFrom(order) {
    const next = {};
    order.items.forEach((it) => {
      if (it.menu_item_id && findItem(menu, it.menu_item_id)) next[it.menu_item_id] = (next[it.menu_item_id] || 0) + it.qty;
    });
    setCart(next);
    setActiveTab("cart");
    showToast("آیتم‌های سفارش قبلی به سبد اضافه شد");
  }

  async function claimWeekly() {
    try {
      await api.claimWeekly();
      await refreshUserData();
      showToast("🏆 جایزه‌ی چالش هفتگی ثبت شد — به باریستا نشونش بده");
    } catch (e) {
      showToast(e instanceof ApiError ? e.message : "خطا در دریافت جایزه");
    }
  }
  async function claimReferral() {
    try {
      const res = await api.claimReferral();
      await refreshUserData();
      showToast(res.claimedPoints > 0 ? `🎉 ${toFa(res.claimedPoints)} امتیاز گرفتی!` : "جایزه‌ی جدیدی نبود");
    } catch (e) {
      showToast(e instanceof ApiError ? e.message : "خطا در دریافت پاداش");
    }
  }

  // ---------- admin ----------
  function openAdmin() {
    setAccountOpen(false);
    const draft = {};
    menu.forEach((m) => { draft[m.id] = String(m.price); });
    setAdminDraft(draft);
    setAdminOpen(true);
  }
  async function saveAdminPrices() {
    setAdminBusy(true);
    try {
      const changed = menu.filter((m) => Number(adminDraft[m.id]) !== m.price && Number(adminDraft[m.id]) > 0);
      for (const m of changed) {
        await api.adminSetPrice(m.id, Number(adminDraft[m.id]));
      }
      const menuRes = await api.menu();
      setMenu(menuRes.items);
      setAdminOpen(false);
      showToast(`قیمت ${toFa(changed.length)} آیتم به‌روزرسانی شد ✅`);
    } catch (e) {
      showToast(e instanceof ApiError ? e.message : "خطا در ذخیره‌ی قیمت‌ها");
    } finally {
      setAdminBusy(false);
    }
  }

  const canAuth = authMode === "register" ? fName.trim() && fPhone.trim() && fPassword.length >= 6 : fPhone.trim() && fPassword.length >= 6;

  const tabs = [
    { id: "menu", label: "منو", icon: Coffee },
    { id: "cart", label: "سبد", icon: ShoppingBag, badge: cartCount },
    { id: "loyalty", label: "باشگاه", icon: Award },
    { id: "orders", label: "سفارش‌ها", icon: ClipboardList },
  ];

  let visibleItems = showFavoritesOnly ? menu.filter((m) => favorites[m.id]) : menu.filter((m) => m.category === activeCat);
  if (sortMode === "priceAsc") visibleItems = [...visibleItems].sort((a, b) => a.price - b.price);
  else if (sortMode === "priceDesc") visibleItems = [...visibleItems].sort((a, b) => b.price - a.price);

  const ONBOARD_REMINDER = connectionError && (
    <div className="conn-error">
      <WifiOff size={16} />
      اتصال به سرور برقرار نشد. مطمئن شو بک‌اند پروژه (پوشه‌ی cafe-daneh-backend) با دستور «npm run dev» در حال اجراست.
    </div>
  );

  return (
    <div dir="rtl" lang="fa" className="daneh-root" data-theme={theme}>
      <div className="phone-frame">
        {toast && <div className="toast">{toast}</div>}

        {booting ? (
          <div className="loading-wrap"><Loader2 className="animate-spin" color="var(--ink-soft)" size={26} /></div>
        ) : connectionError ? (
          <div className="gate-screen">{ONBOARD_REMINDER}</div>
        ) : screen === "welcome" ? (
          <div className="gate-screen">
            <div className="gate-logo-ring"><DanehLogo size={48} /></div>
            <div className="gate-title">به کافه دانه خوش اومدی</div>
            <div className="gate-sub">برشته‌کاری تازه، هر روز. این نسخه به یه بک‌اند واقعی وصله — حساب، سفارش و امتیازت واقعاً ذخیره می‌شه.</div>
            <button className="gate-btn" onClick={() => setScreen("login")}>بزن بریم</button>
          </div>
        ) : screen === "login" ? (
          <div className="gate-screen" style={{ overflowY: "auto" }}>
            <div className="gate-logo-ring"><DanehLogo size={42} /></div>
            <div className="gate-title">{authMode === "register" ? "ساخت حساب" : "ورود به حساب"}</div>
            <div className="auth-toggle">
              <button className={authMode === "register" ? "active" : ""} onClick={() => setAuthMode("register")}>ثبت‌نام</button>
              <button className={authMode === "login" ? "active" : ""} onClick={() => setAuthMode("login")}>ورود</button>
            </div>
            <div className="gate-form">
              {authMode === "register" && (
                <>
                  <div className="field-label"><User size={13} /> نام شما</div>
                  <input className="field-input" value={fName} onChange={(e) => setFName(e.target.value)} placeholder="مثلاً سارا محمدی" />
                </>
              )}
              <div className="field-label"><Phone size={13} /> شماره موبایل</div>
              <input className="field-input" value={fPhone} onChange={(e) => setFPhone(e.target.value)} placeholder="۰۹۱۲۱۲۳۴۵۶۷" inputMode="tel" />
              <div className="field-label"><Lock size={13} /> رمز عبور</div>
              <input className="field-input" type="password" value={fPassword} onChange={(e) => setFPassword(e.target.value)} placeholder="حداقل ۶ کاراکتر" />
              {authMode === "register" && (
                <>
                  <div className="field-label"><PartyPopper size={13} /> تاریخ تولد (اختیاری)</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input className="field-input" value={fBMonth} onChange={(e) => setFBMonth(e.target.value.replace(/\D/g, "").slice(0, 2))} placeholder="ماه" inputMode="numeric" style={{ textAlign: "center" }} />
                    <input className="field-input" value={fBDay} onChange={(e) => setFBDay(e.target.value.replace(/\D/g, "").slice(0, 2))} placeholder="روز" inputMode="numeric" style={{ textAlign: "center" }} />
                  </div>
                  <div className="field-label"><Share2 size={13} /> کد دعوت دوست (اختیاری)</div>
                  <input className="field-input" value={fReferral} onChange={(e) => setFReferral(e.target.value)} placeholder="مثلاً DANEH1234" />
                </>
              )}
            </div>
            {authError && <div className="auth-error">{authError}</div>}
            <button className="gate-btn" disabled={!canAuth || authBusy} style={{ opacity: canAuth && !authBusy ? 1 : 0.45 }} onClick={submitAuth}>
              {authBusy ? <Loader2 className="animate-spin" size={16} /> : authMode === "register" ? "ساخت حساب" : "ورود"}
            </button>
          </div>
        ) : (
          <>
            <header className="app-header">
              <div className="logo-row">
                <div className="logo-mark"><DanehLogo size={22} withSteam={false} /></div>
                <div>
                  <div className="brand-name">کافه دانه</div>
                  <div className="brand-tag">برشته‌کاری تازه، هر روز</div>
                </div>
              </div>
              <button className="avatar-btn" onClick={() => setAccountOpen(true)} aria-label="حساب کاربری">
                {user?.name ? user.name.trim().charAt(0) : "م"}
              </button>
            </header>

            <div className="scroll-area">
              {activeTab === "menu" && (
                <>
                  <div className="cat-bar">
                    <button className={"cat-chip fav-chip" + (showFavoritesOnly ? " active" : "")} onClick={() => setShowFavoritesOnly((v) => !v)}>
                      <Heart size={14} fill={showFavoritesOnly ? "#fff" : "none"} />علاقه‌مندی‌ها
                    </button>
                    {CATEGORIES.map((c) => {
                      const Icon = c.icon;
                      return (
                        <button key={c.id} className={"cat-chip" + (!showFavoritesOnly && activeCat === c.id ? " active" : "")} onClick={() => { setShowFavoritesOnly(false); setActiveCat(c.id); }}>
                          <Icon size={14} />{c.label}
                        </button>
                      );
                    })}
                  </div>
                  <div className="sort-row">
                    <span className="sr-lbl"><ArrowUpDown size={11} /> مرتب‌سازی:</span>
                    <button className={"sort-chip" + (sortMode === "default" ? " active" : "")} onClick={() => setSortMode("default")}>پیش‌فرض</button>
                    <button className={"sort-chip" + (sortMode === "priceAsc" ? " active" : "")} onClick={() => setSortMode("priceAsc")}>ارزان‌ترین</button>
                    <button className={"sort-chip" + (sortMode === "priceDesc" ? " active" : "")} onClick={() => setSortMode("priceDesc")}>گران‌ترین</button>
                  </div>
                  <div className="menu-list">
                    {visibleItems.length === 0 && showFavoritesOnly && (
                      <div className="empty-state"><div className="em-emoji">♡</div>هنوز چیزی به علاقه‌مندی‌ها اضافه نکردی</div>
                    )}
                    {visibleItems.map((item) => {
                      const qty = cart[item.id] || 0;
                      const CatIcon = CATEGORIES.find((c) => c.id === item.category)?.icon || Coffee;
                      const style = CAT_STYLE[item.category];
                      const pairItem = item.pairId ? findItem(menu, item.pairId) : null;
                      const isFav = !!favorites[item.id];
                      const photo = PHOTOS[item.id];
                      return (
                        <div className="menu-card" key={item.id}>
                          <button className="fav-btn" onClick={() => toggleFavorite(item.id)} aria-label="علاقه‌مندی">
                            <Heart size={17} fill={isFav ? "var(--danger)" : "none"} color={isFav ? "var(--danger)" : "var(--ink-soft)"} />
                          </button>
                          <div className="item-thumb" style={photo ? undefined : { background: style.grad }}>
                            {photo ? <img src={photo} alt={item.name} className="item-thumb-img" /> : <CatIcon size={24} color={style.fg} />}
                          </div>
                          <div className="item-body">
                            <div className="item-name-row">
                              <span className="item-name">{item.name}</span>
                              {item.popular && <span className="popular-badge"><Star size={9} fill="var(--accent-gold)" />پرطرفدار</span>}
                            </div>
                            <div className="item-desc">{item.description}</div>
                            <div className="item-price">{formatToman(item.price)} تومان</div>
                            {pairItem && <div className="pair-line"><Utensils size={11} />خوب میشه با {pairItem.name}</div>}
                          </div>
                          {qty === 0 ? (
                            <button className="add-btn" onClick={() => addToCart(item.id)} aria-label={"افزودن " + item.name}><Plus size={16} /></button>
                          ) : (
                            <div className="qty-stepper">
                              <button className="qty-btn" onClick={() => decFromCart(item.id)}><Minus size={13} /></button>
                              <span className="qty-num">{toFa(qty)}</span>
                              <button className="qty-btn" onClick={() => addToCart(item.id)}><Plus size={13} /></button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {activeTab === "cart" && (
                <>
                  {cartItems.length === 0 && !redeemedItem ? (
                    <div className="empty-state"><div className="em-emoji">☕</div>سبد خریدت خالیه
                      <div><button className="empty-btn" onClick={() => setActiveTab("menu")}>رفتن به منو</button></div>
                    </div>
                  ) : (
                    <>
                      {loyalty.rewards > 0 && !redeemedItem && (
                        <div className="redeem-banner">
                          <Gift size={20} color="var(--accent-gold)" />
                          <span className="rb-text">{toFa(loyalty.rewards)} جایزه داری! یه آیتم رایگان انتخاب کن</span>
                          <button onClick={() => setRedeemSheetOpen(true)}>انتخاب جایزه</button>
                        </div>
                      )}
                      {preview.discountRate > 0 && (
                        <div className="discount-banner">
                          {birthdayToday && preview.discountRate === 0.15 ? <PartyPopper size={14} /> : <Percent size={14} />}
                          {birthdayToday && preview.discountRate === 0.15
                            ? "تولدت مبارک! ۱۵٪ تخفیف ویژه‌ی تولد فعال شد 🎂"
                            : `چون ${toFa(cartCount)} آیتم سفارش دادی، ${toFa(Math.round(preview.discountRate * 100))}٪ تخفیف گروهی فعال شد 🎉`}
                        </div>
                      )}
                      {preview.discountRate === 0 && cartCount > 0 && cartCount < 5 && (
                        <div className="nudge-line">{toFa(5 - cartCount)} آیتم دیگه اضافه کن تا ۵٪ تخفیف گروهی بگیری</div>
                      )}

                      <div className="cart-list" style={{ paddingTop: 14 }}>
                        {cartItems.map((it) => (
                          <div className="cart-row" key={it.id}>
                            <button className="remove-btn" onClick={() => setCart((p) => { const n = { ...p }; delete n[it.id]; return n; })}><X size={16} /></button>
                            <div className="qty-stepper">
                              <button className="qty-btn" onClick={() => decFromCart(it.id)}><Minus size={13} /></button>
                              <span className="qty-num">{toFa(it.qty)}</span>
                              <button className="qty-btn" onClick={() => addToCart(it.id)}><Plus size={13} /></button>
                            </div>
                            <div style={{ flex: 1 }}>
                              <div className="cart-row-name">{it.name}</div>
                              <div className="cart-row-price">{formatToman(it.price * it.qty)} تومان</div>
                            </div>
                          </div>
                        ))}
                        {redeemedItem && (
                          <div className="cart-row free-row">
                            <button className="remove-btn" onClick={() => setRedeemedItem(null)}><X size={16} /></button>
                            <Gift size={18} color="var(--accent-gold)" />
                            <div style={{ flex: 1 }}>
                              <div className="cart-row-name">{redeemedItem.name} <span style={{ color: "var(--accent-gold)" }}>(جایزه)</span></div>
                              <div className="cart-row-price">رایگان</div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="summary-box">
                        <div className="summary-line"><span>جمع جزء</span><span>{formatToman(preview.subtotal)} تومان</span></div>
                        {preview.discount > 0 && <div className="summary-line discount-line"><span>تخفیف</span><span>-{formatToman(preview.discount)} تومان</span></div>}
                        {redeemedItem && <div className="summary-line discount-line"><span>🎁 {redeemedItem.name}</span><span>رایگان</span></div>}
                        <div className="summary-line summary-total"><span>مبلغ قابل پرداخت (تخمینی)</span><span>{formatToman(preview.total)} تومان</span></div>
                      </div>
                      <div className="preview-note"><Info size={11} /> مبلغ نهایی توسط سرور در لحظه‌ی ثبت سفارش محاسبه می‌شود</div>
                      <button className="checkout-btn" disabled={cartItems.length === 0} onClick={() => setCheckoutOpen(true)}>ادامه و ثبت سفارش</button>
                    </>
                  )}
                </>
              )}

              {activeTab === "loyalty" && (
                <>
                  <div className="loyalty-hero">
                    <span className="tier-pill" style={{ background: TIER_COLOR[loyalty.tier], color: "var(--ink)" }}>سطح {TIER_LABEL[loyalty.tier]}</span>
                    <div className="points-num">{toFa(loyalty.points)}</div>
                    <div className="points-lbl">امتیاز جمع‌شده</div>
                  </div>
                  <div className="bean-card">
                    <div style={{ fontWeight: 700, fontSize: 13.5, textAlign: "center" }}>دانه‌های شما تا قهوه‌ی رایگان</div>
                    <div className="bean-row">{Array.from({ length: 8 }).map((_, i) => <Bean key={i} filled={i < loyalty.stamps} />)}</div>
                    <div style={{ textAlign: "center", fontSize: 11.5, color: "var(--ink-soft)" }}>{toFa(loyalty.stamps)} از ۸ دانه</div>
                    {loyalty.rewards > 0 && <div style={{ textAlign: "center", fontSize: 12, color: "var(--accent-green)", marginTop: 8, fontWeight: 600 }}>🎁 {toFa(loyalty.rewards)} قهوه‌ی رایگان داری — توی سبد خریدت قابل استفاده‌ست</div>}
                  </div>
                  <div className="bean-card">
                    <div style={{ fontWeight: 700, fontSize: 13.5, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}><Trophy size={15} color="var(--accent-gold)" /> چالش این هفته</div>
                    <div style={{ textAlign: "center", fontSize: 12, color: "var(--ink-soft)", marginTop: 6 }}>
                      {loyalty.weekly.rewardClaimed ? "این هفته جایزه‌تو گرفتی! هفته‌ی بعد دوباره شروع می‌شه" : `${toFa(loyalty.weekly.goal)} تا چای بخر، یه شیرینی رایگان بگیر`}
                    </div>
                    <div className="bean-row">{Array.from({ length: loyalty.weekly.goal }).map((_, i) => <Bean key={i} filled={i < loyalty.weekly.teaCount} />)}</div>
                    <div style={{ textAlign: "center", fontSize: 11.5, color: "var(--ink-soft)" }}>{toFa(Math.min(loyalty.weekly.teaCount, loyalty.weekly.goal))} از {toFa(loyalty.weekly.goal)} چای</div>
                    {loyalty.weekly.rewardReady && !loyalty.weekly.rewardClaimed && (
                      <button className="checkout-btn" style={{width: "100%", margin: "12px 0 0"}} onClick={claimWeekly}>دریافت جایزه‌ی چالش</button>
                    )}
                  </div>
                  {user?.birthday && (
                    <div className="info-card" style={{display: "flex", alignItems: "center", gap: 8 }}>
                      <PartyPopper size={16} color="var(--accent-gold)" />
                      {birthdayToday ? "تولدت مبارک! امروز ۱۵٪ تخفیف ویژه‌ی تولد توی سبد خریدت فعاله 🎂" : "تاریخ تولدت ثبت شده — روز تولدت ۱۵٪ تخفیف می‌گیری"}
                    </div>
                  )}
                  <div className="info-card">
                    هر ۱۰,۰۰۰ تومان خرید = ۱ امتیاز باشگاه مشتریان<br />
                    هر قهوه‌ای که سفارش می‌دی، یک دانه به کارتت اضافه می‌شه. با ۸ دانه، یک قهوه مهمون مایی!<br />
                    سفارش های ۵ آیتمی به بالا ۵٪ و سفارش های ۱۰ آیتمی به بالا ۱۰٪ تخفیف گروهی می گیرن.
                  </div>
                </>
              )}

              {activeTab === "orders" && (
                <>
                  {orders.length === 0 ? (
                    <div className="empty-state"><div className="em-emoji">🧾</div>هنوز سفارشی ثبت نکردی
                      <div><button className="empty-btn" onClick={() => setActiveTab("menu")}>رفتن به منو</button></div>
                    </div>
                  ) : (
                    <div style={{ paddingTop: 14 }}>
                      {orders.map((o) => (
                        <div className="order-card" key={o.id}>
                          <div className="order-head"><span style={{ fontWeight: 700, fontSize: 13 }}>سفارش #{toFa(o.id)}</span><span className="order-status">{o.status === "placed" ? "ثبت شد" : o.status}</span></div>
                          <div className="order-items">{o.items.map((it, idx) => <div key={idx}>{it.name_snapshot} × {toFa(it.qty)}{it.price_snapshot === 0 ? " — رایگان" : ""}</div>)}</div>
                          {o.discount > 0 && <div style={{ fontSize: 11.5, color: "var(--accent-green)", marginTop: 4 }}>شامل {formatToman(o.discount)} تومان تخفیف{o.discount_reason === "birthday" ? " (تولد 🎂)" : " گروهی"}</div>}
                          <div style={{fontSize: 11.5, color: "var(--ink-soft)", marginTop: 3, display: "flex", alignItems: "center", gap: 4}}><Clock size={11} />آماده سازی ~{toFa(o.prep_minutes)} دقیقه{o.scheduled_time ? " · زمان بندی شده برای " + toFa(o.scheduled_time) : ""}</div>
                          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 12.5 }}>
                            <span style={{ color: "var(--ink-soft)" }}>{o.delivery_type === "pickup" ? "حضوری" : "ارسال"} · {o.created_at}</span>
                            <span style={{ fontWeight: 700 }}>{formatToman(o.total)} تومان</span>
                          </div>
                          <button onClick={() => reorderFrom(o)} className="reorder-btn"><RotateCcw size={13} /> سفارش مجدد</button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            <nav className="tab-bar">
              {tabs.map((t) => {
                const Icon = t.icon;
                return (
                  <button key={t.id} className={"tab-item" + (activeTab === t.id ? " active" : "")} onClick={() => setActiveTab(t.id)}>
                    {t.badge > 0 && <span className="tab-badge">{toFa(t.badge)}</span>}
                    <Icon size={20} /><span className="lbl">{t.label}</span>
                  </button>
                );
              })}
            </nav>

            {accountOpen && (
              <div className="sheet-overlay" onClick={() => setAccountOpen(false)}>
                <div className="sheet" onClick={(e) => e.stopPropagation()}>
                  <div className="sheet-title">حساب من<button onClick={() => setAccountOpen(false)}><X size={20} /></button></div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "6px 0 18px" }}>
                    <div className="avatar-btn" style={{ width: 48, height: 48, fontSize: 18 }}>{user?.name ? user.name.charAt(0) : "م"}</div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{user?.name}</div>
                      <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>{toFa(user?.phone || "")}{user?.role === "admin" && " · مدیر فروشگاه"}</div>
                    </div>
                  </div>
                  <div className="info-card" style={{ margin: "0 0 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 700, color: "var(--ink)", marginBottom: 4 }}><Share2 size={14} /> کد دعوت شما</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "6px 0" }}>
                      <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: 1 }}>{referral.code}</span>
                      <button onClick={() => { navigator.clipboard?.writeText(referral.code); showToast("کد کپی شد"); }} style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 8, padding: "4px 8px" }}><Copy size={13} /></button>
                    </div>
                    این کد رو به دوستات بده — هرکدوم باهاش ثبت‌نام کنن، ۱۰۰ امتیاز می‌گیرن و تو هم با زدن دکمه‌ی پایین، ۱۰۰ امتیاز پاداش می‌گیری.
                    <div style={{ marginTop: 8, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span>{toFa(referral.totalUses)} نفر ثبت‌نام کردن · {toFa(referral.unclaimed)} پاداش دریافت‌نشده</span>
                      <button onClick={claimReferral} style={{ background: "var(--ink)", color: "var(--bg)", border: "none", padding: "6px 12px", borderRadius: 999, fontSize: 11.5, fontWeight: 700 }}>دریافت پاداش</button>
                    </div>
                  </div>
                  <button className="account-link-row" onClick={() => { setAccountOpen(false); setThemeSheetOpen(true); }}><Palette size={17} /> ظاهر اپ <ChevronLeft size={16} /></button>
                  {user?.role === "admin" && (
                    <button className="account-link-row" onClick={openAdmin}><Tag size={17} /> مدیریت قیمت‌ها <ChevronLeft size={16} /></button>
                  )}
                  <button className="checkout-btn" style={{ width: "100%", margin: "18px 0 0", background: "var(--surface-2)", color: "var(--danger)" }} onClick={handleLogout}>
                    <LogOut size={15} style={{ display: "inline", verticalAlign: "middle", marginLeft: 6 }} />خروج از حساب
                  </button>
                </div>
              </div>
            )}

            {themeSheetOpen && (
              <div className="sheet-overlay" onClick={() => setThemeSheetOpen(false)}>
                <div className="sheet" onClick={(e) => e.stopPropagation()}>
                  <div className="sheet-title">ظاهر اپ<button onClick={() => setThemeSheetOpen(false)}><X size={20} /></button></div>
                  <div className="theme-grid">
                    {THEMES.map((t) => (
                      <button key={t.id} className={"theme-card" + (theme === t.id ? " active" : "")} onClick={() => { setTheme(t.id); setThemeSheetOpen(false); }}>
                        <div className="theme-swatch" style={{ background: `linear-gradient(135deg,${t.swatch},${t.swatch2})` }} />
                        <div className="tc-label">{t.label}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {redeemSheetOpen && (
              <div className="sheet-overlay" onClick={() => setRedeemSheetOpen(false)}>
                <div className="sheet" onClick={(e) => e.stopPropagation()}>
                  <div className="sheet-title">انتخاب جایزه<button onClick={() => setRedeemSheetOpen(false)}><X size={20} /></button></div>
                  <div style={{ fontSize: 12, color: "var(--ink-soft)", marginBottom: 6 }}>یکی از قهوه‌ها رو به‌عنوان جایزه‌ی رایگان انتخاب کن</div>
                  {menu.filter((m) => m.category === "coffee").map((m) => (
                    <div className="redeem-item-row" key={m.id}><span style={{ fontSize: 13, fontWeight: 600 }}>{m.name}</span><button onClick={() => confirmRedeem(m)}>انتخاب</button></div>
                  ))}
                  <button className="checkout-btn" style={{ width: "100%", margin: "16px 0 0", background: "var(--surface-2)", color: "var(--ink)" }} onClick={pickRandomReward}>
                    <Shuffle size={15} style={{ display: "inline", verticalAlign: "middle", marginLeft: 6 }} />بذار نرم‌افزار انتخاب کنه
                  </button>
                </div>
              </div>
            )}

            {adminOpen && (
              <div className="sheet-overlay" onClick={() => setAdminOpen(false)}>
                <div className="sheet" onClick={(e) => e.stopPropagation()}>
                  <div className="sheet-title">مدیریت قیمت‌ها<button onClick={() => setAdminOpen(false)}><X size={20} /></button></div>
                  <div className="info-card" style={{ margin: "0 0 12px", fontSize: 11.5 }}>این بخش فقط برای حساب‌هایی با نقش «مدیر» در سرور قابل‌مشاهده و قابل‌استفاده است — نه یک PIN فرانت‌اندی.</div>
                  {menu.map((m) => (
                    <div className="admin-row" key={m.id}>
                      <span className="ar-name">{m.name}</span>
                      <input value={adminDraft[m.id] ?? ""} onChange={(e) => setAdminDraft({ ...adminDraft, [m.id]: e.target.value })} inputMode="numeric" />
                      <span style={{ fontSize: 11, color: "var(--ink-soft)" }}>تومان</span>
                    </div>
                  ))}
                  <button className="checkout-btn" style={{ width: "100%", margin: "16px 0 0" }} disabled={adminBusy} onClick={saveAdminPrices}>
                    {adminBusy ? <Loader2 className="animate-spin" size={16} /> : "ذخیره‌ی قیمت‌ها"}
                  </button>
                </div>
              </div>
            )}

            {checkoutOpen && (
              <div className="sheet-overlay" onClick={() => setCheckoutOpen(false)}>
                <div className="sheet" onClick={(e) => e.stopPropagation()}>
                  <div className="sheet-title">تکمیل سفارش<button onClick={() => setCheckoutOpen(false)}><X size={20} /></button></div>
                  <div className="toggle-row">
                    <button className={"toggle-opt" + (deliveryType === "pickup" ? " active" : "")} onClick={() => setDeliveryType("pickup")}><Store size={18} />دریافت حضوری</button>
                    <button className={"toggle-opt" + (deliveryType === "delivery" ? " active" : "")} onClick={() => setDeliveryType("delivery")}><Truck size={18} />ارسال با پیک</button>
                  </div>
                  <div className="toggle-row">
                    <button className={"toggle-opt" + (scheduleMode === "now" ? " active" : "")} onClick={() => setScheduleMode("now")}><Clock size={18} />همین الان</button>
                    <button className={"toggle-opt" + (scheduleMode === "later" ? " active" : "")} onClick={() => setScheduleMode("later")}><Calendar size={18} />زمان‌بندی‌شده</button>
                  </div>
                  {scheduleMode === "later" && (
                    <>
                      <div className="field-label"><Calendar size={13} /> ساعت تحویل</div>
                      <input className="field-input" type="time" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)} />
                    </>
                  )}
                  {deliveryType === "delivery" && (
                    <>
                      <div className="field-label"><MapPin size={13} /> آدرس دقیق</div>
                      <input className="field-input" value={custAddress} onChange={(e) => setCustAddress(e.target.value)} placeholder="خیابان، کوچه، پلاک" />
                      {preview.subtotal < 100000 && (
                        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: "var(--danger)", marginTop: 8 }}>
                          <Info size={13} />حداقل مبلغ سفارش برای ارسال ۱۰۰,۰۰۰ تومانه
                        </div>
                      )}
                      <div className="info-card" style={{ margin: "10px 0 0", display: "flex", alignItems: "flex-start", gap: 6 }}>
                        <Info size={14} style={{ flexShrink: 0, marginTop: 2 }} />
                        <span>بهترین انتخاب برای ارسال: نوشیدنی‌های سرد و قهوه‌های بدون فوم.</span>
                      </div>
                    </>
                  )}
                  <div className="summary-box" style={{ margin: "16px 0 0" }}>
                    <div className="summary-line"><span>جمع جزء</span><span>{formatToman(preview.subtotal)} تومان</span></div>
                    {preview.discount > 0 && <div className="summary-line discount-line"><span>تخفیف</span><span>-{formatToman(preview.discount)} تومان</span></div>}
                    {redeemedItem && <div className="summary-line discount-line"><span>🎁 {redeemedItem.name}</span><span>رایگان</span></div>}
                    <div className="summary-line summary-total"><span>مبلغ قابل پرداخت (تخمینی)</span><span>{formatToman(preview.total)} تومان</span></div>
                  </div>
                  <button
                    className="checkout-btn"
                    style={{ width: "100%", margin: "16px 0 0" }}
                    disabled={placingOrder || (deliveryType === "delivery" && (!custAddress.trim() || preview.subtotal < 100000)) || (scheduleMode === "later" && !scheduleTime)}
                    onClick={placeOrder}
                  >
                    {placingOrder ? <Loader2 className="animate-spin" size={16} /> : (<><Check size={16} style={{ display: "inline", verticalAlign: "middle", marginLeft: 6 }} />ثبت نهایی سفارش</>)}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
