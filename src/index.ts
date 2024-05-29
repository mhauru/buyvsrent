import { fromEvent, Observable, combineLatest } from "rxjs";
import { map, startWith } from "rxjs/operators";
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

const DEFAULT_HOUSE_VALUE = 500000;
const DEFAULT_CASH = 300000;
const DEFAULT_MORTGAGE_INTEREST_RATE = 5;
const DEFAULT_MORTGAGE_MONTHLY_PAYMENT = 2000;
const DEFAULT_HOUSE_APPRECIATION_RATE = 3;
const DEFAULT_YEARS_TO_FORECAST = 25;
const DEFAULT_BUYING_COSTS = 2500;
const DEFAULT_FIRST_TIME_BUYER = false;
const DEFAULT_GROUND_RENT = 500;
const DEFAULT_SERVICE_CHARGE = 1800;
const DEFAULT_MAINTENANCE_RATE = 2;
const DEFAULT_HOME_INSURANCE = 300;

interface PropertyInputs {
  houseValue: HTMLInputElement;
  cash: HTMLInputElement;
  mortgageInterestRate: HTMLInputElement;
  mortgageMonthlyPayment: HTMLInputElement;
  houseAppreciationRate: HTMLInputElement;
  yearsToForecast: HTMLInputElement;
  buyingCosts: HTMLInputElement;
  firstTimeBuyer: HTMLInputElement;
  groundRent: HTMLInputElement;
  serviceCharge: HTMLInputElement;
  maintenanceRate: HTMLInputElement;
  homeInsurance: HTMLInputElement;
  canvas: HTMLCanvasElement;
}

