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

const createLabelElement = (forId: string, text: string): HTMLLabelElement => {
  const label = document.createElement("label");
  label.htmlFor = forId;
  label.innerText = text;
  label.classList.add("input-label");
  return label;
};

const createInputElement = (
  id: string,
  idSuffix: number,
  type: string,
  value: string | number | boolean,
  step: string | number,
): HTMLInputElement => {
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
};

const createParagraphElement = (
  label: HTMLLabelElement,
  input: HTMLInputElement,
): HTMLParagraphElement => {
  const p = document.createElement("p");
  p.appendChild(label);
  p.appendChild(input);
  p.classList.add("input-group");
  return p;
};

const createCanvasDivElement = (
  id: string,
  idSuffix: number,
): HTMLDivElement => {
  const div = document.createElement("div");
  div.id = `${id}_${idSuffix}`;
  div.classList.add("canvas-container");
  return div;
};

const createCanvasElement = (
  id: string,
  idSuffix: number,
): HTMLCanvasElement => {
  const canvas = document.createElement("canvas");
  canvas.id = `${id}_${idSuffix}`;
  canvas.classList.add("output-canvas");
  return canvas;
};

export function createPropertyInputs(
  idSuffix: number,
  inputs: Inputs,
): PropertyInputs {
  const isBuying = createInputElement(
    "is_buying",
    idSuffix,
    "checkbox",
    inputs.isBuying,
    1000,
  );
  const houseValue = createInputElement(
    "house_value",
    idSuffix,
    "number",
    inputs.houseValue,
    1000,
  );
  const cash = createInputElement(
    "cash",
    idSuffix,
    "number",
    inputs.cash,
    1000,
  );
  const mortgage = createInputElement(
    "mortgage",
    idSuffix,
    "number",
    inputs.mortgage,
    1000,
  );
  const salary = createInputElement(
    "salary",
    idSuffix,
    "number",
    inputs.salary,
    100,
  );
  const rent = createInputElement("rent", idSuffix, "number", inputs.rent, 100);
  const mortgageInterestRate = createInputElement(
    "mortgage_interest_rate",
    idSuffix,
    "number",
    inputs.mortgageInterestRate,
    0.1,
  );
  const mortgageMonthlyPayment = createInputElement(
    "mortgage_monthly_payment",
    idSuffix,
    "number",
    inputs.mortgageMonthlyPayment,
    100,
  );
  const stockAppreciationRate = createInputElement(
    "stock_appreciation_rate",
    idSuffix,
    "number",
    inputs.stockAppreciationRate,
    0.1,
  );
  const houseAppreciationRate = createInputElement(
    "house_appreciation_rate",
    idSuffix,
    "number",
    inputs.houseAppreciationRate,
    0.1,
  );
  const yearsToForecast = createInputElement(
    "years_to_forecast",
    idSuffix,
    "number",
    inputs.yearsToForecast,
    1,
  );
  const buyingCosts = createInputElement(
    "buying_costs",
    idSuffix,
    "number",
    inputs.buyingCosts,
    100,
  );
  const firstTimeBuyer = createInputElement(
    "first_time_buyer",
    idSuffix,
    "checkbox",
    inputs.firstTimeBuyer,
    "",
  );
  const groundRent = createInputElement(
    "ground_rent",
    idSuffix,
    "number",
    inputs.groundRent,
    50,
  );
  const serviceCharge = createInputElement(
    "service_charge",
    idSuffix,
    "number",
    inputs.serviceCharge,
    100,
  );
  const maintenanceRate = createInputElement(
    "maintenance_rate",
    idSuffix,
    "number",
    inputs.maintenanceRate,
    0.1,
  );
  const homeInsurance = createInputElement(
    "home_insurance",
    idSuffix,
    "number",
    inputs.homeInsurance,
    50,
  );

  const canvasDiv = createCanvasDivElement("canvas_div", idSuffix);
  const canvas = createCanvasElement("canvas", idSuffix);
  canvasDiv.appendChild(canvas);

  const elements = [
    createParagraphElement(
      createLabelElement(isBuying.id, "Buying instead of renting"),
      isBuying,
    ),
    createParagraphElement(
      createLabelElement(houseValue.id, "House value at purchase"),
      houseValue,
    ),
    createParagraphElement(
      createLabelElement(cash.id, "Cash at purchase"),
      cash,
    ),
    createParagraphElement(
      createLabelElement(mortgage.id, "Initial mortgage"),
      mortgage,
    ),
    createParagraphElement(
      createLabelElement(salary.id, "Net annual salary"),
      salary,
    ),
    createParagraphElement(createLabelElement(rent.id, "Monthly rent"), rent),
    createParagraphElement(
      createLabelElement(
        mortgageInterestRate.id,
        "Mortgage interest rate (%), annual",
      ),
      mortgageInterestRate,
    ),
    createParagraphElement(
      createLabelElement(
        mortgageMonthlyPayment.id,
        "Mortgage payment, monthly",
      ),
      mortgageMonthlyPayment,
    ),
    createParagraphElement(
      createLabelElement(
        stockAppreciationRate.id,
        "Stock value appreciation (%), annual",
      ),
      stockAppreciationRate,
    ),
    createParagraphElement(
      createLabelElement(
        houseAppreciationRate.id,
        "House price appreciation (%), annual",
      ),
      houseAppreciationRate,
    ),
    createParagraphElement(
      createLabelElement(yearsToForecast.id, "Years to forecast"),
      yearsToForecast,
    ),
    createParagraphElement(
      createLabelElement(
        buyingCosts.id,
        "Buying costs (survey, conveyancing fee, etc.)",
      ),
      buyingCosts,
    ),
    createParagraphElement(
      createLabelElement(firstTimeBuyer.id, "First time buyer"),
      firstTimeBuyer,
    ),
    createParagraphElement(
      createLabelElement(groundRent.id, "Ground rent, annual"),
      groundRent,
    ),
    createParagraphElement(
      createLabelElement(serviceCharge.id, "Service charge, annual"),
      serviceCharge,
    ),
    createParagraphElement(
      createLabelElement(
        maintenanceRate.id,
        "Maintenance costs, % of value, annual",
      ),
      maintenanceRate,
    ),
    createParagraphElement(
      createLabelElement(homeInsurance.id, "Home insurance, annual"),
      homeInsurance,
    ),
  ];

  const inputsDiv = document.createElement("div");
  inputsDiv.classList.add("inputs-div");
  elements.forEach((element) => inputsDiv.appendChild(element));

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
