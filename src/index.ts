import { fromEvent, Observable, combineLatest, BehaviorSubject } from "rxjs";
import { map, startWith } from "rxjs/operators";
import { mean } from "mathjs";
import {
  AnnualSummary,
  getNextSummary,
  getInitialSummary,
  computeCapitalGainsTax,
} from "./financial_logic";
import { Inputs, RandomVariableDistribution, createPropertyInputs } from "./ui";
import { MinMaxObject, createPlot } from "./plots";

type InputsById = {
  [key: number]: Inputs;
};

const DEFAULT_INPUTS: Inputs = {
  isBuying: true,
  housePrice: 500_000,
  cash: 315_000,
  mortgage: 200_000,
  salary: 2700,
  salaryGrowth: { mean: 7, stdDev: 2 },
  // The average gross rental yield, i.e. annual rent divided by house price, is around
  // 4.5% in London.
  // Source: https://www.trackcapital.co.uk/news-articles/uk-buy-to-let-yield-map/
  rent: (500_000 * 0.045) / 12,
  // These are numbers I got from a Nationwide calculator for 500k house with 200k mortgage
  // on 2024-06-09, rounded a bit.
  mortgageStage1Length: 2,
  mortgageInterestRateStage1: 6.14,
  mortgageMonthlyPaymentStage1: 1450,
  mortgageInterestRateStage2: 7.99,
  mortgageMonthlyPaymentStage2: 1650,
  mortgageOverpay: true,
  // House prices in London grew on average 4.4% between Jan 2005 and Jan 2024.
  // Source: https://www.ons.gov.uk/economy/inflationandpriceindices/bulletins/housepriceindex/latest
  houseAppreciationRate: { mean: 4.4, stdDev: 2 },
  // Often quoted numbers for historical stock price growth are 6% and 7% over inflation.
  // CPIH grew by 2.9% annualised between January 2005 and Jan 2024.
  // Source: https://www.ons.gov.uk/economy/inflationandpriceindices/timeseries/l522/mm23
  // BoE target is 2% inflation.
  stockAppreciationRate: { mean: 9, stdDev: 5 },
  // Rents are assumed to grow at the same rate as house prices. See above for house prices.
  rentGrowth: { mean: 4.4, stdDev: 2 },
  yearsToForecast: 20,
  // Buying costs rough estimate from here:
  // https://www.zoopla.co.uk/discover/buying/buying-costs/
  buyingCosts: 5000,
  firstTimeBuyer: true,
  groundRent: 500,
  // Service charge estimate picked roughly from here:
  // https://www.sunnyavenue.co.uk/insight/what-is-a-reasonable-service-charge
  serviceChargeRate: 0.6,
  maintenanceRate: 2,
  homeInsurance: 300,
  numSamples: 100,
};

const DEFAULT_INPUTS_BY_ID = {
  1: {
    ...DEFAULT_INPUTS,
    isBuying: true,
  },
  2: {
    ...DEFAULT_INPUTS,
    isBuying: false,
  },
};

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

function makeDistributionObservable([
  inputMean,
  inputStdDev,
]: HTMLInputElement[]): Observable<RandomVariableDistribution> {
  const meanObservable = makeNumberObservable(inputMean);
  const stdDevObservable = makeNumberObservable(inputStdDev);
  const observable: Observable<RandomVariableDistribution> = combineLatest([
    meanObservable,
    stdDevObservable,
  ]).pipe(
    map(([mean, stdDev]) => {
      return { mean: mean, stdDev: stdDev };
    }),
  );
  return observable;
}

type InputObservables = {
  [K in keyof Inputs]: Inputs[K] extends number
    ? Observable<number>
    : Inputs[K] extends boolean
      ? Observable<boolean>
      : Inputs[K] extends RandomVariableDistribution
        ? Observable<RandomVariableDistribution>
        : Inputs[K];
};

