import express, { NextFunction, Request, Response } from "express";
import { authorisedCheck, validateRequest } from "@ticketingplatform/common";
import { body } from "express-validator";
import mongoose from "mongoose";
import { createTicket, getAllEvents, getOrderById } from "../services/service";

const orderRouter = express.Router();

orderRouter.post(
  "/api/orders",
  authorisedCheck,
  [
    body("ticketId")
      .not()
      .isEmpty()
      .custom((input: string) => mongoose.Types.ObjectId.isValid(input))
      .withMessage("TicketId must be provided!"),
  ],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ticketId = req.body.ticketId;
      const userId = req.currentUser!.id;
      const orderSaved = await createTicket(ticketId, userId);
      res.status(201).send(orderSaved);
    } catch (err) {
      return next(err);
    }
  }
);

orderRouter.patch(
  "/api/orders/:id",
  authorisedCheck,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const order = await getOrderById(req.params.id, req.currentUser!.id);
      res.send(order);
    } catch (err) {
      return next(err);
    }
  }
);

orderRouter.get(
  "/api/orders",
  authorisedCheck,
  async (req: Request, res: Response) => {
    const orders = await getAllEvents(req.currentUser!.id);
    res.send({ orders });
  }
);

orderRouter.get(
  "/api/orders/:id",
  authorisedCheck,
  async (req: Request, res: Response) => {
    const order = await getOrderById(req.params.id, req.currentUser!.id);
    res.send({ order });
  }
);

export default orderRouter;
