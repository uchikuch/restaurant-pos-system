import { Injectable, UnauthorizedException, BadRequestException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { UserDocument } from '../users/schemas/user.schema';
import { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
        private configService: ConfigService,
    ) { }

    async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
        try {
            // Create the user
            const user = await this.usersService.create(registerDto);

            // Generate tokens
            const tokens = await this.generateTokens(user);

            // Store refresh token
            await this.usersService.updateRefreshToken(user.id, tokens.refreshToken);

            // Update last login
            await this.usersService.updateLastLogin(user.id);

            return {
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken,
                user: {
                    id: user.id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    role: user.role,
                    isActive: user.isActive,
                    isEmailVerified: user.isEmailVerified,
                },
                expiresIn: this.getTokenExpirationTime(),
            };
        } catch (error) {
            if (error instanceof ConflictException) {
                throw error;
            }
            console.error('Registration error:', error);
            throw new BadRequestException('Registration failed');
        }
    }

    async login(loginDto: LoginDto): Promise<AuthResponseDto> {
        // Validate user credentials
        const user = await this.validateUser(loginDto.email, loginDto.password);

        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        if (!user.isActive) {
            throw new UnauthorizedException('Account is deactivated');
        }

        // Generate tokens
        const tokens = await this.generateTokens(user);

        // Store refresh token
        await this.usersService.updateRefreshToken(user.id, tokens.refreshToken);

        // Update last login
        await this.usersService.updateLastLogin(user.id);

        return {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            user: {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role,
                isActive: user.isActive,
                isEmailVerified: user.isEmailVerified,
            },
            expiresIn: this.getTokenExpirationTime(),
        };
    }

    async validateUser(email: string, password: string): Promise<UserDocument | null> {
        const user = await this.usersService.findByEmailWithPassword(email);

        if (!user) {
            return null;
        }

        const isPasswordValid = await this.usersService.validatePassword(password, user.password);

        if (!isPasswordValid) {
            return null;
        }

        return user;
    }

    async refreshTokens(refreshToken: string): Promise<AuthResponseDto> {
        try {
            // Verify refresh token
            const payload = this.jwtService.verify(refreshToken, {
                secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
            });

            // Find user and validate refresh token
            const user = await this.usersService.findById(payload.sub);
            if (!user) {
                throw new UnauthorizedException('User not found');
            }

            if (!user.isActive) {
                throw new UnauthorizedException('Account is deactivated');
            }

            const isRefreshTokenValid = await this.usersService.validateRefreshToken(
                user.id,
                refreshToken
            );

            if (!isRefreshTokenValid) {
                throw new UnauthorizedException('Invalid refresh token');
            }

            // Generate new tokens
            const tokens = await this.generateTokens(user);

            // Store new refresh token
            await this.usersService.updateRefreshToken(user.id, tokens.refreshToken);

            return {
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken,
                user: {
                    id: user.id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    role: user.role,
                    isActive: user.isActive,
                    isEmailVerified: user.isEmailVerified,
                },
                expiresIn: this.getTokenExpirationTime(),
            };
        } catch (error) {
            throw new UnauthorizedException('Invalid refresh token');
        }
    }

    async logout(userId: string): Promise<{ message: string }> {
        // Remove refresh token from database
        await this.usersService.updateRefreshToken(userId, null);

        return { message: 'Logged out successfully' };
    }

    async logoutFromAllDevices(userId: string): Promise<{ message: string }> {
        // Remove refresh token from database (invalidates all sessions)
        await this.usersService.updateRefreshToken(userId, null);

        return { message: 'Logged out from all devices successfully' };
    }

    private async generateTokens(user: UserDocument): Promise<{
        accessToken: string;
        refreshToken: string;
    }> {
        const payload: JwtPayload = {
            sub: user.id,
            email: user.email,
            role: user.role,
        };

        const [accessToken, refreshToken] = await Promise.all([
            // Access token (short-lived)
            this.jwtService.signAsync(payload, {
                secret: this.configService.get<string>('JWT_SECRET'),
                expiresIn: this.configService.get<string>('JWT_EXPIRES_IN', '1d'),
            }),
            // Refresh token (long-lived)
            this.jwtService.signAsync(payload, {
                secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
                expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d'),
            }),
        ]);

        return {
            accessToken,
            refreshToken,
        };
    }

    private getTokenExpirationTime(): number {
        const expiresIn = this.configService.get<string>('JWT_EXPIRES_IN', '1d');

        // Convert string like '1d', '24h', '1440m' to seconds
        const timeUnit = expiresIn.slice(-1);
        const timeValue = parseInt(expiresIn.slice(0, -1));

        switch (timeUnit) {
            case 'd':
                return timeValue * 24 * 60 * 60; // days to seconds
            case 'h':
                return timeValue * 60 * 60; // hours to seconds
            case 'm':
                return timeValue * 60; // minutes to seconds
            case 's':
                return timeValue; // seconds
            default:
                return 24 * 60 * 60; // default 1 day
        }
    }

    async changePassword(
        userId: string,
        currentPassword: string,
        newPassword: string
    ): Promise<{ message: string }> {
        const user = await this.usersService.findByEmailWithPassword(
            (await this.usersService.findById(userId))?.email || ''
        );

        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        // Verify current password
        const isCurrentPasswordValid = await this.usersService.validatePassword(
            currentPassword,
            user.password
        );

        if (!isCurrentPasswordValid) {
            throw new UnauthorizedException('Current password is incorrect');
        }

        // Update password
        await this.usersService.updateById(userId, { password: newPassword });

        // Logout from all devices for security
        await this.usersService.updateRefreshToken(userId, null);

        return { message: 'Password changed successfully. Please log in again.' };
    }

    async getProfile(userId: string): Promise<UserDocument> {
        const user = await this.usersService.findById(userId);

        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        return user;
    }

    async updateProfile(
        userId: string,
        updateData: {
            firstName?: string;
            lastName?: string;
            phone?: string;
            preferences?: any;
        }
    ): Promise<UserDocument> {
        return await this.usersService.updateById(userId, updateData);
    }
}