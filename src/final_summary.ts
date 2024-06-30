// Setting the values in the Final summary section.
import { Observable, combineLatest } from "rxjs";
import * as fl from "./financial_logic";
import { median } from "mathjs";
import { SummaryValueSpans } from "./ui";

function numberToStringPretty(value: number) {
  return Math.round(value).toLocaleString();
}

export function createFinalSummary(
  summaryValueSpans: SummaryValueSpans,
  summaries$: Observable<fl.FinancialSituation[][]>,
  correctInflationObs: Observable<boolean>,
) {
  combineLatest([summaries$, correctInflationObs]).subscribe(
    ([summaries, correctInflation]) => {
      const lastSummaries = summaries.map(
        (history) => history[history.length - 1],
      );
      const postTaxWealth = median(
        lastSummaries.map((s) => {
          return fl.postTaxWealth(s, correctInflation);
        }),
      );
      summaryValueSpans.houseValue.innerHTML = numberToStringPretty(
        median(lastSummaries.map((s) => fl.houseValue(s, correctInflation))),
      );
      summaryValueSpans.salary.innerHTML = numberToStringPretty(
        median(lastSummaries.map((s) => fl.salary(s, correctInflation))),
      );
      summaryValueSpans.wealth.innerHTML = numberToStringPretty(postTaxWealth);
      summaryValueSpans.rent.innerHTML = numberToStringPretty(
        median(lastSummaries.map((s) => fl.rent(s, correctInflation))),
      );
      summaryValueSpans.stockIsaValue.innerHTML = numberToStringPretty(
        median(lastSummaries.map((s) => fl.stockIsaValue(s, correctInflation))),
      );
      summaryValueSpans.stockNonIsaValue.innerHTML = numberToStringPretty(
        median(
          lastSummaries.map((s) => fl.stockNonIsaValue(s, correctInflation)),
        ),
      );
    },
  );
}
