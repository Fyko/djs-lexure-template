import type { Message } from 'discord.js';
import Command from '../core/Command';

export default class extends Command {
	public constructor() {
		super('ping', {
			aliases: ['ping'],
		});
	}

	public execute = (msg: Message): Promise<Message | Message[] | void> => msg.channel.send('Pong!');
}
