
import { Rectangle, screen } from "electron";
import { ScreenPosition } from "./config";

function rectIntersects(a: Rectangle, b: Rectangle): boolean {
    return !(
        a.x + a.width <= b.x ||
        b.x + b.width <= a.x ||
        a.y + a.height <= b.y ||
        b.y + b.height <= a.y
    );
}

export function clampWindowBounds(
    screenPosition: ScreenPosition
): ScreenPosition {
    const displays = screen.getAllDisplays();

    // Fallback if Electron cannot find any displays for some reason
    if (displays.length === 0) {
        return {
            ...screenPosition,
            x: 0,
            y: 0,
        };
    }

    const {
        x,
        y,
        width,
        height,
        fullScreen,
    } = screenPosition;

    // Find the display closest to the saved window position
    const nearestDisplay = screen.getDisplayNearestPoint({ x, y });

    const workArea = nearestDisplay.workArea;

    // Clamp size first so it can always fit inside the target display
    let clampedWidth = Math.min(width, workArea.width);
    let clampedHeight = Math.min(height, workArea.height);

    // Clamp position to keep the entire window visible
    let clampedX = x;
    let clampedY = y;

    if (clampedX < workArea.x) {
        clampedX = workArea.x;
    }

    if (clampedY < workArea.y) {
        clampedY = workArea.y;
    }

    if (clampedX + clampedWidth > workArea.x + workArea.width) {
        clampedX = workArea.x + workArea.width - clampedWidth;
    }

    if (clampedY + clampedHeight > workArea.y + workArea.height) {
        clampedY = workArea.y + workArea.height - clampedHeight;
    }

    // Safety: ensure window is actually visible on at least one display
    const finalBounds: Rectangle = {
        x: clampedX,
        y: clampedY,
        width: clampedWidth,
        height: clampedHeight,
    };

    const visibleOnAnyDisplay = displays.some(display =>
        rectIntersects(finalBounds, display.workArea)
    );

    // If still somehow invisible, center on primary display
    if (!visibleOnAnyDisplay) {
        const primary = screen.getPrimaryDisplay().workArea;

        clampedWidth = Math.min(clampedWidth, primary.width);
        clampedHeight = Math.min(clampedHeight, primary.height);

        clampedX =
            primary.x + Math.floor((primary.width - clampedWidth) / 2);

        clampedY =
            primary.y + Math.floor((primary.height - clampedHeight) / 2);
    }

    return {
        x: clampedX,
        y: clampedY,
        width: clampedWidth,
        height: clampedHeight,
        fullScreen,
    };
}