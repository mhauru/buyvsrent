export interface PropertyInputs {
  isBuying: HTMLInputElement;
  houseValue: HTMLInputElement;
  cash: HTMLInputElement;
  mortgage: HTMLInputElement;
  salary: HTMLInputElement;
  rent: HTMLInputElement;
  mortgageInterestRate: HTMLInputElement;
  mortgageMonthlyPayment: HTMLInputElement;
  stockAppreciationRate: HTMLInputElement;
  houseAppreciationRate: HTMLInputElement;
  yearsToForecast: HTMLInputElement;
  buyingCosts: HTMLInputElement;
  firstTimeBuyer: HTMLInputElement;
  groundRent: HTMLInputElement;
  serviceCharge: HTMLInputElement;
  maintenanceRate: HTMLInputElement;
  homeInsurance: HTMLInputElement;
  canvas: HTMLCanvasElement;
}

export type Inputs = {
  isBuying: boolean;
  houseValue: number;
  cash: number;
  mortgage: number;
  salary: number;
  rent: number;
  mortgageInterestRate: number;
  mortgageMonthlyPayment: number;
  stockAppreciationRate: number;
  houseAppreciationRate: number;
  yearsToForecast: number;
  buyingCosts: number;
  firstTimeBuyer: boolean;
  groundRent: number;
  serviceCharge: number;
  maintenanceRate: number;
  homeInsurance: number;
};

function createLabelElement(forId: string, text: string): HTMLLabelElement {
  const label = document.createElement("label");
  label.htmlFor = forId;
  label.innerText = text;
  label.classList.add("input-label");
  return label;
}

function createInputElement(
  id: string,
  idSuffix: number,
  type: string,
  value: string | number | boolean,
  step: string | number,
): HTMLInputElement {
  const input = document.createElement("input");
  input.id = `${id}_${idSuffix}`;
  input.type = type;
  if (type == "checkbox" && typeof value === "boolean") {
    input.checked = value;
  } else {
    input.value = value.toString();
  }
  input.step = step.toString();
  input.classList.add("input-field");
  return input;
}

function createInputDiv(
  id: string,
  idSuffix: number,
  type: string,
  value: string | number | boolean,
  step: string | number,
  label: string,
): [HTMLInputElement, HTMLDivElement] {
  const inputElement = createInputElement(id, idSuffix, type, value, step);
  const labelElement = createLabelElement(inputElement.id, label);
  const div = document.createElement("div");
  div.appendChild(labelElement);
  div.appendChild(inputElement);
  div.classList.add("input-div");
  return [inputElement, div];
}

function createGroup(subdivs: Array<HTMLDivElement>): HTMLDivElement {
  const div = document.createElement("div");
  subdivs.forEach((sd) => div.appendChild(sd));
  div.classList.add("input-group");
  return div;
}

function createCanvasDivElement(id: string, idSuffix: number): HTMLDivElement {
  const div = document.createElement("div");
  div.id = `${id}_${idSuffix}`;
  div.classList.add("canvas-container");
  return div;
}

function createCanvasElement(id: string, idSuffix: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.id = `${id}_${idSuffix}`;
  canvas.classList.add("output-canvas");
  return canvas;
}

