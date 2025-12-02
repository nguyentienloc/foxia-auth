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
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.updateLoginFlow(
      query,
      body,
      req.headers.cookie,
    );
    this.setResponseCookies(res, result.cookies);
    return result.data;
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

  private setResponseCookies(res: Response, cookies?: string[]) {
    if (!cookies) {
      return;
    }
    cookies.forEach((cookie) => res.append('set-cookie', cookie));
  }
}
