import { fromEvent, Observable, combineLatest, BehaviorSubject } from "rxjs";
import { map, startWith } from "rxjs/operators";
import {
  AnnualSummary,
  getNextSummary,
  getInitialSummary,
} from "./financial_logic";
import { Inputs, PropertyInputs, createPropertyInputs } from "./ui";
import { MinMaxObject, createPlot } from "./plots";

const DEFAULT_HOUSE_PRICE = 500_000;
const DEFAULT_CASH = 310_000;
const DEFAULT_MORTGAGE = 200_000;
const DEFAULT_SALARY = 2_500;
const DEFAULT_SALARY_GROWTH = 7;
// The average gross rental yield, i.e. annual rent divided by house price, is around
// 4.5% in London.
// Source: https://www.trackcapital.co.uk/news-articles/uk-buy-to-let-yield-map/
const DEFAULT_RENT = (DEFAULT_HOUSE_PRICE * 0.045) / 12;
// These are numbers I got from a Nationwide calculator for 500k house with 200k mortgage
// on 2024-06-09, rounded a bit.
const DEFAULT_MORTGAGE_STAGE1_LENGTH = 2;
const DEFAULT_MORTGAGE_INTEREST_RATE_STAGE1 = 6.14;
const DEFAULT_MORTGAGE_MONTHLY_PAYMENT_STAGE1 = 1450;
const DEFAULT_MORTGAGE_INTEREST_RATE_STAGE2 = 7.99;
const DEFAULT_MORTGAGE_MONTHLY_PAYMENT_STAGE2 = 1650;
const DEFAULT_MORTGAGE_OVERPAY = true;
// House prices in London grew on average 4.4% between Jan 2005 and Jan 2024.
// Source: https://www.ons.gov.uk/economy/inflationandpriceindices/bulletins/housepriceindex/latest
const DEFAULT_HOUSE_APPRECIATION_RATE = 4.4;
// Often quoted numbers for historical stock price growth are 6% and 7% over inflation.
// CPIH grew by 2.9% annualised between January 2005 and Jan 2024.
// Source: https://www.ons.gov.uk/economy/inflationandpriceindices/timeseries/l522/mm23
// BoE target is 2% inflation.
const DEFAULT_STOCK_APPRECIATION_RATE = 9;
// Rents are assumed to grow at the same rate as house prices. See above for house prices.
const DEFAULT_RENT_GROWTH = DEFAULT_HOUSE_APPRECIATION_RATE;
const DEFAULT_YEARS_TO_FORECAST = 20;
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
    houseValue: DEFAULT_HOUSE_PRICE,
    cash: DEFAULT_CASH,
    mortgage: DEFAULT_MORTGAGE,
    salary: DEFAULT_SALARY,
    salaryGrowth: DEFAULT_SALARY_GROWTH,
    rent: DEFAULT_RENT,
    rentGrowth: DEFAULT_RENT_GROWTH,
    mortgageStage1Length: DEFAULT_MORTGAGE_STAGE1_LENGTH,
    mortgageInterestRateStage1: DEFAULT_MORTGAGE_INTEREST_RATE_STAGE1,
    mortgageMonthlyPaymentStage1: DEFAULT_MORTGAGE_MONTHLY_PAYMENT_STAGE1,
    mortgageInterestRateStage2: DEFAULT_MORTGAGE_INTEREST_RATE_STAGE2,
    mortgageMonthlyPaymentStage2: DEFAULT_MORTGAGE_MONTHLY_PAYMENT_STAGE2,
    mortgageOverpay: DEFAULT_MORTGAGE_OVERPAY,
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
    houseValue: DEFAULT_HOUSE_PRICE,
    cash: DEFAULT_CASH,
    mortgage: DEFAULT_MORTGAGE,
    salary: DEFAULT_SALARY,
    salaryGrowth: DEFAULT_SALARY_GROWTH,
    rent: DEFAULT_RENT,
    rentGrowth: DEFAULT_RENT_GROWTH,
    mortgageStage1Length: DEFAULT_MORTGAGE_STAGE1_LENGTH,
    mortgageInterestRateStage1: DEFAULT_MORTGAGE_INTEREST_RATE_STAGE1,
    mortgageMonthlyPaymentStage1: DEFAULT_MORTGAGE_MONTHLY_PAYMENT_STAGE1,
    mortgageInterestRateStage2: DEFAULT_MORTGAGE_INTEREST_RATE_STAGE2,
    mortgageMonthlyPaymentStage2: DEFAULT_MORTGAGE_MONTHLY_PAYMENT_STAGE2,
    mortgageOverpay: DEFAULT_MORTGAGE_OVERPAY,
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
  const salaryGrowth$ = makeNumberObservable(propertyInputs.salaryGrowth);
  const rent$ = makeNumberObservable(propertyInputs.rent);
  const rentGrowth$ = makeNumberObservable(propertyInputs.rentGrowth);
  const mortgageStage1Length$ = makeNumberObservable(
    propertyInputs.mortgageStage1Length,
  );
  const mortgageMonthlyPaymentStage1$ = makeNumberObservable(
    propertyInputs.mortgageMonthlyPaymentStage1,
  );
  const mortgageInterestRateStage1$ = makeNumberObservable(
    propertyInputs.mortgageInterestRateStage1,
  );
  const mortgageMonthlyPaymentStage2$ = makeNumberObservable(
    propertyInputs.mortgageMonthlyPaymentStage2,
  );
  const mortgageInterestRateStage2$ = makeNumberObservable(
    propertyInputs.mortgageInterestRateStage2,
  );
  const mortgageOverpay$ = makeBooleanObservable(
    propertyInputs.mortgageOverpay,
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
    salary$,
    rent$,
    mortgage0$,
    buyingCosts$,
    firstTimeBuyer$,
  ]).pipe(
    map(
      ([
        isBuying,
        houseValue0,
        cash0,
        salary,
        rent,
        mortgage0,
        buyingCosts,
        firstTimeBuyer,
      ]: [
        boolean,
        number,
        number,
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
          salary,
          rent,
          mortgage0,
          buyingCosts,
          firstTimeBuyer,
        );
      },
    ),
  );

  const summaries$: Observable<Array<AnnualSummary>> = combineLatest([
    summary0$,
    salaryGrowth$,
    rentGrowth$,
    isBuying$,
    stockAppreciationRate$,
    houseAppreciationRate$,
    mortgageStage1Length$,
    mortgageInterestRateStage1$,
    mortgageMonthlyPaymentStage1$,
    mortgageInterestRateStage2$,
    mortgageMonthlyPaymentStage2$,
    mortgageOverpay$,
    yearsToForecast$,
    groundRent$,
    serviceCharge$,
    homeInsurance$,
    maintenanceRate$,
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
        serviceCharge,
        homeInsurance,
        maintenanceRate,
      ]) => {
        const summaries = [summary0];
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
    salaryGrowth$,
    rent$,
    rentGrowth$,
    mortgageStage1Length$,
    mortgageInterestRateStage1$,
    mortgageMonthlyPaymentStage1$,
    mortgageInterestRateStage2$,
    mortgageMonthlyPaymentStage2$,
    mortgageOverpay$,
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
      salaryGrowth,
      rent,
      rentGrowth,
      mortgageStage1Length,
      mortgageInterestRateStage1,
      mortgageMonthlyPaymentStage1,
      mortgageInterestRateStage2,
      mortgageMonthlyPaymentStage2,
      mortgageOverpay,
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
        salaryGrowth: salaryGrowth,
        rent: rent,
        rentGrowth: rentGrowth,
        mortgageStage1Length: mortgageStage1Length,
        mortgageInterestRateStage1: mortgageInterestRateStage1,
        mortgageMonthlyPaymentStage1: mortgageMonthlyPaymentStage1,
        mortgageInterestRateStage2: mortgageInterestRateStage2,
        mortgageMonthlyPaymentStage2: mortgageMonthlyPaymentStage2,
        mortgageOverpay: mortgageOverpay,
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
