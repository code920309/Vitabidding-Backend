// src/auth/controllers/auth.controller.ts
// NestJS 라이브러리 및 데코레이터
import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Post,
  Req,
  Res,
} from '@nestjs/common';

// 서비스 및 DTO
import { AuthService, UserService } from '../services';
import {
  CreateUserDto1,
  CreateUserDto2,
  CreateUserDto2WithUserIdDto,
  LoginReqDto,
  LoginResDto,
  RefreshReqDto,
  SignupResDto,
} from '../dto';

// Express 타입
import { Request, Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  /**
   * 회원가입 1단계
   * 사용자 계정을 생성하고 로그인 후 액세스 및 리프레시 토큰 반환
   */
  @Post('signup1')
  async signup1(
    @Body() createUserDto1: CreateUserDto1,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const user = await this.userService.createUser(createUserDto1);

    const loginResult = await this.authService.login(
      user.email,
      createUserDto1.password,
      {
        ip: req.ip,
        ua: req.headers['user-agent'] || '',
        endpoint: `${req.method} ${req.originalUrl}`,
      },
    );

    const response: SignupResDto = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    res.json({
      message: 'Signup1 successful',
      accessToken: loginResult.accessToken,
      refreshToken: loginResult.refreshToken,
      user: response,
    });
  }

  /**
   * 회원가입 2단계
   * 추가 사용자 정보를 업데이트하고 최종 사용자 데이터 반환
   */
  @Post('signup2')
  async signup2(
    @Req() req: Request,
    @Body() createUserDto2: CreateUserDto2,
  ): Promise<{ message: string; user: SignupResDto }> {
    const accessToken = req.headers['authorization']?.split(' ')[1];
    if (!accessToken) {
      throw new HttpException(
        { message: 'Access token is required' },
        HttpStatus.UNAUTHORIZED,
      );
    }

    const userId = await this.authService.getUserIdFromToken(accessToken);

    await this.userService.updateAdditionalUserInfo({
      ...createUserDto2,
      userId,
    } as CreateUserDto2WithUserIdDto);

    const user = await this.userService.findUserById(userId);

    const response: SignupResDto = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      realName: user.realName,
      phone: user.phone,
    };

    return { message: 'Signup2 successful', user: response };
  }

  /**
   * 로그인
   * 사용자 인증 후 로그인 성공 시 토큰 반환
   */
  @Post('login')
  async login(
    @Req() req: Request,
    @Body() loginReqDto: LoginReqDto,
    @Res() res: Response,
  ): Promise<void> {
    const { ip, method, originalUrl } = req;
    const reqInfo = {
      ip,
      endpoint: `${method} ${originalUrl}`,
      ua: req.headers['user-agent'] || '',
    };

    const loginResult = await this.authService.login(
      loginReqDto.email,
      loginReqDto.password,
      reqInfo,
    );

    res.json(loginResult);
  }

  /**
   * 로그아웃
   * 액세스 토큰을 이용하여 사용자 로그아웃 처리
   */
  @Post('logout')
  async logout(@Req() req: Request): Promise<{ message: string }> {
    const accessToken = req.headers['authorization']?.split(' ')[1];

    if (!accessToken) {
      throw new HttpException(
        { message: 'Access token is required' },
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.authService.logout(accessToken);

    return { message: 'Logout successful' };
  }

  /**
   * 토큰 갱신
   * 리프레시 토큰을 사용하여 새로운 액세스 토큰 발급
   */
  @Post('refresh')
  async refresh(@Body() dto: RefreshReqDto): Promise<string> {
    return this.authService.refreshAccessToken(dto.refreshToken);
  }

  /**
   * 인증 코드 전송
   * 사용자의 이메일로 인증 코드 전송
   */
  @Post('send-code')
  async sendVerificationCode(@Body('email') email: string) {
    await this.authService.sendVerificationCode(email);
    return { message: 'Verification code sent' };
  }

  /**
   * 인증 코드 확인
   * 전송된 인증 코드의 유효성 검증
   */
  @Post('verify-code')
  async verifyCode(@Body('email') email: string, @Body('code') code: string) {
    const isValid = await this.authService.verifyCode(email, code);

    if (!isValid) {
      throw new HttpException(
        'Invalid verification code',
        HttpStatus.BAD_REQUEST,
      );
    }
    return { message: 'Email verified successfully' };
  }

  /**
   * 닉네임 중복 확인
   * 사용자가 선택한 닉네임의 중복 여부 확인
   */
  @Post('check-nickname')
  async checkNickname(@Body('name') name: string) {
    const isAvailable = await this.authService.checkNicknameAvailability(name);

    if (!isAvailable) {
      throw new HttpException('Nickname is already taken', HttpStatus.CONFLICT);
    }

    return { message: 'Nickname is available' };
  }
}
