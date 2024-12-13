// src/auth/controllers/auth.controller.ts
// NestJS 라이브러리 및 데코레이터
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Post,
  Put,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';

// 서비스 및 DTO
import { AuthService, UserService } from '../services';
import { JwtAuthGuard } from '../../common/guards';
import { Token } from '../../common/decorators';
import {
  CreateUserDto1,
  CreateUserDto2,
  CreateUserDto2WithUserIdDto,
  LoginReqDto,
  LoginResDto,
  RefreshReqDto,
  SignupResDto,
  UpdateUserDto,
  ConvertToBusinessDto,
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
      message: '회원가입 완료',
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
    @Token() accessToken: string, // 커스텀 데코레이터 사용
    @Body() createUserDto2: CreateUserDto2,
  ): Promise<{ message: string; user: SignupResDto }> {
    if (!accessToken) {
      throw new HttpException(
        '액세스 토큰이 필요합니다.',
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

    return { message: '추가 정보 입력 완료', user: response };
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
  async logout(@Token() accessToken: string): Promise<{ message: string }> {
    if (!accessToken) {
      throw new HttpException(
        '액세스 토큰이 필요합니다.',
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.authService.logout(accessToken);

    return { message: '로그아웃 성공' };
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
    return { message: '인증 코드가 전송되었습니다.' };
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
        '인증 코드가 유효하지 않습니다.',
        HttpStatus.BAD_REQUEST,
      );
    }
    return { message: '이메일 인증에 성공하였습니다.' };
  }

  /**
   * 닉네임 중복 확인
   * 사용자가 선택한 닉네임의 중복 여부 확인
   */
  @Post('check-nickname')
  async checkNickname(@Body('name') name: string) {
    const isAvailable = await this.authService.checkNicknameAvailability(name);

    if (!isAvailable) {
      throw new HttpException(
        '닉네임이 이미 사용 중입니다.',
        HttpStatus.CONFLICT,
      );
    }

    return { message: '사용 가능한 닉네임입니다.' };
  }

  @Post('send-phone-code')
  async sendPhoneVerificationCode(@Body('phoneNumber') phoneNumber: string) {
    await this.authService.sendPhoneVerificationCode(phoneNumber);
    return { message: 'Verification code sent' };
  }

  @Post('verify-phone-code')
  async verifyPhoneCode(
    @Body('phoneNumber') phoneNumber: string,
    @Body('code') code: string,
  ) {
    const isValid = await this.authService.verifyPhoneCode(phoneNumber, code);

    if (!isValid) {
      throw new HttpException(
        'Invalid verification code',
        HttpStatus.BAD_REQUEST,
      );
    }
    return { message: 'Phone number verified successfully' };
  }

  /**
   * 사용자 정보 조회
   * 주소를 포함한 사용자 정보 반환
   */
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Token() accessToken: string): Promise<any> {
    if (!accessToken) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    const userId = await this.authService.getUserIdFromToken(accessToken);

    const user = await this.userService.findUserWithAddressById(userId);

    return {
      message: '사용자 정보 조회 성공',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        realName: user.realName,
        phone: user.phone,
        addresses: user.addresses,
      },
    };
  }

  // 회원 정보 수정
  @UseGuards(JwtAuthGuard)
  @Put('profile')
  async updateProfile(
    @Token() accessToken: string, // 커스텀 데코레이터 사용
    @Body() updateUserDto: UpdateUserDto,
  ) {
    if (!accessToken) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    const userId = await this.authService.getUserIdFromToken(accessToken);

    await this.userService.updateUserProfile(userId, updateUserDto);

    return { message: '사용자 정보가 성공적으로 수정되었습니다.' };
  }

  // 회원탈퇴
  @UseGuards(JwtAuthGuard)
  @Delete('delete-account')
  async deleteAccount(
    @Token() accessToken: string,
  ): Promise<{ message: string }> {
    if (!accessToken) {
      throw new HttpException(
        '액세스 토큰이 필요합니다.',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const userId = await this.authService.getUserIdFromToken(accessToken);
    if (!userId) {
      throw new HttpException(
        '유효하지 않은 요청입니다.',
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.userService.deleteUserAccount(userId);

    return { message: '회원 탈퇴가 완료되었습니다.' };
  }

  /**
   * 사업자 계정으로 전환
   * @param accessToken 액세스 토큰에서 추출된 사용자 ID
   * @param dto 사업자 전환 DTO
   */
  @UseGuards(JwtAuthGuard)
  @Post('convert-to-business')
  async convertToBusiness(
    @Token() accessToken: string,
    @Body() dto: ConvertToBusinessDto,
  ): Promise<{ message: string }> {
    if (!accessToken) {
      throw new HttpException(
        '액세스 토큰이 필요합니다.',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const userId = await this.authService.getUserIdFromToken(accessToken);
    if (!userId) {
      throw new HttpException(
        '유효하지 않은 요청입니다.',
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.userService.convertToBusiness(userId, dto);
    return { message: '사업자 계정으로 전환되었습니다.' };
  }

  /**
   * 사업자 계정 전환 상태 조회
   */
  @Get('business-status')
  async getBusinessStatus(
    @Token() accessToken: string,
  ): Promise<{ businessChk: boolean }> {
    if (!accessToken) {
      throw new HttpException(
        '액세스 토큰이 필요합니다.',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const userId = await this.authService.getUserIdFromToken(accessToken);
    if (!userId) {
      throw new HttpException(
        '유효하지 않은 요청입니다.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const status = await this.userService.getBusinessStatus(userId);
    return { businessChk: status };
  }

  /**
   * 현재 서버 시간 반환
   * @returns 서버의 현재 시간을 ISO 8601 형식과 읽기 쉬운 형식으로 반환
   */
  @Get('server-time')
  async getServerTime(): Promise<{
    serverTime: string;
    readableTime: string;
    originalServerTime: string;
  }> {
    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const date = now.getDate().toString().padStart(2, '0');
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const seconds = now.getSeconds().toString().padStart(2, '0');

      const serverTime = `${year}-${month}-${date} ${hours}:${minutes}:${seconds}`;
      const readableTime = now.toLocaleString('ko-KR', {
        timeZone: 'Asia/Seoul',
      });
      const originalServerTime = now.toISOString();

      return {
        serverTime,
        readableTime,
        originalServerTime,
      };
    } catch (error) {
      throw new HttpException(
        '서버 시간을 조회하는 중 오류가 발생했습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
