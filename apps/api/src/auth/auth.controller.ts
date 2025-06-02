import {
    Controller,
    Post,
    Body,
    HttpCode,
    HttpStatus,
    UseGuards,
    Get,
    Patch,
    Request,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/auth-response.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Public()
    @Post('register')
    @HttpCode(HttpStatus.CREATED)
    async register(@Body() registerDto: RegisterDto) {
        return await this.authService.register(registerDto);
    }

    @Public()
    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(@Body() loginDto: LoginDto) {
        return await this.authService.login(loginDto);
    }

    @Public()
    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    async refreshTokens(@Body() refreshTokenDto: RefreshTokenDto) {
        return await this.authService.refreshTokens(refreshTokenDto.refreshToken);
    }

    @UseGuards(JwtAuthGuard)
    @Post('logout')
    @HttpCode(HttpStatus.OK)
    async logout(@CurrentUser('id') userId: string) {
        return await this.authService.logout(userId);
    }

    @UseGuards(JwtAuthGuard)
    @Post('logout-all')
    @HttpCode(HttpStatus.OK)
    async logoutFromAllDevices(@CurrentUser('id') userId: string) {
        return await this.authService.logoutFromAllDevices(userId);
    }

    @UseGuards(JwtAuthGuard)
    @Get('profile')
    async getProfile(@CurrentUser('id') userId: string) {
        return await this.authService.getProfile(userId);
    }

    @UseGuards(JwtAuthGuard)
    @Patch('profile')
    async updateProfile(
        @CurrentUser('id') userId: string,
        @Body() updateData: {
            firstName?: string;
            lastName?: string;
            phone?: string;
            preferences?: any;
        }
    ) {
        return await this.authService.updateProfile(userId, updateData);
    }

    @UseGuards(JwtAuthGuard)
    @Patch('change-password')
    @HttpCode(HttpStatus.OK)
    async changePassword(
        @CurrentUser('id') userId: string,
        @Body() passwordData: {
            currentPassword: string;
            newPassword: string;
        }
    ) {
        return await this.authService.changePassword(
            userId,
            passwordData.currentPassword,
            passwordData.newPassword
        );
    }

    @UseGuards(JwtAuthGuard)
    @Get('me')
    async getCurrentUser(@CurrentUser() user: any) {
        return { user };
    }
}