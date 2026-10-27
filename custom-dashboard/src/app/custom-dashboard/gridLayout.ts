/** Layout helper for the dashboard's "Rapikan Grid" action. */

export interface GridWidgetInput {
  id: string;
  type: "card" | "chart";
}

export interface MeasuredSize {
  width?: number;
  height?: number;
}

export interface GridWidgetPlacement {
  x: number;
  y: number;
  width: string;
  height: number;
}

const GRID_GAP = 12;
const CANVAS_MARGIN = 4;
const CARD_ROW_HEIGHT = 180;
const FALLBACK_CHART_HEIGHT = 380;
const TWO_COLUMN_MIN_WIDTH = 640;
const THREE_CARD_MIN_WIDTH = 960;

/**
 * Pack widgets in equal-size rows. Each desktop row has two equal columns and
 * both widgets share the row's height; narrow screens use a single column.
 */
export function computeGridLayout(
  widgets: GridWidgetInput[],
  canvasWidth: number,
  measure: (id: string) => MeasuredSize | undefined,
): Map<string, GridWidgetPlacement> {
  const usableWidth = Math.max(1, Math.floor(canvasWidth) - CANVAS_MARGIN);
  const placements = new Map<string, GridWidgetPlacement>();
  const cards = widgets.filter((widget) => widget.type === "card");
  const charts = widgets.filter((widget) => widget.type !== "card");
  const cardColumns = cards.length >= 3 && usableWidth >= THREE_CARD_MIN_WIDTH
    ? 3
    : cards.length >= 2 && usableWidth >= TWO_COLUMN_MIN_WIDTH ? 2 : 1;
  // Metric cards have a compact standard height even if they were previously
  // stretched alongside a tall chart.
  const cardHeight = cards.length ? CARD_ROW_HEIGHT : 0;

  for (let start = 0; start < cards.length; start += cardColumns) {
    const row = cards.slice(start, start + cardColumns);
    const rowWidth = Math.floor((usableWidth - GRID_GAP * (row.length - 1)) / row.length);
    row.forEach((widget, index) => {
      placements.set(widget.id, {
        x: index * (rowWidth + GRID_GAP),
        y: Math.floor(start / cardColumns) * (cardHeight + GRID_GAP),
        width: `${rowWidth}px`,
        height: cardHeight,
      });
    });
  }

  let y = cards.length ? Math.ceil(cards.length / cardColumns) * (cardHeight + GRID_GAP) - GRID_GAP : 0;
  const chartColumns = usableWidth >= TWO_COLUMN_MIN_WIDTH ? 2 : 1;
  for (let start = 0; start < charts.length; start += chartColumns) {
    const row = charts.slice(start, start + chartColumns);
    const chartWidth = Math.floor((usableWidth - GRID_GAP * (row.length - 1)) / row.length);
    const rowHeight = Math.max(...row.map((widget) => {
      const measured = measure(widget.id)?.height;
      return Math.max(1, Math.ceil(measured || FALLBACK_CHART_HEIGHT));
    }));

    row.forEach((widget, index) => {
      placements.set(widget.id, {
        x: index * (chartWidth + GRID_GAP),
        y,
        width: `${chartWidth}px`,
        height: rowHeight,
      });
    });
    y += rowHeight + GRID_GAP;
  }

  return placements;
}
