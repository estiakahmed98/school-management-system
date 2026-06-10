"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useInView,
  AnimatePresence,
} from "framer-motion";
import {
  Users,
  GraduationCap,
  ClipboardCheck,
  BarChart3,
  DollarSign,
  Wallet,
  Package,
  Bus,
  MessageSquare,
  UserPlus,
  Smartphone,
  Globe,
  ChevronDown,
  Star,
  Check,
  X,
  ArrowRight,
  Menu,
  Bell,
  BookOpen,
  Shield,
  Zap,
  TrendingUp,
  Award,
  ChevronRight,
  Building2,
  Mail,
  Phone,
  MapPin,
  PlayCircle,
  CheckCircle2,
  AlertCircle,
  Clock,
  Activity,
  PieChart,
  Target,
  Layers,
  Lock,
  RefreshCw,
  Headphones,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────
interface Module {
  icon: React.ReactNode;
  title: string;
  desc: string;
  color: string;
  bg: string;
}
interface Role {
  title: string;
  perms: string[];
  color: string;
  icon: React.ReactNode;
}
interface Testimonial {
  name: string;
  role: string;
  school: string;
  avatar: string;
  rating: number;
  text: string;
}
interface Plan {
  name: string;
  price: string;
  period: string;
  desc: string;
  highlight: boolean;
  features: string[];
  cta: string;
}
interface FAQ {
  q: string;
  a: string;
}

// ─── Animation Variants ──────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] },
  }),
};
const fadeIn = {
  hidden: { opacity: 0 },
  visible: (i = 0) => ({
    opacity: 1,
    transition: { duration: 0.5, delay: i * 0.08 },
  }),
};
const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: (i = 0) => ({
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] },
  }),
};

// ─── Animated Section Wrapper ────────────────────────────────────────────────
const Section = ({
  children,
  className = "",
  id = "",
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.section
      ref={ref}
      id={id}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      className={className}
    >
      {children}
    </motion.section>
  );
};

