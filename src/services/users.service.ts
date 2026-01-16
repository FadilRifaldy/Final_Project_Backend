import prisma from "../prisma";

class UsersService {
    async getAllUsers() {
        // get semua users untuk users management page
        return prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                addresses: true,
                isVerified: true,
                provider: true,
                createdAt: true,
                updatedAt: true,
                userStores: true,
            },
        });
    }

    async getUserById(id: string) {
        // get user by id untuk user detail page
        return prisma.user.findUnique({
            where: {
                id,
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                addresses: true,
                isVerified: true,
                provider: true,
                createdAt: true,
                updatedAt: true,
                userStores: true,
            },
        });
    }
    async deleteUser(id: string) {
        await this.getUserById(id);
        // delete user untuk users management page
        const deletedUser = await prisma.user.update({
            where: {
                id,
            },
            data: {
                deletedAt: new Date(),
            },
        });
        return deletedUser;
    }
}

export default new UsersService();