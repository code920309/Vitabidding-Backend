// import { HttpException, HttpStatus } from '@nestjs/common';

// export class HttpResponseFactory<T> extends HttpException {
//   constructor(
//     status: HttpStatus,
//     message: string,
//     public readonly data?: T,
//     public readonly errorId?: string,
//     public readonly domain?: string,
//   ) {
//     super(
//       { response: { statusCode: status, message, errorId, domain, data } },
//       status,
//     );
//   }

//   static getDefaultMessage(status: HttpStatus): string {
//     const statusMessages: { [key in HttpStatus]?: string } = {
//       * Informational responses (100–199)
//       [HttpStatus.CONTINUE]: 'Continue', // 100: 클라이언트가 요청을 계속할 것을 지시할 때 사용
//       [HttpStatus.SWITCHING_PROTOCOLS]: 'Switching Protocols', // 101: 서버가 프로토콜 변경을 승인할 때 사용

//       * Success responses (200–299)
//       [HttpStatus.OK]: 'OK', // 200: 요청이 성공적으로 수행되었음을 나타냄
//       [HttpStatus.CREATED]: 'Created', // 201: 요청으로 인해 리소스가 성공적으로 생성되었음을 나타냄
//       [HttpStatus.ACCEPTED]: 'Accepted', // 202: 요청이 수락되었지만 처리가 완료되지 않았음을 나타냄
//       [HttpStatus.NON_AUTHORITATIVE_INFORMATION]:
//         'Non-Authoritative Information', // 203: 서버가 다른 소스로부터 수신한 정보를 포함할 때 사용
//       [HttpStatus.NO_CONTENT]: 'No Content', // 204: 요청이 성공했으나 반환할 콘텐츠가 없음을 나타냄
//       [HttpStatus.RESET_CONTENT]: 'Reset Content', // 205: 클라이언트가 문서를 초기화해야 함을 나타냄
//       [HttpStatus.PARTIAL_CONTENT]: 'Partial Content', // 206: 서버가 일부만 반환했음을 나타냄

//       * Redirection messages (300–399)
//       * [HttpStatus.MULTIPLE_CHOICES]: 'Multiple Choices', // 300: 여러 선택지가 있을 때 사용 (Nest 미지원)
//       [HttpStatus.MOVED_PERMANENTLY]: 'Moved Permanently', // 301: 리소스가 영구적으로 이동했음을 나타냄
//       [HttpStatus.FOUND]: 'Found', // 302: 임시적으로 리소스가 다른 위치에 있음을 나타냄
//       [HttpStatus.SEE_OTHER]: 'See Other', // 303: 다른 URI를 참조할 것을 권장할 때 사용
//       [HttpStatus.NOT_MODIFIED]: 'Not Modified', // 304: 리소스가 수정되지 않았음을 나타냄
//       [HttpStatus.TEMPORARY_REDIRECT]: 'Temporary Redirect', // 307: 요청한 리소스가 임시로 이동했음을 나타냄
//       [HttpStatus.PERMANENT_REDIRECT]: 'Permanent Redirect', // 308: 요청한 리소스가 영구적으로 이동했음을 나타냄

//       * Client error responses (400–499)
//       [HttpStatus.BAD_REQUEST]: 'Bad Request', // 400: 클라이언트의 잘못된 요청을 나타냄
//       [HttpStatus.UNAUTHORIZED]: 'Unauthorized', // 401: 인증이 필요한 요청에 대해 권한이 없음을 나타냄
//       [HttpStatus.FORBIDDEN]: 'Forbidden', // 403: 요청이 금지되었음을 나타냄
//       [HttpStatus.NOT_FOUND]: 'Not Found', // 404: 요청한 리소스를 찾을 수 없음을 나타냄
//       [HttpStatus.METHOD_NOT_ALLOWED]: 'Method Not Allowed', // 405: 허용되지 않은 HTTP 메서드를 사용할 때 발생
//       [HttpStatus.CONFLICT]: 'Conflict', // 409: 요청이 현재 서버 상태와 충돌할 때 사용
//       [HttpStatus.GONE]: 'Gone', // 410: 요청한 리소스가 더 이상 존재하지 않음을 나타냄
//       [HttpStatus.UNPROCESSABLE_ENTITY]: 'Unprocessable Entity', // 422: 요청은 이해했으나 처리할 수 없을 때 사용
//       [HttpStatus.TOO_MANY_REQUESTS]: 'Too Many Requests', // 429: 클라이언트가 너무 많은 요청을 보낼 때 사용

