export type Inputs = {
  isBuying: boolean;
  housePrice: number;
  cash: number;
  mortgage: number;
  salary: number;
  salaryGrowth: RandomVariableDistribution;
  rent: number;
  rentGrowth: RandomVariableDistribution;
  mortgageStage1Length: number;
  mortgageInterestRateStage1: number;
  mortgageMonthlyPaymentStage1: number;
  mortgageInterestRateStage2: number;
  mortgageMonthlyPaymentStage2: number;
  mortgageOverpay: boolean;
  inflation: RandomVariableDistribution;
  stockAppreciationRate: RandomVariableDistribution;
  houseAppreciationRate: RandomVariableDistribution;
  yearsToForecast: number;
  buyingCosts: number;
  firstTimeBuyer: boolean;
  groundRent: number;
  serviceChargeRate: number;
  maintenanceRate: number;
  homeInsurance: number;
  seed: number;
  numSamples: number;
  correctInflation: boolean;
};

export type PropertyInputs = {
  [K in keyof Inputs]: HTMLInputElement[];
};

interface InputConfig {
  id: keyof Inputs;
  inputType: "checkbox" | "number" | "randomVariable";
  increment: number | string;
  label: string;
  tooltip: string | null;
}

const inputConfigs: InputConfig[] = [
  {
    id: "isBuying",
    inputType: "checkbox",
    increment: 1000,
    label: "Buying instead of renting",
    tooltip: null,
  },
  {
    id: "housePrice",
    inputType: "number",
    increment: 1000,
    label: "House price",
    tooltip: null,
  },
  {
    id: "cash",
    inputType: "number",
    increment: 1000,
    label: "Cash at start",
    tooltip:
      "The amount of capital you start with. This should cover the house price minus mortgage, plus any buying costs such as stamp duty. If you're renting rather than buying, this whole sum is invested in stocks in year 0.",
  },
  {
    id: "mortgage",
    inputType: "number",
    increment: 1000,
    label: "Mortgage size",
    tooltip: null,
  },
  {
    id: "salary",
    inputType: "number",
    increment: 100,
    label: "Available monthly salary",
    tooltip:
      "This is the part of your salary that is available for paying rent/mortgage and investing. It is your salary at the start of the simulation, and will be increased automatically as time passes.",
  },
  {
    id: "salaryGrowth",
    inputType: "randomVariable",
    increment: 0.1,
    label: "Salary growth (%) over inflation, annual",
    tooltip:
      "Annual salary growth, on top of inflation. Assumed to be a normal distributed random variable with th given mean and standard deviation. This one is tricky to estimate, because one may for instance change careers. I have no good basis for the default values I've chosen here.",
  },
  {
    id: "rent",
    inputType: "number",
    increment: 100,
    label: "Monthly rent",
    tooltip:
      "To make the comparison fair between renting and buying, you should make this be the rent you would need to pay for a similar home as the one you would pay. In London, for instance, 4.5% of house price as annual rent is a good starting point. It will grow over time the same way house prices grow.",
  },
  {
    id: "rentGrowth",
    inputType: "randomVariable",
    increment: 0.1,
    label: "Rent growth (%) over house price growth, annual",
    tooltip:
      "Annual rent increase, on top of house price increase. Assumed to be a normal distributed random variable with th given mean and standard deviation. Note that usually rents rise with house prices, which is why the mean is zero. I haven't found a good source for the standard deviation, so I just guessed something for the default.",
  },
  {
    id: "mortgageStage1Length",
    inputType: "number",
    increment: 1,
    label: "Mortgage stage 1 length (years)",
    tooltip:
      "Mortgages often come in a two stage system, where for the first few years one has a lower, fixed rate and monthly payment. After that the rate rises and becomes variable and the monthly payment rises. This setting is the length of the first part.",
  },
  {
    id: "mortgageInterestRateStage1",
    inputType: "number",
    increment: 0.1,
    label: "Interest rate (%), stage 1, annual",
    tooltip: null,
  },
  {
    id: "mortgageMonthlyPaymentStage1",
    inputType: "number",
    increment: 100,
    label: "Monthly payment, stage 1",
    tooltip: null,
  },
  {
    id: "mortgageInterestRateStage2",
    inputType: "number",
    increment: 0.1,
    label: "Interest rate (%), stage 2, annual",
    tooltip:
      "Note that in reality this rate is typically variable. Maybe it should depend on inflation, but it currently doesn't.",
  },
  {
    id: "mortgageMonthlyPaymentStage2",
    inputType: "number",
    increment: 100,
    label: "Monthly payment, stage 2",
    tooltip: null,
  },
  {
    id: "mortgageOverpay",
    inputType: "checkbox",
    increment: "",
    label: "Overpay when possible",
    tooltip:
      "What to do if there's money left over at the end of the year? With this checked, it is primarily used to pay off the mortgage early. Otherwise it is invested in stocks. Note that not all mortgages allow early repayment.",
  },
  {
    id: "inflation",
    inputType: "randomVariable",
    increment: 0.1,
    label: "Inflation (%), annual",
    tooltip:
      "Annual inflation. Assumed to be a normal distributed random variable with the given mean and standard deviation. The default values are the mean and standard deviation of UK annual CPI 1989-2023.",
  },
  {
    id: "stockAppreciationRate",
    inputType: "randomVariable",
    increment: 0.1,
    label: "Stocks value growth (%) over inflation, annual",
    tooltip:
      "Annual appreciation of the stock portfolio, on top of inflation. Assumed to be a normal distributed random variable with th given mean and standard deviation. The default values are for annual growth over inflation for the S&P 500 index 1989-2023.",
  },
  {
    id: "houseAppreciationRate",
    inputType: "randomVariable",
    increment: 0.1,
    label: "House price growth (%) over inflation, annual",
    tooltip:
      "Annual appreciation of the value of your house, on top of inflation. Assumed to be a normal distributed random variable with th given mean and standard deviation. The default values are for annual growth over inflation for the average London house price 1989-2023. Note that the standard deviation is likely a severe underestimate, given that it's the variation in the average home price. The price of a single home can vary much more, and you own a single home, not a market average.",
  },
  {
    id: "yearsToForecast",
    inputType: "number",
    increment: 1,
    label: "Years to forecast",
    tooltip: null,
  },
  {
    id: "buyingCosts",
    inputType: "number",
    increment: 100,
    label: "Buying costs (survey, solicitor, etc.)",
    tooltip:
      "All the one-off costs of buying a house, except stamp duty, which is calculated separately.",
  },
  {
    id: "firstTimeBuyer",
    inputType: "checkbox",
    increment: "",
    label: "First time buyer",
    tooltip: "Affects stamp duty.",
  },
  {
    id: "groundRent",
    inputType: "number",
    increment: 50,
    label: "Ground rent",
    tooltip:
      "Note that you should probably set either a ground rent and no service charge, or the other way around, depending on whether you buy a leasehold or a freehold.",
  },
  {
    id: "serviceChargeRate",
    inputType: "number",
    increment: 0.1,
    label: "Service charge, % of value",
    tooltip:
      "Note that you should probably set either ground rent and no service charge, or the other way around, depending on whether you buy a leasehold or a freehold.",
  },
  {
    id: "maintenanceRate",
    inputType: "number",
    increment: 0.1,
    label: "Maintenance costs, % of value, annual",
    tooltip: null,
  },
  {
    id: "homeInsurance",
    inputType: "number",
    increment: 50,
    label: "Home insurance",
    tooltip:
      "This should be only for the building, not for contents. In other words, the part you have to pay because you own rather than rent.",
  },
  {
    id: "seed",
    inputType: "number",
    increment: 0.1,
    label: "Random seed",
    tooltip:
      "Should be between 0 and 1. Different seeds cause different random numbers to be generated, from the same distribution.",
  },
  {
    id: "numSamples",
    inputType: "number",
    increment: 100,
    label: "Number of simulations",
    tooltip:
      "The calculator simulates many possible futures, with different randomly sampled numbers for things like inflation and house price growth. The results are then aggregated. A higher number of samples means more accurate results, but also makes the calculator slower.",
  },
  {
    id: "correctInflation",
    inputType: "checkbox",
    increment: "",
    label: "Correct outputs for inflation",
    tooltip:
      "Whether the results should be corrected for inflation. If ticked, e.g. your total wealth in 20 years time will be expressed in today's currency, with inflation subtracted.",
  },
];

