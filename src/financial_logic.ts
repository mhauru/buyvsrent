const ISA_MAX_CONTRIBUTION = 20_000;
const CAPITAL_GAINS_ALLOWANCE = 3_000;
// TODO This only holds if you are in one of the >50k income tax brackets.
const CAPITAL_GAINS_RATE = 20;

export interface AnnualSummary {
  houseValue: number;
  cashValue: number;
  salary: number;
  rent: number;
  stockIsaValue: number;
  stockNonIsaValue: number;
  stockNonIsaValuePaid: number;
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

function getSalary(summary: AnnualSummary) {
  summary.cashValue += summary.salary * 12;
}

function getPayRaise(summary: AnnualSummary, salaryGrowth: number) {
  summary.salary *= 1 + salaryGrowth / 100;
}

function payRent(summary: AnnualSummary) {
  const annualRent = summary.rent * 12;
  summary.cashValue -= annualRent;
  summary.moneySpent += annualRent;
}

function raiseRent(summary: AnnualSummary, rentGrowth: number) {
  summary.rent *= 1 + rentGrowth / 100;
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
  summary.stockNonIsaValuePaid += nonIsaInvestment;
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
  summary.houseValue = NaN;
  summary.cashValue = NaN;
  summary.stockIsaValue = NaN;
  summary.stockNonIsaValue = NaN;
  summary.stockNonIsaValuePaid = NaN;
  summary.mortgageBalance = NaN;
  summary.moneySpent = NaN;
}

function checkSummary(summary: AnnualSummary) {
  if (summary.cashValue < 0) {
    goBankrupt(summary);
  }
}

export function getNextSummary(
  summary: AnnualSummary,
  salaryGrowth: number,
  rentGrowth: number,
  isBuying: boolean,
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
  getSalary(nextSummary);
  payMortgage(nextSummary, mortgageMonthlyPayment, mortgageInterestRate);
  payRunningHouseCosts(
    nextSummary,
    maintenanceRate,
    groundRent,
    serviceCharge,
    homeInsurance,
  );
  if (!isBuying) payRent(nextSummary);
  appreciateHouseValue(nextSummary, houseAppreciationRate);
  appreciateStockValue(nextSummary, stockAppreciationRate);
  getPayRaise(nextSummary, salaryGrowth);
  raiseRent(nextSummary, rentGrowth);
  investSurplusCashInStocks(nextSummary);
  checkSummary(nextSummary);
  nextSummary.yearNumber += 1;
  return nextSummary;
}

export function getInitialSummary(
  isBuying: boolean,
  houseValue0: number,
  cash0: number,
  salary: number,
  rent: number,
  mortgage0: number,
  buyingCosts: number,
  firstTimeBuyer: boolean,
) {
  const summary = {
    houseValue: 0,
    cashValue: cash0,
    salary: salary,
    rent: rent,
    stockIsaValue: 0,
    stockNonIsaValue: 0,
    stockNonIsaValuePaid: 0,
    mortgageBalance: 0,
    yearNumber: 0,
    moneySpent: 0,
  };
  if (isBuying)
    buyHouse(summary, houseValue0, mortgage0, buyingCosts, firstTimeBuyer);
  investSurplusCashInStocks(summary);
  checkSummary(summary);
  return summary;
}

export function computeCapitalGainsTax(summary: AnnualSummary) {
  const gain = summary.stockNonIsaValue - summary.stockNonIsaValuePaid;
  return (
    (Math.max(gain - CAPITAL_GAINS_ALLOWANCE, 0) * CAPITAL_GAINS_RATE) / 100
  );
}
