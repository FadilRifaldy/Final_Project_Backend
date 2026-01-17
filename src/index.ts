import dotenv from "dotenv";
dotenv.config();
import cors from "cors";
import express, { Application, NextFunction, Request, Response } from "express";
import cookieParser from "cookie-parser";
import authRouter from "./routers/auth.route";
import categoryRouter from "./routers/category.route";
import emailVerifRouter from "./routers/emailVerif.route"
import updateProfileRouter from "./routers/updateProfile.route"
import setPasswordRouter from "./routers/setPassword.route"
import cloudinaryRouter from "./routers/cloudinary.route"
import productRouter from "./routers/product.route";
import variantRouter from "./routers/productVariant.route";
import productImageRouter from "./routers/productImage.route";
import productVariantImageRouter from "./routers/productVariantImage.route";
import stockJournalRouter from "./routers/stockJournal.route";
import inventoryRouter from "./routers/inventory.route";
import addressRoutes from "./routers/address.route"
import storeRoutes from "./routers/store.route"
import discountRouter from "./routers/discount.route"
import assignStoreAdminRoutes from "./routers/assign-store-admin.route"
import searchRouter from "./routers/search.route";
import usersRouter from "./routers/users.route";
import cartRouter from "./routers/cart.route";

import checkoutRouter from "./routers/checkout.route";

const PORT = process.env.PORT;

// define app server
const app: Application = express();

// define app basic middleware
app.use(cors({ origin: "http://localhost:3000", credentials: true })); // allow other domain to access api
app.use(express.json()); // for receive req.body
app.use(cookieParser());

// define app main router
app.get("/", (req: Request, res: Response) => {
  res.status(200).send("<h1>Online Grocery</h1>");
});

app.use("/auth", authRouter, setPasswordRouter);
app.use("/addresses", addressRoutes)
app.use("/api/categories", categoryRouter);
app.use("/api/products", productRouter, productImageRouter);  // productImageRouter untuk handle /:productId/images
app.use("/api/products/var", variantRouter, productVariantImageRouter); // productVariantImageRouter untuk handle /:variantId/images
app.use("/api/stock-journal", stockJournalRouter);
app.use("/api/inventory", inventoryRouter);
app.use("/api/discounts", discountRouter)
app.use("/verify", emailVerifRouter);
app.use("/user", updateProfileRouter);
app.use("/categories", categoryRouter);
app.use("/api/cloudinary", cloudinaryRouter);
app.use("/stores", storeRoutes);
app.use("/assign-store-admin", assignStoreAdminRoutes)
app.use("/search", searchRouter);
app.use("/api/users-mng", usersRouter);
app.use("/cart", cartRouter);
app.use("/checkout", checkoutRouter);

// error middleware
app.use((error: any, req: Request, res: Response, next: NextFunction) => {
  console.error(error);

  const statusCode = 500;

  res.status(statusCode).json({
    success: false,
    message: error.message || "Internal Server Error",
  });
});

// run app server
app.listen(PORT, () => {
  console.log("API RUNNING", PORT);
});
