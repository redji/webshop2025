import { Controller, Get, HttpCode, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { ProviderConfiguredGuard } from './guards/provider-configured.guard';
import { SessionGuard } from './guards/session.guard';
import { SESSION_COOKIE, type PublicUser } from './types';
import type { User } from './entities/user.entity';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Get('providers')
  listProviders() {
    return { providers: this.authService.getConfiguredProviders() };
  }

  @Get('google')
  @UseGuards(ProviderConfiguredGuard('google'), AuthGuard('google'))
  googleStart() {
    // Passport redirects to Google.
  }

  @Get('google/callback')
  @UseGuards(ProviderConfiguredGuard('google'), AuthGuard('google'))
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    return this.finishOAuth(req.user as User, res);
  }

  @Get('microsoft')
  @UseGuards(ProviderConfiguredGuard('microsoft'), AuthGuard('microsoft'))
  microsoftStart() {
    // Passport redirects to Microsoft.
  }

  @Get('microsoft/callback')
  @UseGuards(ProviderConfiguredGuard('microsoft'), AuthGuard('microsoft'))
  async microsoftCallback(@Req() req: Request, @Res() res: Response) {
    return this.finishOAuth(req.user as User, res);
  }

  @Get('facebook')
  @UseGuards(ProviderConfiguredGuard('facebook'), AuthGuard('facebook'))
  facebookStart() {
    // Passport redirects to Facebook.
  }

  @Get('facebook/callback')
  @UseGuards(ProviderConfiguredGuard('facebook'), AuthGuard('facebook'))
  async facebookCallback(@Req() req: Request, @Res() res: Response) {
    return this.finishOAuth(req.user as User, res);
  }

  @Get('me')
  async me(@Req() req: Request) {
    const token = req.cookies?.[SESSION_COOKIE] as string | undefined;
    const user = await this.authService.findUserBySessionToken(token);
    return { user };
  }

  @Post('logout')
  @HttpCode(204)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = req.cookies?.[SESSION_COOKIE] as string | undefined;
    await this.authService.revokeSession(token);
    res.clearCookie(SESSION_COOKIE, this.cookieOptions());
  }

  @Get('session')
  @UseGuards(SessionGuard)
  session(@CurrentUser() user: PublicUser) {
    return { user };
  }

  private async finishOAuth(user: User, res: Response) {
    const { token, expiresAt } = await this.authService.createSession(user);
    res.cookie(SESSION_COOKIE, token, {
      ...this.cookieOptions(),
      expires: expiresAt,
    });
    const frontendUrl = this.config.get<string>('FRONTEND_URL', 'http://localhost:3000');
    return res.redirect(`${frontendUrl.replace(/\/$/, '')}/account`);
  }

  private cookieOptions() {
    const secure = this.config.get<string>('COOKIE_SECURE', 'false') === 'true';
    const sameSite = (this.config.get<string>('COOKIE_SAME_SITE', 'lax') || 'lax') as
      'lax' | 'strict' | 'none';
    return {
      httpOnly: true,
      secure,
      sameSite,
      path: '/',
    };
  }
}
