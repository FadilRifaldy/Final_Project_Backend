// routes/search.routes.ts
import { getSearchSuggestions, searchProducts, searchStores, getAvailableCities } from "../controllers/search.controller";
import { Router } from "express";

const router = Router();

router.get("/suggestions", getSearchSuggestions);
router.get("/products", searchProducts);
router.get("/stores", searchStores);
router.get("/cities", getAvailableCities);

export default router;