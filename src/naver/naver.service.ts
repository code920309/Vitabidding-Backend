// src/naver/naver.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as crypto from 'crypto';

@Injectable()
export class NaverService {
  private readonly accessKey: string;
  private readonly secretKey: string;
  private readonly serviceId: string;
  private readonly caller: string;

  constructor(private readonly configService: ConfigService) {
    this.accessKey = this.configService.get<string>('NAVER_ACCESS_KEY');
    this.secretKey = this.configService.get<string>('NAVER_SECRET_KEY');
    this.serviceId = this.configService.get<string>('NAVER_SERVICE_ID');
    this.caller = this.configService.get<string>('NAVER_CALLER');
  }

  private generateSignature(timestamp: string): string {
    const space = ' ';
    const newLine = '\n';
    const method = 'POST';
    const url = `/sms/v2/services/${this.serviceId}/messages`;
    const message = [
      method,
      space,
      url,
      newLine,
      timestamp,
      newLine,
      this.accessKey,
    ].join('');
    return crypto
      .createHmac('sha256', this.secretKey)
      .update(message)
      .digest('base64');
  }

  async sendVerificationCode(phoneNumber: string, code: string): Promise<void> {
    const timestamp = Date.now().toString();
    const signature = this.generateSignature(timestamp);

    const response = await axios.post(
      `https://sens.apigw.ntruss.com/sms/v2/services/${this.serviceId}/messages`,
      {
        type: 'SMS',
        from: this.caller,
        content: `Your verification code is ${code}.`,
        messages: [{ to: phoneNumber }],
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-ncp-apigw-timestamp': timestamp,
          'x-ncp-iam-access-key': this.accessKey,
          'x-ncp-apigw-signature-v2': signature,
        },
      },
    );

    if (response.status !== 202) {
      throw new Error('Failed to send verification code');
    }
  }
}
