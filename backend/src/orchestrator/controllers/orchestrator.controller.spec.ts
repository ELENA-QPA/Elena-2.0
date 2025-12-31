import { Test, TestingModule } from '@nestjs/testing';
import { OrchestratorController } from './orchestrator.controller';
import { OrchestratorService } from '../services/orchestrator.service';

describe('OrchestratorController', () => {
  let controller: OrchestratorController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrchestratorController],
      providers: [OrchestratorService],
    }).compile();

    controller = module.get<OrchestratorController>(OrchestratorController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
