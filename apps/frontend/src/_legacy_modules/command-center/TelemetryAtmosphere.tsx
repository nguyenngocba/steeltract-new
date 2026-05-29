export function TelemetryAtmosphere() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(34,211,238,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.04)_1px,transparent_1px)] bg-[size:44px_44px]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(34,211,238,0.035),transparent)] bg-[length:100%_7px] opacity-40" />
      <div className="absolute -left-24 top-12 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" />
      <div className="absolute right-0 top-1/4 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
      <div className="absolute bottom-24 left-1/3 h-56 w-56 rounded-full bg-amber-500/10 blur-3xl" />
      <div className="absolute left-0 top-0 h-px w-full animate-[telemetry-sweep_7s_linear_infinite] bg-gradient-to-r from-transparent via-cyan-300/35 to-transparent" />
      <div className="absolute left-[12%] top-[18%] h-1.5 w-1.5 animate-[telemetry-dot_4.8s_ease-in-out_infinite] rounded-full bg-cyan-300/70 shadow-[0_0_18px_rgba(103,232,249,0.7)]" />
      <div className="absolute right-[18%] top-[34%] h-1 w-1 animate-[telemetry-dot_6.4s_ease-in-out_infinite] rounded-full bg-emerald-300/70 shadow-[0_0_16px_rgba(110,231,183,0.65)]" />
      <div className="absolute bottom-[18%] left-[48%] h-1 w-1 animate-[telemetry-dot_5.6s_ease-in-out_infinite] rounded-full bg-amber-300/70 shadow-[0_0_16px_rgba(252,211,77,0.65)]" />
    </div>
  )
}