// ─── 3D Hero Visual (CSS-based, no Three.js dependency needed) ───────────────
const HeroDashboard = () => {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 2000);
    return () => clearInterval(id);
  }, []);

  const bars = [65, 80, 55, 90, 72, 88, 60, 95, 70, 85];
  const attendance = [92, 88, 95, 91, 87, 93, 96];
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div
      className="relative w-full h-[520px] flex items-center justify-center"
      style={{ perspective: "1200px" }}
    >
      {/* Ambient glow blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-10 right-10 w-72 h-72 rounded-full opacity-20 blur-3xl"
          style={{
            background: "radial-gradient(circle, #6366f1, transparent)",
          }}
        />
        <div
          className="absolute bottom-10 left-10 w-64 h-64 rounded-full opacity-15 blur-3xl"
          style={{
            background: "radial-gradient(circle, #0ea5e9, transparent)",
          }}
        />
        <div
          className="absolute top-1/2 left-1/2 w-48 h-48 rounded-full opacity-10 blur-2xl -translate-x-1/2 -translate-y-1/2"
          style={{
            background: "radial-gradient(circle, #8b5cf6, transparent)",
          }}
        />
      </div>

      {/* Floating particles */}
      {[...Array(16)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full"
          style={{
            background: ["#6366f1", "#0ea5e9", "#8b5cf6", "#10b981", "#f59e0b"][
              i % 5
            ],
            left: `${10 + ((i * 5.5) % 80)}%`,
            top: `${5 + ((i * 7.3) % 85)}%`,
          }}
          animate={{
            y: [0, -12, 0],
            opacity: [0.3, 0.9, 0.3],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: 2 + (i % 3),
            repeat: Infinity,
            delay: i * 0.3,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Main dashboard card — center */}
      <motion.div
        className="absolute z-20 rounded-2xl border overflow-hidden shadow-2xl"
        style={{
          width: 320,
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%) rotateX(6deg) rotateY(-8deg)",
          background: "rgba(15,15,30,0.85)",
          backdropFilter: "blur(24px)",
          borderColor: "rgba(99,102,241,0.3)",
        }}
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* Header bar */}
        <div
          className="px-4 py-3 flex items-center gap-2 border-b"
          style={{
            borderColor: "rgba(99,102,241,0.15)",
            background: "rgba(99,102,241,0.1)",
          }}
        >
          <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
          <span className="ml-2 text-xs text-gray-400 font-mono">
            EduManage Pro — Dashboard
          </span>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 p-4">
          {[
            { label: "Students", value: "1,248", color: "#6366f1", icon: "👨‍🎓" },
            {
              label: "Attendance",
              value: "94.2%",
              color: "#10b981",
              icon: "✅",
            },
            { label: "Fees Due", value: "৳2.4L", color: "#f59e0b", icon: "💰" },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-xl p-2.5"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: `1px solid ${s.color}22`,
              }}
            >
              <div className="text-base mb-1">{s.icon}</div>
              <div className="text-sm font-bold" style={{ color: s.color }}>
                {s.value}
              </div>
              <div className="text-[10px] text-gray-500">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Bar chart */}
        <div className="px-4 pb-1">
          <div className="text-[10px] text-gray-500 mb-2">
            Monthly Enrollment Trend
          </div>
          <div className="flex items-end gap-1 h-16">
            {bars.map((h, i) => (
              <motion.div
                key={i}
                className="flex-1 rounded-sm"
                style={{
                  background: `linear-gradient(to top, #6366f1, #8b5cf6)`,
                  height: `${h}%`,
                  opacity: 0.8,
                }}
                initial={{ height: 0 }}
                animate={{ height: `${h}%` }}
                transition={{ duration: 0.8, delay: i * 0.07, ease: "easeOut" }}
              />
            ))}
          </div>
          <div className="flex justify-between mt-1">
            {[
              "Jan",
              "Feb",
              "Mar",
              "Apr",
              "May",
              "Jun",
              "Jul",
              "Aug",
              "Sep",
              "Oct",
            ].map((m) => (
              <span key={m} className="text-[8px] text-gray-600">
                {m}
              </span>
            ))}
          </div>
        </div>

        {/* Attendance mini chart */}
        <div className="px-4 py-3">
          <div className="text-[10px] text-gray-500 mb-2">
            Weekly Attendance
          </div>
          <div className="flex items-end gap-1.5 h-10">
            {attendance.map((v, i) => (
              <div
                key={i}
                className="flex-1 flex flex-col items-center gap-0.5"
              >
                <motion.div
                  className="w-full rounded-sm"
                  style={{
                    height: `${v}%`,
                    background: v > 90 ? "#10b981" : "#f59e0b",
                  }}
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ duration: 0.5, delay: 0.8 + i * 0.08 }}
                />
                <span className="text-[7px] text-gray-600">{days[i]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Live activity */}
        <div
          className="px-4 py-2 border-t"
          style={{ borderColor: "rgba(255,255,255,0.05)" }}
        >
          <motion.div
            key={tick}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[10px] text-gray-400">
              {
                [
                  "Riya Ahmed marked present",
                  "Fee paid: Class 8B",
                  "New admission: Farhan",
                  "Exam result uploaded",
                ][tick % 4]
              }
            </span>
          </motion.div>
        </div>
      </motion.div>

      {/* Floating card — top left */}
      <motion.div
        className="absolute z-10 rounded-xl p-3 shadow-xl border"
        style={{
          width: 160,
          top: "8%",
          left: "2%",
          background: "rgba(16,185,129,0.12)",
          backdropFilter: "blur(16px)",
          borderColor: "rgba(16,185,129,0.25)",
          transform: "rotateX(4deg) rotateY(12deg)",
        }}
        animate={{ y: [0, -10, 0], rotate: [-1, 1, -1] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="flex items-center gap-2 mb-2">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-sm"
            style={{ background: "rgba(16,185,129,0.2)" }}
          >
            ✅
          </div>
          <span className="text-xs font-semibold text-emerald-400">
            Attendance
          </span>
        </div>
        <div className="text-2xl font-bold text-white">94.2%</div>
        <div className="text-[10px] text-gray-400 mt-0.5">
          Today · 1,174/1,248
        </div>
        <div className="mt-2 h-1 rounded-full bg-gray-700">
          <motion.div
            className="h-full rounded-full bg-emerald-400"
            style={{ width: "94%" }}
            initial={{ width: 0 }}
            animate={{ width: "94%" }}
            transition={{ duration: 1.2, delay: 0.5 }}
          />
        </div>
      </motion.div>

      {/* Floating card — top right */}
      <motion.div
        className="absolute z-10 rounded-xl p-3 shadow-xl border"
        style={{
          width: 152,
          top: "6%",
          right: "0%",
          background: "rgba(139,92,246,0.12)",
          backdropFilter: "blur(16px)",
          borderColor: "rgba(139,92,246,0.25)",
          transform: "rotateX(4deg) rotateY(-12deg)",
        }}
        animate={{ y: [0, -14, 0], rotate: [1, -1, 1] }}
        transition={{
          duration: 4.5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.8,
        }}
      >
        <div className="flex items-center gap-2 mb-2">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-sm"
            style={{ background: "rgba(139,92,246,0.2)" }}
          >
            🏆
          </div>
          <span className="text-xs font-semibold text-violet-400">Results</span>
        </div>
        <div className="space-y-1">
          {[
            { n: "Arif H.", g: "A+", c: "#10b981" },
            { n: "Sara K.", g: "A", c: "#6366f1" },
            { n: "Rashed M.", g: "B+", c: "#f59e0b" },
          ].map((s) => (
            <div key={s.n} className="flex justify-between items-center">
              <span className="text-[10px] text-gray-400">{s.n}</span>
              <span className="text-[10px] font-bold" style={{ color: s.c }}>
                {s.g}
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Floating card — bottom left */}
      <motion.div
        className="absolute z-10 rounded-xl p-3 shadow-xl border"
        style={{
          width: 148,
          bottom: "4%",
          left: "3%",
          background: "rgba(245,158,11,0.1)",
          backdropFilter: "blur(16px)",
          borderColor: "rgba(245,158,11,0.2)",
          transform: "rotateX(-4deg) rotateY(10deg)",
        }}
        animate={{ y: [0, -8, 0] }}
        transition={{
          duration: 3.5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1.2,
        }}
      >
        <div className="flex items-center gap-1.5 mb-2">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          <span className="text-[10px] font-semibold text-amber-400">
            Fee Collection
          </span>
        </div>
        <div className="text-xl font-bold text-white">৳8.2L</div>
        <div className="text-[10px] text-gray-400">This month</div>
        <div className="flex items-center gap-1 mt-1">
          <TrendingUp size={10} className="text-emerald-400" />
          <span className="text-[10px] text-emerald-400">
            +12% vs last month
          </span>
        </div>
      </motion.div>

      {/* Floating card — bottom right */}
      <motion.div
        className="absolute z-10 rounded-xl p-3 shadow-xl border"
        style={{
          width: 148,
          bottom: "5%",
          right: "0%",
          background: "rgba(14,165,233,0.1)",
          backdropFilter: "blur(16px)",
          borderColor: "rgba(14,165,233,0.2)",
          transform: "rotateX(-4deg) rotateY(-10deg)",
        }}
        animate={{ y: [0, -11, 0] }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.4,
        }}
      >
        <div className="flex items-center gap-1.5 mb-2">
          <Bell size={12} className="text-sky-400" />
          <span className="text-[10px] font-semibold text-sky-400">
            Notifications
          </span>
        </div>
        <div className="space-y-1.5">
          {[
            "Exam schedule live",
            "Parent meeting Fri",
            "Bus route updated",
          ].map((n, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <div className="w-1 h-1 rounded-full bg-sky-400 flex-shrink-0" />
              <span className="text-[10px] text-gray-400 leading-tight">
                {n}
              </span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

// ─── Navbar ──────────────────────────────────────────────────────────────────
const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = ["Features", "Modules", "Pricing", "Testimonials", "FAQ"];

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: scrolled ? "rgba(4,4,16,0.85)" : "transparent",
        backdropFilter: scrolled ? "blur(24px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "none",
      }}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
          >
            <GraduationCap size={18} className="text-white" />
          </div>
          <span className="text-lg font-bold text-white tracking-tight">
            EduManage <span style={{ color: "#6366f1" }}>Pro</span>
          </span>
        </div>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <a
              key={l}
              href={`#${l.toLowerCase()}`}
              className="text-sm text-gray-400 hover:text-white transition-colors duration-200 font-medium"
            >
              {l}
            </a>
          ))}
        </div>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-3">
          <button className="text-sm text-gray-300 hover:text-white transition-colors px-4 py-2 rounded-lg hover:bg-white/5 font-medium">
            Sign In
          </button>
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            className="text-sm font-semibold px-5 py-2 rounded-lg text-white"
            style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
          >
            Start Free Trial
          </motion.button>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden text-gray-400 hover:text-white"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          <Menu size={22} />
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden overflow-hidden border-t"
            style={{
              background: "rgba(4,4,16,0.95)",
              borderColor: "rgba(255,255,255,0.06)",
            }}
          >
            <div className="px-6 py-4 flex flex-col gap-4">
              {links.map((l) => (
                <a
                  key={l}
                  href={`#${l.toLowerCase()}`}
                  className="text-sm text-gray-300 hover:text-white py-1 font-medium"
                  onClick={() => setMobileOpen(false)}
                >
                  {l}
                </a>
              ))}
              <div
                className="flex gap-3 pt-2 border-t"
                style={{ borderColor: "rgba(255,255,255,0.06)" }}
              >
                <button className="flex-1 text-sm border border-gray-700 rounded-lg py-2 text-gray-300 hover:text-white font-medium">
                  Sign In
                </button>
                <button
                  className="flex-1 text-sm rounded-lg py-2 text-white font-semibold"
                  style={{
                    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  }}
                >
                  Free Trial
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

// ─── Hero Section ─────────────────────────────────────────────────────────────
const Hero = () => (
  <section
    className="relative min-h-screen flex items-center overflow-hidden pt-20"
    style={{
      background:
        "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(99,102,241,0.2) 0%, transparent 70%), #030310",
    }}
  >
    {/* Grid bg */}
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        backgroundImage: `linear-gradient(rgba(99,102,241,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.05) 1px, transparent 1px)`,
        backgroundSize: "64px 64px",
      }}
    />

    <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center py-24 w-full">
      {/* Left */}
      <div>
        {/* Badge */}
        <motion.div
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-8 text-xs font-semibold border"
          style={{
            background: "rgba(99,102,241,0.1)",
            borderColor: "rgba(99,102,241,0.3)",
            color: "#a5b4fc",
          }}
        >
          <Zap size={12} />
          <span>Trusted by 500+ Schools across South Asia</span>
          <ChevronRight size={12} />
        </motion.div>

        <motion.h1
          variants={fadeUp}
          custom={0}
          initial="hidden"
          animate="visible"
          className="text-5xl lg:text-6xl xl:text-7xl font-extrabold leading-[1.05] tracking-tight mb-6"
          style={{ color: "#f8fafc" }}
        >
          Run Your{" "}
          <span className="relative">
            <span
              style={{
                background:
                  "linear-gradient(135deg, #6366f1, #a78bfa, #38bdf8)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Entire School
            </span>
          </span>{" "}
          From One Platform
        </motion.h1>

        <motion.p
          variants={fadeUp}
          custom={1}
          initial="hidden"
          animate="visible"
          className="text-lg lg:text-xl text-gray-400 leading-relaxed mb-10 max-w-lg"
        >
          Manage students, attendance, exams, fees, payroll, transport,
          communication and reports from a single modern dashboard — built for
          schools, colleges & madrashas.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          variants={fadeUp}
          custom={2}
          initial="hidden"
          animate="visible"
          className="flex flex-wrap gap-4 mb-12"
        >
          <motion.button
            whileHover={{
              scale: 1.04,
              boxShadow: "0 0 32px rgba(99,102,241,0.5)",
            }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2.5 px-7 py-3.5 rounded-xl text-white font-semibold text-base"
            style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
          >
            <PlayCircle size={18} />
            Book a Demo
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2.5 px-7 py-3.5 rounded-xl font-semibold text-base border text-white"
            style={{
              borderColor: "rgba(255,255,255,0.15)",
              background: "rgba(255,255,255,0.04)",
            }}
          >
            Start Free Trial
            <ArrowRight size={16} />
          </motion.button>
        </motion.div>

        {/* Trust badges */}
        <motion.div
          variants={fadeUp}
          custom={3}
          initial="hidden"
          animate="visible"
          className="flex flex-wrap gap-6"
        >
          {[
            { val: "500+", label: "Schools", icon: "🏫" },
            { val: "50,000+", label: "Students", icon: "🎓" },
            { val: "99.9%", label: "Uptime SLA", icon: "⚡" },
          ].map((b) => (
            <div key={b.label} className="flex items-center gap-2.5">
              <span className="text-xl">{b.icon}</span>
              <div>
                <div className="text-white font-bold text-lg leading-none">
                  {b.val}
                </div>
                <div className="text-gray-500 text-xs mt-0.5">{b.label}</div>
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Right — 3D Dashboard */}
      <motion.div
        variants={scaleIn}
        initial="hidden"
        animate="visible"
        custom={0.5}
        className="hidden lg:block relative"
      >
        <HeroDashboard />
      </motion.div>
    </div>

    {/* Scroll indicator */}
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 2 }}
      className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
    >
      <span className="text-gray-600 text-xs font-medium tracking-widest uppercase">
        Scroll
      </span>
      <motion.div
        animate={{ y: [0, 6, 0] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className="w-5 h-8 rounded-full border-2 border-gray-700 flex items-start justify-center pt-1.5"
      >
        <div className="w-1 h-2 rounded-full bg-gray-500" />
      </motion.div>
    </motion.div>
  </section>
);

// ─── Trusted By ──────────────────────────────────────────────────────────────
const TrustedBy = () => {
  const schools = [
    "Dhaka Residential Model College",
    "BRAC School Network",
    "Aga Khan School",
    "Milestone College",
    "Ideal School & College",
    "Notre Dame College",
    "Viqarunnisa Noon School",
    "Rajuk Uttara Model College",
  ];
  return (
    <section
      className="py-16 overflow-hidden"
      style={{
        background: "#030310",
        borderTop: "1px solid rgba(255,255,255,0.05)",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <div className="max-w-7xl mx-auto px-6">
        <p className="text-center text-gray-600 text-sm font-medium uppercase tracking-widest mb-8">
          Trusted by leading educational institutions
        </p>
        <div className="relative overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 w-32 z-10"
            style={{
              background: "linear-gradient(to right, #030310, transparent)",
            }}
          />
          <div
            className="absolute inset-y-0 right-0 w-32 z-10"
            style={{
              background: "linear-gradient(to left, #030310, transparent)",
            }}
          />
          <motion.div
            className="flex gap-12 whitespace-nowrap"
            animate={{ x: ["0%", "-50%"] }}
            transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
          >
            {[...schools, ...schools].map((s, i) => (
              <div key={i} className="flex items-center gap-3 shrink-0">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{
                    background: `rgba(${[99, 139, 16, 245, 14][i % 5]},${[102, 92, 185, 158, 165][i % 5]},${[241, 246, 129, 11, 233][i % 5]},0.15)`,
                  }}
                >
                  <Building2 size={14} className="text-gray-400" />
                </div>
                <span className="text-gray-500 text-sm font-medium">{s}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

// ─── Core Modules ─────────────────────────────────────────────────────────────
const modules: Module[] = [
  {
    icon: <Users size={22} />,
    title: "Student Management",
    desc: "Complete student profiles, enrollment, promotion, and academic history tracking.",
    color: "#6366f1",
    bg: "rgba(99,102,241,0.1)",
  },
  {
    icon: <GraduationCap size={22} />,
    title: "Teacher Management",
    desc: "Teacher profiles, schedules, leave management, and performance tracking.",
    color: "#8b5cf6",
    bg: "rgba(139,92,246,0.1)",
  },
  {
    icon: <ClipboardCheck size={22} />,
    title: "Attendance System",
    desc: "Daily attendance with biometric integration, SMS alerts to parents.",
    color: "#10b981",
    bg: "rgba(16,185,129,0.1)",
  },
  {
    icon: <BarChart3 size={22} />,
    title: "Exam & Results",
    desc: "Exam scheduling, grading, marksheets, report cards and certificates.",
    color: "#0ea5e9",
    bg: "rgba(14,165,233,0.1)",
  },
  {
    icon: <DollarSign size={22} />,
    title: "Fee & Accounts",
    desc: "Fee collection, invoices, receipts, ledgers and financial reports.",
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.1)",
  },
  {
    icon: <Wallet size={22} />,
    title: "Payroll",
    desc: "Staff salary processing, allowances, deductions and payslip generation.",
    color: "#ef4444",
    bg: "rgba(239,68,68,0.1)",
  },
  {
    icon: <Package size={22} />,
    title: "Inventory",
    desc: "Library books, lab equipment, stationery tracking and management.",
    color: "#06b6d4",
    bg: "rgba(6,182,212,0.1)",
  },
  {
    icon: <Bus size={22} />,
    title: "Transport",
    desc: "Route management, vehicle tracking, driver info and student assignment.",
    color: "#84cc16",
    bg: "rgba(132,204,22,0.1)",
  },
  {
    icon: <MessageSquare size={22} />,
    title: "SMS Notifications",
    desc: "Bulk SMS to parents for attendance, results, fees and announcements.",
    color: "#a855f7",
    bg: "rgba(168,85,247,0.1)",
  },
  {
    icon: <UserPlus size={22} />,
    title: "Online Admission",
    desc: "Digital admission forms, document uploads, payment and approval workflow.",
    color: "#f97316",
    bg: "rgba(249,115,22,0.1)",
  },
  {
    icon: <Smartphone size={22} />,
    title: "Parent Portal",
    desc: "Mobile app for parents to track attendance, homework, results and fees.",
    color: "#ec4899",
    bg: "rgba(236,72,153,0.1)",
  },
  {
    icon: <Globe size={22} />,
    title: "School Website",
    desc: "Built-in website builder with CMS, news, events and admissions page.",
    color: "#14b8a6",
    bg: "rgba(20,184,166,0.1)",
  },
];

const Modules = () => (
  <Section id="features" className="py-28 max-w-7xl mx-auto px-6">
    <motion.div variants={fadeUp} className="text-center mb-16">
      <span
        className="inline-block text-xs font-semibold uppercase tracking-widest mb-4 px-3 py-1 rounded-full"
        style={{
          color: "#a5b4fc",
          background: "rgba(99,102,241,0.1)",
          border: "1px solid rgba(99,102,241,0.2)",
        }}
      >
        All-In-One Platform
      </span>
      <h2 className="text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-4">
        Every Module Your School Needs
      </h2>
      <p className="text-gray-400 text-lg max-w-2xl mx-auto">
        12 integrated modules covering every aspect of school operations — no
        more juggling spreadsheets and disconnected tools.
      </p>
    </motion.div>
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {modules.map((m, i) => (
        <motion.div
          key={m.title}
          variants={scaleIn}
          custom={i * 0.5}
          whileHover={{ y: -6, scale: 1.02 }}
          className="rounded-2xl p-5 cursor-pointer group transition-all duration-300"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: `1px solid rgba(255,255,255,0.07)`,
            backdropFilter: "blur(8px)",
          }}
        >
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110"
            style={{
              background: m.bg,
              color: m.color,
              border: `1px solid ${m.color}33`,
            }}
          >
            {m.icon}
          </div>
          <h3 className="text-white font-semibold mb-2 text-sm">{m.title}</h3>
          <p className="text-gray-500 text-xs leading-relaxed">{m.desc}</p>
          {/* Gradient border on hover */}
          <div
            className="mt-3 h-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{
              background: `linear-gradient(to right, ${m.color}, transparent)`,
            }}
          />
        </motion.div>
      ))}
    </div>
  </Section>
);

// ─── Dashboard Showcase ───────────────────────────────────────────────────────
const DashboardShowcase = () => {
  const [activeTab, setActiveTab] = useState(0);
  const tabs = ["Overview", "Attendance", "Finance", "Academics"];

  const feeData = [
    {
      class: "Class 6",
      collected: "৳1,24,000",
      pending: "৳12,000",
      rate: "91%",
    },
    {
      class: "Class 7",
      collected: "৳1,18,500",
      pending: "৳8,500",
      rate: "93%",
    },
    {
      class: "Class 8",
      collected: "৳1,32,000",
      pending: "৳15,000",
      rate: "90%",
    },
    {
      class: "Class 9",
      collected: "৳1,45,000",
      pending: "৳5,000",
      rate: "97%",
    },
    { class: "Class 10", collected: "৳1,56,000", pending: "৳0", rate: "100%" },
  ];

  return (
    <Section
      id="modules"
      className="py-28"
      style={{ background: "rgba(255,255,255,0.01)" }}
    >
      <div className="max-w-7xl mx-auto px-6">
        <motion.div variants={fadeUp} className="text-center mb-12">
          <span
            className="inline-block text-xs font-semibold uppercase tracking-widest mb-4 px-3 py-1 rounded-full"
            style={{
              color: "#34d399",
              background: "rgba(16,185,129,0.1)",
              border: "1px solid rgba(16,185,129,0.2)",
            }}
          >
            Live Dashboard
          </span>
          <h2 className="text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-4">
            Powerful Analytics at a Glance
          </h2>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            Real-time data, beautiful charts, and actionable insights — all in
            one place.
          </p>
        </motion.div>

        <motion.div
          variants={scaleIn}
          className="rounded-2xl overflow-hidden border"
          style={{
            background: "rgba(8,8,25,0.9)",
            borderColor: "rgba(255,255,255,0.08)",
            backdropFilter: "blur(16px)",
          }}
        >
          {/* Dashboard header bar */}
          <div
            className="flex items-center justify-between px-6 py-4 border-b"
            style={{
              borderColor: "rgba(255,255,255,0.06)",
              background: "rgba(99,102,241,0.05)",
            }}
          >
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-red-400/70" />
              <div className="w-3 h-3 rounded-full bg-yellow-400/70" />
              <div className="w-3 h-3 rounded-full bg-green-400/70" />
              <span className="ml-3 text-xs text-gray-500 font-mono">
                EduManage Pro — Analytics Dashboard
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span>Live</span>
            </div>
          </div>

          {/* Tab bar */}
          <div
            className="flex gap-1 px-6 pt-4 pb-2 border-b"
            style={{ borderColor: "rgba(255,255,255,0.05)" }}
          >
            {tabs.map((t, i) => (
              <button
                key={t}
                onClick={() => setActiveTab(i)}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                style={{
                  color: activeTab === i ? "#a5b4fc" : "#6b7280",
                  background:
                    activeTab === i ? "rgba(99,102,241,0.15)" : "transparent",
                  border:
                    activeTab === i
                      ? "1px solid rgba(99,102,241,0.25)"
                      : "1px solid transparent",
                }}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Dashboard content */}
          <div className="p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
              >
                {activeTab === 0 && (
                  <div>
                    {/* KPI cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                      {[
                        {
                          label: "Total Students",
                          value: "1,248",
                          change: "+48",
                          color: "#6366f1",
                          icon: <Users size={16} />,
                        },
                        {
                          label: "Teachers",
                          value: "87",
                          change: "+3",
                          color: "#10b981",
                          icon: <GraduationCap size={16} />,
                        },
                        {
                          label: "Monthly Revenue",
                          value: "৳8.2L",
                          change: "+12%",
                          color: "#f59e0b",
                          icon: <DollarSign size={16} />,
                        },
                        {
                          label: "Avg Attendance",
                          value: "94.2%",
                          change: "+1.3%",
                          color: "#0ea5e9",
                          icon: <CheckCircle2 size={16} />,
                        },
                      ].map((k) => (
                        <div
                          key={k.label}
                          className="rounded-xl p-4 border"
                          style={{
                            background: "rgba(255,255,255,0.03)",
                            borderColor: "rgba(255,255,255,0.07)",
                          }}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div style={{ color: k.color }}>{k.icon}</div>
                            <span
                              className="text-xs px-2 py-0.5 rounded-full font-medium"
                              style={{
                                background: "rgba(16,185,129,0.1)",
                                color: "#34d399",
                              }}
                            >
                              {k.change}
                            </span>
                          </div>
                          <div className="text-2xl font-bold text-white mb-1">
                            {k.value}
                          </div>
                          <div className="text-xs text-gray-500">{k.label}</div>
                        </div>
                      ))}
                    </div>
                    {/* Inline bar chart visualization */}
                    <div
                      className="rounded-xl p-5 border"
                      style={{
                        background: "rgba(255,255,255,0.02)",
                        borderColor: "rgba(255,255,255,0.06)",
                      }}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-semibold text-white">
                          Student Enrollment — 2024
                        </h4>
                        <span className="text-xs text-gray-500">Monthly</span>
                      </div>
                      <div className="flex items-end gap-2 h-28">
                        {[60, 72, 65, 88, 92, 78, 85, 95, 80, 90, 75, 100].map(
                          (h, i) => (
                            <div
                              key={i}
                              className="flex-1 flex flex-col items-center gap-1"
                            >
                              <motion.div
                                className="w-full rounded-t-sm"
                                style={{
                                  height: `${h}%`,
                                  background: `linear-gradient(to top, #6366f1, #8b5cf6)`,
                                  opacity: 0.8,
                                }}
                                initial={{ height: 0 }}
                                animate={{ height: `${h}%` }}
                                transition={{
                                  duration: 0.8,
                                  delay: 0.5 + i * 0.06,
                                }}
                              />
                              <span className="text-[8px] text-gray-600">
                                {
                                  [
                                    "J",
                                    "F",
                                    "M",
                                    "A",
                                    "M",
                                    "J",
                                    "J",
                                    "A",
                                    "S",
                                    "O",
                                    "N",
                                    "D",
                                  ][i]
                                }
                              </span>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 1 && (
                  <div>
                    <div className="grid lg:grid-cols-2 gap-5 mb-5">
                      {/* Donut-style attendance */}
                      <div
                        className="rounded-xl p-5 border"
                        style={{
                          background: "rgba(255,255,255,0.02)",
                          borderColor: "rgba(255,255,255,0.06)",
                        }}
                      >
                        <h4 className="text-sm font-semibold text-white mb-4">
                          Today's Attendance
                        </h4>
                        <div className="flex items-center gap-6">
                          <div className="relative w-24 h-24 flex-shrink-0">
                            <svg
                              viewBox="0 0 100 100"
                              className="w-full h-full -rotate-90"
                            >
                              <circle
                                cx="50"
                                cy="50"
                                r="40"
                                fill="none"
                                stroke="rgba(255,255,255,0.06)"
                                strokeWidth="12"
                              />
                              <motion.circle
                                cx="50"
                                cy="50"
                                r="40"
                                fill="none"
                                stroke="#10b981"
                                strokeWidth="12"
                                strokeDasharray="251.2"
                                initial={{ strokeDashoffset: 251.2 }}
                                animate={{
                                  strokeDashoffset: 251.2 * (1 - 0.942),
                                }}
                                transition={{ duration: 1.2, ease: "easeOut" }}
                                strokeLinecap="round"
                              />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <span className="text-lg font-bold text-white">
                                94%
                              </span>
                            </div>
                          </div>
                          <div className="space-y-2">
                            {[
                              {
                                label: "Present",
                                val: "1,174",
                                color: "#10b981",
                              },
                              { label: "Absent", val: "52", color: "#ef4444" },
                              { label: "Late", val: "22", color: "#f59e0b" },
                            ].map((s) => (
                              <div
                                key={s.label}
                                className="flex items-center gap-2"
                              >
                                <div
                                  className="w-2.5 h-2.5 rounded-full"
                                  style={{ background: s.color }}
                                />
                                <span className="text-xs text-gray-400">
                                  {s.label}
                                </span>
                                <span className="text-xs font-semibold text-white ml-auto">
                                  {s.val}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      {/* Weekly trend */}
                      <div
                        className="rounded-xl p-5 border"
                        style={{
                          background: "rgba(255,255,255,0.02)",
                          borderColor: "rgba(255,255,255,0.06)",
                        }}
                      >
                        <h4 className="text-sm font-semibold text-white mb-4">
                          Weekly Attendance Rate
                        </h4>
                        <div className="flex items-end gap-3 h-20">
                          {[91, 94, 88, 96, 93, 87, 95].map((v, i) => (
                            <div
                              key={i}
                              className="flex-1 flex flex-col items-center gap-1"
                            >
                              <motion.div
                                className="w-full rounded-sm"
                                style={{
                                  height: `${v}%`,
                                  background:
                                    v >= 93
                                      ? "#10b981"
                                      : v >= 90
                                        ? "#f59e0b"
                                        : "#ef4444",
                                  opacity: 0.8,
                                }}
                                initial={{ height: 0 }}
                                animate={{ height: `${v}%` }}
                                transition={{ duration: 0.7, delay: i * 0.1 }}
                              />
                              <span className="text-[9px] text-gray-500">
                                {["M", "T", "W", "T", "F", "S", "S"][i]}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    {/* Class-wise table */}
                    <div
                      className="rounded-xl border overflow-hidden"
                      style={{ borderColor: "rgba(255,255,255,0.06)" }}
                    >
                      <table className="w-full text-xs">
                        <thead>
                          <tr style={{ background: "rgba(255,255,255,0.03)" }}>
                            {[
                              "Class",
                              "Total",
                              "Present",
                              "Absent",
                              "Rate",
                            ].map((h) => (
                              <th
                                key={h}
                                className="px-4 py-3 text-left text-gray-500 font-medium"
                              >
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            ["Class 6", "48", "46", "2", "96%"],
                            ["Class 7", "52", "49", "3", "94%"],
                            ["Class 8", "50", "46", "4", "92%"],
                            ["Class 9", "55", "50", "5", "91%"],
                            ["Class 10", "45", "44", "1", "98%"],
                          ].map((row, i) => (
                            <tr
                              key={i}
                              className="border-t"
                              style={{ borderColor: "rgba(255,255,255,0.04)" }}
                            >
                              {row.map((cell, j) => (
                                <td
                                  key={j}
                                  className="px-4 py-2.5 text-gray-300"
                                  style={{
                                    color:
                                      j === 4
                                        ? parseInt(cell) >= 95
                                          ? "#10b981"
                                          : "#f59e0b"
                                        : undefined,
                                  }}
                                >
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {activeTab === 2 && (
                  <div>
                    <div className="grid grid-cols-3 gap-4 mb-5">
                      {[
                        {
                          label: "Total Collected",
                          val: "৳8,24,500",
                          icon: <CheckCircle2 size={16} />,
                          color: "#10b981",
                        },
                        {
                          label: "Pending",
                          val: "৳40,500",
                          icon: <AlertCircle size={16} />,
                          color: "#f59e0b",
                        },
                        {
                          label: "Defaulters",
                          val: "32",
                          icon: <Clock size={16} />,
                          color: "#ef4444",
                        },
                      ].map((k) => (
                        <div
                          key={k.label}
                          className="rounded-xl p-4 border"
                          style={{
                            background: "rgba(255,255,255,0.03)",
                            borderColor: "rgba(255,255,255,0.07)",
                          }}
                        >
                          <div style={{ color: k.color }} className="mb-2">
                            {k.icon}
                          </div>
                          <div className="text-xl font-bold text-white">
                            {k.val}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {k.label}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div
                      className="rounded-xl border overflow-hidden"
                      style={{ borderColor: "rgba(255,255,255,0.06)" }}
                    >
                      <div
                        className="px-5 py-3 border-b"
                        style={{
                          borderColor: "rgba(255,255,255,0.05)",
                          background: "rgba(255,255,255,0.02)",
                        }}
                      >
                        <h4 className="text-sm font-semibold text-white">
                          Class-wise Fee Collection
                        </h4>
                      </div>
                      <table className="w-full text-xs">
                        <thead>
                          <tr style={{ background: "rgba(255,255,255,0.02)" }}>
                            {["Class", "Collected", "Pending", "Rate"].map(
                              (h) => (
                                <th
                                  key={h}
                                  className="px-5 py-3 text-left text-gray-500 font-medium"
                                >
                                  {h}
                                </th>
                              ),
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {feeData.map((row, i) => (
                            <tr
                              key={i}
                              className="border-t"
                              style={{ borderColor: "rgba(255,255,255,0.04)" }}
                            >
                              <td className="px-5 py-3 text-gray-300">
                                {row.class}
                              </td>
                              <td className="px-5 py-3 text-emerald-400 font-medium">
                                {row.collected}
                              </td>
                              <td className="px-5 py-3 text-amber-400">
                                {row.pending}
                              </td>
                              <td className="px-5 py-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-16 h-1.5 rounded-full bg-gray-800">
                                    <div
                                      className="h-full rounded-full"
                                      style={{
                                        width: row.rate,
                                        background:
                                          parseInt(row.rate) === 100
                                            ? "#10b981"
                                            : "#6366f1",
                                      }}
                                    />
                                  </div>
                                  <span className="text-gray-300">
                                    {row.rate}
                                  </span>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {activeTab === 3 && (
                  <div>
                    <div className="grid lg:grid-cols-2 gap-5">
                      <div
                        className="rounded-xl p-5 border"
                        style={{
                          background: "rgba(255,255,255,0.02)",
                          borderColor: "rgba(255,255,255,0.06)",
                        }}
                      >
                        <h4 className="text-sm font-semibold text-white mb-4">
                          Grade Distribution — Final Exam
                        </h4>
                        <div className="space-y-3">
                          {[
                            {
                              grade: "A+",
                              count: 248,
                              pct: 78,
                              color: "#10b981",
                            },
                            {
                              grade: "A",
                              count: 312,
                              pct: 65,
                              color: "#6366f1",
                            },
                            {
                              grade: "A-",
                              count: 287,
                              pct: 55,
                              color: "#0ea5e9",
                            },
                            {
                              grade: "B+",
                              count: 201,
                              pct: 40,
                              color: "#f59e0b",
                            },
                            {
                              grade: "B",
                              count: 145,
                              pct: 28,
                              color: "#f97316",
                            },
                            {
                              grade: "C",
                              count: 55,
                              pct: 12,
                              color: "#ef4444",
                            },
                          ].map((g, i) => (
                            <div
                              key={g.grade}
                              className="flex items-center gap-3"
                            >
                              <span
                                className="text-xs font-bold w-6"
                                style={{ color: g.color }}
                              >
                                {g.grade}
                              </span>
                              <div className="flex-1 h-4 rounded-sm bg-gray-800/60 overflow-hidden">
                                <motion.div
                                  className="h-full rounded-sm"
                                  style={{ background: `${g.color}bb` }}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${g.pct}%` }}
                                  transition={{
                                    duration: 0.9,
                                    delay: 0.2 + i * 0.1,
                                  }}
                                />
                              </div>
                              <span className="text-xs text-gray-400 w-10 text-right">
                                {g.count}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div
                        className="rounded-xl p-5 border"
                        style={{
                          background: "rgba(255,255,255,0.02)",
                          borderColor: "rgba(255,255,255,0.06)",
                        }}
                      >
                        <h4 className="text-sm font-semibold text-white mb-4">
                          Top Performers
                        </h4>
                        <div className="space-y-3">
                          {[
                            {
                              name: "Farida Begum",
                              class: "Class 10A",
                              score: "98.6%",
                              rank: 1,
                            },
                            {
                              name: "Rakibul Hasan",
                              class: "Class 10B",
                              score: "97.2%",
                              rank: 2,
                            },
                            {
                              name: "Sumaya Akter",
                              class: "Class 9A",
                              score: "96.8%",
                              rank: 3,
                            },
                            {
                              name: "Nafis Ahmed",
                              class: "Class 10A",
                              score: "95.4%",
                              rank: 4,
                            },
                            {
                              name: "Tasnim Jahan",
                              class: "Class 9B",
                              score: "94.9%",
                              rank: 5,
                            },
                          ].map((s) => (
                            <div
                              key={s.name}
                              className="flex items-center gap-3"
                            >
                              <span
                                className="text-sm font-bold w-5"
                                style={{
                                  color: s.rank <= 3 ? "#f59e0b" : "#6b7280",
                                }}
                              >
                                #{s.rank}
                              </span>
                              <div
                                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                                style={{
                                  background: "rgba(99,102,241,0.2)",
                                  color: "#a5b4fc",
                                }}
                              >
                                {s.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </div>
                              <div className="flex-1">
                                <div className="text-xs text-white font-medium">
                                  {s.name}
                                </div>
                                <div className="text-[10px] text-gray-500">
                                  {s.class}
                                </div>
                              </div>
                              <span className="text-xs font-bold text-emerald-400">
                                {s.score}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </Section>
  );
};

// ─── Role Based Access ────────────────────────────────────────────────────────
const roles: Role[] = [
  {
    title: "Super Admin",
    perms: [
      "Full system access",
      "Multi-school management",
      "Billing & subscriptions",
    ],
    color: "#f59e0b",
    icon: <Shield size={18} />,
  },
  {
    title: "Principal",
    perms: ["All reports", "Staff management", "Academic oversight"],
    color: "#6366f1",
    icon: <Award size={18} />,
  },
  {
    title: "Teacher",
    perms: ["Attendance entry", "Marks entry", "Homework assign"],
    color: "#10b981",
    icon: <BookOpen size={18} />,
  },
  {
    title: "Accountant",
    perms: ["Fee collection", "Payroll", "Financial reports"],
    color: "#0ea5e9",
    icon: <DollarSign size={18} />,
  },
  {
    title: "Parent",
    perms: ["Child attendance", "Fee payment", "Results view"],
    color: "#a855f7",
    icon: <Smartphone size={18} />,
  },
  {
    title: "Student",
    perms: ["Own results", "Timetable", "Homework view"],
    color: "#ec4899",
    icon: <GraduationCap size={18} />,
  },
];

const RoleAccess = () => (
  <Section className="py-28 max-w-7xl mx-auto px-6">
    <motion.div variants={fadeUp} className="text-center mb-16">
      <span
        className="inline-block text-xs font-semibold uppercase tracking-widest mb-4 px-3 py-1 rounded-full"
        style={{
          color: "#f59e0b",
          background: "rgba(245,158,11,0.1)",
          border: "1px solid rgba(245,158,11,0.2)",
        }}
      >
        Security First
      </span>
      <h2 className="text-4xl lg:text-5xl font-extrabold text-white mb-4">
        Role-Based Access Control
      </h2>
      <p className="text-gray-400 text-lg max-w-xl mx-auto">
        Every stakeholder gets a tailored experience. Fine-grained permissions
        ensure the right people see the right data.
      </p>
    </motion.div>

    <div className="relative">
      {/* Connection line */}
      <div
        className="hidden lg:block absolute left-1/2 top-12 bottom-12 w-0.5 -translate-x-1/2"
        style={{
          background:
            "linear-gradient(to bottom, #f59e0b33, #ec4899, #ec4899, #ec4899, #ec4899, #ec489933)",
        }}
      />

      <div className="flex flex-col gap-4 lg:gap-5">
        {roles.map((r, i) => (
          <motion.div
            key={r.title}
            variants={fadeUp}
            custom={i * 0.5}
            whileHover={{ x: i % 2 === 0 ? 6 : -6 }}
            className={`flex items-start gap-5 max-w-sm rounded-2xl p-5 border cursor-pointer transition-all duration-300 ${i % 2 === 0 ? "self-start" : "self-end"} lg:w-5/12`}
            style={{
              background: `${r.color}0d`,
              borderColor: `${r.color}33`,
              backdropFilter: "blur(8px)",
            }}
          >
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background: `${r.color}22`,
                color: r.color,
                border: `1px solid ${r.color}44`,
              }}
            >
              {r.icon}
            </div>
            <div>
              <h3 className="font-bold text-white mb-1.5">{r.title}</h3>
              <div className="flex flex-wrap gap-1.5">
                {r.perms.map((p) => (
                  <span
                    key={p}
                    className="text-[10px] px-2 py-0.5 rounded-full"
                    style={{
                      background: `${r.color}22`,
                      color: r.color,
                      border: `1px solid ${r.color}33`,
                    }}
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </Section>
);

// ─── Parent Portal Preview ────────────────────────────────────────────────────
const ParentPortal = () => {
  const [screen, setScreen] = useState(0);
  const screens = ["Attendance", "Results", "Homework", "Notifications"];

  return (
    <Section
      className="py-28"
      style={{
        background:
          "radial-gradient(ellipse 60% 80% at 50% 50%, rgba(168,85,247,0.06) 0%, transparent 70%)",
      }}
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Text */}
          <div>
            <motion.div variants={fadeUp}>
              <span
                className="inline-block text-xs font-semibold uppercase tracking-widest mb-4 px-3 py-1 rounded-full"
                style={{
                  color: "#c084fc",
                  background: "rgba(168,85,247,0.1)",
                  border: "1px solid rgba(168,85,247,0.2)",
                }}
              >
                Parent Portal
              </span>
              <h2 className="text-4xl lg:text-5xl font-extrabold text-white mb-6">
                Parents Stay Connected,{" "}
                <span style={{ color: "#c084fc" }}>Always</span>
              </h2>
              <p className="text-gray-400 text-lg mb-8 leading-relaxed">
                Mobile-first parent app gives real-time visibility into their
                child's attendance, exam results, fee dues, homework and school
                announcements.
              </p>
            </motion.div>
            <motion.div variants={fadeUp} custom={0.3} className="space-y-4">
              {[
                {
                  icon: "📍",
                  title: "Live Attendance Alerts",
                  desc: "Instant SMS and app notification when child is marked absent.",
                },
                {
                  icon: "📊",
                  title: "Academic Progress",
                  desc: "View exam results, grade trends and teacher remarks.",
                },
                {
                  icon: "💳",
                  title: "Fee Payment Online",
                  desc: "Pay fees via bKash, Nagad, credit card or bank transfer.",
                },
                {
                  icon: "📚",
                  title: "Homework Tracker",
                  desc: "Daily homework assignments from all subjects in one place.",
                },
              ].map((f) => (
                <div key={f.title} className="flex items-start gap-4">
                  <span className="text-2xl">{f.icon}</span>
                  <div>
                    <h4 className="text-white font-semibold text-sm mb-0.5">
                      {f.title}
                    </h4>
                    <p className="text-gray-500 text-sm">{f.desc}</p>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Phone mockup */}
          <motion.div variants={scaleIn} className="flex justify-center">
            <div className="relative">
              {/* Glow */}
              <div
                className="absolute inset-0 rounded-[3rem] opacity-30 blur-2xl scale-110"
                style={{
                  background: "radial-gradient(circle, #a855f7, transparent)",
                }}
              />

              {/* Phone frame */}
              <div
                className="relative w-72 rounded-[2.8rem] border-4 overflow-hidden shadow-2xl"
                style={{
                  background: "#0a0a1a",
                  borderColor: "#1e1e3a",
                  height: 580,
                }}
              >
                {/* Notch */}
                <div className="flex justify-center pt-3 pb-2">
                  <div
                    className="w-24 h-5 rounded-full"
                    style={{ background: "#1e1e3a" }}
                  />
                </div>

                {/* Status bar */}
                <div className="flex justify-between px-5 pb-2 text-[10px] text-gray-500">
                  <span>9:41 AM</span>
                  <span>◼ ◼ ◼ ▲</span>
                </div>

                {/* App header */}
                <div className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-gray-500">Good morning,</div>
                    <div className="text-sm font-bold text-white">
                      Mrs. Ahmed 👋
                    </div>
                  </div>
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                    style={{ background: "rgba(168,85,247,0.2)" }}
                  >
                    👩
                  </div>
                </div>

                {/* Tab selector */}
                <div
                  className="flex gap-1 mx-4 mb-3 p-1 rounded-xl"
                  style={{ background: "rgba(255,255,255,0.05)" }}
                >
                  {screens.map((s, i) => (
                    <button
                      key={s}
                      onClick={() => setScreen(i)}
                      className="flex-1 text-[9px] py-1.5 rounded-lg font-medium transition-all duration-200"
                      style={{
                        background:
                          screen === i ? "rgba(168,85,247,0.4)" : "transparent",
                        color: screen === i ? "#e9d5ff" : "#6b7280",
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>

                {/* Content */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={screen}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="px-4 space-y-3"
                  >
                    {screen === 0 && (
                      <>
                        <div
                          className="rounded-xl p-4 text-center"
                          style={{
                            background: "rgba(16,185,129,0.1)",
                            border: "1px solid rgba(16,185,129,0.2)",
                          }}
                        >
                          <div className="text-3xl font-bold text-white">
                            94.2%
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            Attendance this month
                          </div>
                          <div className="flex justify-center gap-4 mt-3 text-xs">
                            <span className="text-emerald-400">
                              ✓ 19 Present
                            </span>
                            <span className="text-red-400">✗ 1 Absent</span>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 font-medium mb-1">
                          This Week
                        </div>
                        <div className="flex gap-1.5">
                          {["M", "T", "W", "T", "F"].map((d, i) => (
                            <div
                              key={d}
                              className="flex-1 rounded-lg p-2 text-center"
                              style={{
                                background:
                                  i === 3
                                    ? "rgba(239,68,68,0.15)"
                                    : "rgba(16,185,129,0.1)",
                              }}
                            >
                              <div className="text-[9px] text-gray-500">
                                {d}
                              </div>
                              <div className="text-sm mt-1">
                                {i === 3 ? "❌" : "✅"}
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                    {screen === 1 && (
                      <div className="space-y-2">
                        <div
                          className="rounded-xl p-4"
                          style={{
                            background: "rgba(99,102,241,0.1)",
                            border: "1px solid rgba(99,102,241,0.2)",
                          }}
                        >
                          <div className="text-xs text-gray-500 mb-1">
                            Latest Exam — Mid Term 2024
                          </div>
                          <div className="text-2xl font-bold text-white">
                            85.4%{" "}
                            <span className="text-sm text-indigo-400">A</span>
                          </div>
                          <div className="text-xs text-gray-500">
                            Rank: 12 / 52
                          </div>
                        </div>
                        {[
                          ["Math", "92", "#10b981"],
                          ["English", "88", "#6366f1"],
                          ["Science", "80", "#0ea5e9"],
                          ["Bangla", "82", "#f59e0b"],
                        ].map((s) => (
                          <div key={s[0]} className="flex items-center gap-3">
                            <span className="text-xs text-gray-400 w-16">
                              {s[0]}
                            </span>
                            <div className="flex-1 h-2 rounded-full bg-gray-800">
                              <div
                                className="h-full rounded-full"
                                style={{ width: `${s[1]}%`, background: s[2] }}
                              />
                            </div>
                            <span
                              className="text-xs font-bold"
                              style={{ color: s[2] }}
                            >
                              {s[1]}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    {screen === 2 && (
                      <div className="space-y-2">
                        {[
                          {
                            sub: "Math",
                            hw: "Chapter 5 Ex 3 — Q1-10",
                            due: "Tomorrow",
                            color: "#6366f1",
                          },
                          {
                            sub: "English",
                            hw: "Write an essay on environment",
                            due: "Friday",
                            color: "#0ea5e9",
                          },
                          {
                            sub: "Science",
                            hw: "Lab report — Photosynthesis",
                            due: "Next Week",
                            color: "#10b981",
                          },
                        ].map((h) => (
                          <div
                            key={h.sub}
                            className="rounded-xl p-3"
                            style={{
                              background: "rgba(255,255,255,0.04)",
                              border: "1px solid rgba(255,255,255,0.07)",
                            }}
                          >
                            <div className="flex justify-between items-start mb-1">
                              <span
                                className="text-xs font-bold"
                                style={{ color: h.color }}
                              >
                                {h.sub}
                              </span>
                              <span className="text-[9px] text-gray-500">
                                {h.due}
                              </span>
                            </div>
                            <p className="text-[10px] text-gray-400">{h.hw}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    {screen === 3 && (
                      <div className="space-y-2">
                        {[
                          {
                            msg: "Exam schedule for Dec uploaded",
                            time: "2h ago",
                            type: "📢",
                          },
                          {
                            msg: "Parent-Teacher meeting on Dec 15",
                            time: "Yesterday",
                            type: "📅",
                          },
                          {
                            msg: "Fee for Dec is due — Pay now",
                            time: "2d ago",
                            type: "💳",
                          },
                          {
                            msg: "Karim was marked absent today",
                            time: "3d ago",
                            type: "⚠️",
                          },
                        ].map((n) => (
                          <div
                            key={n.msg}
                            className="flex gap-3 rounded-xl p-3"
                            style={{
                              background: "rgba(255,255,255,0.04)",
                              border: "1px solid rgba(255,255,255,0.06)",
                            }}
                          >
                            <span className="text-base">{n.type}</span>
                            <div>
                              <p className="text-[10px] text-gray-300 leading-tight">
                                {n.msg}
                              </p>
                              <span className="text-[9px] text-gray-600">
                                {n.time}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </Section>
  );
};

// ─── Comparison Table ─────────────────────────────────────────────────────────
const Comparison = () => {
  const rows = [
    ["Student Records", false, true],
    ["Automated Attendance", false, true],
    ["Online Fee Payment", false, true],
    ["Real-time Reports", false, true],
    ["Parent Portal App", false, true],
    ["Payroll Automation", false, true],
    ["Multi-branch Support", false, true],
    ["SMS Notifications", false, true],
    ["Data Backup & Security", false, true],
    ["24/7 Support", false, true],
  ];

  return (
    <Section className="py-28 max-w-7xl mx-auto px-6">
      <motion.div variants={fadeUp} className="text-center mb-14">
        <span
          className="inline-block text-xs font-semibold uppercase tracking-widest mb-4 px-3 py-1 rounded-full"
          style={{
            color: "#f87171",
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.2)",
          }}
        >
          Why Upgrade?
        </span>
        <h2 className="text-4xl lg:text-5xl font-extrabold text-white mb-4">
          Traditional vs. EduManage Pro
        </h2>
        <p className="text-gray-400 text-lg max-w-xl mx-auto">
          See what you're leaving on the table with spreadsheets and paper
          registers.
        </p>
      </motion.div>

      <motion.div
        variants={scaleIn}
        className="rounded-2xl border overflow-hidden"
        style={{
          borderColor: "rgba(255,255,255,0.08)",
          background: "rgba(8,8,25,0.8)",
        }}
      >
        {/* Header */}
        <div
          className="grid grid-cols-3 border-b"
          style={{ borderColor: "rgba(255,255,255,0.07)" }}
        >
          <div className="p-5 text-sm font-semibold text-gray-500">Feature</div>
          <div
            className="p-5 text-center border-l"
            style={{ borderColor: "rgba(255,255,255,0.07)" }}
          >
            <div className="text-sm font-semibold text-gray-400">
              Traditional Management
            </div>
            <div className="text-xs text-gray-600 mt-1">
              Registers, Excel, Noticeboards
            </div>
          </div>
          <div
            className="p-5 text-center border-l"
            style={{
              borderColor: "rgba(99,102,241,0.3)",
              background: "rgba(99,102,241,0.06)",
            }}
          >
            <div className="text-sm font-bold" style={{ color: "#a5b4fc" }}>
              EduManage Pro
            </div>
            <div className="text-xs text-indigo-500 mt-1">
              All-in-one SaaS Platform
            </div>
          </div>
        </div>

        {rows.map(([label, traditional, modern], i) => (
          <motion.div
            key={String(label)}
            variants={fadeIn}
            custom={i * 0.3}
            className="grid grid-cols-3 border-b last:border-b-0"
            style={{ borderColor: "rgba(255,255,255,0.04)" }}
          >
            <div className="px-5 py-4 text-sm text-gray-400">
              {String(label)}
            </div>
            <div
              className="px-5 py-4 flex justify-center items-center border-l"
              style={{ borderColor: "rgba(255,255,255,0.06)" }}
            >
              {traditional ? (
                <Check size={16} className="text-green-400" />
              ) : (
                <X size={16} className="text-gray-700" />
              )}
            </div>
            <div
              className="px-5 py-4 flex justify-center items-center border-l"
              style={{
                borderColor: "rgba(99,102,241,0.15)",
                background: "rgba(99,102,241,0.03)",
              }}
            >
              {modern ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.6 + i * 0.07 }}
                >
                  <CheckCircle2 size={16} className="text-indigo-400" />
                </motion.div>
              ) : (
                <X size={16} className="text-gray-700" />
              )}
            </div>
          </motion.div>
        ))}
      </motion.div>
    </Section>
  );
};

// ─── Testimonials ─────────────────────────────────────────────────────────────
const testimonials: Testimonial[] = [
  {
    name: "Md. Kamal Uddin",
    role: "Principal",
    school: "Rajuk Uttara Model College, Dhaka",
    avatar: "KU",
    rating: 5,
    text: "EduManage Pro transformed how we run our college. Fee collection is now 100% digital, attendance tracking is seamless, and parents love the mobile app. Highly recommended for any institution.",
  },
  {
    name: "Nasrin Akter",
    role: "Head of Administration",
    school: "Viqarunnisa Noon School, Dhaka",
    avatar: "NA",
    rating: 5,
    text: "We manage 3,200 students across 3 shifts. Before EduManage, it was chaos. Now everything runs automatically — from admissions to result publication. Best decision we made.",
  },
  {
    name: "Sheikh Salim",
    role: "Director",
    school: "Al-Amin Madrasha, Sylhet",
    avatar: "SS",
    rating: 5,
    text: "As a madrasha, we had unique needs including Hifz tracking and Islamic calendar integration. The EduManage team customized everything for us. Support is outstanding.",
  },
  {
    name: "Ruma Khanam",
    role: "IT Coordinator",
    school: "Milestone College, Uttara",
    avatar: "RK",
    rating: 5,
    text: "The onboarding was smooth, the UI is clean, and the dashboard gives us all the data we need in seconds. Our teachers love how easy attendance entry has become.",
  },
  {
    name: "Farid Ahmed",
    role: "Treasurer",
    school: "Ideal School & College",
    avatar: "FA",
    rating: 5,
    text: "Payroll used to take 3 days every month. Now it takes 20 minutes. The automated fee reminders have reduced defaults by 40%. ROI on this software is extraordinary.",
  },
  {
    name: "Dr. Shirin Islam",
    role: "Vice Principal",
    school: "BAF Shaheen College, Chittagong",
    avatar: "SI",
    rating: 5,
    text: "The analytics dashboard gives me real insights — not just numbers. I can spot which classes need intervention and act immediately. This is what modern school management looks like.",
  },
];

const Testimonials = () => (
  <Section
    id="testimonials"
    className="py-28"
    style={{ background: "rgba(255,255,255,0.01)" }}
  >
    <div className="max-w-7xl mx-auto px-6">
      <motion.div variants={fadeUp} className="text-center mb-14">
        <span
          className="inline-block text-xs font-semibold uppercase tracking-widest mb-4 px-3 py-1 rounded-full"
          style={{
            color: "#fbbf24",
            background: "rgba(245,158,11,0.1)",
            border: "1px solid rgba(245,158,11,0.2)",
          }}
        >
          Social Proof
        </span>
        <h2 className="text-4xl lg:text-5xl font-extrabold text-white mb-4">
          Loved by 500+ Institutions
        </h2>
        <p className="text-gray-400 text-lg max-w-xl mx-auto">
          Join hundreds of schools and colleges who've digitized their
          operations with EduManage Pro.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {testimonials.map((t, i) => (
          <motion.div
            key={t.name}
            variants={scaleIn}
            custom={i * 0.3}
            whileHover={{ y: -6 }}
            className="rounded-2xl p-6 border flex flex-col gap-4 transition-all duration-300"
            style={{
              background: "rgba(255,255,255,0.03)",
              borderColor: "rgba(255,255,255,0.07)",
            }}
          >
            {/* Stars */}
            <div className="flex gap-1">
              {[...Array(t.rating)].map((_, j) => (
                <Star
                  key={j}
                  size={14}
                  fill="#f59e0b"
                  className="text-amber-400"
                />
              ))}
            </div>
            {/* Quote */}
            <p className="text-gray-400 text-sm leading-relaxed flex-1">
              "{t.text}"
            </p>
            {/* Author */}
            <div
              className="flex items-center gap-3 pt-2 border-t"
              style={{ borderColor: "rgba(255,255,255,0.05)" }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                style={{
                  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  color: "white",
                }}
              >
                {t.avatar}
              </div>
              <div>
                <div className="text-white text-sm font-semibold">{t.name}</div>
                <div className="text-gray-500 text-xs">
                  {t.role} · {t.school}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </Section>
);

// ─── Pricing ──────────────────────────────────────────────────────────────────
const plans: Plan[] = [
  {
    name: "Starter",
    price: "৳2,499",
    period: "/month",
    desc: "Perfect for small schools up to 300 students.",
    highlight: false,
    cta: "Start Free Trial",
    features: [
      "Up to 300 students",
      "Student & attendance module",
      "Fee collection",
      "Basic reports",
      "Email support",
      "1 admin account",
    ],
  },
  {
    name: "Professional",
    price: "৳5,999",
    period: "/month",
    desc: "For growing institutions with advanced needs.",
    highlight: true,
    cta: "Start Free Trial",
    features: [
      "Up to 1,500 students",
      "All modules included",
      "Parent portal app",
      "SMS notifications",
      "Payroll & HR",
      "5 admin accounts",
      "Priority support",
      "Custom reports",
    ],
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    desc: "For large institutions, multi-branch networks.",
    highlight: false,
    cta: "Contact Sales",
    features: [
      "Unlimited students",
      "Multi-branch management",
      "Custom integrations",
      "Dedicated account manager",
      "SLA guarantee (99.9%)",
      "On-premise option",
      "Custom branding",
      "24/7 phone support",
    ],
  },
];

const Pricing = () => (
  <Section id="pricing" className="py-28 max-w-7xl mx-auto px-6">
    <motion.div variants={fadeUp} className="text-center mb-14">
      <span
        className="inline-block text-xs font-semibold uppercase tracking-widest mb-4 px-3 py-1 rounded-full"
        style={{
          color: "#34d399",
          background: "rgba(16,185,129,0.1)",
          border: "1px solid rgba(16,185,129,0.2)",
        }}
      >
        Transparent Pricing
      </span>
      <h2 className="text-4xl lg:text-5xl font-extrabold text-white mb-4">
        Simple, Predictable Plans
      </h2>
      <p className="text-gray-400 text-lg max-w-xl mx-auto">
        No hidden fees. No per-student charges. One flat monthly rate that
        scales with your institution.
      </p>
    </motion.div>

    <div className="grid md:grid-cols-3 gap-6 items-start">
      {plans.map((p, i) => (
        <motion.div
          key={p.name}
          variants={scaleIn}
          custom={i * 0.3}
          whileHover={{ y: -6 }}
          className="rounded-2xl p-7 border flex flex-col gap-6 relative overflow-hidden"
          style={{
            background: p.highlight
              ? "rgba(99,102,241,0.1)"
              : "rgba(255,255,255,0.03)",
            borderColor: p.highlight
              ? "rgba(99,102,241,0.5)"
              : "rgba(255,255,255,0.08)",
            boxShadow: p.highlight ? "0 0 60px rgba(99,102,241,0.15)" : "none",
          }}
        >
          {p.highlight && (
            <div
              className="absolute top-5 right-5 text-xs font-bold px-3 py-1 rounded-full"
              style={{
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                color: "white",
              }}
            >
              Most Popular
            </div>
          )}
          <div>
            <div className="text-gray-400 text-sm font-medium mb-1">
              {p.name}
            </div>
            <div className="flex items-baseline gap-1 mb-2">
              <span className="text-4xl font-extrabold text-white">
                {p.price}
              </span>
              <span className="text-gray-500 text-sm">{p.period}</span>
            </div>
            <p className="text-gray-500 text-sm">{p.desc}</p>
          </div>

          <ul className="space-y-3 flex-1">
            {p.features.map((f) => (
              <li
                key={f}
                className="flex items-center gap-2.5 text-sm text-gray-300"
              >
                <div
                  className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    background: p.highlight
                      ? "rgba(99,102,241,0.3)"
                      : "rgba(255,255,255,0.08)",
                  }}
                >
                  <Check
                    size={10}
                    className={
                      p.highlight ? "text-indigo-300" : "text-gray-400"
                    }
                  />
                </div>
                {f}
              </li>
            ))}
          </ul>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all duration-200"
            style={{
              background: p.highlight
                ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
                : "rgba(255,255,255,0.06)",
              color: p.highlight ? "white" : "#9ca3af",
              border: p.highlight ? "none" : "1px solid rgba(255,255,255,0.1)",
            }}
          >
            {p.cta}
          </motion.button>
        </motion.div>
      ))}
    </div>

    <motion.p
      variants={fadeIn}
      className="text-center text-gray-600 text-sm mt-8"
    >
      All plans include a 14-day free trial. No credit card required.
    </motion.p>
  </Section>
);

// ─── FAQ ──────────────────────────────────────────────────────────────────────
const faqs: FAQ[] = [
  {
    q: "How long does it take to set up?",
    a: "Most schools are fully onboarded within 3–5 business days. We handle data migration, staff training and configuration for you.",
  },
  {
    q: "Can we migrate our existing student data?",
    a: "Yes. We support data import from Excel, CSV, and most legacy school software. Our team handles the migration at no extra cost.",
  },
  {
    q: "Is the system available in Bangla?",
    a: "Yes. EduManage Pro supports both Bangla and English interfaces. Reports and SMS notifications can be sent in Bangla.",
  },
  {
    q: "Does it work for madrashas?",
    a: "Absolutely. We have specific modules for Hifz tracking, Arabic subject grading, and madrasha-specific result formats.",
  },
  {
    q: "How secure is our data?",
    a: "Your data is encrypted at rest and in transit using AES-256. We run daily backups on AWS servers located in Dhaka. GDPR compliant.",
  },
  {
    q: "Can parents pay fees online?",
    a: "Yes. We support bKash, Nagad, Rocket, credit/debit cards and bank transfers through our integrated payment gateway.",
  },
  {
    q: "Is there a mobile app?",
    a: "Yes. There are dedicated mobile apps for parents (Android & iOS) for attendance, results, fee payment, and notifications.",
  },
  {
    q: "What happens if we exceed the student limit?",
    a: "We'll notify you when you're near the limit. Upgrading to the next plan is instant — no disruption to operations.",
  },
];

const FAQ = () => {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <Section
      id="faq"
      className="py-28"
      style={{ background: "rgba(255,255,255,0.01)" }}
    >
      <div className="max-w-3xl mx-auto px-6">
        <motion.div variants={fadeUp} className="text-center mb-14">
          <span
            className="inline-block text-xs font-semibold uppercase tracking-widest mb-4 px-3 py-1 rounded-full"
            style={{
              color: "#a5b4fc",
              background: "rgba(99,102,241,0.1)",
              border: "1px solid rgba(99,102,241,0.2)",
            }}
          >
            Common Questions
          </span>
          <h2 className="text-4xl lg:text-5xl font-extrabold text-white mb-4">
            Everything You Need to Know
          </h2>
        </motion.div>

        <div className="space-y-3">
          {faqs.map((f, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              custom={i * 0.2}
              className="rounded-xl border overflow-hidden"
              style={{
                borderColor:
                  open === i
                    ? "rgba(99,102,241,0.35)"
                    : "rgba(255,255,255,0.07)",
                background: "rgba(255,255,255,0.03)",
              }}
            >
              <button
                className="w-full flex items-center justify-between px-6 py-4 text-left"
                onClick={() => setOpen(open === i ? null : i)}
              >
                <span className="text-sm font-semibold text-white pr-4">
                  {f.q}
                </span>
                <motion.div
                  animate={{ rotate: open === i ? 180 : 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <ChevronDown
                    size={18}
                    className="text-gray-500 flex-shrink-0"
                  />
                </motion.div>
              </button>
              <AnimatePresence>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div
                      className="px-6 pb-5 text-sm text-gray-400 leading-relaxed border-t"
                      style={{ borderColor: "rgba(255,255,255,0.05)" }}
                    >
                      <div className="pt-4">{f.a}</div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </Section>
  );
};

// ─── CTA ──────────────────────────────────────────────────────────────────────
const CTA = () => (
  <Section className="py-28 max-w-7xl mx-auto px-6">
    <motion.div
      variants={scaleIn}
      className="relative rounded-3xl overflow-hidden p-12 lg:p-20 text-center"
      style={{
        background:
          "linear-gradient(135deg, rgba(99,102,241,0.25), rgba(139,92,246,0.15), rgba(14,165,233,0.1))",
        border: "1px solid rgba(99,102,241,0.25)",
      }}
    >
      {/* Background decoration */}
      <div
        className="absolute -top-24 -right-24 w-64 h-64 rounded-full opacity-20 blur-3xl"
        style={{ background: "radial-gradient(circle, #6366f1, transparent)" }}
      />
      <div
        className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full opacity-15 blur-3xl"
        style={{ background: "radial-gradient(circle, #0ea5e9, transparent)" }}
      />

      <motion.div variants={fadeUp} className="relative z-10">
        <div
          className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-8 text-xs font-semibold"
          style={{
            background: "rgba(99,102,241,0.2)",
            border: "1px solid rgba(99,102,241,0.3)",
            color: "#a5b4fc",
          }}
        >
          <Zap size={12} />
          Get started in under 5 minutes
        </div>
        <h2 className="text-4xl lg:text-6xl font-extrabold text-white mb-6 leading-tight">
          Ready to Digitize Your
          <br />
          <span
            style={{
              background: "linear-gradient(135deg, #6366f1, #a78bfa, #38bdf8)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Institution?
          </span>
        </h2>
        <p className="text-gray-300 text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
          Join 500+ schools and colleges that trust EduManage Pro to run their
          entire institution from a single platform.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <motion.button
            whileHover={{
              scale: 1.05,
              boxShadow: "0 0 40px rgba(99,102,241,0.5)",
            }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2.5 px-8 py-4 rounded-xl text-white font-semibold text-base"
            style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
          >
            <PlayCircle size={20} />
            Schedule a Demo
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2.5 px-8 py-4 rounded-xl font-semibold text-base border text-white"
            style={{
              borderColor: "rgba(255,255,255,0.2)",
              background: "rgba(255,255,255,0.05)",
            }}
          >
            <Headphones size={20} />
            Contact Sales
          </motion.button>
        </div>
        <p className="text-gray-500 text-sm mt-6">
          14-day free trial · No credit card · Free onboarding support
        </p>
      </motion.div>
    </motion.div>
  </Section>
);

// ─── Footer ──────────────────────────────────────────────────────────────────
const Footer = () => (
  <footer
    className="border-t"
    style={{ background: "#030310", borderColor: "rgba(255,255,255,0.06)" }}
  >
    <div className="max-w-7xl mx-auto px-6 py-16">
      <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-12 mb-12">
        {/* Brand */}
        <div className="lg:col-span-2">
          <div className="flex items-center gap-2.5 mb-4">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              }}
            >
              <GraduationCap size={18} className="text-white" />
            </div>
            <span className="text-lg font-bold text-white">
              EduManage <span style={{ color: "#6366f1" }}>Pro</span>
            </span>
          </div>
          <p className="text-gray-500 text-sm leading-relaxed mb-5 max-w-xs">
            The complete School Management ERP built for South Asian educational
            institutions. Modern, powerful, and affordable.
          </p>
          <div className="flex gap-3">
            {[Mail, Mail, Mail].map((Icon, i) => (
              <button
                key={i}
                className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors duration-200 hover:bg-white/10"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <Icon size={16} className="text-gray-500 hover:text-white" />
              </button>
            ))}
          </div>
        </div>

        {/* Links */}
        {[
          {
            title: "Product",
            links: ["Features", "Modules", "Pricing", "Changelog", "Roadmap"],
          },
          {
            title: "Company",
            links: ["About Us", "Blog", "Careers", "Press", "Partners"],
          },
          {
            title: "Support",
            links: [
              "Documentation",
              "API Docs",
              "Help Center",
              "Status",
              "Contact",
            ],
          },
        ].map((col) => (
          <div key={col.title}>
            <h4 className="text-white text-sm font-semibold mb-4">
              {col.title}
            </h4>
            <ul className="space-y-3">
              {col.links.map((l) => (
                <li key={l}>
                  <a
                    href="#"
                    className="text-gray-500 text-sm hover:text-gray-300 transition-colors duration-200"
                  >
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Contact bar */}
      <div
        className="flex flex-wrap gap-6 py-8 border-t border-b"
        style={{ borderColor: "rgba(255,255,255,0.06)" }}
      >
        {[
          { icon: <Phone size={14} />, text: "+880 1700-000000" },
          { icon: <Mail size={14} />, text: "hello@edumanagepro.com" },
          { icon: <MapPin size={14} />, text: "Gulshan 2, Dhaka 1212" },
        ].map((c) => (
          <div
            key={c.text}
            className="flex items-center gap-2.5 text-sm text-gray-500"
          >
            <span className="text-gray-600">{c.icon}</span>
            {c.text}
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-8 text-xs text-gray-600">
        <span>© 2024 EduManage Pro. All rights reserved.</span>
        <div className="flex gap-6">
          {["Privacy Policy", "Terms of Service", "Cookie Policy"].map((l) => (
            <a
              key={l}
              href="#"
              className="hover:text-gray-400 transition-colors"
            >
              {l}
            </a>
          ))}
        </div>
      </div>
    </div>
  </footer>
);

// ─── SEO Head (client component — metadata should be in layout/page.tsx) ──────
// For Next.js app router metadata, add to your page.tsx:
// export const metadata = { title: "EduManage Pro...", description: "...", openGraph: {...} }

// ─── Main Landing Page ────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div
      style={{
        background: "#030310",
        fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
      }}
    >
      <Navbar />
      <Hero />
      <TrustedBy />
      <Modules />
      <DashboardShowcase />
      <RoleAccess />
      <ParentPortal />
      <Comparison />
      <Testimonials />
      <Pricing />
      <FAQ />
      <CTA />
      <Footer />
    </div>
  );
}
