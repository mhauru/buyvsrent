import { fromEvent, Observable, combineLatest, BehaviorSubject } from "rxjs";
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

const ISA_MAX_CONTRIBUTION = 20_000;
const DEFAULT_HOUSE_VALUE = 500_000;
const DEFAULT_CASH = 300_000;
const DEFAULT_MORTGAGE = 215_000;
const DEFAULT_SALARY = 45_000;
const DEFAULT_RENT = 2000;
const DEFAULT_MORTGAGE_INTEREST_RATE = 5;
const DEFAULT_MORTGAGE_MONTHLY_PAYMENT = 2000;
const DEFAULT_HOUSE_APPRECIATION_RATE = 3;
const DEFAULT_STOCK_APPRECIATION_RATE = 6;
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
  mortgage: HTMLInputElement;
  salary: HTMLInputElement;
  rent: HTMLInputElement;
  mortgageInterestRate: HTMLInputElement;
  mortgageMonthlyPayment: HTMLInputElement;
  stockAppreciationRate: HTMLInputElement;
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

const createLabelElement = (forId: string, text: string): HTMLLabelElement => {
  const label = document.createElement("label");
  label.htmlFor = forId;
  label.innerText = text;
  label.classList.add("input-label");
  return label;
};

const createInputElement = (
  id: string,
  idSuffix: number,
  type: string,
  value: string | number,
  step: string | number,
): HTMLInputElement => {
  const input = document.createElement("input");
  input.id = `${id}_${idSuffix}`;
  input.type = type;
  input.value = value.toString();
  input.step = step.toString();
  input.classList.add("input-field");
  return input;
};

const createParagraphElement = (
  label: HTMLLabelElement,
  input: HTMLInputElement,
): HTMLParagraphElement => {
  const p = document.createElement("p");
  p.appendChild(label);
  p.appendChild(input);
  p.classList.add("input-group");
  return p;
};

const createCanvasDivElement = (
  id: string,
  idSuffix: number,
): HTMLDivElement => {
  const div = document.createElement("div");
  div.id = `${id}_${idSuffix}`;
  div.classList.add("canvas-container");
  return div;
};

const createCanvasElement = (
  id: string,
  idSuffix: number,
): HTMLCanvasElement => {
  const canvas = document.createElement("canvas");
  canvas.id = `${id}_${idSuffix}`;
  canvas.classList.add("output-canvas");
  return canvas;
};

function createPropertyInputs(idSuffix: number): PropertyInputs {
  const houseValue = createInputElement(
    "house_value",
    idSuffix,
    "number",
    DEFAULT_HOUSE_VALUE,
    1000,
  );
  const cash = createInputElement(
    "cash",
    idSuffix,
    "number",
    DEFAULT_CASH,
    1000,
  );
  const mortgage = createInputElement(
    "mortgage",
    idSuffix,
    "number",
    DEFAULT_MORTGAGE,
    1000,
  );
  const salary = createInputElement(
    "salary",
    idSuffix,
    "number",
    DEFAULT_SALARY,
    100,
  );
  const rent = createInputElement(
    "rent",
    idSuffix,
    "number",
    DEFAULT_RENT,
    100,
  );
  const mortgageInterestRate = createInputElement(
    "mortgage_interest_rate",
    idSuffix,
    "number",
    DEFAULT_MORTGAGE_INTEREST_RATE,
    0.1,
  );
  const mortgageMonthlyPayment = createInputElement(
    "mortgage_monthly_payment",
    idSuffix,
    "number",
    DEFAULT_MORTGAGE_MONTHLY_PAYMENT,
    100,
  );
  const stockAppreciationRate = createInputElement(
    "stock_appreciation_rate",
    idSuffix,
    "number",
    DEFAULT_STOCK_APPRECIATION_RATE,
    0.1,
  );
  const houseAppreciationRate = createInputElement(
    "house_appreciation_rate",
    idSuffix,
    "number",
    DEFAULT_HOUSE_APPRECIATION_RATE,
    0.1,
  );
  const yearsToForecast = createInputElement(
    "years_to_forecast",
    idSuffix,
    "number",
    DEFAULT_YEARS_TO_FORECAST,
    1,
  );
  const buyingCosts = createInputElement(
    "buying_costs",
    idSuffix,
    "number",
    DEFAULT_BUYING_COSTS,
    100,
  );
  const firstTimeBuyer = createInputElement(
    "first_time_buyer",
    idSuffix,
    "checkbox",
    DEFAULT_FIRST_TIME_BUYER ? "true" : "false",
    "",
  );
  const groundRent = createInputElement(
    "ground_rent",
    idSuffix,
    "number",
    DEFAULT_GROUND_RENT,
    50,
  );
  const serviceCharge = createInputElement(
    "service_charge",
    idSuffix,
    "number",
    DEFAULT_SERVICE_CHARGE,
    100,
  );
  const maintenanceRate = createInputElement(
    "maintenance_rate",
    idSuffix,
    "number",
    DEFAULT_MAINTENANCE_RATE,
    0.1,
  );
  const homeInsurance = createInputElement(
    "home_insurance",
    idSuffix,
    "number",
    DEFAULT_HOME_INSURANCE,
    50,
  );

  const canvasDiv = createCanvasDivElement("canvas_div", idSuffix);
  const canvas = createCanvasElement("canvas", idSuffix);
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
      createLabelElement(mortgage.id, "Initial mortgage"),
      mortgage,
    ),
    createParagraphElement(
      createLabelElement(salary.id, "Net annual salary"),
      salary,
    ),
    createParagraphElement(createLabelElement(rent.id, "Monthly rent"), rent),
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
        stockAppreciationRate.id,
        "Stock value appreciation (%), annual",
      ),
      stockAppreciationRate,
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
        "Maintenance costs, % of value, annual",
      ),
      maintenanceRate,
    ),
    createParagraphElement(
      createLabelElement(homeInsurance.id, "Home insurance, annual"),
      homeInsurance,
    ),
  ];

  const inputsDiv = document.createElement("div");
  inputsDiv.classList.add("inputs-div");
  elements.forEach((element) => inputsDiv.appendChild(element));

  const wrapperDiv = document.createElement("div");
  wrapperDiv.classList.add("property-wrapper");
  wrapperDiv.appendChild(canvasDiv);
  wrapperDiv.appendChild(inputsDiv);

  document.body.appendChild(wrapperDiv);

  return {
    houseValue,
    cash,
    mortgage,
    salary,
    rent,
    mortgageInterestRate,
    mortgageMonthlyPayment,
    stockAppreciationRate,
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
  stockIsaValue: number;
  stockNonIsaValue: number;
  mortgageBalance: number;
  moneySpent: number;
  yearNumber: number;
}

