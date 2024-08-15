// All logic related to keeping track of one's financial situation and updating
// it over time.
import { RandomGenerator } from "./random_variables";

const ISA_MAX_CONTRIBUTION = 20_000;
const CAPITAL_GAINS_ALLOWANCE = 3_000;
// TODO This only holds if you are in one of the >50k income tax brackets.
const CAPITAL_GAINS_RATE = 20;

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
  fs: FinancialSituation,
  houseAppreciationRate: number,
) {
  fs.houseValue *= houseAppreciationRate;
}

function appreciateStockValue(
  fs: FinancialSituation,
  stockAppreciationRate: number,
) {
  fs.stockIsaValue *= stockAppreciationRate;
  fs.stockNonIsaValue *= stockAppreciationRate;
}

function getSalary(fs: FinancialSituation) {
  fs.cashValue += fs.salary * 12;
}

function getPayRaise(fs: FinancialSituation, salaryGrowth: number) {
  fs.salary *= salaryGrowth;
}

function payRent(fs: FinancialSituation) {
  const annualRent = fs.rent * 12;
  fs.cashValue -= annualRent;
  fs.moneySpent += annualRent;
}

function raiseRent(fs: FinancialSituation, rentGrowth: number) {
  fs.rent *= rentGrowth;
}

function payMortgage(
  fs: FinancialSituation,
  mortgageMonthlyPayment: number,
  mortgageInterestRate: number,
) {
  const interest = (fs.mortgageBalance * mortgageInterestRate) / 100.0;
  let mortgageAnnualPayment = mortgageMonthlyPayment * 12;
  let principalReduction = mortgageAnnualPayment - interest;
  if (principalReduction > fs.mortgageBalance) {
    principalReduction = fs.mortgageBalance;
    mortgageAnnualPayment = principalReduction + interest;
  }
  fs.mortgageBalance -= principalReduction;
  fs.cashValue -= mortgageAnnualPayment;
  fs.moneySpent += interest;
}

function payRunningHouseCosts(
  fs: FinancialSituation,
  maintenanceRate: number,
  groundRent: number,
  serviceChargeRate: number,
  homeInsurance: number,
) {
  const serviceCharge = (fs.houseValue * serviceChargeRate) / 100.0;
  const maintenance = (fs.houseValue * maintenanceRate) / 100.0;
  const totalOutgoings =
    maintenance + groundRent + serviceCharge + homeInsurance;
  fs.cashValue -= totalOutgoings;
  fs.moneySpent += totalOutgoings;
}

function overpayMortgage(fs: FinancialSituation) {
  if (fs.cashValue < 0) return;
  const overpayment = Math.min(fs.cashValue, fs.mortgageBalance);
  fs.cashValue -= overpayment;
  fs.mortgageBalance -= overpayment;
}

function investSurplusCashInStocks(fs: FinancialSituation) {
  if (fs.cashValue < 0) return;
  const isaInvestment = Math.min(fs.cashValue, ISA_MAX_CONTRIBUTION);
  const nonIsaInvestment = fs.cashValue - isaInvestment;
  fs.cashValue -= isaInvestment + nonIsaInvestment;
  fs.stockIsaValue += isaInvestment;
  fs.stockNonIsaValue += nonIsaInvestment;
  fs.stockNonIsaValuePaid += nonIsaInvestment;
}

function liquidateStocks(fs: FinancialSituation) {
  // First try to sell enough from non-ISA to cover the cash needs, and get the
  // cash balance to be positive again.
  const nonIsaToSell = Math.min(fs.stockNonIsaValue, -fs.cashValue);
  const fractionNonIsaToSell =
    fs.stockNonIsaValue > 0 ? nonIsaToSell / fs.stockNonIsaValue : 0;
  const deduction = fs.stockNonIsaValuePaid * fractionNonIsaToSell;
  const gain = nonIsaToSell - deduction;
  // TODO We do a silly thing here, where we plan to sell enough stock to cover
  // our cash needs without accounting for capital gains tax. Once you _do_
  // account for it, your cash balance ends up a bit in the negative still.
  // This isn't trivial to fix though, and I'm lazy to do though, because I
  // suspect this won't happen much.
  const tax =
    (Math.max(gain - CAPITAL_GAINS_ALLOWANCE, 0) * CAPITAL_GAINS_RATE) / 100;
  fs.cashValue += nonIsaToSell;
  fs.cashValue -= tax;
  fs.stockNonIsaValue -= nonIsaToSell;
  fs.stockNonIsaValuePaid -= deduction;

  // Then sell from ISA if necessary.
  const isaToSell = Math.min(fs.stockIsaValue, -fs.cashValue);
  fs.cashValue += isaToSell;
  fs.stockIsaValue -= isaToSell;
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
    const threshold = thresholds[i];
    const nextThreshold = thresholds[i + 1];
    const rate = rates[i];
    if (
      threshold === undefined ||
      nextThreshold === undefined ||
      rate === undefined
    )
      throw new Error(
        "Error indexing the thresholds and rates in computeStampDuty",
      );
    if (housePrice <= threshold) break;
    stampDuty += (Math.min(housePrice, nextThreshold) - threshold) * rate;
  }
  return stampDuty;
}

