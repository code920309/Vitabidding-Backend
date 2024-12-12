import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ObjectStorageClient, requests, models } from 'oci-objectstorage';
import { ConfigFileAuthenticationDetailsProvider } from 'oci-common';
import { Readable } from 'stream';

@Injectable()
export class OCIStorageService {
  private client: ObjectStorageClient;
  private namespace: string;

  constructor(private readonly configService: ConfigService) {
    // 인증 정보를 사용하여 ObjectStorageClient 생성
    const authProvider = new ConfigFileAuthenticationDetailsProvider(
      this.configService.get<string>('OCI_CONFIG_FILE'),
    );

    this.client = new ObjectStorageClient({
      authenticationDetailsProvider: authProvider,
    });

    // 네임스페이스 초기화
    this.initializeNamespace();
  }

  /**
   * 네임스페이스를 초기화하는 메서드
   * - OCI Object Storage에서 네임스페이스 정보를 가져옵니다.
   */
  private async initializeNamespace() {
    try {
      const namespaceResponse = await this.client.getNamespace({});
      this.namespace = namespaceResponse.value;
      console.log('Namespace initialized:', this.namespace);
    } catch (error) {
      console.error('Failed to initialize namespace:', error);
      throw error;
    }
  }

  /**
   * 파일을 업로드하는 메서드
   * - Object Storage에 파일을 업로드합니다.
   * - 업로드된 파일에 대해 Preauthenticated Request (PAR) URL을 생성하여 반환합니다.
   * @param bucketName 업로드할 버킷 이름
   * @param objectName 업로드할 객체 이름
   * @param fileStream 파일의 읽기 스트림
   * @param contentType 파일의 MIME 타입
   * @returns 생성된 PAR URL
   */
  async uploadObject(
    bucketName: string,
    objectName: string,
    fileStream: Readable,
    contentType: string,
  ): Promise<string> {
    console.log('---[DEBUG] Upload Object Start---');
    console.log('Bucket Name:', bucketName);
    console.log('Object Name:', objectName);
    console.log('Content Type:', contentType);

    // 파일 내용을 읽어서 버퍼로 변환
    const chunks: Buffer[] = [];
    for await (const chunk of fileStream) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);
    const contentLength = buffer.length;

    console.log('Content Length:', contentLength);

    const putObjectRequest: requests.PutObjectRequest = {
      namespaceName: this.namespace,
      bucketName,
      objectName,
      contentLength,
      contentType,
      putObjectBody: buffer,
    };

    try {
      await this.client.putObject(putObjectRequest);
      console.log('---[DEBUG] Upload Successful---');
    } catch (error) {
      console.error('---[ERROR] Upload Failed---');
      console.error('Error Details:', error);
      throw error;
    }

    // PAR URL 생성 및 반환
    return this.createPAR(bucketName, objectName);
  }

  /**
   * Preauthenticated Request (PAR) URL을 생성하는 메서드
   * - 특정 객체에 대한 읽기 전용 액세스 URL을 생성합니다.
   * @param bucketName 대상 버킷 이름
   * @param objectName 대상 객체 이름
   * @returns 생성된 PAR URL
   */
  async createPAR(bucketName: string, objectName: string): Promise<string> {
    console.log('---[DEBUG] Creating Preauthenticated Request---');

    const parDetails: models.CreatePreauthenticatedRequestDetails = {
      name: `PAR for ${objectName}`,
      objectName,
      accessType:
        models.CreatePreauthenticatedRequestDetails.AccessType.ObjectRead,
      timeExpires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 365일 유효기간
    };

    const createParRequest: requests.CreatePreauthenticatedRequestRequest = {
      namespaceName: this.namespace,
      bucketName,
      createPreauthenticatedRequestDetails: parDetails,
    };

    try {
      const response =
        await this.client.createPreauthenticatedRequest(createParRequest);
      const parUrl = `https://${this.namespace}.objectstorage.${this.configService.get<string>('OCI_REGION')}.oci.customer-oci.com${response.preauthenticatedRequest.accessUri}`;
      console.log('---[DEBUG] PAR URL Created---', parUrl);
      return parUrl;
    } catch (error) {
      console.error('---[ERROR] Failed to Create PAR---');
      console.error('Error Details:', error);
      throw error;
    }
  }

  /**
   * 객체를 삭제하는 메서드
   * - Object Storage에서 지정된 객체를 삭제합니다.
   * @param bucketName 삭제할 객체가 포함된 버킷 이름
   * @param imageUrl 삭제할 객체의 URL
   */
  async deleteObject(bucketName: string, imageUrl: string): Promise<void> {
    try {
      // 정확한 objectName 추출
      const objectName = imageUrl.split('/o/')[1]; // 'products/<product_id>/<file_name>' 형태로 추출
      if (!objectName) {
        console.warn('Invalid objectName. Skipping deletion:', imageUrl);
        return;
      }

      console.log('---[DEBUG] Attempting to Delete Object---', objectName);

      // 삭제 요청 실행
      await this.client.deleteObject({
        namespaceName: this.namespace,
        bucketName,
        objectName,
      });

      console.log('---[DEBUG] Object Deleted Successfully---', objectName);
    } catch (error) {
      if (error.statusCode === 404) {
        console.warn('Object Not Found, Skipping Deletion:', imageUrl);
      } else {
        console.error('Failed to Delete Object:', imageUrl, error);
        throw error;
      }
    }
  }
}
