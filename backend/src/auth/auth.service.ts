/* eslint-disable */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Nonce } from '@prisma/client';
import { randomBytes } from 'crypto';
import { SiweMessage } from 'siwe';
import { ethers } from 'ethers';
import { addDays } from 'date-fns';
import jwt from 'jsonwebtoken';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------- constants ----------
  private readonly ACCESS_TOKEN_EXP_MIN = 15; // minutes
  private readonly REFRESH_TOKEN_EXP_DAYS = 7;

  // ---------- generate nonce ---------- //
  // Generate nonce and store it in the database with an expiration time
  async generateNonce(): Promise<{ nonce: string }> {
    try {
      const nonceValue = randomBytes(16).toString('hex');
      const expirationDate = new Date(Date.now() + 10 * 60 * 1000);

      const nonceRecord: Nonce = await this.prisma.nonce.create({
        data: {
          value: nonceValue,
          expiresAt: expirationDate,
        },
      });

      return { nonce: nonceRecord.value };
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(`Failed to generate nonce: ${error.message}`);
      }
      throw new Error('Failed to generate nonce: Unknown error');
    }
  }

  // ---------- verify signature ----------//
  // Verify the SIWE message and signature, then create tokens
  async verifySignature(message: string, signature: string) {
    try {
      // Parse SIWE message
      const siweMessage = new SiweMessage(message);

      // Verify signature
      const recovered = ethers.verifyMessage(
        siweMessage.prepareMessage(),
        signature,
      );
      if (recovered.toLowerCase() !== siweMessage.address.toLowerCase()) {
        throw new Error('Invalid signature');
      }

      // Validate nonce
      const nonceRecord = await this.prisma.nonce.findUnique({
        where: { value: siweMessage.nonce },
      });

      if (
        !nonceRecord ||
        nonceRecord.used ||
        nonceRecord.expiresAt < new Date()
      ) {
        throw new Error('Invalid or expired nonce');
      }

      // Mark nonce as used
      await this.prisma.nonce.update({
        where: { id: nonceRecord.id },
        data: { used: true },
      });

      // Upsert user & wallet
      const user = await this.prisma.user.upsert({
        where: { id: siweMessage.address.toLowerCase() },
        update: {},
        create: {
          wallets: {
            create: {
              address: siweMessage.address.toLowerCase(),
              chainId: Number(siweMessage.chainId),
            },
          },
        },
      });

      // Create refresh token
      const refreshToken = randomBytes(32).toString('hex');
      const refreshExp = addDays(new Date(), this.REFRESH_TOKEN_EXP_DAYS);

      await this.prisma.session.create({
        data: {
          refreshToken,
          userId: user.id,
          expiresAt: refreshExp,
        },
      });

      // Create access token
      const accessToken = jwt.sign(
        { sub: user.id, address: siweMessage.address },
        process.env.JWT_SECRET as string,
        { expiresIn: `${this.ACCESS_TOKEN_EXP_MIN}m` },
      );

      return { accessToken, refreshToken };
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(`Signature verification failed: ${error.message}`);
      }
      throw new Error('Signature verification failed: Unknown error');
    }
  }
}
