// The main module.
import { fromEvent, Observable, combineLatest, BehaviorSubject } from "rxjs";
import { map, shareReplay, startWith } from "rxjs/operators";

import * as fl from "./financial_logic";
import { Inputs, InputElements, createInputElements } from "./ui";
import { createFinalSummary } from "./final_summary";
import { MinMaxObject, createPlot } from "./plots";
import {
  RandomVariableDistribution,
  makeGenerator,
  makeRootGenerator,
} from "./random_variables";

const DEFAULT_INPUTS: Inputs = {
  isBuying: true,
  housePrice: 500_000,
  cash: 110_000,
  mortgage: 400_000,
  salary: 5_400,
  salaryGrowth: { mean: 2, stdDev: 3 },
  // The average gross rental yield, i.e. annual rent divided by house price, is around
  // 4.5% in London.
  // Source: https://www.trackcapital.co.uk/news-articles/uk-buy-to-let-yield-map/
  rent: (500_000 * 0.045) / 12,
  // These are numbers I got from a Nationwide calculator for 500k house with 200k mortgage
  // on 2024-06-09, rounded a bit.
  mortgageStage1Length: 2,
  mortgageInterestRateStage1: 5.09,
  mortgageMonthlyPaymentStage1: 2_170,
  mortgageInterestRateStage2: 7.99,
  mortgageMonthlyPaymentStage2: 2_890,
  mortgageOverpay: false,
  // These are the mean and standard deviation of UK annual CPI 1989-2023.
  // Source: https://www.ons.gov.uk/economy/inflationandpriceindices/timeseries/d7g7/mm23
  inflation: { mean: 2.7, stdDev: 3.7 },
  // These values are for annual growth over inflation for the average London house price 1989-2023.
  // Source: https://www.ons.gov.uk/economy/inflationandpriceindices/bulletins/housepriceindex/latest
  // Note that the standard deviation is for the year-to-year variation in the growth of the price
  // of the average home. The standard deviation for a _single_ home is likely far higher.
  houseAppreciationRate: { mean: 4.2, stdDev: 4.1 },
  // These values are for annual growth over inflation for the S&P 500 index 1989-2023.
  // Source: https://www.macrotrends.net/2324/sp-500-historical-chart-data
  stockAppreciationRate: { mean: 5.1, stdDev: 16.9 },
  // This is rent growth over house price growth. The mean is zero because we
  // assume that by default the two are coupled. The standard deviation is an unjustified guess.
  rentGrowth: { mean: 0, stdDev: 3 },
  yearsToForecast: 30,
  // Buying costs rough estimate from here:
  // https://www.zoopla.co.uk/discover/buying/buying-costs/
  buyingCosts: 5000,
  firstTimeBuyer: true,
  groundRent: 500,
  // Service charge estimate picked roughly from here:
  // https://www.sunnyavenue.co.uk/insight/what-is-a-reasonable-service-charge
  serviceChargeRate: 0.6,
  maintenanceRate: 1,
  homeInsurance: 0,
  numSamples: 100,
  correctInflation: true,
  seed: 0.0,
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

type InputsById = {
  [key: number]: Inputs;
};

type InputObservables = {
  [K in keyof Inputs]: Inputs[K] extends number
    ? Observable<number>
    : Inputs[K] extends boolean
      ? Observable<boolean>
      : Inputs[K] extends RandomVariableDistribution
        ? Observable<RandomVariableDistribution>
        : Inputs[K];
};

function makeNumberObservable(input: HTMLInputElement): Observable<number> {
  const observable: Observable<number> = fromEvent(input, "input").pipe(
    map((event: Event) => parseFloat((event.target as HTMLInputElement).value)),
    startWith(parseFloat(input.value)),
  );
  return observable;
}

function makeBooleanObservable(input: HTMLInputElement): Observable<boolean> {
  const observable: Observable<boolean> = fromEvent(input, "input").pipe(
    map((event: Event) => (event.target as HTMLInputElement).checked),
    startWith(input.checked),
  );
  return observable;
}

function makeDistributionObservable([inputMean, inputStdDev]: [
  HTMLInputElement,
  HTMLInputElement,
]): Observable<RandomVariableDistribution> {
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

// Make a new scenario. We usually make two of these, although could make more.
function makeScenario(
  idNumber: number,
  axisLimitsSubject: BehaviorSubject<MinMaxObject>,
  allInputsSubject: BehaviorSubject<InputsById>,
  inputs: Inputs,
) {
  const [propertyInputs, summaryValueSpans, canvas] = createInputElements(
    idNumber,
    inputs,
  );

  // Create observables from the input elements
  const obs: InputObservables = {} as InputObservables;
  for (const inputName in propertyInputs) {
    const inputElements = propertyInputs[inputName as keyof InputElements];
    if (inputElements.length == 2) {
      obs[inputName] = makeDistributionObservable(
        inputElements as [HTMLInputElement, HTMLInputElement],
      );
    } else {
      const inputElement = inputElements[0];
      if (inputElement === undefined)
        throw new Error("No input element attached to input.");
      if (inputElement.type === "checkbox") {
        obs[inputName] = makeBooleanObservable(inputElement);
      } else {
        obs[inputName] = makeNumberObservable(inputElement);
      }
    }
  }

  const fs0$: Observable<fl.FinancialSituation> = combineLatest([
    obs.isBuying,
    obs.housePrice,
    obs.cash,
    obs.salary,
    obs.rent,
    obs.mortgage,
    obs.buyingCosts,
    obs.firstTimeBuyer,
  ]).pipe(map((args) => fl.getInitialFinancialSituation(...args)));

  const financial_situations$: Observable<Array<Array<fl.FinancialSituation>>> =
    combineLatest([
      fs0$,
      obs.salaryGrowth,
      obs.rentGrowth,
      obs.isBuying,
      obs.inflation,
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
      obs.seed,
    ]).pipe(
      map(
        ([
          fs0,
          salaryGrowthDist,
          rentGrowthDist,
          isBuying,
          inflationDist,
          stockAppreciationRateDist,
          houseAppreciationRateDist,
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
          seed,
        ]) => {
          const samples: Array<Array<fl.FinancialSituation>> = [];

          const rootGenerator = makeRootGenerator(seed);
          for (let i = 0; i < numSamples; i++) {
            const inflationGen = makeGenerator(rootGenerator, inflationDist);
            const stockAppreciationRateGen = makeGenerator(
              rootGenerator,
              stockAppreciationRateDist,
            );
            const salaryGrowthGen = makeGenerator(
              rootGenerator,
              salaryGrowthDist,
            );
            const rentGrowthGen = makeGenerator(rootGenerator, rentGrowthDist);
            const houseAppreciationRateGen = makeGenerator(
              rootGenerator,
              houseAppreciationRateDist,
            );
            let history = [fs0];
            let lastFS = fs0;

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
              const nextFS = fl.getNextFinancialSituation(
                lastFS,
                inflationGen,
                salaryGrowthGen,
                rentGrowthGen,
                isBuying,
                stockAppreciationRateGen,
                houseAppreciationRateGen,
                mortgageInterestRate,
                mortgageMonthlyPayment,
                mortgageOverpay,
                groundRent,
                serviceChargeRate,
                homeInsurance,
                maintenanceRate,
              );
              history.push(nextFS);
              lastFS = nextFS;
            }
            samples.push(history);
          }
          return samples;
        },
      ),
      shareReplay(1),
    );

  createPlot(
    idNumber,
    canvas,
    financial_situations$,
    axisLimitsSubject,
    obs.correctInflation,
  );

  createFinalSummary(
    summaryValueSpans,
    financial_situations$,
    obs.correctInflation,
  );

  // Add the inputs of this scenario to the allInputsSubject, that is used to update the URL.
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

// The main function that sets everything up.
document.addEventListener("DOMContentLoaded", () => {
  // Only used for making sure all plots have the same axis limits.
  const axisLimitsSubject = new BehaviorSubject<MinMaxObject>({
    minY: {},
    maxY: {},
    minX: {},
    maxX: {},
  });

  // Used for keeping track of all input values from all scenarios, and setting
  // them in the URL.
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

  // Read the inputs from the URL, if any. Otherwise use hardcoded defaults. Then
  // create the scenarios set in that data.
  const inputsFromUrl = decodeInputsFromUrl();
  Object.entries(inputsFromUrl).forEach(([id, inputs]) => {
    makeScenario(parseInt(id), axisLimitsSubject, allInputsSubject, inputs);
  });

  // Write all inputs to the URL.
  allInputsSubject.subscribe((allInputs) => {
    const jsonString = JSON.stringify(allInputs);
    const encodedString = encodeURIComponent(jsonString);
    const newUrl = `${window.location.pathname}?inputs=${encodedString}`;
    window.history.replaceState(null, "", newUrl);
  });

  // Make the "What is this thing?" button and box work.
  const modal = document.getElementById("modal") as HTMLElement;
  const btn = document.getElementById("info-button") as HTMLElement;
  const span = document.getElementsByClassName("close")[0] as HTMLElement;

  btn.onclick = () => {
    modal.style.display = "block";
  };

  span.onclick = () => {
    modal.style.display = "none";
  };

  window.onclick = (event: MouseEvent) => {
    if (event.target == modal) {
      modal.style.display = "none";
    }
  };
});
