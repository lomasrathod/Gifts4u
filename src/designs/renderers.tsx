"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import type { RendererProps } from "./types";

const Loading = () => <div className="grid h-full min-h-[300px] place-items-center text-sm text-muted">Loading…</div>;

// Each design loads its own code only when shown. The 3D world never renders on the server.
export const renderers: Record<string, ComponentType<RendererProps>> = {
  "kitty-letter": dynamic(() => import("./kitty-letter/Renderer"), { loading: Loading }),
  "our-universe": dynamic(() => import("./our-universe/Renderer"), { loading: Loading }),
  "memory-wall": dynamic(() => import("./memory-wall/Renderer"), { loading: Loading }),
  "sunset-island": dynamic(() => import("./sunset-island/Renderer"), { loading: Loading, ssr: false }),
};
