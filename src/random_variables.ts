import { randomLcg, randomNormal } from "d3-random";

export type RandomGenerator = () => number;

export type RandomVariableDistribution = {
  mean: number;
  stdDev: number;
};

export function makeRootGenerator(seed: number): RandomGenerator {
  return randomLcg(seed);
}

export function makeGenerator(
  rootGenerator: RandomGenerator,
  distribution: RandomVariableDistribution,
): RandomGenerator {
  return randomNormal.source(rootGenerator)(
    distribution.mean,
    distribution.stdDev,
  );
}
