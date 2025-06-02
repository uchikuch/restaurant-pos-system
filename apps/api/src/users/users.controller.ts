
import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Query,
    UseGuards,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@restaurant-pos/shared-types';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
    constructor(private usersService: UsersService) { }

    @Post()
    @Roles(UserRole.ADMIN)
    @HttpCode(HttpStatus.CREATED)
    async create(@Body() createUserDto: CreateUserDto) {
        return await this.usersService.create(createUserDto);
    }

    @Get()
    @Roles(UserRole.ADMIN)
    async findAll(
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '10',
        @Query('role') role?: UserRole
    ) {
        return await this.usersService.findAll(
            parseInt(page),
            parseInt(limit),
            role
        );
    }

    @Get('staff')
    @Roles(UserRole.ADMIN, UserRole.KITCHEN_STAFF)
    async findStaffMembers() {
        return await this.usersService.findStaffMembers();
    }

    @Get(':id')
    @Roles(UserRole.ADMIN)
    async findOne(@Param('id') id: string) {
        return await this.usersService.findById(id);
    }

    @Patch(':id')
    @Roles(UserRole.ADMIN)
    async update(
        @Param('id') id: string,
        @Body() updateUserDto: Partial<CreateUserDto>
    ) {
        return await this.usersService.updateById(id, updateUserDto);
    }

    @Patch(':id/deactivate')
    @Roles(UserRole.ADMIN)
    @HttpCode(HttpStatus.OK)
    async deactivate(@Param('id') id: string) {
        return await this.usersService.deactivateUser(id);
    }

    @Patch(':id/activate')
    @Roles(UserRole.ADMIN)
    @HttpCode(HttpStatus.OK)
    async activate(@Param('id') id: string) {
        return await this.usersService.activateUser(id);
    }

    @Delete(':id')
    @Roles(UserRole.ADMIN)
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(@Param('id') id: string) {
        await this.usersService.deleteUser(id);
    }

    // Customer-specific endpoints
    @Post('addresses')
    async addAddress(
        @CurrentUser('id') userId: string,
        @Body() addressData: {
            street: string;
            city: string;
            state: string;
            zipCode: string;
            isDefault?: boolean;
            label?: string;
        }
    ) {
        return await this.usersService.addAddress(userId, addressData);
    }

    @Patch('addresses/:index')
    async updateAddress(
        @CurrentUser('id') userId: string,
        @Param('index') index: string,
        @Body() updateData: Partial<{
            street: string;
            city: string;
            state: string;
            zipCode: string;
            isDefault: boolean;
            label: string;
        }>
    ) {
        return await this.usersService.updateAddress(userId, parseInt(index), updateData);
    }

    @Delete('addresses/:index')
    @HttpCode(HttpStatus.OK)
    async removeAddress(
        @CurrentUser('id') userId: string,
        @Param('index') index: string
    ) {
        return await this.usersService.removeAddress(userId, parseInt(index));
    }

    // Staff-specific endpoints
    @Patch(':id/staff-info')
    @Roles(UserRole.ADMIN)
    async updateStaffInfo(
        @Param('id') id: string,
        @Body() staffData: {
            employeeId?: string;
            department?: string;
            hireDate?: Date;
        }
    ) {
        return await this.usersService.updateStaffInfo(id, staffData);
    }
}