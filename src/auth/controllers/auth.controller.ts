// src/auth/controllers/auth.controller.ts
import { Body, Controller, Post, Req, Res } from '@nestjs/common';
import { AuthService, UserService } from '../services';
import {
  CreateUserDto,
  LoginReqDto,
  LoginResDto,
  RefreshReqDto,
  SignupResDto,
} from '../dto';

import { Response, Request } from 'express'; // Request 추가

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @Post('login')
  async login(
    @Req() req: Request, // Request 타입 지정
    @Body() loginReqDto: LoginReqDto,
    @Res() res: Response, // Response 타입 추가
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

    res.json(loginResult); // 로그인 결과를 JSON 응답으로 반환
  }

  @Post('signup')
  async signup(
    @Body() createUserDto: CreateUserDto,
    @Req() req: Request, // Request 객체 추가
    @Res() res: Response,
  ): Promise<void> {
    // 회원가입 처리
    const user = await this.userService.createUser(createUserDto);

    // 회원가입 후 자동 로그인 처리
    const loginResult = await this.authService.login(
      createUserDto.email,
      createUserDto.password,
      {
        ip: req.ip,
        ua: req.headers['user-agent'] || '',
        endpoint: `${req.method} ${req.originalUrl}`,
      },
    );

    // 로그인 결과와 사용자 정보, 토큰을 응답으로 반환
    res.json({
      message: 'Signup successful',
      accessToken: loginResult.accessToken,
      refreshToken: loginResult.refreshToken,
      user: loginResult.user,
    });
  }

  @Post('refresh')
  async refresh(@Body() dto: RefreshReqDto): Promise<string> {
    return this.authService.refreshAccessToken(dto.refreshToken);
  }
}
