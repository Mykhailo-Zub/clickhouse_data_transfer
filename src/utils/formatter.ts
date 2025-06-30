/**
 * @fileoverview
 * This file provides utility functions for formatting data into human-readable strings.
 * It currently contains a function for formatting time durations.
 */

/**
 * @function formatDuration
 * @description Formats a duration given in milliseconds into a `HH:mm:ss:ms` string format.
 * @summary This utility function takes a numeric millisecond value and converts it into a standardized,
 *          padded string representation, which is useful for logging or displaying time measurements.
 *
 * @param {number} ms - The duration in milliseconds to format.
 * @returns {string} The formatted duration string (e.g., "01:23:45:678"). Returns a zero-time string
 *                   for invalid input.
 *
 * @signature `formatDuration(ms: number): string`
 * @responsibility To provide a consistent and readable format for time durations across the application.
 *
 * @example
 * const duration = 123456; // ms
 * const formatted = formatDuration(duration); // "00:02:03:456"
 */
export function formatDuration(ms: number): string {
  if (typeof ms !== "number" || ms < 0) {
    return "00:00:00:000";
  }

  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor(((ms % 3600000) % 60000) / 1000);
  const milliseconds = ms % 1000;

  const pad = (num: number, size = 2) => num.toString().padStart(size, "0");

  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}:${pad(milliseconds, 3)}`;
}