function createPropertyInputs(idSuffix: number): PropertyInputs {
  const createInputElement = (
    id: string,
    type: string,
    value: string | number,
    step: string | number,
  ): HTMLInputElement => {
    const input = document.createElement("input");
    input.id = `${id}_${idSuffix}`;
    input.type = type;
    input.value = value.toString();
    input.step = step.toString();
    return input;
  };

  const createLabelElement = (
    forId: string,
    text: string,
  ): HTMLLabelElement => {
    const label = document.createElement("label");
    label.htmlFor = forId;
    label.innerText = text;
    return label;
  };

  const createParagraphElement = (
    label: HTMLLabelElement,
    input: HTMLInputElement,
  ): HTMLParagraphElement => {
    const p = document.createElement("p");
    p.appendChild(label);
    p.appendChild(input);
    return p;
  };

  const createDivElement = (id: string): HTMLDivElement => {
    const div = document.createElement("div");
    div.id = `${id}_${idSuffix}`;
    return div;
  };

  const createCanvasElement = (
    id: string,
    styles: { [key: string]: string },
  ): HTMLCanvasElement => {
    const canvas = document.createElement("canvas");
    canvas.id = `${id}_${idSuffix}`;
    for (const [key, value] of Object.entries(styles)) {
      canvas.style.setProperty(key, value);
    }
    return canvas;
  };

  const houseValue = createInputElement(
    "house_value",
    "number",
    DEFAULT_HOUSE_VALUE,
    1000,
  );
  const cash = createInputElement("cash", "number", DEFAULT_CASH, 1000);
  const mortgageInterestRate = createInputElement(
    "mortgage_interest_rate",
    "number",
    DEFAULT_MORTGAGE_INTEREST_RATE,
    0.1,
  );
  const mortgageMonthlyPayment = createInputElement(
    "mortgage_monthly_payment",
    "number",
    DEFAULT_MORTGAGE_MONTHLY_PAYMENT,
    100,
  );
  const houseAppreciationRate = createInputElement(
    "house_appreciation_rate",
    "number",
    DEFAULT_HOUSE_APPRECIATION_RATE,
    0.1,
  );
  const yearsToForecast = createInputElement(
    "years_to_forecast",
    "number",
    DEFAULT_YEARS_TO_FORECAST,
    1,
  );
  const buyingCosts = createInputElement(
    "buying_costs",
    "number",
    DEFAULT_BUYING_COSTS,
    100,
  );
  const firstTimeBuyer = createInputElement(
    "first_time_buyer",
    "checkbox",
    DEFAULT_FIRST_TIME_BUYER ? "true" : "false",
    "",
  );
  const groundRent = createInputElement(
    "ground_rent",
    "number",
    DEFAULT_GROUND_RENT,
    50,
  );
  const serviceCharge = createInputElement(
    "service_charge",
    "number",
    DEFAULT_SERVICE_CHARGE,
    100,
  );
  const maintenanceRate = createInputElement(
    "maintenance_rate",
    "number",
    DEFAULT_MAINTENANCE_RATE,
    0.1,
  );
  const homeInsurance = createInputElement(
    "home_insurance",
    "number",
    DEFAULT_HOME_INSURANCE,
    50,
  );

  const canvasDiv = createDivElement("canvas_div");
  const canvas = createCanvasElement("canvas", {
    "max-width": "80em",
    "max-height": "40em",
  });
  canvasDiv.appendChild(canvas);

  const elements = [
    createParagraphElement(
      createLabelElement(houseValue.id, "House value at purchase"),
      houseValue,
    ),
    createParagraphElement(
      createLabelElement(cash.id, "Cash at purchase"),
      cash,
    ),
    createParagraphElement(
      createLabelElement(
        mortgageInterestRate.id,
        "Mortgage interest rate (%), annual",
      ),
      mortgageInterestRate,
    ),
    createParagraphElement(
      createLabelElement(
        mortgageMonthlyPayment.id,
        "Mortgage payment, monthly",
      ),
      mortgageMonthlyPayment,
    ),
    createParagraphElement(
      createLabelElement(
        houseAppreciationRate.id,
        "House price appreciation (%), annual",
      ),
      houseAppreciationRate,
    ),
    createParagraphElement(
      createLabelElement(yearsToForecast.id, "Years to forecast"),
      yearsToForecast,
    ),
    createParagraphElement(
      createLabelElement(
        buyingCosts.id,
        "Buying costs (survey, conveyancing fee, etc.)",
      ),
      buyingCosts,
    ),
    createParagraphElement(
      createLabelElement(firstTimeBuyer.id, "First time buyer"),
      firstTimeBuyer,
    ),
    createParagraphElement(
      createLabelElement(groundRent.id, "Ground rent, annual"),
      groundRent,
    ),
    createParagraphElement(
      createLabelElement(serviceCharge.id, "Service charge, annual"),
      serviceCharge,
    ),
    createParagraphElement(
      createLabelElement(
        maintenanceRate.id,
        "Maintenance cost, % of value, annual",
      ),
      maintenanceRate,
    ),
    createParagraphElement(
      createLabelElement(homeInsurance.id, "Home insurance, annual"),
      homeInsurance,
    ),
    canvasDiv,
  ];

  const wrapperDiv = document.createElement("div");
  elements.forEach((element) => wrapperDiv.appendChild(element));
  document.body.appendChild(wrapperDiv);

  return {
    houseValue,
    cash,
    mortgageInterestRate,
    mortgageMonthlyPayment,
    houseAppreciationRate,
    yearsToForecast,
    buyingCosts,
    firstTimeBuyer,
    groundRent,
    serviceCharge,
    maintenanceRate,
    homeInsurance,
    canvas,
  };
}

function makeNumberObservable(input: HTMLInputElement): Observable<number> {
  const observable: Observable<number> = fromEvent(input, "input").pipe(
    map((event) => parseFloat((event.target as HTMLInputElement).value)),
    startWith(parseFloat(input.value)),
  );
  return observable;
}

function makeBooleanObservable(input: HTMLInputElement): Observable<boolean> {
  const observable: Observable<boolean> = fromEvent(input, "input").pipe(
    map((event) => (event.target as HTMLInputElement).checked),
    startWith(input.checked),
  );
  return observable;
}

interface AnnualSummary {
  houseValue: number;
  cashValue: number;
  otherInvestmentValue: number;
  mortgageBalance: number;
  yearNumber: number;
  moneySpent: number;
}

function getNextSummary(
  summary: AnnualSummary,
  houseAppreciationRate: number,
  mortgageInterestRate: number,
  mortgageMonthlyPayment: number,
  groundRent: number,
  serviceCharge: number,
  homeInsurance: number,
  maintenanceRate: number,
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
  const maintenance = (newHouseValue * maintenanceRate) / 100.0;
  return {
    houseValue: newHouseValue,
    cashValue: summary.cashValue + cashSaved,
    otherInvestmentValue: summary.otherInvestmentValue,
    mortgageBalance: newMortgageBalance,
    yearNumber: summary.yearNumber + 1,
    moneySpent:
      summary.moneySpent +
      interest +
      maintenance +
      groundRent +
      serviceCharge +
      homeInsurance,
  };
}

