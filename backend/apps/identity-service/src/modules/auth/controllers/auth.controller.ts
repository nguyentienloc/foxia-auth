import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response, Request } from 'express';
import { AuthService } from '../services/auth.service';
import { BrowserFlowQueryDto } from '../dtos/browser-flow-query.dto';
import { FlowQueryDto } from '../dtos/flow-query.dto';
import { LogoutFlowDto } from '../dtos/logout-flow.dto';
import { LogoutFlowQueryDto } from '../dtos/logout-flow-query.dto';
import { KratosSessionGuard } from 'core/auth/guards/kratos-session.guard';
import {
  UpdateLoginFlowBody,
  UpdateRegistrationFlowBody,
} from '@ory/kratos-client';

@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('login/browser')
  @ApiOperation({ summary: 'Create a browser login flow via Kratos' })
  async createLoginFlow(
    @Query() query: BrowserFlowQueryDto,
    @Headers('cookie') cookie?: string,
    @Res({ passthrough: true }) res?: Response,
  ) {
    const result = await this.authService.createBrowserLoginFlow(query, cookie);
    this.setResponseCookies(res, result.cookies);
    return result.data;
  }

  @Post('login')
  @ApiOperation({ summary: 'Submit a login flow payload to Kratos' })
  async submitLoginFlow(
    @Query() query: FlowQueryDto,
    @Body() body: UpdateLoginFlowBody,
    @Req() req: Request,
    @Res({ passthrough: false }) res: Response,
  ) {
    const result = await this.authService.updateLoginFlow(
      query,
      body,
      req.headers.cookie,
    );
    
    // Set cookies from Kratos response BEFORE redirect
    // This is crucial for OIDC continuity session cookie
    if (result.cookies && result.cookies.length > 0) {
      if (process.env.NODE_ENV === 'development') {
        console.log('Cookies from Kratos:', result.cookies);
      }
      this.setResponseCookies(res, result.cookies);
    } else {
      if (process.env.NODE_ENV === 'development') {
        console.warn('No cookies received from Kratos response');
      }
    }
    
    // Check if response contains redirect_browser_to (OIDC flow)
    const data = result.data as any;
    if (data && data.redirect_browser_to) {
      if (process.env.NODE_ENV === 'development') {
        console.log('OIDC redirect to:', data.redirect_browser_to);
      }
      // Return HTTP 302 redirect for OIDC flow
      // Cookies are already set above, browser will include them in redirect
      return res.redirect(302, data.redirect_browser_to);
    }
    
    // For non-redirect responses, use passthrough to return JSON
    return res.json(result.data);
  }

  @Get('registration/browser')
  @ApiOperation({ summary: 'Create a browser registration flow via Kratos' })
  async createRegistrationFlow(
    @Query() query: BrowserFlowQueryDto,
    @Headers('cookie') cookie?: string,
    @Res({ passthrough: true }) res?: Response,
  ) {
    const result = await this.authService.createBrowserRegistrationFlow(
      query,
      cookie,
    );
    this.setResponseCookies(res, result.cookies);
    return result.data;
  }

  @Post('registration')
  @ApiOperation({ summary: 'Submit a registration flow payload to Kratos' })
  async submitRegistrationFlow(
    @Query() query: FlowQueryDto,
    @Body() body: UpdateRegistrationFlowBody,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.updateRegistrationFlow(
      query,
      body,
      req.headers.cookie,
    );
    this.setResponseCookies(res, result.cookies);
    return result.data;
  }

  @UseGuards(KratosSessionGuard)
  @Get('me')
  @ApiOperation({ summary: 'Return the current Kratos session and identity' })
  async me(@Req() req: Request) {
    return {
      identity: (req.user as any)?.identity ?? req.kratosSession?.identity,
      session: req.kratosSession,
    };
  }

  @Get('logout/browser')
  @ApiOperation({ summary: 'Create a logout flow / URL via Kratos' })
  async createLogoutFlow(
    @Query() query: LogoutFlowQueryDto,
    @Headers('cookie') cookie?: string,
    @Res({ passthrough: true }) res?: Response,
  ) {
    const result = await this.authService.createBrowserLogoutFlow(query, cookie);
    this.setResponseCookies(res, result.cookies);
    return result.data;
  }

  @Post('logout')
  @ApiOperation({ summary: 'Submit logout flow to Kratos' })
  async submitLogoutFlow(
    @Body() body: LogoutFlowDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.updateLogoutFlow(
      body,
      req.headers.cookie,
    );
    this.setResponseCookies(res, result.cookies);
    return { success: true };
  }

  @Get('error')
  @ApiOperation({ summary: 'Get error flow details from Kratos' })
  async getErrorFlow(
    @Query('id') errorId: string,
    @Headers('cookie') cookie?: string,
  ) {
    if (!errorId) {
      throw new BadRequestException('Error ID is required');
    }
    return await this.authService.getErrorFlow(errorId, cookie);
  }

  private setResponseCookies(res: Response, cookies?: string[]) {
    if (!cookies || cookies.length === 0) {
      return;
    }
    
    // Get Kratos cookie domain from environment or use default
    const kratosCookieDomain = process.env.KRATOS_COOKIE_DOMAIN || 'auth.foxia.vn';
    
    cookies.forEach((cookie) => {
      // Check if cookie already has domain
      let cookieToSet = cookie;
      
      if (!cookie.includes('domain=')) {
        // Cookie doesn't have domain, add it
        // This ensures cookie is set with correct domain even when forwarded through backend proxy
        const cookieParts = cookie.split(';');
        const cookieNameValue = cookieParts[0];
        const cookieAttributes = cookieParts.slice(1);
        
        // Add domain attribute
        cookieToSet = `${cookieNameValue}; domain=${kratosCookieDomain}; ${cookieAttributes.join('; ')}`;
        
        if (process.env.NODE_ENV === 'development') {
          console.log('Added domain to cookie:', cookieToSet.substring(0, 150) + '...');
        }
      } else {
        // Cookie already has domain, but ensure it's correct
        const domainMatch = cookie.match(/domain=([^;]+)/);
        if (domainMatch && domainMatch[1].trim() !== kratosCookieDomain) {
          // Replace domain with correct one
          cookieToSet = cookie.replace(/domain=[^;]+/, `domain=${kratosCookieDomain}`);
          
          if (process.env.NODE_ENV === 'development') {
            console.log('Replaced domain in cookie:', cookieToSet.substring(0, 150) + '...');
          }
        }
      }
      
      // Log cookie for debugging (only in dev)
      if (process.env.NODE_ENV === 'development') {
        console.log('Setting cookie:', cookieToSet.substring(0, 200));
        if (cookieToSet.includes('ory_kratos_oidc_auth_code_session')) {
          console.log('OIDC continuity session cookie found and will be set!');
        }
      }
      
      res.append('set-cookie', cookieToSet);
    });
  }
}
