import { Observable, combineLatest } from "rxjs";
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
import * as fl from "./financial_logic";

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

interface Stats {
  median: Array<number>;
  p20: Array<number>;
  p80: Array<number>;
}

// Apply f to each AnnualSummary, and return a list of medians and percentiles of their values.
function statsOverSamples(
  summaries: Array<Array<fl.AnnualSummary>>,
  f: (arg1: fl.AnnualSummary) => number,
): Stats {
  const transposed = summaries[0].map((_, colIndex) =>
    summaries.map((row) => row[colIndex]),
  );
  const medianValues = transposed.map((innerArray) =>
    median(innerArray.map(f)),
  );
  const p20Values = transposed.map((innerArray) =>
    quantileSeq(innerArray.map(f), 0.2),
  );
  const p80Values = transposed.map((innerArray) =>
    quantileSeq(innerArray.map(f), 0.8),
  );
  return { median: medianValues, p20: p20Values, p80: p80Values };
}

function statsAreZeros(stats: Stats): boolean {
  return (
    stats.median.every((x) => x === 0) &&
    stats.p20.every((x) => x === 0) &&
    stats.p80.every((x) => x === 0)
  );
}

function arraysEqual(arr1: any[], arr2: any[]): boolean {
  return (
    arr1.length === arr2.length &&
    arr1.every((value, index) => value === arr2[index])
  );
}

function statsEqual(s1: Stats, s2: Stats): boolean {
  if (s1 === null) return s2 === null;
  if (s2 === null) return s1 === null;
  return (
    arraysEqual(s1.median, s2.median) &&
    arraysEqual(s1.p20, s2.p20) &&
    arraysEqual(s1.p80, s2.p80)
  );
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

export function createPlot(
  idNumber,
  canvas,
  summaries$: Observable<Array<Array<fl.AnnualSummary>>>,
  axisLimitsSubject,
  correctInflationObs: Observable<boolean>,
) {
  const datasets$: Observable<Array<Dataset>> = combineLatest([
    summaries$,
    correctInflationObs,
  ]).pipe(
    map(([summaries, correctInflation]) => {
      let postTaxWealths = statsOverSamples(summaries, (s) =>
        fl.postTaxWealth(s, correctInflation),
      );
      let mortgageBalances = statsOverSamples(
        summaries,
        (s) => -fl.mortgageBalance(s, correctInflation),
      );
      let cashValues = statsOverSamples(summaries, (s) =>
        fl.cashValue(s, correctInflation),
      );
      let postTaxStocksValues = statsOverSamples(summaries, (s) =>
        fl.postTaxStocksValue(s, correctInflation),
      );
      let houseValues = statsOverSamples(summaries, (s) =>
        fl.houseValue(s, correctInflation),
      );
      let moneySpent = statsOverSamples(
        summaries,
        (s) => -fl.moneySpent(s, correctInflation),
      );

      // Skip plotting results that are trivial.
      if (statsAreZeros(cashValues)) cashValues = null;
      if (statsAreZeros(houseValues)) houseValues = null;
      if (statsAreZeros(postTaxStocksValues)) postTaxStocksValues = null;
      if (statsAreZeros(mortgageBalances)) mortgageBalances = null;
      if (statsAreZeros(moneySpent)) moneySpent = null;
      if (statsEqual(postTaxStocksValues, postTaxWealths))
        postTaxWealths = null;
      if (statsEqual(houseValues, postTaxWealths)) postTaxWealths = null;
      if (statsEqual(cashValues, postTaxWealths)) postTaxWealths = null;

      const createDataset = (
        label: string,
        data: { median: Array<number>; p20: Array<number>; p80: Array<number> },
      ) => {
        const color = getColorForLabel(label);
        const backgroundColor = color.copy({ opacity: 0.1 });
        return [
          {
            label: `${label}`,
            data: listToPoints(data.median),
            showLine: true,
            borderColor: color,
            fill: false,
            pointRadius: 3,
          },
          {
            label: `${label} (80th percentile)`,
            data: listToPoints(data.p80),
            showLine: false,
            backgroundColor: backgroundColor,
            fill: "+1",
            pointRadius: 0,
          },
          {
            label: `${label} (20th percentile)`,
            data: listToPoints(data.p20),
            showLine: false,
            backgroundColor: backgroundColor,
            fill: "-1",
            pointRadius: 0,
          },
        ];
      };

      const return_value = [];
      if (postTaxWealths !== null)
        return_value.push(
          ...createDataset("Total wealth post tax", postTaxWealths),
        );
      if (houseValues !== null)
        return_value.push(...createDataset("House value", houseValues));
      if (postTaxStocksValues !== null)
        return_value.push(
          ...createDataset("Stocks post tax", postTaxStocksValues),
        );
      if (cashValues !== null)
        return_value.push(...createDataset("Cash", cashValues));
      if (mortgageBalances !== null)
        return_value.push(...createDataset("Mortgage", mortgageBalances));
      if (moneySpent !== null)
        return_value.push(...createDataset("Money spent", moneySpent));
      return return_value;
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
          display: true,
          position: "top",
          labels: {
            filter: (labelItem, _) => !labelItem.text.includes("percentile"),
            font: {
              size: 14,
            },
            color: "rgb(0, 0, 0)",
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
