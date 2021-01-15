import { Client, Constants, Intents, Message } from 'discord.js';
import { join } from 'path';
import signale from 'signale';
import CommandHandler from './core/CommandHandler';

const intents = [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES];
const client = new Client({ ws: { intents } });
const commandHandler = new CommandHandler(client, {
	dir: join(__dirname, 'commands'),
	prefix: process.env.PREFIX ?? '??',
});

client.on(Constants.Events.MESSAGE_CREATE, (msg: Message) => {
	if (msg.author.bot || !msg.guild) return;
	void commandHandler.handle(msg);
});

client.on(Constants.Events.DEBUG, (info: string) => signale.debug(`[DEBUG]: ${info}`));
client.on(Constants.Events.CLIENT_READY, () =>
	signale.info(`[READY]: ${client.user?.tag} (${client.user?.id}) is ready!`),
);

async function bootstrap() {
	await commandHandler.loadAll();
	await client.login();
}
void bootstrap();