type VisibilityCondition = "onlyIfBuying" | "onlyIfRenting" | "always";

interface GroupConfig {
  inputs: (keyof Inputs)[];
  label: string;
  visibleWhen: VisibilityCondition;
}

const groupConfigs: GroupConfig[] = [
  {
    inputs: ["isBuying", "cash", "salary"],
    label: "Personal finances",
    visibleWhen: "always",
  },
  {
    inputs: ["housePrice", "buyingCosts", "firstTimeBuyer"],
    label: "House",
    visibleWhen: "onlyIfBuying",
  },
  {
    inputs: [
      "mortgage",
      "mortgageStage1Length",
      "mortgageInterestRateStage1",
      "mortgageMonthlyPaymentStage1",
      "mortgageInterestRateStage2",
      "mortgageMonthlyPaymentStage2",
      "mortgageOverpay",
    ],
    label: "Mortgage",
    visibleWhen: "onlyIfBuying",
  },
  {
    inputs: [
      "groundRent",
      "serviceChargeRate",
      "maintenanceRate",
      "homeInsurance",
    ],
    label: "Annual house expenses",
    visibleWhen: "onlyIfBuying",
  },
  {
    inputs: ["rent"],
    label: "Renting",
    visibleWhen: "onlyIfRenting",
  },
  {
    inputs: [
      "inflation",
      "salaryGrowth",
      "houseAppreciationRate",
      "rentGrowth",
      "stockAppreciationRate",
    ],
    label: "Markets",
    visibleWhen: "always",
  },
  {
    inputs: ["yearsToForecast", "correctInflation", "numSamples", "seed"],
    label: "Simulation",
    visibleWhen: "always",
  },
];

