import { NavLink, Outlet } from "react-router";
import { LayoutDashboard, Cpu, Wifi, WifiOff } from "lucide-react";
import { useState } from "react";

function NavItem({
  to,
  icon: Icon,
  label,
  end,
}: {
  to: string;
  icon: React.ElementType;
  label: string;
  end?: boolean;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm ${
          isActive
            ? "bg-blue-500/20 text-blue-400"
            : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
        }`
      }
      style={{ fontWeight: 500 }}
    >
      <Icon className="w-4 h-4 shrink-0" strokeWidth={1.75} />
      {label}
    </NavLink>
  );
}

export function Layout() {
  const [connected] = useState(true);

  return (
    <div className="flex h-screen overflow-hidden bg-[#F1F5F9]" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      <aside className="w-56 shrink-0 flex flex-col bg-[#0F172A] border-r border-white/5">
        <div className="px-5 py-5 border-b border-white/10 flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-500 rounded-xl flex items-center justify-center shadow-md shadow-blue-500/30 shrink-0">
            <Cpu className="w-4 h-4 text-white" strokeWidth={1.75} />
          </div>
          <div className="min-w-0">
            <p className="text-white truncate" style={{ fontWeight: 700, fontSize: "0.88rem" }}>
              Micromouse
            </p>
            <p className="text-slate-500 truncate" style={{ fontSize: "0.7rem" }}>
              Telemetria v1.0
            </p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          <p className="px-3 mb-2 text-slate-600 uppercase tracking-widest" style={{ fontSize: "0.62rem" }}>
            Menu
          </p>
          <NavItem to="/" icon={LayoutDashboard} label="Dashboard" end />
        </nav>

        <div className="px-4 py-4 border-t border-white/10 space-y-3">
          <div className="flex items-center gap-2">
            {connected ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-green-400" strokeWidth={2} />
                <span className="text-green-400" style={{ fontSize: "0.75rem" }}>
                  Conectado
                </span>
                <span className="ml-auto w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-red-400" strokeWidth={2} />
                <span className="text-red-400" style={{ fontSize: "0.75rem" }}>
                  Desconectado
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center shrink-0">
              <span className="text-blue-400" style={{ fontSize: "0.65rem", fontWeight: 700 }}>
                A
              </span>
            </div>
            <span className="text-slate-400 truncate flex-1" style={{ fontSize: "0.78rem" }}>
              Admin
            </span>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