function appreciateHouseValue(
  summary: AnnualSummary,
  houseAppreciationRate: number,
) {
  summary.houseValue *= 1 + houseAppreciationRate / 100.0;
}

function appreciateStockValue(
  summary: AnnualSummary,
  stockAppreciationRate: number,
) {
  summary.stockIsaValue *= 1 + stockAppreciationRate / 100.0;
  summary.stockNonIsaValue *= 1 + stockAppreciationRate / 100.0;
}

function getSalary(summary: AnnualSummary, salary: number) {
  summary.cashValue += salary;
}

function payRent(summary: AnnualSummary, monthlyRent: number) {
  const annualRent = monthlyRent * 12;
  summary.cashValue -= annualRent;
  summary.moneySpent += annualRent;
}

function payMortgage(
  summary: AnnualSummary,
  mortgageMonthlyPayment: number,
  mortgageInterestRate: number,
) {
  const interest = (summary.mortgageBalance * mortgageInterestRate) / 100.0;
  let mortgageAnnualPayment = mortgageMonthlyPayment * 12;
  let principalReduction = mortgageAnnualPayment - interest;
  if (principalReduction > summary.mortgageBalance) {
    principalReduction = summary.mortgageBalance;
    mortgageAnnualPayment = principalReduction + interest;
  }
  summary.mortgageBalance -= principalReduction;
  summary.cashValue -= mortgageAnnualPayment;
  summary.moneySpent += interest;
}

function payRunningHouseCosts(
  summary: AnnualSummary,
  maintenanceRate: number,
  groundRent: number,
  serviceCharge: number,
  homeInsurance: number,
) {
  const maintenance = (summary.houseValue * maintenanceRate) / 100.0;
  const totalOutgoings =
    maintenance + groundRent + serviceCharge + homeInsurance;
  summary.cashValue -= totalOutgoings;
  summary.moneySpent += totalOutgoings;
}

function investSurplusCashInStocks(summary: AnnualSummary) {
  if (summary.cashValue < 0) return;
  const isaInvestment = Math.min(summary.cashValue, ISA_MAX_CONTRIBUTION);
  const nonIsaInvestment = summary.cashValue - isaInvestment;
  summary.cashValue -= isaInvestment + nonIsaInvestment;
  summary.stockIsaValue += isaInvestment;
  summary.stockNonIsaValue += nonIsaInvestment;
}

