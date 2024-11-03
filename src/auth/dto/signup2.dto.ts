// src/auth/dto/signup2.dto.ts
export type Signup2Dto = {
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
