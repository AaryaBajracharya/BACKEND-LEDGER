import express from 'express';
import authRoutes from './routes/auth.routes.js';
import accountRoutes from './routes/account.routes.js'
import transactionRoutes from './routes/transaction.routes.js'
import cookieParser from 'cookie-parser'

const app = express();

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

//REQUEST INTERCEPTOR 
// const RequestInterceptor = async (req, res ,next ) => {
//     console.log('this is a global request interceptor:');
//     next();

// }
// const ResponseInterceptor = (req, res, next) => {
//     res.on("finish",()=> 
//         {console.log("response interceptor");

//         });

//     next();

// };


// app.use(RequestInterceptor);
// app.use(ResponseInterceptor);


app.use("/api/auth", authRoutes);
app.use("/api/account",accountRoutes);
app.use("/api/transaction",transactionRoutes);



export default app;
