import {createEntity, Entity, EntityFactory} from 'shared/domain';

interface BaseJobRequirement {
  /** A human readable term for the requirement. */
  requirementLabel: string;
  /** The minimal value for this requirement (relevant for assessment evaluations) */
  minValue?: number;
}

export interface JobRequirement extends BaseJobRequirement, Entity {}

export const createJobRequirement: EntityFactory<
  BaseJobRequirement,
  JobRequirement
> = (params, id) => {
  const {requirementLabel, minValue} = params;
  const jobRequirement: BaseJobRequirement = {requirementLabel, minValue};
  return createEntity(jobRequirement, id);
};
