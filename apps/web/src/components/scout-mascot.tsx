"use client";

import { useLayoutEffect, useRef, useState } from "react";
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
  style?: React.CSSProperties;
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

type ScoutHideout = {
  left?: string;
  right?: string;
  top: string;
};

const PAGE_HIDEOUTS: Record<ScoutPage, ScoutHideout[]> = {
  home: [
    { left: "2vw", top: "18rem" },
    { right: "4vw", top: "31rem" },
    { left: "7vw", top: "72rem" },
    { right: "7vw", top: "55rem" },
  ],
  card: [
    { right: "4vw", top: "12rem" },
    { right: "6vw", top: "31rem" },
    { left: "4vw", top: "50rem" },
    { right: "12vw", top: "68rem" },
    { left: "42vw", top: "84rem" },
  ],
  blitz: [
    { left: "4vw", top: "12rem" },
    { right: "5vw", top: "33rem" },
    { right: "4vw", top: "22rem" },
    { left: "6vw", top: "56rem" },
  ],
  live: [
    { right: "4vw", top: "19rem" },
    { left: "3vw", top: "54rem" },
    { left: "5vw", top: "30rem" },
    { right: "6vw", top: "67rem" },
  ],
  h2h: [
    { left: "6vw", top: "20rem" },
    { right: "3vw", top: "48rem" },
    { right: "5vw", top: "24rem" },
    { left: "4vw", top: "62rem" },
  ],
  forecast: [
    { right: "6vw", top: "13rem" },
    { left: "4vw", top: "43rem" },
    { left: "7vw", top: "26rem" },
    { right: "4vw", top: "58rem" },
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
  style,
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
      style={style}
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
  const mascotRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [hideouts, setHideouts] = useState(() => PAGE_HIDEOUTS[page].slice(0, 2));

  useLayoutEffect(() => {
    const protectedElements = Array.from(
      document.querySelectorAll<HTMLElement>(
        "nav, .rounded-xl, article, dialog, [role='dialog'], input, textarea, select, button",
      ),
    ).filter((element) => !element.closest("[data-scout-layer]"));

    const collides = (mascot: DOMRect, settledMascots: DOMRect[]) => {
      const mascotArea = mascot.width * mascot.height;
      const hasBadPanelHit = protectedElements.some((element) => {
        const rect = element.getBoundingClientRect();
        const overlapX = Math.max(0, Math.min(mascot.right, rect.right) - Math.max(mascot.left, rect.left));
        const overlapY = Math.max(0, Math.min(mascot.bottom, rect.bottom) - Math.max(mascot.top, rect.top));
        return overlapX * overlapY > mascotArea * 0.12;
      });
      const hitsAnotherScout = settledMascots.some((rect) => {
        const overlapX = Math.max(0, Math.min(mascot.right, rect.right) - Math.max(mascot.left, rect.left));
        const overlapY = Math.max(0, Math.min(mascot.bottom, rect.bottom) - Math.max(mascot.top, rect.top));
        return overlapX * overlapY > mascotArea * 0.05;
      });
      return hasBadPanelHit || hitsAnotherScout;
    };

    const candidates = PAGE_HIDEOUTS[page];
    const chosen: ScoutHideout[] = [];
    const settledRects: DOMRect[] = [];

    PAGE_FLOATERS[page].forEach((_, index) => {
      let picked = candidates[index] ?? candidates[0]!;
      const mascot = mascotRefs.current[index];
      if (!mascot) {
        chosen.push(picked);
        return;
      }

      for (const candidate of candidates) {
        mascot.style.left = candidate.left ?? "";
        mascot.style.right = candidate.right ?? "";
        mascot.style.top = candidate.top;
        const rect = mascot.getBoundingClientRect();
        if (!collides(rect, settledRects)) {
          picked = candidate;
          settledRects.push(rect);
          break;
        }
      }
      chosen.push(picked);
    });

    setHideouts(chosen);
  }, [page]);

  return (
    <div aria-hidden="true" data-scout-layer className="pointer-events-none absolute left-0 top-0 z-10 h-[150rem] w-full overflow-hidden">
      {PAGE_FLOATERS[page].map((item, index) => (
        <div
          key={`${item.label}-${index}`}
          ref={(element) => {
            mascotRefs.current[index] = element;
          }}
          className={clsx("absolute", SIZE_CLASSES[index])}
          style={hideouts[index]}
        >
          <ScoutMascot {...item} className="h-full w-full" />
        </div>
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
