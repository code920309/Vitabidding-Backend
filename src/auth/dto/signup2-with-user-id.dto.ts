// src/auth/dto/signup2-with-user-id.dto.ts
import { Signup2Dto } from './signup2.dto';

export interface Signup2WithUserIdDto extends Signup2Dto {
  userId: string;
}
