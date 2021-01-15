import type { Client, Message } from 'discord.js';
import type { Args } from 'lexure';

interface CommandOptions {
	aliases: string[];
}

export default abstract class Command {
	public client!: Client;

	public constructor(public readonly id: string, public readonly options: CommandOptions) {
		options.aliases = options.aliases.map((a) => a.toLowerCase());
	}

	public abstract execute(msg: Message, args: Args): Promise<Message | Message[] | void>;
}
