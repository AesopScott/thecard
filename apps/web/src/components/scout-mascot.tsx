"use client";

import { useEffect, useState } from "react";
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
    { sport: "football", motion: "drift", label: "Football Scout", className: "left-[2%] top-[19rem] h-16 w-16 opacity-45 sm:left-[5%] sm:top-[17rem] sm:h-24 sm:w-24 lg:left-[calc(50%-43rem)] lg:top-[18rem] lg:h-32 lg:w-32 lg:opacity-58" },
    { sheet: "actions", action: "celebrate", motion: "hype", label: "Celebration Scout", className: "right-[4%] top-[64rem] h-20 w-20 opacity-42 sm:right-[7%] sm:top-[55rem] sm:h-28 sm:w-28 xl:right-[calc(50%-42rem)] xl:top-[50rem] xl:h-36 xl:w-36 xl:opacity-52" },
  ],
  card: [
    { sport: "football", motion: "idle", label: "Football Scout", className: "right-[3%] top-[15rem] h-16 w-16 opacity-42 sm:right-[6%] sm:top-[16rem] sm:h-24 sm:w-24 lg:right-[calc(50%-42rem)] lg:top-[14rem] lg:h-32 lg:w-32 lg:opacity-56" },
    { sheet: "actions", action: "trophy", motion: "drift", label: "Trophy Scout", className: "left-[5%] top-[58rem] h-20 w-20 opacity-42 sm:left-[8%] sm:top-[46rem] sm:h-28 sm:w-28 xl:left-[calc(50%-44rem)] xl:top-[38rem] xl:h-36 xl:w-36 xl:opacity-52" },
  ],
  blitz: [
    { sport: "football", motion: "hype", label: "Blitz Football Scout", className: "left-[4%] top-[12rem] h-16 w-16 opacity-48 sm:left-[7%] sm:top-[14rem] sm:h-24 sm:w-24 lg:left-[calc(50%-42rem)] lg:top-[12rem] lg:h-36 lg:w-36 lg:opacity-62" },
    { sheet: "actions", action: "baseball", motion: "drift", label: "Baseball Scout", className: "right-[5%] top-[49rem] h-20 w-20 opacity-42 sm:right-[8%] sm:top-[38rem] sm:h-28 sm:w-28 xl:right-[calc(50%-43rem)] xl:top-[33rem] xl:h-36 xl:w-36 xl:opacity-52" },
  ],
  live: [
    { sport: "basketball", motion: "hype", label: "Live Basketball Scout", className: "right-[4%] top-[21rem] h-16 w-16 opacity-44 sm:right-[5%] sm:top-[19rem] sm:h-24 sm:w-24 lg:right-[calc(50%-41rem)] lg:top-[18rem] lg:h-32 lg:w-32 lg:opacity-58" },
    { sheet: "actions", action: "celebrate", motion: "drift", label: "Celebration Scout", className: "left-[3%] top-[74rem] h-20 w-20 opacity-42 sm:left-[6%] sm:top-[54rem] sm:h-28 sm:w-28 xl:left-[calc(50%-43rem)] xl:top-[42rem] xl:h-36 xl:w-36 xl:opacity-52" },
  ],
  h2h: [
    { sheet: "actions", action: "fight", motion: "sweat", label: "H2H Fight Scout", className: "left-[6%] top-[25rem] h-16 w-16 opacity-48 sm:left-[8%] sm:top-[20rem] sm:h-24 sm:w-24 lg:left-[calc(50%-41rem)] lg:top-[18rem] lg:h-32 lg:w-32 lg:opacity-62" },
    { sport: "soccer", motion: "idle", label: "Soccer Scout", className: "right-[3%] top-[70rem] h-20 w-20 opacity-42 sm:right-[7%] sm:top-[48rem] sm:h-28 sm:w-28 xl:right-[calc(50%-43rem)] xl:top-[36rem] xl:h-36 xl:w-36 xl:opacity-52" },
  ],
  forecast: [
    { sport: "soccer", motion: "drift", label: "Forecast Soccer Scout", className: "right-[6%] top-[13rem] h-16 w-16 opacity-44 sm:right-[9%] sm:top-[15rem] sm:h-24 sm:w-24 lg:right-[calc(50%-43rem)] lg:top-[13rem] lg:h-32 lg:w-32 lg:opacity-58" },
    { sheet: "actions", action: "trophy", motion: "idle", label: "Trophy Scout", className: "left-[4%] top-[62rem] h-20 w-20 opacity-42 sm:left-[6%] sm:top-[43rem] sm:h-28 sm:w-28 xl:left-[calc(50%-42rem)] xl:top-[34rem] xl:h-36 xl:w-36 xl:opacity-52" },
  ],
};

