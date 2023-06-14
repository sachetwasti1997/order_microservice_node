import { Publisher, OrderCreatedEvent, Subjects } from "@ticketingplatform/common";

export class OrderCreatedPublisher extends Publisher<OrderCreatedEvent> { 
    subject: Subjects.OrderCreated = Subjects.OrderCreated;
}