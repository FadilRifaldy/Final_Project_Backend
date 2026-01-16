import { NextFunction, Request, Response } from "express";
import usersService from "../services/users.service";


class UsersController {
    async getAllUsers(req: Request, res: Response, next: NextFunction) {
        try {
            const users = await usersService.getAllUsers();
            res.status(200).json({
                success: true,
                data: users,
                message: "Users fetched successfully",
            });
        } catch (error: any) {
            next(error);
        }
    }

    async getUserById(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const user = await usersService.getUserById(id);
            res.status(200).json({
                success: true,
                data: user,
                message: "User fetched successfully",
            });
        } catch (error: any) {
            next(error);
        }
    }

    async deleteUser(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const deletedUser = await usersService.deleteUser(id);
            res.status(200).json({
                success: true,
                data: deletedUser,
                message: "User deleted successfully",
            });
        } catch (error: any) {
            next(error);
        }
    }
}
export default new UsersController();