// src/auth/repositories/obs-studio.repository.ts
import { Injectable } from '@nestjs/common';
import { EntityManager, Repository } from 'typeorm';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { ObsStudio } from '../entities';

@Injectable()
export class ObsStudioRepository extends Repository<ObsStudio> {
  constructor(
    @InjectRepository(ObsStudio) private readonly repo: Repository<ObsStudio>,

    @InjectEntityManager()
    private readonly entityManager: EntityManager,
  ) {
    super(repo.target, repo.manager, repo.queryRunner);
  }

  async createObsStudio(obsStudio: ObsStudio): Promise<ObsStudio> {
    return this.entityManager.save(obsStudio);
  }

  async findByUserId(userId: string): Promise<ObsStudio[]> {
    return this.entityManager.find(ObsStudio, {
      where: { user: { id: userId } },
    });
  }

  async updateVideoLiveUrl(
    userId: string,
    videoLiveUrl: string,
  ): Promise<void> {
    await this.entityManager.update(
      ObsStudio,
      { id: userId },
      { videoLiveUrl },
    );
  }
}