function createLabelElement(forId: string, text: string): HTMLLabelElement {
  const label = document.createElement("label");
  label.htmlFor = forId;
  label.innerHTML = text; // Use innerHTML to allow flexible insertion of tooltip button
  label.classList.add("input-label");
  return label;
}

function createTooltipButton(tooltipText: string): HTMLSpanElement {
  const tooltipButton = document.createElement("span");
  tooltipButton.classList.add("tooltip-button");
  tooltipButton.innerText = "?";

  const tooltipBox = document.createElement("div");
  tooltipBox.classList.add("tooltip-box");
  tooltipBox.innerText = tooltipText;
  tooltipButton.appendChild(tooltipBox);

  return tooltipButton;
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
  value: string | number | boolean | RandomVariableDistribution,
  step: string | number,
  label: string,
  tooltip: string | null = null,
): [HTMLInputElement[], HTMLDivElement] {
  if (type == "randomVariable") {
    return createRandomVariableInputDiv(
      id,
      idSuffix,
      value as RandomVariableDistribution,
      step,
      label,
      tooltip,
    );
  }
  const inputElement = createInputElement(
    id,
    idSuffix,
    type,
    value as string | number | boolean,
    step,
  );
  const labelElement = createLabelElement(inputElement.id, label);
  const div = document.createElement("div");
  div.appendChild(labelElement);

  if (tooltip) {
    const tooltipButton = createTooltipButton(tooltip);
    labelElement.appendChild(tooltipButton);
  }

  div.appendChild(inputElement);
  div.classList.add("input-div");
  return [[inputElement], div];
}

export type RandomVariableDistribution = {
  mean: number;
  stdDev: number;
};

function createRandomVariableInputDiv(
  id: string,
  idSuffix: number,
  value: RandomVariableDistribution,
  step: string | number,
  label: string,
  tooltip: string | null,
): [HTMLInputElement[], HTMLDivElement] {
  // Create the main container div
  const div = document.createElement("div");
  div.classList.add("input-div");
  div.classList.add("random-variable-input-div");

  const labelElement = createLabelElement(`${id}_${idSuffix}_mean`, label);
  if (tooltip) {
    const tooltipButton = createTooltipButton(tooltip);
    labelElement.appendChild(tooltipButton);
  }
  div.appendChild(labelElement);

  const meanInputElement = createInputElement(
    `${id}_mean`,
    idSuffix,
    "number",
    value.mean,
    step,
  );
  meanInputElement.classList.add("random-variable-mean-input");
  const plusMinusSpan = document.createElement("span");
  plusMinusSpan.innerHTML = "±";
  plusMinusSpan.classList.add("random-variable-plusminus-span");
  const stdDevInputElement = createInputElement(
    `${id}_stddev`,
    idSuffix,
    "number",
    value.stdDev,
    step,
  );
  stdDevInputElement.classList.add("random-variable-stddev-input");

  const inputsContainer = document.createElement("div");
  inputsContainer.classList.add("random-variable-inputs-container");
  inputsContainer.appendChild(meanInputElement);
  inputsContainer.appendChild(plusMinusSpan);
  inputsContainer.appendChild(stdDevInputElement);
  div.appendChild(inputsContainer);
  return [[meanInputElement, stdDevInputElement], div];
}

