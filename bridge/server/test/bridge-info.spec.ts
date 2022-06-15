import request from 'supertest';
import { setupServer } from '../.jest/setupServer';
import { Express } from 'express';

describe('Test /bridgeInfo', () => {
  let app: Express;
  const originalEnv = process.env;

  beforeAll(async () => {
    process.env = {
      ...originalEnv,
      AUTOMATIC_PROVISIONING_MSG: '  message   ',
      AUTH_MSG: 'a string',
    };
    app = await setupServer();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should return bridgeInfo', async () => {
    const response = await request(app).get('/api/bridgeInfo');
    console.log(response.body)
    expect(response.body).toEqual({
      bridgeVersion: 'develop',
      apiUrl: global.baseUrl,
      apiToken: 'apiToken',
      cliDownloadLink: 'https://github.com/keptn/keptn/releases',
      enableVersionCheckFeature: true,
      showApiToken: true,
      featureFlags: {
        RESOURCE_SERVICE_ENABLED: false,
        D3_HEATMAP_ENABLED: false,
      },
      authType: 'NONE',
      automaticProvisioningMsg: 'message',
      authMsg: 'a string',
    });
    expect(response.statusCode).toBe(200);
  });
});
