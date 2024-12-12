import { Module } from '@nestjs/common';
import { OCIStorageService } from '../services';

@Module({
  providers: [OCIStorageService], // OCIStorageService 등록
  exports: [OCIStorageService], // 다른 모듈에서 사용 가능하도록 export
})
export class OCIModule {}
