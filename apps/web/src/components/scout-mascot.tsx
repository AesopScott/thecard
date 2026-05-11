import { clsx } from "clsx";

type ScoutSport = "football" | "basketball" | "hockey" | "soccer";
type ScoutAction = "baseball" | "fight" | "trophy" | "celebrate";
type ScoutMotion = "idle" | "drift" | "hype" | "sweat";
type ScoutPage = "home" | "card" | "blitz" | "live" | "h2h" | "forecast";

type ScoutVariant =
  | { sheet?: "sports"; sport: ScoutSport }
  | { sheet: "actions"; action: ScoutAction };

type ScoutMascotProps = ScoutVariant & {
  motion?: ScoutMotion;
  className?: string;
  label?: string;
};

const SPORTS_OFFSET: Record<ScoutSport, string> = {
  football: "left-0 top-0",
  basketball: "-left-full top-0",
  hockey: "left-0 -top-full",
  soccer: "-left-full -top-full",
};

const ACTION_OFFSET: Record<ScoutAction, string> = {
  baseball: "left-0 top-0",
  fight: "-left-full top-0",
  trophy: "left-0 -top-full",
  celebrate: "-left-full -top-full",
};

const PAGE_FLOATERS: Record<ScoutPage, Array<ScoutVariant & { className: string; motion?: ScoutMotion; label: string }>> = {
  home: [
    { sport: "football", motion: "drift", label: "Football Scout", className: "right-2 top-32 h-24 w-24 opacity-55 sm:right-6 sm:top-36 sm:h-32 sm:w-32 lg:right-[calc(50%-38rem)] lg:top-36 lg:h-40 lg:w-40 lg:opacity-70" },
    { sheet: "actions", action: "celebrate", motion: "hype", label: "Celebration Scout", className: "hidden lg:block left-[calc(50%-39rem)] top-[38rem] h-28 w-28 opacity-45" },
  ],
  card: [
    { sport: "football", motion: "idle", label: "Football Scout", className: "right-1 top-36 h-20 w-20 opacity-45 sm:right-4 sm:top-32 sm:h-28 sm:w-28 lg:right-[calc(50%-39rem)] lg:top-36 lg:h-36 lg:w-36 lg:opacity-62" },
    { sheet: "actions", action: "trophy", motion: "drift", label: "Trophy Scout", className: "hidden xl:block left-[calc(50%-43rem)] top-[30rem] h-28 w-28 opacity-42" },
  ],
  blitz: [
    { sport: "football", motion: "hype", label: "Blitz Football Scout", className: "right-1 top-24 h-20 w-20 opacity-48 sm:right-5 sm:top-28 sm:h-32 sm:w-32 lg:right-[calc(50%-39rem)] lg:h-40 lg:w-40 lg:opacity-68" },
    { sheet: "actions", action: "baseball", motion: "drift", label: "Baseball Scout", className: "hidden lg:block left-[calc(50%-40rem)] top-[34rem] h-28 w-28 opacity-42" },
  ],
  live: [
    { sport: "basketball", motion: "hype", label: "Live Basketball Scout", className: "right-1 top-32 h-20 w-20 opacity-45 sm:right-5 sm:top-28 sm:h-32 sm:w-32 lg:right-[calc(50%-38rem)] lg:h-40 lg:w-40 lg:opacity-66" },
    { sheet: "actions", action: "celebrate", motion: "drift", label: "Celebration Scout", className: "hidden xl:block left-[calc(50%-42rem)] top-[32rem] h-28 w-28 opacity-42" },
  ],
  h2h: [
    { sheet: "actions", action: "fight", motion: "sweat", label: "H2H Fight Scout", className: "right-1 top-28 h-20 w-20 opacity-48 sm:right-5 sm:h-32 sm:w-32 lg:right-[calc(50%-38rem)] lg:h-40 lg:w-40 lg:opacity-68" },
    { sport: "soccer", motion: "idle", label: "Soccer Scout", className: "hidden xl:block left-[calc(50%-42rem)] top-[34rem] h-28 w-28 opacity-42" },
  ],
  forecast: [
    { sport: "soccer", motion: "drift", label: "Forecast Soccer Scout", className: "right-1 top-32 h-20 w-20 opacity-45 sm:right-5 sm:top-28 sm:h-32 sm:w-32 lg:right-[calc(50%-38rem)] lg:h-40 lg:w-40 lg:opacity-64" },
    { sheet: "actions", action: "trophy", motion: "idle", label: "Trophy Scout", className: "hidden xl:block left-[calc(50%-42rem)] top-[31rem] h-28 w-28 opacity-42" },
  ],
};

export function ScoutMascot({
  ...props
}: ScoutMascotProps) {
  const {
  motion = "idle",
  className,
  label,
  } = props;
  const isAction = props.sheet === "actions";
  const source = isAction ? "/mascots/scout-actions.png" : "/mascots/scout-sports.png";
  const offset = isAction ? ACTION_OFFSET[props.action] : SPORTS_OFFSET[props.sport];
  const mascotName = isAction ? props.action : props.sport;

  return (
    <div
      aria-label={label ?? `${mascotName} Scout mascot`}
      className={clsx(
        "relative isolate overflow-hidden drop-shadow-[0_18px_22px_rgba(0,0,0,0.34)]",
        motion === "idle" && "animate-[scout-idle_3.4s_ease-in-out_infinite]",
        motion === "drift" && "animate-[scout-drift_5.6s_ease-in-out_infinite]",
        motion === "hype" && "animate-[scout-hype_1.6s_ease-in-out_infinite]",
        motion === "sweat" && "animate-[scout-sweat_900ms_ease-in-out_infinite]",
        className,
      )}
    >
      <img
        src={source}
        alt=""
        aria-hidden="true"
        className={clsx("absolute h-[200%] w-[200%] max-w-none select-none", offset)}
        draggable={false}
      />
    </div>
  );
}

export function ScoutFloaters({ page }: { page: ScoutPage }) {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-10 overflow-hidden">
      {PAGE_FLOATERS[page].map((item) => (
        <ScoutMascot key={`${item.label}-${item.className}`} {...item} className={clsx("absolute", item.className)} />
      ))}
      <style jsx global>{`
        @keyframes scout-idle {
          0%, 100% { transform: translateY(0) rotate(-2deg); }
          50% { transform: translateY(-12px) rotate(2deg); }
        }

        @keyframes scout-drift {
          0%, 100% { transform: translate3d(0, 0, 0) rotate(-5deg); }
          50% { transform: translate3d(10px, -18px, 0) rotate(4deg); }
        }

        @keyframes scout-hype {
          0%, 100% { transform: translateY(0) rotate(-7deg) scale(1); }
          50% { transform: translateY(-18px) rotate(7deg) scale(1.06); }
        }

        @keyframes scout-sweat {
          0%, 100% { transform: translateX(-4px) rotate(-3deg); }
          25% { transform: translateX(5px) rotate(3deg); }
          50% { transform: translateX(-3px) rotate(-2deg); }
          75% { transform: translateX(4px) rotate(2deg); }
        }
      `}</style>
    </div>
  );
}
