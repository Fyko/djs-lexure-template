import { Client, Collection, Message } from 'discord.js';
import { scan } from 'fs-nextra';
import { Args, extractCommand, Lexer, longStrategy, Parser, Token } from 'lexure';
import { extname } from 'path';
import type Command from './Command';

export type PrefixSupplier = (msg: Message) => string | string[] | Promise<string> | Promise<string[]>;

export type Prefix = string | string[] | PrefixSupplier;

export interface CommandHandlerOptions {
	dir: string;
	prefix: Prefix;
}

export default class CommandHandler {
	public readonly commands = new Collection<string, Command>();
	public constructor(protected readonly client: Client, public readonly options: CommandHandlerOptions) {}

	private async walk() {
		const files = await scan(this.options.dir, { filter: (stats) => stats.isFile() && extname(stats.name) === '.js' });
		return files.keys();
	}

	public async loadAll(): Promise<Collection<string, Command>> {
		const files = await this.walk();

		for (const file of files) {
			const _raw = await import(file);
			const imported = 'default' in _raw ? _raw.default : _raw;
			const command: Command = new imported();
			command.client = this.client;

			// verify there are no duplicate aliases
			for (const alias of command.options.aliases) {
				const conflicting = this.commands.find((c) => c.options.aliases.includes(alias));
				if (conflicting) throw Error(`Alias '${alias}' already exists on command '${conflicting.id}'`);
			}

			this.commands.set(command.id, command);
		}

		return this.commands;
	}

	public async prefix(msg?: Message): Promise<string | string[]> {
		if (typeof this.options.prefix === 'function' && typeof msg !== 'undefined') {
			return this.options.prefix(msg);
		}
		return this.options.prefix as string | string[];
	}

	private extractCommand(tokens: Token[], prefix: string | string[]): Token[] {
		return (Array.isArray(prefix) ? prefix : [prefix]).reduce((acc, p) => {
			const cmd = extractCommand((s) => (s.startsWith(p) ? p.length : null), tokens);
			return cmd ? acc.concat(cmd) : acc;
		}, [] as Token[]);
	}

	public async handle(msg: Message): Promise<void> {
		const lexer = new Lexer(msg.content).setQuotes([
			['"', '"'],
			['“', '”'],
		]);

		const prefix = await this.prefix(msg);

		const tokens = lexer.lex();
		const extracted = this.extractCommand(tokens, prefix);
		if (!extracted.length) return;
		const commands = this.commands.filter((m) =>
			m.options.aliases.some((a) => extracted.some((e) => e.value.toLowerCase() === a.toLowerCase())),
		);

		const command = commands.first();
		if (!command) return;

		const parser = new Parser(tokens).setUnorderedStrategy(longStrategy());
		const res = parser.parse();
		const args = new Args(res);

		try {
			await command.execute(msg, args);
		} catch (err) {
			console.error(`[COMMAND ERROR]: ${err}`);
		}
	}
}
