import { useSyncExternalStore } from "react";
import type { ChartAnimation } from "./chart-types.js";

export const CHART_ANIMATION_MARK_LIMIT = 200;

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function mediaQuery(): MediaQueryList | undefined {
	if (typeof window === "undefined" || typeof window.matchMedia !== "function")
		return undefined;
	return window.matchMedia(REDUCED_MOTION_QUERY);
}

function subscribeToReducedMotion(onChange: () => void): () => void {
	const query = mediaQuery();
	if (!query) return () => undefined;
	query.addEventListener("change", onChange);
	return () => query.removeEventListener("change", onChange);
}

function reducedMotionSnapshot(): boolean {
	return mediaQuery()?.matches ?? false;
}

export function shouldAnimateChart(
	animation: ChartAnimation,
	renderedMarks: number,
	prefersReducedMotion: boolean,
): boolean {
	return (
		animation === "auto" &&
		!prefersReducedMotion &&
		renderedMarks <= CHART_ANIMATION_MARK_LIMIT
	);
}

/** Resolves the public animation policy without leaking renderer semantics. */
export function useChartAnimation(
	animation: ChartAnimation,
	renderedMarks: number,
): boolean {
	const prefersReducedMotion = useSyncExternalStore(
		subscribeToReducedMotion,
		reducedMotionSnapshot,
		() => true,
	);
	return shouldAnimateChart(animation, renderedMarks, prefersReducedMotion);
}