function makeScenario(
  idNumber: number,
  axisLimitsSubject: BehaviorSubject<MinMaxObject>,
  allInputsSubject: BehaviorSubject<InputsById>,
  inputs: Inputs,
) {
  const [propertyInputs, summaryValueSpans, canvas] = createPropertyInputs(
    idNumber,
    inputs,
  );

  // Create observables from the input elements
  const obs: InputObservables = {} as InputObservables;
  for (const inputName in propertyInputs) {
    const inputElements = propertyInputs[inputName];
    if (inputElements.length > 1) {
      obs[inputName] = makeDistributionObservable(inputElements);
    } else {
      const inputElement = inputElements[0];
      if (inputElement.type === "checkbox") {
        obs[inputName] = makeBooleanObservable(inputElement);
      } else {
        obs[inputName] = makeNumberObservable(inputElement);
      }
    }
  }

  const summary0$: Observable<AnnualSummary> = combineLatest([
    obs.isBuying,
    obs.housePrice,
    obs.cash,
    obs.salary,
    obs.rent,
    obs.mortgage,
    obs.buyingCosts,
    obs.firstTimeBuyer,
  ]).pipe(map((args) => getInitialSummary(...args)));

  const summaries$: Observable<Array<Array<AnnualSummary>>> = combineLatest([
    summary0$,
    obs.salaryGrowth,
    obs.rentGrowth,
    obs.isBuying,
    obs.stockAppreciationRate,
    obs.houseAppreciationRate,
    obs.mortgageStage1Length,
    obs.mortgageInterestRateStage1,
    obs.mortgageMonthlyPaymentStage1,
    obs.mortgageInterestRateStage2,
    obs.mortgageMonthlyPaymentStage2,
    obs.mortgageOverpay,
    obs.yearsToForecast,
    obs.groundRent,
    obs.serviceChargeRate,
    obs.homeInsurance,
    obs.maintenanceRate,
    obs.numSamples,
  ]).pipe(
    map(
      ([
        summary0,
        salaryGrowth,
        rentGrowth,
        isBuying,
        stockAppreciationRate,
        houseAppreciationRate,
        mortgageStage1Length,
        mortgageInterestRateStage1,
        mortgageMonthlyPaymentStage1,
        mortgageInterestRateStage2,
        mortgageMonthlyPaymentStage2,
        mortgageOverpay,
        yearsToForecast,
        groundRent,
        serviceChargeRate,
        homeInsurance,
        maintenanceRate,
        numSamples,
      ]) => {
        const samples: Array<Array<AnnualSummary>> = [];

        for (let i = 0; i < numSamples; i++) {
          let history = [summary0];
          let lastSummary = summary0;

          for (let i = 1; i <= yearsToForecast; i++) {
            let mortgageMonthlyPayment: number;
            let mortgageInterestRate: number;
            if (i <= mortgageStage1Length) {
              mortgageMonthlyPayment = mortgageMonthlyPaymentStage1;
              mortgageInterestRate = mortgageInterestRateStage1;
            } else {
              mortgageMonthlyPayment = mortgageMonthlyPaymentStage2;
              mortgageInterestRate = mortgageInterestRateStage2;
            }
            const nextSummary = getNextSummary(
              lastSummary,
              salaryGrowth,
              rentGrowth,
              isBuying,
              stockAppreciationRate,
              houseAppreciationRate,
              mortgageInterestRate,
              mortgageMonthlyPayment,
              mortgageOverpay,
              groundRent,
              serviceChargeRate,
              homeInsurance,
              maintenanceRate,
            );
            history.push(nextSummary);
            lastSummary = nextSummary;
          }
          samples.push(history);
        }
        return samples;
      },
    ),
  );

  createPlot(idNumber, canvas, summaries$, axisLimitsSubject);

  function numberToStringPretty(value: number) {
    return Math.round(value).toLocaleString();
  }

  summaries$.subscribe((summaries: AnnualSummary[][]) => {
    const lastSummaries = summaries.map(
      (history) => history[history.length - 1],
    );
    const postTaxWealth = mean(
      lastSummaries.map((s) => {
        return (
          s.houseValue +
          s.cashValue +
          s.stockIsaValue +
          s.stockNonIsaValue -
          s.mortgageBalance -
          computeCapitalGainsTax(s)
        );
      }),
    );
    summaryValueSpans.houseValue.innerHTML = numberToStringPretty(
      mean(lastSummaries.map((s) => s.houseValue)),
    );
    summaryValueSpans.salary.innerHTML = numberToStringPretty(
      mean(lastSummaries.map((s) => s.salary)),
    );
    summaryValueSpans.wealth.innerHTML = numberToStringPretty(postTaxWealth);
    summaryValueSpans.rent.innerHTML = numberToStringPretty(
      mean(lastSummaries.map((s) => s.rent)),
    );
    summaryValueSpans.stockIsaValue.innerHTML = numberToStringPretty(
      mean(lastSummaries.map((s) => s.stockIsaValue)),
    );
    summaryValueSpans.stockNonIsaValue.innerHTML = numberToStringPretty(
      mean(lastSummaries.map((s) => s.stockNonIsaValue)),
    );
  });

  let currentAllInputs: InputsById;
  allInputsSubject.subscribe({
    next: (inputs: InputsById) => {
      currentAllInputs = inputs;
    },
  });

  const keys = Object.keys(obs);
  const allObs = keys.map((key) => obs[key]);
  combineLatest(allObs).subscribe((valuesAsArray) => {
    const valuesAsObj: Inputs = {} as Inputs;
    keys.forEach((key, i) => {
      valuesAsObj[key] = valuesAsArray[i];
    });
    currentAllInputs[idNumber] = valuesAsObj;
    allInputsSubject.next(currentAllInputs);
  });
}

// Only used for making sure all plots have the same axis limits.
const axisLimitsSubject = new BehaviorSubject<MinMaxObject>({
  minY: {},
  maxY: {},
  minX: {},
  maxX: {},
});

const allInputsSubject = new BehaviorSubject<InputsById>({});

function decodeInputsFromUrl(): InputsById {
  const urlParams = new URLSearchParams(window.location.search);
  const encodedString = urlParams.get("inputs");
  if (encodedString) {
    const jsonString = decodeURIComponent(encodedString);
    return JSON.parse(jsonString);
  }
  return DEFAULT_INPUTS_BY_ID;
}

const inputsFromUrl = decodeInputsFromUrl();

Object.entries(inputsFromUrl).forEach(([id, inputs]) => {
  makeScenario(parseInt(id), axisLimitsSubject, allInputsSubject, inputs);
});

allInputsSubject.subscribe((allInputs) => {
  const jsonString = JSON.stringify(allInputs);
  const encodedString = encodeURIComponent(jsonString);
  const newUrl = `${window.location.pathname}?inputs=${encodedString}`;
  window.history.replaceState(null, "", newUrl);
});
