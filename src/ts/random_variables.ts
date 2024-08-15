// Generating random numbers and parametrising their distributions.
import { randomLcg, randomLogNormal } from "d3-random";

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
  return randomLogNormal.source(rootGenerator)(
    distribution.mean / 100,
    distribution.stdDev / 100,
  );
}