function computeStampDuty(houseValue: number, firstTimeBuyer: boolean): number {
  const thresholds = [
    0,
    firstTimeBuyer ? 425_000 : 250_000,
    925_000,
    1_500_000,
    Infinity,
  ];
  const rates = [0.0, 0.05, 0.1, 0.12];
  let stampDuty = 0;
  for (let i = 0; i < rates.length; i++) {
    if (houseValue <= thresholds[i]) break;
    stampDuty +=
      (Math.min(houseValue, thresholds[i + 1]) - thresholds[i]) * rates[i];
  }
  return stampDuty;
}

interface PlotPoint {
  x: number;
  y: number;
}

interface Dataset {
  label: string;
  data: Array<PlotPoint>;
  showLine: boolean;
}

function makeScenario(idNumber: number) {
  const propertyInputs = createPropertyInputs(idNumber);

  // Create streams from the input elements
  const houseValue0$ = makeNumberObservable(propertyInputs.houseValue);
  const cash0$ = makeNumberObservable(propertyInputs.cash);
  const mortgageMonthlyPayment$ = makeNumberObservable(
    propertyInputs.mortgageMonthlyPayment,
  );
  const mortgageInterestRate$ = makeNumberObservable(
    propertyInputs.mortgageInterestRate,
  );
  const houseAppreciationRate$ = makeNumberObservable(
    propertyInputs.houseAppreciationRate,
  );
  const yearsToForecast$ = makeNumberObservable(propertyInputs.yearsToForecast);
  const buyingCosts$ = makeNumberObservable(propertyInputs.buyingCosts);
  const firstTimeBuyer$ = makeBooleanObservable(propertyInputs.firstTimeBuyer);
  const groundRent$ = makeNumberObservable(propertyInputs.groundRent);
  const serviceCharge$ = makeNumberObservable(propertyInputs.serviceCharge);
  const homeInsurance$ = makeNumberObservable(propertyInputs.homeInsurance);
  const maintenanceRate$ = makeNumberObservable(propertyInputs.maintenanceRate);

  const mortgage0$ = combineLatest([houseValue0$, cash0$]).pipe(
    map(([houseValue0, cash0]: Array<number>) => {
      return houseValue0 - cash0;
    }),
  );

  const summary0$: Observable<AnnualSummary> = combineLatest([
    houseValue0$,
    mortgage0$,
    buyingCosts$,
    firstTimeBuyer$,
  ]).pipe(
    map(
      ([houseValue0, mortgage0, buyingCosts, firstTimeBuyer]: [
        number,
        number,
        number,
        boolean,
      ]) => {
        const stampDuty = computeStampDuty(houseValue0, firstTimeBuyer);
        return {
          houseValue: houseValue0,
          cashValue: -stampDuty - buyingCosts,
          otherInvestmentValue: 0,
          mortgageBalance: mortgage0,
          yearNumber: 0,
          moneySpent: stampDuty + buyingCosts,
        };
      },
    ),
  );

  const summaries$: Observable<Array<AnnualSummary>> = combineLatest([
    summary0$,
    houseAppreciationRate$,
    mortgageInterestRate$,
    mortgageMonthlyPayment$,
    yearsToForecast$,
    groundRent$,
    serviceCharge$,
    homeInsurance$,
    maintenanceRate$,
  ]).pipe(
    map(
      ([
        summary0,
        houseAppreciationRate,
        mortgageInterestRate,
        mortgageMonthlyPayment,
        yearsToForecast,
        groundRent,
        serviceCharge,
        homeInsurance,
        maintenanceRate,
      ]) => {
        const summaries = [summary0];
        let lastSummary = summary0;

        for (let i = 0; i < yearsToForecast; i++) {
          const nextSummary = getNextSummary(
            lastSummary,
            houseAppreciationRate,
            mortgageInterestRate,
            mortgageMonthlyPayment,
            groundRent,
            serviceCharge,
            homeInsurance,
            maintenanceRate,
          );
          summaries.push(nextSummary);
          lastSummary = nextSummary;
        }
        return summaries;
      },
    ),
  );

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
        return { x: i, y: -s.mortgageBalance };
      });
      const cashValues = summaries.map((s, i) => {
        return { x: i, y: s.cashValue };
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

  const context = propertyInputs.canvas.getContext("2d");
  const chart = new Chart(context, config);

  datasets$.subscribe((datasets) => {
    config.data.datasets = datasets;
    chart.update();
  });
}

makeScenario(1);
