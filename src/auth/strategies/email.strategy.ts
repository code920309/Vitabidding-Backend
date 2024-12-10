// src/auth/strategies/email.strategy.ts
// NestJS 관련 라이브러리
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// 외부 라이브러리
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailStrategy {
  private transporter;

  constructor(private readonly configService: ConfigService) {
    // Nodemailer 전송 객체 생성
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.configService.get<string>('NODE_MAILER_ID'),
        pass: this.configService.get<string>('NODE_MAILER_PW'),
      },
    });
  }

  /**
   * 이메일 인증 코드 전송
   * @param email 수신자의 이메일 주소
   * @param code 이메일 인증 코드
   */
  async sendVerificationEmail(email: string, code: string) {
    const mailOptions = {
      from: this.configService.get<string>('NODE_MAILER_ID'),
      to: email,
      subject: 'Email Verification',
      html: `
        <div style="
        margin: 0 auto;
        padding: 3.5% 0 5%;
        text-align: center;
        border: 0.5px solid #ececec;
        width: 50%;
        ">
          <img src="https://img1.daumcdn.net/thumb/R1280x0/?scode=mtistory2&fname=https%3A%2F%2Fblog.kakaocdn.net%2Fdn%2Fb5Y88n%2FbtsKvnDViH3%2FZoqke6Fm8klYdQYvVsgsT1%2Fimg.png" alt="VitaBidding Logo"/><br/><br/><br/>
          <span style="
            font-size: 30pt;
            border: 0.5px solid #ececec;
            padding: 0.5% 2.5%;
            font-weight: bold;
          ">${code}</span>
          <br/>
          <h2>인증번호는 3분간 유효합니다.</h2><br/><br/><br/>
          <h4 style="color: gray;">
            &copy; Copyright VitaBidding, 2023 All Rights Reserved.
          </h4>
        </div>
      `,
    };

    await this.transporter.sendMail(mailOptions);
  }
}
