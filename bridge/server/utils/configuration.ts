import { execSync } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

import { EnabledComponents, LogDestination, logger as log } from './logger';

/**
 * Option to configure the Bridge-Server
 */
export interface BridgeOption {
  logging?: LogOptions;
  oauth?: OAuthOptions;
  api?: APIOptions;
  version?: string;
  mode?: string;
}

enum EnvType {
  TEST = "test",
  DEV = "development",
}

interface LogOptions {
  destination?: LogDestination;
  enabledComponents?: string;
}

interface OAuthOptions {
  enabled?: boolean;
  discoveryURL?: string;
  baseURL?: string;
  clientID?: string;
}

interface APIOptions {
  url?: string;
  token?: string;
  showToken?: boolean;
}

/**
 * Configuration object
 */
export interface BridgeConfiguration {
  logging: LogConfiguration;
  api: APIConfig;
  auth: AuthConfig;
  oauth: OAuthConfig;
  urls: URLsConfig;
  features: FeatureConfig;
  version: string;
  mode: EnvType;
  mongo: MongoConfig;
}

interface LogConfiguration {
  destination: LogDestination;
  enabledComponents: EnabledComponents;
}

interface AuthConfig {
  requestTimeLimitMs: number;
  requestWithinTimeMs: number;
  cleanBucketIntervalMs: number;
  basicUsername?: string;
  basicPassword?: string;
  authMessage: string;
}

interface OAuthConfig {
  enabled: boolean;
  discoveryURL: string;
  baseURL: string;
  clientID: string;
  clientSecret?: string;
  scope: string;
  tokenAlgorithm: string;
  allowedLogoutURL: string;
  nameProperty?: string;
  session: OAuthSessionConfig;
}

interface OAuthSessionConfig {
  secureCookie: boolean;
  trustProxyHops: number;
  timeoutMin: number;
  validationTimeoutMin: number;
}

interface APIConfig {
  url: string;
  token: string | undefined;
  showToken: boolean;
}

interface FeatureConfig {
  pageSize: PageSizeConfiguration;
  installationType: string;
  automaticProvisioningMessage: string;
  prefixPath: string;
  configDir: string;
  versionCheck: boolean;
}

interface PageSizeConfiguration {
  project: number;
  service: number;
}

interface URLsConfig {
  lookAndFeel?: string;
  integrationPage: string;
  CLI: string;
}

interface MongoConfig {
  user: string;
  password: string;
  host: string;
  db: string;
}

const _componentName = "Configuration";

/**
 * @param options Customization options that override env var options.
 * @returns Returns the Bridge-server configuration.
 */
