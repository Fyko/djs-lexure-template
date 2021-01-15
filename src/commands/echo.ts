import { Message, Permissions } from 'discord.js';
import { Args, joinTokens } from 'lexure';
import Command from '../core/Command';

export default class extends Command {
	public constructor() {
		super('echo', {
			aliases: ['echo'],
		});
	}

	public execute = (msg: Message, args: Args): Promise<Message | Message[] | void> => {
		if (!msg.member?.permissions.has(Permissions.FLAGS.ADMINISTRATOR))
			return msg.channel.send("Sorry lad! You're not allowed to run that command.");
		return msg.channel.send(joinTokens(args.many()));
	};
}
