import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import amqp from 'amqplib';

const QUEUE = 'webshop.events';

type AmqpConnection = Awaited<ReturnType<typeof amqp.connect>>;
type AmqpChannel = Awaited<ReturnType<AmqpConnection['createChannel']>>;

@Injectable()
export class MessagingService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MessagingService.name);
  private connection: AmqpConnection | null = null;
  private channel: AmqpChannel | null = null;
  private enabled = false;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit() {
    const url = this.config.get<string>('RABBITMQ_URL');
    if (!url) {
      this.logger.warn('RABBITMQ_URL not set — messaging stub disabled');
      return;
    }

    try {
      const connection = await amqp.connect(url);
      const channel = await connection.createChannel();
      await channel.assertQueue(QUEUE, { durable: true });
      await channel.consume(QUEUE, (msg) => {
        if (!msg || !this.channel) {
          return;
        }
        const content = msg.content.toString('utf8');
        this.logger.debug(`Consumed message: ${content}`);
        this.channel.ack(msg);
      });
      this.connection = connection;
      this.channel = channel;
      this.enabled = true;
      this.logger.log(`Connected to RabbitMQ queue ${QUEUE}`);
    } catch (error) {
      this.logger.warn(
        `RabbitMQ unavailable — continuing without messaging (${(error as Error).message})`,
      );
      await this.cleanup();
    }
  }

  async publish(routingKey: string, payload: unknown): Promise<boolean> {
    if (!this.enabled || !this.channel) {
      this.logger.debug(`Dropping message ${routingKey} (messaging disabled)`);
      return false;
    }

    const body = Buffer.from(JSON.stringify({ routingKey, payload }));
    this.channel.sendToQueue(QUEUE, body, {
      contentType: 'application/json',
      persistent: true,
    });
    return true;
  }

  async onModuleDestroy() {
    await this.cleanup();
  }

  private async cleanup() {
    try {
      await this.channel?.close();
    } catch (_error) {
      /* ignore */
    }
    try {
      await this.connection?.close();
    } catch (_error) {
      /* ignore */
    }
    this.channel = null;
    this.connection = null;
    this.enabled = false;
  }
}