function createGroup(
  subdivs: Array<HTMLDivElement>,
  title: string,
): HTMLDivElement {
  const divInner = document.createElement("div");
  const divOuter = document.createElement("div");
  const header = document.createElement("h1");
  header.innerHTML = title;
  divOuter.appendChild(header);
  divOuter.appendChild(divInner);
  subdivs.forEach((sd) => divInner.appendChild(sd));
  divOuter.classList.add("input-group-outer");
  divInner.classList.add("input-group");
  return divOuter;
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

function addSummaryEntry(
  parentDiv: HTMLDivElement,
  label: string,
): HTMLSpanElement {
  const div = document.createElement("div");
  div.classList.add("summary-entry");
  const labelSpan = document.createElement("span");
  labelSpan.classList.add("summary-label");
  labelSpan.innerHTML = label;
  const valueSpan = document.createElement("span");
  valueSpan.classList.add("summary-value");
  div.appendChild(labelSpan);
  div.appendChild(valueSpan);
  parentDiv.appendChild(div);
  return valueSpan;
}

type SummaryValueSpans = {
  salary: HTMLSpanElement;
  houseValue: HTMLSpanElement;
  stockIsaValue: HTMLSpanElement;
  stockNonIsaValue: HTMLSpanElement;
  rent: HTMLSpanElement;
  wealth: HTMLSpanElement;
};

function createSummaryDiv(): [HTMLDivElement, SummaryValueSpans] {
  const div = document.createElement("div");
  div.classList.add("summary-wrapper");
  const header = document.createElement("div");
  header.classList.add("summary-header");
  header.innerHTML = "Final values";
  div.appendChild(header);

  const entriesContainer = document.createElement("div");
  entriesContainer.classList.add("summary-entries");

  const valueSpans = {
    salary: addSummaryEntry(entriesContainer, "Salary:"),
    stockIsaValue: addSummaryEntry(entriesContainer, "Stocks in ISA:"),
    stockNonIsaValue: addSummaryEntry(entriesContainer, "Stocks outside ISA:"),
    houseValue: addSummaryEntry(entriesContainer, "House value:"),
    rent: addSummaryEntry(entriesContainer, "Rent:"),
    wealth: addSummaryEntry(entriesContainer, "Wealth:"),
  };

  div.appendChild(entriesContainer);
  return [div, valueSpans];
}

export function createPropertyInputs(
  idSuffix: number,
  inputs: Inputs,
): [PropertyInputs, SummaryValueSpans, HTMLCanvasElement] {
  const propertyInputs: PropertyInputs = {} as any;
  const propertyInputDivs: { [key in keyof Inputs]: HTMLDivElement } =
    {} as any;

  inputConfigs.forEach((config) => {
    const [inputElements, inputDiv] = createInputDiv(
      config.id,
      idSuffix,
      config.inputType,
      inputs[config.id],
      config.increment,
      config.label,
      config.tooltip,
    );
    propertyInputs[config.id] = inputElements;
    propertyInputDivs[config.id] = inputDiv;
  });

  const groups = groupConfigs.map((groupConfig) => {
    const divs = groupConfig.inputs.map(
      (inputId) => propertyInputDivs[inputId],
    );
    return createGroup(divs, groupConfig.label);
  });

  // Make some groups only be visible based on whether we are buying or renting.
  function updateGroupVisibility(isBuying: boolean) {
    groups.forEach((group, index) => {
      const visibleWhen = groupConfigs[index].visibleWhen;
      const visible =
        visibleWhen === "always" ||
        (visibleWhen === "onlyIfBuying" && isBuying) ||
        (visibleWhen === "onlyIfRenting" && !isBuying);
      group.classList.toggle("disabled", !visible);
      group.querySelectorAll("input").forEach((input: HTMLInputElement) => {
        input.disabled = !visible;
      });
    });
  }

  updateGroupVisibility(propertyInputs.isBuying[0].checked);

  propertyInputs.isBuying[0].addEventListener("change", (event) => {
    updateGroupVisibility((event.target as HTMLInputElement).checked);
  });

  const canvasDiv = createCanvasDivElement("canvas_div", idSuffix);
  const canvas = createCanvasElement("canvas", idSuffix);
  canvasDiv.appendChild(canvas);

  const [summaryDiv, summaryValueSpans] = createSummaryDiv();

  const inputsDiv = document.createElement("div");
  inputsDiv.classList.add("inputs-div");
  groups.forEach((element) => inputsDiv.appendChild(element));

  const wrapperDiv = document.createElement("div");
  wrapperDiv.classList.add("property-wrapper");
  wrapperDiv.appendChild(canvasDiv);
  wrapperDiv.appendChild(summaryDiv);
  wrapperDiv.appendChild(inputsDiv);

  const contentDiv = document.getElementById("content") as HTMLDivElement;
  contentDiv.appendChild(wrapperDiv);

  return [propertyInputs, summaryValueSpans, canvas];
}