export function getConfiguration(options?: BridgeOption): BridgeConfiguration {

  // logging area
  const logDestination = options?.logging?.destination ?? LogDestination.STDOUT;
  const loggingComponents = Object.create({}) as EnabledComponents;
  const loggingComponentsString = options?.logging?.enabledComponents ?? process.env.LOGGING_COMPONENTS ?? '';
  if (loggingComponentsString.length > 0) {
    const components = loggingComponentsString.split(',').map((s) => s.trim());
    for (const component of components) {
      const [name, value] = parseComponent(component);
      loggingComponents[name] = value;
    }
  }
  const logConfig = {
    destination: logDestination,
    enabledComponents: loggingComponents,
  };

  // API area
  const _showToken = options?.api?.showToken ?? toBool(process.env.SHOW_API_TOKEN ?? "true");
  const apiUrl = options?.api?.url ?? process.env.API_URL;
  if (typeof(apiUrl) !== "string") {
    throw Error('API_URL is not provided');
  }
  let apiToken = options?.api?.token ?? process.env.API_TOKEN;
  if (typeof(apiUrl) !== "string") {
    log.warning(_componentName, 'API_TOKEN was not provided. Fetching it from the K8s secrets via kubectl.');
    apiToken =
      Buffer.from(
        execSync('kubectl get secret keptn-api-token -n keptn -ojsonpath={.data.keptn-api-token}').toString(),
        'base64'
      ).toString() || undefined;
    if (typeof(apiToken) !== "string"){
      log.warning(_componentName, 'Could not fetch API_TOKEN from k8s secret.');
    }
  }

  const apiConfig = {
    showToken: _showToken,
    url: apiUrl,
    token: apiToken,
  };

  // Auth Area - no configuration necessary
  const authMsg = process.env.AUTH_MSG ?? `keptn auth --endpoint=${apiUrl} --api-token=${apiToken}`;
  const basicUser = process.env.BASIC_AUTH_USERNAME;
  const basicPass = process.env.BASIC_AUTH_PASSWORD;
  const requestLimit = toInt(process.env.REQUEST_TIME_LIMIT, 60);
  const requestWithinTime = toInt(process.env.REQUESTS_WITHIN_TIME, 10);
  const cleanBucket = toInt(process.env.CLEAN_BUCKET_INTERVAL, 60);

  const authConfig = {
    authMessage: authMsg,
    basicUsername: basicUser,
    basicPassword: basicPass,
    requestTimeLimitMs: requestLimit,
    requestWithinTimeMs: requestWithinTime,
    cleanBucketIntervalMs: cleanBucket,
  };

  // OAuth area
  const logoutURL = process.env.OAUTH_ALLOWED_LOGOUT_URLS ?? '';
  const baseURL = options?.oauth?.baseURL ?? process.env.OAUTH_BASE_URL;
  const clientID = options?.oauth?.clientID ?? process.env.OAUTH_CLIENT_ID;
  const clientSecret = process.env.OAUTH_CLIENT_SECRET;
  const discoveryURL = options?.oauth?.discoveryURL ?? process.env.OAUTH_DISCOVERY;
  const enabled = options?.oauth?.enabled ?? toBool(process.env.OAUTH_ENABLED ?? "false");
  const nameProperty = process.env.OAUTH_NAME_PROPERTY;
  const scope = process.env.OAUTH_SCOPE ?? "";
  const secureCookie = toBool(process.env.SECURE_COOKIE ?? "false");
  const timeout = toInt(process.env.SESSION_TIMEOUT_MIN, 60);
  const proxyHops = toInt(process.env.TRUST_PROXY, 1);
  const validation = toInt(process.env.SESSION_VALIDATING_TIMEOUT_MIN, 60);
  const algo = process.env.OAUTH_ID_TOKEN_ALG ?? 'RS256';

  const errorSuffix =
    'must be defined when OAuth based login (OAUTH_ENABLED) is activated.' +
    ' Please check your environment variables.';
  if (typeof(discoveryURL) !== "string") {
    throw Error(`OAUTH_DISCOVERY ${errorSuffix}`);
  }
  if (typeof(clientID) !== "string") {
    throw Error(`OAUTH_CLIENT_ID ${errorSuffix}`);
  }
  if (typeof(baseURL) !== "string") {
    throw Error(`OAUTH_BASE_URL ${errorSuffix}`);
  }

  const oauthConfig = {
      allowedLogoutURL: logoutURL,
      baseURL: baseURL,
      clientID: clientID,
      clientSecret: clientSecret,
      discoveryURL: discoveryURL,
      enabled: enabled,
      nameProperty: nameProperty,
      scope: scope.trim(),
      session: {
        secureCookie: secureCookie,
        timeoutMin: timeout,
        trustProxyHops: proxyHops,
        validationTimeoutMin: validation,
      },
      tokenAlgorithm: algo,
    };

  // URL area
  const cliURL = process.env.CLI_DOWNLOAD_LINK ?? 'https://github.com/keptn/keptn/releases';
  const integrationURL = process.env.INTEGRATIONS_PAGE_LINK ?? 'https://get.keptn.sh/integrations.html';
  const looksURL = process.env.LOOK_AND_FEEL_URL;

  const urlsConfig =  {
      CLI: cliURL,
      integrationPage: integrationURL,
      lookAndFeel: looksURL,
    };

  // feature
  const provisioningMsg = process.env.AUTOMATIC_PROVISIONING_MSG ?? "";
  const configDir = process.env.CONFIG_DIR ?? join(dirname(fileURLToPath(import.meta.url)), '../../../../config');
  const installationType = process.env.KEPTN_INSTALLATION_TYPE ?? "QUALITY_GATES,CONTINUOUS_OPERATIONS,CONTINUOUS_DELIVERY";
  const projectSize = toInt(process.env.PROJECTS_PAGE_SIZE, 50); // client\app\_services\api.service.ts
  const serviceSize = toInt(process.env.SERVICES_PAGE_SIZE, 50); // no use
  const prefixPath = process.env.PREFIX_PATH ?? '/';
  const versionCheck = toBool(process.env.ENABLE_VERSION_CHECK ?? "true");

  const featConfig = {
    automaticProvisioningMessage: provisioningMsg,
    configDir: configDir,
    installationType: installationType,
    pageSize: {
      project: projectSize,
      service: serviceSize,
    },
    prefixPath: prefixPath,
    versionCheck: versionCheck,
  }

  // mongo
  const db = process.env.MONGODB_DATABASE ?? 'openid';
  const host = process.env.MONGODB_HOST;
  const pwd = process.env.MONGODB_PASSWORD;
  const usr = process.env.MONGODB_USER;

  const errMsg = 'Could not construct mongodb connection string: env vars "MONGODB_HOST", "MONGODB_USER" and "MONGODB_PASSWORD" have to be set';
  if (typeof(host) !== "string") {
    throw Error(errMsg);
  }
  if (typeof(pwd) !== "string") {
    throw Error(errMsg);
  }
  if (typeof(usr) !== "string") {
    throw Error(errMsg);
  }

  const mongoConfig: MongoConfig = {
    db: db,
    host: host,
    password: pwd,
    user: usr,
  }

  // mode and version
  const mode = process.env.NODE_ENV === "test" ? EnvType.TEST : EnvType.DEV;
  const version = process.env.VERSION ?? "develop";

  return {
    logging: logConfig,
    api: apiConfig,
    auth: authConfig,
    oauth: oauthConfig,
    urls: urlsConfig,
    features: featConfig,
    mode: mode,
    mongo: mongoConfig,
    version: version,
  };
}

function parseComponent(component: string): [string, boolean] {
  // we expect only componentName = bool
  const split = component.split('=', 3);
  return [split[0].trim(), toBool(split[1])];
}

/**
 * Convert string to boolean. If the input is equal to false or 0, it returns false. True otherwise.
 * @param v string to convert.
 */
function toBool(v: string): boolean {
  const val = v.toLowerCase();
  return val !== '0' && val !== 'false';
}

/**
 * Convert string to int. If the input cannot be converted, returns the default.
 * @param v string to convert.
 * @param d default value.
 */
function toInt(v: string | undefined, d: number): number {
  if (v != null) {
		const val = parseInt(v, 10);
    if (!isNaN(val)) {
      return val;
    }
	}
	return d;
}
