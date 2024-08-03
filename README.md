
# RabbitMQ CLI

## About
This is a demo for another project, showcasing how we will distribute messages.
![Diagram](assets/rabbitmq-plane.drawio.svg)

## RabbitMQ Queues

- **List RabbitMQ Queues**:
  ```sh
  docker exec -it rabbitmq rabbitmqctl list_queues
  ```

## Listing Queues
To see the queues in RabbitMQ and the number of messages in them, you can use the `rabbitmqctl` tool:

```sh
sudo rabbitmqctl list_queues
```

## Forgotten Acknowledgment
It's a common mistake to miss acknowledging messages. This error has serious consequences, as messages will be redelivered when your client quits, causing RabbitMQ to consume more memory as it won't be able to release any unacknowledged messages.

To debug this issue, use `rabbitmqctl` to print the `messages_unacknowledged` field:

```sh
sudo rabbitmqctl list_queues name messages_ready messages_unacknowledged
```

## Listing Exchanges
To list the exchanges on the server, use `rabbitmqctl`:

```sh
sudo rabbitmqctl list_exchanges
```

## Listing Bindings
To list existing bindings, use:

```sh
rabbitmqctl list_bindings
```
