import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { join } from 'path';
import * as fs from 'fs';
import { Response } from 'express';
import { CreateUserDto } from './dto/create-user.dto';
import { hash, compare } from 'bcryptjs';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) {}

    // Update user by ID
    async updateUserById(userId: string, file: any, data: any) {
        try {
            const updateUser = await this.prisma.user.update({
                where: { userId },
                data: {
                    name: data.name,
                    avatar: file.filename,
                },
            });
            return { message: 'User updated successfully', user: await this.getUserById(updateUser.userId) };
        } catch (error) {
            throw new BadRequestException('Failed to update user');
        }
    }

    // Delete user by ID (mark as inactive)
    async deleteUserById(userId: string) {
        try {
            await this.prisma.user.update({
                where: { userId },
                data: { status: 'INACTIVE' },
            });
            return { message: 'User marked as inactive successfully' };
        } catch (error) {
            throw new BadRequestException('Failed to delete user');
        }
    }

    // Change user status (active to blocked or vice versa)
    async changeUserStatusById(userId: string) {
        const user = await this.getUserById(userId);
        try {
            const changeUserStatus = await this.prisma.user.update({
                where: { userId },
                data: {
                    status: user.status === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE',
                },
            });
            return { message: `User status changed to ${changeUserStatus.status}`, user: await this.getUserById(changeUserStatus.userId) };
        } catch (error) {
            throw new BadRequestException('Failed to change user status');
        }
    }

    // Download image for the user
    async downloadImage(userId: string, res: Response) {
        let user = await this.getUserById(userId);
        const filePath = join(__dirname, '..', '..', '..', 'uploads', user.avatar);

        try {
            user.avatar = fs.readFileSync(filePath, { encoding: 'base64', flag: 'r' });
            return res.json({ message: 'Image downloaded successfully', user });
        } catch (error) {
            throw new BadRequestException('Failed to download image');
        }
    }

    // Validate user login credentials
    async validateUser(email: string, password: string) {
        let userItem = await this.prisma.user.findUnique({
            where: {
                email,
                OR: [
                    { status: 'ACTIVE' },
                    { status: 'BLOCKED' },
                ],
            },
            select: {
                email: true,
                password: true,
                userId: true,
                roles: { select: { name: true } },
            },
        });

        if (!userItem) {
            throw new NotFoundException('User not found');
        }

        let roles = [];
        for (const [key, value] of Object.entries(userItem?.roles)) {
            roles.push(value?.name);
        }

        userItem.roles = roles;
        const user = {
            email: userItem.email,
            roles: userItem.roles,
            sub: userItem.userId,
        };

        if (userItem && compare(password, userItem.password)) {
            return { message: 'Login successful', user };
        }

        return { message: 'Invalid credentials' };
    }

    // Create a new user
    async createUser(body: CreateUserDto) {
        try {
            const existingUser = await this.prisma.user.findUnique({
                where: { email: body.email },
            });
            if (existingUser) {
                throw new ConflictException('Email already in use');
            }

            if (body.name && body.name.length > 20) {
                throw new BadRequestException('Username must be a maximum of 20 characters');
            }

            const existingName = await this.prisma.user.findFirst({
                where: { name: body.name },
            });
            if (existingName) {
                throw new ConflictException('Username already taken');
            }

            const hashedPassword = await hash(body.password, 10);

            let roles = [];
            for (const roleName of body.roles) {
                const role = await this.prisma.role.findUnique({
                    where: { name: roleName },
                });
                if (!role) {
                    throw new BadRequestException(`Role ${roleName} does not exist`);
                }
                roles.push({ id: role.id });
            }

            const user = await this.prisma.user.create({
                data: {
                    name: body.name || null,
                    email: body.email,
                    password: hashedPassword,
                    roles: { connect: roles },
                },
            });

            return { message: 'User registered successfully', user };
        } catch (error) {
            throw new BadRequestException(error.message || 'Failed to create user');
        }
    }

    // Get all users
    async getAllUsers() {
        let users = [];
        const items = await this.prisma.user.findMany({
            where: {
                OR: [{ status: 'ACTIVE' }, { status: 'BLOCKED' }],
            },
            select: {
                email: true,
                name: true,
                avatar: true,
                userId: true,
                status: true,
                roles: { select: { name: true } },
            },
        });

        items.forEach((item) => {
            let roles = [];
            for (const [key, value] of Object.entries(item?.roles)) {
                roles.push(value?.name);
            }

            item.roles = roles;
            users.push(item);
        });

        return { message: 'Users fetched successfully', users };
    }

    // Get a user by ID
    async getUserById(userId: string) {
        let userItem = await this.prisma.user.findUnique({
            where: {
                userId,
                OR: [{ status: 'ACTIVE' }, { status: 'BLOCKED' }],
            },
            select: {
                email: true,
                name: true,
                avatar: true,
                userId: true,
                status: true,
                roles: { select: { name: true } },
            },
        });

        if (!userItem) {
            throw new NotFoundException(`User with ID ${userId} not found`);
        }

        let roles = [];
        for (const [key, value] of Object.entries(userItem?.roles)) {
            roles.push(value?.name);
        }

        userItem.roles = roles;

        return userItem;
    }
}