function buyHouse(
  fs: FinancialSituation,
  housePrice: number,
  mortgage: number,
  buyingCosts: number,
  firstTimeBuyer: boolean,
) {
  const stampDuty = computeStampDuty(housePrice, firstTimeBuyer);
  const cashPurchasePart = housePrice - mortgage;
  const cashNeeded = stampDuty + buyingCosts + cashPurchasePart;
  if (cashNeeded > fs.cashValue) {
    goBankrupt(fs);
  } else {
    fs.cashValue -= cashNeeded;
    fs.mortgageBalance += mortgage;
    fs.moneySpent += stampDuty + buyingCosts;
    fs.houseValue += housePrice;
    fs.rent = 0;
  }
}

function goBankrupt(fs: FinancialSituation) {
  fs.houseValue = 0;
  fs.cashValue = 0;
  fs.stockIsaValue = 0;
  fs.stockNonIsaValue = 0;
  fs.stockNonIsaValuePaid = 0;
  fs.mortgageBalance = 0;
  fs.moneySpent = 0;
  fs.salary = 0;
  fs.stockNonIsaValuePaid = 0;
  fs.rent = 0;
}

function checkFinancialSituation(fs: FinancialSituation) {
  // -1, because we want to allow a bit of rounding error. If you go -1 unit
  // of money in the negative, just borrow from your mum or something.
  if (fs.cashValue < -1) {
    goBankrupt(fs);
  }
}

export function getNextFinancialSituation(
  fs: FinancialSituation,
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
  const nextFS = { ...fs };
  // Generate random values for this year
  const inflation = inflationGen();
  const salaryGrowth = inflation * salaryGrowthGen();
  const stockAppreciationRate = inflation * stockAppreciationRateGen();
  const houseAppreciationRate = inflation * houseAppreciationRateGen();
  const rentGrowth = houseAppreciationRate * rentGrowthGen();
  // Expenses and income
  getSalary(nextFS);
  payMortgage(nextFS, mortgageMonthlyPayment, mortgageInterestRate);
  payRunningHouseCosts(
    nextFS,
    maintenanceRate,
    groundRent,
    serviceChargeRate,
    homeInsurance,
  );
  if (!isBuying) payRent(nextFS);
  // Changes
  appreciateHouseValue(nextFS, houseAppreciationRate);
  appreciateStockValue(nextFS, stockAppreciationRate);
  getPayRaise(nextFS, salaryGrowth);
  raiseRent(nextFS, rentGrowth);
  // What to do with any money left over.
  if (mortgageOverpay) overpayMortgage(nextFS);
  investSurplusCashInStocks(nextFS);
  // What to do if out of cash.
  if (nextFS.cashValue < 0) {
    liquidateStocks(nextFS);
  }
  // Clean-up
  checkFinancialSituation(nextFS);
  nextFS.cumulativeInflation *= inflation;
  nextFS.yearNumber += 1;
  return nextFS;
}

export function getInitialFinancialSituation(
  isBuying: boolean,
  housePrice: number,
  cash0: number,
  salary: number,
  rent: number,
  mortgage0: number,
  buyingCosts: number,
  firstTimeBuyer: boolean,
) {
  const fs = {
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
    buyHouse(fs, housePrice, mortgage0, buyingCosts, firstTimeBuyer);
  investSurplusCashInStocks(fs);
  checkFinancialSituation(fs);
  return fs;
}

function computeCapitalGainsTax(fs: FinancialSituation) {
  const gain = fs.stockNonIsaValue - fs.stockNonIsaValuePaid;
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
