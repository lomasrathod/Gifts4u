"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Vec3 } from "@/lib/realtime/protocol";
import type { RendererProps } from "../../types";
import { PLAYER_COLORS, useKeyboard, type Input } from "./Hud";
import { useRoom } from "./useRoom";

type Copy = {
  /** Toast when another player opens the letter. */
  foundLetter: (name: string) => string;
  /** Toast when the question appears. */
  revealHint: string;
  placeName: string;
};

/**
 * Everything a shared 3D gift needs besides its scene: who you are, the room,
 * the letter, the question reveal, the answer, toasts and movement input.
 * The question shows up on its own after `revealAfterMs`, or right after the
 * letter is closed, for everyone in the room.
 */
export function useWorldSession({ mode, slug, onAnswer }: Pick<RendererProps, "mode" | "slug" | "onAnswer">, copy: Copy, revealAfterMs = 120_000) {
  const [me, setMe] = useState<{ name: string; color: string } | null>(mode === "preview" ? { name: "You", color: PLAYER_COLORS[0]! } : null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const input = useRef<Input>({ forward: 0, turn: 0 });
  const [spot, setSpot] = useState<string | null>(null);
  const [letterOpen, setLetterOpen] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [asking, setAsking] = useState(false);
  const [answered, setAnswered] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Live gifts use the gift link as the room. Demos use a shareable ?room= code.
  useEffect(() => {
    if (mode === "preview") return;
    if (mode === "live" && slug) return setRoomId(slug);
    const url = new URL(window.location.href);
    let code = url.searchParams.get("room");
    if (!code || !/^[a-z0-9]{4,12}$/.test(code)) {
      code = Math.random().toString(36).slice(2, 8);
      url.searchParams.set("room", code);
      window.history.replaceState(null, "", url);
    }
    setRoomId(`demo-${code}`);
  }, [mode, slug]);

  const flash = useCallback((text: string) => {
    setToast(text);
    window.setTimeout(() => setToast((t) => (t === text ? null : t)), 4000);
  }, []);

  const onEvent = useCallback(
    (kind: "letter" | "plane" | "answer", from: string) => {
      if (kind === "plane") setRevealed(true);
      if (kind === "letter") flash(copy.foundLetter(from));
      if (kind === "answer") {
        setRevealed(true);
        setAnswered(true);
        setAsking(false);
        flash(`${from} said yes!`);
      }
    },
    [flash, copy],
  );

  const room = useRoom(mode === "preview" ? null : roomId, me, onEvent);

  useEffect(() => {
    if (!me) return;
    const id = window.setTimeout(() => setRevealed(true), mode === "preview" ? 8000 : revealAfterMs);
    return () => window.clearTimeout(id);
  }, [me, mode, revealAfterMs]);

  useKeyboard(input, Boolean(me) && !letterOpen && !asking);

  const onMove = useCallback((p: Vec3, r: number) => room.send({ t: "pos", p, r }), [room]);

  const openLetter = () => {
    setLetterOpen(true);
    room.send({ t: "event", kind: "letter" });
  };

  const closeLetter = () => {
    setLetterOpen(false);
    if (!revealed) {
      setRevealed(true);
      room.send({ t: "event", kind: "plane" });
      flash(copy.revealHint);
    }
  };

  const sayYes = async () => {
    setAnswered(true);
    setAsking(false);
    room.send({ t: "event", kind: "answer", data: "yes" });
    await onAnswer?.("yes");
  };

  const peopleHere = room.peers.length + (me ? 1 : 0);
  const status =
    mode === "preview"
      ? "Preview"
      : room.status === "online"
        ? `${peopleHere} ${copy.placeName}`
        : room.status === "full"
          ? "Full right now (4 max)"
          : "Connecting…";

  const join = (name: string, i: number) => setMe({ name, color: PLAYER_COLORS[i % PLAYER_COLORS.length]! });

  return {
    me, join, room, input, spot, setSpot, toast, flash, status,
    letterOpen, openLetter, closeLetter, revealed, asking, setAsking, answered, sayYes, onMove,
  };
}
