import { Body, Controller, Get, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('siwe/nonce')
  @ApiOperation({ summary: 'Generate a random nonce for SIWE' })
  @ApiResponse({
    status: 200,
    description: 'Return a nonce',
    schema: { example: { nonce: 'abc123' } },
  })
  async getNonce() {
    return this.authService.generateNonce();
  }

  @Post('siwe/verify')
  @ApiOperation({ summary: 'Verify SIWE signature and return tokens' })
  @ApiResponse({
    status: 200,
    description: 'Access and refresh tokens',
    schema: {
      example: { accessToken: '...', refreshToken: '...' },
    },
  })
  async verify(@Body() body: { message: string; signature: string }) {
    return this.authService.verifySignature(body.message, body.signature);
  }
}
