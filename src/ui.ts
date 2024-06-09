export interface PropertyInputs {
  isBuying: HTMLInputElement;
  houseValue: HTMLInputElement;
  cash: HTMLInputElement;
  mortgage: HTMLInputElement;
  salary: HTMLInputElement;
  salaryGrowth: HTMLInputElement;
  rent: HTMLInputElement;
  rentGrowth: HTMLInputElement;
  mortgageStage1Length: HTMLInputElement;
  mortgageInterestRateStage1: HTMLInputElement;
  mortgageMonthlyPaymentStage1: HTMLInputElement;
  mortgageInterestRateStage2: HTMLInputElement;
  mortgageMonthlyPaymentStage2: HTMLInputElement;
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
  salaryGrowth: number;
  rent: number;
  rentGrowth: number;
  mortgageStage1Length: number;
  mortgageInterestRateStage1: number;
  mortgageMonthlyPaymentStage1: number;
  mortgageInterestRateStage2: number;
  mortgageMonthlyPaymentStage2: number;
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

interface InputConfig {
  id: keyof Inputs;
  inputType: "checkbox" | "number";
  increment: number | string;
  label: string;
}

const inputConfigs: InputConfig[] = [
  {
    id: "isBuying",
    inputType: "checkbox",
    increment: 1000,
    label: "Buying instead of renting",
  },
  {
    id: "houseValue",
    inputType: "number",
    increment: 1000,
    label: "House price",
  },
  {
    id: "cash",
    inputType: "number",
    increment: 1000,
    label: "Cash at start",
  },
  {
    id: "mortgage",
    inputType: "number",
    increment: 1000,
    label: "Mortgage",
  },
  {
    id: "salary",
    inputType: "number",
    increment: 100,
    label: "Available monthly salary",
  },
  {
    id: "salaryGrowth",
    inputType: "number",
    increment: 0.1,
    label: "Salary growth (%) over inflation, annual",
  },
  { id: "rent", inputType: "number", increment: 100, label: "Monthly rent" },
  {
    id: "rentGrowth",
    inputType: "number",
    increment: 0.1,
    label: "Rent growth (%) over inflation, annual",
  },
  {
    id: "mortgageStage1Length",
    inputType: "number",
    increment: 1,
    label: "Mortgage stage 1 length",
  },
  {
    id: "mortgageInterestRateStage1",
    inputType: "number",
    increment: 0.1,
    label: "Interest rate (%), stage 1, annual",
  },
  {
    id: "mortgageMonthlyPaymentStage1",
    inputType: "number",
    increment: 100,
    label: "Monthly payment, stage 1",
  },
  {
    id: "mortgageInterestRateStage2",
    inputType: "number",
    increment: 0.1,
    label: "Interest rate (%), stage 2, annual",
  },
  {
    id: "mortgageMonthlyPaymentStage2",
    inputType: "number",
    increment: 100,
    label: "Monthly payment, stage 2",
  },
  {
    id: "stockAppreciationRate",
    inputType: "number",
    increment: 0.1,
    label: "Stock value appreciation (%) over inflation, annual",
  },
  {
    id: "houseAppreciationRate",
    inputType: "number",
    increment: 0.1,
    label: "House price growth (%) over inflation, annual",
  },
  {
    id: "yearsToForecast",
    inputType: "number",
    increment: 1,
    label: "Years to forecast",
  },
  {
    id: "buyingCosts",
    inputType: "number",
    increment: 100,
    label: "Buying costs (survey, conveyancing fee, etc.)",
  },
  {
    id: "firstTimeBuyer",
    inputType: "checkbox",
    increment: "",
    label: "First time buyer",
  },
  {
    id: "groundRent",
    inputType: "number",
    increment: 50,
    label: "Ground rent",
  },
  {
    id: "serviceCharge",
    inputType: "number",
    increment: 100,
    label: "Service charge",
  },
  {
    id: "maintenanceRate",
    inputType: "number",
    increment: 0.1,
    label: "Maintenance costs, % of value",
  },
  {
    id: "homeInsurance",
    inputType: "number",
    increment: 50,
    label: "Home insurance",
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
    inputs: ["isBuying", "cash", "salary", "salaryGrowth"],
    label: "Personal finances",
    visibleWhen: "always",
  },
  {
    inputs: ["houseValue", "buyingCosts", "firstTimeBuyer"],
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
    ],
    label: "Mortgage",
    visibleWhen: "onlyIfBuying",
  },
  {
    inputs: ["groundRent", "serviceCharge", "maintenanceRate", "homeInsurance"],
    label: "Annual house expenses",
    visibleWhen: "onlyIfBuying",
  },
  {
    inputs: ["rent", "rentGrowth"],
    label: "Renting",
    visibleWhen: "onlyIfRenting",
  },
  {
    inputs: ["houseAppreciationRate", "stockAppreciationRate"],
    label: "Markets",
    visibleWhen: "always",
  },
  { inputs: ["yearsToForecast"], label: "Simulation", visibleWhen: "always" },
];

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

export function createPropertyInputs(
  idSuffix: number,
  inputs: Inputs,
): PropertyInputs {
  const propertyInputs: { [key in keyof Inputs]: HTMLInputElement } = {} as any;
  const propertyInputDivs: { [key in keyof Inputs]: HTMLDivElement } =
    {} as any;

  inputConfigs.forEach((config) => {
    const [input, inputDiv] = createInputDiv(
      config.id,
      idSuffix,
      config.inputType,
      inputs[config.id],
      config.increment,
      config.label,
    );
    propertyInputs[config.id] = input;
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

  updateGroupVisibility(propertyInputs.isBuying.checked);

  propertyInputs.isBuying.addEventListener("change", (event) => {
    updateGroupVisibility((event.target as HTMLInputElement).checked);
  });

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

  return { ...propertyInputs, canvas: canvas };
}
