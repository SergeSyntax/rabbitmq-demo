# RabbitMQ CLI

## **rabbitmq-queues**
- list rabbitmq queues
  ```sh
  docker exec -it rabbitmq rabbitmqctl list_queues
  ```



- create kafka topic
  ```sh
  docker exec -it kafka kafka-topics.sh --bootstrap-server localhost:9092 --create --topic some_topic_name --partitions 3 --replication-factor 2
  ```
- describe kafka topic
  ```sh
  docker exec -it kafka kafka-topics.sh --bootstrap-server localhost:9092 --describe --topic some_topic_name
  ```
- delete kafka topic
  ```sh
  docker exec -it kafka kafka-topics.sh --bootstrap-server localhost:9092 --delete --topic some_topic_name
  ```

## **kafka-console-producer**
- produce to a specific topic with the acknowledge property set to all:
  ```sh
  docker exec -it kafka kafka-console-producer.sh --bootstrap-server localhost:9092 --topic some_topic_name --property parse.key=true --property key.separator=: --producer-property acks=all
  ```


## **kafka-console-consumer**
- consume a specific topic with from-beginning and format attributes:
  ```sh
  docker exec -it kafka kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic some_topic_name --group some_group --from-beginning --formatter kafka.tools.DefaultMessageFormatter --property print.timestamp=true --property print.key=true --property print.value=true
  ```

## **kafka-consumer-groups**
- note: if you don't specify a consumer group when initializing a consumer it will generate a temporary consumer group that will not commit offset and be removed when it unsubscribe.  

- list consumer groups:
  ```sh
  docker exec -it kafka kafka-consumer-groups.sh --bootstrap-server localhost:9092 --list
  ```
- describe one consumer group:
  ```sh
  docker exec -it kafka kafka-consumer-groups.sh --bootstrap-server localhost:9092 --group some_group --describe 
  ```
- delete one consumer group:
  ```sh
  docker exec -it kafka kafka-consumer-groups.sh --bootstrap-server localhost:9092 --group some_group --delete 
  ```
- reset offset for all topics on one consumer group (only if inactive):
  ```sh
  docker exec -it kafka kafka-consumer-groups.sh --bootstrap-server localhost:9092 --group some_group --reset-offsets --to-earliest --execute --all-topics
  ```
- move the offset forward by two for a specific consumer group and topic, can use negative values to reduce offset (only if inactive):
  ```sh
  docker exec -it kafka kafka-consumer-groups.sh --bootstrap-server localhost:9092 --group some_group --reset-offsets --shift-by 2 --execute --topic some_topic
  ```


## Listing queues
You may wish to see what queues RabbitMQ has and how many messages are in them. You can do it (as a privileged user) using the rabbitmqctl tool:

```sh
sudo rabbitmqctl list_queues
```

## Forgotten acknowledgment
It's a common mistake to miss the ack. It's an easy error, but the consequences are serious. Messages will be redelivered when your client quits (which may look like random redelivery), but RabbitMQ will eat more and more memory as it won't be able to release any unacked messages.

In order to debug this kind of mistake you can use rabbitmqctl to print the messages_unacknowledged field:

```sh
sudo rabbitmqctl list_queues name messages_ready messages_unacknowledged
```


