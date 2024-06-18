import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { median, quantileSeq } from "mathjs";
import { color, Color } from "d3-color";
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
  Filler,
} from "chart.js";
import { AnnualSummary, computeCapitalGainsTax } from "./financial_logic";

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

// Apply f to each AnnualSummary, and return a list of medians and percentiles of their values.
function statsOverSamples(
  summaries: Array<Array<AnnualSummary>>,
  f: (arg1: AnnualSummary) => number,
): { median: Array<number>; p10: Array<number>; p90: Array<number> } {
  const transposed = summaries[0].map((_, colIndex) =>
    summaries.map((row) => row[colIndex]),
  );
  const medianValues = transposed.map((innerArray) =>
    median(innerArray.map(f)),
  );
  const p10Values = transposed.map((innerArray) =>
    quantileSeq(innerArray.map(f), 0.1),
  );
  const p90Values = transposed.map((innerArray) =>
    quantileSeq(innerArray.map(f), 0.9),
  );
  return { median: medianValues, p10: p10Values, p90: p90Values };
}

function listToPoints(list: Array<number>): Array<PlotPoint> {
  return list.map((value, index) => {
    return { x: index, y: value };
  });
}

// Utility function to get a color for each label
function getColorForLabel(label: string): Color {
  const colors = {
    "Total wealth post tax": color("rgba(75, 192, 192, 0.6)"),
    "House value": color("rgba(255, 159, 64, 0.6)"),
    "Stocks post tax": color("rgba(153, 102, 255, 0.6)"),
    Cash: color("rgba(255, 205, 86, 0.6)"),
    Mortgage: color("rgba(54, 162, 235, 0.6)"),
    "Money spent": color("rgba(255, 99, 132, 0.6)"),
  };
  return colors[label] || "rgba(0, 0, 0, 0.6)";
}

export function createPlot(idNumber, canvas, summaries$, axisLimitsSubject) {
  const datasets$: Observable<Array<Dataset>> = summaries$.pipe(
    map((summaries: Array<Array<AnnualSummary>>) => {
      const postTaxWealths = statsOverSamples(summaries, (s) => {
        return (
          s.houseValue +
          s.cashValue +
          s.stockIsaValue +
          s.stockNonIsaValue -
          s.mortgageBalance -
          computeCapitalGainsTax(s)
        );
      });
      const mortgageBalances = statsOverSamples(
        summaries,
        (s) => -s.mortgageBalance,
      );
      const cashValues = statsOverSamples(summaries, (s) => s.cashValue);
      const postTaxStocksValues = statsOverSamples(
        summaries,
        (s) => s.stockIsaValue + s.stockNonIsaValue - computeCapitalGainsTax(s),
      );
      const houseValues = statsOverSamples(summaries, (s) => s.houseValue);
      const moneySpent = statsOverSamples(summaries, (s) => -s.moneySpent);

      const createDataset = (
        label: string,
        data: { median: Array<number>; p10: Array<number>; p90: Array<number> },
      ) => {
        const color = getColorForLabel(label);
        const backgroundColor = color.copy({ opacity: 0.1 });
        return [
          {
            label: `${label} (median)`,
            data: listToPoints(data.median),
            showLine: true,
            borderColor: color,
            fill: false,
            pointRadius: 3,
          },
          {
            label: `${label} (90th percentile)`,
            data: listToPoints(data.p90),
            showLine: false,
            backgroundColor: backgroundColor,
            fill: "+1",
            pointRadius: 0,
          },
          {
            label: `${label} (10th percentile)`,
            data: listToPoints(data.p10),
            showLine: false,
            backgroundColor: backgroundColor,
            fill: "-1",
            pointRadius: 0,
          },
        ];
      };

      return [
        ...createDataset("Total wealth post tax", postTaxWealths),
        ...createDataset("House value", houseValues),
        ...createDataset("Stocks post tax", postTaxStocksValues),
        ...createDataset("Cash", cashValues),
        ...createDataset("Mortgage", mortgageBalances),
        ...createDataset("Money spent", moneySpent),
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
    Filler,
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
        filler: {
          propagate: false,
        },
        colors: {
          enabled: true,
        },
        legend: {
          display: true, // This is true by default
          position: "top", // Position of the legend (top, left, bottom, right)
          labels: {
            filter: (labelItem, _) => !labelItem.text.includes("percentile"),
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
      const roundingUnitY = 250_000;
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
