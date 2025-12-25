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
app.use("/api/categories", categoryRouter);
app.use("/api/products", productRouter, productImageRouter);  // productImageRouter untuk handle /:productId/images
app.use("/api/products/var", variantRouter);
app.use("/verify", emailVerifRouter);
app.use("/user", updateProfileRouter);
app.use("/categories", categoryRouter);
app.use("/api/cloudinary", cloudinaryRouter);

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
