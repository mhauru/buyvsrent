import { fromEvent, Observable, combineLatest, BehaviorSubject } from "rxjs";
import { map, startWith } from "rxjs/operators";
import {
  AnnualSummary,
  getNextSummary,
  getInitialSummary,
} from "./financial_logic";
import { Inputs, PropertyInputs, createPropertyInputs } from "./ui";
import { MinMaxObject, createPlot } from "./plots";

const DEFAULT_HOUSE_VALUE = 500_000;
const DEFAULT_CASH = 300_000;
const DEFAULT_MORTGAGE = 215_000;
const DEFAULT_SALARY = 3_750;
const DEFAULT_RENT = 2000;
const DEFAULT_MORTGAGE_INTEREST_RATE = 5;
const DEFAULT_MORTGAGE_MONTHLY_PAYMENT = 2000;
const DEFAULT_HOUSE_APPRECIATION_RATE = 3;
const DEFAULT_STOCK_APPRECIATION_RATE = 6;
const DEFAULT_YEARS_TO_FORECAST = 25;
const DEFAULT_BUYING_COSTS = 2500;
const DEFAULT_FIRST_TIME_BUYER = true;
const DEFAULT_GROUND_RENT = 500;
const DEFAULT_SERVICE_CHARGE = 1800;
const DEFAULT_MAINTENANCE_RATE = 2;
const DEFAULT_HOME_INSURANCE = 300;

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

type InputsById = {
  [key: number]: Inputs;
};

const DEFAULT_INPUTS_BY_ID = {
  1: {
    isBuying: true,
    houseValue: DEFAULT_HOUSE_VALUE,
    cash: DEFAULT_CASH,
    mortgage: DEFAULT_MORTGAGE,
    salary: DEFAULT_SALARY,
    rent: DEFAULT_RENT,
    mortgageInterestRate: DEFAULT_MORTGAGE_INTEREST_RATE,
    mortgageMonthlyPayment: DEFAULT_MORTGAGE_MONTHLY_PAYMENT,
    stockAppreciationRate: DEFAULT_STOCK_APPRECIATION_RATE,
    houseAppreciationRate: DEFAULT_HOUSE_APPRECIATION_RATE,
    yearsToForecast: DEFAULT_YEARS_TO_FORECAST,
    buyingCosts: DEFAULT_BUYING_COSTS,
    firstTimeBuyer: DEFAULT_FIRST_TIME_BUYER,
    groundRent: DEFAULT_GROUND_RENT,
    serviceCharge: DEFAULT_SERVICE_CHARGE,
    maintenanceRate: DEFAULT_MAINTENANCE_RATE,
    homeInsurance: DEFAULT_HOME_INSURANCE,
  },
  2: {
    isBuying: false,
    houseValue: DEFAULT_HOUSE_VALUE,
    cash: DEFAULT_CASH,
    mortgage: DEFAULT_MORTGAGE,
    salary: DEFAULT_SALARY,
    rent: DEFAULT_RENT,
    mortgageInterestRate: DEFAULT_MORTGAGE_INTEREST_RATE,
    mortgageMonthlyPayment: DEFAULT_MORTGAGE_MONTHLY_PAYMENT,
    stockAppreciationRate: DEFAULT_STOCK_APPRECIATION_RATE,
    houseAppreciationRate: DEFAULT_HOUSE_APPRECIATION_RATE,
    yearsToForecast: DEFAULT_YEARS_TO_FORECAST,
    buyingCosts: DEFAULT_BUYING_COSTS,
    firstTimeBuyer: DEFAULT_FIRST_TIME_BUYER,
    groundRent: DEFAULT_GROUND_RENT,
    serviceCharge: DEFAULT_SERVICE_CHARGE,
    maintenanceRate: DEFAULT_MAINTENANCE_RATE,
    homeInsurance: DEFAULT_HOME_INSURANCE,
  },
};

function makeScenario(
  idNumber: number,
  axisLimitsSubject: BehaviorSubject<MinMaxObject>,
  allInputsSubject: BehaviorSubject<InputsById>,
  inputs: Inputs,
) {
  const propertyInputs = createPropertyInputs(idNumber, inputs);

  // Create streams from the input elements
  const isBuying$ = makeBooleanObservable(propertyInputs.isBuying);
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
    isBuying$,
    houseValue0$,
    cash0$,
    mortgage0$,
    buyingCosts$,
    firstTimeBuyer$,
  ]).pipe(
    map(
      ([isBuying, houseValue0, cash0, mortgage0, buyingCosts, firstTimeBuyer]: [
        boolean,
        number,
        number,
        number,
        number,
        boolean,
      ]) => {
        return getInitialSummary(
          isBuying,
          houseValue0,
          cash0,
          mortgage0,
          buyingCosts,
          firstTimeBuyer,
        );
      },
    ),
  );

  const summaries$: Observable<Array<AnnualSummary>> = combineLatest([
    summary0$,
    salary$,
    rent$,
    isBuying$,
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
        isBuying,
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
            isBuying,
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

  createPlot(idNumber, propertyInputs.canvas, summaries$, axisLimitsSubject);

  let currentAllInputs: InputsById;
  allInputsSubject.subscribe({
    next: (inputs: InputsById) => {
      currentAllInputs = inputs;
    },
  });

  combineLatest([
    isBuying$,
    houseValue0$,
    cash0$,
    mortgage0$,
    salary$,
    rent$,
    mortgageInterestRate$,
    mortgageMonthlyPayment$,
    stockAppreciationRate$,
    houseAppreciationRate$,
    yearsToForecast$,
    buyingCosts$,
    firstTimeBuyer$,
    groundRent$,
    serviceCharge$,
    maintenanceRate$,
    homeInsurance$,
  ]).subscribe(
    ([
      isBuying,
      houseValue0,
      cash0,
      mortgage0,
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
    ]) => {
      currentAllInputs[idNumber] = {
        isBuying: isBuying,
        houseValue: houseValue0,
        cash: cash0,
        mortgage: mortgage0,
        salary: salary,
        rent: rent,
        mortgageInterestRate: mortgageInterestRate,
        mortgageMonthlyPayment: mortgageMonthlyPayment,
        stockAppreciationRate: stockAppreciationRate,
        houseAppreciationRate: houseAppreciationRate,
        yearsToForecast: yearsToForecast,
        buyingCosts: buyingCosts,
        firstTimeBuyer: firstTimeBuyer,
        groundRent: groundRent,
        serviceCharge: serviceCharge,
        maintenanceRate: maintenanceRate,
        homeInsurance: homeInsurance,
      };
      allInputsSubject.next(currentAllInputs);
    },
  );
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
