const ISA_MAX_CONTRIBUTION = 20_000;
const CAPITAL_GAINS_ALLOWANCE = 3_000;
// TODO This only holds if you are in one of the >50k income tax brackets.
const CAPITAL_GAINS_RATE = 20;

export type RandomGenerator = () => number;

export type FinancialSituation = {
  houseValue: number;
  cashValue: number;
  salary: number;
  rent: number;
  stockIsaValue: number;
  stockNonIsaValue: number;
  stockNonIsaValuePaid: number;
  mortgageBalance: number;
  moneySpent: number;
  cumulativeInflation: number;
  yearNumber: number;
};

function appreciateHouseValue(
  summary: FinancialSituation,
  houseAppreciationRate: number,
) {
  summary.houseValue *= 1 + houseAppreciationRate / 100.0;
}

function appreciateStockValue(
  summary: FinancialSituation,
  stockAppreciationRate: number,
) {
  summary.stockIsaValue *= 1 + stockAppreciationRate / 100.0;
  summary.stockNonIsaValue *= 1 + stockAppreciationRate / 100.0;
}

function getSalary(summary: FinancialSituation) {
  summary.cashValue += summary.salary * 12;
}

function getPayRaise(summary: FinancialSituation, salaryGrowth: number) {
  summary.salary *= 1 + salaryGrowth / 100;
}

function payRent(summary: FinancialSituation) {
  const annualRent = summary.rent * 12;
  summary.cashValue -= annualRent;
  summary.moneySpent += annualRent;
}

function raiseRent(summary: FinancialSituation, rentGrowth: number) {
  summary.rent *= 1 + rentGrowth / 100;
}

function payMortgage(
  summary: FinancialSituation,
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
  summary: FinancialSituation,
  maintenanceRate: number,
  groundRent: number,
  serviceChargeRate: number,
  homeInsurance: number,
) {
  const serviceCharge = (summary.houseValue * serviceChargeRate) / 100.0;
  const maintenance = (summary.houseValue * maintenanceRate) / 100.0;
  const totalOutgoings =
    maintenance + groundRent + serviceCharge + homeInsurance;
  summary.cashValue -= totalOutgoings;
  summary.moneySpent += totalOutgoings;
}

function overpayMortgage(summary: FinancialSituation) {
  if (summary.cashValue < 0) return;
  const overpayment = Math.min(summary.cashValue, summary.mortgageBalance);
  summary.cashValue -= overpayment;
  summary.mortgageBalance -= overpayment;
}

function investSurplusCashInStocks(summary: FinancialSituation) {
  if (summary.cashValue < 0) return;
  const isaInvestment = Math.min(summary.cashValue, ISA_MAX_CONTRIBUTION);
  const nonIsaInvestment = summary.cashValue - isaInvestment;
  summary.cashValue -= isaInvestment + nonIsaInvestment;
  summary.stockIsaValue += isaInvestment;
  summary.stockNonIsaValue += nonIsaInvestment;
  summary.stockNonIsaValuePaid += nonIsaInvestment;
}

function computeStampDuty(housePrice: number, firstTimeBuyer: boolean): number {
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
    if (housePrice <= thresholds[i]) break;
    stampDuty +=
      (Math.min(housePrice, thresholds[i + 1]) - thresholds[i]) * rates[i];
  }
  return stampDuty;
}

function buyHouse(
  summary: FinancialSituation,
  housePrice: number,
  mortgage: number,
  buyingCosts: number,
  firstTimeBuyer: boolean,
) {
  const stampDuty = computeStampDuty(housePrice, firstTimeBuyer);
  const cashPurchasePart = housePrice - mortgage;
  const cashNeeded = stampDuty + buyingCosts + cashPurchasePart;
  if (cashNeeded > summary.cashValue) {
    goBankrupt(summary);
  } else {
    summary.cashValue -= cashNeeded;
    summary.mortgageBalance += mortgage;
    summary.moneySpent += stampDuty + buyingCosts;
    summary.houseValue += housePrice;
    summary.rent = 0;
  }
}

function goBankrupt(summary: FinancialSituation) {
  summary.houseValue = 0;
  summary.cashValue = 0;
  summary.stockIsaValue = 0;
  summary.stockNonIsaValue = 0;
  summary.stockNonIsaValuePaid = 0;
  summary.mortgageBalance = 0;
  summary.moneySpent = 0;
  summary.salary = 0;
  summary.stockNonIsaValuePaid = 0;
  summary.rent = 0;
}

function checkSummary(summary: FinancialSituation) {
  if (summary.cashValue < 0) {
    goBankrupt(summary);
  }
}

