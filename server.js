import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import crypto from "crypto";
import fs from "fs";
dotenv.config();
const app=express(), port=process.env.PORT||3000;
const DB="./orders.json";
app.use(cors()); app.use(express.json()); app.use(express.static("."));
const plans={3:299,7:599,15:1199,30:2599};
function read(){try{return JSON.parse(fs.readFileSync(DB,"utf8"))}catch{return []}}
function write(x){fs.writeFileSync(DB,JSON.stringify(x,null,2))}
app.get("/api/payment-config",(req,res)=>res.json({upiId:process.env.UPI_ID||"YOUR_UPI_ID_HERE",usdtAddress:process.env.USDT_ADDRESS||"YOUR_USDT_ADDRESS_HERE",network:"TRC20"}));
app.post("/api/orders",(req,res)=>{const {planDays,customerName,customerContact,paymentMethod,transactionId}=req.body;if(!plans[planDays]||!customerName||!customerContact||!paymentMethod||!transactionId)return res.status(400).json({error:"All order fields are required."});const order={id:"GB-"+crypto.randomBytes(5).toString("hex").toUpperCase(),planDays:Number(planDays),amount:plans[planDays],customerName,customerContact,paymentMethod,transactionId,status:"PENDING",createdAt:new Date().toISOString()};const orders=read();orders.push(order);write(orders);res.status(201).json({message:"Order submitted for verification.",order})});
app.get("/api/orders",(req,res)=>{if(req.headers["x-admin-key"]!==process.env.ADMIN_KEY)return res.status(401).json({error:"Unauthorized"});res.json(read())});
app.patch("/api/orders/:id",(req,res)=>{if(req.headers["x-admin-key"]!==process.env.ADMIN_KEY)return res.status(401).json({error:"Unauthorized"});const orders=read(),i=orders.findIndex(o=>o.id===req.params.id);if(i<0)return res.status(404).json({error:"Order not found"});if(!["PAID","REJECTED"].includes(req.body.status))return res.status(400).json({error:"Status must be PAID or REJECTED"});orders[i].status=req.body.status;orders[i].verifiedAt=new Date().toISOString();write(orders);res.json(orders[i])});
app.listen(port,()=>console.log("Gold Booster backend running on port "+port));