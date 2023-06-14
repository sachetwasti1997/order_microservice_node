import {
  Listener,
  Subjects,
  TicketCreatedEvent,
  TicketUpdatedEvent,
} from "@ticketingplatform/common";
import { Message } from "node-nats-streaming";
import { queueGroupName } from "./queue-group-name";
import { Ticket } from "../../models/tickets";

export class TicketUpdatedListener extends Listener<TicketUpdatedEvent> {
  subject: Subjects.TicketUpdated = Subjects.TicketUpdated;
  queueGroupName: string = queueGroupName;

  async onMessage(data: TicketUpdatedEvent["data"], msg: Message) {
    const ticket = await Ticket.findOne({
      _id: data.id,
      version: data.version - 1,
    });

    if (!ticket) {
      throw new Error("Ticket Not Found!");
    }

    const { title, price } = data;

    ticket?.set({ title, price });
    await ticket?.save();
    msg.ack();
  }
}
