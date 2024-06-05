import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import {
  Chart,
  ChartConfiguration,
  Tooltip,
  LineController,
  Legend,
  Colors,
  Title,
  PointElement,
  LineElement,
  LinearScale,
  CategoryScale,
} from "chart.js";
import { AnnualSummary } from "./financial_logic";

export type MinMaxObject = {
  minY: { [key: number]: number };
  maxY: { [key: number]: number };
  minX: { [key: number]: number };
  maxX: { [key: number]: number };
};

interface PlotPoint {
  x: number;
  y: number;
}

interface Dataset {
  label: string;
  data: Array<PlotPoint>;
  showLine: boolean;
}

export function createPlot(idNumber, canvas, summaries$, axisLimitsSubject) {
  const datasets$: Observable<Array<Dataset>> = summaries$.pipe(
    map((summaries: Array<AnnualSummary>) => {
      const wealths = summaries.map((s, i) => {
        return {
          x: i,
          y:
            s.houseValue +
            s.cashValue +
            s.stockIsaValue +
            s.stockNonIsaValue -
            s.mortgageBalance,
        };
      });
      const mortgageBalances = summaries.map((s, i) => {
        return { x: i, y: -s.mortgageBalance };
      });
      const cashValues = summaries.map((s, i) => {
        return { x: i, y: s.cashValue };
      });
      const stockValues = summaries.map((s, i) => {
        return { x: i, y: s.stockIsaValue + s.stockNonIsaValue };
      });
      const houseValues = summaries.map((s, i) => {
        return { x: i, y: s.houseValue };
      });
      const moneySpent = summaries.map((s, i) => {
        return { x: i, y: -s.moneySpent };
      });

      return [
        {
          label: "Total wealth",
          data: wealths,
          showLine: true,
        },
        {
          label: "House value",
          data: houseValues,
          showLine: true,
        },
        {
          label: "Stock",
          data: stockValues,
          showLine: true,
        },
        {
          label: "Cash",
          data: cashValues,
          showLine: true,
        },
        {
          label: "Mortgage",
          data: mortgageBalances,
          showLine: true,
        },
        {
          label: "Money spent",
          data: moneySpent,
          showLine: true,
        },
      ];
    }),
  );

  Chart.register(
    LineController,
    Title,
    Tooltip,
    Legend,
    Colors,
    PointElement,
    LineElement,
    LinearScale,
    CategoryScale,
  );

  const config: ChartConfiguration<"line", { x: number; y: number }[]> = {
    type: "line",
    data: { datasets: [] },
    options: {
      animation: false,
      responsive: true,
      hover: {
        mode: "index",
        intersect: false,
      },
      scales: {
        x: {
          type: "linear",
          position: "bottom",
        },
        y: {
          type: "linear",
          position: "left",
          max: 0,
          min: 0,
        },
      },
      plugins: {
        colors: {
          enabled: true,
        },
        legend: {
          display: true, // This is true by default
          position: "top", // Position of the legend (top, left, bottom, right)
          labels: {
            font: {
              size: 14, // Font size for legend labels
            },
            color: "rgb(0, 0, 0)", // Font color for legend labels
          },
        },
      },
    },
  };

  const context = canvas.getContext("2d");
  const chart = new Chart(context, config);

  let currentMinMax: MinMaxObject;

  axisLimitsSubject.subscribe({
    next: (value: MinMaxObject) => {
      currentMinMax = value;
      const minY = Math.min(...Object.values(value.minY));
      const maxY = Math.max(...Object.values(value.maxY));
      const roundingUnitY = 100_000;
      const minYMarginFactor = minY < 0 ? 1.05 : 0.95;
      const maxYMarginFactor = maxY > 0 ? 1.05 : 0.95;
      const plotMinY =
        Math.floor((minY * minYMarginFactor) / roundingUnitY) * roundingUnitY;
      const plotMaxY =
        Math.ceil((maxY * maxYMarginFactor) / roundingUnitY) * roundingUnitY;
      chart.options.scales.y.min = plotMinY;
      chart.options.scales.y.max = plotMaxY;

      const minX = Math.min(...Object.values(value.minX));
      const maxX = Math.max(...Object.values(value.maxX));
      const plotMinX = minX;
      const plotMaxX = maxX;
      chart.options.scales.x.min = plotMinX;
      chart.options.scales.x.max = plotMaxX;
      chart.update();
    },
  });

  datasets$.subscribe((datasets) => {
    config.data.datasets = datasets;

    let minY = Infinity;
    let maxY = -Infinity;
    let minX = Infinity;
    let maxX = -Infinity;
    for (const dataset of datasets) {
      const yValues = dataset.data
        .map((point) => point.y)
        .filter((y) => !Number.isNaN(y));
      const xValues = dataset.data
        .map((point) => point.x)
        .filter((y) => !Number.isNaN(y));
      minY = Math.min(minY, ...yValues);
      maxY = Math.max(maxY, ...yValues);
      minX = Math.min(minX, ...xValues);
      maxX = Math.max(maxX, ...xValues);
    }
    currentMinMax.minY[idNumber] = minY;
    currentMinMax.maxY[idNumber] = maxY;
    currentMinMax.minX[idNumber] = minX;
    currentMinMax.maxX[idNumber] = maxX;
    axisLimitsSubject.next(currentMinMax);

    chart.update();
  });
}
