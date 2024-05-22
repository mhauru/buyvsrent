import { fromEvent, Observable, combineLatest } from "rxjs";
import { map, startWith } from "rxjs/operators";
import {
  Chart,
  ChartConfiguration,
  ScatterController,
  Legend,
  Colors,
  Title,
  PointElement,
  LineElement,
  LinearScale,
  CategoryScale,
} from "chart.js";

const outputElement: HTMLElement = document.getElementById(
  "output",
) as HTMLElement;

function makeNumberObservable(inputElementName: string): Observable<number> {
  const input: HTMLInputElement = document.getElementById(
    inputElementName,
  ) as HTMLInputElement;
  const observable: Observable<number> = fromEvent(input, "input").pipe(
    map((event) => parseFloat((event.target as HTMLInputElement).value)),
    startWith(parseFloat(input.value)),
  );
  return observable;
}
// Create streams from the input elements
const houseValue0$ = makeNumberObservable("house_value_0");
const cash0$ = makeNumberObservable("cash_0");
const mortgageMonthlyPayment$ = makeNumberObservable(
  "mortgage_monthly_payment",
);
const mortgageInterestRate$ = makeNumberObservable("mortgage_interest_rate");
const houseAppreciationRate$ = makeNumberObservable("house_appreciation_rate");
const yearsToForecast$ = makeNumberObservable("years_to_forecast");

const mortgage0$ = combineLatest([houseValue0$, cash0$]).pipe(
  map(([houseValue0, cash0]: Array<number>) => {
    return houseValue0 - cash0;
  }),
);

interface AnnualSummary {
  houseValue: number;
  cashValue: number;
  otherInvestmentValue: number;
  mortgageBalance: number;
  yearNumber: number;
  moneySpent: number;
}

const summary0$: Observable<AnnualSummary> = combineLatest([
  houseValue0$,
  mortgage0$,
]).pipe(
  map(([houseValue0, mortgage0]: Array<number>) => {
    return {
      houseValue: houseValue0,
      cashValue: 0,
      otherInvestmentValue: 0,
      mortgageBalance: mortgage0,
      yearNumber: 0,
      moneySpent: 0,
    };
  }),
);

function getNextSummary(
  summary: AnnualSummary,
  houseAppreciationRate: number,
  mortgageInterestRate: number,
  mortgageMonthlyPayment: number,
): AnnualSummary {
  const newHouseValue =
    summary.houseValue * (1 + houseAppreciationRate / 100.0);
  const interest = (summary.mortgageBalance * mortgageInterestRate) / 100.0;
  let newMortgageBalance =
    summary.mortgageBalance + interest - mortgageMonthlyPayment * 12;
  let cashSaved = 0.0;
  if (newMortgageBalance < 0) {
    cashSaved = -newMortgageBalance;
    newMortgageBalance = 0;
  }
  return {
    houseValue: newHouseValue,
    cashValue: summary.cashValue + cashSaved,
    otherInvestmentValue: summary.otherInvestmentValue,
    mortgageBalance: newMortgageBalance,
    yearNumber: summary.yearNumber + 1,
    moneySpent: summary.moneySpent + interest,
  };
}

const summaries$: Observable<Array<AnnualSummary>> = combineLatest([
  summary0$,
  houseAppreciationRate$,
  mortgageInterestRate$,
  mortgageMonthlyPayment$,
  yearsToForecast$,
]).pipe(
  map(
    ([
      summary0,
      houseAppreciationRate,
      mortgageInterestRate,
      mortgageMonthlyPayment,
      yearsToForecast,
    ]) => {
      const summaries = [summary0];
      let lastSummary = summary0;

      for (let i = 1; i <= yearsToForecast; i++) {
        const nextSummary = getNextSummary(
          lastSummary,
          houseAppreciationRate,
          mortgageInterestRate,
          mortgageMonthlyPayment,
        );
        summaries.push(nextSummary);
        lastSummary = nextSummary;
      }
      return summaries;
    },
  ),
);

interface PlotPoint {
  x: number;
  y: number;
}
interface Dataset {
  label: string;
  data: Array<PlotPoint>;
  showLine: boolean;
}
const datasets$: Observable<Array<Dataset>> = summaries$.pipe(
  map((summaries: Array<AnnualSummary>) => {
    const wealths = summaries.map((s, i) => {
      return {
        x: i,
        y:
          s.houseValue +
          s.cashValue +
          s.otherInvestmentValue -
          s.mortgageBalance,
      };
    });
    const mortgageBalances = summaries.map((s, i) => {
      return { x: i, y: s.mortgageBalance };
    });
    const cashValues = summaries.map((s, i) => {
      return { x: i, y: s.cashValue };
    });
    const houseValues = summaries.map((s, i) => {
      return { x: i, y: s.houseValue };
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
        label: "Cash",
        data: cashValues,
        showLine: true,
      },
      {
        label: "Mortgage",
        data: mortgageBalances,
        showLine: true,
      },
    ];
  }),
);

Chart.register(
  ScatterController,
  Title,
  Legend,
  Colors,
  PointElement,
  LineElement,
  LinearScale,
  CategoryScale,
);

const config: ChartConfiguration<"scatter", { x: number; y: number }[]> = {
  type: "scatter",
  data: { datasets: [] },
  options: {
    animation: false,
    responsive: true,
    scales: {
      x: {
        type: "linear",
        position: "bottom",
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

const context = (
  document.getElementById("output_canvas") as HTMLCanvasElement
).getContext("2d");
const chart = new Chart(context, config);

datasets$.subscribe((datasets) => {
  config.data.datasets = datasets;
  chart.update();
});
