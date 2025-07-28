export type PipelineStatus = 'RUNNING' | 'STOPPED' | 'ERROR' | 'IDLE';

export type PipelineSourceType = 'HTTP' | 'FILE' | 'DATABASE';

export interface Pipeline {
  id: string;
  name: string;
  sourceType: PipelineSourceType;
  status: PipelineStatus;
  createdAt: string;
  esIndex: string;
}

export interface NifiPipeline {
    name: string;
    nifiProcessGroup: string;
    sourceType: PipelineSourceType;
    config: string;
}
