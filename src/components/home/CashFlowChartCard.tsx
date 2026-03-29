"use client";

export default function CashFlowChartCard() {
  return (
    <div className="relative flex flex-col overflow-hidden rounded-xl bg-surface-container-low p-8 lg:col-span-2">
      <div className="mb-10 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="font-headline text-lg font-bold">Monthly Cash Flow</h3>
          <p className="text-xs text-on-surface-variant">Comparative analysis of inflow and outflow</p>
        </div>
        <div className="flex space-x-2">
          <button className="rounded-md bg-surface-container-highest px-3 py-1.5 text-[10px] font-bold text-on-surface">
            6 MONTHS
          </button>
          <button className="rounded-md px-3 py-1.5 text-[10px] font-bold text-on-surface-variant hover:bg-surface-container-high">
            YEARLY
          </button>
        </div>
      </div>
      <div className="relative flex-grow">
        <svg className="h-64 w-full" preserveAspectRatio="none" viewBox="0 0 100 40">
          <line className="text-outline-variant/30" stroke="currentColor" strokeWidth="0.1" x1="0" x2="100" y1="0" y2="0" />
          <line className="text-outline-variant/30" stroke="currentColor" strokeWidth="0.1" x1="0" x2="100" y1="10" y2="10" />
          <line className="text-outline-variant/30" stroke="currentColor" strokeWidth="0.1" x1="0" x2="100" y1="20" y2="20" />
          <line className="text-outline-variant/30" stroke="currentColor" strokeWidth="0.1" x1="0" x2="100" y1="30" y2="30" />
          <path
            d="M0,35 Q10,32 20,25 T40,15 T60,20 T80,10 T100,12 L100,40 L0,40 Z"
            fill="url(#chart-glow)"
            opacity="0.15"
          />
          <path
            d="M0,35 Q10,32 20,25 T40,15 T60,20 T80,10 T100,12"
            fill="none"
            stroke="#7cebff"
            strokeLinecap="round"
            strokeWidth="0.8"
          />
          <path
            d="M0,38 Q15,35 30,32 T50,28 T70,30 T90,25 T100,28"
            fill="none"
            opacity="0.6"
            stroke="#adc6ff"
            strokeLinecap="round"
            strokeWidth="0.5"
          />
          <defs>
            <linearGradient id="chart-glow" x1="0%" x2="0%" y1="0%" y2="100%">
              <stop offset="0%" stopColor="#7cebff" />
              <stop offset="100%" stopColor="#7cebff" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
        <div className="mt-4 flex justify-between text-[10px] font-medium uppercase tracking-tighter text-on-surface-variant">
          <span>Jan</span>
          <span>Feb</span>
          <span>Mar</span>
          <span>Apr</span>
          <span>May</span>
          <span>Jun</span>
        </div>
      </div>
    </div>
  );
}
