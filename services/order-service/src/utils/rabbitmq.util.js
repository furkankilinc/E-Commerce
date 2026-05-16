const amqp = require('amqplib');

let connection;
let channel;

const connectRabbitMQ = async () => {
    try {
        connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://rabbitmq');
        channel = await connection.createChannel();
        console.log('✅ RabbitMQ Connected');
    } catch (err) {
        console.error('❌ RabbitMQ Connection Error:', err);
    }
};

const publishToQueue = async (queue, message) => {
    try {
        if (!channel) await connectRabbitMQ();
        await channel.assertQueue(queue, { durable: true });
        channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)), { persistent: true });
        console.log(`[RabbitMQ] Sent to ${queue}:`, message);
    } catch (err) {
        console.error(`[RabbitMQ] Publish Error:`, err);
    }
};

module.exports = { connectRabbitMQ, publishToQueue };
