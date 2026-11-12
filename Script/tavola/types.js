/**
 * Shared types of the table engine.
 *
 * Coordinate systems:
 * - "world" coordinates are CSS pixels on the table at zoom 1. Items, the table
 *   rectangle and the camera all live here.
 * - "screen" coordinates are CSS pixels in the viewport.
 * The camera maps world → screen: screen = world * zoom + (camera.x, camera.y).
 */
export {};
