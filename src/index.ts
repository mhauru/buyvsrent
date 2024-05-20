import { fromEvent, Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';

// Get the input elements
const houseValue0Input: HTMLInputElement = document.getElementById("house_value_0") as HTMLInputElement;
const cash0Input: HTMLInputElement = document.getElementById("cash_0") as HTMLInputElement;
const interestRateInput: HTMLInputElement = document.getElementById("interest_rate") as HTMLInputElement;
const houseApprecationRateInput: HTMLInputElement = document.getElementById("house_appreciation_rate") as HTMLInputElement;

// Get the output element
const outputElement: HTMLElement = document.getElementById("output") as HTMLElement;

// Create streams from the input elements
const houseValue0$: Observable<number> = fromEvent(houseValue0Input, 'input').pipe(map(event => parseFloat((event.target as HTMLInputElement).value)));
const cash0$: Observable<number> = fromEvent(cash0Input, 'input').pipe(map(event => parseFloat((event.target as HTMLInputElement).value)));
const interestRate$: Observable<number> = fromEvent(interestRateInput, 'input').pipe(map(event => parseFloat((event.target as HTMLInputElement).value)));
const houseApprecationRate$: Observable<number> = fromEvent(houseApprecationRateInput, 'input').pipe(map(event => parseFloat((event.target as HTMLInputElement).value)));


// Combine the input streams and calculate the future value
const futureValue$: Observable<number> = combineLatest([houseValue0$, cash0$, interestRate$, houseApprecationRate$]).pipe(
  map(([houseValue0, cash0, interestRate, houseApprecationRate]) => {
    // This is a very simple calculation and might not accurately represent the future value of the investment
    // Replace with your own calculation as needed
    const years: number = 5; // For example, calculate the future value after 5 years
    const futureValueOfHouse: number = houseValue0 * Math.pow(1 + houseApprecationRate / 100, years);
    const futureValueOfCash: number = cash0 * Math.pow(1 + interestRate / 100, years);
    return futureValueOfHouse + futureValueOfCash;
  })
);

// Subscribe to the future value stream and update the output element
futureValue$.subscribe(futureValue => {
  outputElement.innerHTML = `Future value of investment: ${futureValue.toFixed(2)}`;
});
