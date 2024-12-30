import Fastify from "fastify";
import { Transmit } from "@boringnode/transmit";
import { Readable } from "node:stream";

const fastify = Fastify({
  logger: true,
});

const transmit = new Transmit({
  pingInterval: false,
  transport: null,
});

// /**
//  * Register the client connection and keep it alive.
//  */
fastify.get("/__transmit/events", (request, reply) => {
  const uid = request.query.uid;

  if (!uid) {
    return reply.code(400).send({ error: "Missing uid" });
  }

  const stream = transmit.createStream({
    uid,
    context: { request, reply },
    request: request.raw,
    response: reply.raw,
    injectResponseHeaders: reply.getHeaders(),
  });

  return reply.send(stream);
});

/**
 * Subscribe the client to a specific channel.
 */
fastify.post("/__transmit/subscribe", async (request, reply) => {
  const uid = request.body.uid;
  const channel = request.body.channel;

  const success = await transmit.subscribe({
    uid,
    channel,
    context: { request, reply },
  });

  if (!success) {
    return reply
      .code(400)
      .send({ error: "Unable to subscribe to the channel" });
  }

  return reply.code(204).send();
});

/**
 * Unsubscribe the client from a specific channel.
 */
fastify.post("/__transmit/unsubscribe", async (request, reply) => {
  const uid = request.body.uid;
  const channel = request.body.channel;

  const success = await transmit.unsubscribe({
    uid,
    channel,
    context: { request, reply },
  });

  if (!success) {
    return reply
      .code(400)
      .send({ error: "Unable to unsubscribe to the channel" });
  }

  return reply.code(204).send();
});

const start = async () => {
  try {
    setInterval(() => transmit.broadcast("test", { data: "coucou" }), 3000);
    await fastify.listen({ port: 3333 });
  } catch (err) {
    fastify.log.error(err);
  }
};

start();
