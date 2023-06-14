import {
  BadRequestError,
  NotFoundError,
  OrderStatus,
  UnAuthorisedError,
} from "@ticketingplatform/common";
import { Ticket } from "../models/tickets";
import { Order } from "../models/orders";
import { OrderCreatedPublisher } from "../events/publishers/order-created-publisher";
import { natsWrapper } from "../nats-wrapper";
import { OrderCancelledPublisher } from "../events/publishers/order-cancelled-publisher";

const EXPIRATION_WINDOW_SECONDS = 60;

export async function createTicket(ticketId: string, userId: string) {
  const ticket = await Ticket.findById(ticketId);
  if (!ticket) {
    throw new NotFoundError();
  }
  const isReserved = await ticket.isReserved();
  if (isReserved) {
    throw new BadRequestError("Ticket is already Reserved!");
  }
  const expiration = new Date();
  expiration.setSeconds(expiration.getSeconds() + EXPIRATION_WINDOW_SECONDS);
  const order = Order.build({
    userId,
    status: OrderStatus.Created,
    expiresAt: expiration,
    ticket,
  });
  await order.save();
  new OrderCreatedPublisher(natsWrapper.client).publish({
    id: order.id,
    version: order.version,
    status: order.status,
    userId: order.userId,
    expiresAt: order.expiresAt.toISOString(),
    ticket: {
      id: ticket.id,
      price: ticket.price
    }
  })
  return order;
}

export async function getAllEvents(userId: string) {
  const orders = await Order.find({
    userId,
  }).populate("ticket");
  return orders;
}

export async function getOrderById(orderId: string, userId: string) {
  const order = await Order.findById(orderId).populate("ticket");
  if (!order) {
    throw new NotFoundError();
  }
  if (order.userId !== userId) {
    throw new UnAuthorisedError();
  }
  return order;
}

export async function cancelOrder(orderId: string, userId: string) {
  const order = await Order.findById(orderId).populate('ticket');
  if (!order) {
    throw new NotFoundError();
  }
  if (order.userId !== userId) {
    throw new UnAuthorisedError();
  }
  order.status = OrderStatus.Cancelled
  await order.save()
  new OrderCancelledPublisher(natsWrapper.client).publish({
    id: order.id,
    version: order.version,
    ticket: {
      id: order.ticket.id
    }
  })
  return order
}
