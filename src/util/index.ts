// src/util/index.ts
/**
 * 지정된 길이의 랜덤 문자열을 생성
 * @param length 생성할 문자열의 길이 (기본값: 20)
 * @returns 랜덤하게 생성된 문자열
 */
export const generateRandomString = (length = 20): string => {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  return Array.from({ length })
    .map(() => {
      const randomIndex = Math.floor(Math.random() * chars.length);
      return chars[randomIndex];
    })
    .join('');
};

/**
 * 객체를 Query String으로 변환
 * key와 value를 URL에서 사용할 수 있도록 인코딩, null 또는 undefined 값은 무시
 * @param obj 변환할 객체
 * @returns 변환된 Query String
 */
export const objectToQueryString = (obj: Record<string, any>): string => {
  return Object.keys(obj)
    .filter((key) => obj[key] != null)
    .map((key) => {
      const value = obj[key];
      if (Array.isArray(value)) {
        return value
          .map(
            (val, index) =>
              `${encodeURIComponent(key)}[${index}]=${encodeURIComponent(val)}`,
          )
          .join('&');
      }
      return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
    })
    .join('&');
};
