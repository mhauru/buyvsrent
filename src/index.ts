import { fromEvent, Observable, combineLatest } from "rxjs";
import { map, startWith } from "rxjs/operators";

// Get the output element
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

const houseValues$ = combineLatest([
  houseValue0$,
  houseAppreciationRate$,
  yearsToForecast$,
]).pipe(
  map(([houseValue0, houseAppreciationRate, yearsToForecast]) => {
    let houseValues = [houseValue0];
    for (let i = 1; i <= yearsToForecast; i++) {
      houseValues.push(
        houseValues[houseValues.length - 1] * houseAppreciationRate,
      );
    }
    return houseValues;
  }),
);

const mortgages$ = combineLatest([
  mortgage0$,
  mortgageInterestRate$,
  mortgageMonthlyPayment$,
  yearsToForecast$,
]).pipe(
  map(
    ([
      mortgage0,
      mortgageInterestRate,
      mortgageMonthlyPayment,
      yearsToForecast,
    ]: Array<number>) => {
      let mortgages = [mortgage0];
      let currentBalance = mortgage0;
      for (let i = 1; i <= yearsToForecast; i++) {
        const interest = (currentBalance * mortgageInterestRate) / 100; // Assuming the rate is annual
        currentBalance =
          currentBalance + interest - mortgageMonthlyPayment * 12;
        currentBalance = currentBalance > 0 ? currentBalance : 0; // If the balance goes negative, set it to 0
        mortgages.push(currentBalance);
      }
      return mortgages;
    },
  ),
);

// Combine the input streams and calculate the future value
const wealths$: Observable<Array<number>> = combineLatest([
  houseValues$,
  mortgages$,
]).pipe(
  map(([houseValues, mortgages]: Array<Array<number>>) => {
    return houseValues.map((item, index) => item - mortgages[index]);
  }),
);

// Subscribe to the future value stream and update the output element
wealths$.subscribe((wealths) => {
  outputElement.innerHTML = `Future value of investment: ${wealths}`;
});