//       * Server error responses (500–599)
//       [HttpStatus.INTERNAL_SERVER_ERROR]: 'Internal Server Error', // 500: 서버에 예기치 않은 오류가 발생했을 때 사용
//       [HttpStatus.NOT_IMPLEMENTED]: 'Not Implemented', // 501: 서버가 요청된 기능을 지원하지 않을 때 사용
//       [HttpStatus.BAD_GATEWAY]: 'Bad Gateway', // 502: 게이트웨이 서버가 유효하지 않은 응답을 받을 때 사용
//       [HttpStatus.SERVICE_UNAVAILABLE]: 'Service Unavailable', // 503: 서버가 일시적으로 사용할 수 없을 때 사용
//       [HttpStatus.GATEWAY_TIMEOUT]: 'Gateway Timeout', // 504: 게이트웨이 서버가 응답을 받지 못했을 때 사용
//       [HttpStatus.HTTP_VERSION_NOT_SUPPORTED]: 'HTTP Version Not Supported', // 505: 서버가 요청된 HTTP 버전을 지원하지 않을 때 사용
//     };
//     return statusMessages[status] || 'An error occurred';
//   }

//   * 성공
//   static success<T>(status: HttpStatus, message: string, data?: T) {
//     return new HttpResponseFactory(status, message, data);
//   }

//   * 실패
//   static failure(status: HttpStatus, message: string, errorDomain: string) {
//     const errorId = BusinessException.genId();
//     return new HttpResponseFactory(
//       status,
//       message,
//       undefined,
//       errorId,
//       errorDomain,
//     );
//   }

//   * BusinessException을 받아 응답을 생성하는 메서드
//   static fromBusinessException(exception: BusinessException) {
//     * const clientMessage = 'An error occurred. Please try again later.';
//     return new HttpResponseFactory(
//       exception.status,
//       exception.apiMessage,
//       undefined,
//       exception.id,
//       exception.domain,
//     );
//   }

//   * 각 HTTP 상태 코드에 대한 정적 메서드
//   * 200 OK 생성자 - 요청이 성공적으로 처리된 경우
//   * (예: 데이터 조회 요청 성공)
//   static OK<T>(
//     message = HttpResponseFactory.getDefaultMessage(HttpStatus.OK),
//     data?: T,
//   ) {
//     return this.success(HttpStatus.OK, message, data);
//   }

//   * 201 Created 생성자 - 요청이 성공적으로 처리되었으며 새로운 리소스가 생성된 경우
//   * (예: 새 사용자 계정 생성 성공)
//   static Created<T>(
//     message = HttpResponseFactory.getDefaultMessage(HttpStatus.CREATED),
//     data?: T,
//   ) {
//     return this.success(HttpStatus.CREATED, message, data);
//   }

//   * 204 No Content 생성자 - 요청이 성공했지만 응답 본문이 없는 경우
//   * (예: 삭제 요청이 성공했으나 추가 데이터가 필요 없을 때)
//   static NoContent(
//     message = HttpResponseFactory.getDefaultMessage(HttpStatus.NO_CONTENT),
//   ) {
//     return this.success(HttpStatus.NO_CONTENT, message);
//   }

//   * 400 Bad Request 생성자 - 요청이 잘못된 경우
//   * (예: 필수 필드가 누락되거나 잘못된 데이터 형식 전송)
//   static BadRequest(
//     message = HttpResponseFactory.getDefaultMessage(HttpStatus.BAD_REQUEST),
//   ) {
//     return this.failure(HttpStatus.BAD_REQUEST, message, 'generic');
//   }

//   * 401 Unauthorized 생성자 - 인증이 필요한 요청에 인증되지 않은 클라이언트가 접근한 경우
//   * (예: 로그인되지 않은 사용자가 보호된 리소스 요청)
//   static Unauthorized(
//     message = HttpResponseFactory.getDefaultMessage(HttpStatus.UNAUTHORIZED),
//   ) {
//     return this.failure(HttpStatus.UNAUTHORIZED, message, 'auth');
//   }

//   * 403 Forbidden 생성자 - 클라이언트에게 요청에 대한 권한이 없는 경우
//   * (예: 일반 사용자가 관리자 전용 리소스에 접근 시도)
//   static Forbidden(
//     message = HttpResponseFactory.getDefaultMessage(HttpStatus.FORBIDDEN),
//   ) {
//     return this.failure(HttpStatus.FORBIDDEN, message, 'auth');
//   }

//   * 404 Not Found 생성자 - 서버에서 요청한 리소스를 찾을 수 없는 경우
//   * (예: 존재하지 않는 사용자의 프로필 조회 시도)
//   static NotFound(
//     message = HttpResponseFactory.getDefaultMessage(HttpStatus.NOT_FOUND),
//   ) {
//     return this.failure(HttpStatus.NOT_FOUND, message, 'generic');
//   }

//   * 405 Method Not Allowed 생성자 - 요청한 HTTP 메소드가 서버에서 허용되지 않는 경우
//   * (예: GET 메소드로 업데이트 시도)
//   static MethodNotAllowed(
//     message = HttpResponseFactory.getDefaultMessage(
//       HttpStatus.METHOD_NOT_ALLOWED,
//     ),
//   ) {
//     return this.failure(HttpStatus.METHOD_NOT_ALLOWED, message, 'generic');
//   }