export function createPropertyInputs(
  idSuffix: number,
  inputs: Inputs,
): PropertyInputs {
  const [isBuying, isBuyingDiv] = createInputDiv(
    "is_buying",
    idSuffix,
    "checkbox",
    inputs.isBuying,
    1000,
    "Buying instead of renting",
  );
  const [houseValue, houseValueDiv] = createInputDiv(
    "house_value",
    idSuffix,
    "number",
    inputs.houseValue,
    1000,
    "House value at purchase",
  );
  const [cash, cashDiv] = createInputDiv(
    "cash",
    idSuffix,
    "number",
    inputs.cash,
    1000,
    "Cash at purchase",
  );
  const [mortgage, mortgageDiv] = createInputDiv(
    "mortgage",
    idSuffix,
    "number",
    inputs.mortgage,
    1000,
    "Initial mortgage",
  );
  const [salary, salaryDiv] = createInputDiv(
    "salary",
    idSuffix,
    "number",
    inputs.salary,
    100,
    "Net annual salary",
  );
  const [rent, rentDiv] = createInputDiv(
    "rent",
    idSuffix,
    "number",
    inputs.rent,
    100,
    "Monthly rent",
  );
  const [mortgageInterestRate, mortgageInterestRateDiv] = createInputDiv(
    "mortgage_interest_rate",
    idSuffix,
    "number",
    inputs.mortgageInterestRate,
    0.1,
    "Mortgage interest rate (%), annual",
  );
  const [mortgageMonthlyPayment, mortgageMonthlyPaymentDiv] = createInputDiv(
    "mortgage_monthly_payment",
    idSuffix,
    "number",
    inputs.mortgageMonthlyPayment,
    100,
    "Mortgage payment, monthly",
  );
  const [stockAppreciationRate, stockAppreciationRateDiv] = createInputDiv(
    "stock_appreciation_rate",
    idSuffix,
    "number",
    inputs.stockAppreciationRate,
    0.1,
    "Stock value appreciation (%), annual",
  );
  const [houseAppreciationRate, houseAppreciationRateDiv] = createInputDiv(
    "house_appreciation_rate",
    idSuffix,
    "number",
    inputs.houseAppreciationRate,
    0.1,
    "House price appreciation (%), annual",
  );
  const [yearsToForecast, yearsToForecastDiv] = createInputDiv(
    "years_to_forecast",
    idSuffix,
    "number",
    inputs.yearsToForecast,
    1,
    "Years to forecast",
  );
  const [buyingCosts, buyingCostsDiv] = createInputDiv(
    "buying_costs",
    idSuffix,
    "number",
    inputs.buyingCosts,
    100,
    "Buying costs (survey, conveyancing fee, etc.)",
  );
  const [firstTimeBuyer, firstTimeBuyerDiv] = createInputDiv(
    "first_time_buyer",
    idSuffix,
    "checkbox",
    inputs.firstTimeBuyer,
    "",
    "First time buyer",
  );
  const [groundRent, groundRentDiv] = createInputDiv(
    "ground_rent",
    idSuffix,
    "number",
    inputs.groundRent,
    50,
    "Ground rent, annual",
  );
  const [serviceCharge, serviceChargeDiv] = createInputDiv(
    "service_charge",
    idSuffix,
    "number",
    inputs.serviceCharge,
    100,
    "Service charge, annual",
  );
  const [maintenanceRate, maintenanceRateDiv] = createInputDiv(
    "maintenance_rate",
    idSuffix,
    "number",
    inputs.maintenanceRate,
    0.1,
    "Maintenance costs, % of value, annual",
  );
  const [homeInsurance, homeInsuranceDiv] = createInputDiv(
    "home_insurance",
    idSuffix,
    "number",
    inputs.homeInsurance,
    50,
    "Home insurance, annual",
  );

  const groups = [
    createGroup([isBuyingDiv, cashDiv, salaryDiv, yearsToForecastDiv]),
    createGroup([houseValueDiv, buyingCostsDiv, firstTimeBuyerDiv]),
    createGroup([
      mortgageDiv,
      mortgageInterestRateDiv,
      mortgageMonthlyPaymentDiv,
    ]),
    createGroup([
      groundRentDiv,
      serviceChargeDiv,
      maintenanceRateDiv,
      homeInsuranceDiv,
    ]),
    createGroup([rentDiv]),
    createGroup([houseAppreciationRateDiv, stockAppreciationRateDiv]),
  ];

  const canvasDiv = createCanvasDivElement("canvas_div", idSuffix);
  const canvas = createCanvasElement("canvas", idSuffix);
  canvasDiv.appendChild(canvas);

  const inputsDiv = document.createElement("div");
  inputsDiv.classList.add("inputs-div");
  groups.forEach((element) => inputsDiv.appendChild(element));

  const wrapperDiv = document.createElement("div");
  wrapperDiv.classList.add("property-wrapper");
  wrapperDiv.appendChild(canvasDiv);
  wrapperDiv.appendChild(inputsDiv);

  document.body.appendChild(wrapperDiv);

  return {
    isBuying,
    houseValue,
    cash,
    mortgage,
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
    canvas,
  };
}
