declare module 'passport-microsoft' {
  import {
    Strategy as OAuth2Strategy,
    StrategyOptions as OAuth2StrategyOptions,
  } from 'passport-oauth2';

  export interface StrategyOptions extends Partial<OAuth2StrategyOptions> {
    clientID: string;
    clientSecret: string;
    callbackURL: string;
    scope?: string[];
    tenant?: string;
    authorizationURL?: string;
    tokenURL?: string;
    graphApiVersion?: string;
    addUPNAsEmail?: boolean;
    apiEntryPoint?: string;
  }

  export class Strategy extends OAuth2Strategy {
    name: string;
    constructor(
      options: StrategyOptions,
      verify: (
        accessToken: string,
        refreshToken: string,
        profile: unknown,
        done: (error: Error | null, user?: Express.User) => void,
      ) => void,
    );
  }
}
