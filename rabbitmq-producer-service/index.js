const amqp = require("amqplib/callback_api");

amqp.connect("amqp://rabbitmq", (error, connection) => {
  if (error) throw error;

  connection.createChannel((error, channel) => {
    if (error) throw error;

    const queue = 'hello'
    const msg = 'Hello World!'

    channel.assertQueue(queue, { durable: false });

    channel.sendToQueue(queue, Buffer.from(msg));
    console.log(" [x] Sent %s", msg);
  });
  setTimeout(() => {
    connection.close();
    process.exit(0);
  }, 500);
});
