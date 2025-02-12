// src/auth/auth.module.ts
// NestJS 모듈 및 데코레이터
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { PassportModule } from '@nestjs/passport';

// 엔티티
import {
  User,
  SecuritySetting,
  AccessLog,
  AccessToken,
  RefreshToken,
  TokenBlacklist,
  Address,
  AgreementVerify,
  ChangeBusiness,
  ObsStudio,
} from './entities';

// 리포지토리
import {
  UserRepository,
  AccessTokenRepository,
  RefreshTokenRepository,
  AccessLogRepository,
  TokenBlacklistRepository,
  AddressRepository,
  AgreementVerifyRepository,
  ObsStudioRepository,
} from './repositories';

// 서비스 및 전략
import { AuthService, TokenBlacklistService, UserService } from './services';
import { JwtStrategy, EmailStrategy, SmsStrategy } from './strategies';
import { JwtAuthGuard } from '../common/guards';

// 컨트롤러
import { AuthController } from './controllers';

@Module({
  imports: [
    HttpModule,
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('ACCESS_TOKEN_EXPIRY'),
        },
      }),
    }),
    TypeOrmModule.forFeature([
      User,
      SecuritySetting,
      AccessLog,
      AccessToken,
      RefreshToken,
      TokenBlacklist,
      Address,
      AgreementVerify,
      ChangeBusiness,
      ObsStudio,
    ]),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    UserService,
    TokenBlacklistService,
    JwtStrategy,
    EmailStrategy,
    SmsStrategy,

    // Repositories
    UserRepository,
    AccessTokenRepository,
    RefreshTokenRepository,
    AccessLogRepository,
    TokenBlacklistRepository,
    AddressRepository,
    AgreementVerifyRepository,
    ObsStudioRepository,

    JwtAuthGuard,
  ],
  exports: [
    AuthService,
    UserService,
    TokenBlacklistService,
    JwtStrategy,
    EmailStrategy,
    SmsStrategy,

    // Repositories
    UserRepository,
    AccessTokenRepository,
    RefreshTokenRepository,
    AccessLogRepository,
    TokenBlacklistRepository,
    AddressRepository,
    AgreementVerifyRepository,
    ObsStudioRepository,

    JwtAuthGuard,
  ],
})
export class AuthModule {}