//   * 409 Conflict 생성자 - 요청이 현재 리소스 상태와 충돌하는 경우
//   * (예: 이미 존재하는 사용자명으로 새 계정 생성 시도)
//   static Conflict(
//     message = HttpResponseFactory.getDefaultMessage(HttpStatus.CONFLICT),
//   ) {
//     return this.failure(HttpStatus.CONFLICT, message, 'user');
//   }

//   * 410 Gone 생성자 - 요청한 리소스가 영구적으로 삭제된 경우
//   * (예: 서버에서 영구 삭제된 데이터를 조회하려는 경우)
//   static Gone(
//     message = HttpResponseFactory.getDefaultMessage(HttpStatus.GONE),
//   ) {
//     return this.failure(HttpStatus.GONE, message, 'generic');
//   }

//   * 422 Unprocessable Entity 생성자 - 요청이 구문상 옳지만 처리할 수 없는 경우
//   * (예: 비밀번호가 너무 짧아 유효성 검사를 통과하지 못할 때)
//   static UnprocessableEntity(
//     message = HttpResponseFactory.getDefaultMessage(
//       HttpStatus.UNPROCESSABLE_ENTITY,
//     ),
//   ) {
//     return this.failure(HttpStatus.UNPROCESSABLE_ENTITY, message, 'generic');
//   }

//   * 429 Too Many Requests 생성자 - 클라이언트가 짧은 시간에 너무 많은 요청을 보낸 경우
//   * (예: 짧은 시간 내에 과도한 로그인 시도)
//   static TooManyRequests(
//     message = HttpResponseFactory.getDefaultMessage(
//       HttpStatus.TOO_MANY_REQUESTS,
//     ),
//   ) {
//     return this.failure(HttpStatus.TOO_MANY_REQUESTS, message, 'generic');
//   }

//   * 500 Internal Server Error 생성자 - 서버의 예기치 않은 오류로 요청을 처리할 수 없는 경우
//   * (예: 서버의 로직 오류로 인해 예외 발생)
//   static InternalError(
//     message = HttpResponseFactory.getDefaultMessage(
//       HttpStatus.INTERNAL_SERVER_ERROR,
//     ),
//   ) {
//     return this.failure(HttpStatus.INTERNAL_SERVER_ERROR, message, 'generic');
//   }

//   * 501 Not Implemented 생성자 - 서버에서 요청한 기능을 지원하지 않는 경우
//   * (예: 서버가 특정 HTTP 메소드를 지원하지 않는 경우)
//   static NotImplemented(
//     message = HttpResponseFactory.getDefaultMessage(HttpStatus.NOT_IMPLEMENTED),
//   ) {
//     return this.failure(HttpStatus.NOT_IMPLEMENTED, message, 'generic');
//   }

//   * 502 Bad Gateway 생성자 - 서버가 게이트웨이로서 잘못된 응답을 받은 경우
//   * (예: 서버가 외부 API로부터 올바르지 않은 응답을 받은 경우)
//   static BadGateway(
//     message = HttpResponseFactory.getDefaultMessage(HttpStatus.BAD_GATEWAY),
//   ) {
//     return this.failure(HttpStatus.BAD_GATEWAY, message, 'generic');
//   }

//   * 503 Service Unavailable 생성자 - 서버가 일시적인 과부하 또는 유지보수로 요청을 처리할 수 없는 경우
//   * (예: 서버가 과부하 상태이거나 점검 중일 때)
//   static ServiceUnavailable(
//     message = HttpResponseFactory.getDefaultMessage(
//       HttpStatus.SERVICE_UNAVAILABLE,
//     ),
//   ) {
//     return this.failure(HttpStatus.SERVICE_UNAVAILABLE, message, 'generic');
//   }

//   * 504 Gateway Timeout 생성자 - 게이트웨이 역할을 하는 서버가 시간 내에 응답을 받지 못한 경우
//   * (예: 서버가 외부 API 호출 중 시간 초과)
//   static GatewayTimeout(
//     message = HttpResponseFactory.getDefaultMessage(HttpStatus.GATEWAY_TIMEOUT),
//   ) {
//     return this.failure(HttpStatus.GATEWAY_TIMEOUT, message, 'generic');
//   }

//   * 505 HTTP Version Not Supported 생성자 - 서버가 지원하지 않는 HTTP 버전을 사용하는 경우
//   * (예: 클라이언트가 사용 중인 HTTP 버전을 서버가 지원하지 않을 때)
//   static HTTPVersionNotSupported(
//     message = HttpResponseFactory.getDefaultMessage(
//       HttpStatus.HTTP_VERSION_NOT_SUPPORTED,
//     ),
//   ) {
//     return this.failure(
//       HttpStatus.HTTP_VERSION_NOT_SUPPORTED,
//       message,
//       'generic',
//     );
//   }
// }