function buyHouse(
  summary: AnnualSummary,
  houseValue: number,
  mortgage: number,
  buyingCosts: number,
  firstTimeBuyer: boolean,
) {
  const stampDuty = computeStampDuty(houseValue, firstTimeBuyer);
  const cashPurchasePart = houseValue - mortgage;
  const cashNeeded = stampDuty + buyingCosts + cashPurchasePart;
  if (cashNeeded > summary.cashValue) {
    goBankrupt(summary);
  } else {
    summary.cashValue -= cashNeeded;
    summary.mortgageBalance += mortgage;
    summary.moneySpent += stampDuty + buyingCosts;
    summary.houseValue += houseValue;
  }
}

function goBankrupt(summary: AnnualSummary) {
  summary.houseValue = 0;
  summary.cashValue = 0;
  summary.stockIsaValue = 0;
  summary.stockNonIsaValue = 0;
  summary.mortgageBalance = 0;
  summary.moneySpent = 0;
}
function checkSummary(summary: AnnualSummary) {
  if (summary.cashValue < 0) {
    goBankrupt(summary);
  }
}

function getNextSummary(
  summary: AnnualSummary,
  salary: number,
  rent: number,
  stockAppreciationRate: number,
  houseAppreciationRate: number,
  mortgageInterestRate: number,
  mortgageMonthlyPayment: number,
  groundRent: number,
  serviceCharge: number,
  homeInsurance: number,
  maintenanceRate: number,
): AnnualSummary {
  const nextSummary = { ...summary };
  getSalary(nextSummary, salary);
  payMortgage(nextSummary, mortgageMonthlyPayment, mortgageInterestRate);
  payRunningHouseCosts(
    nextSummary,
    maintenanceRate,
    groundRent,
    serviceCharge,
    homeInsurance,
  );
  payRent(nextSummary, rent);
  appreciateHouseValue(nextSummary, houseAppreciationRate);
  appreciateStockValue(nextSummary, stockAppreciationRate);
  investSurplusCashInStocks(nextSummary);
  checkSummary(nextSummary);
  nextSummary.yearNumber += 1;
  return nextSummary;
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

function makeScenario(
  idNumber: number,
  axisLimitsSubject: BehaviorSubject<MinMaxObject>,
) {
  const propertyInputs = createPropertyInputs(idNumber);

  // Create streams from the input elements
  const houseValue0$ = makeNumberObservable(propertyInputs.houseValue);
  const cash0$ = makeNumberObservable(propertyInputs.cash);
  const mortgage0$ = makeNumberObservable(propertyInputs.mortgage);
  const salary$ = makeNumberObservable(propertyInputs.salary);
  const rent$ = makeNumberObservable(propertyInputs.rent);
  const mortgageMonthlyPayment$ = makeNumberObservable(
    propertyInputs.mortgageMonthlyPayment,
  );
  const mortgageInterestRate$ = makeNumberObservable(
    propertyInputs.mortgageInterestRate,
  );
  const stockAppreciationRate$ = makeNumberObservable(
    propertyInputs.stockAppreciationRate,
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

  const summary0$: Observable<AnnualSummary> = combineLatest([
    houseValue0$,
    cash0$,
    mortgage0$,
    buyingCosts$,
    firstTimeBuyer$,
  ]).pipe(
    map(
      ([houseValue0, cash0, mortgage0, buyingCosts, firstTimeBuyer]: [
        number,
        number,
        number,
        number,
        boolean,
      ]) => {
        const summary = {
          houseValue: 0,
          cashValue: cash0,
          stockIsaValue: 0,
          stockNonIsaValue: 0,
          mortgageBalance: 0,
          yearNumber: 0,
          moneySpent: 0,
        };
        if (houseValue0 > 0)
          buyHouse(
            summary,
            houseValue0,
            mortgage0,
            buyingCosts,
            firstTimeBuyer,
          );
        investSurplusCashInStocks(summary);
        checkSummary(summary);
        return summary;
      },
    ),
  );

  const summaries$: Observable<Array<AnnualSummary>> = combineLatest([
    summary0$,
    salary$,
    rent$,
    stockAppreciationRate$,
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
        salary,
        rent,
        stockAppreciationRate,
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
            salary,
            rent,
            stockAppreciationRate,
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

  const context = propertyInputs.canvas.getContext("2d");
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
      const yValues = dataset.data.map((point) => point.y);
      const xValues = dataset.data.map((point) => point.x);
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

type MinMaxObject = {
  minY: { [key: number]: number };
  maxY: { [key: number]: number };
  minX: { [key: number]: number };
  maxX: { [key: number]: number };
};

// Only used for making sure all plots have the same axis limits.
const axisLimitsSubject = new BehaviorSubject<MinMaxObject>({
  minY: {},
  maxY: {},
  minX: {},
  maxX: {},
});

makeScenario(1, axisLimitsSubject);
makeScenario(2, axisLimitsSubject);