export function getNextSummary(
  summary: FinancialSituation,
  inflationGen: RandomGenerator,
  salaryGrowthGen: RandomGenerator,
  rentGrowthGen: RandomGenerator,
  isBuying: boolean,
  stockAppreciationRateGen: RandomGenerator,
  houseAppreciationRateGen: RandomGenerator,
  mortgageInterestRate: number,
  mortgageMonthlyPayment: number,
  mortgageOverpay: boolean,
  groundRent: number,
  serviceChargeRate: number,
  homeInsurance: number,
  maintenanceRate: number,
): FinancialSituation {
  const nextSummary = { ...summary };
  // Generate random values for this year
  const inflation = inflationGen();
  const salaryGrowth = inflation + salaryGrowthGen();
  const stockAppreciationRate = inflation + stockAppreciationRateGen();
  const houseAppreciationRate = inflation + houseAppreciationRateGen();
  const rentGrowth = inflation + rentGrowthGen();
  // Expenses and income
  getSalary(nextSummary);
  payMortgage(nextSummary, mortgageMonthlyPayment, mortgageInterestRate);
  payRunningHouseCosts(
    nextSummary,
    maintenanceRate,
    groundRent,
    serviceChargeRate,
    homeInsurance,
  );
  if (!isBuying) payRent(nextSummary);
  // Changes
  appreciateHouseValue(nextSummary, houseAppreciationRate);
  appreciateStockValue(nextSummary, stockAppreciationRate);
  getPayRaise(nextSummary, salaryGrowth);
  raiseRent(nextSummary, rentGrowth);
  // What to do with any money left over.
  if (mortgageOverpay) overpayMortgage(nextSummary);
  investSurplusCashInStocks(nextSummary);
  // Clean-up
  checkSummary(nextSummary);
  nextSummary.cumulativeInflation *= 1 + inflation / 100;
  nextSummary.yearNumber += 1;
  return nextSummary;
}

export function getInitialSummary(
  isBuying: boolean,
  housePrice: number,
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
    cumulativeInflation: 1.0,
    yearNumber: 0,
    moneySpent: 0,
  };
  if (isBuying)
    buyHouse(summary, housePrice, mortgage0, buyingCosts, firstTimeBuyer);
  investSurplusCashInStocks(summary);
  checkSummary(summary);
  return summary;
}

function computeCapitalGainsTax(summary: FinancialSituation) {
  const gain = summary.stockNonIsaValue - summary.stockNonIsaValuePaid;
  return (
    (Math.max(gain - CAPITAL_GAINS_ALLOWANCE, 0) * CAPITAL_GAINS_RATE) / 100
  );
}

export function mortgageBalance(
  s: FinancialSituation,
  correctInflation: boolean = false,
): number {
  let value = s.mortgageBalance;
  if (correctInflation) value /= s.cumulativeInflation;
  return value;
}

export function moneySpent(
  s: FinancialSituation,
  correctInflation: boolean = false,
): number {
  let value = s.moneySpent;
  if (correctInflation) value /= s.cumulativeInflation;
  return value;
}

export function salary(
  s: FinancialSituation,
  correctInflation: boolean = false,
): number {
  let value = s.salary;
  if (correctInflation) value /= s.cumulativeInflation;
  return value;
}

export function rent(
  s: FinancialSituation,
  correctInflation: boolean = false,
): number {
  let value = s.rent;
  if (correctInflation) value /= s.cumulativeInflation;
  return value;
}

export function cashValue(
  s: FinancialSituation,
  correctInflation: boolean = false,
): number {
  let value = s.cashValue;
  if (correctInflation) value /= s.cumulativeInflation;
  return value;
}

export function houseValue(
  s: FinancialSituation,
  correctInflation: boolean = false,
): number {
  let value = s.houseValue;
  if (correctInflation) value /= s.cumulativeInflation;
  return value;
}

export function stockIsaValue(
  s: FinancialSituation,
  correctInflation: boolean = false,
): number {
  let value = s.stockIsaValue;
  if (correctInflation) value /= s.cumulativeInflation;
  return value;
}

export function stockNonIsaValue(
  s: FinancialSituation,
  correctInflation: boolean = false,
): number {
  let value = s.stockNonIsaValue;
  if (correctInflation) value /= s.cumulativeInflation;
  return value;
}

export function postTaxStocksValue(
  s: FinancialSituation,
  correctInflation: boolean = false,
): number {
  let value = s.stockIsaValue + s.stockNonIsaValue - computeCapitalGainsTax(s);
  if (correctInflation) value /= s.cumulativeInflation;
  return value;
}

export function postTaxWealth(
  s: FinancialSituation,
  correctInflation: boolean = false,
): number {
  let value =
    s.houseValue +
    s.cashValue +
    s.stockIsaValue +
    s.stockNonIsaValue -
    s.mortgageBalance -
    computeCapitalGainsTax(s);
  if (correctInflation) value /= s.cumulativeInflation;
  return value;
}

export function summaryOutputs(summary: FinancialSituation) {}
