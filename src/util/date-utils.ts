// src/util/date-utils.ts

/**
 * 지정된 날짜에 주어진 일 수를 추가
 * @param date 기준 날짜
 * @param days 추가할 일 수
 * @returns 새로운 날짜 객체
 */
export function addDays(date: Date, days: number): Date {
  const newDate = new Date(date);
  newDate.setDate(date.getDate() + days);
  return newDate;
}