const PAGE_HIDEOUTS: Record<ScoutPage, string[]> = {
  home: [
    "left-[2%] top-[19rem] sm:left-[5%] sm:top-[17rem] lg:left-[calc(50%-43rem)] lg:top-[18rem]",
    "right-[4%] top-[64rem] sm:right-[7%] sm:top-[55rem] xl:right-[calc(50%-42rem)] xl:top-[50rem]",
    "right-[6%] top-[31rem] sm:right-[10%] sm:top-[29rem] lg:right-[calc(50%-44rem)]",
    "left-[7%] top-[82rem] sm:left-[12%] sm:top-[72rem] xl:left-[calc(50%-39rem)]",
  ],
  card: [
    "right-[3%] top-[15rem] sm:right-[6%] sm:top-[16rem] lg:right-[calc(50%-42rem)] lg:top-[14rem]",
    "left-[5%] top-[58rem] sm:left-[8%] sm:top-[46rem] xl:left-[calc(50%-44rem)] xl:top-[38rem]",
    "left-[3%] top-[28rem] sm:left-[5%] sm:top-[31rem] lg:left-[calc(50%-43rem)]",
    "right-[7%] top-[76rem] sm:right-[9%] sm:top-[60rem] xl:right-[calc(50%-41rem)]",
  ],
  blitz: [
    "left-[4%] top-[12rem] sm:left-[7%] sm:top-[14rem] lg:left-[calc(50%-42rem)] lg:top-[12rem]",
    "right-[5%] top-[49rem] sm:right-[8%] sm:top-[38rem] xl:right-[calc(50%-43rem)] xl:top-[33rem]",
    "right-[4%] top-[22rem] sm:right-[7%] sm:top-[23rem] lg:right-[calc(50%-42rem)]",
    "left-[6%] top-[70rem] sm:left-[10%] sm:top-[56rem] xl:left-[calc(50%-41rem)]",
  ],
  live: [
    "right-[4%] top-[21rem] sm:right-[5%] sm:top-[19rem] lg:right-[calc(50%-41rem)] lg:top-[18rem]",
    "left-[3%] top-[74rem] sm:left-[6%] sm:top-[54rem] xl:left-[calc(50%-43rem)] xl:top-[42rem]",
    "left-[5%] top-[34rem] sm:left-[8%] sm:top-[30rem] lg:left-[calc(50%-42rem)]",
    "right-[6%] top-[88rem] sm:right-[10%] sm:top-[67rem] xl:right-[calc(50%-40rem)]",
  ],
  h2h: [
    "left-[6%] top-[25rem] sm:left-[8%] sm:top-[20rem] lg:left-[calc(50%-41rem)] lg:top-[18rem]",
    "right-[3%] top-[70rem] sm:right-[7%] sm:top-[48rem] xl:right-[calc(50%-43rem)] xl:top-[36rem]",
    "right-[5%] top-[18rem] sm:right-[8%] sm:top-[24rem] lg:right-[calc(50%-42rem)]",
    "left-[4%] top-[83rem] sm:left-[9%] sm:top-[62rem] xl:left-[calc(50%-42rem)]",
  ],
  forecast: [
    "right-[6%] top-[13rem] sm:right-[9%] sm:top-[15rem] lg:right-[calc(50%-43rem)] lg:top-[13rem]",
    "left-[4%] top-[62rem] sm:left-[6%] sm:top-[43rem] xl:left-[calc(50%-42rem)] xl:top-[34rem]",
    "left-[7%] top-[24rem] sm:left-[9%] sm:top-[26rem] lg:left-[calc(50%-44rem)]",
    "right-[4%] top-[80rem] sm:right-[8%] sm:top-[58rem] xl:right-[calc(50%-41rem)]",
  ],
};

const SIZE_CLASSES = [
  "h-16 w-16 opacity-44 sm:h-24 sm:w-24 lg:h-32 lg:w-32 lg:opacity-58",
  "h-20 w-20 opacity-42 sm:h-28 sm:w-28 xl:h-36 xl:w-36 xl:opacity-52",
];

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
  const [hideouts, setHideouts] = useState(() => PAGE_HIDEOUTS[page].slice(0, 2));

  useEffect(() => {
    const pool = [...PAGE_HIDEOUTS[page]];
    for (let index = pool.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      const current = pool[index]!;
      pool[index] = pool[swapIndex]!;
      pool[swapIndex] = current;
    }
    setHideouts(pool.slice(0, 2));
  }, [page]);

  return (
    <div aria-hidden="true" className="pointer-events-none absolute left-0 top-0 z-10 h-[150rem] w-full overflow-hidden">
      {PAGE_FLOATERS[page].map((item, index) => (
        <ScoutMascot
          key={`${item.label}-${index}`}
          {...item}
          className={clsx("absolute", hideouts[index], SIZE_CLASSES[index])}
        />
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
