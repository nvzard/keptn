import { EnvType, EnvVar, getConfiguration } from './configuration';
import { LogDestination } from './logger';

describe('Configuration', () => {
  beforeEach(() => {
    cleanEnv();
    process.env[EnvVar.API_TOKEN] = 'some value to do not run kubectl cmds as part of the tests';
  });
  afterEach(() => {
    cleanEnv();
  });

  function cleanEnv() {
    for (const e in EnvVar) {
      delete process.env[e];
    }
  }

  const defaultAPIURL = 'http://localhost';
  const defaultAPIToken = 'abcdefgh';

  function setBasicEnvVar() {
    process.env[EnvVar.API_URL] = defaultAPIURL;
    process.env[EnvVar.API_TOKEN] = defaultAPIToken;
    process.env[EnvVar.MONGODB_HOST] = '';
    process.env[EnvVar.MONGODB_USER] = '';
    process.env[EnvVar.MONGODB_PASSWORD] = '';
  }

  it('should use default values', () => {
    setBasicEnvVar();
    const result = getConfiguration();
    // logging
    expect(result.logging.destination).toBe(LogDestination.STDOUT);
    expect(result.logging.enabledComponents).toStrictEqual({});
    // api
    expect(result.api.showToken).toStrictEqual(true);
    expect(result.api.token).toStrictEqual(defaultAPIToken);
    expect(result.api.url).toStrictEqual(defaultAPIURL);
    // Auth
    expect(result.auth.authMessage).toStrictEqual(
      `keptn auth --endpoint=${defaultAPIURL} --api-token=${defaultAPIToken}`
    );
    expect(result.auth.basicPassword).toStrictEqual(undefined);
    expect(result.auth.basicUsername).toStrictEqual(undefined);
    expect(result.auth.cleanBucketIntervalMs).toStrictEqual(60 * 60 * 1000); //1h
    expect(result.auth.requestTimeLimitMs).toStrictEqual(60 * 60 * 1000); //1h
    expect(result.auth.nRequestWithinTime).toStrictEqual(10);
    // OAuth
    expect(result.oauth.allowedLogoutURL).toStrictEqual('');
    expect(result.oauth.baseURL).toStrictEqual('');
    expect(result.oauth.clientID).toStrictEqual('');
    expect(result.oauth.clientSecret).toStrictEqual(undefined);
    expect(result.oauth.discoveryURL).toStrictEqual('');
    expect(result.oauth.enabled).toStrictEqual(false);
    expect(result.oauth.nameProperty).toStrictEqual(undefined);
    expect(result.oauth.scope).toStrictEqual('');
    expect(result.oauth.session.secureCookie).toStrictEqual(false);
    expect(result.oauth.session.timeoutMin).toStrictEqual(60);
    expect(result.oauth.session.trustProxyHops).toStrictEqual(1);
    expect(result.oauth.session.validationTimeoutMin).toStrictEqual(60);
    expect(result.oauth.tokenAlgorithm).toStrictEqual('RS256');
    // URL
    expect(result.urls.CLI).toStrictEqual('https://github.com/keptn/keptn/releases');
    expect(result.urls.integrationPage).toStrictEqual('https://get.keptn.sh/integrations.html');
    expect(result.urls.lookAndFeel).toStrictEqual(undefined);
    // features
    expect(result.features.automaticProvisioningMessage).toStrictEqual('');
    expect(result.features.configDir).toMatch(/config$/);
    expect(result.features.installationType).toStrictEqual('QUALITY_GATES,CONTINUOUS_OPERATIONS,CONTINUOUS_DELIVERY');
    expect(result.features.pageSize.project).toStrictEqual(50);
    expect(result.features.pageSize.service).toStrictEqual(50);
    expect(result.features.prefixPath).toStrictEqual('/');
    expect(result.features.versionCheck).toStrictEqual(true);
    // mongo
    expect(result.mongo.db).toStrictEqual('openid');
    expect(result.mongo.host).toStrictEqual('');
    expect(result.mongo.password).toStrictEqual('');
    expect(result.mongo.user).toStrictEqual('');

    expect(result.mode).toStrictEqual(EnvType.DEV);
    expect(result.version).toStrictEqual('develop');
  });

  it('should set values using options object', () => {
    setBasicEnvVar();
    const oauthBaseUrl = 'mybaseurl';
    const oauthClientID = 'myclientid';
    const oauthDiscovery = 'mydiscovery';
    const apiUrl = 'myapiurl';
    const apiToken = 'mytoken';
    const version = '0.0.0';
    let result = getConfiguration({
      logging: {
        enabledComponents: 'a=true,b=false,c=true',
      },
      oauth: {
        baseURL: oauthBaseUrl,
        clientID: oauthClientID,
        discoveryURL: oauthDiscovery,
        enabled: true,
      },
      api: {
        showToken: false,
        token: apiToken,
        url: apiUrl,
      },
      mode: 'test',
      version: version,
    });
    expect(result.logging.destination).toBe(LogDestination.STDOUT);
    expect(result.logging.enabledComponents).toStrictEqual({
      a: true,
      b: false,
      c: true,
    });

    // api
    expect(result.api.showToken).toStrictEqual(false);
    expect(result.api.token).toStrictEqual(apiToken);
    expect(result.api.url).toStrictEqual(apiUrl);
    // Auth
    expect(result.auth.authMessage).toStrictEqual(`keptn auth --endpoint=${apiUrl} --api-token=${apiToken}`);
    expect(result.auth.basicPassword).toStrictEqual(undefined);
    expect(result.auth.basicUsername).toStrictEqual(undefined);
    expect(result.auth.cleanBucketIntervalMs).toStrictEqual(60 * 60 * 1000); //1h
    expect(result.auth.requestTimeLimitMs).toStrictEqual(60 * 60 * 1000); //1h
    expect(result.auth.nRequestWithinTime).toStrictEqual(10);
    // OAuth
    expect(result.oauth.allowedLogoutURL).toStrictEqual('');
    expect(result.oauth.baseURL).toStrictEqual(oauthBaseUrl);
    expect(result.oauth.clientID).toStrictEqual(oauthClientID);
    expect(result.oauth.clientSecret).toStrictEqual(undefined);
    expect(result.oauth.discoveryURL).toStrictEqual(oauthDiscovery);
    expect(result.oauth.enabled).toStrictEqual(true);
    expect(result.oauth.nameProperty).toStrictEqual(undefined);
    expect(result.oauth.scope).toStrictEqual('');
    expect(result.oauth.session.secureCookie).toStrictEqual(false);
    expect(result.oauth.session.timeoutMin).toStrictEqual(60);
    expect(result.oauth.session.trustProxyHops).toStrictEqual(1);
    expect(result.oauth.session.validationTimeoutMin).toStrictEqual(60);
    expect(result.oauth.tokenAlgorithm).toStrictEqual('RS256');
    // URL
    expect(result.urls.CLI).toStrictEqual('https://github.com/keptn/keptn/releases');
    expect(result.urls.integrationPage).toStrictEqual('https://get.keptn.sh/integrations.html');
    expect(result.urls.lookAndFeel).toStrictEqual(undefined);
    // features
    expect(result.features.automaticProvisioningMessage).toStrictEqual('');
    expect(result.features.configDir).toMatch(/config$/);
    expect(result.features.installationType).toStrictEqual('QUALITY_GATES,CONTINUOUS_OPERATIONS,CONTINUOUS_DELIVERY');
    expect(result.features.pageSize.project).toStrictEqual(50);
    expect(result.features.pageSize.service).toStrictEqual(50);
    expect(result.features.prefixPath).toStrictEqual('/');
    expect(result.features.versionCheck).toStrictEqual(true);
    // mongo
    expect(result.mongo.db).toStrictEqual('openid');
    expect(result.mongo.host).toStrictEqual('');
    expect(result.mongo.password).toStrictEqual('');
    expect(result.mongo.user).toStrictEqual('');

    expect(result.mode).toStrictEqual(EnvType.TEST);
    expect(result.version).toStrictEqual(version);

    // check that values can change
    result = getConfiguration({
      logging: {
        enabledComponents: 'a=false',
        destination: LogDestination.FILE,
      },
    });
    expect(result.logging.destination).toBe(LogDestination.FILE);
    expect(result.logging.enabledComponents).toStrictEqual({
      a: false,
    });
  });

  it('should fail for missing API values', () => {
    expect(getConfiguration).toThrow('API_URL is not provided');
  });

  it('should fail for missing OAuth values', () => {
    process.env[EnvVar.MONGODB_HOST] = 'mongo://';
    process.env[EnvVar.MONGODB_PASSWORD] = 'pwd';
    process.env[EnvVar.MONGODB_USER] = 'usr';
    expect(() => {
      getConfiguration({
        api: { url: 'somevalue' },
        oauth: { enabled: true },
      });
    }).toThrow(/OAUTH_.*/);
    process.env[EnvVar.OAUTH_ENABLED] = 'true';
    const t = () => {
      getConfiguration({
        api: { url: 'somevalue' },
      });
    };
    expect(t).toThrow(/OAUTH_.*/);
    process.env[EnvVar.OAUTH_DISCOVERY] = 'http://keptn';
    expect(t).toThrow(/OAUTH_.*/);
    process.env[EnvVar.OAUTH_CLIENT_ID] = 'abcdefg';
    expect(t).toThrow(/OAUTH_.*/);
    process.env[EnvVar.OAUTH_BASE_URL] = 'http://keptn';
    expect(t).not.toThrow();
  });

  it('should fail for missing Mongo values', () => {
    process.env[EnvVar.API_URL] = 'http://localhost';
    expect(getConfiguration).toThrow(/Could not construct mongodb connection string.*/);
    process.env[EnvVar.MONGODB_HOST] = 'mongo://';
    expect(getConfiguration).toThrow(/Could not construct mongodb connection string.*/);
    process.env[EnvVar.MONGODB_PASSWORD] = 'pwd';
    expect(getConfiguration).toThrow(/Could not construct mongodb connection string.*/);
    process.env[EnvVar.MONGODB_USER] = 'usr';
    expect(getConfiguration).not.toThrow();
  });

  it('should set values using env var', () => {
    setBasicEnvVar();
    process.env.LOGGING_COMPONENTS = 'a=true,b=false,c=true';
    const result = getConfiguration();
    expect(result.logging.destination).toBe(LogDestination.STDOUT);
    expect(result.logging.enabledComponents).toStrictEqual({
      a: true,
      b: false,
      c: true,
    });
  });

  it('option object should win over env var', () => {
    setBasicEnvVar();
    process.env.LOGGING_COMPONENTS = 'a=false,b=true,c=false';
    const result = getConfiguration({
      logging: {
        enabledComponents: 'a=true,b=false,c=true',
      },
    });
    expect(result.logging.destination).toBe(LogDestination.STDOUT);
    expect(result.logging.enabledComponents).toStrictEqual({
      a: true,
      b: false,
      c: true,
    });
  });

  it('should correctly eval booleans', () => {
    setBasicEnvVar();
    const result = getConfiguration({
      logging: {
        enabledComponents: 'a=tRue,b=FaLsE,c=0,d=1,e=enabled',
      },
    });
    expect(result.logging.enabledComponents).toStrictEqual({
      a: true,
      b: false,
      c: false,
      d: true,
      e: true,
    });
  });
});
