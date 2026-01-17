import productService from "../services/product.service";
import { Request, Response, NextFunction } from "express";

class ProductController {
  async getAllProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const storeId = req.query.storeId as string | undefined;

      const result = await productService.getAllProducts(page, limit, storeId);

      res.status(200).json({
        success: true,
        data: result.products,
        pagination: result.pagination,
        message: "Products retrieved successfully",
      });
    } catch (error: any) {
      next(error);
    }
  }

  async getProductById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const product = await productService.getProductById(id);
      res.status(200).json({
        success: true,
        data: product,
        message: "Product retrieved successfully",
      });
    } catch (error: any) {
      if (error.message === "Product not found") {
        return res.status(404).json({
          success: false,
          error: error.message,
        });
      }
      next(error);
    }
  }

  async createProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, description, categoryId } = req.body;

      // Validate request body
      if (!name) {
        return res.status(400).json({
          success: false,
          error: "Product name is required",
        });
      }

      if (!categoryId) {
        return res.status(400).json({
          success: false,
          error: "Category ID is required",
        });
      }

      const product = await productService.createProduct(
        name,
        description,
        categoryId
      );
      res.status(201).json({
        success: true,
        data: product,
        message: "Product created successfully",
      });
    } catch (error: any) {
      if (error.message === "Product name already exists") {
        return res.status(409).json({
          success: false,
          error: error.message,
        });
      }
      if (error.message === "Category not found") {
        return res.status(404).json({
          success: false,
          error: error.message,
        });
      }
      next(error);
    }
  }

  async updateProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { name, description, categoryId } = req.body;

      // Validate request body
      if (!name) {
        return res.status(400).json({
          success: false,
          error: "Product name is required",
        });
      }

      if (!categoryId) {
        return res.status(400).json({
          success: false,
          error: "Category ID is required",
        });
      }

      const product = await productService.updateProduct(
        id,
        name,
        description,
        categoryId
      );
      res.status(200).json({
        success: true,
        data: product,
        message: "Product updated successfully",
      });
    } catch (error: any) {
      if (error.message === "Product not found") {
        return res.status(404).json({
          success: false,
          error: error.message,
        });
      }
      if (error.message === "Product name already exists") {
        return res.status(409).json({
          success: false,
          error: error.message,
        });
      }
      if (error.message === "Category not found") {
        return res.status(404).json({
          success: false,
          error: error.message,
        });
      }
      next(error);
    }
  }

  async deleteProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const product = await productService.deleteProduct(id);
      res.status(200).json({
        success: true,
        data: product,
        message: "Product deleted successfully",
      });
    } catch (error: any) {
      if (error.message === "Product not found") {
        return res.status(404).json({
          success: false,
          error: error.message,
        });
      }
      next(error);
    }
  }

  async searchVariants(req: Request, res: Response, next: NextFunction) {
    try {
      const query = (req.query.q as string) || "";
      const limit = parseInt(req.query.limit as string) || 20;

      const variants = await productService.searchVariants(query, limit);

      res.status(200).json({
        success: true,
        data: variants,
        message: "Variants retrieved successfully",
      });
    } catch (error: any) {
      next(error);
    }
  }
}

export default new ProductController();
