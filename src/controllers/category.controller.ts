import { Request, Response, NextFunction } from "express";
import categoryService from "../services/category.service";

class CategoryController {
  async getAllCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const categories = await categoryService.getAllCategories();
      res.status(200).json({
        success: true,
        data: categories,
        message: "Categories retrieved successfully",
      });
    } catch (error: any) {
      next(error);
    }
  }

  async getCategoryById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const category = await categoryService.getCategoryById(id);
      res.status(200).json({
        success: true,
        data: category,
        message: "Category retrieved successfully",
      });
    } catch (error: any) {
      // HINT: Handle "Category not found" error → 404
      next(error);
    }
  }

  async createCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, description } = req.body;

      // TODO: Validate request body
      if (!name) {
        return res.status(400).json({
          success: false,
          error: "Category name is required",
        });
      }

      const category = await categoryService.createCategory(name, description);
      res.status(201).json({
        success: true,
        data: category,
        message: "Category created successfully",
      });
    } catch (error: any) {
      // HINT: Handle "Category name already exists" error → 409
      next(error);
    }
  }

  async updateCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { name, description } = req.body;

      // Validate request body
      if (!name) {
        return res.status(400).json({
          success: false,
          error: "Category name is required",
        });
      }

      const category = await categoryService.updateCategory(
        id,
        name,
        description
      );
      res.status(200).json({
        success: true,
        data: category,
        message: "Category updated successfully",
      });
    } catch (error: any) {
      // HINT: Handle "Category name already exists" error → 409
      next(error);
    }
  }

  async deleteCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const deletedCategory = await categoryService.deleteCategory(id);
      res.status(200).json({
        success: true,
        data: deletedCategory,
        message: "Category deleted successfully",
      });
    } catch (error: any) {
      // Sesuaikan error handling:
      // - Jika error message mengandung "not found" atau "with products", return 400
      if (
        error.message === "Category not found" ||
        error.message === "Cannot delete category with products"
      ) {
        return res.status(400).json({
          success: false,
          error: error.message,
        });
      }
      // Kalau error lain, lempar ke middleware error
      next(error);
    }
  }
}

export default new CategoryController();
