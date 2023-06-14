import mongoose from "mongoose";
import { app } from "./app";
import { natsWrapper } from "./nats-wrapper";
import { randomUUID } from "crypto";
import { TicketCreatedListener } from "./events/listeners/ticket-created-listener";
import { TicketUpdatedListener } from "./events/listeners/ticket-updated-listener";
import { ExpirationCompleteListener } from "./events/listeners/expiration-complete-listener";
import { PaymentCreatedListener } from "./events/listeners/payment-created-listener";

const start = async () => {
  try {
    await natsWrapper.connect(
      "ticketing",
      randomUUID(),
      "http://nats-srv:4222"
    );
    natsWrapper.client.on("close", () => {
      console.log("Nats Connection closed");
      process.exit();
    });
    process.on("SIGINT", () => natsWrapper.client.close());
    process.on("SIGTERM", () => natsWrapper.client.close());

    new TicketCreatedListener(natsWrapper.client).listen();
    new TicketUpdatedListener(natsWrapper.client).listen();
    new ExpirationCompleteListener(natsWrapper.client).listen();
    new PaymentCreatedListener(natsWrapper.client).listen();

    await mongoose.connect("mongodb://orders-mongo-srv:27017/tickets");
    console.log("Connected to mongodb");
  } catch (err) {
    console.log(err);
  }
  app.listen(3000, () => {
    console.log("Starting on port 3000!!!");
  });
};

start();
