// src/auth/dto/create-user.dto.2.ts
/**
 * 회원가입 2단계에 필요한 추가 사용자 정보 전송 객체
 */
export type CreateUserDto2 = {
  realName: string;
  phone: string;
  address: {
    zipCode: string;
    streetAddress1: string;
    streetAddress2: string;
    state: string;
  };
  agreement: {
    usagePolicyV: boolean | null;
    personalInformationV: boolean | null;
  };
};
