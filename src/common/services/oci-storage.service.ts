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
    const authProvider = new ConfigFileAuthenticationDetailsProvider(
      this.configService.get<string>('OCI_CONFIG_FILE'),
    );

    this.client = new ObjectStorageClient({
      authenticationDetailsProvider: authProvider,
    });

    this.initializeNamespace();
  }

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

    // Generate Preauthenticated Request (PAR) URL
    return this.createPAR(bucketName, objectName);
  }

  async createPAR(bucketName: string, objectName: string): Promise<string> {
    console.log('---[DEBUG] Creating Preauthenticated Request---');

    const parDetails: models.CreatePreauthenticatedRequestDetails = {
      name: `PAR for ${objectName}`,
      objectName,
      accessType:
        models.CreatePreauthenticatedRequestDetails.AccessType.ObjectRead,
      timeExpires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days expiry
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

  async deleteObject(bucketName: string, imageUrl: string): Promise<void> {
    try {
      // 정확한 objectName 추출
      const objectName = imageUrl.split('/o/')[1]; // 'products/<product_id>/<file_name>'만 추출
      if (!objectName) {
        console.warn('Invalid objectName. Skipping deletion:', imageUrl);
        return;
      }

      console.log('---[DEBUG] Attempting to Delete Object---', objectName);

      // 삭제 요청
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
