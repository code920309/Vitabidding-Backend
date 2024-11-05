// src/auth/controllers/auth.controller.ts
import {
  Body,
  Controller,
  Post,
  Req,
  Res,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { AuthService, UserService } from '../services';
import {
  CreateUserDto,
  LoginReqDto,
  LoginResDto,
  RefreshReqDto,
  SignupResDto,
  Signup2Dto,
  Signup2WithUserIdDto,
} from '../dto';

import { Response, Request } from 'express'; // Request 추가

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @Post('signup1')
  async signup1(
    @Body() createUserDto: CreateUserDto,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const user = await this.userService.createUser(createUserDto);

    const loginResult = await this.authService.login(
      user.email,
      createUserDto.password,
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

  @Post('signup2')
  async signup2(
    @Req() req: Request,
    @Body() signup2Dto: Signup2Dto,
  ): Promise<{ message: string; user: SignupResDto }> {
    const accessToken = req.headers['authorization']?.split(' ')[1];
    if (!accessToken) {
      throw new HttpException(
        { message: 'Access token is required' },
        HttpStatus.UNAUTHORIZED,
      );
    }

    const userId = await this.authService.getUserIdFromToken(accessToken);

    // Signup2WithUserIdDto 타입으로 전달
    await this.userService.updateAdditionalUserInfo({
      ...signup2Dto,
      userId,
    } as Signup2WithUserIdDto);

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

  @Post('logout')
  async logout(@Req() req: Request): Promise<{ message: string }> {
    const accessToken = req.headers['authorization']?.split(' ')[1]; // accessToken 추출

    if (!accessToken) {
      throw new HttpException(
        { message: 'Access token is required' },
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.authService.logout(accessToken);

    return { message: 'Logout successful' };
  }

  @Post('refresh')
  async refresh(@Body() dto: RefreshReqDto): Promise<string> {
    return this.authService.refreshAccessToken(dto.refreshToken);
  }

  @Post('send-code')
  async sendVerificationCode(@Body('email') email: string) {
    await this.authService.sendVerificationCode(email);
    return { message: 'Verification code sent' };
  }

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

  @Post('check-nickname')
  async checkNickname(@Body('name') name: string) {
    const isAvailable = await this.authService.checkNicknameAvailability(name);

    if (!isAvailable) {
      throw new HttpException('Nickname is already taken', HttpStatus.CONFLICT);
    }

    return { message: 'Nickname is available' };
  }
}
